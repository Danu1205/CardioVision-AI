from pathlib import Path
import warnings

import nibabel as nib
import numpy as np
import pydicom
from PIL import Image


def validate_mri_file(file_path: str, original_filename: str) -> dict:
    """
    Validate file readability and basic imaging properties.
    This does not verify cardiac anatomy or diagnose myocarditis.
    """
    path = Path(file_path)
    name = original_filename.lower()

    if not path.exists() or path.stat().st_size == 0:
        raise ValueError("The uploaded file is empty or unavailable.")

    if name.endswith((".nii", ".nii.gz")):
        image = nib.load(str(path))
        shape = tuple(int(value) for value in image.shape)

        if len(shape) not in (2, 3, 4) or any(value <= 0 for value in shape):
            raise ValueError("Unsupported NIfTI image dimensions.")

        voxel_count = int(np.prod(shape))
        if voxel_count > 30_000_000:
            raise ValueError("NIfTI image exceeds the validation voxel limit.")

        data = np.asanyarray(image.dataobj)
        if not np.isfinite(data).all():
            raise ValueError("NIfTI image contains invalid voxel values.")

        return {
            "validation_status": "FORMAT_VALIDATED_NOT_ANATOMY_VERIFIED",
            "format": "NIfTI",
            "modality": "Not established by file validation",
            "dimensions": list(shape),
            "anatomy_verified": False,
            "message": "NIfTI structure and voxel data are readable. Cardiac anatomy is not verified."
        }

    if name.endswith(".dcm"):
        dataset = pydicom.dcmread(str(path), force=False)

        modality = str(getattr(dataset, "Modality", "")).upper()
        if modality and modality != "MR":
            raise ValueError(f"Expected MR imaging, but DICOM modality is {modality}.")

        if not hasattr(dataset, "PixelData"):
            raise ValueError("DICOM file does not contain image pixel data.")

        pixels = dataset.pixel_array

        if pixels.ndim not in (2, 3) or pixels.size == 0:
            raise ValueError("Unsupported DICOM pixel dimensions.")

        if not np.isfinite(pixels).all():
            raise ValueError("DICOM image contains invalid pixel values.")

        return {
            "validation_status": "FORMAT_VALIDATED_NOT_ANATOMY_VERIFIED",
            "format": "DICOM",
            "modality": modality or "Not specified",
            "dimensions": list(pixels.shape),
            "anatomy_verified": False,
            "message": "DICOM structure and pixel data are readable. Cardiac anatomy is not verified."
        }

    if name.endswith((".jpg", ".jpeg", ".png")):
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)

            with Image.open(path) as image:
                image.verify()

            with Image.open(path) as image:
                image.load()
                width, height = image.size

                if width <= 0 or height <= 0:
                    raise ValueError("Invalid image dimensions.")

                if width * height > 40_000_000:
                    raise ValueError("Image exceeds the validation pixel limit.")

                image_format = image.format
                image_mode = image.mode

        return {
            "validation_status": "FORMAT_VALIDATED_NOT_ANATOMY_VERIFIED",
            "format": image_format,
            "modality": "Not established by raster image",
            "dimensions": [height, width],
            "image_mode": image_mode,
            "anatomy_verified": False,
            "message": "Image file is readable. Cardiac MRI identity and anatomy are not verified."
        }

    raise ValueError("Unsupported format. Use DICOM, NIfTI, JPG or PNG.")
