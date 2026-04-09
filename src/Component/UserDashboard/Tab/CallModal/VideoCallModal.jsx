// VideoCallModal.jsx - Fully Responsive with Draggable Local Video, Auto-hide Controls
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VideoCallModal.css';

const VideoCallModal = ({ isOpen, onClose, callData }) => {
    // State variables
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
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [callerName, setCallerName] = useState('');
    const [callerProfilePic, setCallerProfilePic] = useState('');
    const [callStatus, setCallStatus] = useState('connecting');
    const [callStartTime, setCallStartTime] = useState(null);
    const [showControls, setShowControls] = useState(true);
    const [localVideoPosition, setLocalVideoPosition] = useState({ x: null, y: null, bottom: 90, right: 18 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const containerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const localContainerRef = useRef(null);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

    const defaultCallData = {
        id: 1,
        name: "Dr. Priya Sharma",
        profilePic: "👩‍⚕️",
        type: "video",
        status: "connected",
        phoneNumber: "+91 98765 43210"
    };

    // Process callData when modal opens
    useEffect(() => {
        if (isOpen && callData) {
            setCallerName(callData.name || defaultCallData.name);
            setCallerProfilePic(callData.profilePic || defaultCallData.profilePic);
            setCallStatus(callData.status || 'connecting');
            setCallStartTime(new Date());
            setCallDuration(0);
        } else if (isOpen && !callData) {
            setCallerName(defaultCallData.name);
            setCallerProfilePic(defaultCallData.profilePic);
            setCallStatus(defaultCallData.status);
            setCallStartTime(new Date());
            setCallDuration(0);
        }
    }, [isOpen, callData]);

    // Initialize camera
    useEffect(() => {
        if (isOpen && !isCameraInitialized) {
            initializeCamera(false);
            getAvailableCameras();
        }

        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        };
    }, [isOpen]);

    // Call duration timer
    useEffect(() => {
        let timer;
        if (isOpen && isCallActive && callStartTime && callStatus === 'connected') {
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isOpen, isCallActive, callStartTime, callStatus]);

    // Auto-hide controls on inactivity
    useEffect(() => {
        if (isOpen && isCallActive) {
            resetControlsTimeout();
            window.addEventListener('mousemove', resetControlsTimeout);
            window.addEventListener('touchstart', resetControlsTimeout);
            return () => {
                window.removeEventListener('mousemove', resetControlsTimeout);
                window.removeEventListener('touchstart', resetControlsTimeout);
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            };
        }
    }, [isOpen, isCallActive]);

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

    // Handle video track enable/disable
    useEffect(() => {
        if (mediaStreamRef.current) {
            const videoTracks = mediaStreamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isVideoEnabled;
            });
        }
    }, [isVideoEnabled]);

    // Handle audio track mute/unmute
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
            setIsVideoEnabled(true);
            setIsCameraSwitched(false);
            setCallDuration(0);
            setIsCallActive(true);
            setIsFullScreen(false);
            setIsRecording(false);
            setIsCameraInitialized(false);
            setIsScreenSharing(false);
            setCallStatus('ended');
            setShowControls(true);
            setLocalVideoPosition({ x: null, y: null, bottom: 90, right: 18 });

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        }
    }, [isOpen]);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    const initializeCamera = async (useBackCamera = false) => {
        try {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const facingMode = useBackCamera ? 'environment' : 'user';
            
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: facingMode,
                },
                audio: true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create fake remote stream for demo (using canvas or just placeholder)
            if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                // For demo, we can create a black stream or just keep placeholder
                // Remote video will show overlay, so no need for actual stream
            }

            setIsCameraInitialized(true);
            setCallStatus('connected');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCallStatus('camera_error');
            
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                mediaStreamRef.current = fallbackStream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = fallbackStream;
                }
                setIsCameraInitialized(true);
                setCallStatus('connected');
            } catch (fallbackError) {
                console.error('Fallback camera access also failed:', fallbackError);
                setCallStatus('no_camera');
            }
        }
    };

    const getAvailableCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            const enhancedCameras = videoDevices.map(device => {
                const label = device.label.toLowerCase();
                return {
                    ...device,
                    isFrontCamera: label.includes('front') || label.includes('user') || label.includes('face'),
                    isBackCamera: label.includes('back') || label.includes('environment') || label.includes('rear'),
                };
            });
            
            setAvailableCameras(enhancedCameras);
        } catch (error) {
            console.error('Error getting cameras:', error);
        }
    };

    const switchCamera = async () => {
        const newCameraState = !isCameraSwitched;
        setIsCameraSwitched(newCameraState);
        await initializeCamera(newCameraState);
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
                    initializeCamera(isCameraSwitched);
                };
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            setIsScreenSharing(false);
            initializeCamera(isCameraSwitched);
        }
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setCallStatus('ended');

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
            onClose();
        }, 500);
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
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullScreen(!isFullScreen);
    };

    // Draggable local video handlers
    const handleDragStart = useCallback((e) => {
        if (!localContainerRef.current) return;
        e.preventDefault();
        
        const rect = localContainerRef.current.getBoundingClientRect();
        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        
        dragStartRef.current = {
            x: clientX - rect.left,
            y: clientY - rect.top,
            posX: rect.left,
            posY: rect.top
        };
        
        setIsDragging(true);
    }, []);

    const handleDragMove = useCallback((e) => {
        if (!isDragging || !localContainerRef.current) return;
        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        let newX = clientX - dragStartRef.current.x;
        let newY = clientY - dragStartRef.current.y;
        
        // Bound within viewport
        const maxX = window.innerWidth - localContainerRef.current.offsetWidth - 10;
        const maxY = window.innerHeight - localContainerRef.current.offsetHeight - 60;
        
        newX = Math.min(Math.max(10, newX), maxX);
        newY = Math.min(Math.max(60, newY), maxY);
        
        setLocalVideoPosition({
            x: newX,
            y: newY,
            bottom: null,
            right: null
        });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add/remove drag event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

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
        switch (callStatus) {
            case 'connecting':
                return 'Connecting...';
            case 'connected':
                return 'Connected';
            case 'ended':
                return 'Call Ended';
            case 'camera_error':
                return 'Camera Error';
            case 'no_camera':
                return 'No Camera Access';
            default:
                return callStatus;
        }
    };

    const getProfileDisplay = () => {
        if (callerProfilePic && (callerProfilePic.startsWith('http') || callerProfilePic.startsWith('/'))) {
            return null;
        }
        return callerProfilePic || callerName.charAt(0);
    };

    const isImageProfilePic = () => {
        return callerProfilePic && (callerProfilePic.startsWith('http') || callerProfilePic.startsWith('/') || callerProfilePic.includes('base64'));
    };

    // Get local video container style
    const getLocalVideoStyle = () => {
        if (localVideoPosition.x !== null && localVideoPosition.y !== null) {
            return {
                position: 'absolute',
                left: `${localVideoPosition.x}px`,
                top: `${localVideoPosition.y}px`,
                right: 'auto',
                bottom: 'auto'
            };
        }
        return {
            position: 'absolute',
            bottom: `${localVideoPosition.bottom}px`,
            right: `${localVideoPosition.right}px`,
            left: 'auto',
            top: 'auto'
        };
    };

    if (!isOpen) return null;

    return (
        <div className={`video-modal-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div
                ref={containerRef}
                className={`video-modal-container ${isFullScreen ? 'fullscreen' : ''}`}
                onClick={(e) => e.stopPropagation()}
                onMouseMove={resetControlsTimeout}
                onTouchStart={resetControlsTimeout}
            >
                {/* Header */}
                <div className="video-modal-header">
                    <div className="header-left">
                        <span className="header-icon">📹</span>
                        <div className="call-info">
                            <h3>{callerName}</h3>
                            <div className={`connection-quality ${getQualityClass()}`}>
                                <span className="quality-icon">{getQualityIcon()}</span>
                                <span className="quality-text">{connectionQuality}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="header-btn" onClick={toggleFullScreen} title="Full screen">
                            {isFullScreen ? '🗗' : '🗖'}
                        </button>
                        <button className="header-btn close-btn" onClick={handleEndCall} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="video-modal-content">
                    <div className="video-main-area">
                        <div className="remote-video-container">
                            <video
                                ref={remoteVideoRef}
                                className="remote-video"
                                autoPlay
                                playsInline
                            />
                            <div className="remote-video-overlay">
                                <div className="remote-video-placeholder">
                                    {isImageProfilePic() ? (
                                        <img 
                                            src={callerProfilePic} 
                                            alt={callerName}
                                            className="remote-avatar-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `<span class="remote-avatar">${getProfileDisplay()}</span>`;
                                            }}
                                        />
                                    ) : (
                                        <span className="remote-avatar">{getProfileDisplay()}</span>
                                    )}
                                    <div className="remote-info">
                                        <h2>{callerName}</h2>
                                        <p className="call-status">
                                            <span className={`status-${callStatus === 'connected' ? 'connected' : 'ended'}`}>
                                                {callStatus === 'connected' && <span className="pulse-dot"></span>}
                                                {getCallStatusDisplay()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {isCallActive && callStatus === 'connected' && (
                                <div className="call-duration-badge">
                                    <span className="duration-icon">⏱️</span>
                                    <span className="duration-text">{formatTime(callDuration)}</span>
                                </div>
                            )}

                            {isRecording && (
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span>REC</span>
                                </div>
                            )}

                            {isScreenSharing && (
                                <div className="screen-share-indicator">
                                    <span>🖥️</span>
                                    <span>Sharing</span>
                                </div>
                            )}

                            <div className="camera-indicator">
                                <span className="camera-icon">📷</span>
                                <span>{isCameraSwitched ? 'Back' : 'Front'}</span>
                            </div>
                        </div>

                        {/* Draggable Local Video */}
                        <div 
                            ref={localContainerRef}
                            className={`local-video-container ${!isVideoEnabled ? 'video-off' : ''} ${isDragging ? 'dragging' : ''}`}
                            style={getLocalVideoStyle()}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        >
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
                            <div className="drag-handle"></div>
                        </div>

                        {/* Controls - Auto hide */}
                        <div className={`video-call-controls ${showControls ? 'visible' : 'hidden'}`}>
                            <button
                                className={`control-btn ${isMuted ? 'active' : ''}`}
                                onClick={() => setIsMuted(!isMuted)}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <span>{isMuted ? '🔇' : '🎤'}</span>
                            </button>

                            <button
                                className={`control-btn ${!isVideoEnabled ? 'active' : ''}`}
                                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                            >
                                <span>{isVideoEnabled ? '📹' : '🚫📹'}</span>
                            </button>

                            <button
                                className={`control-btn ${isSpeakerOn ? 'active' : ''}`}
                                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                                title={isSpeakerOn ? 'Speaker off' : 'Speaker on'}
                            >
                                <span>{isSpeakerOn ? '🔊' : '🔈'}</span>
                            </button>

                            {availableCameras.length >= 1 && (
                                <button
                                    className="control-btn"
                                    onClick={switchCamera}
                                    title={isCameraSwitched ? 'Switch to front camera' : 'Switch to back camera'}
                                    disabled={availableCameras.length < 2}
                                >
                                    <span>🔄</span>
                                </button>
                            )}

                            <button
                                className="control-btn"
                                onClick={toggleScreenShare}
                                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                                <span>{isScreenSharing ? '⏹️' : '🖥️'}</span>
                            </button>

                            <button
                                className={`control-btn ${isRecording ? 'active' : ''}`}
                                onClick={() => setIsRecording(!isRecording)}
                                title={isRecording ? 'Stop recording' : 'Start recording'}
                            >
                                <span>⏺️</span>
                            </button>

                            <button
                                className="control-btn end-call"
                                onClick={handleEndCall}
                                title="End call"
                            >
                                <span>📞</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;