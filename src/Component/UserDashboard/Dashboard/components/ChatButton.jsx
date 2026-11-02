import React from "react";
import AiFaceIcon from '../../../common/AiFaceIcon';
const ChatButton = ({ onClick }) => (
  <div className="ud-floating-chat-wrap">
    {/* <span className="ud-float-ring ud-float-ring-1" />
    <span className="ud-float-ring ud-float-ring-2" /> */}
    <button className="ud-floating-chat-btn" onClick={onClick} title="Chat with AI Assistant" aria-label="Open AI chat">
      <AiFaceIcon className="ud-floating-ai-star" />
    </button>
  </div>
);

export default ChatButton;
