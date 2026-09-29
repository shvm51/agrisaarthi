"""STUB inference for the SIH demo — returns a plausible result.

Replace StubDiseaseModel with a trained DiseaseModel (MobileNet/EfficientNet/
ResNet backbone) loaded from weights; the router contract stays identical.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.disease_detection.model import DiseaseModel  # noqa: E402


class StubDiseaseModel(DiseaseModel):
    """Demo stub: simulates a trained classifier output."""

    model_version = "v1"

    def predict(self, image) -> dict:
        # TODO: replace with real model inference (torch / tf).
        return {
            "disease": "Tomato Early Blight",
            "confidence": 0.92,
            "severity": "SEVERE",  # MILD | MODERATE | SEVERE
            "model_version": self.model_version,
        }


def get_model() -> DiseaseModel:
    return StubDiseaseModel()


if __name__ == "__main__":
    model = get_model()
    pred = model.predict(None)
    assert pred["disease"] == "Tomato Early Blight"
    assert model.confidence(pred) == 0.92
    assert model.severity(pred) == "SEVERE"
    assert pred["model_version"] == "v1"
    print("OK: disease inference stub returns plausible demo result")
