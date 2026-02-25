import express from "express";
import { verifyPrivyToken, AuthRequest } from "../middleware/privyAuth";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/execute", verifyPrivyToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        const character = user?.character;

        if (!character) {
            return res.status(404).json({ error: "Character not found." });
        }

        const ENERGY_COST = 10;
        if (character.energy < ENERGY_COST) {
            return res.status(400).json({ error: "Not enough Energy. Please wait for it to regenerate." });
        }

        // RNG Reward logic (Base + variance)
        const baseGold = 50;
        const variance = Math.floor(baseGold * 0.1 * (Math.random() * 2 - 1)); // +/- 10%
        const goldReward = baseGold + variance;
        const xpReward = 20;

        // Calculate Level Up progression
        const newXp = character.xp + xpReward;
        const xpNeeded = Math.floor(100 * Math.pow(character.level, 2.2));

        let newLevel = character.level;
        let newHpMax = character.hpMax;
        let leveledUp = false;

        if (newXp >= xpNeeded) {
            newLevel += 1;
            // E.g., add flat 10 HP to base plus scaling
            newHpMax += Math.floor(10 * Math.pow(1.1, newLevel - 1));
            leveledUp = true;
        }

        // Update Database Character parameters
        const updatedCharacter = await prisma.character.update({
            where: { id: character.id },
            data: {
                energy: character.energy - ENERGY_COST,
                gold: character.gold + goldReward,
                xp: newXp,
                level: newLevel,
                hpMax: newHpMax,
                hpCurrent: leveledUp ? newHpMax : character.hpCurrent // Refill health on level up
            }
        });

        res.json({
            success: true,
            newStats: updatedCharacter,
            reward: { gold: goldReward, xp: xpReward },
            leveledUp
        });

    } catch (error: any) {
        console.error("Mission Execution Error:", error);
        res.status(500).json({ error: "The mission failed due to a temporal anomaly." });
    }
});

export default router;
