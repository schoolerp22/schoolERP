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
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {viewTitles[currentView] || 'Admin Dashboard'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
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
