"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/AppLayout";
import CharacterCard from "../../components/CharacterCard";
import ViralShareButton from "../../components/ViralShareButton";
import { useGameSounds } from "../../hooks/useGameSounds";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DashboardPage() {
    const { ready, authenticated, getAccessToken } = usePrivy();
    const router = useRouter();
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [buildingUpgradeState, setBuildingUpgradeState] = useState<Record<string, boolean>>({});
    const [isExecutingMission, setIsExecutingMission] = useState(false);
    const [floatingReward, setFloatingReward] = useState<{ gold: number, xp: number } | null>(null);

    const { playSuccess, playHover, playClick, playDamage } = useGameSounds();

    useEffect(() => {
        if (ready && !authenticated) {
            router.push("/");
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
                    } else {
                        router.push("/create");
                    }
                }
            } catch (error) {
                console.error("Error fetching character:", error);
            } finally {
                setLoading(false);
            }
        };

        if (ready && authenticated) {
            fetchCharacter();
        }
    }, [ready, authenticated, getAccessToken, router]);

    // Idle Energy Visual Simulation
    useEffect(() => {
        if (!character) return;

        const interval = setInterval(() => {
            setCharacter((prev: any) => {
                if (prev && prev.energy < 100) {
                    return { ...prev, energy: prev.energy + 1 };
                }
                return prev;
            });
        }, 10000); // 1 Energy every 10 seconds locally

        return () => clearInterval(interval);
    }, [character?.energy]);

    const handleUpgradeBuilding = async (buildingId: string) => {
        playClick();
        setBuildingUpgradeState(prev => ({ ...prev, [buildingId]: true }));

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/building/upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ buildingId })
            });

            if (res.ok) {
                const data = await res.json();
                setCharacter((prev: any) => ({
                    ...prev,
                    gold: data.character.gold,
                    buildings: prev.buildings.map((b: any) => b.id === buildingId ? { ...b, level: data.building.level } : b)
                }));
                playSuccess();
            } else {
                const errorData = await res.json();
                console.error("Failed to upgrade building:", errorData.error);
                playDamage(); // Play a 'fail' sound
                alert(errorData.error || "Failed to upgrade building.");
            }
        } catch (error) {
            console.error("Error upgrading building:", error);
            playDamage();
            alert("An unexpected error occurred during upgrade.");
        } finally {
            setBuildingUpgradeState(prev => ({ ...prev, [buildingId]: false }));
        }
    };

    const handleExecuteMission = async () => {
        playClick();
        setIsExecutingMission(true);
        setFloatingReward(null); // Clear previous reward

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/mission/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setCharacter((prev: any) => ({
                    ...prev,
                    ...data.newStats
                }));
                setFloatingReward({ gold: data.reward.gold, xp: data.reward.xp });
                playSuccess();
                setTimeout(() => setFloatingReward(null), 3000); // Hide after 3 seconds
            } else {
                const errorData = await res.json();
                console.error("Failed to execute mission:", errorData.error);
                playDamage();
                alert(errorData.error || "Failed to execute mission.");
            }
        } catch (error) {
            console.error("Error executing mission:", error);
            playDamage();
            alert("An unexpected error occurred during mission execution.");
        } finally {
            setIsExecutingMission(false);
        }
    };

    if (!ready || loading) {
        return (
            <div className="w-full h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-t-2 border-r-2 border-gold rounded-full mb-4" />
                <p className="font-cinzel text-gold text-sm tracking-widest uppercase animate-pulse">Entering The Hub...</p>
            </div>
        );
    }

    if (!character) return null;

    const adaptedCharacter = {
        name: character.name,
        level: character.level,
        charClass: character.class,
        avatarUrl: character.avatarUrl,
        stats: {
            str: character.str,
            dex: character.dex,
            sta: character.sta,
            wis: character.wis,
            cp: character.cp || (character.str * 10 + character.dex * 10 + character.wis * 10 + character.sta * 10)
        }
    };

    // If no buildings exist yet, provide basic defaults for display
    const domainBuildings = character.buildings && character.buildings.length > 0 ? character.buildings : [
        { id: '1', type: 'Gold Mine', level: 1, production: '10 Gold / hr' },
        { id: '2', type: 'Solar Altar', level: 1, production: '5 Faith / hr' },
        { id: '3', type: 'Leyline Tap', level: 1, production: '20 Energy / hr' }
    ];

    const logs = character.combatLogsDefending || [];
    const recentDefeats = logs.filter((log: any) => log.winner === 'ATTACKER' && log.goldStolen > 0).slice(0, 1);

    return (
        <AppLayout character={character}>
            <div className="w-full">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="font-cinzel text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-100 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                        THE HUB
                    </h1>
                    <p className="font-sans text-gray-400 text-sm tracking-widest uppercase mt-2">Manage your vessel and domain</p>
                </div>

                {recentDefeats.length > 0 && (
                    <div className="w-full bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                        <h3 className="font-cinzel tracking-widest text-lg font-bold text-red-500 mb-1">Divine Intrusion</h3>
                        <p className="font-sans text-sm">You were attacked while meditating. You lost <strong className="text-red-400">{recentDefeats[0].goldStolen} Gold</strong>.</p>
                    </div>
                )}

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                    {/* Left/Center Column: The Vessel & Bounties */}
                    <div className="md:col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col items-center xl:items-start space-y-8">
                        <div className="w-full max-w-md space-y-6">
                            <CharacterCard character={adaptedCharacter} />

                            {/* Mission / Bounties Panel */}
                            <div className="bg-black/80 border-2 border-gold/30 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                                <h2 className="font-cinzel text-xl md:text-2xl text-gold-light mb-4 uppercase tracking-[0.2em] font-black drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] flex items-center">
                                    <span className="mr-3">⚔️</span> The Edge of the Void
                                </h2>

                                <p className="font-sans text-gray-400 text-sm mb-6 leading-relaxed">
                                    Spend your accumulated logic-cycles (Energy) to dispatch your avatar into the cyber-ruins. Claim Gold and Experience.
                                </p>

                                <button
                                    onClick={handleExecuteMission}
                                    onMouseEnter={playHover}
                                    disabled={isExecutingMission || character.energy < 10}
                                    className="w-full py-4 bg-gradient-to-r relative from-gold-dark via-gold to-gold-dark text-black font-cinzel font-black uppercase tracking-[0.2em] rounded hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale overflow-hidden group"
                                >
                                    <span className="relative z-10 flex justify-center items-center">
                                        Raid the Cyber-Ruins <span className="ml-2 font-sans font-bold text-xs bg-black/20 px-2 py-1 rounded">-10 Energy</span>
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>

                                {/* Floating Reward Animation */}
                                <AnimatePresence>
                                    {floatingReward && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: -20 }}
                                            exit={{ opacity: 0, y: -40 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-4 bg-black/90 border border-gold p-4 rounded-lg pointer-events-none z-20"
                                        >
                                            <span className="text-gold font-bold font-sans">+{floatingReward.gold} Gold</span>
                                            <span className="text-blue-400 font-bold font-sans">+{floatingReward.xp} XP</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Viral Share Array */}
                        <div className="w-full max-w-md bg-black/40 border border-gold/20 p-6 rounded-xl flex flex-col items-center text-center">
                            <h3 className="font-cinzel text-gold text-lg mb-2 tracking-widest">Divine Proclamation</h3>
                            <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest">Showcase your power to the mortal realm</p>
                            <ViralShareButton />
                        </div>

                    </div>

                    {/* Right Column: The Domain */}
                    <div className="md:col-span-12 lg:col-span-5 xl:col-span-4 space-y-4">
                        <div className="bg-black/80 border-b border-gold/40 pb-2 mb-6">
                            <h2 className="font-cinzel text-2xl text-white tracking-widest uppercase">The Domain</h2>
                            <p className="text-xs text-gray-500 font-sans tracking-[0.2em] uppercase">Resource Infrastructure</p>
                        </div>

                        <div className="space-y-4">
                            {domainBuildings.map((building: any) => (
                                <div key={building.id} className="bg-black/60 border border-gold/30 p-4 rounded-xl flex flex-col relative overflow-hidden group hover:border-gold/60 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors" />

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <h3 className="font-cinzel font-bold text-lg text-white drop-shadow-md capitalize">
                                                {building.type.replace('_', ' ')}
                                            </h3>
                                            <span className="bg-gold/20 text-gold text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-gold/40">
                                                Level {building.level}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleUpgradeBuilding(building.id)}
                                            onMouseEnter={playHover}
                                            disabled={buildingUpgradeState[building.id] || character.gold < Math.floor(100 * Math.pow(1.15, building.level - 1))}
                                            className="px-4 py-1.5 bg-gradient-to-r from-gray-900 to-black border border-gold/50 text-gold hover:text-white hover:bg-gold/20 font-cinzel text-xs font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                                        >
                                            {buildingUpgradeState[building.id] ? 'BUILDING...' : 'UPGRADE'}
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 relative z-10">
                                        <span className="text-gray-500 text-xs font-sans uppercase tracking-widest">Production</span>
                                        <span className="text-green-400 font-mono text-sm">{building.production || `+${building.level * 10} / hr`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
