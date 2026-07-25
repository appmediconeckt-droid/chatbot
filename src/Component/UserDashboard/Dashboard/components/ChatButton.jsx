import React from "react";

const ChatButton = ({ onClick, unreadCount }) => (
  <div className="ud-floating-chat-wrap">
    {/* <span className="ud-float-ring ud-float-ring-1" />
    <span className="ud-float-ring ud-float-ring-2" /> */}
    <button className="ud-floating-chat-btn" onClick={onClick} title="Chat with AI Assistant" aria-label="Open AI chat">
      <span className="ud-floating-ai-star" aria-hidden="true">✦</span>
      {unreadCount > 0 && <span className="ud-unread-badge">{unreadCount}</span>}
    </button>
  </div>
);

export default ChatButton;
