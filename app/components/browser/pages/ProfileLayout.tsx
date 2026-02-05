"use client";

import {
  MapPin,
  GraduationCap,
  Code,
  GithubLogo,
  LinkedinLogo,
  XLogo,
  MagnifyingGlass,
  DotsThreeVertical,
  X,
  Microphone,
  Camera,
  Envelope,
} from "@phosphor-icons/react";
import { ReactNode, useState, KeyboardEvent } from "react";
import type { Theme } from "../BrowserWindow";
import { ProfileDropdown } from "../ProfileDropdown";

interface ProfileLayoutProps {
  children: ReactNode;
  activeTab: "overview" | "experience" | "projects";
  onNavigate: (page: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ProfileLayout({
  children,
  activeTab,
  onNavigate,
  theme,
  onThemeChange,
}: ProfileLayoutProps) {
  const [query, setQuery] = useState("Ryan Johnson");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      onNavigate(`ryan://search?q=${encodeURIComponent(query.trim())}`);
    }
  };



  // Define theme-aware colors
  const colors = {
    bg: {
      primary: theme === "dark" ? "#202124" : "#ffffff",
      secondary: theme === "dark" ? "#303134" : "#f8f9fa",
      tertiary: theme === "dark" ? "#3c4043" : "#e8eaed",
      hover: theme === "dark" ? "#3c4043" : "#f1f3f4",
    },
    text: {
      primary: theme === "dark" ? "#e8eaed" : "#202124",
      secondary: theme === "dark" ? "#bdc1c6" : "#3c4043",
      tertiary: theme === "dark" ? "#9aa0a6" : "#5f6368",
    },
    border: theme === "dark" ? "#3c4043" : "#dadce0",
    accent: "#8ab4f8",
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, color: colors.text.secondary }} className="min-h-full font-sans">
      {/* 1. TOP BAR: Logo + Search Input + Profile Actions */}
      <div style={{ backgroundColor: colors.bg.primary }} className="flex items-center gap-8 px-8 py-5 sticky top-0 z-20">
        {/* Logo (Simulated Google 'G' or your Initials) */}
        <div
          className="text-2xl font-bold cursor-pointer select-none shrink-0"
          onClick={() => onNavigate("ryan://home")}
        >
          <span className="text-[#4285f4]">R</span>
          <span className="text-[#ea4335]">y</span>
          <span className="text-[#fbbc05]">a</span>
          <span className="text-[#4285f4]">n</span>
        </div>

        {/* Search Input Box */}
        <div className="flex-1 max-w-[750px]">
          <div style={{ backgroundColor: colors.bg.secondary }} className="flex items-center rounded-full px-5 py-3 hover:shadow-md transition-all group border border-transparent hover:border-transparent" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bg.secondary}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ color: colors.text.primary }}
              className="flex-1 bg-transparent text-[16px] outline-none placeholder-opacity-60"
              placeholder="Ask anything..."
            />

            <div style={{ color: colors.text.tertiary }} className="flex items-center gap-4 pl-3">
              {query && (
                <>
                  <X
                    size={24}
                    className="cursor-pointer hover:text-[#e8eaed]"
                    onClick={() => setQuery("")}
                  />
                  <div className="w-[1px] h-7 bg-[#5f6368]" />
                </>
              )}
              <Microphone
                size={24}
                className="cursor-pointer hover:text-[#4285f4]"
              />
              <Camera
                size={24}
                className="cursor-pointer hover:text-[#4285f4]"
              />
              <MagnifyingGlass
                size={24}
                className="text-[#8ab4f8] cursor-pointer"
                onClick={() =>
                  query.trim() &&
                  onNavigate(
                    `ryan://search?q=${encodeURIComponent(query.trim())}`
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Right Side Icons */}
        <div style={{ color: colors.text.primary }} className="ml-auto flex items-center gap-4 relative">
          {/* Profile Dropdown */}
          <ProfileDropdown
            theme={theme}
            onThemeChange={onThemeChange}
            showViewProfile={false}
            colors={{
              bg: {
                primary: colors.bg.primary,
                secondary: colors.bg.secondary,
                hover: colors.bg.hover,
              },
              text: {
                primary: colors.text.primary,
                secondary: colors.text.secondary,
                tertiary: colors.text.tertiary,
              },
              border: colors.border,
            }}
          />
        </div>
      </div>

      {/* 2. NAVIGATION BAR: Just "All" */}
      <div style={{ borderColor: colors.border, backgroundColor: colors.bg.primary, color: colors.text.tertiary }} className="border-b px-8 text-sm">
        <div className="max-w-[800px] ml-[110px] flex items-center gap-6">
          <button 
            style={{ 
              color: theme === "dark" ? "#8ab4f8" : "#1a73e8",
              borderColor: theme === "dark" ? "#8ab4f8" : "#1a73e8"
            }}
            className="flex items-center gap-1.5 pb-3 border-b-[3px] whitespace-nowrap"
          >
            <MagnifyingGlass size={16} />
            <span>All</span>
          </button>
        </div>
      </div>

      {/* 3. Main Title & Pill Filters Section */}
      <div style={{ borderColor: colors.border, backgroundColor: colors.bg.primary }} className="border-b px-8 py-4">
        <div className="max-w-[800px] ml-0 md:ml-[110px]">
          <div className="flex items-end justify-between mb-1">
            <div>
              <h1 style={{ color: colors.text.primary }} className="text-3xl">Ryan Johnson</h1>
              <div style={{ color: colors.text.tertiary }} className="text-sm flex items-center gap-1">
                <span>Software Engineer | CS @ SJSU</span>
                <span style={{ color: colors.text.tertiary }} className="cursor-pointer" onMouseEnter={(e) => (e.currentTarget.style.color = colors.text.primary)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.text.tertiary)}>
                  <DotsThreeVertical size={14} weight="bold" />
                </span>
              </div>
            </div>
          </div>

          {/* Pill Buttons */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mt-4">
            <button
              onClick={() => onNavigate("ryan://about")}
              className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === "overview"
                        ? ""
                        : ""
                    }`}
              style={{
                backgroundColor: activeTab === "overview" ? colors.bg.secondary : 'transparent',
                color: colors.text.primary,
                borderColor: colors.border
              }}
              onMouseEnter={(e) => activeTab !== "overview" && (e.currentTarget.style.backgroundColor = colors.bg.secondary)}
              onMouseLeave={(e) => activeTab !== "overview" && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate("ryan://experience")}
              className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === "experience"
                        ? ""
                        : ""
                    }`}
              style={{
                backgroundColor: activeTab === "experience" ? colors.bg.secondary : 'transparent',
                color: colors.text.primary,
                borderColor: colors.border
              }}
              onMouseEnter={(e) => activeTab !== "experience" && (e.currentTarget.style.backgroundColor = colors.bg.secondary)}
              onMouseLeave={(e) => activeTab !== "experience" && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Experience
            </button>
            <button
              onClick={() => onNavigate("ryan://projects")}
              className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === "projects"
                        ? ""
                        : ""
                    }`}
              style={{
                backgroundColor: activeTab === "projects" ? colors.bg.secondary : 'transparent',
                color: colors.text.primary,
                borderColor: colors.border
              }}
              onMouseEnter={(e) => activeTab !== "projects" && (e.currentTarget.style.backgroundColor = colors.bg.secondary)}
              onMouseLeave={(e) => activeTab !== "projects" && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Projects
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 ml-0 md:ml-[86px]">
        {/* Left Column: Dynamic Content */}
        <div className="md:col-span-2 space-y-6">{children}</div>

        {/* Right Column: Persistent Knowledge Panel */}
        <div className="md:col-span-1">
          <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="rounded-2xl overflow-hidden border sticky top-6">
            <div style={{ borderColor: colors.border }} className="p-4 border-b">
              <h2 style={{ color: colors.text.primary }} className="text-xl font-medium">Overview</h2>
            </div>

            <div className="p-4 space-y-4 text-sm">
              <p style={{ color: colors.text.secondary }}>
                Ryan Johnson is a software engineer with experience building full-stack applications and AI-powered systems. He is currently a third-year Computer Science student at San José State University.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <MapPin size={20} style={{ color: colors.text.tertiary }} className="shrink-0" />
                  <div>
                    <div style={{ color: colors.text.primary }} className="font-bold">Location</div>
                    <div style={{ color: theme === "dark" ? "#8ab4f8" : "#1a73e8" }} className="hover:underline cursor-pointer">
                      San Francisco Bay Area, California
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <GraduationCap
                    size={20}
                    style={{ color: colors.text.tertiary }}
                    className="shrink-0"
                  />
                  <div>
                    <div style={{ color: colors.text.primary }} className="font-bold">Education</div>
                    <div style={{ color: theme === "dark" ? "#8ab4f8" : "#1a73e8" }} className="hover:underline cursor-pointer">
                      Computer Science, B.S. @ San Jose State University
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Code size={20} style={{ color: colors.text.tertiary }} className="shrink-0" />
                  <div>
                    <div style={{ color: colors.text.primary }} className="font-bold">Focus</div>
                    <div style={{ color: colors.text.secondary }}>
                      Full Stack Architecture, Backend Systems, AI Systems
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Profiles */}
              <div style={{ borderColor: colors.border }} className="pt-4 mt-2 border-t">
                <div style={{ color: colors.text.primary }} className="font-bold mb-3">Profiles</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <a
                    href="https://github.com/Ryandj11"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center min-w-[60px] gap-1 group"
                  >
                    <div 
                      style={{ backgroundColor: colors.bg.primary, borderColor: colors.border }}
                      className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bg.primary}
                    >
                      <GithubLogo size={20} style={{ color: colors.text.primary }} />
                    </div>
                    <span style={{ color: colors.text.secondary }} className="text-xs">GitHub</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ryanjohnson1105/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center min-w-[60px] gap-1 group"
                  >
                    <div 
                      style={{ backgroundColor: colors.bg.primary, borderColor: colors.border }}
                      className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bg.primary}
                    >
                      <LinkedinLogo size={20} style={{ color: colors.text.primary }} />
                    </div>
                    <span style={{ color: colors.text.secondary }} className="text-xs">LinkedIn</span>
                  </a>
                  <a
                    href="mailto:ryanjohnson1105@gmail.com"
                    className="flex flex-col items-center min-w-[60px] gap-1 group"
                  >
                    <div 
                      style={{ backgroundColor: colors.bg.primary, borderColor: colors.border }}
                      className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bg.primary}
                    >
                      <Envelope size={20} style={{ color: colors.text.primary }} />
                    </div>
                    <span style={{ color: colors.text.secondary }} className="text-xs">Email</span>
                  </a>
                </div> 
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
