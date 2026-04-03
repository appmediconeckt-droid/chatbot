// VoiceCallModal.jsx - Complete with Proper CSS Structure

import React, { useState, useEffect, useRef } from 'react';
import './VoiceCallModal.css';

const VoiceCallModal = ({ isOpen, onClose, callData, currentUser }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [showSettings, setShowSettings] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(70);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isConnecting, setIsConnecting] = useState(true);
    
    // Complete call data states
    const [callerInfo, setCallerInfo] = useState({
        name: '',
        id: '',
        email: '',
        phone: '',
        specialization: '',
        profilePic: ''
    });
    
    const [userInfo, setUserInfo] = useState({
        name: '',
        id: '',
        email: '',
        phone: '',
        role: ''
    });
    
    const [callMetadata, setCallMetadata] = useState({
        callId: '',
        roomId: '',
        type: 'voice',
        status: 'connecting',
        startTime: null,
        chatId: '',
        apiCallData: null,
        isFallback: false
    });

    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Process callData when modal opens
    useEffect(() => {
        if (isOpen && callData) {
            console.log('Voice Call Modal - Received callData:', callData);
            
            // Set caller (counselor) information
            setCallerInfo({
                name: callData.counselorName || callData.name || 'Counselor',
                id: callData.counselorId || callData.id,
                email: callData.counselorEmail || callData.email,
                phone: callData.counselorPhone || callData.phoneNumber,
                specialization: callData.counselorSpecialization || 'Mental Health Professional',
                profilePic: callData.profilePic || callData.avatar
            });
            
            // Set user information
            if (currentUser) {
                setUserInfo({
                    name: currentUser.name || currentUser.fullName || 'User',
                    id: currentUser.id || currentUser._id,
                    email: currentUser.email,
                    phone: currentUser.phoneNumber || currentUser.phone,
                    role: currentUser.role || 'user'
                });
            } else if (callData.userName) {
                setUserInfo({
                    name: callData.userName,
                    id: callData.userId,
                    email: callData.userEmail,
                    phone: callData.userPhone,
                    role: 'user'
                });
            }
            
            // Set call metadata
            setCallMetadata({
                callId: callData.callId || `call_${Date.now()}`,
                roomId: callData.roomId || `room_${Date.now()}`,
                type: callData.type || 'voice',
                status: callData.status || 'connecting',
                startTime: callData.startTime || new Date().toISOString(),
                chatId: callData.chatId,
                apiCallData: callData.apiCallData || null,
                isFallback: callData.isFallback || false
            });
            
            setCallDuration(0);
            setIsConnecting(true);
            
            // Simulate connection after 2 seconds
            setTimeout(() => {
                setIsConnecting(false);
                setCallMetadata(prev => ({ ...prev, status: 'connected' }));
            }, 2000);
        }
    }, [isOpen, callData, currentUser]);

    useEffect(() => {
        if (isOpen && !isConnecting) {
            initializeAudio();
        }

        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen, isConnecting]);

    // Call duration timer
    useEffect(() => {
        let timer;
        if (isOpen && isCallActive && callMetadata.startTime && callMetadata.status === 'connected') {
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isOpen, isCallActive, callMetadata.status]);

    // Simulate connection quality changes
    useEffect(() => {
        if (isOpen && isCallActive) {
            const qualityInterval = setInterval(() => {
                const qualities = ['good', 'medium', 'poor'];
                const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
                setConnectionQuality(randomQuality);
            }, 10000);
            return () => clearInterval(qualityInterval);
        }
    }, [isOpen, isCallActive]);

    // Handle audio mute/unmute
    useEffect(() => {
        if (mediaStreamRef.current) {
            const audioTracks = mediaStreamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsMuted(false);
            setIsSpeakerOn(false);
            setCallDuration(0);
            setIsCallActive(true);
            setIsRecording(false);
            setShowSettings(false);
            setIsConnecting(true);
            setCallMetadata(prev => ({ ...prev, status: 'ended' }));

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isOpen]);

    const initializeAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            if (!isMuted) {
                const audioTracks = stream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = true;
                });
            }

            // Initialize audio context for visualizer
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            sourceNodeRef.current.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            const updateAudioLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const level = Math.min(100, (average / 255) * 100);
                setAudioLevel(level);
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };
            
            updateAudioLevel();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setCallMetadata(prev => ({ ...prev, status: 'microphone_error' }));
        }
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setCallMetadata(prev => ({ ...prev, status: 'ended' }));

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            console.log('Started recording call');
            setTimeout(() => {
                setIsRecording(false);
                console.log('Stopped recording call');
            }, 30000);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getQualityIcon = () => {
        switch (connectionQuality) {
            case 'good': return '📶';
            case 'medium': return '📶';
            case 'poor': return '📶';
            default: return '📶';
        }
    };

    const getQualityClass = () => {
        switch (connectionQuality) {
            case 'good': return 'quality-good';
            case 'medium': return 'quality-medium';
            case 'poor': return 'quality-poor';
            default: return 'quality-good';
        }
    };

    const getCallStatusDisplay = () => {
        if (isConnecting) return 'Connecting...';
        switch (callMetadata.status) {
            case 'connected':
                return 'Connected';
            case 'ended':
                return 'Call Ended';
            case 'microphone_error':
                return 'Microphone Error';
            default:
                return callMetadata.status;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="voice-modal-overlay">
            <div className="voice-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="voice-modal-header">
                    <div className="header-left">
                        <span className="header-icon">📞</span>
                        <div className="call-info">
                            <h3>Voice Call with {callerInfo.name}</h3>
                            {callerInfo.specialization && (
                                <p className="caller-specialization">{callerInfo.specialization}</p>
                            )}
                            <div className={`connection-quality ${getQualityClass()}`}>
                                <span className="quality-icon">{getQualityIcon()}</span>
                                <span className="quality-text">{connectionQuality}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="header-btn close-btn" onClick={onClose} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="voice-modal-content">
                    <div className="voice-call-container">
                        <div className="caller-profile">
                            {callerInfo.profilePic && (callerInfo.profilePic.startsWith('http') || callerInfo.profilePic.startsWith('/')) ? (
                                <img 
                                    src={callerInfo.profilePic} 
                                    alt={callerInfo.name}
                                    className="caller-avatar-image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<span class="caller-avatar">${callerInfo.name.charAt(0)}</span>`;
                                    }}
                                />
                            ) : (
                                <div className="caller-avatar">
                                    {callerInfo.profilePic || callerInfo.name.charAt(0)}
                                </div>
                            )}
                            <h2 className="caller-name">{callerInfo.name}</h2>
                            {callerInfo.specialization && (
                                <p className="caller-specialization-text">{callerInfo.specialization}</p>
                            )}
                            <p className="call-status">
                                <span className={`status-${callMetadata.status}`}>
                                    {callMetadata.status === 'connected' && <span className="pulse-dot"></span>}
                                    {getCallStatusDisplay()}
                                </span>
                            </p>
                            {isCallActive && callMetadata.status === 'connected' && (
                                <div className="call-duration">
                                    <span className="duration-icon">⏱️</span>
                                    <span className="duration-text">{formatTime(callDuration)}</span>
                                </div>
                            )}
                            {callMetadata.isFallback && (
                                <p className="fallback-warning">⚠️ Using fallback connection</p>
                            )}
                        </div>

                        {!isConnecting && callMetadata.status === 'connected' && (
                            <div className="audio-visualizer">
                                <div className="visualizer-bars">
                                    {[...Array(20)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="visualizer-bar"
                                            style={{ 
                                                height: `${Math.max(5, Math.min(50, audioLevel * (i + 1) / 20))}px`,
                                                opacity: isMuted ? 0.3 : 1
                                            }}
                                        />
                                    ))}
                                </div>
                                {isMuted && (
                                    <div className="muted-badge">
                                        <span>🔇 Microphone Muted</span>
                                    </div>
                                )}
                                {isRecording && (
                                    <div className="recording-badge">
                                        <span className="recording-dot"></span>
                                        <span>Recording</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {showSettings && (
                            <div className="settings-panel">
                                <h4>Call Settings</h4>
                                <div className="setting-item">
                                    <label>Volume</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volumeLevel}
                                        onChange={(e) => setVolumeLevel(e.target.value)}
                                    />
                                    <span>{volumeLevel}%</span>
                                </div>
                                <div className="setting-item">
                                    <label>Call Information</label>
                                    <div className="caller-info-display">
                                        <p><strong>Counselor:</strong> {callerInfo.name}</p>
                                        {callerInfo.specialization && <p><strong>Specialization:</strong> {callerInfo.specialization}</p>}
                                        {callerInfo.email && <p><strong>Email:</strong> {callerInfo.email}</p>}
                                        {callerInfo.phone && <p><strong>Phone:</strong> {callerInfo.phone}</p>}
                                        
                                        <p><strong>User:</strong> {userInfo.name}</p>
                                        {userInfo.email && <p><strong>User Email:</strong> {userInfo.email}</p>}
                                        
                                        <p><strong>Call Type:</strong> 📞 Voice Call</p>
                                        <p><strong>Duration:</strong> {formatTime(callDuration)}</p>
                                        {callMetadata.roomId && <p><strong>Room ID:</strong> {callMetadata.roomId.substring(0, 8)}...</p>}
                                        {callMetadata.callId && <p><strong>Call ID:</strong> {callMetadata.callId.substring(0, 8)}...</p>}
                                        {callMetadata.chatId && <p><strong>Chat ID:</strong> {callMetadata.chatId.substring(0, 8)}...</p>}
                                    </div>
                                </div>
                                <button className="close-settings" onClick={() => setShowSettings(false)}>
                                    Close
                                </button>
                            </div>
                        )}

                        <div className="voice-call-controls">
                            <button
                                className={`control-btn ${isMuted ? 'active' : ''}`}
                                onClick={() => setIsMuted(!isMuted)}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <span className="btn-icon">{isMuted ? '🔇' : '🎤'}</span>
                                <span className="btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>

                            <button
                                className={`control-btn ${isSpeakerOn ? 'active' : ''}`}
                                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                                title={isSpeakerOn ? ' off' : ' on'}
                            >
                                <span className="btn-icon">{isSpeakerOn ? '🔊' : '🔈'}</span>
                                <span className="btn-label">{isSpeakerOn ? 'off' : ' on'}</span>
                            </button>

                            <button
                                className={`control-btn ${isRecording ? 'active' : ''}`}
                                onClick={toggleRecording}
                                title={isRecording ? 'Stop recording' : 'Record call'}
                            >
                                <span className="btn-icon">{isRecording ? '⏹️' : '🔴'}</span>
                                <span className="btn-label">{isRecording ? 'Stop' : 'Record'}</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={() => setShowSettings(!showSettings)}
                                title="Settings"
                            >
                                <span className="btn-icon">⚙️</span>
                                <span className="btn-label">Settings</span>
                            </button>

                            <button
                                className="control-btn end-call"
                                onClick={handleEndCall}
                                title="End call"
                            >
                                <span className="btn-icon">📞</span>
                                <span className="btn-label">End</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceCallModal;