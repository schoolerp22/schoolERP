import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const StudentModal = ({ isOpen, onClose, onSubmit, student, mode = 'add' }) => {
    const [formData, setFormData] = useState(student || {
        admission_no: '',
        roll_no: '',
        class: '',
        section: '',
        house: '',
        identity: {
            aadhar_no: '',
            pan_no: ''
        },
        personal_details: {
            first_name: '',
            last_name: '',
            address: '',
            phone: '',
            email: '',
            gender: '',
            date_of_birth: ''
        },
        parent_record: {
            father_name: '',
            mother_name: '',
            primary_contact: '',
            secondary_contact: ''
        },
        transport: {
            bus_number: ''
        },
        password: ''
    });

    const [csvFile, setCSVFile] = useState(null);
    const [uploadMode, setUploadMode] = useState('manual'); // 'manual' or 'csv'

    // Update form data when student prop changes (for edit mode)
    useEffect(() => {
        if (student && mode === 'edit') {
            setFormData({
                admission_no: student.admission_no || '',
                roll_no: student.roll_no || '',
                class: student.class || '',
                section: student.section || '',
                house: student.house || '',
                identity: {
                    aadhar_no: student.identity?.aadhar_no || '',
                    pan_no: student.identity?.pan_no || ''
                },
                personal_details: {
                    first_name: student.personal_details?.first_name || '',
                    last_name: student.personal_details?.last_name || '',
                    address: student.personal_details?.address || '',
                    phone: student.personal_details?.phone || '',
                    email: student.personal_details?.email || '',
                    gender: student.personal_details?.gender || '',
                    date_of_birth: student.personal_details?.date_of_birth || ''
                },
                parent_record: {
                    father_name: student.parent_record?.father_name || '',
                    mother_name: student.parent_record?.mother_name || '',
                    primary_contact: student.parent_record?.primary_contact || '',
                    secondary_contact: student.parent_record?.secondary_contact || ''
                },
                transport: {
                    bus_number: student.transport?.bus_number || student.transport?.bus_no || ''
                },
                password: ''
            });
        } else if (mode === 'add' && isOpen) {
            setFormData({
                admission_no: '',
                roll_no: '',
                class: '',
                section: '',
                house: '',
                identity: {
                    aadhar_no: '',
                    pan_no: ''
                },
                personal_details: {
                    first_name: '',
                    last_name: '',
                    address: '',
                    phone: '',
                    email: '',
                    gender: '',
                    date_of_birth: ''
                },
                parent_record: {
                    father_name: '',
                    mother_name: '',
                    primary_contact: '',
                    secondary_contact: ''
                },
                transport: {
                    bus_number: ''
                },
                password: ''
            });
            setUploadMode('manual');
            setCSVFile(null);
        }
    }, [student, mode, isOpen]);

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

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCSVFile(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (uploadMode === 'csv' && csvFile) {
            // Handle CSV upload
            const reader = new FileReader();
            reader.onload = (event) => {
                const csvData = event.target.result;
                onSubmit({ type: 'csv', data: csvData, file: csvFile });
            };
            reader.readAsText(csvFile);
        } else {
            // Handle manual form submission
            onSubmit({ type: 'manual', data: formData });
        }
    };

    const downloadCSVTemplate = () => {
        const template = `admission_no,roll_no,class,section,house,first_name,last_name,gender,date_of_birth,address,phone,email,aadhar_no,pan_no,father_name,mother_name,primary_contact,secondary_contact,bus_number,password
2026-001,1,10,A,Red,John,Doe,Male,2010-01-15,123 Main St,9876543210,john@example.com,123456789012,ABCDE1234F,Mr. Doe,Mrs. Doe,9876543210,9876543211,BUS-01,password123
2026-002,2,10,A,Blue,Jane,Smith,Female,2010-02-20,456 Oak Ave,9876543211,jane@example.com,123456789013,ABCDE1235F,Mr. Smith,Mrs. Smith,9876543212,9876543213,BUS-02,password123`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                    <h3 className="text-2xl font-semibold text-gray-900">
                        {mode === 'add' ? 'Add New Student' : 'Edit Student'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {mode === 'add' && (
                    <div className="mb-6">
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setUploadMode('manual')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${uploadMode === 'manual'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setUploadMode('csv')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${uploadMode === 'csv'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                CSV Upload (Bulk)
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {uploadMode === 'csv' ? (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-600 mb-4">
                                    Upload a CSV file with student data
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700"
                                >
                                    Choose CSV File
                                </label>
                                {csvFile && (
                                    <p className="mt-4 text-sm text-green-600">
                                        Selected: {csvFile.name}
                                    </p>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">CSV Format Instructions:</h4>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>First row must contain column headers</li>
                                    <li>Required columns: admission_no, roll_no, class, section, first_name, last_name</li>
                                    <li>Date format: YYYY-MM-DD</li>
                                    <li>Download template below for reference</li>
                                </ul>
                                <button
                                    type="button"
                                    onClick={downloadCSVTemplate}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Download CSV Template
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Admission Number *
                                        </label>
                                        <input
                                            type="text"
                                            name="admission_no"
                                            value={formData.admission_no}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                            disabled={mode === 'edit'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Roll Number *
                                        </label>
                                        <input
                                            type="text"
                                            name="roll_no"
                                            value={formData.roll_no}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Class *
                                        </label>
                                        <input
                                            type="text"
                                            name="class"
                                            value={formData.class}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Section *
                                        </label>
                                        <input
                                            type="text"
                                            name="section"
                                            value={formData.section}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            House
                                        </label>
                                        <select
                                            name="house"
                                            value={formData.house}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select House</option>
                                            <option value="Red">Red</option>
                                            <option value="Blue">Blue</option>
                                            <option value="Green">Green</option>
                                            <option value="Yellow">Yellow</option>
                                        </select>
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.personal_details.first_name}
                                            onChange={(e) => handleChange(e, 'personal_details')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.personal_details.last_name}
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.personal_details.phone}
                                            onChange={(e) => handleChange(e, 'personal_details')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.personal_details.email}
                                            onChange={(e) => handleChange(e, 'personal_details')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Identity */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Identity Documents</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Aadhar Number
                                        </label>
                                        <input
                                            type="text"
                                            name="aadhar_no"
                                            value={formData.identity.aadhar_no}
                                            onChange={(e) => handleChange(e, 'identity')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            maxLength="12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            PAN Number
                                        </label>
                                        <input
                                            type="text"
                                            name="pan_no"
                                            value={formData.identity.pan_no}
                                            onChange={(e) => handleChange(e, 'identity')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            maxLength="10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Details */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Parent Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Father's Name
                                        </label>
                                        <input
                                            type="text"
                                            name="father_name"
                                            value={formData.parent_record.father_name}
                                            onChange={(e) => handleChange(e, 'parent_record')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mother's Name
                                        </label>
                                        <input
                                            type="text"
                                            name="mother_name"
                                            value={formData.parent_record.mother_name}
                                            onChange={(e) => handleChange(e, 'parent_record')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Primary Contact
                                        </label>
                                        <input
                                            type="tel"
                                            name="primary_contact"
                                            value={formData.parent_record.primary_contact}
                                            onChange={(e) => handleChange(e, 'parent_record')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Secondary Contact
                                        </label>
                                        <input
                                            type="tel"
                                            name="secondary_contact"
                                            value={formData.parent_record.secondary_contact}
                                            onChange={(e) => handleChange(e, 'parent_record')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Transport */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Transport Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bus Number
                                        </label>
                                        <input
                                            type="text"
                                            name="bus_number"
                                            value={formData.transport.bus_number}
                                            onChange={(e) => handleChange(e, 'transport')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                            disabled={uploadMode === 'csv' && !csvFile}
                        >
                            {uploadMode === 'csv' ? 'Upload Students' : mode === 'add' ? 'Add Student' : 'Update Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;
