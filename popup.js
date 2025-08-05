document.addEventListener("DOMContentLoaded", () => { 
    let questions = [
        "What is your name?",
        "Tell me about your experience in web development.",
        "How do you handle deadlines under pressure?",
        "What are your strengths and weaknesses?"
    ];

    let hintedQuestions = [
        "Can you explain your last project?",
        "What are your career goals?",
        "Why should we hire you?"
    ];

    let currentQuestion = 0;
    const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const micBtn = document.getElementById("micBtn");
    const aiPopup = document.getElementById("aiPopup");
    const hintOptions = document.getElementById("hintOptions");
    const pocPreview = document.querySelector(".poc-preview");

    // ✅ Render Hinted Questions
    function renderHints() {
        hintOptions.innerHTML = "";
        hintedQuestions.forEach((hint, index) => {
            const span = document.createElement("span");
            span.innerText = hint;
            span.style.animationDelay = `${index * 0.2}s`;
            span.addEventListener("click", () => handleSuggestedQuestion(hint));
            hintOptions.appendChild(span);
        });
    }
    renderHints();

    // ✅ Add Message to Chat
    function addMessage(text, type) {
        const msg = document.createElement("div");
        msg.classList.add("chat-bubble", type);
        msg.innerText = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ✅ AI Loader Popup
    function showAiPopup(show = true) {
        aiPopup.style.display = show ? "block" : "none";
    }

    // ✅ Fetch AI Answer from Backend
    async function fetchAIAnswer(question) {
        showAiPopup(true);
        try {
            const response = await fetch("/api/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });
            const data = await response.json();
            if (data.answer) {
                addMessage(data.answer, "question");
                updatePocPanel(`AI Summary: ${data.answer}`);
                playAnswer(data.answer); // 🔊 Play TTS
            } else {
                addMessage("⚠️ Failed to get AI response.", "question");
            }
        } catch (err) {
            console.error("AI Answer Error:", err);
            addMessage("⚠️ Error fetching AI response.", "question");
        }
        showAiPopup(false);
    }

    // ✅ Text-to-Speech (TTS)
    async function playAnswer(answer) {
        try {
            const ttsResponse = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: answer })
            });
            const audioBlob = await ttsResponse.blob();
            const audioURL = URL.createObjectURL(audioBlob);
            new Audio(audioURL).play();
        } catch (err) {
            console.error("TTS Playback Error:", err);
        }
    }

    // ✅ Handle Send Button Click
    sendBtn.addEventListener("click", () => {
        if (userInput.value.trim() !== "") {
            const question = userInput.value.trim();
            addMessage(question, "answer");
            fetchAIAnswer(question);
            userInput.value = "";
            nextQuestion();
        }
    });

    // ✅ Handle Enter Key
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendBtn.click();
    });

    // ✅ Handle Suggested Question Click
    function handleSuggestedQuestion(hint) {
        addMessage(hint, "answer");
        fetchAIAnswer(hint);
    }

    // ✅ Update Quick POC Panel
    function updatePocPanel(content) {
        pocPreview.innerHTML = `<p><strong>${content}</strong></p>`;
    }

    // ✅ Mic STT using Whisper API (Backend)
    micBtn.addEventListener("click", async () => {
        micBtn.classList.toggle("active");
        if (micBtn.classList.contains("active")) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];
            mediaRecorder.start();

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob);

                try {
                    const response = await fetch("/api/stt", { method: "POST", body: formData });
                    const result = await response.json();
                    if (result.text) {
                        addMessage(result.text, "answer");
                        fetchAIAnswer(result.text);
                        nextQuestion();
                    }
                } catch (err) {
                    console.error("STT Error:", err);
                    addMessage("⚠️ Speech recognition failed.", "question");
                }
            };
            setTimeout(() => mediaRecorder.stop(), 4000);
        }
    });

    // ✅ Sidebar Actions
    document.getElementById("newChatBtn").addEventListener("click", () => {
        chatBox.innerHTML = "";
        pocPreview.innerHTML = `<p>POC results or demo preview will appear here.</p>`;
        currentQuestion = 0;
        addMessage("🆕 New chat started!", "question");
        askQuestion();
    });

    document.getElementById("clearChatBtn").addEventListener("click", () => {
        chatBox.innerHTML = "";
        pocPreview.innerHTML = `<p>POC results cleared.</p>`;
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        alert("Logging out...");
    });

    // ✅ Sequential Questions
    function nextQuestion() {
        currentQuestion++;
        if (currentQuestion < questions.length) askQuestion();
        else addMessage("✅ Interview complete!", "question");
    }

    function askQuestion() {
        if (currentQuestion < questions.length) {
            const q = questions[currentQuestion];
            addMessage(q, "question");
        }
    }

    askQuestion();
});



