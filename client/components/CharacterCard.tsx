"use client";

import { motion } from 'framer-motion';

export interface CharacterCardProps {
    character: {
        name: string;
        level: number;
        charClass: string;
        avatarUrl: string;
        stats: {
            str: number;
            dex: number;
            sta: number;
            wis: number;
            cp?: number;
        };
    }
}

export default function CharacterCard({ character }: CharacterCardProps) {
    return (
        <div className="w-full flex flex-col items-center p-6 bg-black/60 border border-gold/30 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.1)] backdrop-blur-sm relative overflow-hidden group">

            {/* Header */}
            <h2 className="font-cinzel text-3xl md:text-4xl text-white font-bold tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {character.name}
            </h2>
            <p className="font-sans text-gold text-sm tracking-[0.3em] uppercase mb-6 drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]">
                Lv {character.level} {character.charClass}
            </p>

            {/* Avatar Holographic Container */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full mb-8 group-hover:scale-105 transition-transform duration-700">
                {/* Glow Ring */}
                <div className="absolute inset-[-10px] rounded-full bg-gradient-to-tr from-gold via-yellow-200 to-gold/20 opacity-30 animate-[spin_4s_linear_infinite] blur-md" />
                <div className="absolute inset-0 rounded-full border-4 border-gold/50 shadow-[inset_0_0_20px_rgba(255,215,0,0.5)] z-10 overflow-hidden bg-black flex items-center justify-center relative">
                    {/* Fallback spinner behind the image (absolute) */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-t-2 border-r-2 border-gold rounded-full" />
                    </div>

                    <img
                        src={character.avatarUrl || "https://image.pollinations.ai/prompt/mysterious%20silhouette%20god?width=512&height=512&nologo=true"}
                        alt={character.name}
                        className="w-full h-full object-cover z-10 relative"
                    />
                </div>
            </div>

            {/* Base Stats 2x2 Grid */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4">
                {[
                    { label: 'STR', val: character.stats.str, color: 'text-red-400' },
                    { label: 'DEX', val: character.stats.dex, color: 'text-green-400' },
                    { label: 'WIS', val: character.stats.wis, color: 'text-blue-400' },
                    { label: 'STA', val: character.stats.sta, color: 'text-purple-400' }
                ].map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg shadow-inner">
                        <span className="font-sans text-xs uppercase tracking-widest text-gray-500">{stat.label}</span>
                        <span className={`font-cinzel text-xl font-bold ${stat.color}`}>{stat.val}</span>
                    </div>
                ))}
            </div>

            {/* Combat Power */}
            <div className="mt-6 w-full max-w-sm flex justify-between items-center bg-gold/10 border border-gold/30 p-4 rounded-lg">
                <span className="font-sans text-sm uppercase tracking-widest text-gold-light">Combat Power</span>
                <span className="font-cinzel text-2xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                    {character.stats.cp}
                </span>
            </div>

        </div>
    );
}
