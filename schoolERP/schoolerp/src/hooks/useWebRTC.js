import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Free TURN servers from openrelay.metered.ca (no API key needed, works across networks)
const FALLBACK_ICE = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    }
];

/**
 * Fetch TURN/STUN credentials from our own backend (which calls Metered server-side).
 * Secret key is never exposed to the browser.
 */
const fetchIceServers = async () => {
    try {
        const resp = await fetch(`${API_URL}/api/turn-credentials`);
        if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
        const data = await resp.json();
        const servers = data.iceServers || [];
        if (!servers.length) throw new Error('Empty ICE servers from backend');
        console.log('[WebRTC] ✅ ICE servers loaded:', servers.length, 'servers');
        console.log('[WebRTC] ICE servers:', JSON.stringify(servers, null, 2));
        return servers;
    } catch (err) {
        console.warn('[WebRTC] ⚠️ Failed to fetch ICE servers, using fallback:', err.message);
        return FALLBACK_ICE;
    }
};

/**
 * useWebRTC — manages Socket.IO connection, WebRTC peer connection, media streams.
 * 
 * Provides: startCall, answerCall, endCall, toggleMic, toggleCamera,
 *           shareScreen, startRecording, stopRecording
 */
export const useWebRTC = (userId, userName) => {
    const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected | ended
    const [callType, setCallType] = useState(null); // 'video' | 'audio'
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null); // { from, fromName, offer, callType }
    const [callDuration, setCallDuration] = useState(0);
    const [remoteUserId, setRemoteUserId] = useState(null);

    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const durationIntervalRef = useRef(null);
    const originalVideoTrackRef = useRef(null);
    const iceServersRef = useRef(FALLBACK_ICE);
    const pendingCandidatesRef = useRef([]); // Queue ICE candidates before remote desc is set
    const ringtoneRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'));

    // Configure ringtone
    useEffect(() => {
        const ringtone = ringtoneRef.current;
        ringtone.loop = true;
        
        // Request Notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            ringtone.pause();
            ringtone.currentTime = 0;
        };
    }, []);

    const playRingtone = useCallback(() => {
        ringtoneRef.current.play().catch(err => {
            console.warn('[WebRTC] 🔊 Ringtone autoplay blocked:', err.message);
        });
    }, []);

    const stopRingtone = useCallback(() => {
        const ringtone = ringtoneRef.current;
        ringtone.pause();
        ringtone.currentTime = 0;
    }, []);

    const showCallNotification = useCallback((fromName, type) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Incoming ${type} Call`, {
                body: `${fromName} is calling you...`,
                icon: '/logo192.png', // Fallback to app logo
                tag: 'incoming-call',
                renotify: true,
                silent: true // We handle audio separately via ringtoneRef
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }, []);

    // Fetch Metered ICE servers on mount
    useEffect(() => {
        fetchIceServers().then(servers => {
            iceServersRef.current = servers;
        });
    }, []);

    // Initialize Socket.IO connection
    useEffect(() => {
        if (!userId) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WebRTC] ✅ Socket connected:', socket.id, '| userId:', userId);
            socket.emit('register', userId);
        });

        socket.on('connect_error', (err) => {
            console.error('[WebRTC] ❌ Socket connection error:', err.message);
        });

        // Incoming call
        socket.on('incoming-call', (data) => {
            console.log('[WebRTC] 📞 Incoming call from:', data.fromName, '| type:', data.callType);
            setIncomingCall(data);
            setCallState('ringing');
            setCallType(data.callType);
            setRemoteUserId(data.from);
            
            // Play ringtone and show notification
            playRingtone();
            showCallNotification(data.fromName, data.callType);
        });

        // Call answered — set remote description (caller side)
        socket.on('call-answered', async ({ answer }) => {
            stopRingtone(); // Stop ringtone when caller sees it's answered
            try {
                const pc = peerRef.current;
                console.log('[WebRTC] 📥 call-answered received | signalingState:', pc?.signalingState);
                if (pc && pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('[WebRTC] ✅ Remote answer set on caller');
                    // Flush queued ICE candidates
                    for (const c of pendingCandidatesRef.current) {
                        await pc.addIceCandidate(new RTCIceCandidate(c));
                    }
                    console.log('[WebRTC] ICE queue flushed:', pendingCandidatesRef.current.length, 'candidates');
                    pendingCandidatesRef.current = [];
                    setCallState('connected');
                    startDurationTimer();
                } else {
                    console.warn('[WebRTC] ⚠️ Skipped setRemoteDescription — unexpected signalingState:', pc?.signalingState);
                }
            } catch (err) {
                console.error('[WebRTC] ❌ Error setting remote answer:', err);
            }
        });

        // ICE candidate from remote — queue if remote desc not set yet
        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                if (!candidate) return;
                const pc = peerRef.current;
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    console.log('[WebRTC] 🕐 Queuing ICE candidate (remote desc not set yet)');
                    pendingCandidatesRef.current.push(candidate);
                }
            } catch (err) {
                console.error('[WebRTC] ❌ Error adding ICE candidate:', err);
            }
        });

        // Call rejected
        socket.on('call-rejected', ({ reason }) => {
            console.log('Call rejected:', reason);
            stopRingtone();
            cleanup();
            setCallState('idle');
        });

        // Call ended by remote
        socket.on('call-ended', () => {
            console.log('Call ended by remote');
            stopRingtone();
            cleanup();
            setCallState('idle');
        });

        // Call failed (user offline)
        socket.on('call-failed', ({ reason }) => {
            console.log('Call failed:', reason);
            stopRingtone();
            cleanup();
            setCallState('idle');
            alert(reason || 'Call failed');
        });

        return () => {
            socket.disconnect();
            stopRingtone();
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, playRingtone, stopRingtone, showCallNotification]);


    const startDurationTimer = () => {
        setCallDuration(0);
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(d => d + 1);
        }, 1000);
    };

    const cleanup = useCallback(() => {
        // Stop all local streams
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        // Close peer connection
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        // Clear timer
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsCameraOff(false);
        setIsScreenSharing(false);
        setIsRecording(false);
        setIncomingCall(null);
        setCallDuration(0);
        setRemoteUserId(null);
        recordedChunksRef.current = [];
        pendingCandidatesRef.current = []; // clear ICE queue
    }, []);

    const createPeerConnection = useCallback((targetUserId) => {
        const servers = Array.isArray(iceServersRef.current) ? iceServersRef.current : FALLBACK_ICE;
        const pc = new RTCPeerConnection({
            iceServers: servers
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                console.log('[WebRTC] 🧊 Sending ICE candidate to', targetUserId);
                socketRef.current.emit('ice-candidate', {
                    to: targetUserId,
                    candidate: event.candidate
                });
            } else if (!event.candidate) {
                console.log('[WebRTC] 🧊 ICE gathering complete');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                // 'failed' = unrecoverable, end the call
                console.warn('[WebRTC] ❌ ICE failed — ending call');
                endCall();
            } else if (pc.iceConnectionState === 'disconnected') {
                // 'disconnected' is TRANSIENT — network hiccup, do NOT end call
                // It may recover to 'connected' on its own
                console.warn('[WebRTC] ⚠️ ICE disconnected (transient) — waiting to see if it recovers');
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Peer connection state:', pc.connectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log('[WebRTC] Signaling state:', pc.signalingState);
        };

        // Use a stable MediaStream ref so all tracks accumulate (ontrack fires per-track)
        const remoteStream = new MediaStream();
        pc.remoteStreamRef = remoteStream; // attach to pc so we can reference it

        pc.ontrack = (event) => {
            console.log('ontrack fired:', event.track.kind, event.track.readyState);

            if (event.streams && event.streams[0]) {
                // Prefer the stream from the event — most reliable
                setRemoteStream(event.streams[0]);
            } else {
                // Fallback: accumulate tracks manually
                event.track.onunmute = () => {
                    pc.remoteStreamRef.addTrack(event.track);
                    setRemoteStream(new MediaStream(pc.remoteStreamRef.getTracks()));
                };
                if (event.track.readyState === 'live') {
                    pc.remoteStreamRef.addTrack(event.track);
                    setRemoteStream(new MediaStream(pc.remoteStreamRef.getTracks()));
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                console.log('ICE connection failed/disconnected');
                endCall();
            }
        };

        peerRef.current = pc;
        return pc;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Start a call (caller side)
    const startCall = useCallback(async (targetUserId, type = 'video') => {
        try {
            console.log('[WebRTC] 📤 Starting', type, 'call to:', targetUserId);
            setCallState('calling');
            setCallType(type);
            setRemoteUserId(targetUserId);

            const constraints = {
                audio: true,
                video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
            };
            console.log('[WebRTC] Getting user media with constraints:', JSON.stringify(constraints));
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[WebRTC] ✅ Got local stream — tracks:', stream.getTracks().map(t => t.kind + ':' + t.readyState));
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection(targetUserId);

            stream.getTracks().forEach(track => {
                console.log('[WebRTC] Adding local track to PC:', track.kind);
                pc.addTrack(track, stream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('[WebRTC] ✅ Offer created & set as local description');

            socketRef.current.emit('call-user', {
                to: targetUserId,
                from: userId,
                fromName: userName,
                offer,
                callType: type
            });
            console.log('[WebRTC] 📡 call-user emitted to:', targetUserId);
        } catch (err) {
            console.error('[WebRTC] ❌ Error starting call:', err.name, err.message);
            cleanup();
            setCallState('idle');
            if (err.name === 'NotAllowedError') {
                alert('Please allow camera/microphone access to make calls.');
            } else {
                alert('Failed to start call: ' + err.message);
            }
        }
    }, [userId, userName, createPeerConnection, cleanup]);

    // Answer an incoming call
    const answerCall = useCallback(async () => {
        if (!incomingCall) return;
        stopRingtone();

        try {
            console.log('[WebRTC] 📥 Answering', incomingCall.callType, 'call from:', incomingCall.from);
            const constraints = {
                audio: true,
                video: incomingCall.callType === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[WebRTC] ✅ Got local stream — tracks:', stream.getTracks().map(t => t.kind + ':' + t.readyState));
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection(incomingCall.from);

            // Add local tracks BEFORE setting remote description
            stream.getTracks().forEach(track => {
                console.log('[WebRTC] Adding local track to PC:', track.kind);
                pc.addTrack(track, stream);
            });

            // Set remote description (offer from caller)
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            console.log('[WebRTC] ✅ Remote offer set on callee | signalingState:', pc.signalingState);

            // Flush any queued ICE candidates
            console.log('[WebRTC] Flushing', pendingCandidatesRef.current.length, 'queued ICE candidates');
            for (const c of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('[WebRTC] ✅ Answer created & set as local description');

            socketRef.current.emit('call-accepted', {
                to: incomingCall.from,
                answer
            });
            console.log('[WebRTC] 📡 call-accepted emitted');

            setCallState('connected');
            setIncomingCall(null);
            startDurationTimer();
        } catch (err) {
            console.error('[WebRTC] ❌ Error answering call:', err.name, err.message);
            cleanup();
            setCallState('idle');
            if (err.name === 'NotAllowedError') {
                alert('Please allow camera/microphone access to answer calls.');
            }
        }
    }, [incomingCall, createPeerConnection, cleanup, stopRingtone]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit('call-rejected', {
                to: incomingCall.from,
                reason: 'Call rejected'
            });
        }
        stopRingtone();
        cleanup();
        setCallState('idle');
    }, [incomingCall, cleanup, stopRingtone]);

    // End call
    const endCall = useCallback(() => {
        if (remoteUserId && socketRef.current) {
            socketRef.current.emit('end-call', { to: remoteUserId });
        }
        stopRingtone();
        cleanup();
        setCallState('idle');
    }, [remoteUserId, cleanup, stopRingtone]);

    // Toggle microphone
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    }, []);

    // Ref-based stop so onended always has fresh reference (avoids stale closure)
    const stopScreenShareRef = useRef(null);

    // Screen sharing
    const shareScreen = useCallback(async () => {
        if (!peerRef.current) return;

        // getDisplayMedia is desktop-only — not available on mobile browsers
        if (!navigator.mediaDevices?.getDisplayMedia) {
            alert('Screen sharing is not supported on mobile browsers. Please use a desktop browser.');
            return;
        }

        if (isScreenSharing) {
            // --- Stop screen sharing ---
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            // Restore original camera track (video calls only)
            if (originalVideoTrackRef.current) {
                const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(originalVideoTrackRef.current);
                }
                if (localStreamRef.current) {
                    const screenTrack = localStreamRef.current.getVideoTracks()[0];
                    if (screenTrack) localStreamRef.current.removeTrack(screenTrack);
                    localStreamRef.current.addTrack(originalVideoTrackRef.current);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                }
                originalVideoTrackRef.current = null;
            }
            setIsScreenSharing(false);
        } else {
            // --- Start screen sharing ---
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false           // avoids echo — local mic handles audio
                });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                const videoSender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');

                if (videoSender) {
                    // Video call: replace existing video track
                    originalVideoTrackRef.current = videoSender.track;
                    await videoSender.replaceTrack(screenTrack);
                } else {
                    // Audio call: add screen track as new sender
                    peerRef.current.addTrack(screenTrack, screenStream);
                    originalVideoTrackRef.current = null; // nothing to restore
                }

                // Update local preview
                if (localStreamRef.current) {
                    const oldVideo = localStreamRef.current.getVideoTracks()[0];
                    if (oldVideo) localStreamRef.current.removeTrack(oldVideo);
                    localStreamRef.current.addTrack(screenTrack);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                }

                // Use ref so onended always calls up-to-date stop logic (no stale closure)
                stopScreenShareRef.current = async () => {
                    if (screenStreamRef.current) {
                        screenStreamRef.current.getTracks().forEach(t => t.stop());
                        screenStreamRef.current = null;
                    }
                    if (originalVideoTrackRef.current) {
                        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) await sender.replaceTrack(originalVideoTrackRef.current);
                        if (localStreamRef.current) {
                            const st = localStreamRef.current.getVideoTracks()[0];
                            if (st) localStreamRef.current.removeTrack(st);
                            localStreamRef.current.addTrack(originalVideoTrackRef.current);
                            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                        }
                        originalVideoTrackRef.current = null;
                    }
                    setIsScreenSharing(false);
                };

                // When user clicks "Stop sharing" in browser UI
                screenTrack.onended = () => {
                    if (stopScreenShareRef.current) stopScreenShareRef.current();
                };

                setIsScreenSharing(true);
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('Screen share error:', err);
                    alert('Screen share failed: ' + err.message);
                }
                // NotAllowedError = user cancelled — silent
            }
        }
    }, [isScreenSharing]);

    // Start recording
    const startRecording = useCallback(() => {
        if (!localStreamRef.current || !remoteStream) return;

        try {
            // Combine local + remote audio, and remote video (or local if screen sharing)
            const combinedStream = new MediaStream();

            // Add remote tracks
            remoteStream.getTracks().forEach(track => combinedStream.addTrack(track));

            // Add local audio
            localStreamRef.current.getAudioTracks().forEach(track => combinedStream.addTrack(track.clone()));

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                    ? 'video/webm;codecs=vp9'
                    : 'video/webm'
            });

            recordedChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `call_recording_${new Date().toISOString().slice(0, 19)}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };

            recorder.start(1000); // collect data every second
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
            alert('Recording failed: ' + err.message);
        }
    }, [remoteStream]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    return {
        // State
        callState,
        callType,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        isScreenSharing,
        isRecording,
        incomingCall,
        callDuration,
        remoteUserId,
        // Actions
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
        shareScreen,
        startRecording,
        stopRecording
    };
};
