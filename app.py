from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import joblib
import numpy as np
import cv2
import io
from PIL import Image

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
try:
    model = joblib.load('model.pkl')
except:
    model = None

def preprocess_image(image_bytes):
    # Convert bytes to PIL Image
    img = Image.open(io.BytesIO(image_bytes)).convert('L')
    # Resize to match training size
    img = img.resize((128, 128))
    # Convert to numpy array and flatten
    img_array = np.array(img).flatten() / 255.0
    return img_array.reshape(1, -1)


from fastapi.responses import JSONResponse

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return JSONResponse({"message": "Signature Verification API is running"})

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded. Please train the model first."}
    
    contents = await file.read()
    processed_img = preprocess_image(contents)
    
    prediction = model.predict(processed_img)[0]
    probabilities = model.predict_proba(processed_img)[0]
    confidence = float(np.max(probabilities))
    
    return {
        "prediction": prediction,
        "confidence": confidence
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
