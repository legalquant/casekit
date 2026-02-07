use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChronologyEntry {
    pub id: String,
    pub date: String,
    pub description: String,
    pub source: ChronologySource,
    pub document_id: Option<String>,
    /// Relative path to the source document within the case folder (e.g. "01_Correspondence/email.pdf")
    pub source_document_path: Option<String>,
    pub significance: Significance,
    /// AI confidence level: "high", "medium", "low", or None for manual entries
    pub confidence: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChronologySource {
    #[serde(rename = "document")]
    Document,
    #[serde(rename = "intake")]
    Intake,
    #[serde(rename = "manual")]
    Manual,
    #[serde(rename = "ai_extracted")]
    AiExtracted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Significance {
    #[serde(rename = "key")]
    Key,
    #[serde(rename = "supporting")]
    Supporting,
    #[serde(rename = "background")]
    Background,
}

impl Default for ChronologyEntry {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            date: String::new(),
            description: String::new(),
            source: ChronologySource::Manual,
            document_id: None,
            source_document_path: None,
            significance: Significance::Supporting,
            confidence: None,
        }
    }
}
