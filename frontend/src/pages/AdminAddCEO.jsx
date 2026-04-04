import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    UserIcon,
    EnvelopeIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    IdentificationIcon,
    KeyIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
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

const AdminAddCEO = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        cnic: '',
        department: 'Management',
        designation: 'CEO',
        shift_type: 'morning'
    });
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    useEffect(() => {
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
                department: u.department || 'Management',
                designation: u.designation || 'CEO',
                shift_type: u.shift_type || 'morning'
            });
        } catch (error) {
            showError('Failed to load CEO details');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await adminService.updateUser(id, formData);
                showSuccess(`CEO account updated successfully!`);
            } else {
                await adminService.createCEO(formData);
                showSuccess(`CEO account created successfully!`);
            }
            navigate('/admin/ceos');
        } catch (error) {
            showError(error.message || `Failed to ${isEdit ? 'update' : 'create'} CEO account`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-24">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-xl">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                            {isEdit ? 'Edit' : 'Add New'} CEO
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {isEdit ? 'Update CEO account details' : 'Create a CEO account with full organizational visibility'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="Full Name"
                                icon={UserIcon}
                                name="name"
                                placeholder="CEO Name"
                                value={formData.name}
                                onChange={handleChange}
                            />

                            <FormInput
                                label="Email Address"
                                icon={EnvelopeIcon}
                                name="email"
                                type="email"
                                placeholder="ceo@company.com"
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
                                placeholder="Management"
                                value={formData.department}
                                onChange={handleChange}
                            />

                            <div className="md:col-span-2">
                                <FormInput
                                    label="Designation"
                                    icon={BriefcaseIcon}
                                    name="designation"
                                    placeholder="CEO"
                                    value={formData.designation}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="md:col-span-2 relative group mt-2">
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
                                    <option value="morning">Morning Shift (9AM - 6PM)</option>
                                    <option value="night">Night Shift (8PM - 5AM)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-premium group w-full py-4"
                        >
                            <div className="btn-shimmer"></div>
                            <span className="relative z-10">
                                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update CEO Account' : 'Create CEO Account')}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminAddCEO;
