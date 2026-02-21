import React from 'react';
import { useSelector } from 'react-redux';
import ClassChat from '../../common/ClassChat/ClassChat';
import { MessageSquare, AlertCircle } from 'lucide-react';

const StudentChatView = () => {
    const { profile } = useSelector((state) => state.student);

    if (!profile) return null;

    const classNum = profile.academic?.current_class || profile.class || profile.class_name;
    const section = profile.academic?.section || profile.section;

    if (!classNum || !section) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 mt-6 mx-4">
                <AlertCircle size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">Class Information Missing</h3>
                <p>We couldn't determine your class and section to load the right chat room.</p>
            </div>
        );
    }

    const currentUser = {
        id: profile._id || profile.admission_no || 'student_id',
        name: profile.personal_details
            ? `${profile.personal_details.first_name || ''} ${profile.personal_details.last_name || ''}`.trim()
            : (profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Student'),
        role: 'student'
    };

    return (
        <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl p-3 sm:p-4 text-white shadow-lg shrink-0">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-blue-200" size={20} />
                    Class {classNum} - {section} Chat
                </h2>
                <p className="text-blue-100/80 mt-1 text-xs sm:text-sm">Communicate with your teachers and classmates. Please keep it respectful.</p>
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

export default StudentChatView;
