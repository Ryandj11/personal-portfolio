"use client";

import { ViewType } from "./3d/CameraController";

interface NavigationOverlayProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function NavigationOverlay({
  currentView,
  onViewChange,
}: NavigationOverlayProps) {
  return (
    <div className="navigation-overlay">
      <div className="nav-buttons">
        <button
          className={`nav-button ${currentView === "room" ? "active" : ""}`}
          onClick={() => onViewChange("room")}
          disabled={currentView === "room"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          View Room
        </button>
        <button
          className={`nav-button ${currentView === "monitor" ? "active" : ""}`}
          onClick={() => onViewChange("monitor")}
          disabled={currentView === "monitor"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Use Computer
        </button>
      </div>

      <style jsx>{`
        .navigation-overlay {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          pointer-events: none;
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          pointer-events: auto;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .nav-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .nav-button.active {
          background: linear-gradient(
            135deg,
            rgba(138, 43, 226, 0.6),
            rgba(75, 0, 130, 0.6)
          );
          border-color: rgba(138, 43, 226, 0.5);
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
        }

        .nav-button:disabled {
          cursor: default;
        }

        .nav-button svg {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
