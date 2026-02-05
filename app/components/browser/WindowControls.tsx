"use client";

interface WindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function WindowControls({ onClose, onMinimize, onMaximize }: WindowControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClose}
        className="group w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors flex items-center justify-center"
        aria-label="Close"
      >
        <svg
          className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
      <button
        onClick={onMinimize}
        className="group w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors flex items-center justify-center"
        aria-label="Minimize"
      >
        <svg
          className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 6h8" />
        </svg>
      </button>
      <button
        onClick={onMaximize}
        className="group w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors flex items-center justify-center"
        aria-label="Maximize"
      >
        <svg
          className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="2" width="8" height="8" rx="1" />
        </svg>
      </button>
    </div>
  );
}

