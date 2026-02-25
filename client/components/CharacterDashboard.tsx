"use client";

import { motion } from 'framer-motion';
import ViralShareButton from './ViralShareButton';
import React, { useState } from 'react';

export interface CharacterProps {
    name: string;
    level: number;
    charClass: string;
    avatarUrl: string;
    stats: {
        str: number;
        dex: number;
        sta: number;
        wis: number;
        cp: number;
    };
}

export default function CharacterDashboard({ character }: { character: CharacterProps }) {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="flex flex-col items-center z-10 relative space-y-6 mt-12">
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-[350px] relative bg-black/80 backdrop-blur-md border border-gold/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.1)]"
            >
                <div className="h-[350px] w-full relative bg-gray-900 border-b border-gold/20 flex flex-col items-center justify-center">
                    {!imageLoaded && (
                        <div className="absolute flex flex-col items-center justify-center space-y-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-t-2 border-r-2 border-gold rounded-full"
                            />
                            <p className="font-mono text-gold text-xs tracking-widest uppercase animate-pulse">
                                Conjuring Visuals...
                            </p>
                        </div>
                    )}
                    <img
                        src={character.avatarUrl || "https://image.pollinations.ai/prompt/mythological%20mysterious%20figure%20silhouette%20in%20golden%20fog?width=1024&height=1024&nologo=true"}
                        alt="Avatar"
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
                    <div className="absolute bottom-4 left-4 font-cinzel text-gold text-2xl font-bold tracking-wider">
                        {character.name}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-gold text-black px-2 py-1 rounded font-bold text-sm">
                        Lv. {character.level}
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-400 font-sans uppercase tracking-widest">
                        <span>{character.charClass}</span>
                        <span className="text-gold font-bold">CP: {character.stats.cp.toLocaleString()}</span>
                    </div>

                    <div className="space-y-3 font-sans text-sm">
                        {[
                            { label: 'STR', val: character.stats.str, max: 200 },
                            { label: 'DEX', val: character.stats.dex, max: 200 },
                            { label: 'STA', val: character.stats.sta, max: 200 },
                            { label: 'WIS', val: character.stats.wis, max: 200 },
                        ].map((stat) => (
                            <div key={stat.label} className="w-full relative">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-300">{stat.label}</span>
                                    <span className="text-gold">{stat.val}</span>
                                </div>
                                <div className="h-1 bg-gray-800 rounded overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stat.val / stat.max) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gold"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <ViralShareButton cardRef={cardRef} level={character.level} charClass={character.charClass} />
        </div>
    );
}
