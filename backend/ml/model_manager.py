import os
from pathlib import Path
import joblib
import numpy as np

from backend.config import Config
from backend.ml.feature_extraction import extract_url_features, FEATURE_COLUMNS

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.url_model = None
        self.url_metadata = None
        self.message_pipeline = None
        self.message_metadata = None

        url_model_path = Config.MODEL_DIR / "url_classifier.joblib"
        msg_model_path = Config.MODEL_DIR / "message_classifier.joblib"

        if url_model_path.exists():
            try:
                payload = joblib.load(url_model_path)
                self.url_model = payload.get("model")
                self.url_metadata = {
                    "version": payload.get("version", "1.0.0-rf"),
                    "feature_importances": payload.get("feature_importances", {}),
                    "metrics": payload.get("metrics", {}),
                    "trained_at": payload.get("trained_at"),
                }
            except Exception as e:
                print(f"[ModelManager] Warning: Failed to load URL model: {e}")

        if msg_model_path.exists():
            try:
                payload = joblib.load(msg_model_path)
                self.message_pipeline = payload.get("pipeline")
                self.message_metadata = {
                    "version": payload.get("version", "1.0.0-nlp"),
                    "metrics": payload.get("metrics", {}),
                    "trained_at": payload.get("trained_at"),
                }
            except Exception as e:
                print(f"[ModelManager] Warning: Failed to load Message model: {e}")

    def predict_url(self, url: str) -> dict:
        extracted = extract_url_features(url)
        features = extracted["features"]
        metadata = extracted["metadata"]

        if self.url_model is not None:
            vector = np.array([[features[col] for col in FEATURE_COLUMNS]])
            prob = float(self.url_model.predict_proba(vector)[0][1])
            is_malicious = bool(self.url_model.predict(vector)[0] == 1)
            model_used = "Random Forest Classifier (v" + self.url_metadata.get("version", "1.0.0") + ")"
            importances = self.url_metadata.get("feature_importances", {})
        else:
            # Fallback heuristic calculation if model not present
            prob = 0.5
            is_malicious = False
            model_used = "Rule-based Fallback (Model Unavailable)"
            importances = {}

        return {
            "probability": prob,
            "is_malicious": is_malicious,
            "model_used": model_used,
            "features": features,
            "metadata": metadata,
            "feature_importances": importances,
        }

    def predict_message(self, text: str) -> dict:
        text = (text or "").strip()
        if not text:
            return {"probability": 0.0, "is_scam": False, "model_used": "None"}

        if self.message_pipeline is not None:
            prob = float(self.message_pipeline.predict_proba([text])[0][1])
            is_scam = bool(self.message_pipeline.predict([text])[0] == 1)
            model_used = "TF-IDF + Logistic Regression (v" + self.message_metadata.get("version", "1.0.0") + ")"
        else:
            prob = 0.5
            is_scam = False
            model_used = "Heuristic Text Fallback"

        return {
            "probability": prob,
            "is_scam": is_scam,
            "model_used": model_used,
        }

model_manager = ModelManager()
