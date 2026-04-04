import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import attendanceService from '../services/attendanceService';
import { MapPinIcon, ClockIcon, CalendarDaysIcon, ArrowLeftOnRectangleIcon, LockClosedIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const { user, isCEO } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [attendance, setAttendance] = useState({
    checked_in: false,
    checked_out: false,
    check_in_time: null,
    check_out_time: null,
    check_in_location: null,
    check_out_location: null,
    hours_worked: null
  });
  const [stats, setStats] = useState({
    attendance_days: 0,
    leave_days: 0,
    absent_days: 0,
    incomplete_days: 0,
    weekly_hours: '0h 0m',
    weekly_extra_hours: '0h 0m',
    weekly_minutes: 0
  });
  const [approvedBreaks, setApprovedBreaks] = useState([]);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [history, setHistory] = useState([]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance + stats from backend on page load
  const fetchData = useCallback(async () => {
    try {
      setPageLoading(true);
      const [todayRes, statsRes] = await Promise.all([
        attendanceService.getTodayStatus(),
        attendanceService.getStats()
      ]);

      if (todayRes.success && todayRes.data) {
        const sanitizedHours = (todayRes.data.hours_worked === 'NaN:NaN' || !todayRes.data.hours_worked) ? null : todayRes.data.hours_worked;
        setAttendance({
          checked_in: todayRes.data.checked_in || false,
          checked_out: todayRes.data.checked_out || false,
          check_in_time: todayRes.data.check_in_time || null,
          check_out_time: todayRes.data.check_out_time || null,
          check_in_location: todayRes.data.check_in_location || null,
          check_out_location: todayRes.data.check_out_location || null,
          hours_worked: sanitizedHours
        });
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
        if (statsRes.stats.history) {
            setHistory(statsRes.stats.history);
        }
      }

      // Fetch today's approved breaks
      const breakRes = await api.get('/breaks/my-requests');
      if (breakRes.data.success) {
          const today = new Date().toISOString().split('T')[0];
          const todayBreaks = breakRes.data.data.filter(b => b.date.startsWith(today) && b.status === 'approved');
          setApprovedBreaks(todayBreaks);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            let message = 'Failed to get location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'Please enable location to check in/out';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                message = 'Location request timeout';
                break;
            }
            reject(new Error(message));
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:-- --';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getGoogleMapsUrl = (locationStr) => {
    if (!locationStr) return null;
    const parts = locationStr.split(',');
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return `https://www.google.com/maps?q=${parts[0].trim()},${parts[1].trim()}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(locationStr)}`;
  };

  const handleCheckIn = async (e) => {
    if (e) e.preventDefault();

    // Check if day is complete logic has been removed to allow multiple check-ins

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const response = await attendanceService.checkIn({
        latitude: location.latitude,
        longitude: location.longitude
      });
      if (response.success) {
        setAttendance({
          ...attendance,
          checked_in: true,
          check_in_time: response.data.check_in_time,
          check_in_location: response.data.location,
          check_out_time: null,
          check_out_location: null,
          hours_worked: null
        });
        showSuccess(response.message || 'Check-In Successful!');
      }
    } catch (error) {
      showError(error?.message || 'Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (breakId = null) => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const response = await attendanceService.checkOut({
        latitude: location.latitude,
        longitude: location.longitude,
        break_id: breakId
      });
      if (response.success) {
        showSuccess(breakId ? 'Break started successfully' : 'Checked out successfully');
        fetchData();
      }
    } catch (error) {
      showError(error?.message || 'Check-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLocationLink = (locationStr, label) => {
    if (!locationStr) return <span className="text-gray-400">Not recorded</span>;
    const mapsUrl = getGoogleMapsUrl(locationStr);
    const displayName = locationStr.length > 50 ? locationStr.substring(0, 50) + '...' : locationStr;
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors group"
        title={`Open ${label} location in Google Maps\n${locationStr}`}
      >
        <MapPinIcon className="w-4 h-4 flex-shrink-0 group-hover:text-red-500 transition-colors" />
        <span className="text-sm">{displayName}</span>
      </a>
    );
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-indigo-100 mt-1">{format(currentTime, 'EEEE, MMMM do yyyy')}</p>
            <p className="text-indigo-100 text-2xl font-semibold mt-2 font-mono">
              {format(currentTime, 'h:mm:ss a')}
            </p>
          </div>
          {user?.profile_image && (
            <img
              src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${user.profile_image}`}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      </div>

      {!isCEO && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent Days</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.absent_days}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowLeftOnRectangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Weekly Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.weekly_hours}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-indigo-400 font-medium mt-2">Mon - Sun</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Extra Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.weekly_extra_hours}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-teal-400 font-medium mt-2">This week's OT</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Leave Days</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.leave_days || 0}</p>
                  <span className="text-xs text-purple-600 font-semibold px-2 py-0.5 bg-purple-50 rounded-full">Approved</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50">
              {stats.recent_leaves && stats.recent_leaves.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_leaves.map((leave, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-600 font-medium truncate w-24"> {leave.leave_type} </span>
                      <span className="text-purple-600 font-bold">
                        {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'dd')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic">No approved leaves this month</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isCEO && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-primary">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/apply-leave"
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1 transition-all duration-300"
            >
              <CalendarDaysIcon className="w-6 h-6" />
              <div className="text-left">
                <p className="text-sm font-bold">Apply for Leave</p>
                <p className="text-[10px] text-indigo-100 font-medium">Request time off from work</p>
              </div>
            </Link>

            {user?.userType !== 'admin' && (
              <Link
                to="/apply-break"
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-1 transition-all duration-300"
              >
                <ClockIcon className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-sm font-bold">Request Break</p>
                  <p className="text-[10px] text-orange-100 font-medium">Apply for a short break</p>
                </div>
              </Link>
            )}

            <Link
              to="/reports"
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all duration-300"
            >
              <ClockIcon className="w-6 h-6" />
              <div className="text-left">
                <p className="text-sm font-bold">View Reports</p>
                <p className="text-[10px] text-gray-400 font-medium">Check your attendance history</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {!isCEO && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Attendance</h2>

          {/* Check-in / Check-out details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 font-medium">Check In</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatTime(attendance.check_in_time)}
              </p>
              {attendance.check_in_location && (
                <div className="mt-2">
                  {renderLocationLink(attendance.check_in_location, 'Check-In')}
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1 font-medium">Check Out</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatTime(attendance.check_out_time)}
              </p>
              {attendance.check_out_location && (
                <div className="mt-2">
                  {renderLocationLink(attendance.check_out_location, 'Check-Out')}
                </div>
              )}
            </div>
          </div>


          {/* Check-in/out Buttons */}
          <div className="flex flex-col items-center justify-center py-6">
            {user?.userType === 'admin' ? (
              <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 w-full max-w-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockClosedIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Restricted Access</h3>
                <p className="text-gray-500 mt-2">
                  Attendance tracking is only available for regular employee accounts.
                </p>
              </div>
            ) : !attendance.checked_in ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="relative w-44 h-44 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 
                           text-white font-bold text-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50
                           transform hover:scale-105 hover:-translate-y-1 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex flex-col items-center justify-center overflow-hidden group"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <span>CHECK IN</span>
                )}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => handleCheckOut()}
                  disabled={loading}
                  className="relative w-44 h-44 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600
                             text-white font-bold text-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50
                             transform hover:scale-105 hover:-translate-y-1 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex flex-col items-center justify-center overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-[100%] group-hover:translate-y-[-100%] transition-transform duration-700 ease-in-out"></div>
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white relative z-10"></div>
                  ) : (
                    <span className="relative z-10 font-bold">CHECK OUT</span>
                  )}
                </button>

                {approvedBreaks.length > 0 && (
                  <button
                    onClick={() => setShowBreakModal(true)}
                    disabled={loading}
                    className="px-6 py-2 bg-orange-100 text-orange-700 font-bold rounded-full hover:bg-orange-200 transition-colors flex items-center gap-2"
                  >
                    <ClockIcon className="w-5 h-5" />
                    TAKE BREAK
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Session History - only completed sessions with valid hours */}
          {history.filter(s => s.check_out_time && s.hours_worked && !String(s.hours_worked).includes('NaN')).length > 0 && (
              <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Today's Sessions</h3>
                  <div className="space-y-2">
                      {history
                          .filter(s => s.check_out_time && s.hours_worked && !String(s.hours_worked).includes('NaN'))
                          .map((sess, idx) => (
                              <div key={idx} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <ClockIcon className="w-4 h-4 text-indigo-500" />
                                          <span className="font-semibold text-gray-800 text-sm">
                                              {formatTime(sess.check_in_time)} - {formatTime(sess.check_out_time)}
                                          </span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5">{sess.break_id ? '☕ Break Session' : '💼 Working Session'}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-bold text-indigo-600">{sess.hours_worked}</p>
                                      {sess.extra_hours && sess.extra_hours !== '00:00' && !String(sess.extra_hours).includes('NaN') && (
                                          <p className="text-[10px] text-purple-500">+{sess.extra_hours} OT</p>
                                      )}
                                  </div>
                              </div>
                          ))}
                  </div>
              </div>
          )}
        </div>
      )}

        {/* Break Selection Modal */}
        {showBreakModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Select Approved Break</h3>
                    <div className="space-y-2 mb-6">
                        {approvedBreaks.map(b => (
                            <button
                                key={b.id}
                                onClick={() => {
                                    handleCheckOut(b.id);
                                    setShowBreakModal(false);
                                }}
                                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                            >
                                <p className="font-bold text-gray-900 group-hover:text-indigo-600">{b.duration_hours}h Break</p>
                                <p className="text-sm text-gray-500">{b.reason}</p>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowBreakModal(false)}
                        className="w-full py-2 text-gray-500 font-medium hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default HomePage;