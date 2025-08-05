import formidable from "formidable";
import fs from "fs";
import { OpenAI } from "openai";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "File parsing failed" });

        try {
            if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OpenAI API Key" });

            const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const transcription = await client.audio.transcriptions.create({
                file: fs.createReadStream(files.audio.filepath),
                model: "whisper-1",
            });

            fs.unlinkSync(files.audio.filepath); // cleanup temp file
            return res.status(200).json({ text: transcription.text });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Transcription failed" });
        }
    });
}
