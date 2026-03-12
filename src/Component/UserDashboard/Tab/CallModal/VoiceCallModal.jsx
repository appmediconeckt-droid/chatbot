// VoiceCallModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import './VoiceCallModal.css';

const VoiceCallModal = ({ isOpen, onClose, callData }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(70);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callQuality, setCallQuality] = useState('good');
  const [showDialpad, setShowDialpad] = useState(false);
  const [dialedNumber, setDialedNumber] = useState('');
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [backgroundNoise, setBackgroundNoise] = useState(false);
  const [isVoicemail, setIsVoicemail] = useState(false);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  const defaultCallData = {
    id: 1,
    name: "Dr. Rajesh Kumar",
    profilePic: "👨‍⚕️",
    phoneNumber: "+91 98765 43210",
    type: "voice",
    location: "Mumbai, India",
    company: "City Hospital"
  };

  const activeCall = callData || defaultCallData;

  useEffect(() => {
    if (isOpen && !isAudioInitialized) {
      initializeAudio();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isOpen && isCallActive && !isOnHold) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isCallActive, isOnHold]);

  useEffect(() => {
    if (isOpen && isCallActive) {
      const qualityInterval = setInterval(() => {
        const qualities = ['good', 'medium', 'poor'];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        setCallQuality(randomQuality);
      }, 15000);

      return () => clearInterval(qualityInterval);
    }
  }, [isOpen, isCallActive]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.setSinkId?.(isSpeakerOn ? 'speaker' : 'default');
    }
  }, [isSpeakerOn]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volumeLevel / 100;
    }
  }, [volumeLevel]);

  useEffect(() => {
    if (!isOpen) {
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsKeypadOpen(false);
      setCallDuration(0);
      setIsCallActive(true);
      setIsOnHold(false);
      setShowVolumeControl(false);
      setIsAudioInitialized(false);
      setIsRecording(false);
      setShowDialpad(false);
      setDialedNumber('');
      setIsBluetoothEnabled(false);
      setShowMoreOptions(false);
      setBackgroundNoise(false);
      setIsVoicemail(false);
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isOpen]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setTimeout(() => {
      onClose();
    }, 800);
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

  const toggleHold = () => {
    setIsOnHold(!isOnHold);
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isOnHold;
      });
    }
  };

  const handleKeypadPress = (key) => {
    setDialedNumber(prev => prev + key);
    playDTMFTone(key);
  };

  const playDTMFTone = (digit) => {
    if (audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      const frequencies = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };
      
      const freq = frequencies[digit];
      if (freq) {
        oscillator.frequency.setValueAtTime(freq[0], audioContextRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log('Recording started');
    } else {
      console.log('Recording stopped');
    }
  };

  const toggleBluetooth = () => {
    setIsBluetoothEnabled(!isBluetoothEnabled);
  };

  const transferCall = () => {
    alert('Transferring call...');
  };

  const mergeCalls = () => {
    alert('Merging calls...');
  };

  const startConference = () => {
    alert('Starting conference...');
  };

  const getQualityIcon = () => {
    switch(callQuality) {
      case 'good': return '📶';
      case 'medium': return '📶';
      case 'poor': return '📶';
      default: return '📶';
    }
  };

  const getQualityClass = () => {
    switch(callQuality) {
      case 'good': return 'quality-good';
      case 'medium': return 'quality-medium';
      case 'poor': return 'quality-poor';
      default: return 'quality-good';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay" onClick={onClose}>
      <div 
        className="voice-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />

        <div className="voice-modal-header">
          <div className="header-left">
            <span className="header-icon">📞</span>
            <div className="call-info">
              <h3>Voice Call</h3>
              <div className={`call-quality ${getQualityClass()}`}>
                <span className="quality-icon">{getQualityIcon()}</span>
                <span className="quality-text">{callQuality}</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="voice-modal-content">
          <div className="caller-info-section">
            <div className="caller-avatar-large">
              {activeCall.profilePic}
              <span className={`call-status-indicator ${isCallActive ? 'active' : 'ended'}`}>
                {isCallActive ? (isOnHold ? '⏸️' : '●') : '○'}
              </span>
            </div>
            
            <h2 className="caller-name">{activeCall.name}</h2>
            {activeCall.phoneNumber && (
              <p className="caller-phone">{activeCall.phoneNumber}</p>
            )}
            
            <div className="caller-details">
              {activeCall.location && (
                <span className="caller-location">
                  <span className="detail-icon">📍</span>
                  {activeCall.location}
                </span>
              )}
              {activeCall.company && (
                <span className="caller-company">
                  <span className="detail-icon">🏥</span>
                  {activeCall.company}
                </span>
              )}
            </div>
            
            <div className="call-timer-display">
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">{formatTime(callDuration)}</span>
              {isOnHold && <span className="hold-badge">On Hold</span>}
            </div>
          </div>

          {showDialpad && (
            <div className="dialpad-display">
              <input 
                type="text" 
                value={dialedNumber} 
                readOnly 
                placeholder="Enter number"
              />
              <button className="clear-dialpad" onClick={() => setDialedNumber('')}>
                ✕
              </button>
            </div>
          )}

          {isCallActive && !isOnHold && (
            <div className="sound-wave-container">
              <div className="sound-wave">
                <span style={{animationDelay: '0s'}}></span>
                <span style={{animationDelay: '0.1s'}}></span>
                <span style={{animationDelay: '0.2s'}}></span>
                <span style={{animationDelay: '0.3s'}}></span>
                <span style={{animationDelay: '0.4s'}}></span>
                <span style={{animationDelay: '0.5s'}}></span>
              </div>
            </div>
          )}

          {isKeypadOpen && (
            <div className="keypad-container">
              <div className="keypad-grid">
                {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((key) => (
                  <button 
                    key={key} 
                    className="keypad-btn"
                    onClick={() => handleKeypadPress(key)}
                  >
                    <span className="keypad-number">{key}</span>
                    <span className="keypad-letters">
                      {key === 1 ? '' : 
                       key === 2 ? 'ABC' :
                       key === 3 ? 'DEF' :
                       key === 4 ? 'GHI' :
                       key === 5 ? 'JKL' :
                       key === 6 ? 'MNO' :
                       key === 7 ? 'PQRS' :
                       key === 8 ? 'TUV' :
                       key === 9 ? 'WXYZ' :
                       key === 0 ? '+' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showVolumeControl && (
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(e.target.value)}
                className="volume-slider"
              />
              <span className="volume-level">{volumeLevel}%</span>
            </div>
          )}

          {showMoreOptions && (
            <div className="more-options-panel">
              <button className="option-btn" onClick={toggleRecording}>
                <span className="option-icon">{isRecording ? '⏹️' : '⏺️'}</span>
                <span className="option-label">{isRecording ? 'Stop' : 'Record'}</span>
              </button>
              <button className="option-btn" onClick={toggleBluetooth}>
                <span className="option-icon">{isBluetoothEnabled ? '📱' : '📞'}</span>
                <span className="option-label">{isBluetoothEnabled ? 'BT On' : 'BT Off'}</span>
              </button>
              <button className="option-btn" onClick={transferCall}>
                <span className="option-icon">🔄</span>
                <span className="option-label">Transfer</span>
              </button>
              <button className="option-btn" onClick={mergeCalls}>
                <span className="option-icon">🔀</span>
                <span className="option-label">Merge</span>
              </button>
              <button className="option-btn" onClick={startConference}>
                <span className="option-icon">👥</span>
                <span className="option-label">Conference</span>
              </button>
            </div>
          )}

          <div className="voice-call-controls">
            <div className="controls-grid">
              <button 
                className={`control-item ${isMuted ? 'active' : ''}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="control-icon">{isMuted ? '🔇' : '🎤'}</span>
                <span className="control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button 
                className={`control-item ${isSpeakerOn ? 'active' : ''}`}
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                title={isSpeakerOn ? 'Speaker off' : 'Speaker on'}
              >
                <span className="control-icon">{isSpeakerOn ? '🔊' : '🔈'}</span>
                <span className="control-label">{isSpeakerOn ? 'Spkr Off' : 'Spkr On'}</span>
              </button>

              

              <button 
                className={`control-item ${isOnHold ? 'active' : ''}`}
                onClick={toggleHold}
                title={isOnHold ? 'Resume call' : 'Hold call'}
              >
                <span className="control-icon">⏸️</span>
                <span className="control-label">{isOnHold ? 'Resume' : 'Hold'}</span>
              </button>

              

              
              

             

              
            </div>

            <button className="end-call-btn" onClick={handleEndCall}>
              <span className="end-call-icon">📞</span>
              <span className="end-call-label">End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallModal;