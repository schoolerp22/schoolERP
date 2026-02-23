import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    where,
    documentId
} from 'firebase/firestore';
import { db } from '../firebase';

const ONLINE_THRESHOLD = 120000; // 2 minutes

/**
 * useChat hook — supports both class rooms and custom group rooms.
 * 
 * For class rooms: useChat(classNum, section, userId, role, name)
 * For group rooms: useChat(null, null, userId, role, name, directRoomId)
 */
export const useChat = (classNum, section, currentUserId, currentUserRole, currentUserName, directRoomId = null) => {
    const [messages, setMessages] = useState([]);
    const [chatSettings, setChatSettings] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [roomData, setRoomData] = useState(null);
    const [presenceMap, setPresenceMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine room ID: either direct or from class/section
    const roomId = directRoomId || (classNum && section ? `${classNum}_${section}` : null);
    const isGroupChat = !!directRoomId;

    const roomRef = useMemo(() => roomId ? doc(db, 'chatRooms', roomId) : null, [roomId]);
    const messagesRef = useMemo(() => roomId ? collection(db, 'chatRooms', roomId, 'messages') : null, [roomId]);

    // Initialize room and listen to messages
    useEffect(() => {
        if (!roomId || !roomRef || !messagesRef) {
            setLoading(false);
            return;
        }

        let unsubscribeMessages;
        let unsubscribeSettings;

        const setupChat = async () => {
            try {
                // For class chats, auto-create room if it doesn't exist
                if (!isGroupChat) {
                    try {
                        const roomSnap = await getDoc(roomRef);
                        if (!roomSnap.exists() && currentUserRole !== 'student') {
                            await setDoc(roomRef, {
                                type: 'class',
                                classNum,
                                section,
                                createdAt: serverTimestamp(),
                                settings: { allowStudentMessages: true },
                                participants: [],
                                admins: [currentUserId]
                            });
                        }
                    } catch (e) {
                        console.warn("Could not fetch or create room doc:", e);
                    }
                }

                // Listen to room settings + participants
                unsubscribeSettings = onSnapshot(roomRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setChatSettings(data.settings);
                        setParticipants(data.participants || []);
                        setRoomData(data);
                    }
                });

                // Listen to messages
                const q = query(messagesRef, orderBy('timestamp', 'asc'));
                unsubscribeMessages = onSnapshot(q, (snapshot) => {
                    const fetchedMessages = [];
                    snapshot.forEach((d) => {
                        fetchedMessages.push({ id: d.id, ...d.data() });
                    });
                    setMessages(fetchedMessages);
                    setLoading(false);
                }, (err) => {
                    console.error("Messages listener error:", err);
                    setLoading(false);
                    if (!err.message?.includes("offline")) {
                        setError(err.message);
                    }
                });

            } catch (err) {
                console.error("Chat setup error:", err);
                if (!err.message?.includes("offline")) {
                    setError(err.message);
                }
                setLoading(false);
            }
        };

        setupChat();
        return () => {
            if (unsubscribeMessages) unsubscribeMessages();
            if (unsubscribeSettings) unsubscribeSettings();
        };
    }, [roomId, classNum, section, currentUserId, currentUserRole, isGroupChat, roomRef, messagesRef]);

    // Listen to global presence for all participants
    useEffect(() => {
        if (!participants.length) { setPresenceMap({}); return; }
        const ids = participants.map(p => p.id).filter(Boolean);
        if (!ids.length) return;

        const batches = [];
        for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i + 30));

        const unsubscribes = [];
        batches.forEach(batch => {
            const q = query(collection(db, 'userPresence'), where(documentId(), 'in', batch));
            const unsub = onSnapshot(q, (snapshot) => {
                const newPresence = {};
                snapshot.forEach(d => { newPresence[d.id] = d.data(); });
                setPresenceMap(prev => ({ ...prev, ...newPresence }));
            });
            unsubscribes.push(unsub);
        });
        return () => unsubscribes.forEach(u => u());
    }, [participants]);

    // Auto-register current user as participant
    useEffect(() => {
        if (!currentUserId || !roomId || !roomRef || loading) return;
        const alreadyIn = participants.some(p => p.id === currentUserId);
        if (!alreadyIn) {
            const autoRegister = async () => {
                try {
                    const roomSnap = await getDoc(roomRef);
                    if (roomSnap.exists()) {
                        await updateDoc(roomRef, {
                            participants: arrayUnion({
                                id: currentUserId,
                                name: currentUserName || 'Unknown',
                                role: currentUserRole,
                                joinedAt: new Date().toISOString()
                            })
                        });
                    }
                } catch (e) { console.warn("Auto-register failed:", e); }
            };
            autoRegister();
        } else {
            const existing = participants.find(p => p.id === currentUserId);
            if (existing && (!existing.name || existing.name === 'Unknown') && currentUserName) {
                const updateName = async () => {
                    try {
                        const roomSnap = await getDoc(roomRef);
                        if (roomSnap.exists()) {
                            const curr = roomSnap.data().participants || [];
                            const updated = curr.map(p => p.id === currentUserId ? { ...p, name: currentUserName } : p);
                            await updateDoc(roomRef, { participants: updated });
                        }
                    } catch (e) { /* ignore */ }
                };
                updateName();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, loading, currentUserName, roomId]);

    // Update lastRead receipt when viewing messages
    useEffect(() => {
        if (!currentUserId || !roomId || !messages.length) return;
        const receiptRef = doc(db, 'chatRooms', roomId, 'readReceipts', currentUserId);
        setDoc(receiptRef, { lastRead: Date.now(), updatedAt: serverTimestamp() }, { merge: true }).catch(() => { });
    }, [currentUserId, roomId, messages.length]);

    const isUserOnline = useCallback((userId) => {
        const data = presenceMap[userId];
        if (!data || data.online === false) return false;
        return data.lastSeen && (Date.now() - data.lastSeen) < ONLINE_THRESHOLD;
    }, [presenceMap]);

    const onlineCount = useMemo(() => {
        return participants.filter(p => isUserOnline(p.id)).length;
    }, [participants, isUserOnline]);

    // Add participant (teacher/admin only)
    const addParticipant = useCallback(async (userId, userName, userRole, userClass, userSection) => {
        if (currentUserRole === 'student' || !roomRef) return;
        try {
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
                const curr = roomSnap.data().participants || [];
                if (curr.some(p => p.id === userId)) throw new Error('Already a participant');
                await updateDoc(roomRef, {
                    participants: arrayUnion({
                        id: userId, name: userName, role: userRole,
                        class: userClass || null, section: userSection || null,
                        joinedAt: new Date().toISOString()
                    })
                });
            }
        } catch (err) { console.error("Error adding participant:", err); throw err; }
    }, [roomRef, currentUserRole]);

    // Remove participant
    const removeParticipant = useCallback(async (userId) => {
        if (currentUserRole === 'student' || !roomRef) return;
        try {
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
                const updated = (roomSnap.data().participants || []).filter(p => p.id !== userId);
                await updateDoc(roomRef, { participants: updated });
            }
        } catch (err) { console.error("Error removing participant:", err); throw err; }
    }, [roomRef, currentUserRole]);

    // Send message
    const sendMessage = async (text, file = null, senderName) => {
        if (!roomRef || !messagesRef) return;
        try {
            if (!chatSettings?.allowStudentMessages && currentUserRole === 'student') {
                throw new Error("Students are currently not allowed to send messages.");
            }

            let fileUrl = null, fileName = null, fileType = null;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('roomId', roomId);
                const API_URL = process.env.REACT_APP_API_URL;
                const response = await fetch(`${API_URL}/api/chat/upload`, { method: 'POST', body: formData });
                if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Upload failed'); }
                const data = await response.json();
                fileUrl = data.url; fileName = data.fileName; fileType = data.fileType;
            }

            if (!text.trim() && !file) return;

            const messageData = {
                text: text.trim(),
                senderId: currentUserId,
                senderName: senderName,
                senderRole: currentUserRole,
                timestamp: serverTimestamp(),
                status: 'sent',
                seenBy: [currentUserId],
                reactions: {},
                edited: false,
                ...(fileUrl && { fileUrl, fileName, fileType })
            };

            await addDoc(messagesRef, messageData);
            await updateDoc(roomRef, { lastMessage: messageData, lastUpdated: serverTimestamp() });
        } catch (err) { console.error("Error sending message:", err); throw err; }
    };

    const editMessage = useCallback(async (msgId, newText) => {
        try {
            await updateDoc(doc(db, 'chatRooms', roomId, 'messages', msgId), {
                text: newText.trim(), edited: true, editedAt: serverTimestamp()
            });
        } catch (err) { throw err; }
    }, [roomId]);

    const deleteMessage = useCallback(async (msgId) => {
        try { await deleteDoc(doc(db, 'chatRooms', roomId, 'messages', msgId)); }
        catch (err) { throw err; }
    }, [roomId]);

    const reactToMessage = useCallback(async (msgId, emoji) => {
        try {
            const msgRef = doc(db, 'chatRooms', roomId, 'messages', msgId);
            const msgSnap = await getDoc(msgRef);
            if (!msgSnap.exists()) return;
            const reactions = msgSnap.data().reactions || {};
            const users = reactions[emoji] || [];
            if (users.includes(currentUserId)) {
                const updated = users.filter(id => id !== currentUserId);
                if (updated.length === 0) {
                    const newR = { ...reactions }; delete newR[emoji];
                    await updateDoc(msgRef, { reactions: newR });
                } else { await updateDoc(msgRef, { [`reactions.${emoji}`]: updated }); }
            } else {
                await updateDoc(msgRef, { [`reactions.${emoji}`]: [...users, currentUserId] });
            }
        } catch (err) { throw err; }
    }, [roomId, currentUserId]);

    const markSeen = useCallback(async (msgId) => {
        try {
            await updateDoc(doc(db, 'chatRooms', roomId, 'messages', msgId), { seenBy: arrayUnion(currentUserId) });
        } catch (err) { console.warn("markSeen failed:", err); }
    }, [roomId, currentUserId]);

    const toggleStudentMessages = async (allow) => {
        if (currentUserRole === 'student' || !roomRef) return;
        try { await updateDoc(roomRef, { 'settings.allowStudentMessages': allow }); }
        catch (err) { throw err; }
    };

    return {
        messages, chatSettings, participants, roomData,
        loading, error, roomId,
        sendMessage, editMessage, deleteMessage,
        reactToMessage, markSeen, toggleStudentMessages,
        addParticipant, removeParticipant,
        isUserOnline, onlineCount
    };
};
