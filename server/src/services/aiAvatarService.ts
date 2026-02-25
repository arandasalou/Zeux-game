export const aiAvatarService = {
    buildDynamicAvatarUrl: (race: string, charClass: string, stats: { str: number, dex: number, wis: number, sta: number }): string => {
        let modifiers = "";

        if (stats.str >= 8) {
            modifiers += "Massive, muscular physique, wielding a heavy oversized weapon. ";
        }
        if (stats.dex >= 8) {
            modifiers += "Sleek, agile posture, lightweight rogue armor, cloaked in shadows. ";
        }
        if (stats.wis >= 8) {
            modifiers += "Floating mystical artifacts, glowing ethereal eyes, arcane golden energy. ";
        }
        if (stats.sta >= 8) {
            modifiers += "Heavily armored, towering shield, battle-scarred. ";
        }

        const unencodedPrompt = `A highly detailed concept art portrait of a ${race} ${charClass}. Dark fantasy style, Golden Olympus aesthetic, ornate armor. ${modifiers}`;
        const encodedPrompt = encodeURIComponent(unencodedPrompt);
        const randomSeed = Math.floor(Math.random() * 1000000);

        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`;
    }
};
