use crate::path_safety::{safe_case_path, sanitise_path_component, validate_relative_path};
use crate::models::document::DocumentEntry;
use crate::extraction::ExtractedContent;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Result from copying a file to a case — includes extracted text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopyResult {
    pub relative_path: String,
    pub extracted: Option<ExtractedContent>,
}

fn get_case_path(case_name: &str) -> Result<PathBuf, String> {
    safe_case_path(case_name)
}

fn load_docs_index(case_name: &str) -> Result<Vec<DocumentEntry>, String> {
    let case_path = get_case_path(case_name)?;
    let index_path = case_path.join(".casekit").join("documents.json");

    if !index_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&index_path)
        .map_err(|e| format!("Could not read documents.json: {}", e))?;
    let docs: Vec<DocumentEntry> = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse documents.json: {}", e))?;
    Ok(docs)
}

#[tauri::command]
pub fn load_documents_index(case_name: String) -> Result<Vec<DocumentEntry>, String> {
    load_docs_index(&case_name)
}

fn save_documents_index(case_name: &str, docs: &[DocumentEntry]) -> Result<(), String> {
    let case_path = get_case_path(case_name)?;
    let index_path = case_path.join(".casekit").join("documents.json");

    let json = serde_json::to_string_pretty(docs)
        .map_err(|e| format!("Could not serialise documents index: {}", e))?;
    fs::write(&index_path, &json)
        .map_err(|e| format!("Could not write documents.json: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn copy_file_to_case(
    case_name: String,
    source_path: String,
    folder: String,
    filename: String,
) -> Result<CopyResult, String> {
    let case_path = get_case_path(&case_name)?;

    // Sanitise the filename to prevent path traversal
    let safe_filename = sanitise_path_component(&filename, "Filename")?;

    let folder_name = match folder.as_str() {
        "01" => "01_Correspondence",
        "02" => "02_Evidence",
        "03" => "03_Legal",
        "04" => "04_Court",
        "05" => "05_Bundle",
        _ => return Err(format!("Invalid folder number: {}", folder)),
    };

    let dest_dir = case_path.join(folder_name);
    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Could not create folder {}: {}", folder_name, e))?;

    let dest_path = dest_dir.join(&safe_filename);
    fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Could not copy file to {}: {}", dest_path.display(), e))?;

    let relative_path = format!("{}/{}", folder_name, safe_filename);

    // Auto-extract text from the copied file
    let extracted = crate::extraction::extract_from_file(&dest_path).ok();

    Ok(CopyResult {
        relative_path,
        extracted,
    })
}

#[tauri::command]
pub fn list_case_files(case_name: String) -> Result<Vec<String>, String> {
    let case_path = get_case_path(&case_name)?;
    let mut files = Vec::new();

    let folders = ["01_Correspondence", "02_Evidence", "03_Legal", "04_Court", "05_Bundle"];

    for folder in &folders {
        let folder_path = case_path.join(folder);
        if folder_path.exists() {
            let entries = fs::read_dir(&folder_path)
                .map_err(|e| format!("Could not read {}: {}", folder, e))?;
            for entry in entries {
                let entry = entry.map_err(|e| format!("Could not read entry: {}", e))?;
                if entry.path().is_file() {
                    let relative = format!("{}/{}", folder, entry.file_name().to_string_lossy());
                    files.push(relative);
                }
            }
        }
    }

    Ok(files)
}

#[tauri::command]
pub fn read_file_text(case_name: String, relative_path: String) -> Result<String, String> {
    let case_path = get_case_path(&case_name)?;

    // Validate relative path stays within case directory
    let file_path = validate_relative_path(&case_path, &relative_path)?;

    if !file_path.exists() {
        return Err(format!("File not found: {}", relative_path));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Could not read file {}: {}", relative_path, e))?;
    Ok(content)
}

#[tauri::command]
pub fn add_document_metadata(case_name: String, document: DocumentEntry) -> Result<Vec<DocumentEntry>, String> {
    let mut docs = load_docs_index(&case_name)?;
    docs.push(document);
    save_documents_index(&case_name, &docs)?;
    Ok(docs)
}

#[tauri::command]
pub fn remove_document_metadata(case_name: String, document_id: String) -> Result<Vec<DocumentEntry>, String> {
    let docs = load_docs_index(&case_name)?;
    let filtered: Vec<DocumentEntry> = docs.into_iter().filter(|d| d.id != document_id).collect();
    save_documents_index(&case_name, &filtered)?;
    Ok(filtered)
}

/// Extract text from any file path (for drag-and-drop / file picker on Citation Audit).
/// Uses the same extraction engine as document upload (PDF, DOCX, EML, TXT, images).
#[tauri::command]
pub fn extract_text_from_path(path: String) -> Result<ExtractedContent, String> {
    let file_path = std::path::PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }
    crate::extraction::extract_from_file(&file_path)
}
