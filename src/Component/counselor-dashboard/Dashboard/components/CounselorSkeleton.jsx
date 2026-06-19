import React from "react";

/**
 * CounselorSkeleton
 *
 * Shimmer placeholder shown while the counselor dashboard data loads. Mirrors
 * the real layout (sidebar + main content) so the transition feels seamless
 * instead of a blank spinner.
 */
const shimmer = "couns-skel-shimmer";

export default function CounselorSkeleton() {
  return (
    <div className="couns-skeleton">
      {/* Sidebar */}
      <aside className="couns-skel-sidebar">
        <div className="couns-skel-profile">
          <div className={`couns-skel-avatar ${shimmer}`} />
          <div className={`couns-skel-line ${shimmer}`} style={{ width: "70%" }} />
          <div className={`couns-skel-line ${shimmer}`} style={{ width: "55%" }} />
        </div>
        <div className="couns-skel-nav">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`couns-skel-nav-item ${shimmer}`} />
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="couns-skel-main">
        <div className={`couns-skel-header ${shimmer}`} />

        <div className="couns-skel-cards">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`couns-skel-card ${shimmer}`} />
          ))}
        </div>

        <div className="couns-skel-rows">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`couns-skel-row ${shimmer}`} />
          ))}
        </div>
      </main>
    </div>
  );
}
