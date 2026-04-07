// VideoCallModal.jsx - Complete WebRTC Integration (FIXED)

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './VideoCallModal.css';

const VideoCallModal = ({ isOpen, onClose, callData, apiBaseUrl = 'http://localhost:5000' }) => {
    // WebRTC States
    const [socket, setSocket] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    
    // UI States
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCameraSwitched, setIsCameraSwitched] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState('');
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(70);
    const [isRecording, setIsRecording] = useState(false);
    const [isPiPMode, setIsPiPMode] = useState(false);
    
    // Call Info States
    const [callerName, setCallerName] = useState('');
    const [callerProfilePic, setCallerProfilePic] = useState('');
    const [callerPhoneNumber, setCallerPhoneNumber] = useState('');
    const [roomId, setRoomId] = useState('');
    const [callId, setCallId] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting');
    const [callStartTime, setCallStartTime] = useState(null);
    const [apiCallData, setApiCallData] = useState(null);
    
    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const pipWindowRef = useRef(null);
    
    // WebRTC Configuration
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

    // Default call data
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
            const anonymous = callData.isAnonymous === true;
            setIsAnonymous(anonymous);
            setCallerName(anonymous ? 'Anonymous User' : (callData.name || defaultCallData.name));
            setCallerProfilePic(anonymous ? '👤' : (callData.profilePic || defaultCallData.profilePic));
            setCallerPhoneNumber(anonymous ? 'Hidden' : (callData.phoneNumber || defaultCallData.phoneNumber));
            setRoomId(callData.roomId || callData.callId || `room_${Date.now()}`);
            setCallId(callData.callId || callData.id || `call_${Date.now()}`);
            setCallStartTime(new Date());
            setCallDuration(0);
            setApiCallData(callData.apiCallData || null);
            
            console.log('Video Call Modal Opened:', { roomId: callData.roomId, callId: callData.callId, callData });
        } else if (isOpen && !callData) {
            setIsAnonymous(false);
            setCallerName(defaultCallData.name);
            setCallerProfilePic(defaultCallData.profilePic);
            setCallerPhoneNumber(defaultCallData.phoneNumber);
            setCallStartTime(new Date());
            setCallDuration(0);
        }
    }, [isOpen, callData]);

    // Initialize Socket and WebRTC
    useEffect(() => {
        if (!isOpen) return;

        // Get user ID from localStorage
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!userId) {
            console.error('No user ID found');
            setCallStatus('error');
            return;
        }

        // Initialize Socket.IO connection
        const newSocket = io(apiBaseUrl, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        setSocket(newSocket);

        // Join the call room
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            newSocket.emit('join-call', { 
                callId: roomId, 
                userId: userId,
                userType: 'user'
            });
        });

        // Handle socket errors
        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setCallStatus('connection_error');
        });

        // Initialize media devices
        initializeMediaDevices();

        return () => {
            if (newSocket) {
                newSocket.emit('leave-call', { callId: roomId, userId });
                newSocket.disconnect();
            }
            cleanupMedia();
        };
    }, [isOpen, roomId, apiBaseUrl]);

    // Initialize Media Devices and WebRTC
    const initializeMediaDevices = async () => {
        try {
            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setAvailableCameras(videoDevices);

            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });

            setLocalStream(stream);
            mediaStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Initialize Peer Connection
            const pc = new RTCPeerConnection(configuration);
            setPeerConnection(pc);

            // Add local tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('Remote stream received');
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setIsConnecting(false);
                setCallStatus('connected');
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    socket.emit('ice-candidate', {
                        callId: roomId,
                        candidate: event.candidate,
                        userId: localStorage.getItem('userId')
                    });
                }
            };

            // Handle connection state
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setIsConnecting(false);
                    setCallStatus('connected');
                } else if (pc.connectionState === 'disconnected') {
                    setIsConnecting(true);
                    setCallStatus('reconnecting');
                } else if (pc.connectionState === 'failed') {
                    setCallStatus('failed');
                }
            };

            // Handle ICE connection state
            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected') {
                    setIsConnecting(false);
                    setCallStatus('connected');
                }
            };

            // Setup WebRTC signaling
            setupSignaling(pc);

        } catch (error) {
            console.error('Error accessing media devices:', error);
            setCallStatus('media_error');
            
            // Try without video if camera fails
            try {
                const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(audioOnlyStream);
                mediaStreamRef.current = audioOnlyStream;
                setIsVideoEnabled(false);
                setCallStatus('audio_only');
            } catch (audioError) {
                console.error('Audio only also failed:', audioError);
            }
        }
    };

    // Setup WebRTC Signaling
    const setupSignaling = (pc) => {
        if (!socket) return;

        const userId = localStorage.getItem('userId');

        // Handle user joined
        socket.on('user-joined', async ({ userId: joinedUserId }) => {
            console.log('User joined:', joinedUserId);
            if (joinedUserId !== userId && pc.signalingState !== 'have-local-offer') {
                try {
                    const offer = await pc.createOffer();
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

        // Handle offer
        socket.on('offer', async ({ offer, userId: fromUserId }) => {
            console.log('Received offer from:', fromUserId);
            if (fromUserId !== userId && pc.signalingState !== 'stable') {
                try {
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
            }
        });

        // Handle answer
        socket.on('answer', async ({ answer, userId: fromUserId }) => {
            console.log('Received answer from:', fromUserId);
            if (fromUserId !== userId && pc.signalingState === 'have-local-offer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (error) {
                    console.error('Error handling answer:', error);
                }
            }
        });

        // Handle ICE candidates
        socket.on('ice-candidate', async ({ candidate, userId: fromUserId }) => {
            if (fromUserId !== userId && candidate) {
                try {
                    await pc.addIceCandidate(new RTCSessionDescription(candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });

        // Handle user left
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

        // Handle media toggle events
        socket.on('video-toggled', ({ enabled }) => {
            // Handle remote video toggle if needed
            console.log('Remote video toggled:', enabled);
        });

        socket.on('audio-toggled', ({ enabled }) => {
            // Handle remote audio toggle if needed
            console.log('Remote audio toggled:', enabled);
        });
    };

    // Cleanup media resources
    const cleanupMedia = () => {
        if (peerConnection) {
            peerConnection.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
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
            
            // Notify others via socket
            if (socket && roomId) {
                socket.emit('audio-toggled', {
                    callId: roomId,
                    userId: localStorage.getItem('userId'),
                    enabled: !isMuted
                });
            }
        }
    }, [isMuted, localStream, socket, roomId]);

    // Handle video enable/disable
    useEffect(() => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = isVideoEnabled;
            });
            
            // Notify others via socket
            if (socket && roomId) {
                socket.emit('video-toggled', {
                    callId: roomId,
                    userId: localStorage.getItem('userId'),
                    enabled: isVideoEnabled
                });
            }
        }
    }, [isVideoEnabled, localStream, socket, roomId]);

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
            setIsPiPMode(false);
            setIsScreenSharing(false);
            setShowSettings(false);
            setCallStatus('ended');
            setRoomId('');
            setCallId('');
            setApiCallData(null);

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

    // Switch camera
    const switchCamera = async () => {
        if (!localStream) return;
        
        const newFacingMode = isCameraSwitched ? 'user' : 'environment';
        setIsCameraSwitched(!isCameraSwitched);
        
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: newFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });
            
            // Replace tracks in peer connection
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(sender => sender.track?.kind === 'video');
                const newVideoTrack = newStream.getVideoTracks()[0];
                
                if (videoSender && newVideoTrack) {
                    await videoSender.replaceTrack(newVideoTrack);
                }
            }
            
            // Update local stream
            const oldAudioTrack = localStream.getAudioTracks()[0];
            if (oldAudioTrack && newStream.getAudioTracks()[0]) {
                // Keep audio track
                newStream.addTrack(oldAudioTrack);
            }
            
            setLocalStream(newStream);
            mediaStreamRef.current = newStream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newStream;
            }
            
            // Stop old tracks
            localStream.getTracks().forEach(track => {
                if (track.kind === 'video') track.stop();
            });
            
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    };

    // Toggle screen sharing
    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                screenStreamRef.current = screenStream;
                
                // Replace video track in peer connection
                if (peerConnection) {
                    const senders = peerConnection.getSenders();
                    const videoSender = senders.find(sender => sender.track?.kind === 'video');
                    const screenVideoTrack = screenStream.getVideoTracks()[0];
                    
                    if (videoSender && screenVideoTrack) {
                        await videoSender.replaceTrack(screenVideoTrack);
                    }
                }
                
                // Update local video display
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }
                
                setIsScreenSharing(true);
                
                // Handle screen sharing stop
                screenStream.getVideoTracks()[0].onended = () => {
                    stopScreenSharing();
                };
                
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            stopScreenSharing();
        }
    };
    
    const stopScreenSharing = async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        
        // Restore camera stream
        if (localStream && peerConnection) {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            const cameraVideoTrack = localStream.getVideoTracks()[0];
            
            if (videoSender && cameraVideoTrack) {
                await videoSender.replaceTrack(cameraVideoTrack);
            }
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        }
        
        setIsScreenSharing(false);
    };

    // Toggle PiP mode
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

    // Take screenshot
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

    // End call
    const handleEndCall = async () => {
        setIsCallActive(false);
        setCallStatus('ended');
        
        const userId = localStorage.getItem('userId');
        
        // Notify others
        if (socket && roomId) {
            socket.emit('leave-call', { callId: roomId, userId });
            
            // Call end API
            try {
                const token = localStorage.getItem('token');
                await fetch(`${apiBaseUrl}/api/video/calls/${callId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        endedBy: 'user'
                    })
                });
            } catch (error) {
                console.error('Error ending call via API:', error);
            }
        }
        
        // Cleanup
        cleanupMedia();
        
        setTimeout(() => {
            onClose();
        }, 1000);
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
            case 'media_error': return 'Camera/Mic Error';
            case 'audio_only': return 'Audio Only Mode';
            case 'connection_error': return 'Connection Error';
            case 'failed': return 'Call Failed';
            default: return callStatus;
        }
    };

    // Get profile display
    const getProfileDisplay = () => {
        if (callerProfilePic && (callerProfilePic.startsWith('http') || callerProfilePic.startsWith('/'))) {
            return null;
        }
        return callerProfilePic || callerName.charAt(0);
    };

    const isImageProfilePic = () => {
        return callerProfilePic && (callerProfilePic.startsWith('http') || callerProfilePic.startsWith('/') || callerProfilePic.includes('base64'));
    };

    if (!isOpen) return null;

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
                                        <h2>
                                            {callerName}
                                            {isAnonymous && (
                                                <span className="anonymous-badge">Anonymous User</span>
                                            )}
                                        </h2>
                                        {roomId && (
                                            <p className="room-id">Room: {roomId.substring(0, 8)}...</p>
                                        )}
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

                            {/* Recording Indicator */}
                            {isRecording && (
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span className="recording-text">REC</span>
                                </div>
                            )}

                            {/* Screen Share Indicator */}
                            {isScreenSharing && (
                                <div className="screen-share-indicator">
                                    <span className="share-icon">🖥️</span>
                                    <span className="share-text">Sharing screen</span>
                                </div>
                            )}

                            {/* Camera Indicator */}
                            <div className="camera-indicator">
                                <span className="camera-icon">📷</span>
                                <span className="camera-text">
                                    {isCameraSwitched ? 'Back Camera' : 'Front Camera'}
                                </span>
                            </div>
                        </div>

                        {/* Local Video (Picture-in-Picture) */}
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
                                <span>You ({isCameraSwitched ? 'Back' : 'Front'})</span>
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
                                {availableCameras.length > 0 && (
                                    <>
                                        <div className="setting-item">
                                            <label>Select Camera</label>
                                            <select 
                                                value={currentCamera} 
                                                onChange={(e) => {
                                                    setCurrentCamera(e.target.value);
                                                    // Implement camera selection if needed
                                                }}
                                            >
                                                {availableCameras.map(camera => (
                                                    <option key={camera.deviceId} value={camera.deviceId}>
                                                        {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
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
                                        <p><strong>Name:</strong> {callerName}</p>
                                        {callerPhoneNumber && <p><strong>Phone:</strong> {callerPhoneNumber}</p>}
                                        <p><strong>Call Type:</strong> Video Call</p>
                                        <p><strong>Duration:</strong> {formatTime(callDuration)}</p>
                                        {roomId && <p><strong>Room ID:</strong> {roomId.substring(0, 8)}...</p>}
                                        {callId && <p><strong>Call ID:</strong> {callId.substring(0, 8)}...</p>}
                                    </div>
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
                                onClick={() => setShowSettings(!showSettings)}
                                title="Settings"
                            >
                                <span className="btn-icon">⚙️</span>
                                <span className="btn-label">Settings</span>
                            </button>

                            <button
                                className="control-btn"
                                onClick={takeScreenshot}
                                title="Take Screenshot"
                            >
                                <span className="btn-icon">📸</span>
                                <span className="btn-label">Screenshot</span>
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