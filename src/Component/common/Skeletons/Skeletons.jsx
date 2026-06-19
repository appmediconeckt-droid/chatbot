import React from "react";
import "./Skeletons.css";

/**
 * Reusable shimmer skeletons.
 *   ListSkeleton  — avatar + two text lines per row (chat list, call history)
 *   CardSkeleton  — card grid with header + lines + action buttons (appointments, sessions)
 */

export function ListSkeleton({ rows = 7 }) {
  return (
    <div className="skel-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <div className="skel skel-avatar" />
          <div className="skel-row-body">
            <div className="skel skel-line lg" style={{ width: "45%" }} />
            <div className="skel skel-line sm" style={{ width: "75%" }} />
          </div>
          <div className="skel skel-line sm" style={{ width: 40 }} />
        </div>
      ))}
    </div>
  );
}

/**
 * ChatListSkeleton — mirrors the exact `smslist-user-item` markup used in the
 * counselor Messages list, so the placeholder lines up pixel-for-pixel with the
 * real rows (avatar + name/time row + message preview + details).
 */
export function ChatListSkeleton({ rows = 8 }) {
  return (
    <div className="smslist-users">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="smslist-user-item" style={{ cursor: "default" }}>
          <div className="smslist-user-avatar">
            <div
              className="skel"
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          </div>
          <div className="smslist-user-info">
            <div className="smslist-user-row">
              <span className="skel skel-line" style={{ width: "42%", height: 14 }} />
              <span className="skel skel-line" style={{ width: 34, height: 10 }} />
            </div>
            <div className="smslist-last-message">
              <span className="skel skel-line" style={{ width: "72%", height: 12 }} />
            </div>
            <div className="smslist-user-details">
              <span className="skel skel-line" style={{ width: "30%", height: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ cards = 6 }) {
  return (
    <div className="skel-cards">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="skel-card">
          <div className="skel-card-head">
            <div className="skel skel-avatar" />
            <div className="skel-row-body">
              <div className="skel skel-line lg" style={{ width: "60%" }} />
              <div className="skel skel-line sm" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="skel skel-line" style={{ width: "90%" }} />
          <div className="skel skel-line" style={{ width: "70%" }} />
          <div className="skel-card-actions">
            <div className="skel skel-btn" />
            <div className="skel skel-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default { ListSkeleton, ChatListSkeleton, CardSkeleton };
