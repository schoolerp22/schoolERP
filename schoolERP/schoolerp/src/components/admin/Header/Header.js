import React from 'react';
import { Bell } from 'lucide-react';

const Header = ({ currentView }) => {
    const viewTitles = {
        dashboard: 'Dashboard',
        teachers: 'Teacher Management',
        students: 'Student Management',
        reports: 'Reports & Analytics',
        analytics: 'Advanced Analytics',
    };

    return (
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                        {viewTitles[currentView] || 'Admin Dashboard'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                        School Administration Panel
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                        <Bell size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
