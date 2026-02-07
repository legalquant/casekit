use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentEntry {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub folder: String,
    pub document_type: DocumentType,
    pub date: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub description: String,
    pub tags: Vec<String>,
    pub extracted_text: Option<String>,
    pub added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentType {
    #[serde(rename = "receipt")]
    Receipt,
    #[serde(rename = "letter")]
    Letter,
    #[serde(rename = "email")]
    Email,
    #[serde(rename = "photo")]
    Photo,
    #[serde(rename = "contract")]
    Contract,
    #[serde(rename = "warranty")]
    Warranty,
    #[serde(rename = "court_form")]
    CourtForm,
    #[serde(rename = "order")]
    Order,
    #[serde(rename = "other")]
    Other,
}

impl Default for DocumentEntry {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            filename: String::new(),
            path: String::new(),
            folder: "02".to_string(),
            document_type: DocumentType::Other,
            date: None,
            from: None,
            to: None,
            description: String::new(),
            tags: Vec::new(),
            extracted_text: None,
            added_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}
