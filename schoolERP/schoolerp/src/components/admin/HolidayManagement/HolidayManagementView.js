import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Plus, 
    Trash2, 
    Info, 
    AlertCircle, 
    CheckCircle2,
    CalendarDays,
    Clock,
    Tag,
    Search,
    Filter
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const HolidayManagementView = () => {
    const { user } = useSelector((state) => state.auth);
    const adminId = user?.admin_id || user?.id || 'ADMIN-001';
    
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        type: 'National',
        description: ''
    });

    useEffect(() => {
        fetchHolidays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/${adminId}/holidays`);
            setHolidays(res.data);
        } catch (err) {
            console.error('Error fetching holidays:', err);
            showNotice('Failed to fetch holidays', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotice = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/${adminId}/holidays`, formData);
            showNotice('Holiday added successfully');
            setShowAddModal(false);
            setFormData({ name: '', start_date: '', end_date: '', type: 'National', description: '' });
            fetchHolidays();
        } catch (err) {
            showNotice(err.response?.data?.message || 'Error adding holiday', 'error');
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/${adminId}/holidays/${id}`);
            showNotice('Holiday deleted successfully');
            fetchHolidays();
        } catch (err) {
            showNotice('Error deleting holiday', 'error');
        }
    };

    const holidayTypes = ['National', 'Festival', 'Cultural', 'Academic', 'Custom'];
    
    const filteredHolidays = holidays.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || h.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeColor = (type) => {
        switch (type) {
            case 'National': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Festival': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Cultural': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Academic': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-0">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 ${
                    notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                    {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Holiday Management</h1>
                    <p className="text-slate-500 mt-1">Manage school holidays, festivals, and academic breaks.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 font-medium"
                >
                    <Plus size={20} />
                    Add New Holiday
                </button>
            </div>

            {/* Quick Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 flex-shrink-0">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider uppercase mb-1">Total Holidays</h3>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{holidays.length}</p>
                        <p className="text-xs text-slate-400 mt-1 italic">Excluding Sundays (automatic)</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 col-span-2">
                    <div className="bg-amber-50 p-3 rounded-xl text-amber-600 flex-shrink-0">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">How it works</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Sundays are automatically marked as holidays across the ERP. For other holidays, festivals, or range-based breaks (like Summer/Winter vacations), add them here to ensure accurate attendance statistics.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters and List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search holidays..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Filter size={18} className="text-slate-400" />
                        <select 
                            className="flex-1 sm:w-48 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="All">All Types</option>
                            {holidayTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Loading holidays...</p>
                        </div>
                    ) : filteredHolidays.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                            <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                                <Calendar size={48} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">No Holidays Found</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-1 line-clamp-2">
                                    {searchQuery || filterType !== 'All' 
                                        ? 'No holidays match your search criteria.' 
                                        : 'Start by adding your first school holiday or festival.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Holiday Name</th>
                                    <th className="px-6 py-4">Date Range</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic">
                                {filteredHolidays.map((holiday) => {
                                    const start = new Date(holiday.start_date);
                                    const end = new Date(holiday.end_date);
                                    const isRange = holiday.start_date !== holiday.end_date;
                                    const isUpcoming = start > new Date();

                                    return (
                                        <tr key={holiday._id} className="hover:bg-slate-50/50 transition-colors group not-italic">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{holiday.name}</span>
                                                    {holiday.description && (
                                                        <span className="text-xs text-slate-400 line-clamp-1">{holiday.description}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 text-sm">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {isRange ? (
                                                        <span>
                                                            {start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    ) : (
                                                        <span>{start.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getTypeColor(holiday.type)}`}>
                                                    {holiday.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${isUpcoming ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isUpcoming ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                                    {isUpcoming ? 'Upcoming' : 'Past'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteHoliday(holiday._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Delete Holiday"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Holiday Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="bg-indigo-600 p-6 text-white text-center">
                            <h2 className="text-xl font-bold">Add New Holiday</h2>
                            <p className="text-indigo-100 text-sm mt-1">Configure a new date or range as a holiday.</p>
                        </div>
                        
                        <form onSubmit={handleAddHoliday} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                                    <Tag size={14} className="text-indigo-500" /> Holiday Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., Independence Day"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-1">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 ml-1">Holiday Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {holidayTypes.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, type})}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                formData.type === type 
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 ml-1 font-black">Description (Optional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add notes about this holiday..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none text-sm"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all uppercase tracking-wider text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest text-xs"
                                >
                                    Confirm Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagementView;
