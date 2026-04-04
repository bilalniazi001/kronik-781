import React, { useState, useEffect } from 'react';
import { useAlert } from '../hooks/useAlert';
import settingsService from '../services/settingsService';
import Loader from '../components/common/Loader';
import { CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const WeeklyHolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useAlert();

    const daysOfWeek = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await settingsService.getWeeklyHolidays();
                setHolidays(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                showError('Failed to load holidays');
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, [showError]);

    const handleToggle = async (day) => {
        const newHolidays = holidays.includes(day)
            ? holidays.filter(d => d !== day)
            : [...holidays, day];
        
        setHolidays(newHolidays);

        try {
            await settingsService.updateWeeklyHolidays(newHolidays);
            showSuccess(`${day} ${holidays.includes(day) ? 'removed from' : 'added to'} holidays`);
        } catch (err) {
            showError('Failed to update settings');
            // Revert state on failure
            setHolidays(holidays);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CalendarIcon className="w-8 h-8 mr-3 text-indigo-600" />
                        Weekly Holiday Configuration
                    </h1>
                    <p className="text-gray-600 mt-1">Select the days that will be considered company weekly holidays.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daysOfWeek.map((day) => (
                        <div 
                            key={day}
                            onClick={() => handleToggle(day)}
                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                                holidays.includes(day) 
                                ? 'border-indigo-600 bg-indigo-50/50' 
                                : 'border-gray-100 hover:border-indigo-200 bg-gray-50/30'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                                    holidays.includes(day) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                }`}>
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <span className={`text-lg font-semibold ${
                                    holidays.includes(day) ? 'text-indigo-900' : 'text-gray-700'
                                }`}>{day}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                holidays.includes(day) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                            }`}>
                                {holidays.includes(day) && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start">
                    <ShieldCheckIcon className="w-8 h-8 text-amber-600 mr-4 flex-shrink-0" />
                    <div>
                        <h3 className="text-amber-900 font-bold mb-1">Company Rules Enforcement</h3>
                        <p className="text-amber-800 text-sm opacity-90 leading-relaxed">
                            Once a day is marked as a weekly holiday, all check-in/checkout functionality will be 
                            systemically disabled for all employees and managers on those days. 
                            Attendance reports will automatically mark these days as <span className="font-bold">Holiday</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyHolidaysPage;
