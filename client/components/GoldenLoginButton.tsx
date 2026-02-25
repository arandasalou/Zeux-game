"use client";

import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { useGameSounds } from '../hooks/useGameSounds';

export default function GoldenLoginButton() {
    const { login, authenticated, logout, ready } = usePrivy();
    const { playHover, playClick } = useGameSounds();

    if (!ready) {
        return (
            <button disabled className="relative px-8 py-3 bg-gray-800 text-gray-500 font-cinzel font-bold text-lg rounded uppercase tracking-widest cursor-not-allowed">
                Initializing...
            </button>
        );
    }

    if (authenticated) {
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => logout()}
                className="px-6 py-2 border border-red-500/50 text-red-500 rounded-md font-sans uppercase tracking-[0.2em] text-sm hover:bg-red-500/10 transition-colors z-10 relative"
            >
                Sever Link
            </motion.button>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px 0px rgba(255, 215, 0, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHover}
            onClick={() => {
                playClick();
                console.log("Login clicked, Privay ready state:", ready);
                login();
            }}
            className="relative z-10 px-8 py-3 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-black font-cinzel font-bold text-lg rounded uppercase tracking-widest overflow-hidden group hover:cursor-pointer"
        >
            <div className="absolute inset-0 w-1/4 h-full bg-white/30 skew-x-12 group-hover:animate-[shine_1.5s_infinite]" style={{ left: '-30%' }} />
            Awaken Account
        </motion.button>
    );
}
