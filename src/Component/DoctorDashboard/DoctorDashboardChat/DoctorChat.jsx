// DoctorChat.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorUser } from "../doctorApi.js";
import { FaArrowLeft, FaPaperPlane, FaPhone, FaVideo, FaUserMd, FaStethoscope, FaFile, FaPaperclip, FaImage, FaFilePdf, FaFileMedical } from 'react-icons/fa';
import './DoctorChat.css';
import { getAttachmentUrl, getChatList, getConversation, getCurrentUserId, sendAttachment, sendMessage, startCall, unwrapApiObject } from '../doctorChatApi';

// Mock patient data
const mockPatients = [
  {
    id: 1,
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    status: 'Stable',
    lastVisit: '2024-01-15',
    phone: '+1 (555) 123-4567',
    avatarColor: '#3498db',
    bloodGroup: 'O+'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes Type 2',
    status: 'Needs Attention',
    lastVisit: '2024-01-14',
    phone: '+1 (555) 234-5678',
    avatarColor: '#e74c3c',
    bloodGroup: 'A-'
  },
  {
    id: 3,
    name: 'Michael Brown',
    age: 58,
    gender: 'Male',
    condition: 'Arthritis',
    status: 'Improving',
    lastVisit: '2024-01-12',
    phone: '+1 (555) 345-6789',
    avatarColor: '#2ecc71',
    bloodGroup: 'B+'
  },
  {
    id: 4,
    name: 'Emily Davis',
    age: 29,
    gender: 'Female',
    condition: 'Asthma',
    status: 'Stable',
    lastVisit: '2024-01-10',
    phone: '+1 (555) 456-7890',
    avatarColor: '#9b59b6',
    bloodGroup: 'AB+'
  },
  {
    id: 5,
    name: 'Robert Wilson',
    age: 67,
    gender: 'Male',
    condition: 'Heart Disease',
    status: 'Critical',
    lastVisit: '2024-01-13',
    phone: '+1 (555) 567-8901',
    avatarColor: '#f39c12',
    bloodGroup: 'O-'
  }
];

const PatientChat = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const authUser = useDoctorUser();
  const [activePatientId, setActivePatientId] = useState(patientId || '1');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [chatStatus, setChatStatus] = useState('loading');
  const [chatError, setChatError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const fileInputRef = useRef(null);
  const callTimerRef = useRef(null);

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (patientId) {
      setActivePatientId(patientId);
    }
  }, [patientId]);

  // Mock chat messages with file examples
  const mockChats = {
    1: [
      { id: 1, text: 'Hello Doctor, I am feeling dizzy today.', sender: 'patient', time: '10:30 AM' },
      { id: 2, text: 'Please take your prescribed medicine and rest.', sender: 'doctor', time: '10:35 AM' },
      {
        id: 3,
        text: 'My latest blood report',
        sender: 'patient',
        time: '11:00 AM',
        file: { name: 'blood_report.pdf', type: 'pdf', size: '2.4 MB' }
      },
      { id: 4, text: 'Monitor your BP and let me know in 2 hours.', sender: 'doctor', time: '11:05 AM' },
      {
        id: 5,
        text: 'BP readings chart',
        sender: 'doctor',
        time: '11:10 AM',
        file: { name: 'bp_chart.png', type: 'image', size: '1.2 MB' }
      },
    ],
    2: [
      { id: 1, text: 'My blood sugar is 250 mg/dL.', sender: 'patient', time: '09:00 AM' },
      { id: 2, text: 'Please avoid sweets and take insulin as prescribed.', sender: 'doctor', time: '09:15 AM' },
      {
        id: 3,
        text: 'Insulin prescription',
        sender: 'doctor',
        time: '09:20 AM',
        file: { name: 'prescription.pdf', type: 'pdf', size: '1.8 MB' }
      },
    ],
    3: [
      { id: 1, text: 'Joint pain is much better today.', sender: 'patient', time: 'Yesterday' },
      { id: 2, text: 'Good to hear. Continue with exercises.', sender: 'doctor', time: 'Yesterday' },
    ],
    4: [
      { id: 1, text: 'Breathing is normal now, thank you doctor.', sender: 'patient', time: '2 days ago' },
      {
        id: 2,
        text: 'X-Ray results',
        sender: 'doctor',
        time: '2 days ago',
        file: { name: 'xray_results.jpg', type: 'image', size: '3.5 MB' }
      },
    ],
    5: [
      { id: 1, text: 'Chest pain has started again.', sender: 'patient', time: 'Today' },
      { id: 2, text: 'Come to emergency immediately!', sender: 'doctor', time: 'Today' },
      {
        id: 3,
        text: 'ECG Report',
        sender: 'patient',
        time: 'Today',
        file: { name: 'ecg_report.pdf', type: 'pdf', size: '4.1 MB' }
      },
    ]
  };

  const getAttachmentFromMessage = (msg) => {
    const attachmentUrl = getAttachmentUrl(msg);
    if (msg.file?.url) return msg.file;
    if (!attachmentUrl) return null;

    const rawType = msg.attachment_type || msg.attachment?.type || msg.file?.type || '';
    return {
      name: msg.attachment_name || msg.attachment?.name || msg.file?.name || 'Attachment',
      type: rawType.startsWith('image/') ? 'image' : rawType.includes('pdf') ? 'pdf' : 'document',
      size: msg.attachment_size ? `${(Number(msg.attachment_size) / (1024 * 1024)).toFixed(1)} MB` : '',
      url: attachmentUrl,
      mimeType: rawType,
    };
  };

  const cleanAttachmentMessageText = (text, file) => {
    const value = String(text || '').trim();
    if (!value) return '';
    const normalized = value.replace(/\\/g, '/').toLowerCase();
    const fileUrl = String(file?.url || '').replace(/\\/g, '/').toLowerCase();
    const fileName = String(file?.name || '').toLowerCase();

    if (normalized.includes('/uploads/') || normalized === fileUrl || normalized === fileName) {
      return '';
    }

    return value;
  };

  const normalizeMessage = (msg, index) => {
    const currentUserId = getCurrentUserId(authUser);
    const senderId = msg.sender_id || msg.senderId || msg.from_user_id || msg.user_id;
    const senderRole = msg.sender || msg.sender_role || msg.role;
    const createdAt = msg.time || msg.created_at || msg.createdAt || new Date().toISOString();
    const date = new Date(createdAt);
    const file = getAttachmentFromMessage(msg);

    return {
      id: msg.id || msg._id || index + 1,
      text: cleanAttachmentMessageText(msg.message || msg.text || msg.content || '', file),
      sender: senderRole || (String(senderId) === String(currentUserId) ? 'doctor' : 'patient'),
      time: Number.isNaN(date.getTime()) ? createdAt : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file,
      senderName: msg.sender_name || msg.senderName,
      senderPhone: msg.sender_phone || msg.senderPhone || msg.phone || msg.phone_number,
    };
  };

  const getSenderDetails = (message) => {
    if (message.senderName || message.senderPhone) {
      return {
        name: message.senderName || (message.sender === 'doctor' ? 'You' : 'Patient'),
        phone: message.senderPhone || '',
      };
    }

    if (message.sender === 'doctor') {
      return {
        name: authUser?.full_name || authUser?.fullname || authUser?.name || 'You',
        phone: authUser?.phone || authUser?.phone_number || '',
      };
    }

    return {
      name: currentPatient?.name || 'Patient',
      phone: currentPatient?.phone || '',
    };
  };

  useEffect(() => {
    const loadChat = async () => {
      try {
        setChatStatus('loading');
        setChatError('');

        const [chatList, conversation] = await Promise.all([
          getChatList(),
          getConversation(activePatientId),
        ]);

        const patientItem = chatList.find(item => {
          const p = item.patient || item.user || item;
          return String(p.id || p._id || p.patient_id || item.patient_id || p.user_id) === String(activePatientId);
        });
        const patient = patientItem?.patient || patientItem?.user || patientItem;
        const fallbackPatient = mockPatients.find(p => p.id === parseInt(activePatientId));
        const firstPatientMessage = conversation.find(message => String(message.sender_id) === String(activePatientId)) || conversation[0];

        setCurrentPatient(patient ? {
          id: patient.id || patient._id || patient.patient_id || patientItem?.patient_id || patient.user_id,
          name: patient.full_name || patient.fullname || patient.name || patient.patient_name || patientItem?.patient_name || 'Unknown Patient',
          age: patient.age || 'NA',
          gender: patient.gender || 'NA',
          condition: patient.condition || patient.diagnosis || patientItem?.condition || 'No condition',
          status: patient.status || patientItem?.status || 'Stable',
          lastVisit: patient.lastVisit || patient.last_visit || patientItem?.last_visit || patient.created_at || '',
          phone: patient.contact_number || patient.phone || patient.phone_number || '',
          avatarColor: '#3498db',
          bloodGroup: patient.bloodGroup || patient.blood_group || '',
        } : fallbackPatient || (firstPatientMessage ? {
          id: activePatientId,
          name: firstPatientMessage.sender_name || firstPatientMessage.receiver_name || 'Unknown Patient',
          age: 'NA',
          gender: 'NA',
          condition: 'No condition',
          status: 'Stable',
          lastVisit: firstPatientMessage.created_at || '',
          phone: firstPatientMessage.sender_phone || firstPatientMessage.phone || '',
          avatarColor: '#3498db',
          bloodGroup: '',
        } : null));

        setMessages(conversation.length ? conversation.map(normalizeMessage) : (mockChats[activePatientId] || []));
        setChatStatus('succeeded');
      } catch (err) {
        const fallbackPatient = mockPatients.find(p => p.id === parseInt(activePatientId));
        setCurrentPatient(fallbackPatient || null);
        setMessages(mockChats[activePatientId] || []);
        setChatError(err.response?.data?.message || err.message || 'Failed to load chat');
        setChatStatus('failed');
      }
    };

    loadChat();
  }, [activePatientId, authUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startTimedCall = async (callType) => {
    if (!currentPatient?.id) {
      setChatError(`Please select a patient before starting a ${callType} call`);
      return;
    }

    setChatError('');

    try {
      const response = await startCall({ receiverId: currentPatient.id, callType });
      const timeoutSeconds = response.ring_timeout_seconds || 30;
      setActiveCall({
        id: response.data?.id,
        type: callType,
        status: 'ringing',
        timeoutSeconds,
      });

      window.clearTimeout(callTimerRef.current);
      callTimerRef.current = window.setTimeout(() => {
        setActiveCall((call) => call?.status === 'ringing'
          ? { ...call, status: 'missed' }
          : call);
      }, timeoutSeconds * 1000);
    } catch (err) {
      setChatError(err.response?.data?.message || err.message || `Failed to start ${callType} call`);
    }
  };

  const handlePhoneCall = () => {
    startTimedCall('voice');
  };

  const handleVideoCall = () => {
    startTimedCall('video');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      const messageText = message.trim();
      const newMessage = {
        id: `local-${Date.now()}`,
        text: messageText,
        sender: 'doctor',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      setShowFileOptions(false);
      setIsSending(true);
      setChatError('');

      try {
        await sendMessage({ receiverId: activePatientId, message: messageText });
      } catch (err) {
        setChatError(err.response?.data?.message || err.message || 'Failed to send message');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleFileSelect = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      const fileName = file.name;

      const newMessage = {
        id: `file-${Date.now()}`,
        text: `File: ${fileName}`,
        sender: 'doctor',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        file: {
          name: fileName,
          type: fileType,
          size: fileSize
        }
      };
      setMessages((prev) => [...prev, newMessage]);
      setShowFileOptions(false);
      setChatError('');

      try {
        const response = await sendAttachment({
          receiverId: activePatientId,
          file,
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
        });
        const savedMessage = unwrapApiObject(response);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? normalizeMessage(savedMessage, prev.length) : msg
          )
        );
      } catch (err) {
        setChatError(err.response?.data?.message || err.message || 'Failed to upload attachment');
      } finally {
        e.target.value = '';
      }
    }
  };

  const formatTime = (timeString) => {
    const now = new Date();

    if (!timeString) return '';

    if (timeString.toLowerCase() === 'today') {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (timeString.toLowerCase() === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (timeString.includes('days ago')) {
      const days = parseInt(timeString);
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - days);
      return pastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return timeString;
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return <FaFilePdf />;
      case 'image': return <FaImage />;
      default: return <FaFile />;
    }
  };

  const getFileColor = (fileType) => {
    switch (fileType) {
      case 'pdf': return '#e74c3c';
      case 'image': return '#3498db';
      default: return '#2ecc71';
    }
  };

  const getInitials = (name) => String(name || 'JS')
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const selectConversation = (patient) => {
    setActivePatientId(String(patient.id));
    setCurrentPatient(patient);
    setMessages(mockChats[patient.id] || []);
    setChatError('');
  };

  const conversationRows = [
    {
      ...mockPatients[0],
      previewTitle: 'Hypertension',
      preview: "I've been feeling dizzy today...",
      time: '9:42 AM',
      unread: 2,
    },
    {
      ...mockPatients[1],
      name: 'Sarah Miller',
      previewTitle: 'Diabetes Type 2',
      preview: 'Blood sugar is 140...',
      time: '11:15 AM',
      status: 'Needs Attention',
    },
    {
      ...mockPatients[4],
      name: 'Robert Jones',
      previewTitle: 'Post-op Care',
      preview: 'incision_photo.jpg',
      time: 'Yesterday',
      status: 'Critical',
    },
    {
      ...mockPatients[4],
      id: 6,
      name: 'Robert Jones',
      previewTitle: 'Post-op Care',
      preview: 'incision_photo.jpg',
      time: 'Yesterday',
      status: 'Critical',
    },
    {
      ...mockPatients[1],
      id: 7,
      name: 'Sarah Miller',
      previewTitle: 'Diabetes Type 2',
      preview: 'Blood sugar is 140...',
      time: '11:15 AM',
      status: 'Needs Attention',
    },
  ];

  if (!currentPatient && chatStatus === 'loading') {
    return (
      <div className="patient-not-found">
        <h2>Loading chat...</h2>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="patient-not-found">
        <h2>Patient not found</h2>
        <button onClick={() => navigate('/patient-sms')} className="back-btn">
          <FaArrowLeft /> Back to Patient List
        </button>
      </div>
    );
  }

  return (
    <div className="patient-chat-container dc-communications-screen">
      <header className="dc-comms-page-header">
        <div>
          <h1>Patient Communications</h1>
          <p>Manage patient conversations and urgent communications.</p>
        </div>
      </header>

      <section className="dc-comms-stats">
        <article>
          <span className="dc-stat-icon critical">△</span>
          <span className="dc-stat-chip danger">+2 since 8am</span>
          <strong>5</strong>
          <b>Critical Patients</b>
          <small>Require immediate attention</small>
        </article>
        <article>
          <span className="dc-stat-icon unread">✉</span>
          <span className="dc-stat-chip blue">-4 trend</span>
          <strong>11</strong>
          <b>Unread Messages</b>
          <small>New patient inquiries</small>
        </article>
        <article>
          <span className="dc-stat-icon waiting">▣</span>
          <span className="dc-stat-chip neutral">stable</span>
          <strong>8</strong>
          <b>Waiting for Reply</b>
          <small>Awaiting clinical response</small>
        </article>
        <article>
          <span className="dc-stat-icon resolved">✓</span>
          <span className="dc-stat-chip success">+12% vs yesterday</span>
          <strong>23</strong>
          <b>Resolved Today</b>
          <small>Closed conversations</small>
        </article>
      </section>

      <div className="dc-comms-filters">
        <div className="dc-filter-tabs">
          {['All', 'Unread', 'Critical', 'Needs Attention', 'Stable', 'Improving', 'Archived'].map((tab) => (
            <button className={tab === 'All' ? 'active' : ''} type="button" key={tab}>
              {tab}
              {tab === 'Unread' && <span>11</span>}
            </button>
          ))}
        </div>
        <div className="dc-sort-actions">
          <button type="button">☰ Recent</button>
          <button type="button">≡ Filter</button>
        </div>
      </div>

      <main className="dc-comms-layout">
        <aside className="dc-conversation-list">
          <div className="dc-conversation-title">
            <h2>Conversations</h2>
            <button type="button">+</button>
          </div>

          {conversationRows.map((patient) => (
            <button
              className={`dc-conversation-item ${String(activePatientId) === String(patient.id) ? 'active' : ''}`}
              key={`${patient.id}-${patient.name}`}
              onClick={() => selectConversation(patient)}
              type="button"
            >
              <div className="dc-conversation-main">
                <div>
                  <strong>{patient.name}</strong>
                  <span className={`dc-status-tag ${patient.status.toLowerCase().replace(/\s+/g, '-')}`}>{patient.status}</span>
                </div>
                <small>{patient.previewTitle}</small>
                <p>{patient.preview}</p>
              </div>
              <div className="dc-conversation-meta">
                <span>{patient.time}</span>
                {patient.unread && <b>{patient.unread}</b>}
              </div>
            </button>
          ))}
        </aside>

        <section className="dc-chat-panel">
          <div className="dc-chat-profile">
            <div className="dc-chat-avatar">{getInitials(currentPatient.name)}</div>
            <div className="dc-chat-profile-info">
              <h2>{currentPatient.name} <span className={`dc-status-tag ${currentPatient.status.toLowerCase().replace(/\s+/g, '-')}`}>{currentPatient.status}</span></h2>
              <p>{currentPatient.age}{currentPatient.gender?.[0] || 'M'} • Blood {currentPatient.bloodGroup || 'O+'} • {currentPatient.condition}</p>
            </div>
            <div className="dc-profile-actions">
              <button type="button" onClick={handlePhoneCall} title="Voice call"><FaPhone /></button>
              <button type="button" onClick={handleVideoCall} title="Video call"><FaVideo /></button>
            </div>
          </div>

          <div className="dc-chat-body">
            <div className="dc-chat-date">Today</div>
            {messages.map((msg, index) => (
              <div className={`dc-message-row ${msg.sender}`} key={msg.id} style={{ '--message-index': index }}>
                {msg.sender !== 'doctor' && <span className="dc-message-avatar">{getInitials(currentPatient.name)}</span>}
                <div className="dc-message-stack">
                  <div className="dc-message-meta">
                    <strong>{msg.sender === 'doctor' ? 'You' : currentPatient.name}</strong>
                    <span>{formatTime(msg.time)}</span>
                  </div>
                  <div className="dc-message-bubble">
                    <p>{msg.text}</p>
                    {msg.file && (
                      <div className="file-attachment" style={{ borderColor: getFileColor(msg.file.type) }}>
                        <div className="file-icon" style={{ color: getFileColor(msg.file.type) }}>{getFileIcon(msg.file.type)}</div>
                        <div className="file-info">
                          <span className="file-name">{msg.file.name}</span>
                          <span className="file-size">{msg.file.size}</span>
                          {msg.file.url && (
                            <a href={msg.file.url} target="_blank" rel="noreferrer" className="file-download-link">
                              Open attachment
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {msg.sender === 'doctor' && <span className="dc-message-avatar doctor">{getInitials(authUser?.name || 'You')}</span>}
              </div>
            ))}
            <div className="dc-new-divider"><span>New Messages</span></div>
            <div ref={messagesEndRef} />
          </div>

          <div className="dc-quick-actions">
            <button type="button">▣ Schedule Appointment</button>
            <button type="button">▤ Request Reports</button>
            <button type="button">☤ Upload Prescription</button>
            <button type="button">⟳ Follow Up</button>
          </div>

          {showFileOptions && (
            <div className="file-options-popup dc-file-popup">
              <div className="file-options-content">
                <button className="file-option-btn" onClick={() => handleFileSelect('image')} type="button"><FaImage /> Image</button>
                <button className="file-option-btn" onClick={() => handleFileSelect('document')} type="button"><FaFilePdf /> Document</button>
                <button className="file-option-btn" onClick={() => handleFileSelect('medical')} type="button"><FaFileMedical /> Medical Record</button>
              </div>
            </div>
          )}

          {activeCall && (
            <div className={`dc-call-status ${activeCall.status}`}>
              {activeCall.status === 'ringing'
                ? `${activeCall.type === 'video' ? 'Video' : 'Voice'} call ringing... auto cut in ${activeCall.timeoutSeconds}s if not accepted`
                : `${activeCall.type === 'video' ? 'Video' : 'Voice'} call missed / auto cut`}
            </div>
          )}

          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

          <form className="message-input-form dc-message-input-form" onSubmit={handleSendMessage}>
            <button type="button" className="attach-btn" onClick={() => setShowFileOptions(!showFileOptions)} aria-label="Attach file">
              <FaPaperclip />
            </button>
            <button type="button" className="dc-smile-btn" aria-label="Emoji">☺</button>
            <input
              type="text"
              placeholder={`Type a message to ${currentPatient.name.split(' ')[0]}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
            />
            <button type="button" className="dc-mic-btn" aria-label="Voice">♩</button>
            <button type="submit" className="send-btn" disabled={!message.trim() || isSending} aria-label="Send message">
              <FaPaperPlane />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default PatientChat;
