import React, { useRef, useEffect } from 'react';
import {
    Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
    Monitor, MonitorOff, Circle, StopCircle,  PhoneIncoming
} from 'lucide-react';
import './CallModal.css';

const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const CallModal = ({
    callState,       // idle | calling | ringing | connected
    callType,        // video | audio
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isRecording,
    incomingCall,
    callDuration,
    onAnswer,
    onReject,
    onEndCall,
    onToggleMic,
    onToggleCamera,
    onShareScreen,
    onStartRecording,
    onStopRecording
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Don't render if idle
    if (callState === 'idle') return null;

    const isVideoCall = callType === 'video';

    return (
        <div className="call-modal-overlay">
            <div className={`call-modal ${isVideoCall ? 'video-mode' : 'audio-mode'}`}>

                {/* ──── Incoming Call Screen ──── */}
                {callState === 'ringing' && incomingCall && (
                    <div className="call-incoming">
                        <div className="call-pulse-ring" />
                        <div className="caller-avatar">
                            {incomingCall.fromName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <h2 className="caller-name">{incomingCall.fromName || 'Unknown'}</h2>
                        <p className="call-type-label">
                            Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call...
                        </p>
                        <div className="incoming-actions">
                            <button className="call-btn reject" onClick={onReject}>
                                <PhoneOff size={24} />
                                <span>Decline</span>
                            </button>
                            <button className="call-btn accept" onClick={onAnswer}>
                                <PhoneIncoming size={24} />
                                <span>Accept</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── Calling Screen (waiting for answer) ──── */}
                {callState === 'calling' && (
                    <div className="call-outgoing">
                        <div className="call-pulse-ring" />
                        <div className="caller-avatar calling">
                            <Phone size={32} className="phone-ringing" />
                        </div>
                        <h2 className="caller-name">Calling...</h2>
                        <p className="call-type-label">
                            {isVideoCall ? 'Video' : 'Voice'} Call · Waiting for answer
                        </p>
                        <button className="call-btn reject mt-8" onClick={onEndCall}>
                            <PhoneOff size={24} />
                            <span>Cancel</span>
                        </button>
                    </div>
                )}

                {/* ──── Connected Call Screen ──── */}
                {callState === 'connected' && (
                    <div className="call-connected">
                        {/* Video feeds */}
                        {isVideoCall ? (
                            <div className="video-container">
                                {/* Remote video (main) */}
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="remote-video"
                                />

                                {/* Local video (PiP) */}
                                <div className={`local-video-wrapper ${isCameraOff ? 'camera-off' : ''}`}>
                                    {isCameraOff ? (
                                        <div className="camera-off-placeholder">
                                            <VideoOff size={24} />
                                        </div>
                                    ) : (
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="local-video"
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="audio-call-display">
                                <div className="audio-avatar pulse-soft">
                                    <Phone size={40} />
                                </div>
                                <h3>Voice Call Connected</h3>

                                {/* Hidden video refs for audio calls (needed for stream setup) */}
                                <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
                                <video ref={localVideoRef} autoPlay playsInline muted style={{ display: 'none' }} />
                            </div>
                        )}

                        {/* Duration + Recording indicator */}
                        <div className="call-status-bar">
                            <span className="call-duration">{formatDuration(callDuration)}</span>
                            {isRecording && (
                                <span className="recording-indicator">
                                    <Circle size={8} fill="red" /> REC
                                </span>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="call-controls">
                            <button
                                className={`control-btn ${isMuted ? 'active' : ''}`}
                                onClick={onToggleMic}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {isVideoCall && (
                                <button
                                    className={`control-btn ${isCameraOff ? 'active' : ''}`}
                                    onClick={onToggleCamera}
                                    title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                                >
                                    {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            )}

                            <button
                                className={`control-btn ${isScreenSharing ? 'active screen-share' : ''}`}
                                onClick={onShareScreen}
                                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                                {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                            </button>

                            <button
                                className={`control-btn ${isRecording ? 'active recording' : ''}`}
                                onClick={isRecording ? onStopRecording : onStartRecording}
                                title={isRecording ? 'Stop recording' : 'Start recording'}
                            >
                                {isRecording ? <StopCircle size={20} /> : <Circle size={20} />}
                            </button>

                            <button
                                className="control-btn end-call"
                                onClick={onEndCall}
                                title="End call"
                            >
                                <PhoneOff size={22} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallModal;
