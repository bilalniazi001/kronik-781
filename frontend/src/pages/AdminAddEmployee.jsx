import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    UserIcon,
    EnvelopeIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    UsersIcon,
    CalendarDaysIcon,
    PhoneIcon,
    IdentificationIcon,
    KeyIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import hrService from '../services/hrService';
import adminService from '../services/adminService';
import { useAlert } from '../hooks/useAlert';

const FormInput = ({ label, icon: Icon, name, type = 'text', placeholder, value, onChange }) => (
    <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-indigo-500 transition-all duration-300" />
        </div>
        <input
            type={type}
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            required
            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 
                 rounded-xl text-gray-900 placeholder-transparent focus:outline-none 
                 focus:border-indigo-600 focus:bg-white 
                 transition-all duration-300 peer"
            placeholder={placeholder}
        />
        <label
            htmlFor={name}
            className="absolute left-11 -top-2.5 bg-white px-1 text-sm font-medium text-gray-400 
                 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600
                 pointer-events-none rounded-md"
        >
            {label}
        </label>
    </div>
);

const AdminAddEmployee = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        cnic: '',
        department: '',
        designation: '',
        manager_id: '',
        reporting_to: '',
        role_type: 'employee',
        shift_type: 'morning'
    });
    const [leaveQuota, setLeaveQuota] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    useEffect(() => {
        fetchMetadata();
        if (isEdit) {
            fetchUserData();
        }
    }, [id]);

    const fetchUserData = async () => {
        try {
            const res = await adminService.getUserDetails(id);
            const u = res.user;
            setFormData({
                name: u.name || '',
                email: u.email || '',
                phone: u.phone || '',
                cnic: u.cnic || '',
                department: u.department || '',
                designation: u.designation || '',
                manager_id: u.manager_id || '',
                reporting_to: u.reporting_to || '',
                role_type: u.role_type || 'employee',
                shift_type: u.shift_type || 'morning',
                status: u.status || 'active'
            });
            // Quota pre-filling would need more backend support or a separate call
        } catch (error) {
            showError('Failed to load employee data');
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [managersRes, typesRes] = await Promise.all([
                hrService.getManagers(),
                hrService.getLeaveTypes()
            ]);
            setManagers(managersRes.data);
            setLeaveQuota(typesRes.data.map(t => ({
                leave_type_id: t.id,
                name: t.name,
                allocated: 0
            })));
        } catch (error) {
            showError('Failed to load managers or leave types');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleManagerChange = (e) => {
        const managerId = e.target.value;
        const manager = managers.find(m => m.id === parseInt(managerId));
        setFormData({
            ...formData,
            manager_id: managerId,
            reporting_to: manager ? manager.name : ''
        });
    };

    const handleQuotaChange = (id, value) => {
        setLeaveQuota(leaveQuota.map(q =>
            q.leave_type_id === id ? { ...q, allocated: parseInt(value) || 0 } : q
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, leave_quota: leaveQuota };
            if (isEdit) {
                await adminService.updateUser(id, payload);
                showSuccess(`Employee updated successfully!`);
            } else {
                await hrService.createEmployee(payload);
                showSuccess(`Employee created successfully!`);
            }
            navigate('/admin/employees');
        } catch (error) {
            showError(error.message || `Failed to ${isEdit ? 'update' : 'create'} employee`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-24 pb-12">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-xl">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                            {isEdit ? 'Edit' : 'Add New'} Employee
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {isEdit ? 'Update employee details' : 'Join Attendly - Your intelligent attendance partner'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="Full Name"
                                icon={UserIcon}
                                name="name"
                                placeholder="Employee Name"
                                value={formData.name}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="Email Address"
                                icon={EnvelopeIcon}
                                name="email"
                                type="email"
                                placeholder="employee@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />

                            {!isEdit && (
                                <FormInput
                                    label="Initial Password"
                                    icon={KeyIcon}
                                    name="password"
                                    type="password"
                                    placeholder="Set password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            )}

                            <FormInput
                                label="Phone Number"
                                icon={PhoneIcon}
                                name="phone"
                                placeholder="03001234567"
                                value={formData.phone}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="CNIC Number"
                                icon={IdentificationIcon}
                                name="cnic"
                                placeholder="12345-1234567-1"
                                value={formData.cnic}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="Department"
                                icon={BuildingOfficeIcon}
                                name="department"
                                placeholder="e.g. IT, Sales"
                                value={formData.department}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="Designation"
                                icon={BriefcaseIcon}
                                name="designation"
                                placeholder="e.g. Software Engineer"
                                value={formData.designation}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <UsersIcon className="h-5 w-5 text-indigo-500" />
                                </div>
                                <select
                                    name="role_type"
                                    value={formData.role_type}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 
                               rounded-xl text-gray-700 focus:outline-none focus:border-indigo-600 transition-all font-medium"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="tl">Team Lead</option>
                                    <option value="atl">Assistant Team Lead</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <ClockIcon className="h-5 w-5 text-indigo-500" />
                                </div>
                                <select
                                    name="shift_type"
                                    value={formData.shift_type}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 
                               rounded-xl text-gray-700 focus:outline-none focus:border-indigo-600 transition-all font-medium"
                                >
                                    <option value="morning">Morning (9AM-6PM)</option>
                                    <option value="night">Night (8PM-5AM)</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <UsersIcon className="h-5 w-5 text-indigo-500" />
                            </div>
                            <select
                                name="manager_id"
                                value={formData.manager_id}
                                onChange={handleManagerChange}
                                required
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 
                           rounded-xl text-gray-700 focus:outline-none focus:border-indigo-600 transition-all font-medium"
                            >
                                <option value="">Select Reporting Manager / GM</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role_type?.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Annual Leave Quota Allocation</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 ml-11">
                                Set the number of allowed leave days for this employee per year.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-11">
                                {leaveQuota.length > 0 ? (
                                    leaveQuota.map(q => (
                                        <div key={q.leave_type_id} className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <CalendarDaysIcon className="h-5 w-5 text-indigo-500 transition-all duration-300" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                id={`quota_${q.leave_type_id}`}
                                                value={q.allocated}
                                                onChange={(e) => handleQuotaChange(q.leave_type_id, e.target.value)}
                                                required
                                                className="no-spinner block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 
                                                     rounded-xl text-gray-900 placeholder-transparent focus:outline-none 
                                                     focus:border-indigo-600 focus:bg-white 
                                                     transition-all duration-300 peer"
                                                placeholder={`Enter ${q.name} days`}
                                            />
                                            <label
                                                htmlFor={`quota_${q.leave_type_id}`}
                                                className="absolute left-11 -top-2.5 bg-white px-1 text-sm font-medium text-gray-400 
                                                     transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
                                                     peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600
                                                     pointer-events-none rounded-md"
                                            >
                                                {q.name} (Yearly)
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center bg-gray-800/20 rounded-2xl border border-dashed border-gray-700">
                                        <p className="text-gray-500 italic">No leave types found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-premium group w-full py-4 mt-6"
                        >
                            <div className="btn-shimmer"></div>
                            <span className="relative z-10">
                                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Employee' : 'Create Employee Account')}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminAddEmployee;
