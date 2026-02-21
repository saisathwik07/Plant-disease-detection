# gTTS TTS route for chatbot
from flask import request, send_file, jsonify, Blueprint
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    gTTS = None
import io

tts_api = Blueprint('tts_api', __name__)

@tts_api.route('/tts', methods=['POST'])
def tts():
    if not GTTS_AVAILABLE:
        return jsonify({'error': 'TTS feature not available. Install gtts: pip install gtts'}), 503
    
    data = request.get_json()
    text = data.get('text', '')
    lang = data.get('lang', 'te')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    try:
        tts_obj = gTTS(text, lang=lang)
        fp = io.BytesIO()
        tts_obj.write_to_fp(fp)
        fp.seek(0)
        return send_file(fp, mimetype='audio/mpeg')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
