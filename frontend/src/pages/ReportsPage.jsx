import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import ReportFilters from '../components/reports/ReportFilters';
import ReportTable from '../components/reports/ReportTable';
import TeamSummaryTable from '../components/reports/TeamSummaryTable';
import PdfDownloadButton from '../components/reports/PdfDownloadButton';
import { useReport } from '../hooks/useReport';
import attendanceService from '../services/attendanceService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ReportsPage = () => {
  const { user, isCEO } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const { reports, loading, fetchReports, exportPDF } = useReport(false);

  const [activeTab, setActiveTab] = useState(user?.role_type === 'ceo' ? 'team' : 'my');
  const [teamSummary, setTeamSummary] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [teamMemberReports, setTeamMemberReports] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const loadReports = useCallback(async () => {
    if (activeTab === 'my') {
      await fetchReports(
        dateRange.startDate.toISOString().split('T')[0],
        dateRange.endDate.toISOString().split('T')[0]
      );
    } else if (activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') {
      if (selectedTeamMember) {
        setTeamLoading(true);
        try {
          const res = await attendanceService.getTeamMemberReport(
            selectedTeamMember.user_id,
            dateRange.startDate.toISOString().split('T')[0],
            dateRange.endDate.toISOString().split('T')[0]
          );
          setTeamMemberReports(res.data || []);
        } catch (error) {
          console.error('Failed to load team member report', error);
        } finally {
          setTeamLoading(false);
        }
      } else {
        setTeamLoading(true);
        try {
          const res = await attendanceService.getTeamSummary(
            dateRange.startDate.toISOString().split('T')[0],
            dateRange.endDate.toISOString().split('T')[0],
            activeTab === 'managers' ? 'managers' : (activeTab === 'hr' ? 'hr' : 'employees')
          );
          setTeamSummary(res.data || []);
        } catch (error) {
          console.error('Failed to load team summary', error);
        } finally {
          setTeamLoading(false);
        }
      }
    }
  }, [dateRange, fetchReports, activeTab, selectedTeamMember]);

  useEffect(() => {
    if (isCEO && activeTab === 'my') {
      setActiveTab('team');
    }
    loadReports();
  }, [loadReports, isCEO, activeTab]);

  const handleDateChange = (start, end) => {
    setDateRange({ startDate: start, endDate: end });
  };

  const handleExportPDF = () => {
    const dataToExport = (activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') ? (selectedTeamMember ? teamMemberReports : null) : reports;
    if ((activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') && !selectedTeamMember) {
      alert("Please select a specific person to download their detailed attendance report.");
      return;
    }
    exportPDF(user, {
      start: dateRange.startDate.toLocaleDateString(),
      end: dateRange.endDate.toLocaleDateString()
    }, (activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') ? dataToExport : null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'team' || tab === 'managers' || tab === 'hr') {
      setSelectedTeamMember(null);
      setTeamMemberReports([]);
    }
  };

  const showTabs = user?.role_type === 'manager' || user?.role_type === 'hr' || user?.role_type === 'ceo' || user?.userType === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-1">View and download attendance records</p>
        </div>
        <PdfDownloadButton onClick={handleExportPDF} />
      </div>

      {showTabs && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {!isCEO && (
              <button
                onClick={() => handleTabChange('my')}
                className={`${activeTab === 'my'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-none font-medium text-sm transition-all duration-300 focus:outline-none`}
                style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
              >
                My Reports
              </button>
            )}
            <button
              onClick={() => handleTabChange('team')}
              className={`${activeTab === 'team'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold'
                : 'text-gray-500 hover:text-gray-700'
                } whitespace-nowrap py-4 px-1 border-none font-medium text-sm transition-all duration-300 focus:outline-none`}
              style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
            >
              Employee Reports
            </button>
            {(user?.role_type === 'hr' || user?.userType === 'admin' || user?.role_type === 'ceo') && (
              <button
                onClick={() => handleTabChange('managers')}
                className={`${activeTab === 'managers'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-none font-medium text-sm transition-all duration-300 focus:outline-none`}
                style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
              >
                Manager Reports
              </button>
            )}
            {(user?.role_type === 'ceo' || user?.userType === 'admin') && (
              <button
                onClick={() => handleTabChange('hr')}
                className={`${activeTab === 'hr'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-none font-medium text-sm transition-all duration-300 focus:outline-none`}
                style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
              >
                HR Reports
              </button>
            )}
          </nav>
        </div>
      )}

      <ReportFilters
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onDateChange={handleDateChange}
      />

      <div className="bg-white rounded-xl shadow-md p-6">
        {(activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') && selectedTeamMember ? (
          <div className="mb-4 space-y-4">
            <button
              onClick={() => setSelectedTeamMember(null)}
              className="group btn-primary-premium flex items-center gap-2 mb-4 focus:outline-none"
              style={{ outline: 'none' }}
            >
              <div className="btn-shimmer"></div>
              <ArrowLeftIcon className="w-4 h-4" />
              Back to List
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Detailed Report for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold">{selectedTeamMember.employee_name}</span> ({dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()})
            </h2>
            <ReportTable
              reports={teamMemberReports}
              loading={teamLoading}
              isTeamReport={false}
            />
          </div>
        ) : (activeTab === 'team' || activeTab === 'managers' || activeTab === 'hr') && !selectedTeamMember ? (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {activeTab === 'managers' ? 'Managers' : (activeTab === 'hr' ? 'HR' : 'Employee')} Summary for {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
            </h2>
            <TeamSummaryTable
              summaryList={teamSummary}
              loading={teamLoading}
              onViewReport={(emp) => setSelectedTeamMember(emp)}
              showPersonalDetails={true}
            />
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Reports for {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
            </h2>
            <ReportTable
              reports={reports}
              loading={loading}
              isTeamReport={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;