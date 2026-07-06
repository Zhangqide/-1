import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2, Cpu, Volume2, VolumeX, ShieldAlert, BadgeCheck, Flame } from 'lucide-react';
import { sound } from './SoundUtility';

interface PDADeviceProps {
  children: React.ReactNode;
  onPhysicalScanTrigger?: () => void;
  scannerLaserActive?: boolean; // Show red beam
}

export default function PDADevice({ children, onPhysicalScanTrigger, scannerLaserActive }: PDADeviceProps) {
  const [deviceFrame, setDeviceFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-0 lg:p-4 font-sans text-slate-850 overflow-x-hidden select-none transition-all duration-300">
      
      {/* Top utility bar when in desktop view */}
      <div className="hidden lg:flex w-full max-w-4xl justify-between items-center mb-4 px-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span className="font-bold tracking-tight">PDA Task Receipt System - WH-04 Terminal (v2.8.5)</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
              soundEnabled 
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/50' 
                : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'
            }`}
            title="切换扫码提示音"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="font-semibold">扫码提示音: {soundEnabled ? '已开启' : '已静音'}</span>
          </button>
          <button
            onClick={() => setDeviceFrame(!deviceFrame)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-all font-semibold shadow-sm"
          >
            {deviceFrame ? <Minimize2 className="w-3.5 h-3.5 text-blue-500" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-500" />}
            <span>{deviceFrame ? '隐藏PDA边框' : '显示PDA边框'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div 
        className={`relative transition-all duration-300 ${
          deviceFrame 
            ? 'w-full max-w-[410px] h-[840px] bg-slate-800 rounded-[48px] border-8 border-slate-700 shadow-2xl ring-2 ring-slate-600/10 flex flex-col overflow-hidden px-4 pt-10 pb-4' 
            : 'w-full min-h-screen lg:max-w-[480px] lg:h-[840px] lg:rounded-3xl bg-slate-100 flex flex-col shadow-xl border border-slate-200'
        }`}
      >
        {/* PHYSICAL DEVICE LASER SCANNER HEAD MOCKUP */}
        {deviceFrame && (
          <>
            {/* Top camera/laser physical visor */}
            <div className="absolute top-0 inset-x-0 h-9 bg-slate-700/90 rounded-t-[36px] flex justify-center items-center gap-8 px-8 border-b border-slate-600/30 z-10">
              <div className="w-16 h-2 rounded-full bg-slate-600" /> {/* Speaker bar */}
              <div className="w-3 h-3 rounded-full bg-red-950 border-2 border-red-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> {/* Red laser indicator */}
              </div>
              <div className="w-4 h-4 rounded-full bg-blue-950 border border-blue-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> {/* Lens */}
              </div>
            </div>

            {/* Left Hardware Trigger Button (Tactile simulation) */}
            <button
              onClick={onPhysicalScanTrigger}
              className="absolute left-[-11px] top-1/3 w-[11px] h-20 bg-blue-600 active:bg-blue-700 border-y border-blue-500 rounded-l-md cursor-pointer hover:brightness-110 flex flex-col items-center justify-center text-[8px] text-blue-950 font-bold leading-none select-none active:translate-x-[2px] transition-all z-20 shadow-lg"
              title="物理扫码按键"
            >
              <span className="writing-mode-vertical">S</span>
              <span className="writing-mode-vertical">C</span>
              <span className="writing-mode-vertical text-[6px] text-blue-100">●</span>
            </button>

            {/* Right Hardware Trigger Button */}
            <button
              onClick={onPhysicalScanTrigger}
              className="absolute right-[-11px] top-1/3 w-[11px] h-20 bg-blue-600 active:bg-blue-700 border-y border-blue-500 rounded-r-md cursor-pointer hover:brightness-110 flex flex-col items-center justify-center text-[8px] text-blue-950 font-bold leading-none select-none active:translate-x-[-2px] transition-all z-20 shadow-lg"
              title="物理扫码按键"
            >
              <span className="writing-mode-vertical">S</span>
              <span className="writing-mode-vertical">C</span>
              <span className="writing-mode-vertical text-[6px] text-blue-100">●</span>
            </button>
          </>
        )}

        {/* DEVICE SCREEN VIEWPORT CONTAINER */}
        <div className="relative flex-1 flex flex-col bg-slate-50 text-slate-800 overflow-hidden rounded-2xl border border-slate-300">
          
          {/* SIMULATED SYSTEM STATUS BAR */}
          <div className="h-8 bg-slate-800 px-3 flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-700 shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-green-400 tracking-wider">WH_01_RUN</span>
            </div>
            
            <div className="text-white font-bold font-mono tracking-widest text-[11px]">
              {currentTime || '08:30:00'}
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] text-blue-400 font-semibold">5G Online</span>
              <Wifi className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex items-center gap-0.5" title="98% (正在充能)">
                <span className="text-[9px] font-semibold text-slate-300">98%</span>
                <Battery className="w-4 h-4 text-green-400 fill-green-500/20" />
              </div>
            </div>
          </div>

          {/* SIMULATED RED LASER LIGHT BEAM EFFECT */}
          {scannerLaserActive && (
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-red-500 shadow-[0_0_15px_#ef4444] z-50 animate-bounce pointer-events-none opacity-90">
              <div className="absolute inset-0 bg-red-400 blur-sm"></div>
            </div>
          )}

          {/* APP ACTIVE SCREEN SPACE */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {children}
          </div>

          {/* VIRTUAL INDUSTRIAL HOME BUTTONS IN DEVICE BAR */}
          {deviceFrame && (
            <div className="h-4 bg-slate-800 border-t border-slate-750 flex justify-center items-center gap-12 shrink-0">
              <div className="w-16 h-1 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors cursor-pointer" />
            </div>
          )}

        </div>

        {/* PHYSICAL BASE SPEAKER GRILLE */}
        {deviceFrame && (
          <div className="mt-3 flex justify-between items-center px-4 shrink-0 text-slate-400">
            <span className="text-[10px] tracking-widest font-mono text-slate-400 font-bold uppercase">Sleek Handheld Terminal</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1 bg-slate-700 rounded-full"></span>
              <span className="w-1.5 h-1 bg-slate-700 rounded-full"></span>
              <span className="w-1.5 h-1 bg-slate-700 rounded-full"></span>
              <span className="w-1.5 h-1 bg-slate-700 rounded-full"></span>
              <span className="w-1.5 h-1 bg-slate-700 rounded-full"></span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
