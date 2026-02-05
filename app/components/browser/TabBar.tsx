"use client";

import { Plus, X } from "lucide-react";
import { Favicon } from "./Favicon";
import type { Theme } from "./BrowserWindow";

export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive?: boolean;
  pinned?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab?: () => void;
  theme: Theme;
}

export function TabBar({
  tabs,
  onTabClick,
  onTabClose,
  onNewTab,
  theme,
}: TabBarProps) {
  // Define theme-aware colors
  const colors = {
    container: theme === "dark" ? "#202124" : "#dee1e6",
    activeTab: theme === "dark" ? "#323639" : "#e8eaed",
    inactiveTab: theme === "dark" ? "#202124" : "#dee1e6",
    activeText: theme === "dark" ? "#ffffff" : "#202124",
    inactiveText: theme === "dark" ? "#9ca3af" : "#3c4043",
    inactiveHoverText: theme === "dark" ? "#e5e7eb" : "#202124",
    buttonHover: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(60, 64, 67, 0.08)",
  };

  return (
    <div style={{ backgroundColor: colors.container }} className="flex items-end gap-1 px-2 pt-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          style={{
            backgroundColor: tab.isActive ? colors.activeTab : colors.inactiveTab,
            color: tab.isActive ? colors.activeText : colors.inactiveText,
          }}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer min-w-[140px] max-w-[240px] h-[36px] transition-all duration-150 select-none"
          onMouseEnter={(e) => {
            if (!tab.isActive) {
              e.currentTarget.style.color = colors.inactiveHoverText;
            }
          }}
          onMouseLeave={(e) => {
            if (!tab.isActive) {
              e.currentTarget.style.color = colors.inactiveText;
            }
          }}
        >
          {/* Chrome-style curve effect for active tab */}
          {tab.isActive && (
            <>
              {/* Left Curve */}
              <div className="absolute bottom-0 -left-2 w-2 h-2 pointer-events-none">
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M8 8H0C4.41828 8 8 4.41828 8 0V8Z" fill={colors.activeTab} />
                </svg>
              </div>
              {/* Right Curve */}
              <div className="absolute bottom-0 -right-2 w-2 h-2 pointer-events-none">
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 8H8C3.58172 8 0 4.41828 0 0V8Z" fill={colors.activeTab} />
                </svg>
              </div>
            </>
          )}

          {/* Favicon */}
          <div className="shrink-0 opacity-100">
            <Favicon id={tab.id} isActive={tab.isActive} className="w-4 h-4" />
          </div>

          {/* Title */}
          <span className="text-xs truncate flex-1 font-normal">
            {tab.title}
          </span>

          {/* Close button - hidden for pinned tabs */}
          {!tab.pinned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              style={{
                opacity: tab.isActive ? 1 : 0,
              }}
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.buttonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}

      {/* New Tab Button */}
      {onNewTab && (
        <button
          onClick={onNewTab}
          style={{ color: colors.inactiveText }}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors ml-1"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
            e.currentTarget.style.color = colors.inactiveHoverText;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.inactiveText;
          }}
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
