import express from 'express';
import { verifyPrivyToken, AuthRequest } from '../middleware/privyAuth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/pvp/attack/registered
router.post('/attack/registered', verifyPrivyToken, async (req: AuthRequest, res) => {
    const { targetCharacterId } = req.body;
    const user = req.user;

    if (!user || !user.character) {
        return res.status(400).json({ error: "You must have a character to attack." });
    }

    if (user.character.id === targetCharacterId) {
        return res.status(400).json({ error: "You cannot attack yourself." });
    }

    try {
        const attacker = user.character;
        let defender: any;
        let isBot = false;

        if (targetCharacterId.startsWith("bot-")) {
            isBot = true;
            const botLevel = attacker.level;
            defender = {
                id: targetCharacterId,
                name: "Phantom Echo",
                str: botLevel * 2,
                dex: botLevel * 2,
                wis: botLevel * 2,
                sta: botLevel * 2,
                gold: Math.floor(Math.random() * (botLevel * 50 - botLevel * 10 + 1)) + botLevel * 10,
            };
        } else {
            defender = await prisma.character.findUnique({
                where: { id: targetCharacterId }
            });
        }

        if (!defender) {
            return res.status(404).json({ error: "Target character not found." });
        }

        // Calculate CP for both
        const attackerCp = attacker.str * 10 + attacker.dex * 10 + attacker.wis * 10 + attacker.sta * 10;
        const defenderCp = defender.str * 10 + defender.dex * 10 + defender.wis * 10 + defender.sta * 10;

        // Roll formula: Base CP + random roll (up to 20% bonus)
        const attackerRoll = attackerCp + (attackerCp * Math.random() * 0.2);
        const defenderRoll = defenderCp + (defenderCp * Math.random() * 0.2);

        let winner = '';
        let goldStolen = 0;
        let logText = '';

        if (attackerRoll > defenderRoll) {
            winner = 'ATTACKER';
            goldStolen = isBot ? defender.gold : Math.floor(defender.gold * 0.10); // Steal 10% or full bot gold
            logText = `${attacker.name} brutally defeated ${isBot ? 'a Phantom Echo' : defender.name} in the arena.`;

            // Update attacker (add gold, add 50 XP)
            await prisma.character.update({
                where: { id: attacker.id },
                data: {
                    gold: { increment: goldStolen },
                    xp: { increment: 50 }
                }
            });

            // Update defender (lose gold)
            if (!isBot) {
                await prisma.character.update({
                    where: { id: defender.id },
                    data: {
                        gold: { decrement: goldStolen }
                    }
                });
            }
        } else {
            winner = 'DEFENDER';
            goldStolen = Math.floor(attacker.gold * 0.05); // Attacker loses 5%
            logText = `${attacker.name} attempted to strike ${isBot ? 'a Phantom Echo' : defender.name} but was repelled!`;

            // Update attacker (lose gold)
            await prisma.character.update({
                where: { id: attacker.id },
                data: {
                    gold: { decrement: goldStolen }
                }
            });

            // Update defender (gain gold)
            if (!isBot) {
                await prisma.character.update({
                    where: { id: defender.id },
                    data: {
                        gold: { increment: goldStolen }
                    }
                });
            }
        }

        // Save CombatLog
        const combatLog = await prisma.combatLog.create({
            data: {
                attackerId: attacker.id,
                defenderId: isBot ? null : defender.id,
                winner,
                goldStolen,
                logText
            }
        });

        res.json({
            victory: winner === 'ATTACKER',
            goldStolen,
            logText,
            combatLog
        });

    } catch (error) {
        console.error("PvP Error:", error);
        res.status(500).json({ error: "Internal server error during combat resolution." });
    }
});

// POST /api/pvp/attack/x-bounty
router.post('/attack/x-bounty', verifyPrivyToken, async (req: AuthRequest, res) => {
    const { targetXHandle } = req.body;
    const user = req.user;

    if (!user || !user.character) {
        return res.status(400).json({ error: "You must have a character to issue a bounty." });
    }

    if (!targetXHandle) {
        return res.status(400).json({ error: "Target X handle is required." });
    }

    const attacker = user.character;

    if (attacker.energy < 100) {
        return res.status(400).json({ error: "Not enough energy. Requires 100 Energy." });
    }

    try {
        // Deduct energy
        await prisma.character.update({
            where: { id: attacker.id },
            data: {
                energy: { decrement: 100 }
            }
        });

        // Create PENDING log
        const combatLog = await prisma.combatLog.create({
            data: {
                attackerId: attacker.id,
                defenderXHandle: targetXHandle,
                winner: 'PENDING',
                goldStolen: 0,
                logText: `${attacker.name} issued a Divine Bounty on ${targetXHandle}.`
            }
        });

        res.json({
            success: true,
            message: `Bounty issued on ${targetXHandle}!`,
            combatLog
        });

    } catch (error) {
        console.error("PvP Bounty Error:", error);
        res.status(500).json({ error: "Internal server error issuing bounty." });
    }
});

// GET /api/pvp/targets
router.get('/targets', verifyPrivyToken, async (req: AuthRequest, res) => {
    const user = req.user;

    if (!user || !user.character) {
        return res.status(400).json({ error: "You must have a character to find targets." });
    }

    const level = user.character.level;

    try {
        let targets = await prisma.character.findMany({
            where: {
                id: { not: user.character.id },
                level: {
                    gte: Math.max(1, level - 2),
                    lte: level + 2
                }
            },
            take: 20
        });

        // Simple random shuffle and slice
        targets = targets.sort(() => 0.5 - Math.random()).slice(0, 5);

        // Secondary Search (Fallback)
        if (targets.length < 5) {
            const moreTargets = await prisma.character.findMany({
                where: {
                    id: { not: user.character.id, notIn: targets.map(t => t.id) }
                },
                take: 20
            });
            const shuffledMore = moreTargets.sort(() => 0.5 - Math.random());

            for (const t of shuffledMore) {
                if (targets.length >= 5) break;
                targets.push(t);
            }
        }

        const finalTargets = targets.map((t: any) => ({ ...t, isBot: false }));

        // The "Echo" Generator (NPC Bots)
        const botNames = ["Fallen Sentinel", "Solar Husk", "Void Drifter", "Astral Revenant", "Crimson Cultist", "Echo of the Ancestors"];
        while (finalTargets.length < 5) {
            const botLevel = level;
            finalTargets.push({
                id: `bot-${Math.random().toString(36).substr(2, 9)}`,
                name: botNames[Math.floor(Math.random() * botNames.length)],
                level: botLevel,
                class: ["Warrior", "Mage", "Rogue"][Math.floor(Math.random() * 3)],
                avatarUrl: `https://api.dicebear.com/7.x/bottts/png?seed=${Math.random()}&backgroundColor=000000`,
                str: botLevel * 2,
                dex: botLevel * 2,
                wis: botLevel * 2,
                sta: botLevel * 2,
                gold: Math.floor(Math.random() * (botLevel * 50 - botLevel * 10 + 1)) + botLevel * 10,
                isBot: true,
            } as any);
        }

        res.json({ targets: finalTargets });
    } catch (error) {
        console.error("Fetch Targets Error:", error);
        res.status(500).json({ error: "Failed to fetch targets." });
    }
});

export default router;
