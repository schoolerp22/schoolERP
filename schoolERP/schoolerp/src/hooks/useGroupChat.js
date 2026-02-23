import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook for managing custom chat groups.
 * - createGroup: teacher creates a named group with selected participants
 * - listMyGroups: real-time list of groups user belongs to
 * - deleteGroup / renameGroup: group management
 */
export const useGroupChat = (currentUserId, currentUserRole, currentUserName) => {
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    // Listen to all groups where user is a participant
    useEffect(() => {
        if (!currentUserId) {
            setLoadingGroups(false);
            return;
        }

        // We query ALL group-type rooms and filter client-side for participant membership
        // (Firestore doesn't support querying inside arrays of objects)
        const q = query(
            collection(db, 'chatRooms'),
            where('type', '==', 'group')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const myGroups = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const participants = data.participants || [];
                const isMember = participants.some(p => p.id === currentUserId);
                if (isMember) {
                    myGroups.push({
                        id: docSnap.id,
                        ...data,
                        memberCount: participants.length
                    });
                }
            });
            // Sort by last activity
            myGroups.sort((a, b) => {
                const aTime = a.lastUpdated?.toMillis?.() || 0;
                const bTime = b.lastUpdated?.toMillis?.() || 0;
                return bTime - aTime;
            });
            setGroups(myGroups);
            setLoadingGroups(false);
        });

        return () => unsub();
    }, [currentUserId]);

    // Create a new group
    const createGroup = useCallback(async (groupName, participants = []) => {
        if (currentUserRole === 'student') throw new Error('Only teachers/admins can create groups');
        if (!groupName.trim()) throw new Error('Group name is required');

        try {
            // Always include the creator as a participant
            const creatorEntry = {
                id: currentUserId,
                name: currentUserName || 'Unknown',
                role: currentUserRole,
                joinedAt: new Date().toISOString()
            };

            const allParticipants = [creatorEntry];

            // Add other participants (avoid duplicates)
            participants.forEach(p => {
                if (p.id !== currentUserId) {
                    allParticipants.push({
                        id: p.id,
                        name: p.name || 'Unknown',
                        role: p.role || 'student',
                        class: p.class || null,
                        section: p.section || null,
                        joinedAt: new Date().toISOString()
                    });
                }
            });

            const docRef = await addDoc(collection(db, 'chatRooms'), {
                type: 'group',
                groupName: groupName.trim(),
                createdBy: currentUserId,
                createdByName: currentUserName || 'Unknown',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                settings: { allowStudentMessages: true },
                participants: allParticipants,
                admins: [currentUserId]
            });

            return docRef.id;
        } catch (err) {
            console.error("Error creating group:", err);
            throw err;
        }
    }, [currentUserId, currentUserRole, currentUserName]);

    // Rename a group
    const renameGroup = useCallback(async (groupId, newName) => {
        if (!newName.trim()) throw new Error('Name required');
        try {
            await updateDoc(doc(db, 'chatRooms', groupId), { groupName: newName.trim() });
        } catch (err) { throw err; }
    }, []);

    // Delete a group
    const deleteGroup = useCallback(async (groupId) => {
        try {
            // Delete all messages first
            const messagesRef = collection(db, 'chatRooms', groupId, 'messages');
            const msgSnapshot = await getDocs(messagesRef);
            const deletePromises = [];
            msgSnapshot.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            await Promise.all(deletePromises);
            // Delete the room
            await deleteDoc(doc(db, 'chatRooms', groupId));
        } catch (err) { throw err; }
    }, []);

    // Add participants to a group
    const addGroupParticipants = useCallback(async (groupId, newParticipants) => {
        try {
            const groupRef = doc(db, 'chatRooms', groupId);
            for (const p of newParticipants) {
                await updateDoc(groupRef, {
                    participants: arrayUnion({
                        id: p.id,
                        name: p.name || 'Unknown',
                        role: p.role || 'student',
                        class: p.class || null,
                        section: p.section || null,
                        joinedAt: new Date().toISOString()
                    })
                });
            }
        } catch (err) { throw err; }
    }, []);

    return {
        groups,
        loadingGroups,
        createGroup,
        renameGroup,
        deleteGroup,
        addGroupParticipants
    };
};
