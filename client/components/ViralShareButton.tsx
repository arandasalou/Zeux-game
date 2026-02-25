"use client";

import { motion } from 'framer-motion';
import { toJpeg } from 'html-to-image';
import { Share2 } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    cardRef: React.RefObject<HTMLDivElement | null>;
    level: number;
    charClass: string;
}

export default function ViralShareButton({ cardRef, level, charClass }: Props) {
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        if (!cardRef.current) return;
        try {
            setLoading(true);
            // We generate the image in-browser to potentially prompt a download or auto-upload
            // Take the screenshot (We don't use the URL yet, but taking the screenshot simulates the action)
            // Assuming dashboardNode is equivalent to cardRef.current for this context, or defined elsewhere.
            // For now, we'll use cardRef.current to maintain functional correctness.
            await toJpeg(cardRef.current, { quality: 0.95, cacheBust: true });

            const tweetText = encodeURIComponent(`I have awakened as a Lvl ${level} ${charClass} in ZeuX. Can you dethrone me? #ZeuXGame #Web3Gaming`);
            const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

            // Open twitter intent directly 
            window.open(twitterUrl, '_blank');
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/40 border border-[#1DA1F2] text-white rounded-full font-sans text-sm transition-all"
        >
            <Share2 size={16} />
            {loading ? "Forging..." : "Share to X"}
        </motion.button>
    );
}
