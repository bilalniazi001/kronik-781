import React, { useState, useEffect } from 'react';
import { CalendarIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import settingsService from '../../services/settingsService';
import { useAlert } from '../../hooks/useAlert';

const WeeklyHolidaySettings = () => {
    const [weeklyHolidays, setWeeklyHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useAlert();

    const days = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await settingsService.getSetting('weekly_holidays');
            if (res.success && Array.isArray(res.value)) {
                setWeeklyHolidays(res.value);
            }
        } catch (error) {
            showError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day) => {
        if (weeklyHolidays.includes(day)) {
            setWeeklyHolidays(weeklyHolidays.filter(d => d !== day));
        } else {
            setWeeklyHolidays([...weeklyHolidays, day]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsService.updateSetting('weekly_holidays', weeklyHolidays);
            showSuccess('Weekly holidays updated successfully');
        } catch (error) {
            showError(error.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-blue-100 shadow-lg">
                        <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Weekly Holidays</h3>
                        <p className="text-xs text-gray-500 font-medium">Select days to mark as recurring holidays</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {days.map((day) => {
                        const isSelected = weeklyHolidays.includes(day);
                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                                    isSelected 
                                    ? 'border-blue-600 bg-blue-50/30' 
                                    : 'border-gray-100 bg-white hover:border-blue-200'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-400'
                                }`}>
                                    {isSelected ? <CheckCircleIcon className="h-6 w-6" /> : <span className="font-bold text-xs">{day[0]}</span>}
                                </div>
                                <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {day}
                                </span>
                                {isSelected && (
                                    <div className="absolute -top-1.5 -right-1.5">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        <strong>Important:</strong> Changing weekly holidays will automatically affect the logic for "Absent" marking in attendance reports and "Net Days" calculation for future leave applications. 
                        Records that have already been generated will NOT be changed retroactively.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WeeklyHolidaySettings;
