import React, { useState, useEffect } from 'react';
import {
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import leaveService from '../services/leaveService';
import { useAlert } from '../hooks/useAlert';
import { format } from 'date-fns';

const LeaveManagementPage = () => {
    const [balances, setBalances] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError, showSuccess } = useAlert();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balanceRes, leaveRes] = await Promise.all([
                leaveService.getMyBalances(),
                leaveService.getMyLeaves()
            ]);
            setBalances(balanceRes.data || []);
            setLeaves(leaveRes.data || []);
        } catch (error) {
            showError('Failed to load leave data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected':
            case 'rejected_by_manager': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending_manager':
            case 'pending_hr': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await leaveService.cancelLeave(id);
            showSuccess('Leave request cancelled');
            fetchData();
        } catch (error) {
            showError(error.message || 'Failed to cancel leave');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Leave Management</h1>
                        <p className="text-indigo-100 mt-2 font-medium">Track your time off and manage your leave balance</p>
                    </div>
                    <Link
                        to="/apply-leave"
                        className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-all transform hover:-translate-y-1"
                    >
                        <PlusIcon className="h-5 w-5 mr-2 stroke-[3]" />
                        Apply for Leave
                    </Link>
                </div>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {balances.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{b.leave_type_name}</span>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-gray-900">{b.remaining}</span>
                            <span className="text-sm text-gray-400 font-medium">Days Remaining</span>
                        </div>
                        <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(b.remaining / b.total_allocated) * 100}%` }}
                            ></div>
                        </div>
                        <div className="mt-3 flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                            <span>Quota: {b.total_allocated}</span>
                            <span>Used: {b.used}</span>
                        </div>
                    </div>
                ))}
                {balances.length === 0 && (
                    <div className="col-span-full bg-indigo-50/50 rounded-2xl p-8 text-center border-2 border-dashed border-indigo-100">
                        <p className="text-indigo-600 font-bold italic">No leave balances allocated yet.</p>
                    </div>
                )}
            </div>

            {/* Leave History */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Leave History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Leave Info</th>
                                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</th>
                                <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {leaves.map((leave) => (
                                <tr key={leave.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{leave.reason || 'No reason provided'}</span>
                                            <span className="text-[10px] text-gray-400 font-mono mt-1 uppercase">{leave.application_no}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">
                                                {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-xs text-indigo-600 font-medium">{leave.total_days} Working Days</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(leave.status)}`}>
                                                {leave.status.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {(leave.status === 'pending_manager' || leave.status === 'pending_hr') && (
                                            <button 
                                                onClick={() => handleCancel(leave.id)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {leaves.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-gray-500 font-medium">
                                        You haven't applied for any leaves yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveManagementPage;
