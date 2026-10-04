
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np
import json
from collections import Counter

# Project directories
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "dataset" / "raw"
OUTPUT_DIR = BASE_DIR / "dataset" / "processed"

# Image configuration
IMAGE_SIZE = (224, 224)
CLASSES = {
    "Normal": 0,
    "Abnormal": 1
}

def preprocess_image(image_path):
    """Load, resize and normalize one grayscale image."""

    with Image.open(image_path) as img:
        img = ImageOps.grayscale(img)
        img = img.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)

        image_array = np.asarray(img, dtype=np.float32) / 255.0

    return image_array


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    records = []
    errors = []
    class_counts = Counter()

    for class_name, label in CLASSES.items():
        class_dir = RAW_DIR / class_name

        if not class_dir.exists():
            raise FileNotFoundError(
                f"Missing dataset folder: {class_dir}"
            )

        image_files = sorted(
            list(class_dir.rglob("*.jpg")) +
            list(class_dir.rglob("*.jpeg")) +
            list(class_dir.rglob("*.png"))
        )

        print(f"\nProcessing {class_name}: {len(image_files)} images")

        for index, image_path in enumerate(image_files, start=1):
            try:
                image_array = preprocess_image(image_path)

                # Preserve a separate output folder for each class
                output_class_dir = OUTPUT_DIR / class_name
                output_class_dir.mkdir(parents=True, exist_ok=True)

                output_name = f"{image_path.stem}.npy"
                output_path = output_class_dir / output_name

                np.save(output_path, image_array)

                records.append({
                    "image": str(
                        output_path.relative_to(BASE_DIR)
                    ).replace("\\", "/"),
                    "label": label,
                    "class": class_name,
                    "original_filename": image_path.name
                })

                class_counts[class_name] += 1

                if index % 200 == 0:
                    print(f"  Processed {index}/{len(image_files)}")

            except Exception as error:
                errors.append({
                    "file": str(image_path),
                    "error": str(error)
                })

        print(f"Completed {class_name}")

    # Save dataset index
    manifest_path = OUTPUT_DIR / "manifest.json"

    with open(manifest_path, "w", encoding="utf-8") as file:
        json.dump(records, file, indent=2)

    # Save preprocessing summary
    summary = {
        "image_size": list(IMAGE_SIZE),
        "image_mode": "grayscale",
        "normalization": "pixel_values_divided_by_255",
        "classes": CLASSES,
        "processed_counts": dict(class_counts),
        "total_processed": len(records),
        "errors": len(errors),
        "patient_level_split_verified": False,
        "warning": (
            "Image-level preprocessing only. "
            "Patient-level independence has not been established."
        )
    }

    with open(
        OUTPUT_DIR / "preprocessing_summary.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(summary, file, indent=2)

    if errors:
        with open(
            OUTPUT_DIR / "errors.json",
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(errors, file, indent=2)

    print("\n========== PREPROCESSING SUMMARY ==========")
    print("Normal processed:", class_counts["Normal"])
    print("Abnormal processed:", class_counts["Abnormal"])
    print("Total processed:", len(records))
    print("Errors:", len(errors))
    print("Output:", OUTPUT_DIR)
    print("===========================================")


if __name__ == "__main__":
    main()