"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Lock, Search, Star, MoreVertical } from "lucide-react";
import { Sun, Moon } from "@phosphor-icons/react";
import type { Theme } from "./BrowserWindow";
import { ProfileDropdown } from "./ProfileDropdown";

interface AddressBarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onUrlChange: (url: string) => void;
  onNavigate: (url: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function AddressBar({
  url,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
  onSearch,
  onUrlChange,
  onNavigate,
  theme,
  onThemeChange,
}: AddressBarProps) {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = inputValue.trim();
      if (value) {
        if (value.startsWith("ryan://") || value.includes(".")) {
          onUrlChange(value);
        } else {
          onSearch(value);
        }
      }
    }
  };

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

  // Sync inputValue with url prop when it changes
  useEffect(() => {
    // When not focused, show clean URL without protocol
    if (!isFocused) {
      setInputValue(url);
    }
  }, [url, isFocused]);

  // Convert URL to display format with https:// protocol
  const getFullUrl = (url: string) => {
    // Convert ryan://path to https://ryan/path for display
    return url.replace('ryan://', 'https://ryan/');
  };

  // Handle focus - show full URL with protocol
  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(getFullUrl(url));
  };

  // Handle blur - revert to clean URL
  const handleBlur = () => {
    setIsFocused(false);
    setInputValue(url);
  };



  // Define theme-aware colors matching Google's light mode
  const colors = {
    addressBar: {
      bg: theme === "dark" ? "#323639" : "#e8eaed",
      border: theme === "dark" ? "#000000" : "#dadce0",
    },
    urlBar: {
      bg: theme === "dark" ? "#202124" : "#ffffff",
      bgHover: theme === "dark" ? "#292a2d" : "#f8f9fa",
      border: theme === "dark" ? "transparent" : "#dadce0",
      focusBorder: theme === "dark" ? "rgba(59, 130, 246, 0.5)" : "rgba(26, 115, 232, 0.5)",
      focusRing: theme === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(26, 115, 232, 0.1)",
    },
    text: {
      primary: theme === "dark" ? "#e5e7eb" : "#202124",
      secondary: theme === "dark" ? "#9ca3af" : "#3c4043",
      disabled: theme === "dark" ? "#4b5563" : "#80868b",
      placeholder: theme === "dark" ? "#6b7280" : "#5f6368",
    },
    icon: {
      enabled: theme === "dark" ? "#d1d5db" : "#3c4043",
      disabled: theme === "dark" ? "#4b5563" : "#80868b",
      hover: theme === "dark" ? "#ffffff" : "#202124",
    },
    button: {
      hoverBg: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(60, 64, 67, 0.08)",
    },
  };

  return (
    <div style={{ backgroundColor: colors.addressBar.bg, borderColor: colors.addressBar.border }} className="flex items-center gap-2 px-2 py-1.5 border-b">
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          style={{
            color: canGoBack ? colors.icon.enabled : colors.icon.disabled,
          }}
          className="p-1.5 rounded-full transition-colors"
          onMouseEnter={(e) => canGoBack && (e.currentTarget.style.backgroundColor = colors.button.hoverBg)}
          onMouseLeave={(e) => canGoBack && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          style={{
            color: canGoForward ? colors.icon.enabled : colors.icon.disabled,
          }}
          className="p-1.5 rounded-full transition-colors"
          onMouseEnter={(e) => canGoForward && (e.currentTarget.style.backgroundColor = colors.button.hoverBg)}
          onMouseLeave={(e) => canGoForward && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={onRefresh}
          style={{ color: colors.icon.enabled }}
          className="p-1.5 rounded-full transition-colors mr-1"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.button.hoverBg}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <RotateCw size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* URL Bar */}
      <div
        style={{
          backgroundColor: isFocused ? colors.urlBar.bg : colors.urlBar.bg,
          borderColor: isFocused ? colors.urlBar.focusBorder : colors.urlBar.border,
          boxShadow: isFocused ? `0 0 0 4px ${colors.urlBar.focusRing}` : 'none',
        }}
        className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all h-[28px]"
        onMouseEnter={(e) => !isFocused && (e.currentTarget.style.backgroundColor = colors.urlBar.bgHover)}
        onMouseLeave={(e) => !isFocused && (e.currentTarget.style.backgroundColor = colors.urlBar.bg)}
      >
        <Lock size={12} style={{ color: colors.icon.disabled }} className="flex-shrink-0" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search Google or type a URL"
          style={{
            color: colors.text.primary,
          }}
          className="flex-1 bg-transparent text-sm outline-none min-w-0 font-normal placeholder-opacity-60"
        />
        <button 
          style={{ color: colors.icon.disabled }}
          className="transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.color = colors.icon.enabled}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.icon.disabled}
        >
            <Star size={14} />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 px-1">
          {/* Profile Dropdown */}
          <ProfileDropdown
            theme={theme}
            onThemeChange={onThemeChange}
            onNavigate={onNavigate}
            showViewProfile={true}
            colors={{
              bg: {
                primary: colors.urlBar.bg,
                secondary: colors.urlBar.bgHover,
                hover: colors.button.hoverBg,
              },
              text: {
                primary: colors.text.primary,
                secondary: colors.text.secondary,
                tertiary: colors.text.secondary,
              },
              border: colors.addressBar.border,
            }}
          />
          <div ref={dropdownRef} className="relative">
            <button 
              style={{ 
                color: showDropdown ? colors.icon.enabled : colors.icon.disabled,
                backgroundColor: showDropdown ? colors.button.hoverBg : 'transparent'
              }}
              className="p-1 rounded-full transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
              onMouseEnter={(e) => {
                if (!showDropdown) {
                  e.currentTarget.style.backgroundColor = colors.button.hoverBg;
                  e.currentTarget.style.color = colors.icon.enabled;
                }
              }}
              onMouseLeave={(e) => {
                if (!showDropdown) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.icon.disabled;
                }
              }}
            >
              <MoreVertical size={16} style={{ color: colors.icon.enabled }} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                style={{ 
                  backgroundColor: colors.urlBar.bg,
                  borderColor: colors.addressBar.border,
                  color: colors.text.primary
                }}
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-2 z-50"
              >
                <button
                  onClick={() => {
                    onThemeChange(theme === 'dark' ? 'light' : 'dark');
                  }}
                  style={{ color: colors.text.primary }}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.button.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                </button>
              </div>
            )}
          </div>
      </div>


    </div>
  );
}
