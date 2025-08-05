import { OpenAI } from "openai";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OpenAI API Key" });

        const { question, resumeKeywords = [], jdKeywords = [] } = req.body;
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `
        Provide a STAR-format answer for:
        Question: "${question}"
        
        ${resumeKeywords.length ? `Resume Keywords: ${resumeKeywords.join(", ")}` : ""}
        ${jdKeywords.length ? `JD Keywords: ${jdKeywords.join(", ")}` : ""}
        
        Structure:
        - Situation:
        - Task:
        - Action:
        - Result:
        Tailor the answer to include resume & job description context if provided.
        `;

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an AI interview coach providing STAR-format answers." },
                { role: "user", content: prompt }
            ]
        });

        const answer = completion.choices[0].message.content;
        res.status(200).json({ answer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate AI answer" });
    }
}
