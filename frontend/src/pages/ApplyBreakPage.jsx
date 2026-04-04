import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../hooks/useAlert';
import { ClockIcon } from '@heroicons/react/24/outline';

const ApplyBreakPage = () => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        duration_hours: '1',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError } = useAlert();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.post('/breaks/apply', formData);
            if (response.data.success) {
                showSuccess('Break request submitted successfully!');
                navigate('/');
            }
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Request Break</h2>
                    <p className="mt-2 text-gray-500">Need a short break during your shift?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Break Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={formData.duration_hours}
                            onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        >
                            <option value="0.5">30 Minutes</option>
                            <option value="1">1 Hour</option>
                            <option value="1.5">1.5 Hours</option>
                            <option value="2">2 Hours</option>
                            <option value="3">3 Hours</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <textarea
                            required
                            rows="3"
                            placeholder="Why do you need this break?"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Break Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApplyBreakPage;
