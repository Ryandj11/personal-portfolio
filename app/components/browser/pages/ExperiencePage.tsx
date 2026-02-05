"use client";

import { Briefcase } from "@phosphor-icons/react";
import { ProfileLayout } from "./ProfileLayout";
import type { Theme } from "../BrowserWindow";

interface ExperiencePageProps {
  onNavigate: (url: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ExperiencePage({ onNavigate, theme, onThemeChange }: ExperiencePageProps) {
  // Define theme-aware colors
  const colors = {
    bg: {
      primary: theme === "dark" ? "#202124" : "#ffffff",
      secondary: theme === "dark" ? "#303134" : "#f8f9fa",
      hover: theme === "dark" ? "#303134" : "#e8eaed",
    },
    text: {
      primary: theme === "dark" ? "#e8eaed" : "#202124",
      secondary: theme === "dark" ? "#bdc1c6" : "#3c4043",
      tertiary: theme === "dark" ? "#9aa0a6" : "#5f6368",
      link: theme === "dark" ? "#8ab4f8" : "#1a73e8",
    },
    border: theme === "dark" ? "#3c4043" : "#dadce0",
  };

  const experiences = [
    {
      company: "LinkedIn",
      role: "Software Engineer Intern",
      url: "https://linkedin.com/careers/engineering",
      period: "May 2026 - Aug 2026",
      location: "Mountain View, CA",
      description:
        "Incoming Software Engineering Intern for Summer 2026",
      skills: [],
      logo: "/icons/LinkedIn-icon.webp",
    },
    {
      company: "Automatic AI",
      role: "Software Engineer Intern",
      url: "https://automatic.ai",
      period: "May 2025 - Aug 2025",
      location: "Remote",
      description:
        "Worked on an AI-powered basketball training app, building iOS features and a video and sensor data collection pipeline used to train machine learning models in production",
      skills: ["iOS Development", "Swift", "SwiftUI", "Firebase", "watchOS"],
      logo: "/icons/AutomaticAI.png",
    },
    {
      company: "SJSU Software & Computer Engineering Society",
      role: "Software Engineer Intern",
      url: "https://www.sjsu.edu/sjsu-college-of-engineering",
      period: "May 2024 - Aug 2024",
      location: "San Jose, CA",
      description:
        "Developed and improved the SJSU Software and Engineering Society's club website",
      skills: ["React", "JavaScript", "CI/CD", "Git", "GitHub"],
      logo: "/icons/sce.jpg"
    },
  ];

  return (
    <ProfileLayout activeTab="experience" onNavigate={onNavigate} theme={theme} onThemeChange={onThemeChange}>
      <div style={{ color: colors.text.tertiary }} className="text-sm mb-6">
        About {experiences.length} results (0.42 seconds)
      </div>

      <div className="space-y-10">
        {experiences.map((exp, index) => (
          <div key={index} className="group">
            {/* URL/Breadcrumb Line */}
            <div className="flex items-center gap-3 mb-1 cursor-pointer">
              <div 
                style={{ 
                  backgroundColor: colors.bg.secondary, 
                  borderColor: colors.border 
                }} 
                className="flex items-center justify-center w-7 h-7 rounded-full border overflow-hidden"
              >
                {exp.logo ? (
                  <img 
                    src={exp.logo} 
                    alt={`${exp.company} logo`}
                    className="w-full h-full object-contain scale-160"
                  />
                ) : (
                  <Briefcase size={14} style={{ color: colors.text.tertiary }} />
                )}
              </div>
              <div className="flex flex-col">
                <span 
                  style={{ color: colors.text.secondary }} 
                  className="text-sm transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
                >
                  {exp.company}
                </span>
                <span style={{ color: colors.text.tertiary }} className="text-xs">
                  {exp.url} › history
                </span>
              </div>
            </div>

            {/* Title Link */}
            <h3 
              style={{ color: colors.text.link }} 
              className="text-xl hover:underline cursor-pointer font-normal mb-1"
            >
              {exp.role} - {exp.company}
            </h3>

            {/* Meta Info (Date/Location) */}
            <div style={{ color: colors.text.tertiary }} className="text-sm mb-2">
              <span style={{ color: colors.text.secondary }} className="font-medium">{exp.period}</span> •{" "}
              {exp.location}
            </div>

            {/* Description Snippet */}
            <p style={{ color: colors.text.secondary }} className="text-sm leading-6">
              {exp.description}
            </p>

            {/* Skills Tags (Rich Snippet style) */}
            <div className="mt-2 flex gap-2">
              {exp.skills.map((skill) => (
                <span
                  key={skill}
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.text.tertiary,
                  }}
                  className="text-xs border rounded-full px-2 py-0.5 cursor-pointer transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProfileLayout>
  );
}
