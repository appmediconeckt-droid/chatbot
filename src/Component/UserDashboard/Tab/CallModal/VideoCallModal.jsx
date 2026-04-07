// VideoCallModal.jsx - Fixed user ID retrieval

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
    
    // Permission States
    const [permissionState, setPermissionState] = useState({
        camera: 'prompt',
        microphone: 'prompt'
    });
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    
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
    const [availableMicrophones, setAvailableMicrophones] = useState([]);
    const [currentCamera, setCurrentCamera] = useState('');
    const [currentMicrophone, setCurrentMicrophone] = useState('');
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(70);
    const [isRecording, setIsRecording] = useState(false);
    const [isPiPMode, setIsPiPMode] = useState(false);
    const [networkLatency, setNetworkLatency] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    
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
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const pipWindowRef = useRef(null);
    const audioContextRef = useRef(null);
    
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

    // Get user ID from multiple sources
    const getUserId = () => {
        // Try multiple sources
        const userId = localStorage.getItem('userId') || 
                      localStorage.getItem('user_id') ||
                      localStorage.getItem('id') ||
                      localStorage.getItem('counselorId') ||
                      sessionStorage.getItem('userId') ||
                      sessionStorage.getItem('user_id');
        
        console.log('Retrieved user ID:', userId);
        
        if (!userId) {
            // Try to get from user object
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const extractedId = user._id || user.id || user.userId;
                    if (extractedId) {
                        console.log('Extracted user ID from user object:', extractedId);
                        return extractedId;
                    }
                } catch (e) {
                    console.error('Error parsing user object:', e);
                }
            }
            
            // Try from counselor object
            const counselorStr = localStorage.getItem('counselor');
            if (counselorStr) {
                try {
                    const counselor = JSON.parse(counselorStr);
                    const extractedId = counselor._id || counselor.id || counselor.counselorId;
                    if (extractedId) {
                        console.log('Extracted counselor ID:', extractedId);
                        return extractedId;
                    }
                } catch (e) {
                    console.error('Error parsing counselor object:', e);
                }
            }
        }
        
        return userId;
    };

    // Get user type (user or counsellor)
    const getUserType = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'counselor' || user.role === 'counsellor' || user.userType === 'counselor') {
                    return 'counsellor';
                }
            } catch (e) {}
        }
        
        const counselorStr = localStorage.getItem('counselor');
        if (counselorStr) {
            return 'counsellor';
        }
        
        return 'user';
    };

    // Take Screenshot function
    const takeScreenshot = () => {
        if (remoteVideoRef.current && remoteVideoRef.current.videoWidth > 0) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = remoteVideoRef.current.videoWidth;
                canvas.height = remoteVideoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(remoteVideoRef.current, 0, 0, canvas.width, canvas.height);
                
                ctx.font = '12px Arial';
                ctx.fillStyle = 'white';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 2;
                ctx.fillText(new Date().toLocaleString(), 10, 20);
                
                const link = document.createElement('a');
                link.download = `screenshot-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                console.log('Screenshot saved');
            } catch (error) {
                console.error('Error taking screenshot:', error);
            }
        } else {
            console.warn('No remote video stream available for screenshot');
        }
    };

    // Start Recording function
    const startRecording = () => {
        if (remoteStream && !mediaRecorder) {
            try {
                const chunks = [];
                const recorder = new MediaRecorder(remoteStream);
                
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };
                
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `call-recording-${Date.now()}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setRecordedChunks([]);
                    setMediaRecorder(null);
                };
                
                recorder.start(1000);
                setMediaRecorder(recorder);
                setIsRecording(true);
                console.log('Recording started');
            } catch (error) {
                console.error('Error starting recording:', error);
            }
        }
    };

    // Stop Recording function
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log('Recording stopped');
        }
    };

    // Toggle Recording function
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
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
            
            console.log('Video Call Modal Opened:', { roomId, callId });
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

        const initializeCall = async () => {
            const userId = getUserId();
            setCurrentUserId(userId);
            
            if (!userId) {
                console.error('No user ID found in localStorage');
                setCallStatus('error');
                setPermissionError('User not authenticated. Please login again.');
                setShowPermissionModal(true);
                return;
            }
            
            console.log('Initializing call for user:', userId);
            
            await getAvailableDevices();
            const stream = await requestMediaPermissions();
            
            if (!stream) {
                setCallStatus('permission_denied');
                return;
            }
            
            await initializeWebRTC(stream, userId);
        };
        
        initializeCall();
        
        return () => {
            cleanupMedia();
        };
    }, [isOpen, roomId, apiBaseUrl]);

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
            
            setPermissionState({ camera: 'granted', microphone: 'granted' });
            setShowPermissionModal(false);
            return stream;
            
        } catch (error) {
            console.error('Error getting media permissions:', error);
            
            if (error.name === 'NotAllowedError') {
                setPermissionError('Camera and microphone access denied. Please allow access to continue.');
                setPermissionState({ camera: 'denied', microphone: 'denied' });
                setShowPermissionModal(true);
                
                try {
                    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setPermissionState(prev => ({ ...prev, microphone: 'granted' }));
                    setPermissionError('Camera access denied. Audio only mode activated.');
                    return audioOnlyStream;
                } catch (audioError) {
                    console.error('Audio only also failed:', audioError);
                    return null;
                }
                
            } else if (error.name === 'NotFoundError') {
                setPermissionError('No camera or microphone found on your device.');
                setShowPermissionModal(true);
                return null;
                
            } else if (error.name === 'NotReadableError') {
                setPermissionError('Camera or microphone is already in use by another application.');
                setShowPermissionModal(true);
                return null;
                
            } else {
                setPermissionError(`Unable to access media devices: ${error.message}`);
                setShowPermissionModal(true);
                return null;
            }
        }
    };

    // Get available devices
    const getAvailableDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            
            setAvailableCameras(videoDevices);
            setAvailableMicrophones(audioDevices);
            
            if (videoDevices.length > 0 && !currentCamera) {
                setCurrentCamera(videoDevices[0].deviceId);
            }
            if (audioDevices.length > 0 && !currentMicrophone) {
                setCurrentMicrophone(audioDevices[0].deviceId);
            }
            
            return { videoDevices, audioDevices };
        } catch (error) {
            console.error('Error getting devices:', error);
            return { videoDevices: [], audioDevices: [] };
        }
    };

    // Initialize WebRTC
    const initializeWebRTC = async (stream, userId) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

            if (!userId) {
                console.error('No user ID found');
                setCallStatus('error');
                return;
            }

            const userType = getUserType();
            console.log('User type:', userType);

            const newSocket = io(apiBaseUrl, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                extraHeaders: token ? {
                    Authorization: `Bearer ${token}`
                } : {}
            });

            setSocket(newSocket);
            setLocalStream(stream);
            mediaStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const pc = new RTCPeerConnection(configuration);
            setPeerConnection(pc);

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.ontrack = (event) => {
                console.log('Remote stream received');
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setIsConnecting(false);
                setCallStatus('connected');
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && newSocket) {
                    newSocket.emit('ice-candidate', {
                        callId: roomId,
                        candidate: event.candidate,
                        userId: userId
                    });
                }
            };

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

            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected') {
                    setIsConnecting(false);
                    setCallStatus('connected');
                }
            };

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join-call', { 
                    callId: roomId, 
                    userId: userId,
                    userType: userType
                });
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setCallStatus('connection_error');
            });

            setupSignaling(pc, newSocket, userId);

        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            setCallStatus('error');
        }
    };

    // Setup WebRTC Signaling
    const setupSignaling = (pc, socket, userId) => {
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

        socket.on('ice-candidate', async ({ candidate, userId: fromUserId }) => {
            if (fromUserId !== userId && candidate) {
                try {
                    await pc.addIceCandidate(new RTCSessionDescription(candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
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
        if (peerConnection) {
            peerConnection.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socket) {
            const userId = getUserId();
            socket.emit('leave-call', { callId: roomId, userId });
            socket.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
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
            
            if (socket && roomId) {
                const userId = getUserId();
                socket.emit('audio-toggled', {
                    callId: roomId,
                    userId: userId,
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
            
            if (socket && roomId) {
                const userId = getUserId();
                socket.emit('video-toggled', {
                    callId: roomId,
                    userId: userId,
                    enabled: isVideoEnabled
                });
            }
        }
    }, [isVideoEnabled, localStream, socket, roomId]);

    // Monitor connection quality
    useEffect(() => {
        if (isOpen && isCallActive && peerConnection) {
            const qualityInterval = setInterval(() => {
                peerConnection.getStats().then(stats => {
                    let rtt = 0;
                    stats.forEach(report => {
                        if (report.type === 'candidate-pair' && report.selected) {
                            rtt = report.currentRoundTripTime * 1000;
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
                }).catch(err => console.error('Error getting stats:', err));
            }, 5000);
            
            return () => clearInterval(qualityInterval);
        }
    }, [isOpen, isCallActive, peerConnection]);

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
            
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(sender => sender.track?.kind === 'video');
                const newVideoTrack = newStream.getVideoTracks()[0];
                
                if (videoSender && newVideoTrack) {
                    await videoSender.replaceTrack(newVideoTrack);
                }
            }
            
            const oldAudioTrack = localStream.getAudioTracks()[0];
            if (oldAudioTrack && newStream.getAudioTracks()[0]) {
                newStream.addTrack(oldAudioTrack);
            }
            
            setLocalStream(newStream);
            mediaStreamRef.current = newStream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newStream;
            }
            
            localStream.getTracks().forEach(track => {
                if (track.kind === 'video') track.stop();
            });
            
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    };

    // Switch microphone
    const switchMicrophone = async (deviceId) => {
        if (!deviceId) return;
        
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: { deviceId: { exact: deviceId } }
            });
            
            const newAudioTrack = newStream.getAudioTracks()[0];
            const oldAudioTrack = localStream.getAudioTracks()[0];
            
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const audioSender = senders.find(sender => sender.track?.kind === 'audio');
                
                if (audioSender && newAudioTrack) {
                    await audioSender.replaceTrack(newAudioTrack);
                }
            }
            
            localStream.removeTrack(oldAudioTrack);
            localStream.addTrack(newAudioTrack);
            
            oldAudioTrack.stop();
            setCurrentMicrophone(deviceId);
            
        } catch (error) {
            console.error('Error switching microphone:', error);
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
                
                if (peerConnection) {
                    const senders = peerConnection.getSenders();
                    const videoSender = senders.find(sender => sender.track?.kind === 'video');
                    const screenVideoTrack = screenStream.getVideoTracks()[0];
                    
                    if (videoSender && screenVideoTrack) {
                        await videoSender.replaceTrack(screenVideoTrack);
                    }
                }
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }
                
                setIsScreenSharing(true);
                
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

    // End call
    const handleEndCall = async () => {
        setIsCallActive(false);
        setCallStatus('ended');
        
        const userId = getUserId();
        
        if (socket && roomId) {
            socket.emit('leave-call', { callId: roomId, userId });
            
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
                        endedBy: getUserType()
                    })
                });
            } catch (error) {
                console.error('Error ending call via API:', error);
            }
        }
        
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
            case 'permission_denied': return 'Permission Denied';
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

    // Retry permission request
    const retryPermissionRequest = async () => {
        setShowPermissionModal(false);
        setPermissionError(null);
        
        const userId = getUserId();
        if (!userId) {
            setPermissionError('User not authenticated. Please login again.');
            setShowPermissionModal(true);
            return;
        }
        
        const stream = await requestMediaPermissions();
        if (stream) {
            await initializeWebRTC(stream, userId);
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
                        <p>{permissionError || 'This app needs access to your camera and microphone to make video calls.'}</p>
                        <div className="permission-actions">
                            <button className="permission-retry-btn" onClick={retryPermissionRequest}>
                                Try Again
                            </button>
                            <button className="permission-close-btn" onClick={onClose}>
                                Close
                            </button>
                        </div>
                        <div className="permission-help">
                            <p>How to enable permissions:</p>
                            <ul>
                                <li>Click the camera icon in your browser's address bar</li>
                                <li>Select "Allow" for camera and microphone</li>
                                <li>Refresh the page and try again</li>
                            </ul>
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
                                    {isImageProfilePic() ? (
                                        <img 
                                            src={callerProfilePic} 
                                            alt={callerName}
                                            className="remote-avatar-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                if (e.target.parentElement) {
                                                    e.target.parentElement.innerHTML = `<span class="remote-avatar">${getProfileDisplay()}</span>`;
                                                }
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
                                    <div className="setting-item">
                                        <label>Select Camera</label>
                                        <select 
                                            value={currentCamera} 
                                            onChange={(e) => setCurrentCamera(e.target.value)}
                                        >
                                            {availableCameras.map(camera => (
                                                <option key={camera.deviceId} value={camera.deviceId}>
                                                    {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {availableMicrophones.length > 0 && (
                                    <div className="setting-item">
                                        <label>Select Microphone</label>
                                        <select 
                                            value={currentMicrophone} 
                                            onChange={(e) => switchMicrophone(e.target.value)}
                                        >
                                            {availableMicrophones.map(mic => (
                                                <option key={mic.deviceId} value={mic.deviceId}>
                                                    {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="setting-item">
                                    <label>Call Information</label>
                                    <div className="caller-info-display">
                                        <p><strong>Name:</strong> {callerName}</p>
                                        {callerPhoneNumber && <p><strong>Phone:</strong> {callerPhoneNumber}</p>}
                                        <p><strong>Call Type:</strong> Video Call</p>
                                        <p><strong>Duration:</strong> {formatTime(callDuration)}</p>
                                        <p><strong>Network Latency:</strong> {networkLatency}ms</p>
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
                                className="control-btn"
                                onClick={toggleRecording}
                                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                            >
                                <span className="btn-icon">{isRecording ? '⏹️' : '⏺️'}</span>
                                <span className="btn-label">{isRecording ? 'Stop' : 'Record'}</span>
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