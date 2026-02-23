import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ICE servers for NAT traversal (works across different networks)
const getIceServers = () => {
    const servers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
    ];

    // Add TURN server if configured (required for cross-network calls)
    const turnUrl = process.env.REACT_APP_TURN_URL;
    const turnUser = process.env.REACT_APP_TURN_USERNAME;
    const turnCred = process.env.REACT_APP_TURN_CREDENTIAL;
    if (turnUrl && turnUser && turnCred) {
        servers.push({
            urls: turnUrl,
            username: turnUser,
            credential: turnCred
        });
        // Also add TCP TURN for restrictive firewalls
        servers.push({
            urls: turnUrl.replace(':443', ':443?transport=tcp'),
            username: turnUser,
            credential: turnCred
        });
    }

    return servers;
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

    // Initialize Socket.IO connection
    useEffect(() => {
        if (!userId) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected for WebRTC:', socket.id);
            socket.emit('register', userId);
        });

        // Incoming call
        socket.on('incoming-call', (data) => {
            console.log('Incoming call from:', data.fromName);
            setIncomingCall(data);
            setCallState('ringing');
            setCallType(data.callType);
            setRemoteUserId(data.from);
        });

        // Call answered — set remote description
        socket.on('call-answered', async ({ answer }) => {
            try {
                if (peerRef.current && peerRef.current.signalingState !== 'stable') {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    setCallState('connected');
                    startDurationTimer();
                }
            } catch (err) {
                console.error('Error setting remote answer:', err);
            }
        });

        // ICE candidate from remote
        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                if (peerRef.current && candidate) {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        });

        // Call rejected
        socket.on('call-rejected', ({ reason }) => {
            console.log('Call rejected:', reason);
            cleanup();
            setCallState('idle');
        });

        // Call ended by remote
        socket.on('call-ended', () => {
            console.log('Call ended by remote');
            cleanup();
            setCallState('idle');
        });

        // Call failed (user offline)
        socket.on('call-failed', ({ reason }) => {
            console.log('Call failed:', reason);
            cleanup();
            setCallState('idle');
            alert(reason || 'Call failed');
        });

        return () => {
            socket.disconnect();
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

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
    }, []);

    const createPeerConnection = useCallback((targetUserId) => {
        const pc = new RTCPeerConnection({
            iceServers: getIceServers()
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    to: targetUserId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            const remote = new MediaStream();
            event.streams[0].getTracks().forEach(track => {
                remote.addTrack(track);
            });
            setRemoteStream(remote);
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
            setCallState('calling');
            setCallType(type);
            setRemoteUserId(targetUserId);

            // Get media stream
            const constraints = {
                audio: true,
                video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Create peer connection
            const pc = createPeerConnection(targetUserId);

            // Add tracks to peer
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current.emit('call-user', {
                to: targetUserId,
                from: userId,
                fromName: userName,
                offer,
                callType: type
            });
        } catch (err) {
            console.error('Error starting call:', err);
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

        try {
            const constraints = {
                audio: true,
                video: incomingCall.callType === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection(incomingCall.from);

            // Add tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Set remote description (offer)
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('call-accepted', {
                to: incomingCall.from,
                answer
            });

            setCallState('connected');
            setIncomingCall(null);
            startDurationTimer();
        } catch (err) {
            console.error('Error answering call:', err);
            cleanup();
            setCallState('idle');
            if (err.name === 'NotAllowedError') {
                alert('Please allow camera/microphone access to answer calls.');
            }
        }
    }, [incomingCall, createPeerConnection, cleanup]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit('call-rejected', {
                to: incomingCall.from,
                reason: 'Call rejected'
            });
        }
        cleanup();
        setCallState('idle');
    }, [incomingCall, cleanup]);

    // End call
    const endCall = useCallback(() => {
        if (remoteUserId && socketRef.current) {
            socketRef.current.emit('end-call', { to: remoteUserId });
        }
        cleanup();
        setCallState('idle');
    }, [remoteUserId, cleanup]);

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

    // Screen sharing
    const shareScreen = useCallback(async () => {
        if (!peerRef.current) return;

        if (isScreenSharing) {
            // Stop screen sharing - revert to camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            // Replace screen track with original camera track
            if (originalVideoTrackRef.current) {
                const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(originalVideoTrackRef.current);
                }
                // Update local stream
                if (localStreamRef.current) {
                    const oldTrack = localStreamRef.current.getVideoTracks()[0];
                    if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
                    localStreamRef.current.addTrack(originalVideoTrackRef.current);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                }
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: true
                });
                screenStreamRef.current = screenStream;

                const screenTrack = screenStream.getVideoTracks()[0];

                // Save original camera track
                const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    originalVideoTrackRef.current = sender.track;
                    await sender.replaceTrack(screenTrack);
                }

                // Update local stream to show screen
                if (localStreamRef.current) {
                    const oldTrack = localStreamRef.current.getVideoTracks()[0];
                    if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
                    localStreamRef.current.addTrack(screenTrack);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                }

                // Handle screen share stop (user clicks "Stop sharing")
                screenTrack.onended = () => {
                    shareScreen(); // Will toggle off
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error('Screen share error:', err);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
