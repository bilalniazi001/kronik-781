import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const TeamSummaryTable = ({ summaryList, loading, onViewReport, showPersonalDetails = false }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f8faff]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Info</th>
                            {showPersonalDetails && (
                                <>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {summaryList.map((emp) => (
                            <tr key={emp.user_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900">{emp.employee_name}</div>
                                            <div className="text-xs text-gray-500 font-medium">{emp.designation || 'Staff'}</div>
                                        </div>
                                    </div>
                                </td>
                                {showPersonalDetails && (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-900 font-medium">{emp.email}</div>
                                            <div className="text-[10px] text-gray-500">{emp.phone || 'No Phone'}</div>
                                            <div className="text-[10px] text-gray-400">{emp.cnic || 'No CNIC'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 font-medium">{emp.department || '-'}</span>
                                        </td>
                                    </>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="flex flex-col items-center px-3 py-1 bg-green-50 rounded-lg border border-green-100 min-w-[60px]">
                                            <span className="text-xs font-bold text-green-700">{emp.present_days}</span>
                                            <span className="text-[9px] text-green-600 uppercase font-bold">Present</span>
                                        </div>
                                        <div className="flex flex-col items-center px-3 py-1 bg-red-50 rounded-lg border border-red-100 min-w-[60px]">
                                            <span className="text-xs font-bold text-red-700">{emp.absent_days}</span>
                                            <span className="text-[9px] text-red-600 uppercase font-bold">Absent</span>
                                        </div>
                                        <div className="flex flex-col items-center px-3 py-1 bg-orange-50 rounded-lg border border-orange-100 min-w-[60px]">
                                            <span className="text-xs font-bold text-orange-700">{emp.leave_days || 0}</span>
                                            <span className="text-[9px] text-orange-600 uppercase font-bold">Leave</span>
                                        </div>
                                        <div className="flex flex-col items-center px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-100 min-w-[60px]">
                                            <span className="text-xs font-bold text-yellow-700">{emp.incomplete_days}</span>
                                            <span className="text-[9px] text-yellow-600 uppercase font-bold">Incomplete</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onViewReport(emp)}
                                        className="btn-primary-premium !py-1.5 !px-4 text-xs"
                                    >
                                        <div className="btn-shimmer"></div>
                                        <span className="relative z-10">View Report</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {summaryList.length === 0 && (
                            <tr>
                                <td colSpan={showPersonalDetails ? 5 : 3} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center text-gray-400">
                                        <UserIcon className="h-12 w-12 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No team members found for this period.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamSummaryTable;
