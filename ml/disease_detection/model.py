"""DiseaseModel abstraction — keep the model replaceable.

Concrete implementations (MobileNet / EfficientNet / ResNet backbones, trained
weights) plug in here without touching routers or services.
"""
from abc import ABC, abstractmethod
from typing import Any


class DiseaseModel(ABC):
    model_version: str = "v1"

    @abstractmethod
    def predict(self, image: Any) -> dict[str, Any]:
        """Return {'disease': str, 'confidence': float, 'severity': str|None}."""

    def confidence(self, prediction: dict[str, Any]) -> float:
        return float(prediction.get("confidence", 0.0))

    def severity(self, prediction: dict[str, Any]) -> str | None:
        return prediction.get("severity")
