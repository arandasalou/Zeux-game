import express from 'express';
import { verifyPrivyToken, AuthRequest } from '../middleware/privyAuth';
import { PrismaClient } from '@prisma/client';
import { aiMasterService } from '../services/aiMasterService';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/encounter
router.post('/', verifyPrivyToken, async (req: AuthRequest, res) => {
    const { playerAction } = req.body;
    const user = req.user;

    if (!user || !user.character) {
        return res.status(400).json({ error: "You must have a physical vessel to face the Crucible." });
    }

    if (!playerAction) {
        return res.status(400).json({ error: "You must declare an action to Zeus." });
    }

    try {
        const character = user.character;

        if (character.hpCurrent <= 0) {
            return res.status(400).json({ error: "Your avatar is destroyed. You cannot act." });
        }

        // Call Gemini GM
        const fate = await aiMasterService.chatWithZeus(playerAction, character);

        // Calculate new stats, enforcing boundaries
        const newHp = Math.max(0, Math.min(character.hpMax, character.hpCurrent + fate.statChanges.hpDelta));
        let newEnergy = Math.max(0, character.energy + fate.statChanges.energyDelta);
        let newGold = Math.max(0, character.gold + fate.statChanges.goldDelta);
        let newFaith = Math.max(0, character.faith + fate.statChanges.faithDelta);

        // Apply Death State overriding mechanics
        if (fate.isDead || newHp <= 0) {
            newEnergy = 0;
            // Losing 50% gold upon systemic collapse
            newGold = Math.floor(newGold * 0.5);
            newFaith = Math.max(0, newFaith - 10);
        }

        // Update database
        const updatedCharacter = await prisma.character.update({
            where: { id: character.id },
            data: {
                hpCurrent: newHp,
                energy: newEnergy,
                gold: newGold,
                faith: newFaith
            }
        });

        // Optionally, we could log this to a NarrativeLog table if it existed,
        // but for now we skip storing the entire text narrative in PostgreSQL to save space.

        res.json({
            narrative: fate.narrative,
            isDead: fate.isDead || newHp <= 0,
            character: updatedCharacter,
            statChanges: fate.statChanges,
            options: fate.options
        });

    } catch (error) {
        console.error("Encounter Error:", error);
        res.status(500).json({ error: "The Olympus mainframe failed to process your fate." });
    }
});

export default router;
