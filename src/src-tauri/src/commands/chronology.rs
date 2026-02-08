use crate::path_safety::safe_case_path;
use crate::models::chronology::ChronologyEntry;
use crate::models::document::DocumentEntry;
use crate::models::case::CaseMetadata;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

fn get_case_path(case_name: &str) -> Result<PathBuf, String> {
    safe_case_path(case_name)
}

#[tauri::command]
pub fn build_chronology(case_name: String) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let mut entries = Vec::new();
    let mut saved_ids: HashSet<String> = HashSet::new();

    // Load ALL saved entries from chronology.json (manual, scanned, edited — everything the user has curated)
    let chrono_path = case_path.join(".casekit").join("chronology.json");
    if chrono_path.exists() {
        let content = fs::read_to_string(&chrono_path)
            .map_err(|e| format!("Could not read chronology.json: {}", e))?;
        let saved_entries: Vec<ChronologyEntry> = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse chronology.json: {}", e))?;
        for entry in saved_entries {
            saved_ids.insert(entry.id.clone());
            entries.push(entry);
        }
    }

    // Pull dates from documents.json — only add if not already saved (user's version takes priority)
    let docs_path = case_path.join(".casekit").join("documents.json");
    if docs_path.exists() {
        let content = fs::read_to_string(&docs_path)
            .map_err(|e| format!("Could not read documents.json: {}", e))?;
        let docs: Vec<DocumentEntry> = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse documents.json: {}", e))?;

        for doc in &docs {
            if let Some(date) = &doc.date {
                let id = format!("doc-{}", doc.id);
                if !saved_ids.contains(&id) {
                    entries.push(ChronologyEntry {
                        id,
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
    }

    // Pull key dates from case.json — only add if not already saved
    let case_file = case_path.join(".casekit").join("case.json");
    if case_file.exists() {
        let content = fs::read_to_string(&case_file)
            .map_err(|e| format!("Could not read case.json: {}", e))?;
        let case: CaseMetadata = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse case.json: {}", e))?;

        if let Some(date) = &case.date_of_purchase {
            let id = "intake-purchase".to_string();
            if !saved_ids.contains(&id) {
                entries.push(ChronologyEntry {
                    id,
                    date: date.clone(),
                    description: "Date of purchase/service".to_string(),
                    source: crate::models::chronology::ChronologySource::Intake,
                    document_id: None,
                    source_document_path: None,
                    significance: crate::models::chronology::Significance::Key,
                    confidence: None,
                });
            }
        }

        if let Some(date) = &case.date_problem_discovered {
            let id = "intake-problem".to_string();
            if !saved_ids.contains(&id) {
                entries.push(ChronologyEntry {
                    id,
                    date: date.clone(),
                    description: "Problem discovered".to_string(),
                    source: crate::models::chronology::ChronologySource::Intake,
                    document_id: None,
                    source_document_path: None,
                    significance: crate::models::chronology::Significance::Key,
                    confidence: None,
                });
            }
        }

        if let Some(date) = &case.date_first_complained {
            let id = "intake-complaint".to_string();
            if !saved_ids.contains(&id) {
                entries.push(ChronologyEntry {
                    id,
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
    }

    // Sort by date
    entries.sort_by(|a, b| a.date.cmp(&b.date));

    Ok(entries)
}

#[tauri::command]
pub fn add_chronology_entry(case_name: String, entry: ChronologyEntry) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let chrono_path = case_path.join(".casekit").join("chronology.json");

    let mut entries: Vec<ChronologyEntry> = Vec::new();
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

    // Return the full merged chronology so the UI stays consistent
    build_chronology(case_name)
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

    // Return the full merged chronology so the UI stays consistent
    build_chronology(case_name)
}

#[tauri::command]
pub fn update_chronology_entry(case_name: String, entry: ChronologyEntry) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let chrono_path = case_path.join(".casekit").join("chronology.json");

    let mut entries: Vec<ChronologyEntry> = Vec::new();
    if chrono_path.exists() {
        let content = fs::read_to_string(&chrono_path)
            .map_err(|e| format!("Could not read chronology.json: {}", e))?;
        entries = serde_json::from_str(&content)
            .map_err(|e| format!("Could not parse chronology.json: {}", e))?;
    }

    // Replace existing entry or add if not found (promotes dynamic entries to saved)
    let mut found = false;
    for existing in entries.iter_mut() {
        if existing.id == entry.id {
            *existing = entry.clone();
            found = true;
            break;
        }
    }
    if !found {
        entries.push(entry);
    }

    entries.sort_by(|a: &ChronologyEntry, b: &ChronologyEntry| a.date.cmp(&b.date));

    let json = serde_json::to_string_pretty(&entries)
        .map_err(|e| format!("Could not serialise chronology: {}", e))?;
    fs::write(&chrono_path, &json)
        .map_err(|e| format!("Could not write chronology.json: {}", e))?;

    build_chronology(case_name)
}

/// Extract a clean, readable description from around a date match.
/// Priority: 1) user-provided description, 2) email Subject line, 3) best sentence from context.
fn extract_clean_description(context: &str, filename: &str, doc_description: &str) -> String {
    // Priority 1: user-provided description
    let desc_trimmed = doc_description.trim();
    if !desc_trimmed.is_empty() && desc_trimmed.len() > 5 {
        return desc_trimmed.to_string();
    }

    // Clean control characters
    let clean: String = context
        .chars()
        .filter(|c| !c.is_control() || *c == '\n')
        .collect::<String>()
        .trim()
        .to_string();

    if clean.is_empty() {
        return format!("Date found in {}", filename);
    }

    // Priority 2: look for email Subject line in the text
    for line in clean.lines() {
        let trimmed = line.trim();
        if let Some(subject) = trimmed.strip_prefix("Subject:") {
            let subj = subject.trim();
            if subj.len() > 3 {
                return subj.to_string();
            }
        }
        // Also match "Re:" / "Fwd:" lines as subjects
        if (trimmed.starts_with("Re:") || trimmed.starts_with("Fwd:") || trimmed.starts_with("RE:") || trimmed.starts_with("FW:"))
            && trimmed.len() > 5
            && trimmed.len() < 120
        {
            return trimmed.to_string();
        }
    }

    // Priority 3: extract best sentence — longest non-boilerplate sentence
    let sentences: Vec<&str> = clean
        .split(|c: char| c == '.' || c == '!' || c == '?' || c == '\n')
        .map(|s| s.trim())
        .filter(|s| s.len() > 10)
        .filter(|s| !is_boilerplate(s))
        .collect();

    if let Some(best) = sentences.iter().max_by_key(|s| s.len()) {
        let truncated = if best.len() > 120 {
            let cut = best[..120].rfind(' ').unwrap_or(120);
            format!("{}…", &best[..cut])
        } else {
            best.to_string()
        };
        return truncated;
    }

    // Fallback: truncated clean text
    if clean.len() > 100 {
        let cut = clean[..100].rfind(' ').unwrap_or(100);
        format!("{}…", &clean[..cut])
    } else {
        clean
    }
}

/// Detect common boilerplate fragments that shouldn't be used as descriptions
fn is_boilerplate(text: &str) -> bool {
    let lower = text.to_lowercase();
    let patterns = [
        "this email", "confidential", "disclaimer", "unsubscribe",
        "privacy policy", "terms and conditions", "all rights reserved",
        "sent from my", "kind regards", "best regards", "yours sincerely",
        "yours faithfully", "page ", "http://", "https://", "www.",
    ];
    patterns.iter().any(|p| lower.contains(p))
}

#[tauri::command]
pub fn scan_documents_for_dates(case_name: String) -> Result<Vec<ChronologyEntry>, String> {
    let case_path = get_case_path(&case_name)?;
    let docs_path = case_path.join(".casekit").join("documents.json");

    if !docs_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&docs_path)
        .map_err(|e| format!("Could not read documents.json: {}", e))?;
    let docs: Vec<DocumentEntry> = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse documents.json: {}", e))?;

    // Load existing chronology to avoid duplicates
    let chrono_path = case_path.join(".casekit").join("chronology.json");
    let existing_ids: std::collections::HashSet<String> = if chrono_path.exists() {
        let chrono_content = fs::read_to_string(&chrono_path).unwrap_or_default();
        let existing: Vec<ChronologyEntry> = serde_json::from_str(&chrono_content).unwrap_or_default();
        existing.into_iter().map(|e| e.id).collect()
    } else {
        std::collections::HashSet::new()
    };

    // Also track dates we've already seen globally to avoid near-duplicate entries
    let mut seen_dates: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut candidates = Vec::new();

    for doc in &docs {
        let text = match &doc.extracted_text {
            Some(t) if !t.is_empty() => t.clone(),
            _ => continue,
        };

        let scanned = crate::date_scanner::scan_for_dates(&text);

        for sd in scanned {
            let entry_id = format!("scan-{}-{}", doc.id, sd.date);

            // Skip if already in chronology or if we've already seen this date
            // from another part of the same document
            if existing_ids.contains(&entry_id) {
                continue;
            }

            // Deduplicate: only keep the first occurrence of each date globally
            let date_key = sd.date.clone();
            if seen_dates.contains(&date_key) {
                continue;
            }
            seen_dates.insert(date_key);

            let confidence = match sd.confidence {
                crate::date_scanner::Confidence::High => Some("high".to_string()),
                crate::date_scanner::Confidence::Medium => Some("medium".to_string()),
                crate::date_scanner::Confidence::Low => Some("low".to_string()),
            };

            let description = extract_clean_description(
                &sd.context,
                &doc.filename,
                &doc.description,
            );

            candidates.push(ChronologyEntry {
                id: entry_id,
                date: sd.date,
                description,
                source: crate::models::chronology::ChronologySource::Document,
                document_id: Some(doc.id.clone()),
                source_document_path: Some(doc.path.clone()),
                significance: crate::models::chronology::Significance::Supporting,
                confidence,
            });
        }
    }

    candidates.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(candidates)
}
