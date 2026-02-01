import React from 'react';
import { X, User, Phone, Mail, MapPin, BookOpen } from 'lucide-react';

const TeacherDetailModal = ({ isOpen, onClose, teacher }) => {
    if (!isOpen || !teacher) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                    <h3 className="text-2xl font-semibold text-gray-900">Teacher Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Teacher ID</p>
                                <p className="font-semibold text-gray-900">{teacher.teacher_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-semibold text-gray-900">{teacher.personal_details?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-semibold text-gray-900">{teacher.personal_details?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-semibold text-gray-900">{teacher.personal_details?.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Gender</p>
                                <p className="font-semibold text-gray-900">{teacher.personal_details?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date of Birth</p>
                                <p className="font-semibold text-gray-900">{teacher.personal_details?.date_of_birth || 'N/A'}</p>
                            </div>
                            <div className="flex items-start gap-2 col-span-2">
                                <MapPin size={16} className="text-gray-500 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-semibold text-gray-900">{teacher.personal_details?.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Classes */}
                    <div className="border border-gray-200 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen size={20} />
                            Assigned Classes ({teacher.assigned_classes?.length || 0})
                        </h4>
                        {teacher.assigned_classes && teacher.assigned_classes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {teacher.assigned_classes.map((ac, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    Class {ac.class}-{ac.section}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">{ac.subject}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <BookOpen size={20} className="text-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No classes assigned</p>
                        )}
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-900">
                                {teacher.assigned_classes?.length || 0}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">Classes</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-900">
                                {teacher.homework_assigned?.length || 0}
                            </p>
                            <p className="text-sm text-green-600 mt-1">Homework</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-purple-900">
                                {teacher.created_at ? new Date(teacher.created_at).getFullYear() : 'N/A'}
                            </p>
                            <p className="text-sm text-purple-600 mt-1">Joined</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherDetailModal;
