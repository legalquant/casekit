export interface DocumentEntry {
    id: string;
    filename: string;
    path: string;
    folder: '01' | '02' | '03' | '04' | '05';
    document_type: DocumentType;
    date: string | null;
    from: string | null;
    to: string | null;
    description: string;
    tags: string[];
    extracted_text: string | null;
    added_at: string;
}

export type DocumentType =
    | 'receipt'
    | 'letter'
    | 'email'
    | 'photo'
    | 'contract'
    | 'warranty'
    | 'court_form'
    | 'order'
    | 'other';

export const FOLDER_NAMES: Record<string, string> = {
    '01': 'Correspondence',
    '02': 'Evidence',
    '03': 'Legal',
    '04': 'Court',
    '05': 'Bundle',
};

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'receipt', label: 'Receipt' },
    { value: 'letter', label: 'Letter' },
    { value: 'email', label: 'Email' },
    { value: 'photo', label: 'Photo' },
    { value: 'contract', label: 'Contract' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'court_form', label: 'Court Form' },
    { value: 'order', label: 'Court Order' },
    { value: 'other', label: 'Other' },
];
