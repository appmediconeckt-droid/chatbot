import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SMSInput.css";

/**
 * SMSInput Component - Message input with call buttons
 * Receives selected user from route state
 */
const SMSInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [callActive, setCallActive] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Get selected user from navigation state
  const selectedUser = location.state?.selectedUser;

  const [messages, setMessages] = useState([
    { id: 1, sender: "user", text: "Hi Dr. Sharma, when can we schedule our next session?", time: "10:30 AM" },
    { id: 2, sender: "me", text: "Hello! How about Thursday at 11 AM?", time: "10:32 AM" },
    { id: 3, sender: "user", text: "That works perfectly!", time: "10:33 AM" },
  ]);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  // Icon-only call buttons - no functionality, just visual buttons
  const handleCall = (type) => {
    // Completely empty - no modal, no functionality
    // Just a visual button as requested
  };

  const handleBack = () => {
    
    navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
  };

  if (!selectedUser) {
    return (
      <div className="smsinput-container no-user">
        <div className="smsinput-empty-state">
          <span className="empty-icon">💬</span>
          <h3>No user selected</h3>
          <p>Please select a user from the list to start messaging</p>
          <button className="back-to-list-btn" onClick={handleBack}>
            ← Back to SMS List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smsinput-container">
      {/* Header with Back Button and User Info */}
      <div className="smsinput-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack} title="Back to SMS List">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
            </svg>
           
          </button>
          
          <div className="smsinput-user-info">
            <div className="smsinput-user-avatar">
              {selectedUser.avatar || "👤"}
              <span className={`status-dot ${selectedUser.status || 'online'}`}></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{selectedUser.name}</h3>
              <p className="smsinput-user-phone">{selectedUser.phone}</p>
              <p className="smsinput-user-email">{selectedUser.email}</p>
            </div>
          </div>
        </div>

        {/* Icon-only call buttons - no text, no functionality */}
        <div className="smsinput-call-buttons">
          <button
            className="call-btn voice"
            onClick={handleCall}
            title="Voice call (demo)"
          >
            <span className="call-icon">📞</span>
          </button>
          <button
            className="call-btn video"
            onClick={handleCall}
            title="Video call (demo)"
          >
            <span className="call-icon">📹</span>
          </button>
        </div>
      </div>

      {/* Messages Display Area */}
      <div className="smsinput-messages" ref={messagesContainerRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`smsinput-message ${msg.sender === 'me' ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              <p className="message-text">{msg.text}</p>
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}
        {/* Empty div for scrolling reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form className="smsinput-form" onSubmit={handleSendMessage}>
        <div className="smsinput-input-wrapper">
          <button type="button" className="attach-btn" title="Attach file">
            📎
          </button>
          <button type="button" className="emoji-btn" title="Add emoji">
            😊
          </button>
          <input
            type="text"
            className="smsinput-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className={`send-btn ${message.trim() ? 'active' : ''}`}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </form>

      {/* Quick Reply Suggestions */}
     
    </div>
  );
};

export default SMSInput;