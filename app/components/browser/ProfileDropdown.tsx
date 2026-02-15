"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Envelope, GithubLogo, LinkedinLogo, MagicWand } from "@phosphor-icons/react";
import type { Theme } from "./BrowserWindow";

interface ProfileDropdownProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNavigate?: (url: string) => void;
  showViewProfile?: boolean;
  colors: {
    bg: {
      primary: string;
      secondary?: string;
      hover: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary?: string;
    };
    border: string;
  };
}

export function ProfileDropdown({
  theme,
  onThemeChange,
  onNavigate,
  showViewProfile = true,
  colors,
}: ProfileDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Handle copy email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("ryanjohnson1105@gmail.com");
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 3000);
  };

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <div 
          className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-base text-white font-medium cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          R
        </div>

        {/* Profile Dropdown Menu */}
        {showDropdown && (
          <div 
            style={{ 
              backgroundColor: colors.bg.secondary || colors.bg.primary,
              borderColor: colors.border,
              color: colors.text.primary
            }}
            className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Profile Header */}
            <div className="px-4 pb-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-medium text-white">
                  R
                </div>
                <div className="flex-1">
                  <div style={{ color: colors.text.primary }} className="font-semibold text-base">
                    Ryan Johnson
                  </div>
                  <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="text-sm">
                    ryanjohnson1105@gmail.com
                  </div>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.bg.primary }}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span style={{ color: colors.text.secondary }} className="text-sm">
                  Online
                </span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="px-2 py-3 border-b" style={{ borderColor: colors.border }}>
              <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="px-2 text-xs font-semibold mb-2 uppercase tracking-wide">
                Contact
              </div>
              
              <button
                onClick={handleCopyEmail}
                style={{ color: colors.text.primary }}
                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bg.primary }}>
                  <Envelope size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Email me</div>
                  <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="text-xs">
                    ryanjohnson1105@gmail.com
                  </div>
                </div>
              </button>

              <a
                href="https://www.linkedin.com/in/ryanjohnson1105/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: colors.text.primary }}
                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bg.primary }}>
                  <LinkedinLogo size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">LinkedIn</div>
                  <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="text-xs">
                    Connect professionally
                  </div>
                </div>
              </a>

              <a
                href="https://github.com/Ryandj11"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: colors.text.primary }}
                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.bg.primary }}>
                  <GithubLogo size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">GitHub</div>
                  <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="text-xs">
                    View my projects
                  </div>
                </div>
              </a>
            </div>

            {/* Quick Actions */}
            <div className="px-2 py-2">
              <button
                onClick={() => {
                  onThemeChange(theme === 'dark' ? 'light' : 'dark');
                }}
                style={{ color: colors.text.primary }}
                className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification for Copied Email */}
      {showCopiedToast && (
        <div 
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div 
            style={{ backgroundColor: colors.bg.secondary || colors.bg.primary, borderColor: colors.border }}
            className="px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ color: colors.text.primary }} className="font-medium text-sm">
                Email copied!
              </div>
              <div style={{ color: colors.text.tertiary || colors.text.secondary }} className="text-xs">
                ryanjohnson1105@gmail.com
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
