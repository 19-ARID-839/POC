import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  console.log("🟢 API /stt called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "Server misconfigured: Missing API key" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Error parsing file:", err.message);
      return res.status(500).json({ error: "File parsing failed" });
    }

    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const transcription = await client.audio.transcriptions.create({
        file: fs.createReadStream(files.audio.filepath),
        model: "whisper-1"
      });

      console.log("✅ Transcription:", transcription.text);
      fs.unlinkSync(files.audio.filepath); // cleanup temp file
      return res.status(200).json({ text: transcription.text });

    } catch (err) {
      console.error("❌ Error in /stt:", err.message);
      return res.status(500).json({ error: "Transcription failed", details: err.message });
    }
  });
}


