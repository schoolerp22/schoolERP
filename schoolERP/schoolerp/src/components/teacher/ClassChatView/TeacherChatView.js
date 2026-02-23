import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ClassChat from '../../common/ClassChat/ClassChat';
import { useGroupChat } from '../../../hooks/useGroupChat';
import {
    MessageSquare, AlertCircle, Plus, Users, Trash2, Edit3, X,
    Search, ChevronRight, Hash, Loader
} from 'lucide-react';

const TeacherChatView = ({ selectedClass }) => {
    const { profile } = useSelector((state) => state.teacher);
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('class'); // 'class' | 'groups'
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    if (!profile) return null;

    const currentUser = {
        id: profile.teacher_id || profile._id || 'teacher_id',
        name: profile.personal_details?.name
            || `${profile.personal_details?.first_name || ''} ${profile.personal_details?.last_name || ''}`.trim()
            || profile.name || 'Teacher',
        role: 'teacher'
    };

    const [classNum, section] = selectedClass ? selectedClass.split('-') : [null, null];

    return (
        <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl p-3 sm:p-4 text-white shadow-lg shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                            <MessageSquare className="text-blue-200" size={20} />
                            {activeTab === 'class'
                                ? 'Class Chat'
                                : selectedGroup
                                    ? selectedGroup.groupName
                                    : 'Group Chats'
                            }
                        </h2>
                        <p className="text-blue-100/80 mt-1 text-xs sm:text-sm">
                            {activeTab === 'class'
                                ? `Communicate with students in Class ${classNum || '?'} - ${section || '?'}.`
                                : selectedGroup
                                    ? `${selectedGroup.memberCount || 0} members`
                                    : 'Create and manage custom chat groups.'
                            }
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-white/10 rounded-lg p-1 shrink-0">
                        <button
                            onClick={() => { setActiveTab('class'); setSelectedGroup(null); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === 'class' ? 'bg-white text-blue-700' : 'text-white/70 hover:text-white'}`}
                        >
                            Class
                        </button>
                        <button
                            onClick={() => { setActiveTab('groups'); setSelectedGroup(null); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === 'groups' ? 'bg-white text-blue-700' : 'text-white/70 hover:text-white'}`}
                        >
                            Groups
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'class' ? (
                    selectedClass ? (
                        <ClassChat classNum={classNum} section={section} currentUser={currentUser} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                            <AlertCircle size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700">No Class Selected</h3>
                            <p>Please select a class from the top dropdown to view its chat.</p>
                        </div>
                    )
                ) : selectedGroup ? (
                    <div className="h-full flex flex-col">
                        <button
                            onClick={() => setSelectedGroup(null)}
                            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-1 shrink-0 border-b"
                        >
                            ← Back to Groups
                        </button>
                        <div className="flex-1 min-h-0">
                            <ClassChat
                                key={selectedGroup.id}
                                currentUser={currentUser}
                                directRoomId={selectedGroup.id}
                            />
                        </div>
                    </div>
                ) : (
                    <GroupsList
                        currentUser={currentUser}
                        onSelectGroup={setSelectedGroup}
                        onCreateGroup={() => setShowCreateModal(true)}
                    />
                )}
            </div>

            {showCreateModal && (
                <CreateGroupModal
                    currentUser={currentUser}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(group) => {
                        setShowCreateModal(false);
                        setSelectedGroup(group);
                    }}
                />
            )}
        </div>
    );
};

// ─── Groups List ───
const GroupsList = ({ currentUser, onSelectGroup, onCreateGroup }) => {
    const { groups, loadingGroups, deleteGroup } = useGroupChat(
        currentUser.id, currentUser.role, currentUser.name
    );

    if (loadingGroups) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Your Groups</h3>
                <button
                    onClick={onCreateGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                >
                    <Plus size={16} /> New Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-gray-500">No groups yet</p>
                    <p className="text-sm mt-1">Create a group to chat with students from different classes.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => onSelectGroup(group)}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                <Hash size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{group.groupName}</p>
                                <p className="text-xs text-gray-400">
                                    {group.memberCount} members
                                    {group.lastMessage?.text && ` · ${group.lastMessage.text.substring(0, 30)}${group.lastMessage.text.length > 30 ? '...' : ''}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {group.createdBy === currentUser.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Delete this group? All messages will be lost.')) {
                                                deleteGroup(group.id);
                                            }
                                        }}
                                        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <ChevronRight size={16} className="text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Create Group Modal ───
const CreateGroupModal = ({ currentUser, onClose, onCreated }) => {
    const { createGroup } = useGroupChat(currentUser.id, currentUser.role, currentUser.name);
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [selectedClassSection, setSelectedClassSection] = useState('');
    const [activeAddTab, setActiveAddTab] = useState('students');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Fetch students when class/section is selected
    useEffect(() => {
        if (!selectedClassSection) return;
        const fetchStudents = async () => {
            try {
                const res = await fetch(`${API_URL}/api/chat/students/${selectedClassSection}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableStudents(data);
                }
            } catch (e) { console.error(e); }
        };
        fetchStudents();
    }, [selectedClassSection, API_URL]);

    // Fetch teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/chat/teachers`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableTeachers(data.filter(t => t.id !== currentUser.id));
                }
            } catch (e) { console.error(e); }
        };
        fetchTeachers();
    }, [API_URL, currentUser.id]);

    const togglePerson = (person) => {
        setSelectedPeople(prev => {
            const exists = prev.some(p => p.id === person.id);
            if (exists) return prev.filter(p => p.id !== person.id);
            return [...prev, person];
        });
    };

    const isSelected = (id) => selectedPeople.some(p => p.id === id);

    const handleCreate = async () => {
        if (!groupName.trim()) { setError('Please enter a group name'); return; }
        if (selectedPeople.length === 0) { setError('Add at least one member'); return; }
        setCreating(true);
        setError('');
        try {
            const roomId = await createGroup(groupName, selectedPeople);
            onCreated({ id: roomId, groupName, memberCount: selectedPeople.length + 1 });
        } catch (e) {
            setError(e.message);
            setCreating(false);
        }
    };

    const filteredStudents = availableStudents.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeachers = availableTeachers.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-gray-800">Create New Group</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="e.g., Science Club, Math Extra Class..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Selected People Chips */}
                    {selectedPeople.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedPeople.map(p => (
                                <span
                                    key={p.id}
                                    className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                                >
                                    {p.name}
                                    <button onClick={() => togglePerson(p)} className="hover:text-red-500 ml-0.5">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tabs: Students / Teachers */}
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveAddTab('students')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${activeAddTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            + Students
                        </button>
                        <button
                            onClick={() => setActiveAddTab('teachers')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${activeAddTab === 'teachers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            + Teachers
                        </button>
                    </div>

                    {activeAddTab === 'students' && (
                        <>
                            {/* Class/Section selector */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Select Class-Section</label>
                                <select
                                    value={selectedClassSection}
                                    onChange={e => setSelectedClassSection(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Choose class...</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c =>
                                        ['A', 'B', 'C', 'D'].map(s => (
                                            <option key={`${c}-${s}`} value={`${c}-${s}`}>Class {c} - {s}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={`Search ${activeAddTab}...`}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* People list */}
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                        {activeAddTab === 'students' ? (
                            !selectedClassSection ? (
                                <p className="text-center text-gray-400 text-xs py-4">Select a class to load students</p>
                            ) : filteredStudents.length === 0 ? (
                                <p className="text-center text-gray-400 text-xs py-4">No students found</p>
                            ) : (
                                filteredStudents.map(s => (
                                    <label
                                        key={s.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${isSelected(s.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected(s.id)}
                                            onChange={() => togglePerson({ ...s, role: 'student' })}
                                            className="rounded text-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{s.name}</p>
                                            <p className="text-xs text-gray-400">{s.id}{s.class ? ` · Class ${s.class}${s.section ? `-${s.section}` : ''}` : ''}</p>
                                        </div>
                                    </label>
                                ))
                            )
                        ) : (
                            filteredTeachers.length === 0 ? (
                                <p className="text-center text-gray-400 text-xs py-4">No teachers found</p>
                            ) : (
                                filteredTeachers.map(t => (
                                    <label
                                        key={t.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${isSelected(t.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected(t.id)}
                                            onChange={() => togglePerson({ ...t, role: 'teacher' })}
                                            className="rounded text-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{t.name}</p>
                                            <p className="text-xs text-gray-400">{t.id}</p>
                                        </div>
                                    </label>
                                ))
                            )
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Footer */}
                <div className="p-4 border-t shrink-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={creating || !groupName.trim() || selectedPeople.length === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                        {creating ? 'Creating...' : `Create Group (${selectedPeople.length + 1} members)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherChatView;
