import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to track unread message counts across all chat rooms a user belongs to.
 * Also provides markRoomAsRead() to clear badge when user opens a chat.
 */
export const useUnreadCount = (userId) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadByRoom, setUnreadByRoom] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    // Mark a specific room as read (call when user opens a chat)
    const markRoomAsRead = useCallback(async (roomId) => {
        if (!userId || !roomId) return;
        try {
            const receiptRef = doc(db, 'chatRooms', roomId, 'readReceipts', userId);
            await setDoc(receiptRef, {
                lastRead: Date.now(),
                updatedAt: serverTimestamp()
            }, { merge: true });
            // Trigger re-count
            setRefreshKey(k => k + 1);
        } catch (e) {
            console.warn('markRoomAsRead failed:', e);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        // Listen to chatRooms collection for changes
        const unsub = onSnapshot(collection(db, 'chatRooms'), async (snapshot) => {
            const roomsUserBelongsTo = [];

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const participants = data.participants || [];
                if (participants.some(p => p.id === userId)) {
                    roomsUserBelongsTo.push({ id: docSnap.id });
                }
            });

            let totalUnread = 0;
            const perRoom = {};

            for (const room of roomsUserBelongsTo) {
                try {
                    const receiptRef = doc(db, 'chatRooms', room.id, 'readReceipts', userId);
                    const receiptSnap = await getDoc(receiptRef);
                    const lastRead = receiptSnap.exists() ? (receiptSnap.data().lastRead || 0) : 0;

                    const messagesRef = collection(db, 'chatRooms', room.id, 'messages');
                    const msgSnapshot = await getDocs(messagesRef);
                    let roomUnread = 0;

                    msgSnapshot.forEach(msgDoc => {
                        const msgData = msgDoc.data();
                        const msgTime = msgData.timestamp?.toMillis?.() || 0;
                        if (msgTime > lastRead && msgData.senderId !== userId) {
                            roomUnread++;
                        }
                    });

                    if (roomUnread > 0) {
                        perRoom[room.id] = roomUnread;
                        totalUnread += roomUnread;
                    }
                } catch (e) { /* silently fail per room */ }
            }

            setUnreadCount(totalUnread);
            setUnreadByRoom(perRoom);
        });

        return () => unsub();
    }, [userId, refreshKey]);

    return { unreadCount, unreadByRoom, markRoomAsRead };
};
