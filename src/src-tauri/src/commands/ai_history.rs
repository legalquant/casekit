use crate::path_safety::safe_case_path;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

fn get_case_path(case_name: &str) -> Result<PathBuf, String> {
    safe_case_path(case_name)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiCallRecord {
    pub id: String,
    #[serde(rename = "callType")]
    pub call_type: String,
    pub timestamp: String,
    #[serde(rename = "inputTokens")]
    pub input_tokens: u64,
    #[serde(rename = "outputTokens")]
    pub output_tokens: u64,
    pub model: String,
    pub response: String,
    pub summary: Option<String>,
}

#[tauri::command]
pub fn save_ai_call(case_name: String, record: AiCallRecord) -> Result<(), String> {
    let case_path = get_case_path(&case_name)?;
    let history_path = case_path.join(".casekit").join("ai-history.json");

    let mut records: Vec<AiCallRecord> = if history_path.exists() {
        let content = fs::read_to_string(&history_path)
            .map_err(|e| format!("Could not read ai-history.json: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };

    records.push(record);

    let json = serde_json::to_string_pretty(&records)
        .map_err(|e| format!("Could not serialise AI history: {}", e))?;
    fs::write(&history_path, &json)
        .map_err(|e| format!("Could not write ai-history.json: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn load_ai_history(case_name: String) -> Result<Vec<AiCallRecord>, String> {
    let case_path = get_case_path(&case_name)?;
    let history_path = case_path.join(".casekit").join("ai-history.json");

    if !history_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&history_path)
        .map_err(|e| format!("Could not read ai-history.json: {}", e))?;
    let records: Vec<AiCallRecord> = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse ai-history.json: {}", e))?;

    Ok(records)
}
