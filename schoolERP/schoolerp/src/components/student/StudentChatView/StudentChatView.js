import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ClassChat from '../../common/ClassChat/ClassChat';
import { useGroupChat } from '../../../hooks/useGroupChat';
import { MessageSquare, AlertCircle, Hash, ChevronLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

const StudentChatView = () => {
    const { profile } = useSelector((state) => state.student);
    const [additionalRooms, setAdditionalRooms] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // null = own class, { type: 'class', ... } or { type: 'group', ... }
    // const [loadingRooms, setLoadingRooms] = useState(true);

    const classNum = profile?.academic?.current_class || profile?.class || profile?.class_name;
    const section = profile?.academic?.section || profile?.section;
    const studentId = profile?.admission_no || profile?._id;

    const currentUser = profile ? {
        id: profile.admission_no || profile._id || 'student_id',
        name: profile.personal_details
            ? `${profile.personal_details.first_name || ''} ${profile.personal_details.last_name || ''}`.trim()
            : (profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Student'),
        role: 'student'
    } : null;

    const { groups } = useGroupChat(currentUser?.id, 'student', currentUser?.name);

    // Find other CLASS rooms this student was added to
    useEffect(() => {
        // if (!studentId || !classNum || !section) { setLoadingRooms(false); return; }
        const findRooms = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'chatRooms'));
                const ownRoomId = `${classNum}_${section}`;
                const extraRooms = [];
                snapshot.forEach(d => {
                    if (d.id === ownRoomId) return;
                    const data = d.data();
                    if (data.type === 'group') return;
                    const participants = data.participants || [];
                    if (participants.some(p => p.id === studentId || p.id === profile?.admission_no || p.id === profile?._id)) {
                        extraRooms.push({
                            id: d.id,
                            classNum: data.classNum || d.id.split('_')[0],
                            section: data.section || d.id.split('_')[1]
                        });
                    }
                });
                setAdditionalRooms(extraRooms);
            } catch (err) { console.error('Error finding rooms:', err); }
            // finally { setLoadingRooms(false); }
        };
        findRooms();
    }, [studentId, classNum, section, profile]);

    if (!profile || !classNum || !section) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 mt-6 mx-4">
                <AlertCircle size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                    {!profile ? 'Loading...' : 'Class Information Missing'}
                </h3>
            </div>
        );
    }

    const hasExtras = additionalRooms.length > 0 || groups.length > 0;

    // Build the chat items list
    // const allChats = [
    //     { type: 'class', id: 'own', classNum, section, label: `Class ${classNum}-${section}`, isOwn: true },
    //     ...additionalRooms.map(r => ({
    //         type: 'class', id: r.id, classNum: r.classNum, section: r.section,
    //         label: `Class ${r.classNum}-${r.section}`, isOwn: false
    //     })),
    //     ...groups.map(g => ({
    //         type: 'group', id: g.id, groupName: g.groupName,
    //         label: g.groupName, memberCount: g.memberCount
    //     }))
    // ];

    // Determine what to render
    const isViewingNonDefault = activeChat !== null;
    let activeCN = classNum, activeSC = section, directRoomId = null, chatTitle = `Class ${classNum} - ${section} Chat`;

    if (activeChat) {
        if (activeChat.type === 'class') {
            activeCN = activeChat.classNum;
            activeSC = activeChat.section;
            chatTitle = `Class ${activeChat.classNum} - ${activeChat.section} Chat`;
        } else {
            directRoomId = activeChat.id;
            chatTitle = activeChat.groupName || 'Group Chat';
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl p-3 sm:p-4 text-white shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    {isViewingNonDefault && (
                        <button
                            onClick={() => setActiveChat(null)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition shrink-0"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
                            {activeChat?.type === 'group'
                                ? <Hash className="text-blue-200 shrink-0" size={20} />
                                : <MessageSquare className="text-blue-200 shrink-0" size={20} />
                            }
                            {chatTitle}
                        </h2>
                        <p className="text-blue-100/80 mt-0.5 text-xs sm:text-sm truncate">
                            {!activeChat
                                ? 'Your class chat room'
                                : activeChat.type === 'group'
                                    ? `${activeChat.memberCount || ''} members · Group`
                                    : 'Added by teacher'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Switcher Bar — only show when on default room and there are extras */}
            {!isViewingNonDefault && hasExtras && (
                <div className="bg-white border-b shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {/* Own class - always highlighted */}
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0 shadow-sm"
                        >
                            <MessageSquare size={13} />
                            {classNum}-{section}
                        </button>

                        {/* Additional class rooms */}
                        {additionalRooms.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setActiveChat({ type: 'class', ...r })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-700 transition shrink-0 border border-gray-200"
                            >
                                <MessageSquare size={13} />
                                {r.classNum}-{r.section}
                            </button>
                        ))}

                        {/* Separator if both exist */}
                        {additionalRooms.length > 0 && groups.length > 0 && (
                            <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                        )}

                        {/* Group rooms */}
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setActiveChat({
                                    type: 'group', id: g.id,
                                    groupName: g.groupName,
                                    memberCount: g.memberCount
                                })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition shrink-0 border border-indigo-200"
                            >
                                <Hash size={13} />
                                {g.groupName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 min-h-0">
                <ClassChat
                    key={directRoomId || `${activeCN}_${activeSC}`}
                    classNum={directRoomId ? null : activeCN}
                    section={directRoomId ? null : activeSC}
                    currentUser={currentUser}
                    directRoomId={directRoomId}
                />
            </div>
        </div>
    );
};

export default StudentChatView;
