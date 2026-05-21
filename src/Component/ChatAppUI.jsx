import React, { useState } from "react";
import {
  IoArrowBack,
  IoCall,
  IoVideocam,
  IoEllipsisVertical,
  IoAdd,
  IoMic,
  IoSend,
} from "react-icons/io5";

// Dummy messages data (static)
const DUMMY_MESSAGES = [
  { id: 1, type: "received", text: "Hey! How are you?", timestamp: "10:30 AM" },
  {
    id: 2,
    type: "sent",
    text: "Hi! I'm doing great, thanks for asking!",
    timestamp: "10:31 AM",
  },
  {
    id: 3,
    type: "received",
    text: "That's awesome! Want to grab coffee later?",
    timestamp: "10:32 AM",
  },
  {
    id: 4,
    type: "sent",
    text: "Sure! How about 3 PM at the usual place?",
    timestamp: "10:33 AM",
  },
  {
    id: 5,
    type: "received",
    text: "Perfect! See you then ���",
    timestamp: "10:34 AM",
  },
  { id: 6, type: "typing" },
];

export default function ChatAppUI() {
  const [message, setMessage] = useState("");
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }

    // Keep typing flow uninterrupted after sending.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      {/* Chat Container - Responsive */}
      <div className="w-full md:max-w-[420px] md:rounded-2xl md:shadow-2xl md:overflow-hidden bg-white flex flex-col h-screen md:h-[700px]">
        {/* Header - WhatsApp Style */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/20 rounded-full transition">
              <IoArrowBack size={22} className="text-white" />
            </button>

            {/* Avatar with online dot */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-base">
                SR
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col">
              <h2 className="font-bold text-white">Sarah Rose</h2>
              <p className="text-xs text-teal-100">online</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/20 rounded-full transition text-white">
              <IoCall size={20} />
            </button>
            <button className="p-2 hover:bg-white/20 rounded-full transition text-white">
              <IoVideocam size={20} />
            </button>
            <button className="p-2 hover:bg-white/20 rounded-full transition text-white">
              <IoEllipsisVertical size={20} />
            </button>
          </div>
        </div>

        {/* Chat Messages Area - WhatsApp Style */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-4 space-y-2">
          {DUMMY_MESSAGES.map((msg, idx) => {
            if (msg.type === "typing") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 flex gap-1.5 items-end shadow-sm">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              );
            }

            const isSent = msg.type === "sent";

            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-xs md:max-w-sm">
                  {/* Message Bubble - WhatsApp Style */}
                  <div
                    className={`px-4 py-2.5 shadow-sm ${
                      isSent
                        ? "bg-teal-100 text-gray-900 rounded-2xl rounded-br-sm"
                        : "bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-normal font-normal tracking-wide">
                      {msg.text}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`flex ${isSent ? "justify-end" : "justify-start"} gap-1 mt-0.5 px-2`}
                  >
                    <span className="text-xs text-gray-400 font-medium">
                      {idx < DUMMY_MESSAGES.length - 1 ? msg.timestamp : ""}
                    </span>
                    {isSent && (
                      <span className="text-xs text-teal-500 font-semibold">
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar - WhatsApp Style */}
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <button className="p-2.5 hover:bg-gray-100 rounded-full transition text-teal-600">
              <IoAdd size={22} />
            </button>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 text-gray-900 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition placeholder-gray-500"
            />

            {/* Microphone Button */}
            <button className="p-2.5 hover:bg-gray-100 rounded-full transition text-teal-600">
              <IoMic size={20} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center transition transform hover:scale-105 active:scale-95 text-white shadow-sm"
            >
              <IoSend size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
