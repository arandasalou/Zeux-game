"use client";

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/AppLayout';
import { useGameSounds } from '../../hooks/useGameSounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TargetCharacter {
    id: string;
    name: string;
    level: number;
    avatarUrl: string;
    class: string;
    isBot?: boolean;
}

export default function ArenaPage() {
    const { ready, authenticated, getAccessToken } = usePrivy();
    const router = useRouter();

    // Using the exact tab names requested by user
    const [activeTab, setActiveTab] = useState<'MORTAL KOMBAT' | 'DIVINE BOUNTY'>('MORTAL KOMBAT');

    // Data State
    const [character, setCharacter] = useState<any>(null);
    const [targets, setTargets] = useState<TargetCharacter[]>([]);
    const [loading, setLoading] = useState(true);

    // Combat State
    const [isAttacking, setIsAttacking] = useState(false);
    const [combatResult, setCombatResult] = useState<{ victory: boolean, logText: string, goldStolen: number } | null>(null);

    // Bounty State
    const [xHandle, setXHandle] = useState('');
    const [bountyMessage, setBountyMessage] = useState('');

    // Audio Engine
    const { playHover, playClick, playSuccess, playDamage } = useGameSounds();

    // Consequence Float for AppLayout
    const [changedStats, setChangedStats] = useState<{ gold?: number, energy?: number }>({});

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                const token = await getAccessToken();

                // Fetch our own character
                const meRes = await fetch(`${API_BASE_URL}/api/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (meRes.ok) {
                    const meData = await meRes.json();
                    let charData = meData.user?.character;
                    if (Array.isArray(charData)) charData = charData[0];
                    setCharacter(charData);
                }

                // Fetch targets
                const res = await fetch(`${API_BASE_URL}/api/pvp/targets`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTargets(data.targets);
                }
            } catch (error) {
                console.error("Failed to fetch arena data", error);
            } finally {
                setLoading(false);
            }
        };

        if (ready && authenticated) {
            fetchData();
        }
    }, [ready, authenticated, getAccessToken, router]);

    const handleAttack = async (targetId: string) => {
        setIsAttacking(true);
        setCombatResult(null);
        setChangedStats({});
        playClick();

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/pvp/attack/registered`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ targetCharacterId: targetId })
            });
            const data = await res.json();

            // Simulate combat Clash Delay
            setTimeout(() => {
                setCombatResult(data);
                setIsAttacking(false);
                setTargets(targets.filter(t => t.id !== targetId));

                // Update local gold logic
                if (character) {
                    const newGold = character.gold + (data.victory ? data.goldStolen : -data.goldStolen);
                    setCharacter({ ...character, gold: Math.max(0, newGold) });
                    setChangedStats({ gold: data.victory ? data.goldStolen : -data.goldStolen });
                    setTimeout(() => setChangedStats({}), 3000);
                }

                if (data.victory) {
                    playSuccess();
                } else {
                    playDamage();
                }
            }, 1500);

        } catch (error) {
            console.error("Attack failed", error);
            setIsAttacking(false);
        }
    };

    const handleBounty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!xHandle.trim()) return;

        setBountyMessage('');
        setIsAttacking(true);
        playClick();

        const pureHandle = xHandle.startsWith('@') ? xHandle : `@${xHandle}`;

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/pvp/attack/x-bounty`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ targetXHandle: pureHandle })
            });

            const data = await res.json();

            if (!res.ok) {
                setBountyMessage(data.error || "Failed to issue bounty. Ensure you have 100 Energy.");
                setIsAttacking(false);
                playDamage();
                return;
            }

            setBountyMessage(data.message);
            setIsAttacking(false);
            setXHandle('');
            playSuccess();

            if (character) {
                setCharacter({ ...character, energy: Math.max(0, character.energy - 100) });
                setChangedStats({ energy: -100 });
                setTimeout(() => setChangedStats({}), 3000);
            }

            // CRITICAL VIRAL LOOP: Open Twitter Intent
            const tweetText = `I have declared a Divine Bounty on ${pureHandle} in the Golden Olympus. They are too weak to survive ZeuX. Prove me wrong. ⚔️👑\n\n#ZeuXGame #Web3Gaming\nPlay now: http://localhost:3000`;
            const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(intentUrl, '_blank');

        } catch (error) {
            console.error("Bounty failed", error);
            setBountyMessage("An error occurred.");
            setIsAttacking(false);
        }
    };

    if (!ready || loading) {
        return (
            <div className="w-full h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-t-2 border-r-2 border-red-500 rounded-full mb-4" />
                <p className="font-cinzel text-red-500 text-sm tracking-widest uppercase animate-pulse">Entering The Arena...</p>
            </div>
        );
    }

    return (
        <AppLayout character={character || undefined} changedStats={changedStats}>
            <div className="w-full flex flex-col items-center pt-8 pb-16">

                {/* Header Title */}
                <div className="text-center mb-12">
                    <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-600 to-red-900 drop-shadow-[0_0_25px_rgba(255,0,0,0.6)]">
                        THE ARENA
                    </h1>
                    <p className="font-sans text-gray-500 tracking-[0.4em] uppercase text-sm mt-3">Spill blood for the Golden Verdict</p>
                </div>

                {/* Massive Tab Buttons */}
                <div className="flex flex-col md:flex-row w-full max-w-4xl space-y-4 md:space-y-0 md:space-x-4 mb-12 px-4">
                    <button
                        onClick={() => { playClick(); setActiveTab('MORTAL KOMBAT'); }}
                        onMouseEnter={playHover}
                        className={`flex-1 py-6 border-2 font-cinzel text-xl md:text-2xl uppercase tracking-[0.2em] font-black transition-all ${activeTab === 'MORTAL KOMBAT'
                            ? 'bg-red-900/40 border-red-500 text-white shadow-[0_0_30px_rgba(255,0,0,0.4)] scale-[1.02]'
                            : 'bg-black/50 border-red-900/50 text-red-700/50 hover:border-red-500/50 hover:text-red-500'
                            }`}
                        style={{ clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
                    >
                        Mortal Kombat
                    </button>
                    <button
                        onClick={() => { playClick(); setActiveTab('DIVINE BOUNTY'); }}
                        onMouseEnter={playHover}
                        className={`flex-1 py-6 border-2 font-cinzel text-xl md:text-2xl uppercase tracking-[0.2em] font-black transition-all ${activeTab === 'DIVINE BOUNTY'
                            ? 'bg-gold/10 border-gold text-gold shadow-[0_0_30px_rgba(255,215,0,0.4)] scale-[1.02]'
                            : 'bg-black/50 border-gold/30 text-gold-light/40 hover:border-gold/60 hover:text-gold'
                            }`}
                        style={{ clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
                    >
                        Divine Bounty
                    </button>
                </div>

                {/* Content Area */}
                <div className="w-full max-w-6xl px-4 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'MORTAL KOMBAT' ? (
                            <motion.div
                                key="mk"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                            >
                                {targets.length === 0 ? (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                                        <div className="text-6xl mb-4 opacity-50">💀</div>
                                        <p className="text-gray-500 font-cinzel text-xl uppercase tracking-widest">The Colosseum is empty.</p>
                                    </div>
                                ) : (
                                    targets.map(target => (
                                        <motion.div
                                            key={target.id}
                                            whileHover={{ y: -5 }}
                                            {...(target.isBot ? {
                                                animate: {
                                                    opacity: [1, 0.8, 1, 0.9, 1],
                                                    x: [0, -1, 1, -1, 0]
                                                },
                                                transition: { duration: 2, repeat: Infinity, ease: 'linear' }
                                            } : {})}
                                            className={`bg-black/70 border ${target.isBot ? 'border-blue-900/50 hover:border-blue-500 shadow-[0_0_20px_rgba(0,0,255,0.1)] hover:shadow-[0_0_30px_rgba(0,0,255,0.3)]' : 'border-red-900/50 hover:border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.1)] hover:shadow-[0_0_30px_rgba(255,0,0,0.3)]'} rounded-xl p-6 flex flex-col items-center transition-all overflow-hidden relative group`}
                                        >
                                            {/* Blood decorative splatter */}
                                            <div className={`absolute -top-10 -right-10 w-32 h-32 ${target.isBot ? 'bg-blue-600/10' : 'bg-red-600/10'} blur-3xl rounded-full`} />

                                            <div className={`w-28 h-28 rounded-full overflow-hidden border-2 ${target.isBot ? 'border-blue-900 group-hover:border-blue-500' : 'border-red-900 group-hover:border-red-500'} transition-colors mb-4 relative z-10`}>
                                                <img src={target.avatarUrl} alt={target.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                                            </div>

                                            <h3 className="font-cinzel text-xl md:text-2xl text-white font-bold tracking-widest uppercase mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                                                {target.name}
                                                {target.isBot && <span className="text-xs text-blue-500 ml-2 animate-pulse">[ECHO]</span>}
                                            </h3>
                                            <p className={`font-sans text-xs uppercase tracking-[0.2em] mb-6 ${target.isBot ? 'text-blue-400/80' : 'text-gray-400'}`}>Lv {target.level} {target.class}</p>

                                            <button
                                                onClick={() => handleAttack(target.id)}
                                                onMouseEnter={playHover}
                                                disabled={isAttacking}
                                                className={`w-full py-3 ${target.isBot ? 'bg-blue-900/40 border-blue-500 text-blue-100 hover:bg-blue-600' : 'bg-red-900/40 border-red-500 text-red-100 hover:bg-red-600'} font-cinzel font-black tracking-[0.3em] uppercase rounded hover:text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden`}
                                            >
                                                <span className="relative z-10">RAID</span>
                                                <div className={`absolute left-0 top-0 h-full w-full ${target.isBot ? 'bg-blue-500/20' : 'bg-red-500/20'} translate-y-full group-hover:translate-y-0 transition-transform`} />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="bounty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center pt-8"
                            >
                                <div className="w-full max-w-xl bg-black/60 border border-gold/40 p-10 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.1)] backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold/10 blur-[100px] rounded-full" />

                                    <div className="text-center mb-10 relative z-10">
                                        <h2 className="font-cinzel text-3xl text-gold mb-2 font-black tracking-widest uppercase">Mark an X User</h2>
                                        <p className="text-gray-400 font-sans text-sm tracking-widest uppercase">
                                            Cost: <span className="text-blue-400 font-bold">100 Energy</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleBounty} className="w-full flex flex-col items-center space-y-8 relative z-10">
                                        <div className="w-full relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-gold/50 text-2xl">@</span>
                                            <input
                                                type="text"
                                                value={xHandle.replace('@', '')}
                                                onChange={(e) => setXHandle(e.target.value)}
                                                placeholder="elonmusk"
                                                className="w-full bg-black/80 border-b-2 border-gold/40 p-6 pl-14 text-white font-mono text-2xl focus:border-gold focus:outline-none placeholder:text-gray-700 tracking-widest transition-colors"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            onMouseEnter={playHover}
                                            disabled={isAttacking || !xHandle}
                                            className="w-full py-5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-black font-cinzel font-black text-xl rounded uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_30px_rgba(255,215,0,0.5)] animate-pulse"
                                        >
                                            Issue Bounty
                                        </button>
                                    </form>

                                    {bountyMessage && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-6 text-center text-sm font-sans tracking-widest relative z-10 ${bountyMessage.includes('Failed') || bountyMessage.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                                            {bountyMessage}
                                        </motion.p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Combat Clash Overlay Animation */}
            <AnimatePresence>
                {isAttacking && activeTab === 'MORTAL KOMBAT' && !combatResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], rotate: [0, -15, 15, -15, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-9xl mb-8 filter drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]"
                        >
                            ⚔️
                        </motion.div>
                        <p className="font-cinzel text-red-500 text-4xl font-black tracking-[0.4em] animate-pulse">CLASHING</p>
                    </motion.div>
                )}

                {/* Combat Result Overlay */}
                {combatResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-lg px-4"
                    >
                        <h2 className={`font-cinzel text-7xl md:text-9xl font-black mb-6 uppercase tracking-widest ${combatResult.victory ? 'text-green-500 drop-shadow-[0_0_40px_rgba(0,255,0,0.6)]' : 'text-red-600 drop-shadow-[0_0_40px_rgba(255,0,0,0.8)]'}`}>
                            {combatResult.victory ? 'VICTORY' : 'DEFEAT'}
                        </h2>

                        <p className="text-white text-xl md:text-2xl font-sans text-center max-w-2xl mb-12 italic text-gray-300">
                            "{combatResult.logText}"
                        </p>

                        <div className="bg-gradient-to-b from-black/80 to-transparent border-t border-b border-white/20 px-12 py-8 flex flex-col items-center space-y-2 mb-12">
                            <span className="text-gray-500 font-sans text-sm uppercase tracking-[0.3em]">
                                {combatResult.victory ? 'Loot Secured' : 'Gold Lost'}
                            </span>
                            <span className={`text-6xl font-cinzel font-black ${combatResult.victory ? 'text-gold' : 'text-red-500'}`}>
                                {combatResult.victory ? '+' : '-'}{combatResult.goldStolen}
                            </span>
                        </div>

                        <button
                            onClick={() => setCombatResult(null)}
                            className="px-12 py-4 border border-gray-500 text-white font-cinzel font-bold text-xl hover:bg-white hover:text-black transition-colors uppercase tracking-[0.2em] rounded"
                        >
                            Return to Arena
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
