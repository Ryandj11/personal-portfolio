"use client";

import { ProfileLayout } from "./ProfileLayout";
import { GithubLogo, Globe } from "@phosphor-icons/react";
import type { Theme } from "../BrowserWindow";

interface ProjectsPageProps {
  onNavigate: (url: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ProjectsPage({ onNavigate, theme, onThemeChange }: ProjectsPageProps) {
  const colors = {
    bg: {
      card: theme === "dark" ? "#303134" : "#ffffff",
      cardHover: theme === "dark" ? "#3c4043" : "#f1f3f4",
      tag: theme === "dark" ? "#202124" : "#e8eaed",
      overlay: theme === "dark" ? "#202124" : "#000000",
    },
    text: {
      primary: theme === "dark" ? "#e8eaed" : "#202124",
      secondary: theme === "dark" ? "#bdc1c6" : "#3c4043",
      tertiary: theme === "dark" ? "#9aa0a6" : "#5f6368",
      link: theme === "dark" ? "#8ab4f8" : "#1a73e8",
    },
    border: theme === "dark" ? "#3c4043" : "#dadce0",
    borderHover: theme === "dark" ? "#5f6368" : "#bdc1c6",
  };

  const projects = [
    {
      title: "Fusion",
      description: "AI-powered platform for project managers to unify their Jira, Github, Slack, and Notion workflows",
      image: "/images/FusionImg.jpeg",
      icon: "",
      tags: ["Google Gemini MCP", "TypeScript", "Express.js", "API Integrations"],
      demo: "https://devpost.com/software/fusion-8d6ura",
      github: ""
    },
    {
      title: "StudyBuddy",
      description: "Your Canvas AI assistant (Best Overall Winner at SCEHacks 2025)",
      image: "bg-blue-400",
      icon: "📚",
      tags: ["OpenAI API", "Canvas API", "Node.js", "SMS API", "Cron-Job"],
      demo: "https://devpost.com/software/studybuddy-g1hwqe",
      github: ""
    },
    {
      title: "VIVI",
      description: "A visualization tool for neurodivergent users to help them express their imagination",
      image: "/images/VIVI_portfolio.png",
      icon: "",
      tags: ["OpenAI DALL-E 3 & Whisper", "OpenCV", "Mediapipe", "FastAPI", "React"],
      demo: "https://devpost.com/software/vivi-qj6fug",
      github: ""
    },
    /* 
    {
      title: "Task Management App",
      description: "Collaborative task manager with real-time updates. Supports drag-and-drop boards, team workspaces, and deadline tracking.",
      image: "bg-orange-900",
      icon: "✅",
      tags: ["React", "Firebase", "DnD Kit"],
      demo: "#",
      github: "#"
    }
    */
    
    
  ];

  return (
    <ProfileLayout activeTab="projects" onNavigate={onNavigate} theme={theme} onThemeChange={onThemeChange}>
      <div className="text-sm mb-6" style={{ color: colors.text.tertiary }}>
        Showing {projects.length} results for &quot;projects&quot;
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, index) => {
          const link = project.demo !== "#" ? project.demo : project.github !== "#" ? project.github : null;
          
          const card = (
            <div 
              className="group h-full rounded-xl overflow-hidden transition-all cursor-pointer"
              style={{ 
                backgroundColor: colors.bg.card, 
                borderWidth: 1, 
                borderStyle: "solid", 
                borderColor: colors.border 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.cardHover;
                e.currentTarget.style.borderColor = colors.borderHover;
                const title = e.currentTarget.querySelector<HTMLElement>('[data-title]');
                if (title) title.style.color = colors.text.link;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.card;
                e.currentTarget.style.borderColor = colors.border;
                const title = e.currentTarget.querySelector<HTMLElement>('[data-title]');
                if (title) title.style.color = colors.text.primary;
              }}
            >
              {/* Project Image/Preview Area */}
              <div className={`h-40 relative flex items-center justify-center overflow-hidden ${!project.image.startsWith('/') ? project.image : ''}`}>
                 {project.image.startsWith('/') && (
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 )}
                 {project.icon && (
                    <span className="text-6xl filter drop-shadow-lg relative z-10">{project.icon}</span>
                 )}
                 
                 {/* Visual indicator for click */}
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <div 
                      className="backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: `${colors.bg.overlay}cc`, borderWidth: 1, borderStyle: "solid", borderColor: colors.borderHover }}
                    >
                      View Project
                    </div>
                 </div>
              </div>

              {/* Content */}
              <div className="p-4">
                 <div className="text-xs mb-1 uppercase tracking-wider font-semibold" style={{ color: colors.text.tertiary }}>
                    {project.tags[0]}
                 </div>
                 <h3 data-title className="text-lg font-medium mb-2 transition-colors" style={{ color: colors.text.primary }}>
                    {project.title}
                 </h3>
                 <p className="text-sm line-clamp-2 mb-4" style={{ color: colors.text.secondary }}>
                    {project.description}
                 </p>

                 {/* Tags */}
                 <div className="flex flex-wrap gap-2">
                    {project.tags.slice(1).map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-md" style={{ color: colors.text.tertiary, backgroundColor: colors.bg.tag }}>
                            {tag}
                        </span>
                    ))}
                 </div>
              </div>
            </div>
          );

          if (link) {
            return (
              <a 
                key={index} 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block no-underline"
              >
                {card}
              </a>
            );
          }

          return <div key={index}>{card}</div>;
        })}
      </div>
    </ProfileLayout>
  );
}

