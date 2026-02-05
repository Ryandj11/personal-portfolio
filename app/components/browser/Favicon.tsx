"use client";

import {
  House,
  User,
  Briefcase,
  MagnifyingGlass,
  SquaresFour,
  TerminalWindow,
  Globe,
} from "@phosphor-icons/react";

interface FaviconProps {
  id: string;
  isActive?: boolean;
  className?: string;
}

export function Favicon({
  id,
  isActive = false,
  className = "w-4 h-4",
}: FaviconProps) {
  // Use "fill" weight for active tabs to give them more presence, "regular" for inactive
  const weight = isActive ? "fill" : "regular";

  // Common wrapper for consistent size/shape
  const Wrapper = ({
    children,
    color,
  }: {
    children: React.ReactNode;
    color: string;
  }) => (
    <div
      className={`${className} flex items-center justify-center rounded-sm ${color} p-[2px]`}
    >
      {children}
    </div>
  );

  switch (id) {
    case "home":
      return (
        <Wrapper color="bg-blue-500">
          <House weight={weight} className="text-white w-full h-full" />
        </Wrapper>
      );
    case "about":
      return (
        <Wrapper color="bg-red-500">
          <User weight={weight} className="text-white w-full h-full" />
        </Wrapper>
      );
    case "experience":
      return (
        <Wrapper color="bg-orange-500">
          <Briefcase weight={weight} className="text-white w-full h-full" />
        </Wrapper>
      );
    case "projects":
      return (
        <Wrapper color="bg-purple-600">
          <SquaresFour weight={weight} className="text-white w-full h-full" />
        </Wrapper>
      );
    case "search":
      return (
        <Wrapper color="bg-zinc-500">
          <MagnifyingGlass weight="bold" className="text-white w-full h-full" />
        </Wrapper>
      );
    default:
      if (id.startsWith("tab-")) {
        return (
          <Wrapper color="bg-emerald-600">
            <Globe weight={weight} className="text-white w-full h-full" />
          </Wrapper>
        );
      }
      return (
        <Wrapper color="bg-gray-500">
          <TerminalWindow
            weight={weight}
            className="text-white w-full h-full"
          />
        </Wrapper>
      );
  }
}
