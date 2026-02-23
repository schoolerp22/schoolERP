import { useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const HEARTBEAT_INTERVAL = 25000; // 25 seconds

/**
 * Global presence hook — mount once at the app level.
 * Writes to userPresence/{userId} so every chat room can check if any user is online.
 */
const useGlobalPresence = (userId) => {
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        const presenceRef = doc(db, 'userPresence', userId);

        const updatePresence = async () => {
            try {
                await setDoc(presenceRef, {
                    lastSeen: Date.now(),
                    online: true,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (e) {
                // Silently fail
            }
        };

        // Immediate update
        updatePresence();

        // Heartbeat interval
        intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

        // Update on window focus
        const handleFocus = () => updatePresence();
        const handleVisibility = () => {
            if (!document.hidden) updatePresence();
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        // Mark offline on tab close
        const handleBeforeUnload = () => {
            try {
                // Use sendBeacon or sync setDoc — best effort
                // const data = JSON.stringify({ lastSeen: 0, online: false });
                navigator.sendBeacon?.(`/__presence_offline`); // won't work but harmless
                setDoc(presenceRef, { lastSeen: 0, online: false }, { merge: true });
            } catch (e) { /* ignore */ }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Mark offline on unmount
            setDoc(presenceRef, { lastSeen: 0, online: false }, { merge: true }).catch(() => { });
        };
    }, [userId]);
};

export default useGlobalPresence;
