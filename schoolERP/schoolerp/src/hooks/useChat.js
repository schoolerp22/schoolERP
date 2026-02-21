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
    arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';

export const useChat = (classNum, section, currentUserId, currentUserRole) => {
    const [messages, setMessages] = useState([]);
    const [chatSettings, setChatSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const roomId = `${classNum}_${section}`;
    const roomRef = useMemo(() => doc(db, 'chatRooms', roomId), [roomId]);
    const messagesRef = useMemo(() => collection(db, 'chatRooms', roomId, 'messages'), [roomId]);

    // Initialize room and listen to messages
    useEffect(() => {
        if (!classNum || !section) return;

        let unsubscribeMessages;
        let unsubscribeSettings;

        const setupChat = async () => {
            try {
                try {
                    const roomSnap = await getDoc(roomRef);
                    if (!roomSnap.exists() && currentUserRole !== 'student') {
                        await setDoc(roomRef, {
                            classNum,
                            section,
                            createdAt: serverTimestamp(),
                            settings: {
                                allowStudentMessages: true
                            },
                            participants: [],
                            admins: [currentUserId]
                        });
                    }
                } catch (e) {
                    console.warn("Could not fetch or create room doc, proceeding with listeners...", e);
                }

                // Listen to room settings
                unsubscribeSettings = onSnapshot(roomRef, (doc) => {
                    if (doc.exists()) {
                        setChatSettings(doc.data().settings);
                    }
                });

                // Listen to messages
                const q = query(messagesRef, orderBy('timestamp', 'asc'));
                unsubscribeMessages = onSnapshot(q, (snapshot) => {
                    const fetchedMessages = [];
                    snapshot.forEach((doc) => {
                        fetchedMessages.push({ id: doc.id, ...doc.data() });
                    });
                    setMessages(fetchedMessages);
                    setLoading(false);
                }, (err) => {
                    console.error("Messages listener error:", err);
                    if (err.message.includes("offline")) {
                        setLoading(false);
                    } else {
                        setError(err.message);
                        setLoading(false);
                    }
                });

            } catch (err) {
                console.error("Chat setup error:", err);
                if (!err.message.includes("offline")) {
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
    }, [classNum, section, currentUserId, currentUserRole, roomRef, messagesRef]);

    // Send a message
    const sendMessage = async (text, file = null, senderName) => {
        try {
            if (!chatSettings?.allowStudentMessages && currentUserRole === 'student') {
                throw new Error("Students are currently not allowed to send messages in this group.");
            }

            let fileUrl = null;
            let fileName = null;
            let fileType = null;

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('roomId', roomId);

                const API_URL = process.env.REACT_APP_API_URL;
                const response = await fetch(`${API_URL}/api/chat/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || 'File upload failed');
                }

                const data = await response.json();
                fileUrl = data.url;
                fileName = data.fileName;
                fileType = data.fileType;
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

            await updateDoc(roomRef, {
                lastMessage: messageData,
                lastUpdated: serverTimestamp()
            });

        } catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    };

    // Edit a message (only own messages)
    const editMessage = useCallback(async (msgId, newText) => {
        try {
            const msgRef = doc(db, 'chatRooms', roomId, 'messages', msgId);
            await updateDoc(msgRef, {
                text: newText.trim(),
                edited: true,
                editedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error editing message:", err);
            throw err;
        }
    }, [roomId]);

    // Delete a message (only own messages)
    const deleteMessage = useCallback(async (msgId) => {
        try {
            const msgRef = doc(db, 'chatRooms', roomId, 'messages', msgId);
            await deleteDoc(msgRef);
        } catch (err) {
            console.error("Error deleting message:", err);
            throw err;
        }
    }, [roomId]);

    // React to a message (toggle emoji)
    const reactToMessage = useCallback(async (msgId, emoji) => {
        try {
            const msgRef = doc(db, 'chatRooms', roomId, 'messages', msgId);
            const msgSnap = await getDoc(msgRef);
            if (!msgSnap.exists()) return;

            const data = msgSnap.data();
            const reactions = data.reactions || {};
            const usersForEmoji = reactions[emoji] || [];

            if (usersForEmoji.includes(currentUserId)) {
                // Remove reaction
                const updated = usersForEmoji.filter(id => id !== currentUserId);
                if (updated.length === 0) {
                    const newReactions = { ...reactions };
                    delete newReactions[emoji];
                    await updateDoc(msgRef, { reactions: newReactions });
                } else {
                    await updateDoc(msgRef, { [`reactions.${emoji}`]: updated });
                }
            } else {
                // Add reaction
                await updateDoc(msgRef, {
                    [`reactions.${emoji}`]: [...usersForEmoji, currentUserId]
                });
            }
        } catch (err) {
            console.error("Error reacting to message:", err);
            throw err;
        }
    }, [roomId, currentUserId]);

    // Mark message as seen
    const markSeen = useCallback(async (msgId) => {
        try {
            const msgRef = doc(db, 'chatRooms', roomId, 'messages', msgId);
            await updateDoc(msgRef, {
                seenBy: arrayUnion(currentUserId)
            });
        } catch (err) {
            // Silently fail — not critical
            console.warn("Could not mark message as seen:", err);
        }
    }, [roomId, currentUserId]);

    // Toggle student messaging (Teachers/Admins only)
    const toggleStudentMessages = async (allow) => {
        if (currentUserRole === 'student') return;
        try {
            await updateDoc(roomRef, {
                'settings.allowStudentMessages': allow
            });
        } catch (err) {
            console.error("Error toggling settings:", err);
            throw err;
        }
    };

    return {
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
    };
};
