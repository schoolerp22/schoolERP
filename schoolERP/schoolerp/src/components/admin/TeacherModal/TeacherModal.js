import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TeacherModal = ({ isOpen, onClose, onSubmit, teacher, mode = 'add' }) => {
    const [formData, setFormData] = useState(teacher || {
        teacher_id: '',
        personal_details: {
            name: '',
            email: '',
            phone: '',
            address: '',
            date_of_birth: '',
            gender: ''
        },
        assigned_classes: [],
        password: ''
    });

    useEffect(() => {
        if (teacher && mode === 'edit') {
            setFormData({
                teacher_id: teacher.teacher_id || '',
                personal_details: {
                    name: teacher.personal_details?.name || '',
                    email: teacher.personal_details?.email || '',
                    phone: teacher.personal_details?.phone || '',
                    address: teacher.personal_details?.address || '',
                    date_of_birth: teacher.personal_details?.date_of_birth || '',
                    gender: teacher.personal_details?.gender || ''
                },
                assigned_classes: teacher.assigned_classes || [],
                password: ''
            });
        } else if (mode === 'add' && isOpen) {
            setFormData({
                teacher_id: '',
                personal_details: {
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    date_of_birth: '',
                    gender: ''
                },
                assigned_classes: [],
                password: ''
            });
        }
    }, [teacher, mode, isOpen]);

    const [newClass, setNewClass] = useState({
        class: '',
        section: '',
        subject: ''
    });

    if (!isOpen) return null;

    const handleChange = (e, section = null) => {
        const { name, value } = e.target;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddClass = () => {
        if (newClass.class && newClass.section && newClass.subject) {
            setFormData(prev => ({
                ...prev,
                assigned_classes: [...prev.assigned_classes, { ...newClass }]
            }));
            setNewClass({ class: '', section: '', subject: '' });
        }
    };

    const handleRemoveClass = (index) => {
        setFormData(prev => ({
            ...prev,
            assigned_classes: prev.assigned_classes.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                    <h3 className="text-2xl font-semibold text-gray-900">
                        {mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teacher ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="teacher_id"
                                        value={formData.teacher_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        disabled={mode === 'edit'}
                                    />
                                </div>
                                {mode === 'add' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Personal Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.personal_details.name}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.personal_details.email}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.personal_details.phone}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.personal_details.gender}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.personal_details.date_of_birth}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.personal_details.address}
                                        onChange={(e) => handleChange(e, 'personal_details')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assigned Classes */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Assigned Classes</h4>

                            {/* Add New Class */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <p className="text-sm text-gray-600 mb-3">Add a new class assignment:</p>
                                <div className="grid grid-cols-4 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Class (e.g., 10)"
                                        value={newClass.class}
                                        onChange={(e) => setNewClass({ ...newClass, class: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Section (e.g., A)"
                                        value={newClass.section}
                                        onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={newClass.subject}
                                        onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddClass}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Assigned Classes List */}
                            {formData.assigned_classes.length > 0 ? (
                                <div className="space-y-2">
                                    {formData.assigned_classes.map((ac, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex gap-4">
                                                <span className="font-medium">Class {ac.class}-{ac.section}</span>
                                                <span className="text-gray-600">•</span>
                                                <span className="text-gray-600">{ac.subject}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveClass(index)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No classes assigned yet
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            {mode === 'add' ? 'Add Teacher' : 'Update Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherModal;
