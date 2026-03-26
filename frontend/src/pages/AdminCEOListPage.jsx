import React, { useState, useEffect, useCallback } from 'react';
import { useAlert } from '../hooks/useAlert';
import adminService from '../services/adminService';
import UserTable from '../components/admin/UserTable';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const AdminCEOListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getCEOs(
                pagination.currentPage,
                pagination.limit,
                search
            );
            setUsers(response.users || []);
            setPagination(prev => ({
                ...prev,
                totalPages: Math.ceil(response.pagination.total_records / prev.limit),
                totalRecords: response.pagination.total_records
            }));
        } catch (error) {
            showError('Failed to fetch CEO accounts');
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.limit, search, showError]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleView = (user) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleEdit = (user) => {
        console.log('Edit CEO:', user);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this CEO account?')) return;

        try {
            await adminService.deleteUser(userId);
            showSuccess('CEO account deactivated successfully');
            fetchUsers();
        } catch (error) {
            showError('Failed to delete CEO');
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CEO Management</h1>
                    <p className="text-gray-600 mt-1">View and manage CEO accounts</p>
                </div>
                <button
                    onClick={() => navigate('/admin/add-ceo')}
                    className="btn-primary-premium group flex items-center"
                >
                    <div className="btn-shimmer"></div>
                    <PlusIcon className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Add New CEO</span>
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <>
                    <UserTable
                        users={users}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="btn-primary-premium group !py-1 !px-4 text-sm disabled:opacity-50 disabled:transform-none"
                                >
                                    <div className="btn-shimmer"></div>
                                    <span className="relative z-10">Previous</span>
                                </button>
                                <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium">
                                    {pagination.currentPage} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="btn-primary-premium group !py-1 !px-4 text-sm disabled:opacity-50 disabled:transform-none"
                                >
                                    <div className="btn-shimmer"></div>
                                    <span className="relative z-10">Next</span>
                                </button>
                            </nav>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="CEO Account Details"
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            {selectedUser.profile_image ? (
                                <img
                                    src={selectedUser.profile_image}
                                    alt={selectedUser.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xl font-bold text-indigo-600">
                                        {selectedUser.name?.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                <span className="inline-block px-2 py-0.5 mt-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                    CEO
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Department</p>
                                <p className="font-medium text-gray-900">{selectedUser.department || 'Management'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Designation</p>
                                <p className="font-medium text-gray-900">{selectedUser.designation || 'CEO'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone</p>
                                <p className="font-medium text-gray-900">{selectedUser.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">CNIC</p>
                                <p className="font-medium text-gray-900">{selectedUser.cnic || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminCEOListPage;
