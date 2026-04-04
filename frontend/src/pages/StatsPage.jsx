import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
    CalendarDaysIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowLeftOnRectangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const StatsPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [myBreaks, setMyBreaks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [statsRes, balRes, leavesRes, breaksRes] = await Promise.all([
                    api.get('/attendances/stats'),
                    api.get('/leaves/my-balances').catch(() => ({ data: { success: false } })),
                    api.get('/leaves/my-leaves').catch(() => ({ data: { success: false } })),
                    api.get('/breaks/my-requests').catch(() => ({ data: { success: false } })),
                ]);
                if (statsRes.data.success) setStats(statsRes.data.stats);
                if (balRes.data.success) setLeaveBalances(balRes.data.data || []);
                if (leavesRes.data.success) setMyLeaves(leavesRes.data.data || []);
                if (breaksRes.data.success) setMyBreaks(breaksRes.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statusBadge = (status) => {
        const map = {
            approved: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            rejected: 'bg-red-100 text-red-700',
            pending_manager: 'bg-yellow-100 text-yellow-700',
            approved_by_manager: 'bg-blue-100 text-blue-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[status] || 'bg-gray-100 text-gray-700'}`}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">My Stats</h1>
                </div>
                <p className="text-indigo-100 text-sm">Your complete attendance & leave overview for this month</p>
            </div>

            {/* Attendance Stats */}
            {stats && (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Attendance This Month</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-400">
                            <p className="text-sm text-gray-500">Absent Days</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.absent_days}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-400">
                            <p className="text-sm text-gray-500">Leave Days</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.leave_days || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-indigo-400">
                            <p className="text-sm text-gray-500">Weekly Hours</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.weekly_hours}</p>
                            <p className="text-xs text-gray-400">Mon - Sun</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-teal-400">
                            <p className="text-sm text-gray-500">Extra Hours</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.weekly_extra_hours}</p>
                            <p className="text-xs text-gray-400">Overtime this week</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Balances */}
            {leaveBalances.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">🏖️ Leave Balances</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {leaveBalances.map((bal) => {
                            const pct = bal.total_days > 0
                                ? Math.round(((bal.total_days - (bal.used_days || 0)) / bal.total_days) * 100)
                                : 0;
                            return (
                                <div key={bal.leave_type_id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">{bal.leave_type_name}</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-3xl font-bold text-indigo-600">{bal.total_days - (bal.used_days || 0)}</span>
                                        <span className="text-sm text-gray-400 mb-1">/ {bal.total_days}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Remaining</p>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-indigo-500 h-1.5 rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Leave Applications */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">📋 My Leave Applications</h2>
                {myLeaves.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">No leave applications found</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Days</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {myLeaves.map((lv) => (
                                        <tr key={lv.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-gray-800">{lv.leave_type || 'Leave'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">
                                                {new Date(lv.start_date).toLocaleDateString()} → {new Date(lv.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-bold text-indigo-600">{lv.total_days}d</td>
                                            <td className="px-5 py-3">{statusBadge(lv.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* My Break Requests */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">☕ My Break Requests</h2>
                {myBreaks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">No break requests found</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-orange-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {myBreaks.map((br) => (
                                        <tr key={br.id} className="hover:bg-orange-50/30">
                                            <td className="px-5 py-3 text-sm text-gray-700">{new Date(br.date).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm font-bold text-orange-600">{br.duration_hours}h</td>
                                            <td className="px-5 py-3 text-sm text-gray-500 max-w-[200px] truncate">{br.reason}</td>
                                            <td className="px-5 py-3">{statusBadge(br.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsPage;
