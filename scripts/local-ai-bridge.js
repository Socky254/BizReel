const http = require('http');

/**
 * BizReel Local AI Bridge
 *
 * This server mimics the Supabase AI Gateway for offline development.
 * It routes requests to a local Ollama instance if available,
 * otherwise it provides high-quality mock responses.
 */

const PORT = 11435;
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { task, payload } = JSON.parse(body);
                console.log(`[Local AI] Received Task: ${task}`);

                let responseData = {};

                switch (task) {
                    case 'CONTENT_GEN':
                        responseData = await handleContentGen(payload);
                        break;
                    case 'RECOMMENDATION':
                        responseData = { results: payload.candidateIds.map(id => ({ id, score: Math.random() })) };
                        break;
                    case 'MODERATION':
                        responseData = { flagged: false };
                        break;
                    case 'INSIGHTS':
                        responseData = { insight: "Local Insight: Business engagement is steady." };
                        break;
                    default:
                        responseData = { error: "Unknown task" };
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(responseData));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    }
});

async function handleContentGen(payload) {
    const prompt = payload.userMessage || "Write a professional business caption.";

    // Try to call Ollama
    try {
        const ollamaResponse = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({
                model: 'llama3',
                prompt: `You are BizReel AI. Context: Professional business reels. Task: ${prompt}`,
                stream: false
            })
        });
        const data = await ollamaResponse.json();
        return { caption: data.response };
    } catch (e) {
        console.log("[Local AI] Ollama not found, using mock response.");
        return { caption: `[OFFLINE MOCK] Professional caption for: "${prompt}"\n\n#BizReel #Business #Growth` };
    }
}

server.listen(PORT, () => {
    console.log(`\n🚀 BizReel Local AI Bridge running at http://localhost:${PORT}`);
    console.log(`👉 Point your app to this endpoint for offline AI development.\n`);
});
