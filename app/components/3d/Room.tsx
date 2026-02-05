"use client";

import { useRef, useEffect, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { BrowserWindow } from "../browser";
import { CurvedMonitor } from "./Monitor";
import { ViewType } from "./CameraController";

interface RoomProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Room({ currentView, onViewChange }: RoomProps) {
  const { scene } = useGLTF("/models/Room.glb");

  return (
    <group>
      <primitive object={scene} />
      <CurvedMonitor position={[0, 0.86, -0.27]} rotation={[0, Math.PI, 0]} />
      
      {/* Main Navigation - Visible only in Room View */}
      {currentView === "room" && (
        <Html
          position={[0, 0, 0]}  
          center
          distanceFactor={3}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex select-none gap-3 p-2 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
            <button
              className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/15 rounded-xl text-white/90 text-sm font-medium cursor-default
                         bg-gradient-to-br from-violet-600/60 to-indigo-800/60 border-violet-500/50 shadow-[0_0_20px_rgba(138,43,226,0.3)]"
              disabled
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              View Room
            </button>
            <button
              className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/15 rounded-xl text-white/90 text-sm font-medium cursor-pointer transition-all duration-300 ease-out
                         hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              onClick={() => onViewChange("monitor")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Use Computer
            </button>
          </div>
        </Html>
      )}


    </group>
  );
}

useGLTF.preload("/models/Room.glb");
