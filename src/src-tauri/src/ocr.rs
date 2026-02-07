//! Tesseract OCR integration via system CLI.
//!
//! Detects Tesseract installation at runtime, extracts embedded images
//! from scanned PDFs, and OCRs them. Also handles direct image files.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;

/// Check common Windows install paths for Tesseract
fn find_tesseract() -> Option<PathBuf> {
    let candidates = [
        PathBuf::from(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
        PathBuf::from(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
    ];

    // Check known paths first (faster than spawning a process)
    for path in &candidates {
        if path.exists() {
            return Some(path.clone());
        }
    }

    // Also check if it's on PATH
    if let Ok(output) = Command::new("tesseract").arg("--version").output() {
        if output.status.success() {
            return Some(PathBuf::from("tesseract"));
        }
    }

    None
}

/// Run Tesseract OCR on an image file and return the extracted text
fn run_tesseract(tesseract_path: &Path, image_path: &Path) -> Result<String, String> {
    let output_base = image_path.with_extension("ocr_out");

    let result = Command::new(tesseract_path)
        .arg(image_path)
        .arg(&output_base)
        .arg("-l")
        .arg("eng")
        .output()
        .map_err(|e| format!("Failed to run Tesseract: {}", e))?;

    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!("Tesseract failed: {}", stderr));
    }

    // Tesseract writes output to {output_base}.txt
    let txt_path = output_base.with_extension("txt");
    let text = fs::read_to_string(&txt_path)
        .map_err(|e| format!("Could not read Tesseract output: {}", e))?;

    // Clean up the output file
    let _ = fs::remove_file(&txt_path);

    Ok(text.trim().to_string())
}

/// OCR a direct image file (jpg, png, bmp, tiff, gif)
pub fn ocr_image_file(image_path: &Path) -> Result<String, String> {
    let tesseract = find_tesseract().ok_or_else(|| {
        "Tesseract OCR is not installed. To extract text from scanned documents and images, \
         install Tesseract from https://github.com/UB-Mannheim/tesseract/wiki — \
         CaseKit will detect it automatically."
            .to_string()
    })?;

    run_tesseract(&tesseract, image_path)
}

/// Extract embedded images from a scanned PDF using lopdf, OCR each, and combine
pub fn ocr_scanned_pdf(pdf_path: &Path) -> Result<String, String> {
    let tesseract = find_tesseract().ok_or_else(|| {
        "Tesseract OCR is not installed. To extract text from scanned PDFs, \
         install Tesseract from https://github.com/UB-Mannheim/tesseract/wiki — \
         CaseKit will detect it automatically."
            .to_string()
    })?;

    let doc = lopdf::Document::load(pdf_path)
        .map_err(|e| format!("Could not load PDF for image extraction: {}", e))?;

    let mut all_text = Vec::new();
    let temp_dir = std::env::temp_dir().join("casekit_ocr");
    let _ = fs::create_dir_all(&temp_dir);

    let mut image_count: u32 = 0;

    // Iterate through all objects looking for image XObjects with JPEG data
    for (&obj_id, object) in doc.objects.iter() {
        // Only look at stream objects
        let stream = match object {
            lopdf::Object::Stream(ref s) => s,
            _ => continue,
        };

        let dict = &stream.dict;

        // Check if this is an image XObject
        let is_image = dict
            .get(b"Subtype")
            .ok()
            .and_then(|v| v.as_name().ok())
            .map(|n| n == b"Image")
            .unwrap_or(false);

        if !is_image {
            continue;
        }

        // Get the filter to determine image format
        let filter_name = dict
            .get(b"Filter")
            .ok()
            .and_then(|v| v.as_name().ok());

        let extension = match filter_name {
            Some(f) if f == b"DCTDecode" => "jpg",    // JPEG data
            Some(f) if f == b"JPXDecode" => "jp2",    // JPEG 2000
            _ => continue,                             // Skip FlateDecode, CCITTFaxDecode, etc.
        };

        // For DCTDecode, the raw stream content IS a complete JPEG file
        let data = &stream.content;
        if data.is_empty() {
            continue;
        }

        // Write image to temp file
        let img_path = temp_dir.join(format!("scan_{}_{}.{}", obj_id.0, image_count, extension));
        if fs::write(&img_path, data).is_err() {
            continue;
        }

        // OCR the image
        if let Ok(text) = run_tesseract(&tesseract, &img_path) {
            if !text.is_empty() {
                all_text.push(text);
            }
        }

        // Clean up temp image
        let _ = fs::remove_file(&img_path);
        image_count += 1;
    }

    // Clean up temp directory (only if empty)
    let _ = fs::remove_dir(&temp_dir);

    if all_text.is_empty() && image_count == 0 {
        return Err("No images found in scanned PDF to OCR.".to_string());
    }

    if all_text.is_empty() {
        return Err("OCR ran on images but no text was recognised.".to_string());
    }

    Ok(all_text.join("\n\n---\n\n"))
}

/// Check if Tesseract is available on this system
pub fn is_tesseract_available() -> bool {
    find_tesseract().is_some()
}
