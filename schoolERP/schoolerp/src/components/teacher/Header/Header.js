import React, { useState, useEffect } from 'react';
import { Bell, Search, Calendar, ChevronDown, User, Home, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = ({ profile, currentView, selectedClass, onClassChange, leaveRequests }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const teacherName = profile?.personal_details?.name?.split(' ')[0] || "Teacher";

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:px-8 md:py-4 sticky top-0 z-30 shadow-sm shadow-slate-200/20 transition-all duration-300">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        
        {/* Left Side: Greeting & Breadcrumbs */}
        <div className="hidden lg:flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            <Home size={12} className="text-gray-300" />
            <span>Portal</span>
            <ChevronRight size={10} />
            <span className="text-indigo-500">{currentView.replace('-', ' ')}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-indigo-600">{getGreeting()}, {teacherName}</span>
            <motion.span 
              animate={{ rotate: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
            >👋</motion.span>
          </h2>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md relative group hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search students, results, or files..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-2xl bg-slate-50/50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner shadow-slate-200/30"
          />
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-3 md:gap-6 ml-auto lg:ml-0">
          
            {profile.assigned_classes && profile.assigned_classes.length > 0 && (
              <div className="relative group">
                <select
                  value={selectedClass}
                  onChange={(e) => onClassChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs md:text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:bg-white shadow-sm shadow-slate-200/30"
                >
                  {profile.assigned_classes.map(ac => {
                    const hasSection = ac.section && ac.section !== 'undefined';
                    const value = hasSection ? `${ac.class}-${ac.section}` : `${ac.class}`;
                    const label = hasSection ? `${ac.class}-${ac.section}` : `${ac.class}`;
                    return (
                      <option key={value} value={value}>
                        Class {label} ({ac.subject})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            <button className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 text-slate-500 rounded-xl transition-all relative group shadow-sm shadow-slate-200/30">
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              {(leaveRequests && leaveRequests.length > 0) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {/* Calendar Display */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold shadow-sm shadow-slate-200/20">
              <Calendar size={14} className="text-indigo-500" />
              <span>{formatDate(currentTime)}</span>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-200 hidden sm:block">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden font-bold text-indigo-600 text-sm">
                   {profile?.personal_details?.name ? profile.personal_details.name.split(' ').map(n => n[0]).join('') : <User size={20} />}
                </div>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;