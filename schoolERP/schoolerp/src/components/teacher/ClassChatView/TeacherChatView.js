import React from 'react';
import { useSelector } from 'react-redux';
import ClassChat from '../../common/ClassChat/ClassChat';
import { MessageSquare, AlertCircle } from 'lucide-react';

const TeacherChatView = ({ selectedClass }) => {
    const { profile } = useSelector((state) => state.teacher);

    if (!profile) return null;

    if (!selectedClass) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <AlertCircle size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No Class Selected</h3>
                <p>Please select a class from the top dropdown to view its chat.</p>
            </div>
        );
    }

    const [classNum, section] = selectedClass.split('-');

    const currentUser = {
        id: profile.teacher_id || profile._id || 'teacher_id',
        name: profile.personal_details?.name
            || `${profile.personal_details?.first_name || ''} ${profile.personal_details?.last_name || ''}`.trim()
            || profile.name || 'Teacher',
        role: 'teacher'
    };

    return (
        <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl p-3 sm:p-4 text-white shadow-lg shrink-0">
                <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-blue-200" size={20} />
                    Class Chat
                </h2>
                <p className="text-blue-100/80 mt-1 text-xs sm:text-sm">Communicate with students in Class {classNum} - {section}.</p>
            </div>

            <div className="flex-1 min-h-0">
                <ClassChat
                    classNum={classNum}
                    section={section}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
};

export default TeacherChatView;
