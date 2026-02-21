// ============= CROP ASSIST CHATBOT LOGIC (VOICE ENABLED) =============
document.addEventListener("DOMContentLoaded", function() {
    const chatbotForm = document.getElementById("chatbot-form");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotMic = document.getElementById("chatbot-mic");
    const chatbotLang = document.getElementById("chatbot-lang");
    const chatbotSection = document.getElementById("chatbot-section");
    const chatbotFab = document.getElementById("chatbot-fab");
    const chatbotClose = document.getElementById("chatbot-close");
    if (!chatbotForm || !chatbotInput || !chatbotWindow || !chatbotMic || !chatbotLang || !chatbotSection || !chatbotFab || !chatbotClose) return;

    // Toggle chatbot UI
    chatbotFab.addEventListener("click", function() {
        chatbotSection.style.display = "flex";
        chatbotFab.style.display = "none";
    });
    chatbotClose.addEventListener("click", function() {
        chatbotSection.style.display = "none";
        chatbotFab.style.display = "flex";
    });

    // Helper: Translate text using Google Translate API (free, unofficial, for demo)
    async function translateText(text, from, to) {
        if (from === to) return text;
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from.split('-')[0]}&tl=${to.split('-')[0]}&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            return data[0].map(x => x[0]).join("");
        } catch {
            return text; // fallback
        }
    }

    // Voice input (SpeechRecognition)
    let recognizing = false;
    let recognition;
    function getSelectedLang() {
        return chatbotLang.value || "en-US";
    }
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.lang = getSelectedLang();
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        chatbotLang.addEventListener("change", function() {
            if (recognition) recognition.lang = getSelectedLang();
        });

        recognition.onstart = function() {
            recognizing = true;
            chatbotMic.style.background = "#b2dfdb";
        };
        recognition.onend = function() {
            recognizing = false;
            chatbotMic.style.background = "#e0f7fa";
        };
        recognition.onerror = function(e) {
            recognizing = false;
            chatbotMic.style.background = "#e0f7fa";
        };
        recognition.onresult = function(event) {
            if (event.results && event.results[0] && event.results[0][0]) {
                chatbotInput.value = event.results[0][0].transcript;
                chatbotInput.focus();
            }
        };
        chatbotMic.addEventListener("click", function(e) {
            e.preventDefault();
            if (recognizing) {
                recognition.stop();
            } else {
                recognition.lang = getSelectedLang();
                recognition.start();
            }
        });
    } else {
        chatbotMic.disabled = true;
        chatbotMic.title = "Speech recognition not supported";
    }

    // Voice output: Use gTTS backend for Telugu/Indian languages, fallback to SpeechSynthesis for English
    function speakText(text, lang) {
        const indianLangs = ["te-IN","hi-IN","bn-IN","ta-IN","ml-IN","kn-IN","gu-IN","mr-IN","pa-IN","ur-IN"];
        const shortLang = lang.split('-')[0];
        if (indianLangs.includes(lang) || ["te","hi","bn","ta","ml","kn","gu","mr","pa","ur"].includes(shortLang)) {
            // Use backend TTS
            fetch("/tts", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text, lang: shortLang})
            })
            .then(res => res.ok ? res.blob() : null)
            .then(blob => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audio.play();
                }
            });
        } else if ('speechSynthesis' in window) {
            const synth = window.speechSynthesis;
            let voices = synth.getVoices();
            let voice = voices.find(v => v.lang === lang);
            if (!voice) {
                voice = voices.find(v => v.lang && v.lang.startsWith(shortLang));
            }
            if (!voice) {
                voice = voices.find(v => v.lang === "en-US") || voices[0];
            }
            const utter = new window.SpeechSynthesisUtterance(text);
            utter.lang = voice ? voice.lang : (lang || "en-US");
            if (voice) utter.voice = voice;
            synth.speak(utter);
        }
    }

    function appendMessage(text, sender, lang) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "chatbot-msg " + (sender === "user" ? "user" : "bot");
        msgDiv.textContent = text;
        chatbotWindow.appendChild(msgDiv);
        chatbotWindow.scrollTop = chatbotWindow.scrollHeight;
        if (sender === "bot") speakText(text, lang);
    }

    chatbotForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const userMsg = chatbotInput.value.trim();
        const userLang = getSelectedLang();
        if (!userMsg) return;
        appendMessage(userMsg, "user", userLang);
        chatbotInput.value = "";
        appendMessage("...", "bot", userLang); // loading indicator
        // Translate user input to English for the model
        const userMsgEn = await translateText(userMsg, userLang, "en");
        fetch("/chatbot", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: userMsgEn})
        })
        .then(r => r.json())
        .then(async d => {
            // Remove last bot loading message
            chatbotWindow.removeChild(chatbotWindow.lastChild);
            // Translate bot response back to user language
            let botResp = d.response || "";
            if (userLang !== "en-US") {
                botResp = await translateText(botResp, "en", userLang);
            }
            appendMessage(botResp, "bot", userLang);
        })
        .catch(() => {
            chatbotWindow.removeChild(chatbotWindow.lastChild);
            appendMessage("Sorry, there was an error.", "bot", userLang);
        });
    });
});
function uploadDataset() {
    let f = document.getElementById("dataset").files[0];
    let fd = new FormData();
    fd.append("file", f);
    fetch("/data/upload", { method: "POST", body: fd })
        .then(r => r.json()).then(d => {
            displayFormattedResult(d, "dataResult");
        });
}

function loadFromURL() {
    fetch("/data/url", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: "url=" + document.getElementById("dataurl").value
    }).then(r => r.json()).then(d => {
        displayFormattedResult(d, "dataResult");
    });
}

function processDataset() {
    fetch("/data/process", {method: "POST"})
        .then(r => r.json()).then(d => {
            displayFormattedResult(d, "dataResult");
        });
}

function trainModel() {
    fetch("/analysis/train", {method: "POST"})
        .then(r => r.json()).then(d => {
            displayFormattedResult(d, "analysisResult");
        });
}

function evaluateModel() {
    fetch("/analysis/evaluate")
        .then(r => r.json()).then(d => {
            displayFormattedResult(d, "analysisResult");
        });
}

function predictCrop() {
    let payload = {
        N: +N.value, P: +P.value, K: +K.value,
        temperature: +temperature.value,
        humidity: +humidity.value,
        ph: +ph.value
    };
    fetch("/prediction", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(d => {
        displayFormattedResult(d, "predictionResult");
    });
}

function toggleIoT() {
    fetch("/iot/toggle", {method: "POST"});
}

function fetchIoT() {
    fetch("/iot/data").then(r => r.json())
        .then(d => displayFormattedResult(d, "iotData"));
}

function analyzeMicro() {
    let payload = {
        Iron: +Iron.value,
        Zinc: +Zinc.value,
        Copper: +Copper.value,
        Boron: +Boron.value
    };
    fetch("/micronutrient", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(d => {
        displayFormattedResult(d, "microResult");
    });
}

function analyzeSoil() {
    let payload = {
        Iron: +Iron.value,
        Zinc: +Zinc.value,
        Copper: +Copper.value,
        Boron: +Boron.value
    };

    fetch("/analysis/soil", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(d => {
        displayFormattedResult(d, "soilResult");
        if (d.graph) {
            soilGraph.src = "data:image/png;base64," + d.graph;
        }
    });
}

function fullPredict() {
    let inputs = {
        N: +document.getElementById("N").value,
        P: +document.getElementById("P").value,
        K: +document.getElementById("K").value,
        temperature: +document.getElementById("temperature").value,
        humidity: +document.getElementById("humidity").value,
        ph: +document.getElementById("ph").value
    };

    let micronutrients = {
        Iron: +document.getElementById("Iron").value,
        Zinc: +document.getElementById("Zinc").value,
        Copper: +document.getElementById("Copper").value,
        Boron: +document.getElementById("Boron").value
    };

    fetch("/prediction/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            inputs: inputs,
            micronutrients: micronutrients
        })
    })
    .then(res => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        return res.text().then(t => ({ error: 'Server returned non-JSON response', raw: t }));
    })
    .then(data => {
        displayFormattedResult(data, "fullResult");
    })
    .catch(err => displayFormattedResult({ error: String(err) }, "fullResult"));
}

function predictDisease() {
    let diseaseData = {
        plant_type: document.getElementById("plant_type").value,
        temperature: +document.getElementById("temperature").value,
        humidity: +document.getElementById("humidity").value,
        rainfall: +document.getElementById("rainfall").value,
        ph: +document.getElementById("ph").value,
        days_since_planting: +document.getElementById("days_since_planting").value,
        leaf_discoloration: +document.getElementById("leaf_discoloration").value,
        leaf_spots: +document.getElementById("leaf_spots").value,
        wilting: +document.getElementById("wilting").value,
        yellowing: +document.getElementById("yellowing").value
    };

    if (!diseaseData.plant_type) {
        displayFormattedResult({ error: "Please select a plant type" }, "diseaseResult");
        return;
    }

    // Show loader
    document.getElementById("diseaseResult").innerHTML = `<div class="loader-spin" style="display:flex;align-items:center;justify-content:center;height:80px;">
        <div style="border:6px solid #e0e0e0;border-top:6px solid #2d6a4f;border-radius:50%;width:36px;height:36px;animation:spin 1s linear infinite;"></div>
        <span style="margin-left:18px;color:#2d6a4f;font-weight:600;">Analyzing plant health...</span>
    </div>`;

    fetch("/prediction/disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diseaseData)
    })
    .then(res => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        return res.text().then(t => ({ error: 'Server returned non-JSON response', raw: t }));
    })
    .then(data => {
        displayFormattedResult(data, "diseaseResult");
    })
    .catch(err => displayFormattedResult({ error: String(err) }, "diseaseResult"));
}

function trainAllModels() {
    // Show loader in modelResult
    const resultDiv = document.getElementById("modelResult");
    if (resultDiv) {
        resultDiv.innerHTML = `<div class="loader-spin" style="display:flex;align-items:center;justify-content:center;height:80px;">
            <div style="border:6px solid #e0e0e0;border-top:6px solid #4CAF50;border-radius:50%;width:36px;height:36px;animation:spin 1s linear infinite;"></div>
            <span style="margin-left:18px;color:#4CAF50;font-weight:600;">Training models, please wait...</span>
        </div>`;
    }
    fetch("/analysis/train-all", { method: "POST" })
        .then(r => r.json())
        .then(d => {
            displayFormattedResult(d, "modelResult");
        });
}
// Loader animation keyframes (inject if not present)
if (!document.getElementById('loader-spin-style')) {
    const style = document.createElement('style');
    style.id = 'loader-spin-style';
    style.innerHTML = `@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
    document.head.appendChild(style);
}

// ============= GENERIC JSON FORMATTER =============
function displayFormattedResult(data, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const container = document.createElement("div");
    container.className = "result-container";
    
    if (data.error) {
        container.innerHTML = `
            <div style="width: 100%; padding: 24px; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 10px;">
                <p style="color: #d32f2f; font-weight: 700; margin: 0;"><strong>⚠️ Error:</strong> ${data.error}</p>
            </div>
        `;
    } else {
        let html = '<div style="width: 100%;">';
        let itemCount = 0;
        
        // Format each key-value pair
        for (let key in data) {
            if (key !== 'graph' && key !== 'image_base64' && key !== 'price' && key !== 'market_price') {
                itemCount++;
                const value = data[key];
                const formattedKey = formatKey(key);
                let displayValue = '';
                
                if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2);
                } else if (typeof value === 'number') {
                    displayValue = value.toFixed(2);
                } else {
                    displayValue = String(value);
                }
                
                html += `
                    <div class="detection-item">
                        <span class="detection-label">${formattedKey}</span>
                        <span class="detection-value">${displayValue}</span>
                    </div>
                `;
            }
        }
        
        if (itemCount === 0) {
            html += '<p style="color: #999; text-align: center; padding: 20px;">No results to display</p>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    element.innerText = "";
    element.appendChild(container);
}

function formatKey(key) {
    return key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function predictLeaf() {
    let file = document.getElementById("leafImage").files[0];
    if (!file) {
        alert("Please select a leaf image");
        return;
    }

    let formData = new FormData();
    formData.append("image", file);

    fetch("/leaf/predict", {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(d => {
        document.getElementById("leafResult").innerText =
            JSON.stringify(d, null, 2);
    })
    .catch(err => alert("Inference error"));
}

// ============= LEAF ANALYSIS FUNCTIONS =============
let video = null;
let canvas = null;
let ctx = null;
let captured = false;
let videoStream = null;

function startCamera() {
    // get fresh elements in case script ran before DOM loaded
    video = document.getElementById("camera");
    canvas = document.getElementById("snapshot");
    ctx = canvas ? canvas.getContext("2d") : null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not supported. Use a modern browser and run this app on HTTPS or localhost.");
        return;
    }

    const constraints = { video: { facingMode: { ideal: "environment" } } };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            videoStream = stream;

            if (!video) {
                alert("Camera element not found on page.");
                stream.getTracks().forEach(t => t.stop());
                videoStream = null;
                return;
            }

            video.srcObject = stream;
            video.style.display = "block";
            // attempt to play the video
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn("Video play failed:", err);
                });
            }

            video.onloadedmetadata = () => {
                if (canvas) {
                    canvas.width = video.videoWidth || canvas.clientWidth;
                    canvas.height = video.videoHeight || canvas.clientHeight;
                }
            };

            // Update start/stop button
            const startBtn = document.getElementById("startCameraBtn");
            if (startBtn) {
                startBtn.textContent = "Stop Camera";
                startBtn.onclick = stopCamera;
            }
        })
        .catch(err => {
            console.error("getUserMedia error:", err);
            if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
                alert("Camera permission denied. Please allow camera access and ensure the app is served over HTTPS.");
            } else if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
                alert("No suitable camera found on this device.");
            } else {
                alert("Camera access failed: " + (err && err.message ? err.message : err));
            }
        });
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    if (video) {
        video.pause();
        video.srcObject = null;
        video.style.display = "none";
    }
    const startBtn = document.getElementById("startCameraBtn");
    if (startBtn) {
        startBtn.textContent = "Start Camera";
        startBtn.onclick = startCamera;
    }
    captured = false;
}

function captureImage() {
    if (!canvas || !ctx) {
        alert("Canvas not initialized");
        return;
    }
    if (!video || !videoStream) {
        alert("Camera not started");
        return;
    }
    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        captured = true;
    } catch (e) {
        alert("Failed to capture from camera: " + (e && e.message ? e.message : e));
    }
}

function analyzeImage() {
    if (!captured) {
        alert("Capture image first");
        return;
    }

    const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];
    inferBase64(base64Image).then(result => {
        displayImageWithBoundingBoxes(result, base64Image);
    }).catch(err => alert("Analysis failed: " + err));
}

function analyzeUploadedImage() {
    const file = document.getElementById("imageUpload").files[0];
    if (!file) {
        alert("Select an image first");
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];
        const result = await inferBase64(base64Image);
        displayImageWithBoundingBoxes(result, base64Image);
    };
    reader.readAsDataURL(file);
}

async function inferBase64(base64Image) {
    // Direct Roboflow API call with proper format
    const response = await fetch(
        "https://serverless.roboflow.com/leaf-disease-f06v7/1?api_key=HfqAqCcq8uzY7qXFsAwB",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: base64Image
        }
    );

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
}

function displayImageWithBoundingBoxes(data, base64Image) {
    // Clear previous results
    const resultContainer = document.getElementById("leafResult");
    resultContainer.innerHTML = "";
    
    // Create image element
    const img = new Image();
    img.onload = () => {
        // Create canvas for result display
        const resultCanvas = document.createElement("canvas");
        const resultCtx = resultCanvas.getContext("2d");
        
        // Set canvas dimensions to match image
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        resultCanvas.style.maxWidth = "100%";
        resultCanvas.style.height = "auto";
        resultCanvas.style.display = "block";
        resultCanvas.style.margin = "24px 0";
        
        // Draw the image
        resultCtx.drawImage(img, 0, 0);
        
        // Draw bounding boxes if predictions exist
        if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
            drawBoundingBoxes(resultCtx, data.predictions);
            resultContainer.appendChild(resultCanvas);
            
            // Show detection results in clean format
            const detectionDiv = document.createElement("div");
            detectionDiv.className = "detection-box detection-success";
            detectionDiv.innerHTML = "<h4 style='margin: 0 0 16px 0; color: #2d6a4f;'>✓ Disease Analysis Results</h4>";
            
            data.predictions.forEach((pred, idx) => {
                const detectionItem = document.createElement("div");
                detectionItem.className = "detection-item";
                detectionItem.style.display = "flex";
                detectionItem.style.justifyContent = "space-between";
                detectionItem.style.alignItems = "center";
                detectionItem.innerHTML = `
                    <div>
                        <span class="detection-label" style="display: block; margin-bottom: 6px;">Disease ${idx + 1}</span>
                        <span class="disease-name">${pred.class}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="confidence">${(pred.confidence * 100).toFixed(1)}% Confidence</span>
                    </div>
                `;
                detectionDiv.appendChild(detectionItem);
            });
            resultContainer.appendChild(detectionDiv);
        } else {
            resultContainer.appendChild(resultCanvas);
            const healthDiv = document.createElement("div");
            healthDiv.className = "detection-box detection-health";
            healthDiv.innerHTML = `
                <h4 style='margin: 0 0 12px 0; color: #2d6a4f;'>✓ Leaf Health Status</h4>
                <div class="detection-item" style="border-left-color: #52b788;">
                    <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <span style="font-size: 24px;">🌱</span>
                        <div>
                            <span class="detection-label" style="display: block;">Status</span>
                            <span style="color: #2d6a4f; font-weight: 700;">Healthy - No Disease Detected</span>
                        </div>
                    </div>
                </div>
            `;
            resultContainer.appendChild(healthDiv);
        }
    };
    
    img.onerror = () => {
        const errorDiv = document.createElement("div");
        errorDiv.className = "detection-box";
        errorDiv.style.borderLeft = "4px solid #d32f2f";
        errorDiv.style.backgroundColor = "#ffebee";
        errorDiv.innerHTML = "<p style='color: #d32f2f; margin: 0; font-weight: 700;'><strong>⚠️ Error:</strong> Failed to load image</p>";
        resultContainer.appendChild(errorDiv);
    };
    
    img.src = "data:image/jpeg;base64," + base64Image;
}

function drawBoundingBoxes(ctx, predictions) {
    predictions.forEach(p => {
        const x = p.x - p.width / 2;
        const y = p.y - p.height / 2;
        const width = p.width;
        const height = p.height;
        
        // Draw bounding box with professional style
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#2d6a4f";
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        const label = `${p.class} • ${(p.confidence * 100).toFixed(1)}%`;
        ctx.font = "bold 14px 'Inter', Arial, sans-serif";
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width + 12;
        const textHeight = 28;
        
        // Position label above box
        const labelY = y > 35 ? y - 8 : y + height + 25;
        const labelX = Math.max(5, x);
        
        // Draw label background
        ctx.fillStyle = "#2d6a4f";
        ctx.fillRect(labelX - 3, labelY - 20, textWidth, textHeight);
        
        // Draw label text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px 'Inter', Arial, sans-serif";
        ctx.fillText(label, labelX + 3, labelY + 2);
    });
}
