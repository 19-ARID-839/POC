import OpenAI from "openai";

export default async function handler(req, res) {
  console.log("🟢 API /tts called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Server misconfigured: Missing API key" });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    console.log("📩 TTS Request for:", text);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);

  } catch (err) {
    console.error("❌ Error in /tts:", err.message);
    return res.status(500).json({ error: "TTS failed", details: err.message });
  }
}

