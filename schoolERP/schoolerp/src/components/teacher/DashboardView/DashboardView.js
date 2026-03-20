import React from 'react';
import {
  Users, Calendar, BookOpen, Clock,
  FileText, Bell, TrendingUp, ArrowRight,
  MoreVertical, CheckCircle
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { markSelfAttendance, getDashboardStats } from '../../../feature/teachers/teacherSlice';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';

const DashboardView = ({
  profile,
  dashboardStats,
  onViewChange,
  announcements,
  homework,
  attendanceSummary,
  attendanceRange,
  setAttendanceRange,
  loadings
}) => {
  const dispatch = useDispatch();
  const teacherName = profile?.personal_details?.name?.split(' ')[0] || "Teacher";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const stats = [
    {
      title: "Total Students",
      value: dashboardStats?.totalStudents || 0,
      icon: Users,
      color: "from-indigo-500 to-blue-600",
      shadow: "shadow-indigo-100"
    },
    {
      title: "Pending Leaves",
      value: dashboardStats?.pendingLeaves || 0,
      icon: Calendar,
      color: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-100"
    },
    {
      title: "Active Homework",
      value: dashboardStats?.activeHomework || 0,
      icon: BookOpen,
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-100"
    },
    {
      title: "Today's Attendance",
      value: `${dashboardStats?.attendanceMarked || 0}%`,
      icon: Clock,
      color: "from-fuchsia-500 to-purple-600",
      shadow: "shadow-fuchsia-100"
    },
    {
      title: "Assigned Classes",
      value: dashboardStats?.assignedClasses || 0,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-100"
    },
  ];

  const attendanceData = attendanceSummary?.student_stats?.length > 0 ?
    attendanceSummary.student_stats.map(s => ({
      day: s.name.split(' ')[0],
      percentage: s.percentage
    })) : [
      { day: 'Mon', percentage: 0 },
      { day: 'Tue', percentage: 0 },
      { day: 'Wed', percentage: 0 },
      { day: 'Thu', percentage: 0 },
      { day: 'Fri', percentage: 0 },
    ];

  // If we have actual daily data in attendanceSummary, we can use that instead.
  // For now, let's look for distribution or fallback to stats.

  const quickActions = [
    {
      label: 'Mark Attendance',
      icon: Calendar,
      view: 'attendance',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-white/20'
    },
    {
      label: 'Assign Homework',
      icon: BookOpen,
      view: 'homework',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20'
    },
    {
      label: 'Create Announcement',
      icon: Bell,
      view: 'announcements',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/20'
    },
    {
      label: 'Review Leaves',
      icon: FileText,
      view: 'leaves',
      gradient: 'from-pink-500 to-rose-600',
      iconBg: 'bg-white/20'
    },
  ];

  const displayAnnouncements = announcements?.slice(0, 3) || [];

  const displayHomework = homework?.filter(hw => {
    const dueDate = new Date(hw.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate >= today;
  }).slice(0, 3) || [];

  const handleQuickCheckIn = async () => {
    try {
      await dispatch(markSelfAttendance({
        teacherId: profile.teacher_id,
        attendanceData: {
          date: new Date().toISOString().split('T')[0],
          status: 'Present',
          reason: 'Dashboard Quick Check-in'
        }
      })).unwrap();
      dispatch(getDashboardStats(profile.teacher_id));
    } catch (err) {
      console.error("Failed to mark attendance via dashboard", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 md:p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {getGreeting()}, {teacherName}
              </h1>
              <p className="text-indigo-100 font-medium text-lg opacity-90">
                Managing {dashboardStats?.totalStudents || 0} students across {dashboardStats?.assignedClasses || 0} assigned classes.
              </p>
            </div>
            
            {/* My Attendance Status Badge */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">My Attendance</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    dashboardStats?.selfAttendanceStatus === 'Present' ? 'bg-emerald-400' : 
                    dashboardStats?.selfAttendanceStatus === 'Absent' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                  }`}></div>
                  <span className="font-bold text-sm tracking-tight">
                    {dashboardStats?.selfAttendanceStatus || 'Pending'}
                  </span>
                </div>
              </div>
              {dashboardStats?.selfAttendanceStatus === 'Pending' && (
                <button
                  onClick={handleQuickCheckIn}
                  className="ml-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                  Mark Present
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => onViewChange('class-chat')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold shadow-xl shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-all text-sm"
          >
            Open Class Chat
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl shrink-0"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl shrink-0"></div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white p-6 rounded-3xl shadow-md shadow-slate-200/50 border border-slate-200 border-l-4 ${stat.color.replace('from-', 'border-')} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg ${stat.shadow} transition-colors group-hover:scale-110 duration-300`}>
                <stat.icon size={24} />
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <MoreVertical size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Recommended Actions</h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">4 Actions Available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onViewChange(action.view)}
              className={`group flex items-center justify-between p-6 rounded-[28px] bg-gradient-to-br ${action.gradient} text-white shadow-lg shadow-indigo-100/50 hover:-translate-y-1 hover:shadow-2xl active:scale-95 transition-all duration-300 text-left`}
            >
              <div className="flex items-center gap-4">
                <div className={`${action.iconBg} p-4 rounded-2xl shadow-inner`}>
                  <action.icon size={28} />
                </div>
                <div>
                  <p className="font-black text-lg leading-tight">{action.label}</p>
                  <p className="text-xs text-white/70 mt-1 font-medium italic">Manage now</p>
                </div>
              </div>
              <div className="bg-white/20 p-2 rounded-xl group-hover:translate-x-1 transition-transform">
                <ArrowRight size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Insights & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Attendance Insight Widget */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800">Attendance Overview</h3>
              <p className="text-sm text-slate-500 font-medium">Student attendance status and daily participation overview</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['weekly', 'monthly'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAttendanceRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${attendanceRange === r
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>

          <div className="h-[300px] w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div style={{ minWidth: attendanceData.length > 10 ? `${attendanceData.length * 60}px` : '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 8, 8]} barSize={32}>
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#c7d2fe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side Column: Homework & Notifications */}
        <div className="space-y-8">

          {/* Active Homework Widget */}
          <div className="bg-white p-6 rounded-[32px] shadow-md shadow-slate-200/50 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800">Active Homework</h3>
              <button onClick={() => onViewChange('homework')} className="text-indigo-600 p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {displayHomework.length > 0 ? displayHomework.map(hw => (
                <div 
                  key={hw._id || hw.id} 
                  onClick={() => onViewChange('homework')}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${hw.status === 'Active' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{hw.topic || hw.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due {new Date(hw.due_date || hw.due).toLocaleDateString()}</p>
                        <span className="text-slate-300">•</span>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">
                          {hw.submissionCount || 0}/{hw.totalStudents || 0} Submitted
                        </p>
                      </div>
                    </div>
                  </div>
                  <CheckCircle size={18} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                </div>
              )) : (
                <p className="text-center text-slate-400 text-sm py-4 italic">No active homework tasks</p>
              )}
            </div>
          </div>

          {/* Announcements Widget */}
          <div className="bg-[#fffbeb] p-6 rounded-[32px] border border-amber-100 shadow-md shadow-amber-200/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Bell size={20} className="text-amber-600" />
                Announcements
              </h3>
              <span className="text-[10px] font-black text-amber-700 bg-white/50 px-2 py-1 rounded-lg uppercase">New</span>
            </div>
            <div className="space-y-5">
              {displayAnnouncements.length > 0 ? displayAnnouncements.map(ann => (
                <div 
                  key={ann._id || ann.id} 
                  onClick={() => onViewChange('announcements')}
                  className="flex gap-4 p-2 -m-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors group"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${ann.type === 'Urgent' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-snug group-hover:text-indigo-600 transition-colors">{ann.title || ann.message}</p>
                    <p className="text-[10px] text-amber-700/60 font-bold mt-1 tracking-tight">{new Date(ann.created_at || ann.date).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-amber-700/60 text-sm py-4 italic">No recent updates</p>
              )}
            </div>
            <button
              onClick={() => onViewChange('announcements')}
              className="w-full mt-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/10"
            >
              View All Announcements
            </button>
          </div>

        </div>

      </div>

      {/* Spacing for mobile visibility */}
      <div className="h-20 md:hidden"></div>

    </div>
  );
};

export default DashboardView;
