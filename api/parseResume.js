import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const config = { api: { bodyParser: false } };

// Extract basic keywords from resume text
function extractKeywords(text) {
    const keywords = [
        "JavaScript", "Python", "React", "Node.js", "Tailwind", "Machine Learning",
        "AI", "SQL", "AWS", "Docker", "Kubernetes", "HTML", "CSS", "API",
        "Project Management", "Leadership", "Agile", "C++", "Java", "Figma", "Git"
    ];
    return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "File upload failed" });

        try {
            const filePath = files.resume.filepath;
            let textContent = "";

            if (files.resume.mimetype === "application/pdf") {
                const pdfData = await pdf(fs.readFileSync(filePath));
                textContent = pdfData.text;
            } else if (files.resume.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const docxData = await mammoth.extractRawText({ path: filePath });
                textContent = docxData.value;
            } else {
                return res.status(400).json({ error: "Unsupported file type. Use PDF or DOCX." });
            }

            fs.unlinkSync(filePath);

            const resumeKeywords = extractKeywords(textContent);
            const jdText = fields.jobDescription || "";
            const jdKeywords = jdText ? extractKeywords(jdText) : [];

            const matchScore = jdKeywords.length
                ? (resumeKeywords.filter(k => jdKeywords.includes(k)).length / jdKeywords.length) * 100
                : null;

            res.status(200).json({ resumeKeywords, jdKeywords, matchScore });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Resume parsing failed" });
        }
    });
}
