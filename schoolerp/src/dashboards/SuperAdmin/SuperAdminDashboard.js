import React, { useState } from 'react';
import { 
  Users, School, BookOpen, DollarSign, BarChart3, 
  Settings, Shield, Headphones, Menu, X,
  ChevronDown, Bell, Search, LogOut
} from 'lucide-react';

// Mock Redux state management (you'll replace this with actual Redux Toolkit)
const useMockStore = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  return { currentView, setCurrentView };
};

const SuperAdminDashboard = () => {
  const { currentView, setCurrentView } = useMockStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-blue-500' },
    { id: 'users', icon: Users, label: 'User Management', color: 'text-purple-500' },
    { id: 'schools', icon: School, label: 'School Management', color: 'text-green-500' },
    { id: 'academic', icon: BookOpen, label: 'Academic Control', color: 'text-orange-500' },
    { id: 'finance', icon: DollarSign, label: 'Finance & Fees', color: 'text-emerald-500' },
    { id: 'reports', icon: BarChart3, label: 'Reports & Analytics', color: 'text-cyan-500' },
    { id: 'security', icon: Shield, label: 'Security & Compliance', color: 'text-red-500' },
    { id: 'settings', icon: Settings, label: 'System Configuration', color: 'text-gray-500' },
    { id: 'support', icon: Headphones, label: 'Support & Issues', color: 'text-yellow-500' },
  ];

  const stats = [
    { label: 'Total Schools', value: '156', change: '+12%', color: 'bg-blue-500' },
    { label: 'Active Students', value: '45,231', change: '+8%', color: 'bg-green-500' },
    { label: 'Teachers', value: '3,421', change: '+5%', color: 'bg-purple-500' },
    { label: 'Parents', value: '38,902', change: '+7%', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo & Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen && <h1 className="text-xl font-bold">SchoolERP</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-gray-800 text-white' 
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              <item.icon size={20} className={item.color} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
              SA
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">Super Admin</p>
                <p className="text-xs text-gray-400">admin@schoolerp.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search schools, users, reports..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-6">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    SA
                  </div>
                  <ChevronDown size={16} className="text-gray-600" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                      <Settings size={16} />
                      <span className="text-sm">Settings</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600">
                      <LogOut size={16} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening across your ERP system.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <p className="text-green-600 text-sm mt-2">{stat.change} from last month</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-10`}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New school registered', school: 'St. Mary\'s High School', time: '2 hours ago', type: 'success' },
                    { action: 'Fee payment processed', school: 'Delhi Public School', time: '4 hours ago', type: 'info' },
                    { action: 'Teacher account activated', school: 'Modern Academy', time: '6 hours ago', type: 'success' },
                    { action: 'System maintenance scheduled', school: 'System-wide', time: '1 day ago', type: 'warning' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' : 
                          activity.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.school}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <p className="text-gray-600 mt-1">Manage all users across the platform</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Users size={16} />
                  Add User
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-2">
                  {['All Users', 'School Admins', 'Teachers', 'Students', 'Parents'].map((tab) => (
                    <button key={tab} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100">
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-6">
                  <p className="text-gray-600">User management interface will be displayed here...</p>
                </div>
              </div>
            </div>
          )}

          {currentView === 'schools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">School Management</h2>
                  <p className="text-gray-600 mt-1">Monitor and manage all registered schools</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <School size={16} />
                  Add School
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">School management interface will be displayed here...</p>
              </div>
            </div>
          )}

          {/* Add similar sections for other views */}
          {!['dashboard', 'users', 'schools'].includes(currentView) && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">{currentView.replace('_', ' ')}</h2>
                <p className="text-gray-600 mt-1">This section is under development</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Content coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;