"use client";

import dynamic from 'next/dynamic';
const GoldenDustBackground = dynamic(() => import('../components/GoldenDustBackground'), { ssr: false });
import GoldenLoginButton from '../components/GoldenLoginButton';
import ZeusNarrator from '../components/ZeusNarrator';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const { authenticated, ready } = usePrivy();
    const router = useRouter();

    useEffect(() => {
        if (ready && authenticated) {
            router.push('/dashboard');
        }
    }, [ready, authenticated, router]);

    return (
        <main className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
            <GoldenDustBackground />

            {!authenticated ? (
                <div className="flex flex-col items-center z-10 space-y-6">
                    {/* Zeus AI Portrait */}
                    <div className="relative z-20 w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-gold/50 shadow-[0_0_50px_rgba(255,215,0,0.5)] mb-4 group bg-black">
                        <img
                            src="https://image.pollinations.ai/prompt/Majestic%20Zeus%20god%20of%20thunder,%20glowing%20white%20eyes,%20golden%20crown,%20dark%20fantasy%20style,%20intricate%20details,%20cinematic%20lighting?width=512&height=512&nologo=true"
                            alt="Zeus Protocol"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                        />
                    </div>

                    {/* Logo Title */}
                    <div className="text-center space-y-2 relative z-20">
                        <h1 className="font-cinzel text-6xl md:text-8xl font-extrabold text-gold drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]">
                            ZeuX
                        </h1>
                        <p className="font-sans text-gray-400 tracking-[0.3em] uppercase text-sm md:text-base font-bold">
                            The Golden Verdict
                        </p>
                    </div>

                    <div className="pt-4">
                        <GoldenLoginButton />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center z-10 space-y-4">
                    <p className="font-cinzel text-gold text-xl animate-pulse">Syncing with Olympus Protocol...</p>
                </div>
            )}

            <ZeusNarrator />
        </main>
    );
}
