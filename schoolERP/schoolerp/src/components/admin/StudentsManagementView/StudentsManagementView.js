import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, X } from 'lucide-react';

const StudentsManagementView = ({
    students,
    pagination,
    loading,
    onAdd,
    onEdit,
    onDelete,
    onView,
    onSearch,
    onPageChange,
    onFilterChange,
    onSortChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        class: '',
        section: '',
        year: ''
    });
    const [sortBy, setSortBy] = useState('');

    // Extract unique values for dropdowns
    const uniqueClasses = [...new Set(students?.map(s => s.class).filter(Boolean))].sort();
    const uniqueSections = [...new Set(students?.map(s => s.section).filter(Boolean))].sort();
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        onSearch(e.target.value);
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        if (onSortChange) {
            onSortChange(value);
        }
    };

    const clearFilters = () => {
        setFilters({ class: '', section: '', year: '' });
        setSortBy('');
        if (onFilterChange) {
            onFilterChange({ class: '', section: '', year: '' });
        }
        if (onSortChange) {
            onSortChange('');
        }
    };

    const activeFiltersCount = Object.values(filters).filter(v => v).length + (sortBy ? 1 : 0);

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-wrap">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters || activeFiltersCount > 0
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={20} />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={onAdd}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Class Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Class
                                </label>
                                <select
                                    value={filters.class}
                                    onChange={(e) => handleFilterChange('class', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Classes</option>
                                    {uniqueClasses.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Section Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section
                                </label>
                                <select
                                    value={filters.section}
                                    onChange={(e) => handleFilterChange('section', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Sections</option>
                                    {uniqueSections.map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Academic Year
                                </label>
                                <select
                                    value={filters.year}
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Years</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Default</option>
                                    <option value="roll_asc">Roll No (Low to High)</option>
                                    <option value="roll_desc">Roll No (High to Low)</option>
                                    <option value="admission_asc">Admission No (A to Z)</option>
                                    <option value="admission_desc">Admission No (Z to A)</option>
                                    <option value="name_asc">Name (A to Z)</option>
                                    <option value="name_desc">Name (Z to A)</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    disabled={activeFiltersCount === 0}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <X size={16} />
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {students && students.length > 0 ? (
                                students.map((student) => (
                                    <div key={student.admission_no} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {`${student.personal_details?.first_name || ''} ${student.personal_details?.last_name || ''}`.trim() || 'N/A'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Admission: {student.admission_no} • Roll No: {student.roll_no || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    Class {student.class}-{student.section}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    House: {student.house || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                onClick={() => onView(student)}
                                                className="flex-1 py-2 px-3 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => onEdit(student)}
                                                className="flex-1 py-2 px-3 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(student)}
                                                className="flex-1 py-2 px-3 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    No students found
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students && students.length > 0 ? (
                                        students.map((student) => (
                                            <tr key={student.admission_no} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {student.admission_no}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {`${student.personal_details?.first_name || ''} ${student.personal_details?.last_name || ''}`.trim() || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {student.class}-{student.section}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {student.roll_no || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {student.house || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onView(student)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onEdit(student)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(student)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600 text-center sm:text-left">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} students
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => onPageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => onPageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StudentsManagementView;