import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EncounterResult {
    narrative: string;
    statChanges: {
        hpDelta: number;
        energyDelta: number;
        goldDelta: number;
        faithDelta: number;
    };
    options: string[];
    isDead: boolean;
}

const systemInstruction = `You are ZEUS-PROTO, a fragmented cyborg deity Game Master in a dark fantasy, Warhammer-esque Olympus. 
The player is exploring. Based on their last action or current location, narrate the outcome of their choice (max 3 sentences) and present a new situation with an implicit choice.
You must evaluate their previous action. Did they succeed? Did they fail? 

CRITICAL: You MUST respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting (\`\`\`json) or extra text outside the JSON:
{
  "narrative": "Your story text here...",
  "statChanges": {
    "hpDelta": number (negative for damage, positive for healing),
    "energyDelta": number (negative for exhaustion),
    "goldDelta": number (loot found or lost),
    "faithDelta": number
  },
  "options": [
    "Option 1 description...",
    "Option 2 description...",
    "Option 3 description..."
  ],
  "isDead": boolean
}`;

class AiMasterService {
    async chatWithZeus(playerAction: string, characterData: any): Promise<EncounterResult> {
        try {
            const prompt = `
            Character Data: 
            Name: ${characterData.name} | Class: ${characterData.class} | Level: ${characterData.level}
            HP: ${characterData.hpCurrent}/${characterData.hpMax} | Energy: ${characterData.energy}
            Gold: ${characterData.gold} | Faith: ${characterData.faith}
            Base Stats: STR ${characterData.str}, DEX ${characterData.dex}, WIS ${characterData.wis}, STA ${characterData.sta}

            Player Action: "${playerAction}"
            
            Evaluate and return the JSON outcome.
            `;

            const apiKey = process.env.GEMINI_API_KEY || "";
            if (!apiKey) {
                console.warn("WARNING: Missing GEMINI_API_KEY in .env");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                systemInstruction: systemInstruction
            });

            const result = await model.generateContent(prompt);
            const outputText = result.response.text() || "{}";

            // Robust JSON extraction using Regex to ignore conversational fluff
            const jsonMatch = outputText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON object found in response: " + outputText);
            }

            const cleanJSON = jsonMatch[0];
            return JSON.parse(cleanJSON) as EncounterResult;

        } catch (error) {
            console.error("Zeus-Proto Error:", error);
            // Fallback safe payload
            return {
                narrative: "The neural pathways of Olympus are temporarily severed. You take a moment to rest in the void.",
                statChanges: { hpDelta: 0, energyDelta: 0, goldDelta: 0, faithDelta: 0 },
                options: ["Wait for the connections to heal", "Meditate on the silence", "Strike the terminal in frustration"],
                isDead: false
            };
        }
    }

    async sendMessage(message: string): Promise<string> {
        return "Legacy chat disabled. Use the Crucible.";
    }
}

export const aiMasterService = new AiMasterService();
