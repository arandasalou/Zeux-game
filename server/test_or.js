const fetch = require('node-fetch');
require('dotenv').config();

const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
const openRouterModel = "qwen/qwen3-vl-235b-a22b-thinking";

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
  "isDead": boolean
}`;

const prompt = `
Character Data: 
Name: TEST | Class: WARRIOR | Level: 1
HP: 100/100 | Energy: 100
Gold: 0 | Faith: 0
Base Stats: STR 10, DEX 10, WIS 10, STA 10

Player Action: "I look around the empty hall"
`;

(async () => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: openRouterModel,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ]
            })
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
})();
