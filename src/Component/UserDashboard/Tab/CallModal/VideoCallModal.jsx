// VideoCallModal.jsx - Updated to handle complete user and counselor data

import React, { useState, useEffect, useRef } from 'react';
import './VideoCallModal.css';

const VideoCallModal = ({ isOpen, onClose, callData, currentUser }) => {
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
        type: 'video',
        status: 'connecting',
        startTime: null,
        chatId: '',
        apiCallData: null,
        isFallback: false
    });

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const pipWindowRef = useRef(null);

    // Process callData when modal opens
    useEffect(() => {
        if (isOpen && callData) {
            console.log('Video Call Modal - Received callData:', callData);
            
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
                type: callData.type || 'video',
                status: callData.status || 'connecting',
                startTime: callData.startTime || new Date().toISOString(),
                chatId: callData.chatId,
                apiCallData: callData.apiCallData || null,
                isFallback: callData.isFallback || false
            });
            
            setCallDuration(0);
            
            // Log complete call data for debugging
            console.log('Video Call Modal - Processed Data:', {
                caller: callerInfo,
                user: userInfo,
                metadata: callMetadata
            });
        }
    }, [isOpen, callData, currentUser]);

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
            setIsPiPMode(false);
            setIsScreenSharing(false);
            setShowSettings(false);
            setCallMetadata(prev => ({ ...prev, status: 'ended' }));

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

            console.log(`Initializing camera with facingMode: ${facingMode}`);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setIsCameraInitialized(true);
            setCallMetadata(prev => ({ ...prev, status: 'connected' }));
            
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            if (settings.deviceId) {
                setCurrentCamera(settings.deviceId);
            }
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCallMetadata(prev => ({ ...prev, status: 'camera_error' }));
            
            try {
                console.log('Trying fallback camera access...');
                const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                mediaStreamRef.current = fallbackStream;
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = fallbackStream;
                }
                
                setIsCameraInitialized(true);
                setCallMetadata(prev => ({ ...prev, status: 'connected' }));
                
            } catch (fallbackError) {
                console.error('Fallback camera access also failed:', fallbackError);
                setCallMetadata(prev => ({ ...prev, status: 'no_camera' }));
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
            
            const frontCamera = enhancedCameras.find(cam => cam.isFrontCamera);
            if (frontCamera) {
                setCurrentCamera(frontCamera.deviceId);
            } else if (enhancedCameras.length > 0) {
                setCurrentCamera(enhancedCameras[0].deviceId);
            }
            
        } catch (error) {
            console.error('Error getting cameras:', error);
        }
    };

    const switchCamera = async () => {
        const newCameraState = !isCameraSwitched;
        setIsCameraSwitched(newCameraState);
        console.log(`Switching camera to: ${newCameraState ? 'back' : 'front'} camera`);
        await initializeCamera(newCameraState);
    };

    const selectCamera = async (deviceId) => {
        try {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setCurrentCamera(deviceId);
            
            const selectedCamera = availableCameras.find(cam => cam.deviceId === deviceId);
            if (selectedCamera) {
                setIsCameraSwitched(selectedCamera.isBackCamera || false);
            }
            
        } catch (error) {
            console.error('Error selecting camera:', error);
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
        setCallMetadata(prev => ({ ...prev, status: 'ended' }));

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Log call end data for analytics
        const callEndData = {
            callId: callMetadata.callId,
            roomId: callMetadata.roomId,
            duration: callDuration,
            endedAt: new Date().toISOString(),
            caller: callerInfo,
            user: userInfo,
            type: callMetadata.type
        };
        console.log('Call ended:', callEndData);

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

    const getCallStatusDisplay = () => {
        switch (callMetadata.status) {
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
                return callMetadata.status;
        }
    };

    const getProfileDisplay = () => {
        if (callerInfo.profilePic && (callerInfo.profilePic.startsWith('http') || callerInfo.profilePic.startsWith('/'))) {
            return null;
        }
        return callerInfo.profilePic || callerInfo.name.charAt(0);
    };

    const isImageProfilePic = () => {
        return callerInfo.profilePic && (callerInfo.profilePic.startsWith('http') || callerInfo.profilePic.startsWith('/') || callerInfo.profilePic.includes('base64'));
    };

    if (!isOpen) return null;

    return (
        <div className={`video-modal-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div
                className={`video-modal-container ${isFullScreen ? 'fullscreen' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="video-modal-header">
                    <div className="header-left">
                        <span className="header-icon">📹</span>
                        <div className="call-info">
                            <h3>Video Call with {callerInfo.name}</h3>
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
                        <button className="header-btn" onClick={toggleFullScreen} title="Full screen">
                            {isFullScreen ? '🗗️' : '🗖'}
                        </button>
                        <button className="header-btn close-btn" onClick={onClose} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="video-modal-content">
                    <div className="video-main-area">
                        <div className="remote-video-container">
                            {isVideoEnabled ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        className="remote-video"
                                        autoPlay
                                        playsInline
                                        poster="/api/placeholder/1280/720"
                                    />
                                    <div className="remote-video-overlay">
                                        <div className="remote-video-placeholder">
                                            {isImageProfilePic() ? (
                                                <img 
                                                    src={callerInfo.profilePic} 
                                                    alt={callerInfo.name}
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
                                                <h2>{callerInfo.name}</h2>
                                                {callerInfo.specialization && (
                                                    <p className="specialization">{callerInfo.specialization}</p>
                                                )}
                                                {callMetadata.roomId && (
                                                    <p className="room-id">Room: {callMetadata.roomId.substring(0, 8)}...</p>
                                                )}
                                                <p className="call-status">
                                                    <span className={`status-${callMetadata.status}`}>
                                                        {callMetadata.status === 'connected' && <span className="pulse-dot"></span>}
                                                        {getCallStatusDisplay()}
                                                    </span>
                                                </p>
                                                {callMetadata.isFallback && (
                                                    <p className="fallback-warning">⚠️ Using fallback connection</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="video-disabled">
                                    <span className="video-off-icon">🚫📹</span>
                                    <p>Camera is off</p>
                                </div>
                            )}

                            {isCallActive && callMetadata.status === 'connected' && (
                                <div className="call-duration-badge">
                                    <span className="duration-icon">⏱️</span>
                                    <span className="duration-text">{formatTime(callDuration)}</span>
                                </div>
                            )}

                            {isRecording && (
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span className="recording-text">REC</span>
                                </div>
                            )}

                            {isScreenSharing && (
                                <div className="screen-share-indicator">
                                    <span className="share-icon">🖥️</span>
                                    <span className="share-text">Sharing screen</span>
                                </div>
                            )}

                            <div className="camera-indicator">
                                <span className="camera-icon">📷</span>
                                <span className="camera-text">
                                    {isCameraSwitched ? 'Back Camera' : 'Front Camera'}
                                </span>
                            </div>
                        </div>

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
                                <span>{userInfo.name || 'You'} ({isCameraSwitched ? 'Back' : 'Front'})</span>
                            </div>
                        </div>

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
                                
                                {availableCameras.length > 0 && (
                                    <>
                                        <div className="setting-item">
                                            <label>Select Camera</label>
                                            <select 
                                                value={currentCamera} 
                                                onChange={(e) => selectCamera(e.target.value)}
                                            >
                                                {availableCameras.map(camera => (
                                                    <option key={camera.deviceId} value={camera.deviceId}>
                                                        {camera.label || 
                                                         (camera.isFrontCamera ? 'Front Camera' : 
                                                          camera.isBackCamera ? 'Back Camera' : 
                                                          `Camera ${camera.deviceId.slice(0, 5)}...`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="setting-item">
                                            <label>Current Camera</label>
                                            <p className="current-camera-info">
                                                {isCameraSwitched ? '📷 Back Camera' : '🤳 Front Camera'}
                                            </p>
                                        </div>
                                    </>
                                )}
                                
                                <div className="setting-item">
                                    <label>Call Information</label>
                                    <div className="caller-info-display">
                                        <p><strong>Counselor:</strong> {callerInfo.name}</p>
                                        {callerInfo.specialization && <p><strong>Specialization:</strong> {callerInfo.specialization}</p>}
                                        {callerInfo.email && <p><strong>Email:</strong> {callerInfo.email}</p>}
                                        {callerInfo.phone && <p><strong>Phone:</strong> {callerInfo.phone}</p>}
                                        
                                        <p><strong>User:</strong> {userInfo.name}</p>
                                        {userInfo.email && <p><strong>User Email:</strong> {userInfo.email}</p>}
                                        
                                        <p><strong>Call Type:</strong> {callMetadata.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}</p>
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

                            {availableCameras.length >= 1 && (
                                <button
                                    className="control-btn"
                                    onClick={switchCamera}
                                    title={isCameraSwitched ? 'Switch to front camera' : 'Switch to back camera'}
                                    disabled={availableCameras.length < 2}
                                >
                                    <span className="btn-icon">🔄</span>
                                    <span className="btn-label">
                                        {isCameraSwitched ? 'Front' : 'Back'}
                                    </span>
                                </button>
                            )}

                            <button
                                className="control-btn"
                                onClick={toggleScreenShare}
                                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                                <span className="btn-icon">{isScreenSharing ? '⏹️' : '🖥️'}</span>
                                <span className="btn-label">{isScreenSharing ? 'Stop share' : 'Share'}</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={takeScreenshot}
                                title="Take screenshot"
                            >
                                <span className="btn-icon">📸</span>
                                <span className="btn-label">Screenshot</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={togglePiPMode}
                                title="Picture in Picture"
                            >
                                <span className="btn-icon">🖼️</span>
                                <span className="btn-label">PiP</span>
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

export default VideoCallModal;