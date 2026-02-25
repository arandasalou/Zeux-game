"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STATIC_GM_MESSAGES = [
    "THE AGE OF THE WEAK HAS ENDED. AWAKEN.",
    "YOUR ACTIONS ARE LOGGED IN THE ETHER.",
    "ADVANCE OR BE FORGOTTEN IN THE DARKNESS."
];

export default function ZeusNarrator() {
    const [message] = useState(STATIC_GM_MESSAGES[0]);
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let i = 0;
        setDisplayedText("");
        const interval = setInterval(() => {
            setDisplayedText((prev) => prev + message.charAt(i));
            i++;
            if (i >= message.length) clearInterval(interval);
        }, 50); // Typing speed

        return () => clearInterval(interval);
    }, [message]);

    return (
        <div className="absolute bottom-0 w-full p-6 z-20 flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-2xl bg-black/90 border border-gold/40 p-4 rounded-t-lg font-mono text-gold shadow-[0_-5px_20px_rgba(255,215,0,0.1)] backdrop-blur-sm"
            >
                <div className="text-xs text-gold-dark mb-2 tracking-[0.3em]">{"/// ZEUS-PROTO_LINK ///"}</div>
                <p className="min-h-[2.5rem] tracking-wide text-sm leading-relaxed">
                    {displayedText}<span className="animate-pulse">_</span>
                </p>
            </motion.div>
        </div>
    );
}
