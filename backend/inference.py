from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best_model.pth"

DEVICE = torch.device("cpu")
CLASS_NAMES = ["Normal", "Abnormal"]

preprocess = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {MODEL_PATH}")

    model = models.resnet18(weights=None)
    original_conv = model.conv1

    model.conv1 = nn.Conv2d(
        1,
        original_conv.out_channels,
        kernel_size=original_conv.kernel_size,
        stride=original_conv.stride,
        padding=original_conv.padding,
        bias=False,
    )

    model.fc = nn.Linear(model.fc.in_features, 2)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True,
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        checkpoint = checkpoint["model_state_dict"]

    model.load_state_dict(checkpoint)
    model.to(DEVICE)
    model.eval()

    return model

model = load_model()

def predict_image(image_path: str):
    try:
        with Image.open(image_path) as image:
            image = image.convert("RGB")
            tensor = preprocess(image).unsqueeze(0).to(DEVICE)
    except (OSError, UnidentifiedImageError, ValueError) as exc:
        raise ValueError("Unable to read this image for prediction.") from exc

    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    predicted_index = int(torch.argmax(probabilities).item())

    return {
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": round(float(probabilities[predicted_index].item()) * 100, 2),
        "probabilities": {
            CLASS_NAMES[index]: round(float(probabilities[index].item()) * 100, 2)
            for index in range(len(CLASS_NAMES))
        },
        "model": "ResNet18",
        "clinical_status": "Research prototype; not for clinical diagnosis",
    }
