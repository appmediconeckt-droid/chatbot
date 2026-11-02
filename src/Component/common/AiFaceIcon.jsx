import React from 'react';
import { logoIcon } from '../../assets/brandAssets';
import './AiFaceIcon.css';

export default function AiFaceIcon({ className = '' }) {
  return (
    <svg className={`ai-face-icon ${className}`} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <image href={logoIcon} width="512" height="512" />
      {/* Keep the existing face artwork and animate only its eyes. */}
      <ellipse cx="187" cy="288" rx="22" ry="29" fill="#fdfdfd" />
      <ellipse cx="337" cy="288" rx="22" ry="29" fill="#fdfdfd" />
      <g className="ai-face-icon__eye">
        <ellipse cx="187" cy="288" rx="17" ry="24" fill="#024649" />
        <circle cx="189" cy="278" r="6.5" fill="#fff" />
      </g>
      <g className="ai-face-icon__eye">
        <ellipse cx="337" cy="288" rx="17" ry="24" fill="#024649" />
        <circle cx="339" cy="278" r="6.5" fill="#fff" />
      </g>
    </svg>
  );
}
