import express from "express";
import { verifyPrivyToken, AuthRequest } from "../middleware/privyAuth";
import { aiAvatarService } from "../services/aiAvatarService";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", verifyPrivyToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user; // Appended by verifyPrivyToken

        // Check if the user already has a character
        const existingChar = await prisma.character.findUnique({
            where: { userId: user.privyId },
        });

        if (existingChar) {
            return res.status(400).json({ error: "Character already exists for this user." });
        }

        const { name, race, charClass, str, dex, wis, sta } = req.body;

        if (!name || !race || !charClass) {
            return res.status(400).json({ error: "Missing required character fields." });
        }

        const stats = { str: Number(str), dex: Number(dex), wis: Number(wis), sta: Number(sta) };

        // Validate stat distribution
        const totalStats = stats.str + stats.dex + stats.wis + stats.sta;

        // Assuming base stats total to 40 (10 in each) + 5 divine sparks = 45 max for a level 1
        // (This can be modified if classes have different base stat totals later on)
        if (totalStats > 50) { // Giving some wiggle room for future enhancements
            return res.status(400).json({ error: "Invalid stat distribution detected." });
        }

        const avatarUrl = aiAvatarService.buildDynamicAvatarUrl(race, charClass, stats);

        const character = await prisma.character.create({
            data: {
                userId: user.privyId,
                name: name,
                race: race,
                class: charClass,
                str: stats.str,
                dex: stats.dex,
                wis: stats.wis,
                sta: stats.sta,
                hpMax: 100 + (stats.sta * 5),
                hpCurrent: 100 + (stats.sta * 5),
                energy: 100,
                gold: 500,
                avatarUrl: avatarUrl,
                buildings: {
                    create: [
                        { type: "gold_mine", level: 1 },
                        { type: "solar_altar", level: 1 },
                        { type: "leyline_tap", level: 1 }
                    ]
                }
            },
            include: {
                buildings: true
            }
        });

        res.status(201).json({ character });
    } catch (error: any) {
        console.error("Character Creation Error:", error);
        res.status(500).json({ error: "The Forge failed to create your vessel." });
    }
});

export default router;
