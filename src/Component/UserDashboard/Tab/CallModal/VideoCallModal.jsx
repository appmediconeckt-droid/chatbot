import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './VideoCallModal.css';
import { API_BASE_URL } from '../../../../axiosConfig';

const VideoCallModal = ({ isOpen, onClose, callData, currentUser }) => {
    // WebRTC States
    const [socket, setSocket] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    
    // Permission States
    const [permissionError, setPermissionError] = useState(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    
    // UI States
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [networkLatency, setNetworkLatency] = useState(0);
    
    // Call Info States
    const [callerName, setCallerName] = useState('');
    const [callerProfilePic, setCallerProfilePic] = useState('');
    const [roomId, setRoomId] = useState('');
    const [callId, setCallId] = useState('');
    const [callStatus, setCallStatus] = useState('connecting');
    const [callStartTime, setCallStartTime] = useState(null);
    
    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    
    // WebRTC Configuration with proper STUN servers
    const configuration = {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
            { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
            { urls: ['stun:stun4.l.google.com:19302'] }
        ],
        iceCandidatePoolSize: 10
    };

    // Get user ID from localStorage
    const getUserId = () => {
        // First check if currentUser prop is passed
        if (currentUser?.id) return currentUser.id;
        if (currentUser?._id) return currentUser._id;
        
        // Then check localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user._id || user.id || user.userId;
            } catch (_) {
                console.error('Error parsing user');
            }
        }
        
        return localStorage.getItem('userId') || localStorage.getItem('user_id');
    };

    // Get user type
    const getUserType = () => {
        if (currentUser?.role === 'counselor' || currentUser?.role === 'counsellor') {
            return 'counsellor';
        }
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'counselor' || user.role === 'counsellor') {
                    return 'counsellor';
                }
            } catch (_) {}
        }
        
        return 'user';
    };

    // Process callData when modal opens
    useEffect(() => {
        if (isOpen && callData) {
            setCallerName(callData.name || 'Counselor');
            setCallerProfilePic(callData.profilePic || '👤');
            setRoomId(callData.roomId || callData.callId || `room_${Date.now()}`);
            setCallId(callData.callId || callData.id || `call_${Date.now()}`);
            setCallStartTime(new Date());
            setCallDuration(0);
            setCallStatus('connecting');
            setPermissionError(null);
            
            console.log('Video Call Modal Opened:', { roomId: callData.roomId, callId: callData.callId });
        }
    }, [isOpen, callData]);

    // Initialize Socket and WebRTC
    useEffect(() => {
        if (!isOpen) return;

        const initializeCall = async () => {
            let userId = getUserId();
            
            // Try to get from callData if available
            if (!userId && callData?.initiator?.id) {
                userId = callData.initiator.id;
            }
            if (!userId && callData?.userId) {
                userId = callData.userId;
            }
            
            if (!userId) {
                console.error('No user ID found');
                setCallStatus('error');
                setPermissionError('User not authenticated. Please login again.');
                setShowPermissionModal(true);
                return;
            }
            
            console.log('Initializing video call for user:', userId);
            
            try {
                const stream = await requestMediaPermissions();
                
                if (!stream) {
                    setCallStatus('permission_denied');
                    return;
                }
                
                await initializeWebRTC(stream, userId);
            } catch (error) {
                console.error('Initialization error:', error);
                setCallStatus('error');
            }
        };
        
        initializeCall();
        
        return () => {
            cleanupMedia();
        };
    }, [isOpen]);

    // Request media permissions
    const requestMediaPermissions = async () => {
        try {
            setPermissionError(null);
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            setShowPermissionModal(false);
            return stream;
            
        } catch (error) {
            console.error('Permission error:', error);
            
            let errorMsg = 'Unable to access camera and microphone. ';
            
            if (error.name === 'NotAllowedError') {
                errorMsg = 'Camera and microphone access denied. Please allow access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMsg = 'No camera or microphone found on your device.';
            } else if (error.name === 'NotReadableError') {
                errorMsg = 'Camera or microphone is already in use by another application.';
            } else {
                errorMsg += error.message;
            }
            
            setPermissionError(errorMsg);
            setShowPermissionModal(true);
            return null;
        }
    };

    // Initialize WebRTC with proper signaling
    const initializeWebRTC = async (stream, userId) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const userType = getUserType();
            
            console.log('Initializing WebRTC for:', { userId, userType, roomId });

            // Create Socket connection
            const newSocket = io(API_BASE_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                extraHeaders: token ? { Authorization: `Bearer ${token}` } : {}
            });

            setSocket(newSocket);
            setLocalStream(stream);
            mediaStreamRef.current = stream;
            
            // Set local video stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create Peer Connection
            const pc = new RTCPeerConnection(configuration);
            setPeerConnection(pc);

            // Add all tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('Remote stream received');
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setCallStatus('connected');
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && newSocket) {
                    newSocket.emit('ice-candidate', {
                        callId: roomId,
                        candidate: event.candidate,
                        userId: userId
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected' || pc.connectionState === 'completed') {
                    setCallStatus('connected');
                } else if (pc.connectionState === 'disconnected') {
                    setCallStatus('reconnecting');
                } else if (pc.connectionState === 'failed') {
                    setCallStatus('failed');
                    console.error('Connection failed');
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    setCallStatus('connected');
                }
            };

            // Handle socket events
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join-call', { 
                    callId: roomId, 
                    userId: userId,
                    userType: userType,
                    userName: currentUser?.name || currentUser?.fullName || 'User'
                });
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket error:', error);
                setCallStatus('connection_error');
            });

            // Setup signaling
            setupSignaling(pc, newSocket, userId);

        } catch (error) {
            console.error('WebRTC initialization error:', error);
            setCallStatus('error');
            setPermissionError('Failed to initialize video call. Please try again.');
        }
    };

    // Setup WebRTC Signaling
    const setupSignaling = (pc, socket, userId) => {
        socket.on('user-joined', async ({ userId: joinedUserId }) => {
            console.log('User joined:', joinedUserId);
            if (joinedUserId !== userId && pc.signalingState === 'stable') {
                try {
                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', {
                        callId: roomId,
                        offer: offer,
                        userId: userId
                    });
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        });

        socket.on('offer', async ({ offer, userId: fromUserId }) => {
            console.log('Received offer from:', fromUserId);
            try {
                if (pc.signalingState !== 'stable') {
                    console.log('Skipping offer, signaling state not stable');
                    return;
                }
                
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', {
                    callId: roomId,
                    answer: answer,
                    userId: userId
                });
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        socket.on('answer', async ({ answer, userId: fromUserId }) => {
            console.log('Received answer from:', fromUserId);
            try {
                if (pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });

        socket.on('ice-candidate', async ({ candidate, userId: fromUserId }) => {
            try {
                if (candidate && fromUserId !== userId) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });

        socket.on('user-left', ({ userId: leftUserId }) => {
            if (leftUserId !== userId) {
                console.log('User left:', leftUserId);
                setRemoteStream(null);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
                setCallStatus('ended');
            }
        });
    };

    // Cleanup media resources
    const cleanupMedia = () => {
        try {
            if (peerConnection) {
                peerConnection.close();
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (socket) {
                socket.emit('leave-call', { callId: roomId, userId: getUserId() });
                socket.disconnect();
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    };

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

    // Handle audio mute/unmute
    useEffect(() => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);

    // Handle video enable/disable
    useEffect(() => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isVideoEnabled;
            });
        }
    }, [isVideoEnabled, localStream]);

    // Monitor connection quality
    useEffect(() => {
        if (isOpen && isCallActive && peerConnection && callStatus === 'connected') {
            const qualityInterval = setInterval(() => {
                peerConnection.getStats().then(stats => {
                    stats.forEach(report => {
                        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                            const rtt = report.currentRoundTripTime * 1000;
                            setNetworkLatency(Math.round(rtt));
                            
                            if (rtt < 100) {
                                setConnectionQuality('good');
                            } else if (rtt < 300) {
                                setConnectionQuality('medium');
                            } else {
                                setConnectionQuality('poor');
                            }
                        }
                    });
                }).catch(err => console.error('Stats error:', err));
            }, 5000);
            
            return () => clearInterval(qualityInterval);
        }
    }, [isOpen, isCallActive, peerConnection, callStatus]);

    // End call handler
    const handleEndCall = async () => {
        setIsCallActive(false);
        setCallStatus('ended');
        
        try {
            const token = localStorage.getItem('token');
            const userId = getUserId();
            
            if (callId && API_BASE_URL) {
                await fetch(`${API_BASE_URL}/api/video/calls/${callId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        endedBy: getUserType()
                    })
                }).catch(err => console.error('End call API error:', err));
            }
        } catch (error) {
            console.error('Error ending call:', error);
        }
        
        cleanupMedia();
        
        setTimeout(() => {
            onClose();
        }, 500);
    };

    // Retry permission
    const retryPermission = async () => {
        setShowPermissionModal(false);
        setPermissionError(null);
        
        const stream = await requestMediaPermissions();
        if (stream) {
            const userId = getUserId();
            initializeWebRTC(stream, userId);
        }
    };

    // Toggle full screen
    const toggleFullScreen = () => {
        const element = document.querySelector('.video-modal-container');
        if (!isFullScreen) {
            if (element?.requestFullscreen) {
                element.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullScreen(!isFullScreen);
    };

    // Format time
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get quality icon
    const getQualityIcon = () => {
        switch (connectionQuality) {
            case 'good': return '📶';
            case 'medium': return '📶';
            case 'poor': return '📶';
            default: return '📶';
        }
    };

    // Get quality class
    const getQualityClass = () => {
        switch (connectionQuality) {
            case 'good': return 'quality-good';
            case 'medium': return 'quality-medium';
            case 'poor': return 'quality-poor';
            default: return 'quality-good';
        }
    };

    // Get call status display
    const getCallStatusDisplay = () => {
        switch (callStatus) {
            case 'connecting': return 'Connecting...';
            case 'connected': return 'Connected';
            case 'reconnecting': return 'Reconnecting...';
            case 'ended': return 'Call Ended';
            case 'connection_error': return 'Connection Error';
            case 'failed': return 'Call Failed';
            case 'permission_denied': return 'Permission Denied';
            default: return callStatus;
        }
    };

    if (!isOpen) return null;

    // Permission Modal
    if (showPermissionModal) {
        return (
            <div className="video-modal-overlay">
                <div className="permission-modal">
                    <div className="permission-modal-content">
                        <div className="permission-icon">🎥</div>
                        <h3>Camera & Microphone Access Required</h3>
                        <p>{permissionError || 'This app needs access to your camera and microphone.'}</p>
                        <div className="permission-actions">
                            <button className="permission-retry-btn" onClick={retryPermission}>
                                Try Again
                            </button>
                            <button className="permission-close-btn" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`video-modal-overlay ${isFullScreen ? 'fullscreen' : ''}`}>
            <div className={`video-modal-container ${isFullScreen ? 'fullscreen' : ''}`}>
                {/* Header */}
                <div className="video-modal-header">
                    <div className="header-left">
                        <span className="header-icon">📹</span>
                        <div className="call-info">
                            <h3>Video Call with {callerName}</h3>
                            <div className={`connection-quality ${getQualityClass()}`}>
                                <span className="quality-icon">{getQualityIcon()}</span>
                                <span className="quality-text">{connectionQuality}</span>
                                {networkLatency > 0 && (
                                    <span className="latency-text"> ({networkLatency}ms)</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="header-btn" onClick={toggleFullScreen} title="Full screen">
                            {isFullScreen ? '🗗' : '🗖'}
                        </button>
                        <button className="header-btn close-btn" onClick={onClose} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Main Video Area */}
                <div className="video-modal-content">
                    <div className="video-main-area">
                        {/* Remote Video */}
                        <div className="remote-video-container">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    className="remote-video"
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <div className="remote-video-placeholder">
                                    <span className="remote-avatar">{callerProfilePic}</span>
                                    <div className="remote-info">
                                        <h2>{callerName}</h2>
                                        <p className="call-status">
                                            <span className={`status-${callStatus}`}>
                                                {callStatus === 'connected' && <span className="pulse-dot"></span>}
                                                {getCallStatusDisplay()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Call Duration */}
                            {isCallActive && callStatus === 'connected' && (
                                <div className="call-duration-badge">
                                    <span className="duration-icon">⏱️</span>
                                    <span className="duration-text">{formatTime(callDuration)}</span>
                                </div>
                            )}
                        </div>

                        {/* Local Video */}
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
                                <span className="btn-label">{isVideoEnabled ? 'Camera On' : 'Camera Off'}</span>
                            </button>

                            <button
                                className="control-btn end-call"
                                onClick={handleEndCall}
                                title="End call"
                            >
                                <span className="btn-icon">📞</span>
                                <span className="btn-label">End Call</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;
