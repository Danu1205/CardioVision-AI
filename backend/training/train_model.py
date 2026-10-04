
from pathlib import Path
import json
import random
import time

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision.models import resnet18, ResNet18_Weights
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from tqdm import tqdm


# ---------------- CONFIGURATION ----------------

SEED = 42
BATCH_SIZE = 16
EPOCHS = 10
LEARNING_RATE = 0.0001
IMAGE_SIZE = 224

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "dataset" / "processed"
MODEL_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "training" / "results"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cpu")

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

torch.set_num_threads(2)


# ---------------- DATASET ----------------

class CardiacMRIDataset(Dataset):

    def __init__(self, records):
        self.records = records

    def __len__(self):
        return len(self.records)

    def __getitem__(self, index):
        record = self.records[index]

        image_path = BASE_DIR / record["image"]
        image = np.load(image_path).astype(np.float32)

        # Shape: [1, 224, 224] for grayscale ResNet
        image = torch.from_numpy(image).unsqueeze(0)

        label = torch.tensor(
            record["label"],
            dtype=torch.long
        )

        return image, label


# ---------------- MODEL ----------------

def build_model():

    weights = ResNet18_Weights.DEFAULT

    model = resnet18(weights=weights)

    # Adapt pretrained RGB input to grayscale.
    old_conv = model.conv1

    new_conv = nn.Conv2d(
        in_channels=1,
        out_channels=old_conv.out_channels,
        kernel_size=old_conv.kernel_size,
        stride=old_conv.stride,
        padding=old_conv.padding,
        bias=False
    )

    with torch.no_grad():
        new_conv.weight.copy_(
            old_conv.weight.mean(dim=1, keepdim=True)
        )

    model.conv1 = new_conv

    # Freeze feature extractor initially.
    for parameter in model.parameters():
        parameter.requires_grad = False

    model.fc = nn.Linear(
        model.fc.in_features,
        2
    )

    return model


# ---------------- TRAINING ----------------

def train_one_epoch(model, loader, criterion, optimizer):

    model.train()
    running_loss = 0.0

    for images, labels in tqdm(loader, desc="Training", leave=False):

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)

    return running_loss / len(loader.dataset)


# ---------------- EVALUATION ----------------

def evaluate(model, loader, criterion):

    model.eval()

    total_loss = 0.0
    all_labels = []
    all_predictions = []

    with torch.no_grad():

        for images, labels in loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)
            loss = criterion(outputs, labels)

            predictions = outputs.argmax(dim=1)

            total_loss += loss.item() * images.size(0)

            all_labels.extend(labels.cpu().numpy())
            all_predictions.extend(predictions.cpu().numpy())

    metrics = {
        "loss": total_loss / len(loader.dataset),
        "accuracy": accuracy_score(all_labels, all_predictions),
        "precision": precision_score(
            all_labels, all_predictions, zero_division=0
        ),
        "recall": recall_score(
            all_labels, all_predictions, zero_division=0
        ),
        "f1_score": f1_score(
            all_labels, all_predictions, zero_division=0
        ),
        "confusion_matrix": confusion_matrix(
            all_labels, all_predictions
        ).tolist()
    }

    return metrics


# ---------------- MAIN ----------------

def main():

    print("Loading dataset manifest...")

    with open(DATA_DIR / "manifest.json", encoding="utf-8") as file:
        records = json.load(file)

    labels = [record["label"] for record in records]

    # Image-level stratified split.
    train_records, temporary_records = train_test_split(
        records,
        test_size=0.30,
        random_state=SEED,
        stratify=labels
    )

    temporary_labels = [
        record["label"] for record in temporary_records
    ]

    val_records, test_records = train_test_split(
        temporary_records,
        test_size=0.50,
        random_state=SEED,
        stratify=temporary_labels
    )

    print("Training images:", len(train_records))
    print("Validation images:", len(val_records))
    print("Test images:", len(test_records))

    train_loader = DataLoader(
        CardiacMRIDataset(train_records),
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0
    )

    val_loader = DataLoader(
        CardiacMRIDataset(val_records),
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0
    )

    test_loader = DataLoader(
        CardiacMRIDataset(test_records),
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0
    )

    print("\nLoading pretrained ResNet18...")
    print("Internet may be required for pretrained weights.")

    model = build_model().to(DEVICE)

    # Class-weighted loss.
    train_labels = [
        record["label"] for record in train_records
    ]

    counts = np.bincount(train_labels, minlength=2)

    class_weights = len(train_labels) / (
        2.0 * counts
    )

    weights_tensor = torch.tensor(
        class_weights,
        dtype=torch.float32
    ).to(DEVICE)

    criterion = nn.CrossEntropyLoss(
        weight=weights_tensor
    )

    optimizer = torch.optim.Adam(
        filter(
            lambda parameter: parameter.requires_grad,
            model.parameters()
        ),
        lr=LEARNING_RATE
    )

    best_val_f1 = -1.0
    history = []

    print("\nStarting training...")

    start_time = time.time()

    for epoch in range(EPOCHS):

        print(f"\nEpoch {epoch + 1}/{EPOCHS}")

        train_loss = train_one_epoch(
            model,
            train_loader,
            criterion,
            optimizer
        )

        val_metrics = evaluate(
            model,
            val_loader,
            criterion
        )

        epoch_result = {
            "epoch": epoch + 1,
            "train_loss": train_loss,
            "validation": val_metrics
        }

        history.append(epoch_result)

        print(f"Training loss: {train_loss:.4f}")
        print(f"Validation loss: {val_metrics['loss']:.4f}")
        print(f"Validation accuracy: {val_metrics['accuracy']:.4f}")
        print(f"Validation F1: {val_metrics['f1_score']:.4f}")

        if val_metrics["f1_score"] > best_val_f1:

            best_val_f1 = val_metrics["f1_score"]

            torch.save(
                model.state_dict(),
                MODEL_DIR / "best_model.pth"
            )

            print("Saved best model.")

    print("\nLoading best model for test evaluation...")

    model.load_state_dict(
        torch.load(
            MODEL_DIR / "best_model.pth",
            map_location=DEVICE,
            weights_only=True
        )
    )

    test_metrics = evaluate(
        model,
        test_loader,
        criterion
    )

    test_labels = [
        record["label"] for record in test_records
    ]

    test_predictions = []

    model.eval()

    with torch.no_grad():
        for images, _ in test_loader:
            outputs = model(images.to(DEVICE))
            test_predictions.extend(
                outputs.argmax(dim=1).cpu().numpy()
            )

    report = classification_report(
        test_labels,
        test_predictions,
        target_names=["Normal", "Abnormal"],
        output_dict=True,
        zero_division=0
    )

    results = {
        "architecture": "ResNet18",
        "pretrained": True,
        "input": "224x224 grayscale",
        "device": str(DEVICE),
        "epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "learning_rate": LEARNING_RATE,
        "split_type": "stratified image-level",
        "patient_level_independence_verified": False,
        "split_counts": {
            "train": len(train_records),
            "validation": len(val_records),
            "test": len(test_records)
        },
        "test_metrics": test_metrics,
        "classification_report": report,
        "training_history": history,
        "training_time_seconds": round(
            time.time() - start_time, 2
        )
    }

    with open(
        RESULTS_DIR / "evaluation.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(results, file, indent=2)

    print("\n========== FINAL TEST RESULTS ==========")
    print(json.dumps(test_metrics, indent=2))
    print("\nClassification report:")
    print(
        classification_report(
            test_labels,
            test_predictions,
            target_names=["Normal", "Abnormal"],
            zero_division=0
        )
    )
    print("Model:", MODEL_DIR / "best_model.pth")
    print("Results:", RESULTS_DIR / "evaluation.json")
    print("========================================")


if __name__ == "__main__":
    main()