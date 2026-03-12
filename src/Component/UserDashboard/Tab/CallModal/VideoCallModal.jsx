// VideoCallModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import './VideoCallModal.css';

const VideoCallModal = ({ isOpen, onClose, callData }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCameraSwitched, setIsCameraSwitched] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isCameraInitialized, setIsCameraInitialized] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState('');
    const [isPiPMode, setIsPiPMode] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [showSettings, setShowSettings] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(70);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const pipWindowRef = useRef(null);

    const defaultCallData = {
        id: 1,
        name: "Dr. Priya Sharma",
        profilePic: "👩‍⚕️",
        type: "video",
        status: "connected"
    };

    const activeCall = callData || defaultCallData;

    useEffect(() => {
        if (isOpen && !isCameraInitialized) {
            initializeCamera();
            getAvailableCameras();
        }

        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        let timer;
        if (isOpen && isCallActive) {
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isOpen, isCallActive]);

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

    useEffect(() => {
        if (mediaStreamRef.current) {
            const videoTracks = mediaStreamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isVideoEnabled;
            });
        }
    }, [isVideoEnabled]);

    useEffect(() => {
        if (mediaStreamRef.current) {
            const audioTracks = mediaStreamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);

    useEffect(() => {
        if (!isOpen) {
            setIsMuted(false);
            setIsSpeakerOn(false);
            setIsVideoEnabled(true);
            setIsCameraSwitched(false);
            setCallDuration(0);
            setIsCallActive(true);
            setIsFullScreen(false);
            setIsRecording(false);
            setIsCameraInitialized(false);
            setIsPiPMode(false);
            setIsScreenSharing(false);
            setShowSettings(false);

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }

            if (pipWindowRef.current) {
                pipWindowRef.current.close();
                pipWindowRef.current = null;
            }
        }
    }, [isOpen]);

    const initializeCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: isCameraSwitched ? 'user' : 'environment'
                },
                audio: true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            if (remoteVideoRef.current) {
                remoteVideoRef.current.poster = '/api/placeholder/1280/720';
            }

            setIsCameraInitialized(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const getAvailableCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setAvailableCameras(videoDevices);
            if (videoDevices.length > 0) {
                setCurrentCamera(videoDevices[0].deviceId);
            }
        } catch (error) {
            console.error('Error getting cameras:', error);
        }
    };

    const switchCamera = async () => {
        setIsCameraSwitched(!isCameraSwitched);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            await initializeCamera();
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });

                if (mediaStreamRef.current) {
                    const videoTrack = screenStream.getVideoTracks()[0];
                    const audioTracks = mediaStreamRef.current.getAudioTracks();

                    const newStream = new MediaStream([videoTrack, ...audioTracks]);
                    mediaStreamRef.current = newStream;

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = newStream;
                    }
                }

                setIsScreenSharing(true);

                screenStream.getVideoTracks()[0].onended = () => {
                    setIsScreenSharing(false);
                    initializeCamera();
                };
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            setIsScreenSharing(false);
            initializeCamera();
        }
    };

    const togglePiPMode = async () => {
        if (!isPiPMode) {
            try {
                if (document.pictureInPictureEnabled && remoteVideoRef.current) {
                    await remoteVideoRef.current.requestPictureInPicture();
                    setIsPiPMode(true);
                }
            } catch (error) {
                console.error('PiP mode error:', error);
            }
        } else {
            try {
                await document.exitPictureInPicture();
                setIsPiPMode(false);
            } catch (error) {
                console.error('Exit PiP error:', error);
            }
        }
    };

    const handleEndCall = () => {
        setIsCallActive(false);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
            onClose();
        }, 1000);
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

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullScreen(!isFullScreen);
    };

    const takeScreenshot = () => {
        if (remoteVideoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = remoteVideoRef.current.videoWidth;
            canvas.height = remoteVideoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(remoteVideoRef.current, 0, 0);

            const link = document.createElement('a');
            link.download = `screenshot-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
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

    if (!isOpen) return null;

    return (
        <div className={`video-modal-overlay ${isFullScreen ? 'fullscreen' : ''}`} onClick={onClose}>
            <div
                className={`video-modal-container ${isFullScreen ? 'fullscreen' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="video-modal-header">
                    <div className="header-left">
                        <span className="header-icon">📹</span>
                        <div className="call-info">
                            <h3>Video Call with {activeCall.name}</h3>
                            <div className={`connection-quality ${getQualityClass()}`}>
                                <span className="quality-icon">{getQualityIcon()}</span>
                                <span className="quality-text">{connectionQuality}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="header-btn" onClick={toggleFullScreen} title="Full screen">
                            {isFullScreen ? '🗗️' : '🗖'}
                        </button>
                        <button className="header-btn close-btn" onClick={onClose} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="video-modal-content">
                    {/* Main Video Area */}
                    <div className="video-main-area">
                        {/* Remote Video (Large) */}
                        <div className="remote-video-container">
                            {isVideoEnabled ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        className="remote-video"
                                        autoPlay
                                        playsInline
                                        poster="/api/placeholder/1280/720"
                                    >
                                        <source src="/api/placeholder/video" type="video/mp4" />
                                    </video>
                                    <div className="remote-video-overlay">
                                        <div className="remote-video-placeholder">
                                            <span className="remote-avatar">{activeCall.profilePic}</span>
                                            <div className="remote-info">
                                                <h2>{activeCall.name}</h2>
                                                <p className="call-status">
                                                    {isCallActive ? (
                                                        <span className="status-connected">
                                                            <span className="pulse-dot"></span>
                                                            Connected
                                                        </span>
                                                    ) : (
                                                        <span className="status-ended">Call Ended</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="video-disabled">
                                    <span className="video-off-icon">🚫📹</span>
                                    <p>Remote camera is off</p>
                                </div>
                            )}

                            {/* Call Duration Badge */}
                            <div className="call-duration-badge">
                                <span className="duration-icon">⏱️</span>
                                <span className="duration-text">{formatTime(callDuration)}</span>
                            </div>

                            {/* Recording Indicator */}
                            {isRecording && (
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span className="recording-text">REC</span>
                                </div>
                            )}

                            {/* Screen Sharing Indicator */}
                            {isScreenSharing && (
                                <div className="screen-share-indicator">
                                    <span className="share-icon">🖥️</span>
                                    <span className="share-text">Sharing screen</span>
                                </div>
                            )}
                        </div>

                        {/* Local Video (Picture in Picture) */}
                        <div className={`local-video-container ${!isVideoEnabled ? 'video-off' : ''}`}>
                            <video
                                ref={localVideoRef}
                                className="local-video"
                                autoPlay
                                playsInline
                                muted
                            />
                            {!isVideoEnabled && (
                                <div className="local-video-off">
                                    <span>🚫</span>
                                </div>
                            )}
                            {isMuted && (
                                <div className="muted-indicator">
                                    <span>🔇</span>
                                </div>
                            )}
                            <div className="local-video-label">
                                <span>You</span>
                            </div>
                        </div>

                        {/* Settings Panel */}
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
                                    <label>Camera</label>
                                    <select value={currentCamera} onChange={(e) => setCurrentCamera(e.target.value)}>
                                        {availableCameras.map(camera => (
                                            <option key={camera.deviceId} value={camera.deviceId}>
                                                {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button className="close-settings" onClick={() => setShowSettings(false)}>
                                    Close
                                </button>
                            </div>
                        )}

                        {/* Call Controls */}
                        <div className="video-call-controls">
                            <button
                                className={`control-btn ${isMuted ? 'active' : ''}`}
                                onClick={() => setIsMuted(!isMuted)}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <span className="btn-icon">{isMuted ? '🔇' : '🎤'}</span>
                                <span className="btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>

                            <button
                                className={`control-btn ${!isVideoEnabled ? 'active' : ''}`}
                                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                            >
                                <span className="btn-icon">{isVideoEnabled ? '📹' : '🚫'}</span>
                                <span className="btn-label">{isVideoEnabled ? 'Camera off' : 'Camera on'}</span>
                            </button>

                            <button
                                className={`control-btn ${isSpeakerOn ? 'active' : ''}`}
                                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                                title={isSpeakerOn ? 'Speaker off' : 'Speaker on'}
                            >
                                <span className="btn-icon">{isSpeakerOn ? '🔊' : '🔈'}</span>
                                <span className="btn-label">{isSpeakerOn ? 'Speaker off' : 'Speaker on'}</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={switchCamera}
                                title="Switch camera"
                                disabled={availableCameras.length < 2}
                            >
                                <span className="btn-icon">🔄</span>
                                <span className="btn-label">Switch</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={toggleScreenShare}
                                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                                <span className="btn-icon">{isScreenSharing ? '⏹️' : '🖥️'}</span>
                                <span className="btn-label">{isScreenSharing ? 'Stop share' : 'Share'}</span>
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

export default VideoCallModal;