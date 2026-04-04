import React, { useState, useEffect, useCallback } from 'react';
import { useAlert } from '../hooks/useAlert';
import shiftService from '../services/shiftService';
import adminService from '../services/adminService';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { 
    ClockIcon, 
    PlusIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    UserPlusIcon,
    AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';

const ShiftManagementPage = () => {
    const [shifts, setShifts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', start_time: '', end_time: '' });
    const { showSuccess, showError } = useAlert();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [shiftsRes, usersRes] = await Promise.all([
                shiftService.getAllShifts(),
                adminService.getUsers(1, 1000)
            ]);
            
            setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
            setUsers(Array.isArray(usersRes.users) ? usersRes.users : []);
        } catch (err) {
            console.error('Fetch error:', err);
            showError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedShift) {
                await shiftService.updateShift(selectedShift.id, formData);
                showSuccess('Shift updated successfully');
            } else {
                await shiftService.createShift(formData);
                showSuccess('Shift created successfully');
            }
            setModalOpen(false);
            fetchData();
        } catch (err) {
            showError('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this shift?')) return;
        try {
            await shiftService.deleteShift(id);
            showSuccess('Shift deleted');
            fetchData();
        } catch (err) {
            showError('Failed to delete');
        }
    };

    const handleAssign = async (userId, shiftId) => {
        try {
            await shiftService.assignShift(userId, shiftId);
            showSuccess('Shift assigned successfully');
            setAssignModalOpen(false);
            fetchData();
        } catch (err) {
            showError('Assignment failed');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                    <p className="text-gray-600 mt-1">Configure company shifts and assign them to employees</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedShift(null);
                        setFormData({ name: '', start_time: '', end_time: '' });
                        setModalOpen(true);
                    }}
                    className="btn-primary-premium flex items-center"
                >
                    <div className="btn-shimmer"></div>
                    <PlusIcon className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Add New Shift</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shifts List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800 flex items-center">
                            <ClockIcon className="w-5 h-5 mr-2 text-indigo-600" />
                            Defined Shifts
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timings</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {shifts.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => {
                                                    setSelectedShift(s);
                                                    setFormData({ name: s.name, start_time: s.start_time, end_time: s.end_time });
                                                    setModalOpen(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Assignment View */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800 flex items-center">
                            <UserPlusIcon className="w-5 h-5 mr-2 text-indigo-600" />
                            User Shift Assignment
                        </h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Shift</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {users.filter(u => u.role !== 'admin').map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.designation}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${u.shift_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {shifts.find(s => s.id === u.shift_id)?.name || 'Not Assigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button 
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setAssignModalOpen(true);
                                                }}
                                                className="btn-primary-premium py-1 px-3 text-xs"
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Shift Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedShift ? 'Edit Shift' : 'New Shift'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                        <input
                            type="text"
                            required
                            className="input-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Day Shift"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                required
                                className="input-primary"
                                value={formData.start_time}
                                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                className="input-primary"
                                value={formData.end_time}
                                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary-premium flex items-center">
                            <div className="btn-shimmer"></div>
                            <span className="relative z-10">{selectedShift ? 'Update Shift' : 'Create Shift'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assign Modal */}
            <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Shift to ${selectedUser?.name}`}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {shifts.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleAssign(selectedUser.id, s.id)}
                                className={`p-4 text-left border rounded-xl hover:border-indigo-600 transition-all ${selectedUser?.shift_id === s.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                            >
                                <div className="font-bold text-gray-900">{s.name}</div>
                                <div className="text-sm text-gray-500">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ShiftManagementPage;
