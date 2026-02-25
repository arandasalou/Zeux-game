"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { useGameSounds } from "../../hooks/useGameSounds";
const GoldenDustBackground = dynamic(() => import('../../components/GoldenDustBackground'), { ssr: false });

const RACES = ["Human", "Titan", "Elf", "Orc", "Nymph"];
const CLASSES = [
    { name: "Warrior", baseStats: { str: 14, dex: 10, wis: 6, sta: 14 } },
    { name: "Mage", baseStats: { str: 6, dex: 10, wis: 18, sta: 6 } },
    { name: "Assassin", baseStats: { str: 10, dex: 18, wis: 6, sta: 6 } },
    { name: "Paladin", baseStats: { str: 12, dex: 8, wis: 12, sta: 12 } },
    { name: "Berserker", baseStats: { str: 18, dex: 12, wis: 4, sta: 6 } }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CharacterCreation() {
    const { authenticated, getAccessToken, ready } = usePrivy();
    const router = useRouter();
    const { playHover, playClick, playSuccess, playDamage } = useGameSounds();

    // Redirect if not authenticated once Privy is ready
    useEffect(() => {
        if (ready && !authenticated) {
            router.push("/");
        }
    }, [ready, authenticated, router]);

    const [race, setRace] = useState(RACES[0]);
    const [charClass, setCharClass] = useState(CLASSES[0]);
    const [name, setName] = useState("");

    // Divine Sparks (Bonus Points)
    const MAX_SPARKS = 5;
    const [sparks, setSparks] = useState({ str: 0, dex: 0, wis: 0, sta: 0 });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const totalSparksUsed = sparks.str + sparks.dex + sparks.wis + sparks.sta;
    const sparksRemaining = MAX_SPARKS - totalSparksUsed;

    const currentStats = {
        str: charClass.baseStats.str + sparks.str,
        dex: charClass.baseStats.dex + sparks.dex,
        wis: charClass.baseStats.wis + sparks.wis,
        sta: charClass.baseStats.sta + sparks.sta,
    };

    const handleSparkChange = (stat: keyof typeof sparks, amount: number) => {
        const newValue = sparks[stat] + amount;
        if (newValue < 0 || (amount > 0 && sparksRemaining <= 0)) return;
        playHover();
        setSparks({ ...sparks, [stat]: newValue });
    };

    // Construct preview URL deterministically based on race + class only, to prevent reload on spark changes
    const unencodedPrompt = `A highly detailed concept art portrait of a ${race} ${charClass.name}. Dark fantasy style, Golden Olympus aesthetic, ornate armor.`;
    const previewUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(unencodedPrompt)}?width=512&height=512&nologo=true&seed=123`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playClick();
        if (!name.trim()) {
            playDamage();
            setErrorMsg("A true hero needs a name.");
            return;
        }
        if (sparksRemaining > 0) {
            playDamage();
            setErrorMsg("You must distribute all Divine Sparks to forge a vessel.");
            return;
        }

        try {
            setLoading(true);
            setErrorMsg("");
            const token = await getAccessToken();

            const response = await fetch(`${API_BASE_URL}/api/character/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name,
                    race: race,
                    charClass: charClass.name,
                    ...currentStats
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to forge vessel.");
            }

            playSuccess();
            // Transition to dashboard upon success
            router.push("/dashboard");

        } catch (err: any) {
            console.error(err);
            playDamage();
            setErrorMsg(err.message || "An unknown error occurred.");
            setLoading(false);
        }
    };

    if (!ready || !authenticated) return null; // Avoid flicker while checking auth

    return (
        <main className="relative w-full h-screen flex flex-col items-center justify-start p-6 sm:p-12 overflow-y-auto">
            <GoldenDustBackground />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-black/80 backdrop-blur-md border border-gold/40 rounded-xl p-8 shadow-[0_0_40px_rgba(255,215,0,0.1)] z-10 relative mt-10"
            >
                <h1 className="font-cinzel text-4xl text-center text-gold mb-2 tracking-wider">Forge Your Output</h1>
                <p className="font-sans text-center text-gray-400 text-sm tracking-widest uppercase mb-8">Deploy Your Physical Vessel</p>

                {errorMsg && (
                    <div className="w-full bg-red-900/40 border border-red-500/50 text-red-200 p-3 rounded text-center text-sm font-sans mb-6">
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-t-2 border-r-2 border-gold rounded-full"
                        />
                        <p className="font-mono text-gold animate-pulse tracking-[0.2em] uppercase text-sm">Forging your physical vessel...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Left Side: Avatar Preview */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.3)] border-2 border-gold/50 bg-black flex items-center justify-center group">
                                <div className="absolute inset-0 flex items-center justify-center z-0">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-t-2 border-r-2 border-gold rounded-full" />
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={previewUrl}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        src={previewUrl}
                                        alt="Avatar Preview"
                                        className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110"
                                    />
                                </AnimatePresence>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-2 md:p-4 z-20">
                                    <p className="text-center text-gold font-cinzel text-sm md:text-lg font-bold tracking-wider drop-shadow-md">
                                        {name || "UNKNOWN"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Live Manifestation</p>
                        </div>

                        {/* Right Side: Form Controls */}
                        <form onSubmit={handleSubmit} className="space-y-6 w-full">

                            {/* Identity Group */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gold-dark font-sans text-sm tracking-widest uppercase mb-2">Identifier (Name)</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onClick={playHover}
                                        maxLength={20}
                                        className="w-full bg-black border border-gold/30 rounded p-3 text-white font-cinzel text-xl focus:border-gold focus:outline-none transition-colors"
                                        placeholder="E.g. Kaelen Vex"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gold-dark font-sans text-sm tracking-widest uppercase mb-2">Lineage (Race)</label>
                                        <select
                                            value={race}
                                            onChange={(e) => { playClick(); setRace(e.target.value); }}
                                            onMouseEnter={playHover}
                                            className="w-full bg-black border border-gold/30 rounded p-3 text-white font-sans focus:border-gold focus:outline-none appearance-none cursor-pointer"
                                        >
                                            {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gold-dark font-sans text-sm tracking-widest uppercase mb-2">Protocol (Class)</label>
                                        <select
                                            value={charClass.name}
                                            onChange={(e) => {
                                                playClick();
                                                const newClass = CLASSES.find(c => c.name === e.target.value);
                                                if (newClass) {
                                                    setCharClass(newClass);
                                                    setSparks({ str: 0, dex: 0, wis: 0, sta: 0 }); // Reset sparks on class change
                                                }
                                            }}
                                            onMouseEnter={playHover}
                                            className="w-full bg-black border border-gold/30 rounded p-3 text-white font-sans focus:border-gold focus:outline-none appearance-none cursor-pointer"
                                        >
                                            {CLASSES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Group */}
                            <div className="pt-6 border-t border-gold/20">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-gold font-cinzel text-lg md:text-xl tracking-widest uppercase">Divine Sparks</label>
                                    <div className="text-xl font-mono text-white">
                                        <span className={sparksRemaining === 0 ? "text-gray-500" : "text-gold"}>{sparksRemaining}</span> / {MAX_SPARKS}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(Object.keys(currentStats) as Array<keyof typeof sparks>).map((statName) => (
                                        <div key={statName} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                                            <div className="w-1/3 text-gray-300 font-sans tracking-widest uppercase text-sm">
                                                {statName}
                                            </div>

                                            <div className="w-1/3 text-center text-xl font-cinzel text-gold font-bold">
                                                {currentStats[statName]}
                                                {sparks[statName] > 0 && <span className="text-xs ml-1 text-green-400 font-sans tracking-widest">(+{sparks[statName]})</span>}
                                            </div>

                                            <div className="w-1/3 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSparkChange(statName, -1)}
                                                    onMouseEnter={playHover}
                                                    disabled={sparks[statName] <= 0}
                                                    className="w-8 h-8 rounded bg-black border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSparkChange(statName, 1)}
                                                    onMouseEnter={playHover}
                                                    disabled={sparksRemaining <= 0}
                                                    className="w-8 h-8 rounded bg-gold/20 border border-gold/50 text-gold flex items-center justify-center hover:bg-gold hover:text-black disabled:opacity-30 disabled:hover:bg-gold/20 disabled:hover:text-gold transition-colors font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    onClick={playHover}
                                    className="w-full py-4 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-black font-cinzel font-bold text-lg rounded uppercase tracking-[0.3em] overflow-hidden group relative"
                                >
                                    <div className="absolute inset-0 w-1/4 h-full bg-white/30 skew-x-12 group-hover:animate-[shine_1.5s_infinite]" style={{ left: '-30%' }} />
                                    <span className="relative z-10">Ascend</span>
                                </motion.button>
                            </div>
                        </form>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
