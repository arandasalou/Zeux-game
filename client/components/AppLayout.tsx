"use client";

import React, { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
const GoldenDustBackground = dynamic(() => import('./GoldenDustBackground'), { ssr: false });
import GoldenLoginButton from './GoldenLoginButton';
import { useGameSounds } from '../hooks/useGameSounds';

interface AppLayoutProps {
    children: ReactNode;
    character?: {
        hpCurrent?: number;
        hpMax?: number;
        energy?: number;
        gold?: number;
        faith?: number;
        [key: string]: any;
    };
    changedStats?: { hp?: number, energy?: number, gold?: number, faith?: number };
}

export default function AppLayout({ children, character, changedStats = {} }: AppLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { playHover, playClick } = useGameSounds();

    const navLinks = [
        { name: 'HUB', path: '/dashboard', icon: '🏛️' },
        { name: 'CRUCIBLE', path: '/crucible', icon: '⚖️' },
        { name: 'ARENA', path: '/arena', icon: '⚔️' },
    ];

    return (
        <div className="relative min-h-screen bg-[#0A0A0A] text-gray-200 overflow-x-hidden flex flex-col md:flex-row font-sans selection:bg-gold/30">
            <div className="fixed inset-0 z-0">
                <GoldenDustBackground />
            </div>

            {/* NAVIGATION: Sidebar (Desktop) / Bottom Bar (Mobile) */}
            <nav className="fixed bottom-0 md:top-0 md:left-0 md:h-screen w-full md:w-24 lg:w-48 bg-black/80 md:bg-black/60 border-t md:border-t-0 md:border-r border-gold/20 backdrop-blur-md z-[60] flex md:flex-col justify-around md:justify-start items-center md:pt-8 md:pb-8 shadow-[0_0_30px_rgba(0,0,0,0.8)]">

                {/* Logo Area */}
                <div className="hidden md:flex flex-col items-center mb-12">
                    <h1 className="font-cinzel text-3xl font-bold bg-gradient-to-b from-white to-gold text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">ZeuX</h1>
                </div>

                {navLinks.map((link) => {
                    const isActive = pathname === link.path;
                    return (
                        <button
                            key={link.name}
                            onMouseEnter={playHover}
                            onClick={() => {
                                playClick();
                                router.push(link.path);
                            }}
                            className={`flex flex-col items-center justify-center p-3 md:py-6 md:px-0 w-full md:w-auto relative transition-colors ${isActive ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {isActive && (
                                <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-gold/10 md:border-l-4 border-gold z-[-1]" />
                            )}
                            <span className="text-xl md:text-2xl mb-1">{link.icon}</span>
                            <span className={`font-cinzel text-[10px] md:text-xs uppercase tracking-widest font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {link.name}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative z-10 md:ml-24 lg:ml-48 pb-24 md:pb-0 min-h-screen flex flex-col">

                {/* TOP RESOURCE BAR (Glassmorphism Sticky) */}
                <header className="sticky top-0 w-full bg-black/50 backdrop-blur-md border-b border-white/5 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">

                        {/* Stats Group */}
                        {character ? (
                            <div className="flex space-x-4 md:space-x-8">
                                {/* HP */}
                                <div className="flex flex-col items-center md:items-start relative group">
                                    <span className="text-gray-500 font-sans text-[10px] uppercase tracking-widest">Health</span>
                                    <span className={`font-cinzel text-sm md:text-base font-bold ${character.hpCurrent && character.hpMax && character.hpCurrent <= character.hpMax * 0.3 ? 'text-red-500 animate-pulse' : 'text-red-400 drop-shadow-[0_0_5px_rgba(255,0,0,0.3)]'}`}>
                                        {character.hpCurrent}/{character.hpMax}
                                    </span>
                                    <AnimatePresence>
                                        {changedStats.hp && changedStats.hp !== 0 && (
                                            <motion.span initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className={`absolute -top-4 text-xs font-bold ${changedStats.hp > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {changedStats.hp > 0 ? '+' : ''}{changedStats.hp}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Energy */}
                                <div className="flex flex-col items-center md:items-start relative">
                                    <span className="text-gray-500 font-sans text-[10px] uppercase tracking-widest">Energy</span>
                                    <span className="font-cinzel text-sm md:text-base font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(0,100,255,0.3)]">{character.energy}</span>
                                    <AnimatePresence>
                                        {changedStats.energy && changedStats.energy !== 0 && (
                                            <motion.span initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className={`absolute -top-4 text-xs font-bold ${changedStats.energy > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {changedStats.energy > 0 ? '+' : ''}{changedStats.energy}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Gold */}
                                <div className="flex flex-col items-center md:items-start relative">
                                    <span className="text-gray-500 font-sans text-[10px] uppercase tracking-widest">Gold</span>
                                    <span className="font-cinzel text-sm md:text-base font-bold text-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]">{character.gold}</span>
                                    <AnimatePresence>
                                        {changedStats.gold && changedStats.gold !== 0 && (
                                            <motion.span initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className={`absolute -top-4 text-xs font-bold ${changedStats.gold > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {changedStats.gold > 0 ? '+' : ''}{changedStats.gold}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Faith */}
                                <div className="flex flex-col items-center md:items-start relative">
                                    <span className="text-gray-500 font-sans text-[10px] uppercase tracking-widest">Faith</span>
                                    <span className="font-cinzel text-sm md:text-base font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{character.faith}</span>
                                    <AnimatePresence>
                                        {changedStats.faith && changedStats.faith !== 0 && (
                                            <motion.span initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className={`absolute -top-4 text-xs font-bold ${changedStats.faith > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {changedStats.faith > 0 ? '+' : ''}{changedStats.faith}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1" /> // Empty placeholder for spacing
                        )}

                        {/* Logout Button */}
                        <div className="scale-75 md:scale-90 origin-right">
                            <GoldenLoginButton />
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE PAGE CONTENT */}
                <div className="w-full flex-1 max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
