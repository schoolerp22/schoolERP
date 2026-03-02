import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents } from "../../../feature/accounting/accountingSlice";
import { Search} from "lucide-react";

const StudentListView = () => {
    const dispatch = useDispatch();
    const { students, isLoading } = useSelector((state) => state.accounting);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        dispatch(getStudents({})); // Fetch initial list
    }, [dispatch]);

    const handleSearch = (e) => {
        e.preventDefault();
        dispatch(getStudents({ search: searchTerm }));
    };

    return (
        <div className="accountant-dashboard-view">
            <div className="accountant-header-container">
                <h2 className="accountant-page-title">Student Directory (Accounts)</h2>
            </div>

            <div className="accountant-card mb-6">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Name or Admission No."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Search size={18} /> Search
                    </button>
                </form>
            </div>

            <div className="accountant-card">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading students...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                    <th className="p-4 font-semibold text-sm">Admission No</th>
                                    <th className="p-4 font-semibold text-sm">Student Name</th>
                                    <th className="p-4 font-semibold text-sm">Class & Sec</th>
                                    <th className="p-4 font-semibold text-sm">Father Name</th>
                                    <th className="p-4 font-semibold text-sm">Contact</th>
                                    <th className="p-4 font-semibold text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? (
                                    students.map(student => (
                                        <tr key={student.admission_no} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-medium text-blue-600">{student.admission_no}</td>
                                            <td className="p-4 font-medium text-gray-900">{student.name}</td>
                                            <td className="p-4 text-gray-600">{student.class_name} ({student.section})</td>
                                            <td className="p-4 text-gray-600">{student.father_name || 'N/A'}</td>
                                            <td className="p-4 text-gray-600">{student.contact_no}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {student.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            No students found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentListView;
