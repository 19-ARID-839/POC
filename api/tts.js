import { OpenAI } from "openai";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OpenAI API Key" });

        const { text } = req.body;
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const speech = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: text,
        });

        const buffer = Buffer.from(await speech.arrayBuffer());
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "TTS generation failed" });
    }
}
