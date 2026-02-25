"use client";

import { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/AppLayout';
import { useGameSounds } from '../../hooks/useGameSounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CrucibleCharacter {
    hpCurrent: number;
    hpMax: number;
    energy: number;
    gold: number;
    faith: number;
}

export default function CruciblePage() {
    const { ready, authenticated, getAccessToken } = usePrivy();
    const router = useRouter();

    const [character, setCharacter] = useState<CrucibleCharacter | null>(null);
    const [narrativeHistory, setNarrativeHistory] = useState<{ role: 'model' | 'user', text: string }[]>([]);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);

    // States
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isDead, setIsDead] = useState(false);

    // Consequence Float (Passed to AppLayout for Resource Bar sync)
    const [changedStats, setChangedStats] = useState<{ hp?: number, energy?: number, gold?: number, faith?: number }>({});

    const { playHover, playClick, playTyping, stopTyping, playDamage, playSuccess } = useGameSounds();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
            return;
        }

        const fetchCharacter = async () => {
            try {
                const token = await getAccessToken();
                const res = await fetch(`${API_BASE_URL}/api/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    let charData = data.user?.character;
                    if (Array.isArray(charData)) charData = charData[0];

                    if (charData) {
                        setCharacter(charData);
                        setNarrativeHistory([
                            { role: 'model', text: "You stand before the Crucible. The weight of the Golden Olympus presses upon you. What is your will?" }
                        ]);
                        setCurrentOptions(["Step into the dark", "Call out to the void", "Draw your weapon and wait"]);
                    } else {
                        router.push('/create');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch character", error);
            } finally {
                setLoading(false);
            }
        };

        if (ready && authenticated) {
            fetchCharacter();
        }
    }, [ready, authenticated, getAccessToken, router]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrativeHistory]);

    // Handle CYOA Action
    const handleAction = async (actionText: string) => {
        if (submitting || isDead) return;

        setNarrativeHistory(prev => [...prev, { role: 'user', text: actionText }]);
        setSubmitting(true);
        setCurrentOptions([]);
        setChangedStats({});
        playClick();
        playTyping();

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/encounter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ playerAction: actionText })
            });

            const data = await res.json();

            if (!res.ok) {
                setNarrativeHistory(prev => [...prev, { role: 'model', text: data.error || "The connection to Olympus fractured." }]);
                setSubmitting(false);
                return;
            }

            // Successfully received fate
            setNarrativeHistory(prev => [...prev, { role: 'model', text: data.narrative }]);
            setCurrentOptions(data.options || ["Wait in silence", "Venture deeper", "Attempt to retreat"]);
            setCharacter(data.character);
            setIsDead(data.isDead);

            setChangedStats({
                hp: data.statChanges?.hpDelta || 0,
                energy: data.statChanges?.energyDelta || 0,
                gold: data.statChanges?.goldDelta || 0,
                faith: data.statChanges?.faithDelta || 0
            });

            // Clear stat highlight after 3 seconds
            setTimeout(() => setChangedStats({}), 3000);

            // Trigger corresponding sound effects
            if (data.isDead || (data.statChanges?.hpDelta && data.statChanges.hpDelta < 0)) {
                playDamage();
            } else if (data.statChanges?.goldDelta && data.statChanges.goldDelta > 0) {
                playSuccess();
            } else {
                // Generic successful API return
                playClick();
            }

        } catch (error) {
            console.error("Encounter Error", error);
            setNarrativeHistory(prev => [...prev, { role: 'model', text: "A temporal rift swallowed your action. Try again." }]);
            playDamage();
        } finally {
            stopTyping();
            setSubmitting(false);
        }
    };

    const handleResurrect = () => {
        setIsDead(false);
        setNarrativeHistory([{ role: 'model', text: "You have clawed your way out of the Underworld. You are battered, impoverished, but alive. Tread carefully." }]);
        setCurrentOptions(["Rise and dust yourself off", "Curse the gods", "Limps towards the nearest ruin"]);
    };

    if (!ready || loading) {
        return (
            <div className="w-full h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-t-2 border-r-2 border-gold rounded-full mb-4" />
                <p className="font-cinzel text-gold text-sm tracking-widest uppercase animate-pulse">Entering The Crucible...</p>
            </div>
        );
    }

    // Custom Typewriter Animation Component for AI Text
    const TypewriterText = ({ text }: { text: string }) => {
        return (
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-base md:text-lg text-gold-light leading-relaxed drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]"
            >
                {text}
            </motion.p>
        );
    };

    return (
        <AppLayout character={character || undefined} changedStats={changedStats}>
            <div className="w-full h-[80vh] flex flex-col justify-center items-center py-4">

                {/* Immersive Terminal Wrapper */}
                <div className="w-full max-w-3xl flex-1 flex flex-col bg-black/70 border border-gold/40 rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.05)] overflow-hidden backdrop-blur-md relative">

                    {/* Header Deco */}
                    <div className="w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent h-1" />
                    <div className="px-6 mx-auto pt-4 pb-2 w-full text-center border-b border-gold/10">
                        <span className="font-cinzel text-xs text-gold uppercase tracking-[0.4em] opacity-80">
                            Zeus-Proto Terminal
                        </span>
                    </div>

                    {/* Story Box (Narrative Area) */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin scrollbar-thumb-gold/20">
                        {narrativeHistory.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'model' ? (
                                    <div className="pl-4 border-l-2 border-gold/50 max-w-[90%] md:max-w-[85%]">
                                        <TypewriterText text={msg.text} />
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-t-xl rounded-bl-xl max-w-[80%] text-gray-300 font-sans italic">
                                        "{msg.text}"
                                    </div>
                                )}
                            </div>
                        ))}                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Action Options (CYOA) */}
                    <div className="w-full p-4 md:p-6 bg-black/90 border-t border-gold/20 flex flex-col justify-center min-h-[140px] shadow-[0_-10px_30px_rgba(0,0,0,0.6)] z-10">
                        {submitting ? (
                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-t-2 border-l-2 border-gold rounded-full" />
                                <span className="text-gold font-mono text-sm tracking-[0.3em] font-bold animate-pulse">WEAVING FATE...</span>
                            </div>
                        ) : currentOptions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                {currentOptions.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(opt)}
                                        onMouseEnter={playHover}
                                        disabled={isDead}
                                        className="bg-[#0f0f0f] border border-gold/30 hover:border-gold hover:bg-gold/10 text-gray-300 hover:text-white p-4 rounded-lg text-sm md:text-base text-left font-sans transition-all group relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,1)]"
                                    >
                                        <div className="flex items-start">
                                            <span className="text-gold mr-3 opacity-50 group-hover:opacity-100 font-mono mt-0.5">[{i + 1}]</span>
                                            <span className="leading-snug">{opt}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 font-mono text-sm italic tracking-widest">
                                The timeline has fragmented...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Death Overlay */}
            <AnimatePresence>
                {isDead && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-lg"
                    >
                        <h1 className="font-cinzel text-7xl md:text-9xl font-black text-red-600 tracking-widest drop-shadow-[0_0_40px_rgba(255,0,0,0.8)] mb-4">MORTAL</h1>
                        <h2 className="font-sans text-red-400 text-2xl tracking-[0.5em] uppercase mb-12">Fragment Destroyed</h2>
                        <p className="max-w-xl text-center text-gray-400 font-sans mb-12">
                            Your physical vessel has sustained catastrophic damage. Zeus has reclaimed half your worldly possessions as a sacrifice to the void.
                        </p>
                        <button
                            onClick={handleResurrect}
                            className="px-12 py-4 border border-red-500 bg-red-900/40 text-red-100 font-cinzel text-xl rounded uppercase font-bold tracking-widest hover:bg-red-800 hover:text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                        >
                            Crawl from the Underworld
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
