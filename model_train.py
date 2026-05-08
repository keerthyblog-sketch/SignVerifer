import joblib
import numpy as np
import os
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import cv2

def extract_features(image_path):
    # Load image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    # Resize to a fixed size
    img = cv2.resize(img, (128, 128))
    # Simple feature extraction: Flatten the image (or use HOG)
    # Using HOG would be better but requires more code. Let's do simple flattening for this example.
    return img.flatten() / 255.0

def train_model(data_dir):
    features = []
    labels = []
    
    # Expecting data_dir/genuine and data_dir/forged
    for label in ['genuine', 'forged']:
        path = os.path.join(data_dir, label)
        if not os.path.exists(path):
            continue
        for img_name in os.listdir(path):
            img_path = os.path.join(path, img_name)
            feat = extract_features(img_path)
            if feat is not None:
                features.append(feat)
                labels.append(label)
                
    if not features:
        print("No data found to train.")
        return

    X = np.array(features)
    y = np.array(labels)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Using SVM with RBF kernel - good for signature patterns
    model = SVC(probability=True)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
    
    # Save the model
    joblib.dump(model, 'model.pkl')
    print("Model saved as model.pkl")

if __name__ == "__main__":
    # Example usage:
    train_model('dataset')
    print("This is a template for training. Please provide a dataset directory.")
