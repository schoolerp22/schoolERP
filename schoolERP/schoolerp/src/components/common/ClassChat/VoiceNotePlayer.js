import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';

const VoiceNotePlayer = ({ url, senderId, currentUserId }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const isMine = senderId === currentUserId;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[200px] sm:min-w-[250px] ${isMine ? 'bg-blue-700 text-white shadow-inner' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
            <button
                onClick={togglePlay}
                className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all active:scale-95 ${isMine ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            <div className="flex-1 flex flex-col gap-1">
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    step="0.1"
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500 voice-progress"
                />
                <div className="flex justify-between text-[10px] opacity-70 font-bold tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <a
                href={url}
                download="voice-note.webm"
                className={`p-2 rounded-full transition-colors ${isMine ? 'hover:bg-blue-600 text-blue-200' : 'hover:bg-gray-200 text-gray-500'}`}
                title="Download"
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noreferrer"
            >
                <Download size={18} />
            </a>

            <audio ref={audioRef} src={url} preload="metadata" />
        </div>
    );
};

export default VoiceNotePlayer;
