export interface CaseMetadata {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    claimant_name: string;
    defendant_name: string;
    defendant_type: 'company' | 'individual' | 'sole_trader';
    description: string;
    claim_type: 'cra_goods' | 'cra_services' | 'cra_digital';
    product_service_type: 'goods' | 'services' | 'digital_content';
    issues: string[];
    desired_outcome: string[];
    claim_value: number;
    date_of_purchase: string | null;
    date_problem_discovered: string | null;
    date_first_complained: string | null;
    defendant_responded: boolean;
    defendant_response: string | null;
    status: CaseStatus;
    complexity_triggers: string[];
    overall_risk: 'within_scope' | 'borderline' | 'seek_advice';
    multiple_parties: boolean;
    cross_border: boolean;
    personal_injury: boolean;
    existing_proceedings: boolean;
    insolvency: boolean;
    regulatory_overlap: boolean;
    counterclaim: boolean;
}

export type CaseStatus =
    | 'intake'
    | 'pre_action'
    | 'adr'
    | 'issued'
    | 'served'
    | 'allocated'
    | 'hearing'
    | 'judgment'
    | 'closed';

export type DefendantType = 'company' | 'individual' | 'sole_trader';
export type ClaimType = 'cra_goods' | 'cra_services' | 'cra_digital';
export type ProductServiceType = 'goods' | 'services' | 'digital_content';
