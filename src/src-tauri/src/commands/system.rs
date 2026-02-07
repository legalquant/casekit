//! System-level commands for dependency checks and environment info.

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DependencyStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub required: bool,
    pub install_url: String,
    pub description: String,
}

#[tauri::command]
pub fn check_dependencies() -> Vec<DependencyStatus> {
    let mut deps = Vec::new();

    // Tesseract OCR
    let tess = check_tesseract();
    deps.push(tess);

    deps
}

fn check_tesseract() -> DependencyStatus {
    let candidates = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ];

    // Check known paths
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            let version = get_tesseract_version(path);
            return DependencyStatus {
                name: "Tesseract OCR".to_string(),
                installed: true,
                version,
                required: false,
                install_url: "https://github.com/UB-Mannheim/tesseract/wiki".to_string(),
                description: "Extracts text from scanned documents and images".to_string(),
            };
        }
    }

    // Check PATH
    if let Ok(output) = std::process::Command::new("tesseract").arg("--version").output() {
        if output.status.success() {
            let ver = String::from_utf8_lossy(&output.stdout);
            let version = ver.lines().next().map(|l| l.trim().to_string());
            return DependencyStatus {
                name: "Tesseract OCR".to_string(),
                installed: true,
                version,
                required: false,
                install_url: "https://github.com/UB-Mannheim/tesseract/wiki".to_string(),
                description: "Extracts text from scanned documents and images".to_string(),
            };
        }
    }

    DependencyStatus {
        name: "Tesseract OCR".to_string(),
        installed: false,
        version: None,
        required: false,
        install_url: "https://github.com/UB-Mannheim/tesseract/wiki".to_string(),
        description: "Extracts text from scanned documents and images".to_string(),
    }
}

fn get_tesseract_version(path: &str) -> Option<String> {
    std::process::Command::new(path)
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| {
            let out = String::from_utf8_lossy(&o.stdout);
            out.lines().next().map(|l| l.trim().to_string())
        })
}
