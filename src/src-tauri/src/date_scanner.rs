//! Regex-based date scanner for UK date formats.
//!
//! Scans extracted text for dates and returns candidates with
//! normalised dates, original text, surrounding context, and confidence.

use regex::Regex;
use serde::{Deserialize, Serialize};

/// Confidence level for a scanned date
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    High,
    Medium,
    Low,
}

/// A date found in document text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedDate {
    /// Normalised date string (yyyy-mm-dd or yyyy-mm if no day)
    pub date: String,
    /// The original text that matched
    pub original_text: String,
    /// Surrounding context (~60 chars either side)
    pub context: String,
    /// Confidence level
    pub confidence: Confidence,
}

/// Month name lookup (case-insensitive matching done via regex flag)
fn month_to_num(month: &str) -> Option<u32> {
    match month.to_lowercase().as_str() {
        "january" | "jan" => Some(1),
        "february" | "feb" => Some(2),
        "march" | "mar" => Some(3),
        "april" | "apr" => Some(4),
        "may" => Some(5),
        "june" | "jun" => Some(6),
        "july" | "jul" => Some(7),
        "august" | "aug" => Some(8),
        "september" | "sep" | "sept" => Some(9),
        "october" | "oct" => Some(10),
        "november" | "nov" => Some(11),
        "december" | "dec" => Some(12),
        _ => None,
    }
}

/// Check if a date is plausible (not in the far future, not before 1990)
fn is_plausible_date(year: u32, month: u32, day: Option<u32>) -> bool {
    if year < 1990 || year > 2030 {
        return false;
    }
    if month < 1 || month > 12 {
        return false;
    }
    if let Some(d) = day {
        if d < 1 || d > 31 {
            return false;
        }
    }
    true
}

/// Extract surrounding context from the text around a match position
fn get_context(text: &str, start: usize, end: usize) -> String {
    let context_chars = 60;

    // Find safe UTF-8 boundaries
    let safe_start = text[..start]
        .char_indices()
        .rev()
        .nth(context_chars.min(start))
        .map(|(i, _)| i)
        .unwrap_or(0);
    let safe_end = text[end..]
        .char_indices()
        .nth(context_chars)
        .map(|(i, _)| end + i)
        .unwrap_or(text.len());

    let mut ctx = String::new();
    if safe_start > 0 {
        ctx.push_str("…");
    }
    ctx.push_str(text[safe_start..safe_end].trim());
    if safe_end < text.len() {
        ctx.push_str("…");
    }
    ctx
}

/// Scan text for UK date patterns and return candidates
pub fn scan_for_dates(text: &str) -> Vec<ScannedDate> {
    let mut results: Vec<ScannedDate> = Vec::new();
    let mut seen_dates: std::collections::HashSet<String> = std::collections::HashSet::new();

    // Pattern 1: dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
    // UK format assumed — day first
    let re_dmy_numeric = Regex::new(
        r"\b(0?[1-9]|[12]\d|3[01])[/\-\.](0?[1-9]|1[0-2])[/\-\.](\d{4})\b"
    ).unwrap();

    for cap in re_dmy_numeric.captures_iter(text) {
        let day: u32 = cap[1].parse().unwrap_or(0);
        let month: u32 = cap[2].parse().unwrap_or(0);
        let year: u32 = cap[3].parse().unwrap_or(0);

        if is_plausible_date(year, month, Some(day)) {
            let date = format!("{:04}-{:02}-{:02}", year, month, day);
            let original = cap[0].to_string();
            let m = cap.get(0).unwrap();

            if seen_dates.insert(date.clone()) {
                results.push(ScannedDate {
                    date,
                    original_text: original,
                    context: get_context(text, m.start(), m.end()),
                    confidence: Confidence::Medium, // could be US format
                });
            }
        }
    }

    // Pattern 2: dd Month yyyy (e.g. "15 March 2024", "1st January 2023")
    let re_dmy_named = Regex::new(
        r"(?i)\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b"
    ).unwrap();

    for cap in re_dmy_named.captures_iter(text) {
        let day: u32 = cap[1].parse().unwrap_or(0);
        let month = month_to_num(&cap[2]).unwrap_or(0);
        let year: u32 = cap[3].parse().unwrap_or(0);

        if is_plausible_date(year, month, Some(day)) {
            let date = format!("{:04}-{:02}-{:02}", year, month, day);
            let original = cap[0].to_string();
            let m = cap.get(0).unwrap();

            if seen_dates.insert(date.clone()) {
                results.push(ScannedDate {
                    date,
                    original_text: original,
                    context: get_context(text, m.start(), m.end()),
                    confidence: Confidence::High, // unambiguous
                });
            }
        }
    }

    // Pattern 3: Month dd, yyyy (e.g. "March 15, 2024")
    let re_mdy_named = Regex::new(
        r"(?i)\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b"
    ).unwrap();

    for cap in re_mdy_named.captures_iter(text) {
        let month = month_to_num(&cap[1]).unwrap_or(0);
        let day: u32 = cap[2].parse().unwrap_or(0);
        let year: u32 = cap[3].parse().unwrap_or(0);

        if is_plausible_date(year, month, Some(day)) {
            let date = format!("{:04}-{:02}-{:02}", year, month, day);
            let original = cap[0].to_string();
            let m = cap.get(0).unwrap();

            if seen_dates.insert(date.clone()) {
                results.push(ScannedDate {
                    date,
                    original_text: original,
                    context: get_context(text, m.start(), m.end()),
                    confidence: Confidence::High,
                });
            }
        }
    }

    // Pattern 4: yyyy-mm-dd (ISO 8601)
    let re_iso = Regex::new(
        r"\b(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b"
    ).unwrap();

    for cap in re_iso.captures_iter(text) {
        let year: u32 = cap[1].parse().unwrap_or(0);
        let month: u32 = cap[2].parse().unwrap_or(0);
        let day: u32 = cap[3].parse().unwrap_or(0);

        if is_plausible_date(year, month, Some(day)) {
            let date = format!("{:04}-{:02}-{:02}", year, month, day);
            let original = cap[0].to_string();
            let m = cap.get(0).unwrap();

            if seen_dates.insert(date.clone()) {
                results.push(ScannedDate {
                    date,
                    original_text: original,
                    context: get_context(text, m.start(), m.end()),
                    confidence: Confidence::High,
                });
            }
        }
    }

    // Pattern 5: Month yyyy (no day — low confidence)
    let re_month_year = Regex::new(
        r"(?i)\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b"
    ).unwrap();

    for cap in re_month_year.captures_iter(text) {
        let month = month_to_num(&cap[1]).unwrap_or(0);
        let year: u32 = cap[2].parse().unwrap_or(0);

        if is_plausible_date(year, month, None) {
            let date = format!("{:04}-{:02}", year, month);

            // Only add if we don't already have a more specific date in this month
            let prefix = date.clone();
            if !seen_dates.iter().any(|d| d.starts_with(&prefix)) {
                let original = cap[0].to_string();
                let m = cap.get(0).unwrap();

                if seen_dates.insert(date.clone()) {
                    results.push(ScannedDate {
                        date,
                        original_text: original,
                        context: get_context(text, m.start(), m.end()),
                        confidence: Confidence::Low,
                    });
                }
            }
        }
    }

    // Sort by date
    results.sort_by(|a, b| a.date.cmp(&b.date));
    results
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uk_numeric_date() {
        let dates = scan_for_dates("The invoice was dated 15/03/2024 and received on 20/03/2024.");
        assert_eq!(dates.len(), 2);
        assert_eq!(dates[0].date, "2024-03-15");
        assert_eq!(dates[1].date, "2024-03-20");
        assert_eq!(dates[0].confidence, Confidence::Medium);
    }

    #[test]
    fn test_named_month_date() {
        let dates = scan_for_dates("On 15 March 2024, the claimant wrote to the defendant.");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-03-15");
        assert_eq!(dates[0].confidence, Confidence::High);
    }

    #[test]
    fn test_ordinal_date() {
        let dates = scan_for_dates("The hearing was set for the 3rd January 2025.");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2025-01-03");
    }

    #[test]
    fn test_us_format() {
        let dates = scan_for_dates("March 15, 2024 — letter received.");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-03-15");
        assert_eq!(dates[0].confidence, Confidence::High);
    }

    #[test]
    fn test_iso_date() {
        let dates = scan_for_dates("Created: 2024-03-15");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-03-15");
        assert_eq!(dates[0].confidence, Confidence::High);
    }

    #[test]
    fn test_month_year_only() {
        let dates = scan_for_dates("In January 2024, the goods were delivered.");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-01");
        assert_eq!(dates[0].confidence, Confidence::Low);
    }

    #[test]
    fn test_month_year_suppressed_when_specific_exists() {
        let dates = scan_for_dates("On 15 January 2024, the goods from January 2024 were returned.");
        // Should only have the specific date, not the month-only
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-01-15");
    }

    #[test]
    fn test_implausible_dates_rejected() {
        let dates = scan_for_dates("Reference: 15/03/1850 and 15/03/2050.");
        assert_eq!(dates.len(), 0);
    }

    #[test]
    fn test_deduplication() {
        let dates = scan_for_dates("15/03/2024 is the same as 15 March 2024.");
        assert_eq!(dates.len(), 1);
        assert_eq!(dates[0].date, "2024-03-15");
    }

    #[test]
    fn test_multiple_mixed_formats() {
        let text = "Invoice dated 01/06/2023. Reply sent on 15 June 2023. \
                    Court order issued 2023-07-01. Hearing in September 2023.";
        let dates = scan_for_dates(text);
        assert_eq!(dates.len(), 4);
        assert_eq!(dates[0].date, "2023-06-01");
        assert_eq!(dates[1].date, "2023-06-15");
        assert_eq!(dates[2].date, "2023-07-01");
        assert_eq!(dates[3].date, "2023-09");
    }

    #[test]
    fn test_abbreviated_months() {
        let dates = scan_for_dates("Meeting on 5 Jan 2024 and follow-up on 12 Feb 2024.");
        assert_eq!(dates.len(), 2);
        assert_eq!(dates[0].date, "2024-01-05");
        assert_eq!(dates[1].date, "2024-02-12");
    }
}
