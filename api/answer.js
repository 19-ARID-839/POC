import OpenAI from "openai";

export default async function handler(req, res) {
  console.log("🔵 [API HIT] /api/answer");

  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY in environment variables");
      return res.status(500).json({ error: "Server misconfiguration: Missing API key" });
    }

    const { question } = req.body;
    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Invalid request: Question is required" });
    }

    console.log("📩 Received Question:", question);

    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Call OpenAI Chat Completion API
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI interview assistant. Provide STAR-format concise answers." },
        { role: "user", content: question }
      ],
      max_tokens: 300
    });

    const answer = completion.choices[0].message.content;
    console.log("✅ AI Answer Generated:", answer);

    // Return the AI-generated answer
    return res.status(200).json({ answer });
  } catch (err) {
    console.error("❌ Error fetching AI response:", err.message);
    return res.status(500).json({
      error: "Failed to fetch AI response",
      details: err.message
    });
  }
}


