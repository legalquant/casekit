use serde::{Deserialize, Serialize};
use std::time::Duration;

// ===== Domain allowlist =====

const ALLOWED_DOMAINS: &[&str] = &[
    "www.bailii.org",
    "bailii.org",
    "caselaw.nationalarchives.gov.uk",
    "legislation.gov.uk",
    "www.legislation.gov.uk",
];

const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) \
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

fn is_domain_allowed(url_str: &str) -> bool {
    match url::Url::parse(url_str) {
        Ok(parsed) => {
            if let Some(host) = parsed.host_str() {
                ALLOWED_DOMAINS.iter().any(|d| host == *d || host.ends_with(&format!(".{}", d)))
            } else {
                false
            }
        }
        Err(_) => false,
    }
}

// ===== Types =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrlCheckResult {
    pub url: String,
    pub exists: bool,
    #[serde(rename = "statusCode")]
    pub status_code: u16,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedCandidate {
    pub url: String,
    pub source: String,
    pub confidence: f64,
    pub title: Option<String>,
    #[serde(rename = "resolutionMethod")]
    pub resolution_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationResolution {
    pub citation: String,
    #[serde(rename = "caseName")]
    pub case_name: Option<String>,
    pub candidates: Vec<ResolvedCandidate>,
    pub status: String,
    #[serde(rename = "attemptsLog")]
    pub attempts_log: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchedJudgment {
    pub url: String,
    pub title: Option<String>,
    #[serde(rename = "contentType")]
    pub content_type: String,
    pub content: String,
    pub ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Authority {
    pub id: String,
    pub citation: String,
    #[serde(rename = "caseName")]
    pub case_name: Option<String>,
    pub url: String,
    pub source: String,
    pub title: Option<String>,
    #[serde(rename = "dateAdded")]
    pub date_added: String,
    pub notes: Option<String>,
}

// ===== BAILII Neutral Citation Patterns =====

struct NeutralPattern {
    code: &'static str,
    regex: &'static str,
    bailii_template: &'static str,
    fcl_template: &'static str,
}

const NEUTRAL_PATTERNS: &[NeutralPattern] = &[
    NeutralPattern {
        code: "UKSC",
        regex: r"\[(\d{4})\]\s+UKSC\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKSC/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/uksc/{year}/{num}",
    },
    NeutralPattern {
        code: "UKHL",
        regex: r"\[(\d{4})\]\s+UKHL\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKHL/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ukhl/{year}/{num}",
    },
    NeutralPattern {
        code: "UKPC",
        regex: r"\[(\d{4})\]\s+UKPC\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKPC/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ukpc/{year}/{num}",
    },
    NeutralPattern {
        code: "EWCA Civ",
        regex: r"\[(\d{4})\]\s+EWCA\s+Civ\s+(\d+)",
        bailii_template: "https://www.bailii.org/ew/cases/EWCA/Civ/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ewca/civ/{year}/{num}",
    },
    NeutralPattern {
        code: "EWCA Crim",
        regex: r"\[(\d{4})\]\s+EWCA\s+Crim\s+(\d+)",
        bailii_template: "https://www.bailii.org/ew/cases/EWCA/Crim/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ewca/crim/{year}/{num}",
    },
    NeutralPattern {
        code: "EWHC",
        regex: r"\[(\d{4})\]\s+EWHC\s+(\d+)",
        bailii_template: "https://www.bailii.org/ew/cases/EWHC/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ewhc/{year}/{num}",
    },
    NeutralPattern {
        code: "EWCOP",
        regex: r"\[(\d{4})\]\s+EWCOP\s+(\d+)",
        bailii_template: "https://www.bailii.org/ew/cases/EWCOP/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ewcop/{year}/{num}",
    },
    NeutralPattern {
        code: "EWFC",
        regex: r"\[(\d{4})\]\s+EWFC\s+(\d+)",
        bailii_template: "https://www.bailii.org/ew/cases/EWFC/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ewfc/{year}/{num}",
    },
    NeutralPattern {
        code: "UKUT",
        regex: r"\[(\d{4})\]\s+UKUT\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKUT/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ukut/{year}/{num}",
    },
    NeutralPattern {
        code: "UKFTT",
        regex: r"\[(\d{4})\]\s+UKFTT\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKFTT/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/ukftt/{year}/{num}",
    },
    NeutralPattern {
        code: "UKEAT",
        regex: r"\[(\d{4})\]\s+UKEAT\s+(\d+)",
        bailii_template: "https://www.bailii.org/uk/cases/UKEAT/{year}/{num}.html",
        fcl_template: "https://caselaw.nationalarchives.gov.uk/eat/{year}/{num}",
    },
];

// ===== HTTP client helpers =====

fn build_client(follow_redirects: bool) -> Result<reqwest::Client, String> {
    let policy = if follow_redirects {
        reqwest::redirect::Policy::limited(5)
    } else {
        reqwest::redirect::Policy::none()
    };

    reqwest::Client::builder()
        .redirect(policy)
        .user_agent(USER_AGENT)
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

/// Gentle rate limit — 200ms pause between requests
async fn rate_limit_pause() {
    tokio::time::sleep(Duration::from_millis(200)).await;
}

// ===== Strategy 1: Direct URL Construction from Neutral Citations =====

fn try_neutral_citation_urls(citation: &str) -> Option<(String, String, String)> {
    let re_cache = regex::RegexBuilder::new("")
        .case_insensitive(true)
        .build();
    drop(re_cache);

    for pattern in NEUTRAL_PATTERNS {
        let re = match regex::RegexBuilder::new(pattern.regex)
            .case_insensitive(true)
            .build()
        {
            Ok(r) => r,
            Err(_) => continue,
        };

        if let Some(caps) = re.captures(citation) {
            let year = caps.get(1).map(|m| m.as_str()).unwrap_or("");
            let num = caps.get(2).map(|m| m.as_str()).unwrap_or("");

            let bailii_url = pattern
                .bailii_template
                .replace("{year}", year)
                .replace("{num}", num);
            let fcl_url = pattern
                .fcl_template
                .replace("{year}", year)
                .replace("{num}", num);

            return Some((pattern.code.to_string(), bailii_url, fcl_url));
        }
    }
    None
}

// ===== Strategy 2: BAILII Citation Finder (302 redirect) =====

async fn try_bailii_citation_finder(
    client: &reqwest::Client,
    citation: &str,
) -> Option<ResolvedCandidate> {
    let encoded = urlencoding::encode(citation);
    let url = format!(
        "https://www.bailii.org/cgi-bin/find_by_citation.cgi?citation={}",
        encoded
    );

    let resp = client.get(&url).send().await.ok()?;
    let status = resp.status().as_u16();

    // The magic: if BAILII recognises the citation, it returns 302 with Location header
    if status == 302 || status == 301 {
        if let Some(location) = resp.headers().get("location") {
            let loc_str = location.to_str().ok()?;
            let full_url = if loc_str.starts_with('/') {
                format!("https://www.bailii.org{}", loc_str)
            } else if loc_str.starts_with("http") {
                loc_str.to_string()
            } else {
                return None;
            };

            return Some(ResolvedCandidate {
                url: full_url,
                source: "bailii".to_string(),
                confidence: 0.95,
                title: None,
                resolution_method: "bailii_citation_finder".to_string(),
            });
        }
    }
    None
}

// ===== Strategy 3: BAILII Title Search (lucy_search_1.cgi) =====

async fn search_bailii_by_title(
    client: &reqwest::Client,
    party_names: &str,
    mask_path: &str,
) -> Vec<ResolvedCandidate> {
    let mut results = Vec::new();

    let query = party_names
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("+");

    let url = format!(
        "https://www.bailii.org/cgi-bin/lucy_search_1.cgi?querytitle={}&mask_path={}",
        query, mask_path
    );

    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(_) => return results,
    };

    if resp.status() != reqwest::StatusCode::OK {
        return results;
    }

    let body = match resp.text().await {
        Ok(t) => t,
        Err(_) => return results,
    };

    // Parse case links from results HTML
    // BAILII result links look like: href="/uk/cases/UKHL/1990/2.html"
    let link_re =
        regex::Regex::new(r#"href="(/[a-z]{2}/cases/[^"]+\.html)""#).unwrap();
    let title_re =
        regex::Regex::new(r#"<a[^>]+href="/[a-z]{2}/cases/[^"]+\.html"[^>]*>([^<]+)</a>"#)
            .unwrap();

    // Also check "Total results: N"
    let total_re = regex::Regex::new(r"Total results:\s*(\d+)").unwrap();
    let total_results = total_re
        .captures(&body)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<usize>().ok())
        .unwrap_or(0);

    if total_results == 0 {
        return results;
    }

    // Extract links and their text
    for cap in title_re.captures_iter(&body) {
        let title_text = cap.get(1).map(|m| m.as_str().trim().to_string());
        // Find the associated href
        let full_match = cap.get(0).map(|m| m.as_str()).unwrap_or("");
        if let Some(href_cap) = link_re.captures(full_match) {
            let path = href_cap.get(1).map(|m| m.as_str()).unwrap_or("");
            if !path.is_empty() {
                let full_url = format!("https://www.bailii.org{}", path);
                // Skip nav/utility links
                if let Some(ref t) = title_text {
                    if t.len() < 5
                        || ["next", "previous", "back", "home"]
                            .contains(&t.to_lowercase().as_str())
                    {
                        continue;
                    }
                }
                results.push(ResolvedCandidate {
                    url: full_url,
                    source: "bailii".to_string(),
                    confidence: 0.80,
                    title: title_text,
                    resolution_method: "bailii_title_search".to_string(),
                });
                if results.len() >= 5 {
                    break;
                }
            }
        }
    }

    // Fallback: if title_re didn't match (different HTML structure), try just href matching
    if results.is_empty() {
        for cap in link_re.captures_iter(&body) {
            let path = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            if !path.is_empty() {
                let full_url = format!("https://www.bailii.org{}", path);
                results.push(ResolvedCandidate {
                    url: full_url,
                    source: "bailii".to_string(),
                    confidence: 0.70,
                    title: None,
                    resolution_method: "bailii_title_search".to_string(),
                });
                if results.len() >= 5 {
                    break;
                }
            }
        }
    }

    results
}

// ===== Strategy 4: FCL Atom Feed Search =====

async fn search_fcl(
    client: &reqwest::Client,
    query: &str,
) -> Vec<ResolvedCandidate> {
    let mut results = Vec::new();

    let encoded = urlencoding::encode(query);
    let url = format!(
        "https://caselaw.nationalarchives.gov.uk/atom.xml?query={}&per_page=5",
        encoded
    );

    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(_) => return results,
    };

    if resp.status() != reqwest::StatusCode::OK {
        return results;
    }

    let body = match resp.text().await {
        Ok(t) => t,
        Err(_) => return results,
    };

    // Parse Atom XML entries — extract title and link
    let entry_re = regex::Regex::new(r"(?s)<entry>(.*?)</entry>").unwrap();
    let title_re = regex::Regex::new(r"<title>([^<]+)</title>").unwrap();
    let link_re = regex::Regex::new(
        r#"<link[^>]+href="(https://caselaw\.nationalarchives\.gov\.uk/[^"]+)"[^>]*/>"#,
    )
    .unwrap();
    let uri_re = regex::Regex::new(
        r"<id>(https://caselaw\.nationalarchives\.gov\.uk/[^<]+)</id>",
    )
    .unwrap();

    for entry_cap in entry_re.captures_iter(&body) {
        let entry_text = entry_cap.get(1).map(|m| m.as_str()).unwrap_or("");

        let title = title_re
            .captures(entry_text)
            .and_then(|c| c.get(1))
            .map(|m| {
                m.as_str()
                    .replace("&amp;", "&")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .trim()
                    .to_string()
            });

        // Prefer <link href="...">, fall back to <id>
        let case_url = link_re
            .captures(entry_text)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .or_else(|| {
                uri_re
                    .captures(entry_text)
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str().to_string())
            });

        if let Some(url) = case_url {
            results.push(ResolvedCandidate {
                url,
                source: "find_case_law".to_string(),
                confidence: 0.75,
                title,
                resolution_method: "fcl_atom_search".to_string(),
            });
            if results.len() >= 5 {
                break;
            }
        }
    }

    results
}

// ===== Strategy 5: BAILII Full-Text Search =====

async fn search_bailii_fulltext(
    client: &reqwest::Client,
    query_terms: &str,
    mask_path: &str,
) -> Vec<ResolvedCandidate> {
    let mut results = Vec::new();

    // Use boolean AND between terms
    let terms: Vec<&str> = query_terms.split_whitespace().collect();
    let bool_query = terms.join("+AND+");

    let url = format!(
        "https://www.bailii.org/cgi-bin/lucy_search_1.cgi?query={}&mask_path={}&method=boolean&sort=rank",
        bool_query, mask_path
    );

    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(_) => return results,
    };

    if resp.status() != reqwest::StatusCode::OK {
        return results;
    }

    let body = match resp.text().await {
        Ok(t) => t,
        Err(_) => return results,
    };

    let link_re =
        regex::Regex::new(r#"href="(/[a-z]{2}/cases/[^"]+\.html)""#).unwrap();

    for cap in link_re.captures_iter(&body) {
        let path = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        if !path.is_empty() {
            let full_url = format!("https://www.bailii.org{}", path);
            // Avoid duplicates
            if results.iter().any(|r: &ResolvedCandidate| r.url == full_url) {
                continue;
            }
            results.push(ResolvedCandidate {
                url: full_url,
                source: "bailii".to_string(),
                confidence: 0.60,
                title: None,
                resolution_method: "bailii_fulltext_search".to_string(),
            });
            if results.len() >= 5 {
                break;
            }
        }
    }

    results
}

// ===== Citation text helpers =====

fn extract_case_name(citation_text: &str) -> Option<String> {
    let re = regex::Regex::new(r"^(.*?)\s*\[\d{4}\]").unwrap();
    re.captures(citation_text)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| s.len() > 2)
}

fn extract_year(citation_text: &str) -> Option<String> {
    let re = regex::Regex::new(r"\[(\d{4})\]").unwrap();
    re.captures(citation_text)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
}

/// Boost confidence for candidates whose URL contains the citation year,
/// and penalise candidates with a different year. Then sort by confidence.
fn boost_year_matching_candidates(candidates: &mut Vec<ResolvedCandidate>, citation: &str) {
    if let Some(year) = extract_year(citation) {
        for candidate in candidates.iter_mut() {
            if candidate.url.contains(&format!("/{}/", year)) {
                // URL contains the correct year — boost confidence
                candidate.confidence = (candidate.confidence + 0.20).min(0.95);
            } else {
                // Check if URL contains a DIFFERENT year (wrong match)
                let year_in_url = regex::Regex::new(r"/(\d{4})/")
                    .ok()
                    .and_then(|re| re.captures(&candidate.url))
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str().to_string());

                if let Some(url_year) = year_in_url {
                    if url_year != year {
                        // Wrong year — heavily penalise
                        candidate.confidence *= 0.3;
                    }
                }
            }
        }
        // Sort by confidence descending so best match is first
        candidates.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
    }
}

fn extract_party_search_terms(name: &str) -> Vec<String> {
    let stop_words = [
        "v", "and", "the", "of", "for", "in", "on", "a", "an", "r", "re",
        "plc", "ltd", "limited", "inc", "llc", "llp", "council", "borough",
        "county", "city", "district", "secretary", "state", "home",
        "department", "commissioner", "others", "ors",
    ];

    name.split(|c: char| !c.is_alphanumeric())
        .map(|w| w.to_lowercase())
        .filter(|w| w.len() >= 3 && !stop_words.contains(&w.as_str()))
        .collect()
}

// ===== BAILII page content validation =====

fn validate_bailii_has_content(html: &str) -> bool {
    let lower = html.to_lowercase();

    // Check for error indicators
    let error_phrases = [
        "page not found",
        "error 404",
        "no case found",
        "citation not found",
        "this page does not exist",
    ];
    for phrase in error_phrases {
        if lower[..std::cmp::min(1000, lower.len())].contains(phrase) {
            return false;
        }
    }

    // Must have substantial content
    if html.len() < 3000 {
        return false;
    }

    // Check for legal indicators
    let legal_indicators = [
        "judgment", "court", "justice", "appeal", "claimant", "defendant",
        "respondent", "appellant", "held", "ordered", "lordship", "honour",
        "tribunal",
    ];
    let matches = legal_indicators
        .iter()
        .filter(|ind| lower.contains(**ind))
        .count();

    matches >= 3
}

// ===== Tauri Commands =====

/// Check if multiple URLs exist (with content validation for BAILII)
#[tauri::command]
pub async fn check_urls_exist(urls: Vec<String>) -> Result<Vec<UrlCheckResult>, String> {
    let client = build_client(true)?;
    let mut results = Vec::new();

    for url_str in urls {
        if !is_domain_allowed(&url_str) {
            results.push(UrlCheckResult {
                url: url_str,
                exists: false,
                status_code: 403,
                title: None,
            });
            continue;
        }

        let result = check_single_url(&client, &url_str).await;
        results.push(result);
        rate_limit_pause().await;
    }

    Ok(results)
}

async fn check_single_url(client: &reqwest::Client, url_str: &str) -> UrlCheckResult {
    let resp = match client.get(url_str).send().await {
        Ok(r) => r,
        Err(_) => {
            return UrlCheckResult {
                url: url_str.to_string(),
                exists: false,
                status_code: 0,
                title: None,
            }
        }
    };

    let status = resp.status().as_u16();
    if status != 200 {
        return UrlCheckResult {
            url: url_str.to_string(),
            exists: false,
            status_code: status,
            title: None,
        };
    }

    let body = match resp.text().await {
        Ok(t) => t,
        Err(_) => {
            return UrlCheckResult {
                url: url_str.to_string(),
                exists: false,
                status_code: 0,
                title: None,
            }
        }
    };

    // BAILII-specific validation
    if url_str.contains("bailii.org") {
        if !validate_bailii_has_content(&body) {
            return UrlCheckResult {
                url: url_str.to_string(),
                exists: false,
                status_code: 404,
                title: None,
            };
        }
    }

    // FCL XML validation
    if url_str.ends_with(".xml") {
        let lower = body.to_lowercase();
        if !lower.contains("<akomantoso") && !lower.contains("<frbrwork") {
            return UrlCheckResult {
                url: url_str.to_string(),
                exists: false,
                status_code: 404,
                title: None,
            };
        }
    }

    // FCL HTML validation
    if url_str.contains("caselaw.nationalarchives.gov.uk") && !url_str.ends_with(".xml") {
        let lower = body.to_lowercase();
        if lower[..std::cmp::min(2000, lower.len())].contains("page not found")
            || body.len() < 5000
        {
            return UrlCheckResult {
                url: url_str.to_string(),
                exists: false,
                status_code: 404,
                title: None,
            };
        }
    }

    // Extract title
    let title_re = regex::Regex::new(r"(?i)<title[^>]*>(.*?)</title>").unwrap();
    let title = title_re
        .captures(&body[..std::cmp::min(5000, body.len())])
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| !s.is_empty());

    UrlCheckResult {
        url: url_str.to_string(),
        exists: true,
        status_code: 200,
        title,
    }
}

/// Resolve a citation to candidate URLs using the 5-strategy cascade
#[tauri::command]
pub async fn resolve_citation(
    citation: String,
    case_name: Option<String>,
) -> Result<CitationResolution, String> {
    let client_follow = build_client(true)?;
    let client_no_redirect = build_client(false)?;
    let mut candidates: Vec<ResolvedCandidate> = Vec::new();
    let mut attempts_log: Vec<String> = Vec::new();

    let extracted_name = case_name
        .clone()
        .or_else(|| extract_case_name(&citation));

    // === Strategy 1: Neutral citation → direct URL construction ===
    if let Some((code, bailii_url, fcl_url)) = try_neutral_citation_urls(&citation) {
        attempts_log.push(format!("Strategy 1: Neutral citation matched ({})", code));

        // Verify BAILII URL exists
        let bailii_check = check_single_url(&client_follow, &bailii_url).await;
        if bailii_check.exists {
            candidates.push(ResolvedCandidate {
                url: bailii_url.clone(),
                source: "bailii".to_string(),
                confidence: 0.95,
                title: bailii_check.title,
                resolution_method: "neutral_citation_bailii".to_string(),
            });
            attempts_log.push(format!("  → BAILII URL verified: {}", bailii_url));
        } else {
            attempts_log.push(format!("  → BAILII URL not found: {}", bailii_url));
        }

        rate_limit_pause().await;

        // Also try FCL
        let fcl_check = check_single_url(&client_follow, &fcl_url).await;
        if fcl_check.exists {
            candidates.push(ResolvedCandidate {
                url: fcl_url.clone(),
                source: "find_case_law".to_string(),
                confidence: 0.90,
                title: fcl_check.title,
                resolution_method: "neutral_citation_fcl".to_string(),
            });
            attempts_log.push(format!("  → FCL URL verified: {}", fcl_url));
        } else {
            attempts_log.push(format!("  → FCL URL not found: {}", fcl_url));
        }

        // If we found at least one via direct URL, we're done
        if !candidates.is_empty() {
            return Ok(CitationResolution {
                citation,
                case_name: extracted_name,
                candidates,
                status: "resolved".to_string(),
                attempts_log,
            });
        }
    }

    rate_limit_pause().await;

    // === Strategy 2: BAILII Citation Finder (302 redirect) ===
    attempts_log.push("Strategy 2: BAILII citation finder".to_string());
    if let Some(found) = try_bailii_citation_finder(&client_no_redirect, &citation).await {
        attempts_log.push(format!("  → Found via 302 redirect: {}", found.url));
        candidates.push(found);
        return Ok(CitationResolution {
            citation,
            case_name: extracted_name,
            candidates,
            status: "resolved".to_string(),
            attempts_log,
        });
    }
    attempts_log.push("  → No redirect (citation not recognised)".to_string());

    rate_limit_pause().await;

    // === Strategy 3: BAILII Title Search ===
    if let Some(ref name) = extracted_name {
        let search_terms = extract_party_search_terms(name);
        if !search_terms.is_empty() {
            let query = search_terms.join("+");
            attempts_log.push(format!(
                "Strategy 3: BAILII title search for: {}",
                search_terms.join(" ")
            ));

            let title_results = search_bailii_by_title(
                &client_follow,
                &query,
                "uk/cases+ew/cases+scot/cases+nie/cases+ie/cases",
            )
            .await;

            if !title_results.is_empty() {
                attempts_log.push(format!(
                    "  → Found {} result(s)",
                    title_results.len()
                ));
                for r in &title_results {
                    // Avoid duplicates
                    if !candidates.iter().any(|c| c.url == r.url) {
                        candidates.push(r.clone());
                    }
                }
            } else {
                attempts_log
                    .push("  → No title search results".to_string());
            }

            if !candidates.is_empty() {
                return Ok(CitationResolution {
                    citation,
                    case_name: extracted_name,
                    candidates,
                    status: "resolved".to_string(),
                    attempts_log,
                });
            }

            rate_limit_pause().await;
        }
    }

    // === Strategy 4: FCL Atom Feed Search ===
    if let Some(ref name) = extracted_name {
        let search_terms = extract_party_search_terms(name);
        if !search_terms.is_empty() {
            let query = search_terms.join(" ");
            attempts_log.push(format!("Strategy 4: FCL Atom search for: {}", query));

            let fcl_results = search_fcl(&client_follow, &query).await;
            if !fcl_results.is_empty() {
                attempts_log.push(format!(
                    "  → Found {} FCL result(s)",
                    fcl_results.len()
                ));
                for r in &fcl_results {
                    if !candidates.iter().any(|c| c.url == r.url) {
                        candidates.push(r.clone());
                    }
                }
            } else {
                attempts_log.push("  → No FCL results".to_string());
            }

            if !candidates.is_empty() {
                return Ok(CitationResolution {
                    citation,
                    case_name: extracted_name,
                    candidates,
                    status: "resolved".to_string(),
                    attempts_log,
                });
            }

            rate_limit_pause().await;
        }
    }

    // === Strategy 4b: FCL search by citation text (when no case name) ===
    if extracted_name.is_none() {
        attempts_log.push("Strategy 4b: FCL search by citation text".to_string());
        let fcl_results = search_fcl(&client_follow, &citation).await;
        if !fcl_results.is_empty() {
            attempts_log.push(format!(
                "  → Found {} FCL result(s)",
                fcl_results.len()
            ));
            for r in &fcl_results {
                if !candidates.iter().any(|c| c.url == r.url) {
                    candidates.push(r.clone());
                }
            }
        } else {
            attempts_log.push("  → No FCL results".to_string());
        }

        if !candidates.is_empty() {
            // Boost year-matching candidates before returning
            boost_year_matching_candidates(&mut candidates, &citation);
            return Ok(CitationResolution {
                citation,
                case_name: extracted_name,
                candidates,
                status: "resolved".to_string(),
                attempts_log,
            });
        }

        rate_limit_pause().await;
    }

    // === Strategy 5: BAILII Full-Text Search (widest net) ===
    // Include the year in the query for better precision
    let citation_year = extract_year(&citation);
    let fulltext_query = if let Some(ref name) = extracted_name {
        let terms = extract_party_search_terms(name);
        if !terms.is_empty() {
            // Add year to narrow results
            let mut q = terms.join(" ");
            if let Some(ref y) = citation_year {
                q.push(' ');
                q.push_str(y);
            }
            q
        } else {
            citation.clone()
        }
    } else {
        // Use the full citation text as-is — includes court code and number
        citation.clone()
    };

    if !fulltext_query.is_empty() {
        attempts_log.push(format!(
            "Strategy 5: BAILII full-text search for: {}",
            fulltext_query
        ));
        let ft_results = search_bailii_fulltext(
            &client_follow,
            &fulltext_query,
            "uk/cases+ew/cases+scot/cases+nie/cases",
        )
        .await;

        if !ft_results.is_empty() {
            attempts_log.push(format!(
                "  → Found {} full-text result(s)",
                ft_results.len()
            ));
            for r in &ft_results {
                if !candidates.iter().any(|c| c.url == r.url) {
                    candidates.push(r.clone());
                }
            }
        } else {
            attempts_log.push("  → No full-text results".to_string());
        }
    }

    // Boost candidates that match the citation year, penalise wrong years
    boost_year_matching_candidates(&mut candidates, &citation);

    let status = if candidates.is_empty() {
        "unresolvable".to_string()
    } else {
        "resolved".to_string()
    };

    Ok(CitationResolution {
        citation,
        case_name: extracted_name,
        candidates,
        status,
        attempts_log,
    })
}

/// Search BAILII by case name / party names
#[tauri::command]
pub async fn search_bailii_cases(query: String) -> Result<Vec<ResolvedCandidate>, String> {
    let client = build_client(true)?;
    let results = search_bailii_by_title(
        &client,
        &query,
        "uk/cases+ew/cases+scot/cases+nie/cases+ie/cases",
    )
    .await;
    Ok(results)
}

/// Search Find Case Law by query
#[tauri::command]
pub async fn search_fcl_cases(query: String) -> Result<Vec<ResolvedCandidate>, String> {
    let client = build_client(true)?;
    let results = search_fcl(&client, &query).await;
    Ok(results)
}

/// Fetch a judgment page (HTML or XML) from an allowed domain
#[tauri::command]
pub async fn fetch_judgment(url: String) -> Result<FetchedJudgment, String> {
    if !is_domain_allowed(&url) {
        return Err(format!(
            "URL domain not allowed. Only BAILII and Find Case Law URLs are permitted."
        ));
    }

    let client = build_client(true)?;
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch judgment: {}", e))?;

    let status = resp.status();
    let content_type = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("text/html")
        .to_string();

    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Extract title
    let title_re = regex::Regex::new(r"(?is)<title[^>]*>(.*?)</title>").unwrap();
    let title = title_re
        .captures(&body[..std::cmp::min(5000, body.len())])
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().trim().to_string())
        .filter(|s| !s.is_empty());

    Ok(FetchedJudgment {
        url,
        title,
        content_type,
        content: body,
        ok: status.is_success(),
    })
}

// ===== Authorities Storage =====

fn authorities_path(case_name: &str) -> Result<std::path::PathBuf, String> {
    let case_path = crate::path_safety::safe_case_path(case_name)?;
    Ok(case_path.join(".casekit").join("authorities.json"))
}

#[tauri::command]
pub fn save_authority(case_name: String, authority: Authority) -> Result<Vec<Authority>, String> {
    let path = authorities_path(&case_name)?;

    // Ensure .casekit directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Could not create .casekit directory: {}", e))?;
    }

    let mut authorities: Vec<Authority> = if path.exists() {
        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("Could not read authorities.json: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };

    // Replace if same ID exists, otherwise append
    if let Some(pos) = authorities.iter().position(|a| a.id == authority.id) {
        authorities[pos] = authority;
    } else {
        authorities.push(authority);
    }

    let json = serde_json::to_string_pretty(&authorities)
        .map_err(|e| format!("Could not serialise authorities: {}", e))?;
    std::fs::write(&path, &json)
        .map_err(|e| format!("Could not write authorities.json: {}", e))?;

    Ok(authorities)
}

#[tauri::command]
pub fn load_authorities(case_name: String) -> Result<Vec<Authority>, String> {
    let path = authorities_path(&case_name)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Could not read authorities.json: {}", e))?;
    let authorities: Vec<Authority> = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse authorities.json: {}", e))?;

    Ok(authorities)
}

#[tauri::command]
pub fn remove_authority(case_name: String, authority_id: String) -> Result<Vec<Authority>, String> {
    let path = authorities_path(&case_name)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Could not read authorities.json: {}", e))?;
    let mut authorities: Vec<Authority> = serde_json::from_str(&content)
        .map_err(|e| format!("Could not parse authorities.json: {}", e))?;

    authorities.retain(|a| a.id != authority_id);

    let json = serde_json::to_string_pretty(&authorities)
        .map_err(|e| format!("Could not serialise authorities: {}", e))?;
    std::fs::write(&path, &json)
        .map_err(|e| format!("Could not write authorities.json: {}", e))?;

    Ok(authorities)
}
