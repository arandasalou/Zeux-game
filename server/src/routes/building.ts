import express from "express";
import { verifyPrivyToken, AuthRequest } from "../middleware/privyAuth";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/upgrade", verifyPrivyToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        const character = user?.character;
        const { buildingId } = req.body;

        if (!character) return res.status(404).json({ error: "Character not found." });
        if (!buildingId) return res.status(400).json({ error: "Missing buildingId in request." });

        const building = await prisma.building.findUnique({
            where: { id: buildingId }
        });

        // Ensure the building exists and the player actually owns it
        if (!building || building.characterId !== character.id) {
            return res.status(403).json({ error: "Building not found or does not belong to you." });
        }

        // Upgrade Cost Math
        const baseCost = 100;
        const cost = Math.floor(baseCost * Math.pow(1.15, building.level - 1));

        if (character.gold < cost) {
            return res.status(400).json({ error: "Insufficient Gold for this architectural undertaking." });
        }

        // Use Prisma Transaction to ensure atomic operation
        const [updatedCharacter, updatedBuilding] = await prisma.$transaction([
            prisma.character.update({
                where: { id: character.id },
                data: { gold: character.gold - cost }
            }),
            prisma.building.update({
                where: { id: building.id },
                data: { level: building.level + 1 }
            })
        ]);

        res.json({
            success: true,
            character: updatedCharacter,
            building: updatedBuilding
        });

    } catch (error: any) {
        console.error("Building Upgrade Error:", error);
        res.status(500).json({ error: "Failed to erect the architecture." });
    }
});

export default router;
