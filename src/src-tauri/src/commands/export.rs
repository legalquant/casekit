use crate::path_safety::{safe_case_path, validate_relative_path};
use std::fs;
use std::io::Write;
use std::path::PathBuf;

#[tauri::command]
pub fn export_bundle(
    case_name: String,
    document_paths: Vec<String>,
    export_path: String,
) -> Result<String, String> {
    let case_path = safe_case_path(&case_name)?;
    let export_file = PathBuf::from(&export_path);

    let file = fs::File::create(&export_file)
        .map_err(|e| format!("Could not create export file: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);

    let options: zip::write::FileOptions<'_, ()> = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for doc_rel_path in &document_paths {
        // Validate each document path stays within the case directory
        let full_path = validate_relative_path(&case_path, doc_rel_path)?;

        if !full_path.exists() {
            continue;
        }

        // Determine bundle folder based on source folder
        let bundle_folder = if doc_rel_path.starts_with("01_") {
            "D_Correspondence"
        } else if doc_rel_path.starts_with("02_") {
            "E_Evidence"
        } else if doc_rel_path.starts_with("03_") {
            "A_Claim"
        } else if doc_rel_path.starts_with("04_") {
            "C_Orders"
        } else {
            "E_Evidence"
        };

        let filename = full_path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let zip_path = format!("Bundle/{}/{}", bundle_folder, filename);

        zip.start_file(&zip_path, options.clone())
            .map_err(|e| format!("Could not add file to bundle: {}", e))?;

        let content = fs::read(&full_path)
            .map_err(|e| format!("Could not read {}: {}", doc_rel_path, e))?;
        zip.write_all(&content)
            .map_err(|e| format!("Could not write to bundle: {}", e))?;
    }

    zip.finish()
        .map_err(|e| format!("Could not finalise bundle: {}", e))?;

    Ok(export_file.to_string_lossy().to_string())
}
