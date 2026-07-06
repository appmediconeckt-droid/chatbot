import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";
import { API_BASE_URL } from "../../axiosConfig";
import { getCallHistoryTone } from "./callHistoryStyle";

// Compact, conversation-specific call history. The full Call History tab
// remains the place for all calls; this only shows calls with the person in
// the currently open chat.
const ChatCallHistory = ({ userId, peerId }) => {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    let active = true;

    const loadCalls = async () => {
      if (!userId || !peerId) {
        if (active) setCalls([]);
        return;
      }

      try {
        const token =
          localStorage.getItem("accessToken") || localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/history/${userId}`,
          {
            params: { page: 1, limit: 100 },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const matchingCalls = (response.data?.history || [])
          .filter((call) => String(call.withId) === String(peerId))
          .slice(0, 10);

        if (active) setCalls(matchingCalls);
      } catch (error) {
        // A call-history failure should never interrupt the chat itself.
        console.warn("Unable to load chat call history:", error.message);
        if (active) setCalls([]);
      }
    };

    void loadCalls();
    return () => {
      active = false;
    };
  }, [userId, peerId]);

  const callsByDate = calls
    .slice()
    .sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp))
    .reduce((groups, call) => {
      const timestamp = new Date(call.timestamp);
      const dateKey = Number.isNaN(timestamp.getTime())
        ? "Call history"
        : timestamp.toLocaleDateString([], {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
      groups[dateKey] = groups[dateKey] || [];
      groups[dateKey].push(call);
      return groups;
    }, {});

  if (!calls.length) return null;

  return (
    <section
      aria-label="Call history"
      style={{
        margin: "8px 12px 16px",
      }}
    >
      {Object.entries(callsByDate).map(([dateLabel, dailyCalls]) => (
        <div key={dateLabel} style={{ marginBottom: "14px" }}>
          {/* WhatsApp-style day separator: a call appears beneath the date it happened. */}
          <div style={{ textAlign: "center", margin: "8px 0 10px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "8px",
                background: "#e2e8f0",
                color: "#475569",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {dateLabel}
            </span>
          </div>
          {dailyCalls.map((call) => {
            const timestamp = new Date(call.timestamp);
            const isVideo = String(call.type).toLowerCase() === "video";
            const direction = call.role === "initiator" ? "Outgoing" : "Incoming";
            const isOutgoing = call.role === "initiator";
            const callTone = getCallHistoryTone(call);
            const callTextColor = callTone.variant === "neutral" ? "#334155" : callTone.color;
            const time = Number.isNaN(timestamp.getTime())
              ? ""
              : timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={call.id || `${call.timestamp}-${call.type}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  margin: isOutgoing ? "0 0 7px auto" : "0 auto 7px 0",
                  padding: "9px 12px",
                  maxWidth: "360px",
                  borderRadius: "10px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${callTone.borderColor}`,
                  fontSize: "13px",
                  color: callTextColor,
                }}
              >
                <span style={{ color: callTextColor }}>{isVideo ? <FaVideo /> : <FaPhoneAlt />}</span>
                <span style={{ flex: 1 }}>{direction} {isVideo ? "video" : "voice"} call</span>
                <span style={{ color: callTextColor }}>{time}{call.duration ? ` • ${call.duration}` : ""}</span>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
};

export default ChatCallHistory;
