use crate::path_safety::safe_case_path;
use crate::models::chronology::ChronologyEntry;
use crate::models::document::DocumentEntry;
use crate::models::case::CaseMetadata;
use std::fs;
use std::path::PathBuf;

fn get_case_path(case_name: &str) -> Result<PathBuf, String> {
    safe_case_path(case_name)
}

#[tauri::command]
pub fn build_chronology(case_name: String) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let mut entries = Vec::new();

    // Load existing manual entries from chronology.json
    let chrono_path = case_path.join(".casekit").join("chronology.json");
    if chrono_path.exists() {
        let content = fs::read_to_string(&chrono_path)
            .map_err(|e| format!("Could not read chronology.json: {}", e))?;
        let manual_entries: Vec<ChronologyEntry> = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse chronology.json: {}", e))?;
        // Keep only manual entries from the stored file
        for entry in manual_entries {
            if matches!(entry.source, crate::models::chronology::ChronologySource::Manual) {
                entries.push(entry);
            }
        }
    }

    // Pull dates from documents.json
    let docs_path = case_path.join(".casekit").join("documents.json");
    if docs_path.exists() {
        let content = fs::read_to_string(&docs_path)
            .map_err(|e| format!("Could not read documents.json: {}", e))?;
        let docs: Vec<DocumentEntry> = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse documents.json: {}", e))?;

        for doc in &docs {
            if let Some(date) = &doc.date {
                entries.push(ChronologyEntry {
                    id: format!("doc-{}", doc.id),
                    date: date.clone(),
                    description: format!("{}: {}", doc.filename, doc.description),
                    source: crate::models::chronology::ChronologySource::Document,
                    document_id: Some(doc.id.clone()),
                    source_document_path: Some(doc.path.clone()),
                    significance: crate::models::chronology::Significance::Supporting,
                    confidence: None,
                });
            }
        }
    }

    // Pull key dates from case.json
    let case_file = case_path.join(".casekit").join("case.json");
    if case_file.exists() {
        let content = fs::read_to_string(&case_file)
            .map_err(|e| format!("Could not read case.json: {}", e))?;
        let case: CaseMetadata = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse case.json: {}", e))?;

        if let Some(date) = &case.date_of_purchase {
            entries.push(ChronologyEntry {
                id: "intake-purchase".to_string(),
                date: date.clone(),
                description: "Date of purchase/service".to_string(),
                source: crate::models::chronology::ChronologySource::Intake,
                document_id: None,
                source_document_path: None,
                significance: crate::models::chronology::Significance::Key,
                confidence: None,
            });
        }

        if let Some(date) = &case.date_problem_discovered {
            entries.push(ChronologyEntry {
                id: "intake-problem".to_string(),
                date: date.clone(),
                description: "Problem discovered".to_string(),
                source: crate::models::chronology::ChronologySource::Intake,
                document_id: None,
                source_document_path: None,
                significance: crate::models::chronology::Significance::Key,
                confidence: None,
            });
        }

        if let Some(date) = &case.date_first_complained {
            entries.push(ChronologyEntry {
                id: "intake-complaint".to_string(),
                date: date.clone(),
                description: "First complaint to seller".to_string(),
                source: crate::models::chronology::ChronologySource::Intake,
                document_id: None,
                source_document_path: None,
                significance: crate::models::chronology::Significance::Key,
                confidence: None,
            });
        }
    }

    // Sort by date
    entries.sort_by(|a, b| a.date.cmp(&b.date));

    Ok(entries)
}

#[tauri::command]
pub fn add_chronology_entry(case_name: String, entry: ChronologyEntry) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let chrono_path = case_path.join(".casekit").join("chronology.json");

    let mut entries = Vec::new();
    if chrono_path.exists() {
        let content = fs::read_to_string(&chrono_path)
            .map_err(|e| format!("Could not read chronology.json: {}", e))?;
        entries = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse chronology.json: {}", e))?;
    }

    entries.push(entry);
    entries.sort_by(|a: &ChronologyEntry, b: &ChronologyEntry| a.date.cmp(&b.date));

    let json = serde_json::to_string_pretty(&entries)
        .map_err(|e| format!("Could not serialise chronology: {}", e))?;
    fs::write(&chrono_path, &json)
        .map_err(|e| format!("Could not write chronology.json: {}", e))?;

    Ok(entries)
}

#[tauri::command]
pub fn remove_chronology_entry(case_name: String, entry_id: String) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let chrono_path = case_path.join(".casekit").join("chronology.json");

    let mut entries: Vec<ChronologyEntry> = Vec::new();
    if chrono_path.exists() {
        let content = fs::read_to_string(&chrono_path)
            .map_err(|e| format!("Could not read chronology.json: {}", e))?;
        entries = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse chronology.json: {}", e))?;
    }

    let filtered: Vec<ChronologyEntry> = entries.into_iter().filter(|e| e.id != entry_id).collect();

    let json = serde_json::to_string_pretty(&filtered)
        .map_err(|e| format!("Could not serialise chronology: {}", e))?;
    fs::write(&chrono_path, &json)
        .map_err(|e| format!("Could not write chronology.json: {}", e))?;

    Ok(filtered)
}
