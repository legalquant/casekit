//! Document text extraction for .txt, .eml, .pdf, .docx
//!
//! Each extractor returns an ExtractedContent struct with the full text body
//! and any metadata (date, subject, from, to) that can be pulled from headers.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Common return type for all extractors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedContent {
    /// Full text body (all pages / all paragraphs)
    pub text: String,
    /// Date from file metadata or email headers (RFC 2822 or similar)
    pub metadata_date: Option<String>,
    /// Email subject or PDF title
    pub subject: Option<String>,
    /// Email sender
    pub from: Option<String>,
    /// Email recipient
    pub to: Option<String>,
}

/// Detect file type by extension and extract content
pub fn extract_from_file(path: &Path) -> Result<ExtractedContent, String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "txt" => extract_txt(path),
        "eml" => extract_eml(path),
        "pdf" => extract_pdf(path),
        "docx" => extract_docx(path),
        "jpg" | "jpeg" | "png" | "bmp" | "tiff" | "tif" | "gif" => extract_image(path),
        _ => Err(format!("Unsupported file type: .{}", ext)),
    }
}

// ── Plain text ──────────────────────────────────────────────────────────────

fn extract_txt(path: &Path) -> Result<ExtractedContent, String> {
    let text = fs::read_to_string(path)
        .map_err(|e| format!("Could not read text file: {}", e))?;
    Ok(ExtractedContent {
        text,
        metadata_date: None,
        subject: None,
        from: None,
        to: None,
    })
}

// ── Email (.eml) ────────────────────────────────────────────────────────────

fn extract_eml(path: &Path) -> Result<ExtractedContent, String> {
    let raw = fs::read(path)
        .map_err(|e| format!("Could not read .eml file: {}", e))?;

    let message = mail_parser::MessageParser::default()
        .parse(&raw)
        .ok_or_else(|| "Could not parse .eml file".to_string())?;

    // Extract date from header
    let metadata_date = message.date().map(|dt| dt.to_rfc3339());

    // Subject
    let subject = message.subject().map(|s| s.to_string());

    // From
    let from = message.from().and_then(|addrs| {
        addrs.first().map(|a| {
            match (a.name(), a.address()) {
                (Some(name), Some(addr)) => format!("{} <{}>", name, addr),
                (None, Some(addr)) => addr.to_string(),
                (Some(name), None) => name.to_string(),
                (None, None) => String::new(),
            }
        })
    });

    // To
    let to = message.to().and_then(|addrs| {
        addrs.first().map(|a| {
            match (a.name(), a.address()) {
                (Some(name), Some(addr)) => format!("{} <{}>", name, addr),
                (None, Some(addr)) => addr.to_string(),
                (Some(name), None) => name.to_string(),
                (None, None) => String::new(),
            }
        })
    });

    // Body text — prefer plain text, fall back to html stripped of tags
    let text = message
        .body_text(0)
        .map(|t| t.to_string())
        .or_else(|| {
            message.body_html(0).map(|html| {
                // Very basic HTML tag stripping
                let re = regex::Regex::new(r"<[^>]+>").unwrap();
                re.replace_all(&html, "").to_string()
            })
        })
        .unwrap_or_default();

    Ok(ExtractedContent {
        text,
        metadata_date,
        subject,
        from,
        to,
    })
}

// ── PDF ─────────────────────────────────────────────────────────────────────

fn extract_pdf(path: &Path) -> Result<ExtractedContent, String> {
    // Try text extraction first
    let text = pdf_extract::extract_text(path)
        .map_err(|e| format!("PDF text extraction failed: {}", e))?;

    // Check if the PDF has meaningful text (i.e. not a scanned image PDF)
    let trimmed = text.trim();
    if trimmed.len() < 50 {
        // This is likely a scanned/image PDF — try OCR
        match crate::ocr::ocr_scanned_pdf(path) {
            Ok(ocr_text) if !ocr_text.trim().is_empty() => {
                return Ok(ExtractedContent {
                    text: ocr_text,
                    metadata_date: None,
                    subject: None,
                    from: None,
                    to: None,
                });
            }
            Ok(_) => {
                // OCR ran but produced nothing
                return Ok(ExtractedContent {
                    text: "[Scanned PDF — OCR produced no readable text. You can type content manually using the edit button.]".to_string(),
                    metadata_date: None,
                    subject: None,
                    from: None,
                    to: None,
                });
            }
            Err(e) => {
                // OCR not available or failed
                return Ok(ExtractedContent {
                    text: format!("[Scanned PDF — {}]", e),
                    metadata_date: None,
                    subject: None,
                    from: None,
                    to: None,
                });
            }
        }
    }

    Ok(ExtractedContent {
        text: text.trim().to_string(),
        metadata_date: None,
        subject: None,
        from: None,
        to: None,
    })
}

// ── DOCX ────────────────────────────────────────────────────────────────────

fn extract_docx(path: &Path) -> Result<ExtractedContent, String> {
    let data = fs::read(path)
        .map_err(|e| format!("Could not read .docx file: {}", e))?;

    let doc = docx_rs::read_docx(&data)
        .map_err(|e| format!("Could not parse .docx file: {}", e))?;

    let mut text_parts: Vec<String> = Vec::new();

    for child in doc.document.children {
        match child {
            docx_rs::DocumentChild::Paragraph(p) => {
                let para_text = extract_paragraph_text(&p);
                if !para_text.is_empty() {
                    text_parts.push(para_text);
                }
            }
            docx_rs::DocumentChild::Table(t) => {
                let table_text = extract_table_text(&t);
                if !table_text.is_empty() {
                    text_parts.push(table_text);
                }
            }
            _ => {}
        }
    }

    Ok(ExtractedContent {
        text: text_parts.join("\n"),
        metadata_date: None,
        subject: None,
        from: None,
        to: None,
    })
}

/// Extract text from a docx paragraph (all runs)
fn extract_paragraph_text(para: &docx_rs::Paragraph) -> String {
    let mut parts = Vec::new();
    for child in &para.children {
        if let docx_rs::ParagraphChild::Run(run) = child {
            for rc in &run.children {
                if let docx_rs::RunChild::Text(t) = rc {
                    parts.push(t.text.clone());
                }
            }
        }
    }
    parts.join("")
}

/// Extract text from a docx table (row by row, cell by cell)
fn extract_table_text(table: &docx_rs::Table) -> String {
    let mut rows_text = Vec::new();
    for row in &table.rows {
        let docx_rs::TableChild::TableRow(tr) = row;
        let mut cells_text = Vec::new();
        for cell in &tr.cells {
            let docx_rs::TableRowChild::TableCell(tc) = cell;
            let mut cell_parts = Vec::new();
            for child in &tc.children {
                if let docx_rs::TableCellContent::Paragraph(p) = child {
                    let t = extract_paragraph_text(p);
                    if !t.is_empty() {
                        cell_parts.push(t);
                    }
                }
            }
            cells_text.push(cell_parts.join(" "));
        }
        rows_text.push(cells_text.join(" | "));
    }
    rows_text.join("\n")
}

// ── Image files (OCR) ───────────────────────────────────────────────────────

fn extract_image(path: &Path) -> Result<ExtractedContent, String> {
    match crate::ocr::ocr_image_file(path) {
        Ok(text) if !text.trim().is_empty() => Ok(ExtractedContent {
            text,
            metadata_date: None,
            subject: None,
            from: None,
            to: None,
        }),
        Ok(_) => Ok(ExtractedContent {
            text: "[Image — OCR produced no readable text. You can type content manually using the edit button.]".to_string(),
            metadata_date: None,
            subject: None,
            from: None,
            to: None,
        }),
        Err(e) => Ok(ExtractedContent {
            text: format!("[Image — {}]", e),
            metadata_date: None,
            subject: None,
            from: None,
            to: None,
        }),
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_txt() {
        let dir = std::env::temp_dir();
        let test_file = dir.join("casekit_test_extract.txt");
        fs::write(&test_file, "This is a test document dated 15 March 2024.").unwrap();

        let result = extract_from_file(&test_file).unwrap();
        assert!(result.text.contains("15 March 2024"));
        assert!(result.metadata_date.is_none());

        let _ = fs::remove_file(&test_file);
    }

    #[test]
    fn test_unsupported_format() {
        let dir = std::env::temp_dir();
        let test_file = dir.join("casekit_test.xyz");
        fs::write(&test_file, "test").unwrap();

        let result = extract_from_file(&test_file);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unsupported"));

        let _ = fs::remove_file(&test_file);
    }
}
