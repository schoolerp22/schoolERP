import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../../hooks/useChat';
import { Send, Paperclip, Image as ImageIcon, FileText, X, Settings, Users, Loader, Check, Pencil, Trash2, SmilePlus, Eye } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'];

const ClassChat = ({ classNum, section, currentUser }) => {
    const {
        messages,
        chatSettings,
        loading,
        error,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        markSeen,
        toggleStudentMessages
    } = useChat(classNum, section, currentUser.id, currentUser.role);

    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Edit state
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editText, setEditText] = useState('');

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y }

    // Emoji picker state
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);

    // Seen-by popup
    const [seenByMsgId, setSeenByMsgId] = useState(null);

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const editInputRef = useRef(null);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mark unseen messages as seen
    useEffect(() => {
        if (!messages.length || !currentUser.id) return;
        messages.forEach(msg => {
            if (msg.senderId !== currentUser.id && (!msg.seenBy || !msg.seenBy.includes(currentUser.id))) {
                markSeen(msg.id);
            }
        });
    }, [messages, currentUser.id, markSeen]);

    // Close context menu and emoji picker on outside click
    useEffect(() => {
        const handleClick = () => {
            setContextMenu(null);
            setEmojiPickerMsgId(null);
            setSeenByMsgId(null);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Focus edit input
    useEffect(() => {
        if (editingMsgId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingMsgId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage, selectedFile, currentUser.name);
            setNewMessage('');
            setSelectedFile(null);
        } catch (err) {
            alert(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 5 * 1024 * 1024) {
                alert("File size must be under 5MB");
                return;
            }
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleContextMenu = (e, msgId, senderId) => {
        if (senderId !== currentUser.id) return;
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ msgId, x: e.clientX || e.pageX, y: e.clientY || e.pageY });
    };

    const handleLongPress = (() => {
        let timer = null;
        return {
            onTouchStart: (e, msgId, senderId) => {
                if (senderId !== currentUser.id) return;
                timer = setTimeout(() => {
                    const touch = e.touches[0];
                    setContextMenu({ msgId, x: touch.clientX, y: touch.clientY });
                }, 500);
            },
            onTouchEnd: () => {
                if (timer) clearTimeout(timer);
            }
        };
    })();

    const startEdit = (msg) => {
        setEditingMsgId(msg.id);
        setEditText(msg.text || '');
        setContextMenu(null);
    };

    const saveEdit = async () => {
        if (!editText.trim()) return;
        try {
            await editMessage(editingMsgId, editText);
            setEditingMsgId(null);
            setEditText('');
        } catch (err) {
            alert('Failed to edit message');
        }
    };

    const cancelEdit = () => {
        setEditingMsgId(null);
        setEditText('');
    };

    const confirmDelete = async () => {
        try {
            await deleteMessage(deleteConfirmId);
            setDeleteConfirmId(null);
            setContextMenu(null);
        } catch (err) {
            alert('Failed to delete message');
        }
    };

    const handleReaction = async (msgId, emoji) => {
        try {
            await reactToMessage(msgId, emoji);
            setEmojiPickerMsgId(null);
        } catch (err) {
            console.error('Reaction failed:', err);
        }
    };

    const formatTime = (firebaseTimestamp) => {
        if (!firebaseTimestamp) return '';
        const date = firebaseTimestamp.toDate ? firebaseTimestamp.toDate() : new Date(firebaseTimestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isAdminOrTeacher = currentUser.role === 'admin' || currentUser.role === 'teacher';
    const canChat = isAdminOrTeacher || (chatSettings?.allowStudentMessages && currentUser.role === 'student');

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading chat: {error}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">

            {/* Chat Header */}
            <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center shrink-0">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">Class {classNum} - {section} Chat</h2>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                        <Users size={14} />
                        {chatSettings?.allowStudentMessages ? 'All members can type' : 'Only Admins/Teachers can type'}
                    </p>
                </div>

                {isAdminOrTeacher && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative flex-shrink-0"
                    >
                        <Settings size={20} className="text-gray-600" />
                    </button>
                )}
            </div>

            {/* Settings Dropdown */}
            {showSettings && isAdminOrTeacher && (
                <div className="absolute top-14 right-4 bg-white border shadow-xl rounded-lg p-4 z-30 w-64" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Group Settings</h3>
                    <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors w-full">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={chatSettings?.allowStudentMessages || false}
                            onChange={(e) => toggleStudentMessages(e.target.checked)}
                        />
                        <span className="text-gray-700 text-sm font-medium">Allow students to message</span>
                    </label>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirmId(null)}>
                    <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Message?</h3>
                        <p className="text-gray-500 text-sm mb-4">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto chat-scrollbar p-3 sm:p-6 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-blue-50 p-4 rounded-full mb-3">
                            <Send size={32} className="text-blue-300" />
                        </div>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.senderId === currentUser.id;
                        const showName = !isMine && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                        const reactions = msg.reactions || {};
                        const hasReactions = Object.keys(reactions).length > 0;
                        const seenCount = (msg.seenBy || []).filter(id => id !== msg.senderId).length;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {showName && (
                                    <span className="text-xs text-gray-500 mb-1 ml-1 flex items-center gap-2">
                                        {msg.senderName}
                                        {msg.senderRole === 'teacher' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Teacher</span>}
                                        {msg.senderRole === 'admin' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>}
                                    </span>
                                )}

                                <div className="relative group max-w-[88%] sm:max-w-[75%]">
                                    {/* Context menu trigger area */}
                                    <div
                                        className={`rounded-2xl px-3 sm:px-4 py-2 shadow-sm relative ${isMine
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                            }`}
                                        onContextMenu={(e) => handleContextMenu(e, msg.id, msg.senderId)}
                                        onTouchStart={(e) => handleLongPress.onTouchStart(e, msg.id, msg.senderId)}
                                        onTouchEnd={handleLongPress.onTouchEnd}
                                    >
                                        {/* Edit mode */}
                                        {editingMsgId === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <input
                                                    ref={editInputRef}
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                                    className="bg-white/20 text-current rounded-lg px-3 py-1.5 text-sm outline-none border border-white/30 placeholder-white/50 w-full"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={cancelEdit} className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded">Cancel</button>
                                                    <button onClick={saveEdit} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded font-medium">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* File Attachment */}
                                                {msg.fileUrl && (
                                                    <div className="mb-2 mt-1">
                                                        {msg.fileType?.startsWith('image/') ? (
                                                            <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                                                <img src={msg.fileUrl} alt="Attached" className="max-w-full rounded-lg max-h-48 object-cover border border-black/10 hover:opacity-90 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <a
                                                                href={msg.fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`flex items-center gap-2 p-2 rounded-lg border ${isMine ? 'bg-blue-700 border-blue-400 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}
                                                            >
                                                                <FileText size={18} />
                                                                <span className="text-sm truncate max-w-[150px]">{msg.fileName}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {msg.text && (
                                                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                                        {msg.text}
                                                    </p>
                                                )}

                                                {/* Time + Edited + Tick */}
                                                <div className={`mt-1 text-[11px] ${isMine ? 'text-blue-200' : 'text-gray-400'} flex items-center justify-end gap-1.5`}>
                                                    {msg.edited && <span className="italic">edited</span>}
                                                    {formatTime(msg.timestamp)}
                                                    {isMine && <Check size={12} className="inline-block" />}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Hover action buttons (emoji) */}
                                    {editingMsgId !== msg.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                            className={`absolute ${isMine ? '-left-8' : '-right-8'} top-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow border border-gray-100 hover:bg-gray-50 z-10 hidden sm:block`}
                                        >
                                            <SmilePlus size={14} className="text-gray-400" />
                                        </button>
                                    )}

                                    {/* Emoji Picker */}
                                    {emojiPickerMsgId === msg.id && (
                                        <div
                                            className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-10 bg-white shadow-lg rounded-full px-2 py-1 flex gap-1 border border-gray-100 z-20`}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {QUICK_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                    className="hover:scale-125 transition-transform text-lg px-1 py-0.5"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reactions Display */}
                                    {hasReactions && (
                                        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            {Object.entries(reactions).map(([emoji, users]) => (
                                                <button
                                                    key={emoji}
                                                    onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                                                    className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${users.includes(currentUser.id)
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="font-medium">{users.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Mobile reaction button */}
                                    {editingMsgId !== msg.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                            className={`sm:hidden absolute ${isMine ? '-left-8' : '-right-8'} top-1 p-1 rounded-full bg-white shadow border border-gray-100`}
                                        >
                                            <SmilePlus size={14} className="text-gray-400" />
                                        </button>
                                    )}
                                </div>

                                {/* Seen By (only for own messages, teachers see details) */}
                                {isMine && seenCount > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSeenByMsgId(seenByMsgId === msg.id ? null : msg.id); }}
                                            className="text-[11px] text-gray-400 mt-0.5 mr-1 flex items-center gap-1 hover:text-gray-600 transition-colors"
                                        >
                                            <Eye size={11} />
                                            Seen by {seenCount}
                                        </button>

                                        {/* Seen By Popup (teachers only) */}
                                        {seenByMsgId === msg.id && isAdminOrTeacher && (
                                            <div className="absolute right-0 top-5 bg-white shadow-lg rounded-lg p-3 z-20 border border-gray-100 min-w-[150px]" onClick={e => e.stopPropagation()}>
                                                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Seen by</h4>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {(msg.seenBy || []).filter(id => id !== msg.senderId).map((userId, i) => (
                                                        <div key={i} className="text-xs text-gray-700 py-0.5">{userId}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white shadow-xl rounded-lg border border-gray-100 z-50 py-1 min-w-[140px]"
                    style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 160) }}
                    onClick={e => e.stopPropagation()}
                >
                    {messages.find(m => m.id === contextMenu.msgId)?.text && (
                        <button
                            onClick={() => startEdit(messages.find(m => m.id === contextMenu.msgId))}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                    )}
                    <button
                        onClick={() => { setDeleteConfirmId(contextMenu.msgId); setContextMenu(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white p-2 sm:p-4 border-t shrink-0">
                {selectedFile && (
                    <div className="mb-2 flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded-lg border border-blue-100 text-sm w-fit max-w-full">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-blue-200 rounded-full transition-colors ml-auto flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {!canChat ? (
                    <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-lg text-sm font-medium border border-gray-200">
                        The admin has restricted students from sending messages.
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-end gap-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 sm:p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none flex-shrink-0"
                            disabled={isSending}
                            title="Attach File"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />

                        <div className="flex-1 bg-gray-100 rounded-2xl relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-transparent resize-none outline-none py-2.5 sm:py-3 px-3 sm:px-4 max-h-32 text-gray-800 placeholder-gray-500 rounded-2xl text-[15px]"
                                rows="1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                disabled={isSending}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSending || (!newMessage.trim() && !selectedFile)}
                            className={`p-2.5 sm:p-3 rounded-full flex-shrink-0 transition-colors flex items-center justify-center ${isSending || (!newMessage.trim() && !selectedFile)
                                ? 'bg-gray-200 text-gray-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                }`}
                        >
                            {isSending ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ClassChat;
