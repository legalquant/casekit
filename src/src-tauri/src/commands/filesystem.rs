use crate::path_safety::casekit_base;

/// Returns the base path for CaseKit data: ~/Documents/CaseKit/
#[tauri::command]
pub fn get_base_path() -> Result<String, String> {
    let base = casekit_base()?;
    Ok(base.to_string_lossy().to_string())
}

/// Ensures the base CaseKit directory exists
#[tauri::command]
pub fn ensure_base_directory() -> Result<String, String> {
    let base = casekit_base()?;
    std::fs::create_dir_all(&base)
        .map_err(|e| format!("Could not create CaseKit directory at {}: {}", base.display(), e))?;
    Ok(base.to_string_lossy().to_string())
}
