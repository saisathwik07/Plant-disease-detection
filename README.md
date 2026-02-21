
# PlantHealthAI - Project Structure

## Overview
**PlantHealthAI** is an AI-powered plant disease detection platform that uses image recognition to identify plant diseases from leaf photographs.

---

## Current Application Structure

### ✅ ACTIVE ROUTES

#### Page Routes (GET)
```
GET /                    → Dashboard (home page)
GET /iot                 → IoT Monitoring page
GET /leaf                → Disease Detection page (image upload/camera)
```

#### API Routes (POST)
```
POST /leaf/predict       → Disease prediction from leaf image
POST /iot/toggle         → IoT simulation toggle
GET  /iot/data           → Get current IoT sensor data
POST /chatbot            → Chat with PlantHealthAI assistant
POST /tts                → Text-to-speech API
```

---

## ❌ REMOVED SECTIONS
- ❌ Data upload/processing (`/data`, `/data/upload`, `/data/url`, `/data/process`)
- ❌ Model training (`/model`, `/analysis/train`, `/analysis/evaluate`, `/analysis/train-all`)
- ❌ Soil analysis (`/soil`, `/analysis/soil`)
- ❌ Micronutrient analysis (`/micronutrient`)
- ❌ Crop prediction form (`/prediction`)
- ❌ All dataset loading and ML model training code

---

## Database

### Leaf Disease Detection Output Format

#### Request
```json
{
  "image": "base64_encoded_image_string"
}
```

#### Response
```json
{
  "predictions": [
    {
      "label": "Early Blight",
      "confidence": 94.56,
      "bbox": {
        "x": 245.5,
        "y": 180.2,
        "width": 120.5,
        "height": 110.3
      }
    },
    {
      "label": "Leaf Spot",
      "confidence": 5.44,
      "bbox": { ... }
    }
  ],
  "image_base64": "encoded_input_image"
}
```

#### Detection Details
- **Model**: Roboflow "leaf-disease-f06v7/1"
- **Predictions**: Array of detected diseases with bounding boxes
- **Confidence**: Percentage (0-100) indicating disease detection certainty
- **BBox**: Pixel coordinates showing where disease is detected on leaf

---

## Disease Detection Features

### How It Works
1. **Image Input**: User captures photo via camera OR uploads leaf image
2. **AI Analysis**: Image sent to Roboflow API for disease detection
3. **Results**: Returns detected plant diseases with confidence scores
4. **Display**: Shows annotations on image with detected diseases

### Supported Input Methods
- 📷 **Live Camera Capture** - Real-time camera feed with capture button
- 📁 **File Upload** - Upload pre-taken photos
- 🎬 **Test Mode** - Test camera functionality

### Accessible Plant Types
The system can detect diseases for:
- Wheat
- Rice  
- Corn
- Potato
- Tomato
- Apple
- Grapes
- Cotton
- And many others via the AI model

---

## Navigation

### Main Menu
```
🔬 PLANT DISEASE DETECTION (Logo/Title)
├── Dashboard      (Home overview)
├── Disease Detection  (AI Leaf Analysis) ← PRIMARY FEATURE
└── IoT Monitoring (Real-time sensor data)
```

### Dashboard Features
- **AI Disease Detection** - Analyze leaf images
- **Image Recognition** - Capture or upload photos
- **Disease Assessment** - Get health reports & treatments
- **IoT Monitoring** - Real-time farm sensor tracking

---

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **CV/ML**: Roboflow API (pre-trained disease detection model)
- **Database**: Firebase (IoT data sync)
- **Chat**: GPT4All (optional local LLM)

### Frontend
- **HTML/CSS**: Responsive design
- **JavaScript**: Real-time camera control, image processing
- **Features**: Browser WebRTC for camera access

### API Integration
```
Roboflow Vision API
├── Model: leaf-disease-f06v7/1
├── Input: Image (JPG/PNG)
├── Output: Disease predictions with bounding boxes
└── Auth: API key (built-in)
```

---

## Core Backend Methods

### Disease Detection
```python
leaf_disease_inference(image_bytes)
  ↓
Returns: {
  "predictions": [ {label, confidence, bbox}, ... ],
  "image_base64": encoded_image
}
```

### IoT Monitoring
```python
toggle_iot()           → Start/stop IoT simulation
fetch_and_store_iot_data()  → Get current sensor readings
                       → Returns: temp, humidity, soil_moisture, nutrients
```

---

## Project Files Summary

### Templates (Active)
- `base.html` - Navigation & page layout
- `dashboard.html` - Home page with features overview
- `leaf.html` - **PRIMARY: Disease detection interface**
- `iot.html` - IoT monitoring dashboard

### Templates (Inactive/Deprecated)
- `data.html` - (Old: data upload)
- `model.html` - (Old: model training)
- `soil.html` - (Old: soil analysis)
- `micronutrient.html` - (Old: micronutrient analysis)
- `prediction.html` - (Old: crop prediction form)

### Application Files
- `app.py` - Flask routes (cleaned up)
- `core_app.py` - Core business logic (disease detection active)
- `tts_api.py` - Text-to-speech service
- `static/js/app.js` - Frontend logic (simplified)
- `static/css/style.css` - Styling

---

## Deployment Status

### Ready for Use ✅
- ✅ Disease detection via leaf images
- ✅ Camera capture functionality
- ✅ IoT sensor data monitoring
- ✅ Chatbot assistant
- ✅ Responsive dashboard

### Removed ❌
- ❌ Dataset management
- ❌ Model training pipeline
- ❌ Manual crop recommendations
- ❌ Soil/micronutrient analysis forms

---

## Next Steps

To deploy:
```bash
# Install dependencies
pip install flask pillow requests firebase-admin gpt4all

# Run application
python app.py

# Access at http://localhost:5000
```

To use:
1. Navigate to "Disease Detection"
2. Click "Start Camera" or upload a leaf image
3. Click "Analyze"
4. View disease predictions with confidence scores
