import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import PublicRoute from './PublicRoute'
import Loader from '../components/common/Loader'

// Auth Pages (Keep critical pages static or lazy, let's lazy load all pages for uniform code splitting)
const LoginPage = React.lazy(() => import('../pages/LoginPage'))
const AdminLoginPage = React.lazy(() => import('../pages/AdminLoginPage'))

// User Pages
const HomePage = React.lazy(() => import('../pages/HomePage'))
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'))
const ReportsPage = React.lazy(() => import('../pages/ReportsPage'))
const AnnouncementsPage = React.lazy(() => import('../pages/AnnouncementsPage'))
const ApplyLeavePage = React.lazy(() => import('../pages/ApplyLeavePage'))
const LeaveApprovalPage = React.lazy(() => import('../pages/LeaveApprovalPage'))
const OrganizationTreePage = React.lazy(() => import('../pages/OrganizationTreePage'))
const LeaveManagementPage = React.lazy(() => import('../pages/LeaveManagementPage'))
const ApplyBreakPage = React.lazy(() => import('../pages/ApplyBreakPage'))
const StatsPage = React.lazy(() => import('../pages/StatsPage'))

// Admin Pages
const AdminPanelPage = React.lazy(() => import('../pages/AdminPanelPage'))
const AdminUsersPage = React.lazy(() => import('../pages/AdminUsersPage'))
const AdminAdminsPage = React.lazy(() => import('../pages/AdminAdminsPage'))
const AdminReportsPage = React.lazy(() => import('../pages/AdminReportsPage'))
const AdminAttendancePage = React.lazy(() => import('../pages/AdminAttendancePage'))
const AdminAnnouncementsPage = React.lazy(() => import('../pages/AdminAnnouncementsPage'))
const AdminAddTeamLead = React.lazy(() => import('../pages/AdminAddTeamLead'))
const AdminAddEmployee = React.lazy(() => import('../pages/AdminAddEmployee'))
const AdminAddHR = React.lazy(() => import('../pages/AdminAddHR'))
const AdminCEOListPage = React.lazy(() => import('../pages/AdminCEOListPage'))
const AdminAddCEO = React.lazy(() => import('../pages/AdminAddCEO'))
const AdminHRListPage = React.lazy(() => import('../pages/AdminHRListPage'))
const AdminTeamLeadListPage = React.lazy(() => import('../pages/AdminTeamLeadListPage'))
const AdminEmployeeListPage = React.lazy(() => import('../pages/AdminEmployeeListPage'))
const AdminGMListPage = React.lazy(() => import('../pages/AdminGMListPage'))
const AdminAddGM = React.lazy(() => import('../pages/AdminAddGM'))
const AdminACMListPage = React.lazy(() => import('../pages/AdminACMListPage'))
const AdminAddACM = React.lazy(() => import('../pages/AdminAddACM'))
const AdminATLListPage = React.lazy(() => import('../pages/AdminATLListPage'))
const AdminAddATL = React.lazy(() => import('../pages/AdminAddATL'))
const ShiftManagementPage = React.lazy(() => import('../pages/ShiftManagementPage'))
const WeeklyHolidaysPage = React.lazy(() => import('../pages/WeeklyHolidaysPage'))

// Other Pages
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'))
const UnauthorizedPage = React.lazy(() => import('../pages/UnauthorizedPage'))
const HolidayCalendarPage = React.lazy(() => import('../pages/HolidayCalendarPage'))

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin/login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />

        {/* User Protected Routes */}
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/announcements" element={<PrivateRoute><AnnouncementsPage /></PrivateRoute>} />
        <Route path="/apply-leave" element={<PrivateRoute><ApplyLeavePage /></PrivateRoute>} />
        <Route path="/leave-approvals" element={<PrivateRoute><LeaveApprovalPage /></PrivateRoute>} />
        <Route path="/leave-management" element={<PrivateRoute><LeaveManagementPage /></PrivateRoute>} />
        <Route path="/hierarchy" element={<PrivateRoute><OrganizationTreePage /></PrivateRoute>} />
        <Route path="/apply-break" element={<PrivateRoute><ApplyBreakPage /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/ceos" element={<AdminRoute><AdminCEOListPage /></AdminRoute>} />
        <Route path="/admin/gms" element={<AdminRoute><AdminGMListPage /></AdminRoute>} />
        <Route path="/admin/acms" element={<AdminRoute><AdminACMListPage /></AdminRoute>} />
        <Route path="/admin/hr" element={<AdminRoute><AdminHRListPage /></AdminRoute>} />
        <Route path="/admin/team-leads" element={<AdminRoute><AdminTeamLeadListPage /></AdminRoute>} />
        <Route path="/admin/atls" element={<AdminRoute><AdminATLListPage /></AdminRoute>} />
        <Route path="/admin/employees" element={<AdminRoute><AdminEmployeeListPage /></AdminRoute>} />
        <Route path="/admin/admins" element={<AdminRoute><AdminAdminsPage /></AdminRoute>} />
        <Route path="/admin/attendance" element={<AdminRoute><AdminAttendancePage /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
        <Route path="/admin/holidays" element={<AdminRoute><HolidayCalendarPage /></AdminRoute>} />
        <Route path="/admin/add-team-lead" element={<AdminRoute><AdminAddTeamLead /></AdminRoute>} />
        <Route path="/admin/add-hr" element={<AdminRoute><AdminAddHR /></AdminRoute>} />
        <Route path="/admin/add-ceo" element={<AdminRoute><AdminAddCEO /></AdminRoute>} />
        <Route path="/admin/add-employee" element={<AdminRoute><AdminAddEmployee /></AdminRoute>} />
        <Route path="/admin/add-gm" element={<AdminRoute><AdminAddGM /></AdminRoute>} />
        <Route path="/admin/add-acm" element={<AdminRoute><AdminAddACM /></AdminRoute>} />
        <Route path="/admin/add-atl" element={<AdminRoute><AdminAddATL /></AdminRoute>} />

        <Route path="/admin/edit-ceo/:id" element={<AdminRoute><AdminAddCEO /></AdminRoute>} />
        <Route path="/admin/edit-hr/:id" element={<AdminRoute><AdminAddHR /></AdminRoute>} />
        <Route path="/admin/edit-team-lead/:id" element={<AdminRoute><AdminAddTeamLead /></AdminRoute>} />
        <Route path="/admin/edit-employee/:id" element={<AdminRoute><AdminAddEmployee /></AdminRoute>} />
        <Route path="/admin/edit-gm/:id" element={<AdminRoute><AdminAddGM /></AdminRoute>} />
        <Route path="/admin/edit-acm/:id" element={<AdminRoute><AdminAddACM /></AdminRoute>} />
        <Route path="/admin/edit-atl/:id" element={<AdminRoute><AdminAddATL /></AdminRoute>} />
        <Route path="/admin/shifts" element={<AdminRoute><ShiftManagementPage /></AdminRoute>} />
        <Route path="/admin/weekly-holidays" element={<AdminRoute><WeeklyHolidaysPage /></AdminRoute>} />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes