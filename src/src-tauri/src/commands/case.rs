use crate::path_safety::safe_case_path;
use crate::models::case::CaseMetadata;
use std::fs;
use std::path::PathBuf;

const CASE_FOLDERS: &[&str] = &[
    "01_Correspondence",
    "02_Evidence",
    "03_Legal",
    "04_Court",
    "05_Bundle",
    ".casekit",
];

fn get_case_path(case_name: &str) -> Result<PathBuf, String> {
    safe_case_path(case_name)
}

#[tauri::command]
pub fn create_case(name: String, claimant_name: String, defendant_name: String, user_role: String) -> Result<CaseMetadata, String> {
    let case_dir = get_case_path(&name)?;

    if case_dir.exists() {
        return Err(format!("A case named '{}' already exists", name));
    }

    // Create directory structure
    for folder in CASE_FOLDERS {
        fs::create_dir_all(case_dir.join(folder))
            .map_err(|e| format!("Could not create folder {}: {}", folder, e))?;
    }

    // Create case metadata
    let mut metadata = CaseMetadata::default();
    metadata.name = name;
    metadata.claimant_name = claimant_name;
    metadata.defendant_name = defendant_name;
    metadata.user_role = match user_role.as_str() {
        "defendant" => crate::models::case::UserRole::Defendant,
        _ => crate::models::case::UserRole::Claimant,
    };

    // Write case.json
    let case_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Could not serialise case metadata: {}", e))?;
    fs::write(case_dir.join(".casekit").join("case.json"), &case_json)
        .map_err(|e| format!("Could not write case.json: {}", e))?;

    // Create empty documents.json
    fs::write(case_dir.join(".casekit").join("documents.json"), "[]")
        .map_err(|e| format!("Could not write documents.json: {}", e))?;

    // Create empty chronology.json
    fs::write(case_dir.join(".casekit").join("chronology.json"), "[]")
        .map_err(|e| format!("Could not write chronology.json: {}", e))?;

    // Create empty ai-history.json
    fs::write(case_dir.join(".casekit").join("ai-history.json"), "[]")
        .map_err(|e| format!("Could not write ai-history.json: {}", e))?;

    Ok(metadata)
}

#[tauri::command]
pub fn list_cases() -> Result<Vec<CaseMetadata>, String> {
    let base = crate::path_safety::casekit_base()?;

    if !base.exists() {
        return Ok(Vec::new());
    }

    let mut cases = Vec::new();
    let entries = fs::read_dir(&base)
        .map_err(|e| format!("Could not read CaseKit directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Could not read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            let case_file = path.join(".casekit").join("case.json");
            if case_file.exists() {
                let content = fs::read_to_string(&case_file)
                    .map_err(|e| format!("Could not read {}: {}", case_file.display(), e))?;
                let metadata: CaseMetadata = serde_json::from_str(&content)
                    .map_err(|e| format!("Could not parse {}: {}", case_file.display(), e))?;
                cases.push(metadata);
            }
        }
    }

    // Sort by updated_at descending
    cases.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(cases)
}

#[tauri::command]
pub fn load_case(case_name: String) -> Result<CaseMetadata, String> {
    let case_path = get_case_path(&case_name)?;
    let case_file = case_path.join(".casekit").join("case.json");

    if !case_file.exists() {
        return Err(format!("Case '{}' not found", case_name));
    }

    let content = fs::read_to_string(&case_file)
        .map_err(|e| format!("Could not read case.json: {}", e))?;
    let metadata: CaseMetadata = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse case.json: {}", e))?;

    Ok(metadata)
}

#[tauri::command]
pub fn update_case(case_name: String, metadata: CaseMetadata) -> Result<CaseMetadata, String> {
    let case_path = get_case_path(&case_name)?;
    let case_file = case_path.join(".casekit").join("case.json");

    if !case_file.exists() {
        return Err(format!("Case '{}' not found", case_name));
    }

    let mut updated = metadata;
    updated.updated_at = chrono::Utc::now().to_rfc3339();

    let json = serde_json::to_string_pretty(&updated)
        .map_err(|e| format!("Could not serialise case metadata: {}", e))?;
    fs::write(&case_file, &json)
        .map_err(|e| format!("Could not write case.json: {}", e))?;

    Ok(updated)
}

#[tauri::command]
pub fn delete_case(case_name: String) -> Result<(), String> {
    let case_path = get_case_path(&case_name)?;

    if !case_path.exists() {
        return Err(format!("Case '{}' not found", case_name));
    }

    // Verify it's actually a CaseKit case directory
    let case_file = case_path.join(".casekit").join("case.json");
    if !case_file.exists() {
        return Err("This does not appear to be a valid CaseKit case directory".to_string());
    }

    fs::remove_dir_all(&case_path)
        .map_err(|e| format!("Could not delete case '{}': {}", case_name, e))?;

    Ok(())
}
