"use client";

import { useState, ReactNode, useEffect } from "react";
import { WindowControls } from "./WindowControls";
import { TabBar, Tab } from "./TabBar";
import { AddressBar } from "./AddressBar";
import { HomePage } from "./pages/HomePage";
import { SearchResults } from "./pages/SearchResults";
import { AboutPage } from "./pages/AboutPage";
import { ExperiencePage } from "./pages/ExperiencePage";
import { ProjectsPage } from "./pages/ProjectsPage";

interface BrowserWindowProps {
  children?: ReactNode;
}

// Extended Tab type with per-tab history
interface TabWithHistory extends Tab {
  history: string[];
  historyIndex: number;
}

const createInitialTab = (id: string, title: string, url: string, isActive: boolean, pinned: boolean = false): TabWithHistory => ({
  id,
  title,
  url,
  isActive,
  pinned,
  history: [url],
  historyIndex: 0,
});

const initialTabs: TabWithHistory[] = [
  createInitialTab("home", "New Tab", "ryan://home", true, false),
  createInitialTab("about", "About Me", "ryan://about", false, true),
  createInitialTab("experience", "Experience", "ryan://experience", false, true),
  createInitialTab("projects", "Projects", "ryan://projects", false, true),
];

export type Theme = "dark" | "light";

export function BrowserWindow({ children }: BrowserWindowProps) {
  const [tabs, setTabs] = useState<TabWithHistory[]>(initialTabs);
  const [theme, setTheme] = useState<Theme>("dark");
  const [visitedUrls, setVisitedUrls] = useState<Set<string>>(new Set(["ryan://home"]));

  // Get active tab
  const activeTab = tabs.find(tab => tab.isActive);
  const currentUrl = activeTab?.history[activeTab.historyIndex] || "ryan://home";

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleTabClick = (id: string) => {
    setTabs(tabs.map((tab) => ({
      ...tab,
      isActive: tab.id === id,
    })));
  };

  const handleTabClose = (id: string) => {
    const tabToClose = tabs.find((tab) => tab.id === id);
    
    // Don't close pinned tabs or if it's the last tab
    if (tabToClose?.pinned || tabs.length <= 1) return;

    const newTabs = tabs.filter((tab) => tab.id !== id);
    if (tabToClose?.isActive && newTabs.length > 0) {
      newTabs[newTabs.length - 1].isActive = true;
    }

    setTabs(newTabs);
  };

  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab = createInitialTab(newId, "New Tab", "ryan://home", true);
    
    setTabs([
      ...tabs.map((t) => ({ ...t, isActive: false })),
      newTab,
    ]);
  };

  const navigateTo = (url: string) => {
    if (!activeTab) return;
    if (activeTab.history[activeTab.historyIndex] === url) return;

    setTabs(prev => prev.map(tab => {
      if (!tab.isActive) return tab;
      
      // Truncate forward history and add new URL
      const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), url];
      
      return {
        ...tab,
        url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        title: getTitleForUrl(url),
      };
    }));

    // Track visited URLs
    setVisitedUrls(prev => new Set(prev).add(url));
  };

  // Helper to get title from URL
  const getTitleForUrl = (url: string): string => {
    if (url.includes("home")) return "New Tab";
    if (url.includes("about")) return "About Me";
    if (url.includes("experience")) return "Experience";
    if (url.includes("projects")) return "Projects";
    if (url.includes("search")) {
      const params = new URLSearchParams(url.split("?")[1]);
      const query = params.get("q");
      return query ? `${query} - Search` : "Search";
    }
    return "New Tab";
  };

  const goBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    
    setTabs(prev => prev.map(tab => {
      if (!tab.isActive) return tab;
      const newIndex = tab.historyIndex - 1;
      const newUrl = tab.history[newIndex];
      return {
        ...tab,
        historyIndex: newIndex,
        url: newUrl,
        title: getTitleForUrl(newUrl),
      };
    }));
  };

  const goForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    
    setTabs(prev => prev.map(tab => {
      if (!tab.isActive) return tab;
      const newIndex = tab.historyIndex + 1;
      const newUrl = tab.history[newIndex];
      return {
        ...tab,
        historyIndex: newIndex,
        url: newUrl,
        title: getTitleForUrl(newUrl),
      };
    }));
  };

  const handleRefresh = () => {
    console.log("Refreshing:", currentUrl);
  };

  const handleSearch = (query: string) => {
    navigateTo(`ryan://search?q=${encodeURIComponent(query)}`);
  };

  const handleUrlChange = (url: string) => {
    navigateTo(url);
  };

  // Router Logic
  const renderContent = () => {
    if (currentUrl === "ryan://home" || currentUrl === "ryan://") {
      return <HomePage onSearch={handleSearch} onNavigate={navigateTo} theme={theme} />;
    }

    if (currentUrl.includes("ryan://search")) {
      const params = new URLSearchParams(currentUrl.split("?")[1]);
      const q = params.get("q") || "";
      return (
        <SearchResults 
          query={q} 
          onNavigate={navigateTo} 
          theme={theme} 
          onThemeChange={handleThemeChange}
        />
      );
    }

    if (currentUrl.includes("ryan://about")) {
      return <AboutPage onNavigate={navigateTo} theme={theme} onThemeChange={handleThemeChange} />;
    }

    if (currentUrl.includes("ryan://experience")) {
      return <ExperiencePage onNavigate={navigateTo} theme={theme} onThemeChange={handleThemeChange} />;
    }

    if (currentUrl.includes("ryan://projects")) {
      return <ProjectsPage onNavigate={navigateTo} theme={theme} onThemeChange={handleThemeChange} />;
    }

    // Default to home page for unknown URLs (e.g., new tabs)
    return <HomePage onSearch={handleSearch} theme={theme} />;
  };

  // Render a page with visibility based on whether it's the current URL
  const renderPageWithVisibility = (url: string, pageKey: string) => {
    const isVisible = currentUrl === url || 
      (pageKey === 'search' && currentUrl.includes('ryan://search')) ||
      (pageKey === 'home' && (currentUrl === 'ryan://home' || currentUrl === 'ryan://'));
    
    return (
      <div key={pageKey} style={{ display: isVisible ? 'block' : 'none' }} className="h-full">
        {renderContent()}
      </div>
    );
  };

  return (
    <div 
      style={{ backgroundColor: theme === 'dark' ? '#202124' : '#ffffff' }}
      className="flex flex-col h-full w-full text-white overflow-hidden font-sans"
    >
      {/* Tab Bar Container */}
      <div 
        style={{ backgroundColor: theme === 'dark' ? '#202124' : '#dee1e6' }}
        className="flex items-center pr-2 pt-2"
      >
        <div className="px-4 pb-2">
          <WindowControls />
        </div>
        <div className="flex-1 overflow-hidden">
          <TabBar
            tabs={tabs}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
            theme={theme}
          />
        </div>
      </div>

      {/* Address Bar */}
      <AddressBar
        url={currentUrl}
        canGoBack={activeTab ? activeTab.historyIndex > 0 : false}
        canGoForward={activeTab ? activeTab.historyIndex < activeTab.history.length - 1 : false}
        onBack={goBack}
        onForward={goForward}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onUrlChange={handleUrlChange}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Content Area */}
      <div className={`flex-1 relative overflow-y-auto ${theme === 'dark' ? 'bg-[#323639]' : 'bg-[#f1f3f4]'}`}>
        {/* Render current content */}
        {renderContent()}
      </div>
    </div>
  );
}
