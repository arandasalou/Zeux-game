import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";
import { PrismaClient } from "@prisma/client";

const privy = new PrivyClient(
    process.env.PRIVY_APP_ID || "",
    process.env.PRIVY_APP_SECRET || ""
);

const prisma = new PrismaClient();

// Extend the Express Request to hold the user
export interface AuthRequest extends Request {
    user?: any;
}

export const verifyPrivyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization token" });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Missing authorization token" });
        return;
    }

    try {
        const verifiedClaims = await privy.verifyAuthToken(token);
        const privyId = verifiedClaims.userId;

        // Auto-create user if they don't exist in our PostgreSQL DB yet
        let user = await prisma.user.findUnique({
            where: { privyId: privyId },
            include: {
                character: {
                    include: {
                        buildings: true,
                        combatLogsDefending: {
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        });

        if (!user) {
            user = await prisma.user.create({
                data: { privyId: privyId },
                include: {
                    character: {
                        include: {
                            buildings: true,
                            combatLogsDefending: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            }
                        }
                    }
                }
            });
        }

        // Idle Energy Regeneration Logic
        if (user.character) {
            const now = new Date();
            const lastProd = new Date(user.character.lastProduction);
            const secondsPassed = Math.floor((now.getTime() - lastProd.getTime()) / 1000);

            // 1 Energy every 10 seconds. Max cap 100.
            if (secondsPassed >= 10) {
                const energyToGive = Math.floor(secondsPassed / 10);
                const newEnergy = Math.min(100, user.character.energy + energyToGive);

                if (newEnergy !== user.character.energy || user.character.energy >= 100) {
                    await prisma.character.update({
                        where: { id: user.character.id },
                        data: {
                            energy: newEnergy,
                            lastProduction: now
                        }
                    });
                    user.character.energy = newEnergy;
                    user.character.lastProduction = now;
                }
            }
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ error: "Unauthorized access detected. Connection terminated." });
    }
};
