"use client";

import { useRef, useCallback, useEffect } from 'react';

/**
 * ZEUX SOUND ENGINE (Web Audio API Synthesizer)
 * This hook generates retro/sci-fi sounds dynamically using the browser's native audio engine.
 * ZERO external .mp3 files are required!
 */
export function useGameSounds() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize AudioContext on first user interaction to bypass browser autoplay blocks
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    // Helper to play a quick synthesized beep
    const playOscillator = useCallback((
        freq: number,
        type: OscillatorType,
        duration: number,
        vol: number = 0.1,
        slideFreq?: number
    ) => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [initAudio]);

    // specific sound profiles
    const playHover = useCallback(() => {
        playOscillator(800, 'sine', 0.05, 0.05); // High subtle tick
    }, [playOscillator]);

    const playClick = useCallback(() => {
        playOscillator(300, 'square', 0.1, 0.1, 150); // Deep golden clunk
    }, [playOscillator]);

    const playDamage = useCallback(() => {
        playOscillator(100, 'sawtooth', 0.5, 0.3, 40); // Heavy bass drop/thud
    }, [playOscillator]);

    const playSuccess = useCallback(() => {
        // Arpeggio
        playOscillator(440, 'sine', 0.1, 0.1);
        setTimeout(() => playOscillator(554, 'sine', 0.1, 0.1), 100);
        setTimeout(() => playOscillator(659, 'sine', 0.3, 0.1), 200);
    }, [playOscillator]);

    const playTyping = useCallback(() => {
        if (typingIntervalRef.current) return; // already typing

        // Mechanical rapid clicking
        typingIntervalRef.current = setInterval(() => {
            playOscillator(Math.random() * 200 + 600, 'square', 0.02, 0.02);
        }, 80);
    }, [playOscillator]);

    const stopTyping = useCallback(() => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
    }, []);

    // Cleanup typing interval on unmount
    useEffect(() => {
        return () => stopTyping();
    }, [stopTyping]);

    return {
        playHover,
        playClick,
        playDamage,
        playSuccess,
        playTyping,
        stopTyping
    };
}
