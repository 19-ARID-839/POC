document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const micBtn = document.getElementById("micBtn");

    // Add chat messages
    function addMessage(text, type) {
        const msg = document.createElement("div");
        msg.classList.add("chat-bubble", type);
        msg.innerText = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Fetch AI answer
    async function fetchAIAnswer(question) {
        try {
            addMessage("🤖 AI is thinking...", "question");
            const res = await fetch("/api/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            addMessage(data.answer, "question");
            playAnswerTTS(data.answer);
        } catch (err) {
            console.error("❌ AI Fetch Error:", err.message);
            addMessage("⚠️ Error fetching AI response.", "question");
        }
    }

    // Mic (STT)
    micBtn.addEventListener("click", async () => {
        console.log("🎤 Mic button clicked");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];
            micBtn.classList.add("active");
            addMessage("🎙️ Listening... Speak now.", "question");

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                micBtn.classList.remove("active");
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("audio", audioBlob);

                try {
                    const response = await fetch("/api/stt", { method: "POST", body: formData });
                    const result = await response.json();
                    if (result.text) {
                        addMessage(result.text, "answer");
                        fetchAIAnswer(result.text);
                    } else {
                        addMessage("⚠️ Could not transcribe audio.", "question");
                    }
                } catch (err) {
                    console.error("❌ STT API Error:", err.message);
                    addMessage("⚠️ Speech recognition failed.", "question");
                }
            };

            mediaRecorder.start();
            console.log("🎙️ Recording started");
            setTimeout(() => mediaRecorder.stop(), 4000);
        } catch (err) {
            console.error("❌ Microphone Error:", err.message);
            alert("Microphone access denied. Please allow permissions.");
        }
    });

    // TTS
    async function playAnswerTTS(text) {
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            const audioBlob = await res.blob();
            const audioURL = URL.createObjectURL(audioBlob);
            new Audio(audioURL).play();
        } catch (err) {
            console.error("❌ TTS Error:", err.message);
        }
    }

    // Send button
    sendBtn.addEventListener("click", () => {
        const question = userInput.value.trim();
        if (question) {
            addMessage(question, "answer");
            fetchAIAnswer(question);
            userInput.value = "";
        }
    });
});




