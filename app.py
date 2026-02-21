from flask import Flask, render_template, request, jsonify
from core_app import SoilAnalysisCore
import base64

# GPT4All chatbot import (optional)
try:
    from gpt4all import GPT4All
    GPTALL_AVAILABLE = True
except ImportError:
    GPTALL_AVAILABLE = False
    GPT4All = None

import threading
gpt4all_lock = threading.Lock()
gpt_model = None
def get_gpt_model():
    global gpt_model
    if not GPTALL_AVAILABLE:
        return None
    if gpt_model is None:
        # Use the smallest model for low memory (update filename as needed)
        gpt_model = GPT4All("orca-mini-3b-gguf2-q4_0.gguf")
    return gpt_model


from tts_api import tts_api
app = Flask(__name__)
app.register_blueprint(tts_api)
core = SoilAnalysisCore()

# ================= PAGE ROUTES (GET) =================

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

@app.route("/leaf")
def leaf_page():
    return render_template("leaf.html")

# ================= ACTION ROUTES (POST / API) =================

@app.route("/leaf/predict", methods=["POST"])
def leaf_predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        image_base64 = data.get("image")
        if not image_base64:
            return jsonify({"error": "No image data in request"}), 400

        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        result = core.leaf_disease_inference(image_bytes)
        result["image_base64"] = image_base64  # Include image for display
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

# ================= CHATBOT ROUTE ================
@app.route("/chatbot", methods=["POST"])
def chatbot():
    if not GPTALL_AVAILABLE:
        return jsonify({"response": "Chatbot feature not available. Install gpt4all: pip install gpt4all"}), 503
    
    data = request.get_json()
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"response": "Please enter a message."}), 400
    try:
        with gpt4all_lock:
            model = get_gpt_model()
            with model.chat_session():
                response = model.generate(user_message, max_tokens=128, temp=0.7)
        return jsonify({"response": response.strip()}), 200
    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)