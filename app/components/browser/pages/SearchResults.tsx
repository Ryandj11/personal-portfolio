"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import {
  Sparkle,
  MagnifyingGlass,
  X,
  Microphone,
  Camera,
} from "@phosphor-icons/react";
import { ProfileDropdown } from "../ProfileDropdown";
import type { Theme } from "../BrowserWindow";

// Lightweight markdown renderer for AI answers
// Supports: **bold**, \n line breaks, \n\n paragraph breaks, and basic bullet points
function renderMarkdown(text: string, textColor: string, secondaryColor: string) {
  // Split on double newlines for paragraph breaks
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    // Split on single newlines within a paragraph
    const lines = paragraph.split(/\n/);

    return (
      <div key={pIdx} className={pIdx > 0 ? "mt-3" : ""}>
        {lines.map((line, lIdx) => {
          // Check for bullet items
          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const content = isBullet ? line.trim().substring(2) : line;

          // Parse **bold** segments
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          
          const renderedParts = parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={partIdx} style={{ color: textColor }} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx} style={{ color: secondaryColor }}>{part}</span>;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex gap-2 mt-2">
                <span style={{ color: secondaryColor }}>•</span>
                <span className="flex-1">{renderedParts}</span>
              </div>
            );
          }

          return (
            <span key={lIdx} className="block mt-1">
              {renderedParts}
            </span>
          );
        })}
      </div>
    );
  });
}

interface SearchResultsProps {
  query: string;
  onNavigate: (url: string) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function SearchResults({ 
  query, 
  onNavigate, 
  theme = "dark",
  onThemeChange = () => {},
}: SearchResultsProps) {
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);

  // Theme-aware colors (matching ProfileLayout)
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
      link: theme === "dark" ? "#8ab4f8" : "#1a73e8",
    },
    border: theme === "dark" ? "#3c4043" : "#dadce0",
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onNavigate(`ryan://search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const normalizedQuery = query.trim().toLowerCase();
        const cacheKey = `ryan_search_${normalizedQuery}`;

        // Check sessionStorage first
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed.success && parsed.answer) {
              console.log('✅ Client Cache Hit for:', normalizedQuery);
              setAnswer(parsed.answer);
              setIsLoading(false);
              return; // Skip fetch
            }
          } catch (e) {
            console.error('Failed to parse cached search results:', e);
          }
        }

        console.log('❌ Client Cache Miss for:', normalizedQuery);

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            const retrySeconds = data.retryAfter || 60;
            throw new Error(`You're searching too fast! Please wait ${retrySeconds} seconds before trying again.`);
          }
          throw new Error(data.message || data.error || 'Failed to fetch search results');
        }
        
        if (data.success && data.answer) {
          // Store in sessionStorage
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {
            console.error('Failed to save search results to cache:', e);
          }

          setAnswer(data.answer);
        } else {
          throw new Error(data.error || 'Unknown error occurred');
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to load search results');
        setAnswer(err.message || 'Sorry, I could not process your search. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (query.trim()) {
      fetchSearchResults();
    }
  }, [query]);

  return (
    <div style={{ backgroundColor: colors.bg.primary, color: colors.text.secondary }} className="min-h-full font-sans">
      {/* Header: Logo + Search Input + Profile */}
      <div style={{ backgroundColor: colors.bg.primary }} className="flex items-center gap-8 px-8 py-5 sticky top-0 z-20">
        {/* Ryan Logo */}
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
          <div 
            style={{ backgroundColor: colors.bg.secondary }} 
            className="flex items-center rounded-full px-5 py-3 hover:shadow-md transition-all group border border-transparent"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bg.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bg.secondary}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ color: colors.text.primary }}
              className="flex-1 bg-transparent text-[16px] outline-none placeholder-opacity-60"
              placeholder="Ask anything..."
            />

            <div style={{ color: colors.text.tertiary }} className="flex items-center gap-4 pl-3">
              {searchQuery && (
                <>
                  <X
                    size={24}
                    className="cursor-pointer hover:text-[#e8eaed]"
                    onClick={() => setSearchQuery("")}
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
                  searchQuery.trim() &&
                  onNavigate(`ryan://search?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              />
            </div>
          </div>
        </div>

        {/* Right Side - Profile Dropdown */}
        <div style={{ color: colors.text.primary }} className="ml-auto flex items-center gap-4">
          <ProfileDropdown
            theme={theme}
            onThemeChange={onThemeChange}
            showViewProfile={true}
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

      {/* Navigation Bar: "All" tab */}
      <div style={{ borderColor: colors.border, backgroundColor: colors.bg.primary, color: colors.text.tertiary }} className="border-b px-8 text-sm">
        <div className="max-w-[800px] ml-[110px] flex items-center gap-6">
          <button 
            style={{ 
              color: colors.text.link,
              borderColor: colors.text.link
            }}
            className="flex items-center gap-1.5 pb-3 border-b-[3px] whitespace-nowrap"
          >
            <MagnifyingGlass size={16} />
            <span>All</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-[800px] ml-0 md:ml-[110px]">
          {/* Results count */}
          <div style={{ color: colors.text.tertiary }} className="text-sm mb-6">
            About 1,240,000 results (0.42 seconds)
          </div>

          {/* AI Overview Section */}
          <div className="mb-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Sparkle 
                  size={20} 
                  weight="fill" 
                  className="text-[#8ab4f8]"
                />
                <Sparkle 
                  size={12} 
                  weight="fill" 
                  className="text-[#f28b82] absolute -top-1 -right-1"
                />
              </div>
              <span style={{ color: colors.text.primary }} className="text-base font-medium">AI Overview</span>
            </div>

            {/* AI Overview Card */}
            <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="border rounded-2xl p-5 relative overflow-hidden">
              {/* Subtle gradient accent on top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8ab4f8] via-[#c58af9] to-[#f28b82]" />
              
              {isLoading ? (
                <div className="space-y-3">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-4 rounded w-full shimmer" />
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-4 rounded w-5/6 shimmer" />
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-4 rounded w-4/6 shimmer" />
                </div>
              ) : (
                <div className="text-sm leading-7">
                  {renderMarkdown(answer, colors.text.primary, colors.text.secondary)}
                </div>
              )}
            </div>
          </div>

          {/* Skeleton Search Results - Static Decorative */}
          <div className="space-y-6">
            {/* Skeleton Result 1 */}
            <div className="group">
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="w-7 h-7 rounded-full border" />
                <div className="flex flex-col gap-1">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-3 rounded w-32" />
                  <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.6 }} className="h-2.5 rounded w-48" />
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg.tertiary }} className="h-5 rounded w-72 mb-2" />
              <div className="space-y-1.5">
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-full" />
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-5/6" />
              </div>
            </div>

            {/* Skeleton Result 2 */}
            <div className="group">
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="w-7 h-7 rounded-full border" />
                <div className="flex flex-col gap-1">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-3 rounded w-40" />
                  <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.6 }} className="h-2.5 rounded w-56" />
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg.tertiary }} className="h-5 rounded w-64 mb-2" />
              <div className="space-y-1.5">
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-full" />
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-4/6" />
              </div>
            </div>

            {/* Skeleton Result 3 */}
            <div className="group">
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="w-7 h-7 rounded-full border" />
                <div className="flex flex-col gap-1">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-3 rounded w-36" />
                  <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.6 }} className="h-2.5 rounded w-44" />
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg.tertiary }} className="h-5 rounded w-80 mb-2" />
              <div className="space-y-1.5">
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-full" />
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-3/4" />
              </div>
            </div>

            {/* Skeleton Result 4 */}
            <div className="group">
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="w-7 h-7 rounded-full border" />
                <div className="flex flex-col gap-1">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-3 rounded w-28" />
                  <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.6 }} className="h-2.5 rounded w-52" />
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg.tertiary }} className="h-5 rounded w-60 mb-2" />
              <div className="space-y-1.5">
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-full" />
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-2/3" />
              </div>
            </div>

            {/* Skeleton Result 5 */}
            <div className="group">
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border }} className="w-7 h-7 rounded-full border" />
                <div className="flex flex-col gap-1">
                  <div style={{ backgroundColor: colors.bg.tertiary }} className="h-3 rounded w-44" />
                  <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.6 }} className="h-2.5 rounded w-60" />
                </div>
              </div>
              <div style={{ backgroundColor: colors.bg.tertiary }} className="h-5 rounded w-56 mb-2" />
              <div className="space-y-1.5">
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-full" />
                <div style={{ backgroundColor: colors.bg.tertiary, opacity: 0.7 }} className="h-3 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
