use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseMetadata {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub claimant_name: String,
    pub defendant_name: String,
    pub defendant_type: DefendantType,
    pub description: String,
    pub claim_type: ClaimType,
    pub product_service_type: ProductServiceType,
    pub issues: Vec<String>,
    pub desired_outcome: Vec<String>,
    pub claim_value: f64,
    pub date_of_purchase: Option<String>,
    pub date_problem_discovered: Option<String>,
    pub date_first_complained: Option<String>,
    pub defendant_responded: bool,
    pub defendant_response: Option<String>,
    pub status: CaseStatus,
    pub complexity_triggers: Vec<String>,
    pub overall_risk: String,
    pub multiple_parties: bool,
    pub cross_border: bool,
    pub personal_injury: bool,
    pub existing_proceedings: bool,
    pub insolvency: bool,
    pub regulatory_overlap: bool,
    pub counterclaim: bool,
    #[serde(default = "default_user_role")]
    pub user_role: UserRole,
}

fn default_user_role() -> UserRole {
    UserRole::Claimant
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DefendantType {
    #[serde(rename = "company")]
    Company,
    #[serde(rename = "individual")]
    Individual,
    #[serde(rename = "sole_trader")]
    SoleTrader,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClaimType {
    #[serde(rename = "cra_goods")]
    CraGoods,
    #[serde(rename = "cra_services")]
    CraServices,
    #[serde(rename = "cra_digital")]
    CraDigital,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProductServiceType {
    #[serde(rename = "goods")]
    Goods,
    #[serde(rename = "services")]
    Services,
    #[serde(rename = "digital_content")]
    DigitalContent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    #[serde(rename = "claimant")]
    Claimant,
    #[serde(rename = "defendant")]
    Defendant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaseStatus {
    #[serde(rename = "intake")]
    Intake,
    #[serde(rename = "pre_action")]
    PreAction,
    #[serde(rename = "adr")]
    ADR,
    #[serde(rename = "issued")]
    Issued,
    #[serde(rename = "served")]
    Served,
    #[serde(rename = "allocated")]
    Allocated,
    #[serde(rename = "hearing")]
    Hearing,
    #[serde(rename = "judgment")]
    Judgment,
    #[serde(rename = "closed")]
    Closed,
}

impl Default for CaseMetadata {
    fn default() -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            created_at: now.clone(),
            updated_at: now,
            claimant_name: String::new(),
            defendant_name: String::new(),
            defendant_type: DefendantType::Company,
            description: String::new(),
            claim_type: ClaimType::CraGoods,
            product_service_type: ProductServiceType::Goods,
            issues: Vec::new(),
            desired_outcome: Vec::new(),
            claim_value: 0.0,
            date_of_purchase: None,
            date_problem_discovered: None,
            date_first_complained: None,
            defendant_responded: false,
            defendant_response: None,
            status: CaseStatus::Intake,
            complexity_triggers: Vec::new(),
            overall_risk: "within_scope".to_string(),
            multiple_parties: false,
            cross_border: false,
            personal_injury: false,
            existing_proceedings: false,
            insolvency: false,
            regulatory_overlap: false,
            counterclaim: false,
            user_role: UserRole::Claimant,
        }
    }
}
