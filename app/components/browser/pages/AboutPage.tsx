"use client";

import Image from "next/image";
import { Globe, CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { ProfileLayout } from "./ProfileLayout";
import type { Theme } from "../BrowserWindow";

// FAQ Item Component
function FAQItem({
  question,
  answer,
  colors,
}: {
  question: string;
  answer: React.ReactNode;
  colors: {
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: string;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderColor: colors.border }} className="border-b py-0">
      <div
        className="flex justify-between items-center py-3 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span 
          style={{ color: colors.text.secondary }} 
          className="font-medium text-sm transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
        >
          {question}
        </span>
        <div
          style={{ color: colors.text.tertiary }}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <CaretDown size={16} />
        </div>
      </div>
      {isOpen && (
        <div style={{ color: colors.text.secondary }} className="pb-4 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

interface AboutPageProps {
  onNavigate: (url: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function AboutPage({ onNavigate, theme, onThemeChange }: AboutPageProps) {
  // Define theme-aware colors
  const colors = {
    bg: {
      primary: theme === "dark" ? "#202124" : "#ffffff",
      secondary: theme === "dark" ? "#303134" : "#f8f9fa",
      tertiary: theme === "dark" ? "#3c4043" : "#e8eaed",
      quaternary: theme === "dark" ? "#4a4d52" : "#dadce0",
    },
    text: {
      primary: theme === "dark" ? "#e8eaed" : "#202124",
      secondary: theme === "dark" ? "#bdc1c6" : "#3c4043",
      tertiary: theme === "dark" ? "#9aa0a6" : "#5f6368",
      link: theme === "dark" ? "#8ab4f8" : "#1a73e8",
    },
    border: theme === "dark" ? "#3c4043" : "#dadce0",
  };

  return (
    <ProfileLayout activeTab="overview" onNavigate={onNavigate} theme={theme} onThemeChange={onThemeChange}>
      {/* Image Grid (Bento Style) */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] rounded-2xl overflow-hidden">
        {/* Large Main Image - UPDATE PATH: /images/profile.jpg */}
        <div style={{ backgroundColor: colors.bg.secondary }} className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden">
          <Image
            src="/pictures/Ryan.jpg"  // ← Update this path
            alt="Profile"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded z-10">
            Profile
          </div>
        </div>
        {/* Top Right Image - UPDATE PATH: /images/workstation.jpg */}
        <div style={{ backgroundColor: colors.bg.tertiary }} className="col-span-2 row-span-1 relative group cursor-pointer overflow-hidden">
          <Image
            src="/pictures/Ryan2.JPG"  // ← Update this path
            alt="Workstation"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded z-10">
            Workstation
          </div>
        </div>
        {/* Bottom Right Image - UPDATE PATH: /images/coding.jpg */}
        <div style={{ backgroundColor: colors.bg.quaternary }} className="col-span-2 row-span-1 relative group cursor-pointer overflow-hidden">
          <Image
            src="/pictures/Speed.JPG"  // ← Update this path
            alt="Coding"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full text-white z-10">
            <Globe size={16} />
          </div>
        </div>
      </div>

      {/* People Also Ask (FAQ) Section */}
      <div className="pt-2">
        <h3 style={{ color: colors.text.primary }} className="text-xl mb-4">People also ask</h3>
        <div className="space-y-0">
           <FAQItem
            question="How can I contact Ryan?"
            colors={colors}
            answer={
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: colors.text.tertiary }}>Email:</span>
                  <a 
                    href="mailto:ryanjohnson1105@gmail.com" 
                    style={{ color: colors.text.link }}
                    className="hover:underline"
                  >
                    ryanjohnson1105@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: colors.text.tertiary }}>LinkedIn:</span>
                  <a 
                    href="https://linkedin.com/in/ryanjohnson1105" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: colors.text.link }}
                    className="hover:underline"
                  >
                    linkedin.com/in/ryanjohnson1105
                  </a>
                </div>
              </div>
            }
          />
          <FAQItem
            question="What technologies does Ryan use?"
            colors={colors}
            answer={
              <div>
                Ryan specializes in the modern React ecosystem. His primary
                stack includes:
                <ul style={{ color: colors.text.tertiary }} className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <strong style={{ color: colors.text.primary }}>Languages:</strong> Python, 
                    Java, TypeScript, JavaScript, C, C++, Swift, SQL, HTML/CSS
                  </li>
                  <li>
                    <strong style={{ color: colors.text.primary }}>Frameworks:</strong> React, 
                    Next.js, SwiftUI, Spring Boot, Node.js, Express.js, FastAPI
                  </li>
                  <li>
                    <strong style={{ color: colors.text.primary }}>Databases:</strong> PostgreSQL, 
                    Firebase, Supabase, MongoDB
                  </li>
                  <li>
                    <strong style={{ color: colors.text.primary }}>AI/ML:</strong> OpenAI API, 
                    Gemini API, OpenCV, MediaPipe
                  </li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="What does Ryan do for fun?"
            colors={colors}
            answer="Ryan enjoys spending time with his friends and family, playing basketball, working out, playing the guitar, building cool projects, and watching movies/shows."
          />
          {/*
          <FAQItem
            question="What is Ryan's education background?"
            colors={colors}
            answer="Ryan holds a Bachelor of Science in Computer Science. He is also a lifelong learner who continuously stays updated with the latest web technologies through documentation, courses, and building side projects."
          />
          */}
        </div>
      </div>
    </ProfileLayout>
  );
}
