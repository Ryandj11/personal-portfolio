"use client";

import { Microphone, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, KeyboardEvent } from "react";
import type { Theme } from "../BrowserWindow";

interface HomePageProps {
  onSearch: (query: string) => void;
  onNavigate?: (url: string) => void;
  theme: Theme;
}

export function HomePage({ onSearch, onNavigate, theme }: HomePageProps) {
  const [query, setQuery] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      onSearch(query.trim());
    }
  };

  const suggestions = [
    { text: "Who is Ryan?", query: "Who is Ryan?" },
    { text: "What is his experience?", query: "What is Ryan's experience?" },
    { text: "Show me projects", query: "What projects has Ryan built?" },
    { text: "What is his tech stack?", query: "What is Ryan's tech stack?" },
  ];

  // Define theme-aware colors
  const colors = {
    bg: {
      primary: theme === "dark" ? "#202124" : "#ffffff",
      secondary: theme === "dark" ? "#303134" : "#f1f3f4",
      hover: theme === "dark" ? "#3c4043" : "#e8eaed",
    },
    text: {
      primary: theme === "dark" ? "#e8eaed" : "#202124",
      secondary: theme === "dark" ? "#bdc1c6" : "#3c4043",
      tertiary: theme === "dark" ? "#9aa0a6" : "#5f6368",
    },
    border: theme === "dark" ? "#303134" : "#dadce0",
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, color: colors.text.primary }} className="flex flex-col items-center min-h-full pt-[8vh] px-4">
      {/* Logo Area */}
      <div className="flex flex-col items-center mb-8 select-none animate-in fade-in zoom-in duration-500">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-2">
          <span className="text-[#4285F4]">R</span>
          <span className="text-[#EA4335]">y</span>
          <span className="text-[#FBBC05]">a</span>
          <span className="text-[#4285F4]">n</span>
          <span className="text-[#4285F4]"> </span>
          <span className="text-[#34A853]">J</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#4285F4]">h</span>
          <span className="text-[#EA4335]">n</span>
          <span className="text-[#FBBC05]">s</span>
          <span className="text-[#34A853]">o</span>
          <span className="text-[#EA4335]">n</span>
        </h1>
        <p style={{ color: colors.text.tertiary }} className="text-lg mt-2 font-medium tracking-wide">
          Software Engineer | Computer Science @ SJSU
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-[584px]">
        <div className="relative group">
          <div 
            style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }}
            className="flex items-center w-full rounded-full px-5 py-3 transition-all duration-200 border shadow-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }}
          >
            <MagnifyingGlass style={{ color: colors.text.tertiary }} className="mr-4" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ color: colors.text.primary }}
              className="flex-1 bg-transparent border-none outline-none text-base placeholder-opacity-60"
              placeholder="Ask anything... e.g., 'What is Ryan's tech stack?'"
              autoFocus
            />
            <Microphone
              className="text-[#4285f4] ml-4 cursor-pointer hover:text-white transition-colors"
              size={20}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => onNavigate?.("ryan://about")}
            style={{ backgroundColor: colors.bg.secondary, color: colors.text.primary, borderColor: colors.border }}
            className="px-4 py-2 border rounded text-sm transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.text.tertiary}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
          >
            View Profile
          </button>
        </div>

        {/* Suggested Searches / Hints */}
        <div className="mt-12 text-center">
          <p style={{ color: colors.text.tertiary }} className="text-sm mb-4">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSearch(s.query)}
                style={{ backgroundColor: `${colors.bg.secondary}80`, borderColor: colors.border, color: colors.text.secondary }}
                className="px-4 py-2 border rounded-full text-sm transition-all flex items-center gap-2"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.bg.secondary}80`;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <MagnifyingGlass size={14} />
                {s.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
