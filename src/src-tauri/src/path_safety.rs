use std::path::PathBuf;

/// Returns the base CaseKit directory: ~/Documents/CaseKit/
pub fn casekit_base() -> Result<PathBuf, String> {
    let doc_dir = dirs::document_dir()
        .ok_or_else(|| "Could not determine Documents directory".to_string())?;
    Ok(doc_dir.join("CaseKit"))
}

/// Sanitise a user-supplied path component (case name, folder, filename).
/// Rejects any value containing path traversal sequences or path separators.
pub fn sanitise_path_component(input: &str, label: &str) -> Result<String, String> {
    let trimmed = input.trim();

    if trimmed.is_empty() {
        return Err(format!("{} must not be empty", label));
    }

    // Reject path separators
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err(format!("{} must not contain path separators", label));
    }

    // Reject traversal
    if trimmed == "." || trimmed == ".." || trimmed.contains("..") {
        return Err(format!("{} must not contain path traversal sequences", label));
    }

    // Reject null bytes
    if trimmed.contains('\0') {
        return Err(format!("{} contains invalid characters", label));
    }

    Ok(trimmed.to_string())
}

/// Build a safe case path: ~/Documents/CaseKit/<sanitised_case_name>
pub fn safe_case_path(case_name: &str) -> Result<PathBuf, String> {
    let safe_name = sanitise_path_component(case_name, "Case name")?;
    let base = casekit_base()?;
    let case_path = base.join(&safe_name);

    // Verify the resolved path is still under the base directory
    let canonical_base = base.canonicalize().unwrap_or_else(|_| base.clone());
    // For new directories that don't exist yet, check that the parent is under base
    if case_path.exists() {
        let canonical_case = case_path.canonicalize()
            .map_err(|e| format!("Could not resolve case path: {}", e))?;
        if !canonical_case.starts_with(&canonical_base) {
            return Err("Case path resolves outside CaseKit directory".to_string());
        }
    }

    Ok(case_path)
}

/// Validate a relative path within a case directory.
/// Ensures it does not escape the case folder.
pub fn validate_relative_path(case_path: &PathBuf, relative: &str) -> Result<PathBuf, String> {
    // Reject obvious traversal
    if relative.contains("..") {
        return Err("Relative path must not contain '..'".to_string());
    }

    if relative.contains('\0') {
        return Err("Path contains invalid characters".to_string());
    }

    let full_path = case_path.join(relative);

    // If the path exists, verify it resolves under the case directory
    if full_path.exists() {
        let canonical_full = full_path.canonicalize()
            .map_err(|e| format!("Could not resolve path: {}", e))?;
        let canonical_case = case_path.canonicalize()
            .map_err(|e| format!("Could not resolve case path: {}", e))?;
        if !canonical_full.starts_with(&canonical_case) {
            return Err("Path resolves outside case directory".to_string());
        }
    }

    Ok(full_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_traversal() {
        assert!(sanitise_path_component("..", "test").is_err());
        assert!(sanitise_path_component("../etc", "test").is_err());
        assert!(sanitise_path_component("foo/../bar", "test").is_err());
        assert!(sanitise_path_component("foo/bar", "test").is_err());
        assert!(sanitise_path_component("foo\\bar", "test").is_err());
        assert!(sanitise_path_component(".", "test").is_err());
    }

    #[test]
    fn accepts_valid_names() {
        assert!(sanitise_path_component("My Case 2024", "test").is_ok());
        assert!(sanitise_path_component("smith-v-jones", "test").is_ok());
        assert!(sanitise_path_component("Case_001", "test").is_ok());
    }

    #[test]
    fn rejects_empty() {
        assert!(sanitise_path_component("", "test").is_err());
        assert!(sanitise_path_component("  ", "test").is_err());
    }

    #[test]
    fn rejects_null_bytes() {
        assert!(sanitise_path_component("foo\0bar", "test").is_err());
    }
}
