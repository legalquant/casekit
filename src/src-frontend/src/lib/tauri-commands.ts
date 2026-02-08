import { invoke } from '@tauri-apps/api/core';
import type { CaseMetadata } from '../types/case';
import type { DocumentEntry } from '../types/document';
import type { ChronologyEntry } from '../types/ai';

// Filesystem
export async function getBasePath(): Promise<string> {
    return invoke('get_base_path');
}

export async function ensureBaseDirectory(): Promise<string> {
    return invoke('ensure_base_directory');
}

// Case CRUD
export async function createCase(
    name: string,
    claimantName: string,
    defendantName: string,
    userRole: string
): Promise<CaseMetadata> {
    return invoke('create_case', { name, claimantName, defendantName, userRole });
}

export async function listCases(): Promise<CaseMetadata[]> {
    return invoke('list_cases');
}

export async function loadCase(caseName: string): Promise<CaseMetadata> {
    return invoke('load_case', { caseName });
}

export async function updateCase(
    caseName: string,
    metadata: CaseMetadata
): Promise<CaseMetadata> {
    return invoke('update_case', { caseName, metadata });
}

// Documents
export async function copyFileToCase(
    caseName: string,
    sourcePath: string,
    folder: string,
    filename: string
): Promise<string> {
    return invoke('copy_file_to_case', { caseName, sourcePath, folder, filename });
}

export async function listCaseFiles(caseName: string): Promise<string[]> {
    return invoke('list_case_files', { caseName });
}

export async function readFileText(
    caseName: string,
    relativePath: string
): Promise<string> {
    return invoke('read_file_text', { caseName, relativePath });
}

export async function addDocumentMetadata(
    caseName: string,
    document: DocumentEntry
): Promise<DocumentEntry[]> {
    return invoke('add_document_metadata', { caseName, document });
}

export async function removeDocumentMetadata(
    caseName: string,
    documentId: string
): Promise<DocumentEntry[]> {
    return invoke('remove_document_metadata', { caseName, documentId });
}

// Chronology
export async function buildChronology(
    caseName: string
): Promise<ChronologyEntry[]> {
    return invoke('build_chronology', { caseName });
}

export async function addChronologyEntry(
    caseName: string,
    entry: ChronologyEntry
): Promise<ChronologyEntry[]> {
    return invoke('add_chronology_entry', { caseName, entry });
}

export async function removeChronologyEntry(
    caseName: string,
    entryId: string
): Promise<ChronologyEntry[]> {
    return invoke('remove_chronology_entry', { caseName, entryId });
}

export async function updateChronologyEntry(
    caseName: string,
    entry: ChronologyEntry
): Promise<ChronologyEntry[]> {
    return invoke('update_chronology_entry', { caseName, entry });
}

// Export
export async function exportBundle(
    caseName: string,
    documentPaths: string[],
    exportPath: string
): Promise<string> {
    return invoke('export_bundle', { caseName, documentPaths, exportPath });
}

// Chronology scanning
export async function scanDocumentsForDates(
    caseName: string
): Promise<ChronologyEntry[]> {
    return invoke('scan_documents_for_dates', { caseName });
}

// Case deletion
export async function deleteCase(caseName: string): Promise<void> {
    return invoke('delete_case', { caseName });
}

// AI History
export interface AiHistoryRecord {
    id: string;
    callType: string;
    timestamp: string;
    inputTokens: number;
    outputTokens: number;
    model: string;
    response: string;
    summary?: string;
}

export async function saveAiCall(caseName: string, record: AiHistoryRecord): Promise<void> {
    return invoke('save_ai_call', { caseName, record });
}

export async function loadAiHistory(caseName: string): Promise<AiHistoryRecord[]> {
    return invoke('load_ai_history', { caseName });
}

// ===== Citation Resolution & Legal Research =====

import type {
    UrlCheckResult,
    ResolvedCandidate,
    CitationResolution,
    FetchedJudgment,
    Authority,
} from '../types/citation';

export async function checkUrlsExist(urls: string[]): Promise<UrlCheckResult[]> {
    return invoke('check_urls_exist', { urls });
}

export async function resolveCitation(
    citation: string,
    caseName?: string
): Promise<CitationResolution> {
    return invoke('resolve_citation', { citation, caseName: caseName || null });
}

export async function searchBailiiCases(query: string): Promise<ResolvedCandidate[]> {
    return invoke('search_bailii_cases', { query });
}

export async function searchFclCases(query: string): Promise<ResolvedCandidate[]> {
    return invoke('search_fcl_cases', { query });
}

export async function fetchJudgment(url: string): Promise<FetchedJudgment> {
    return invoke('fetch_judgment', { url });
}

export async function saveAuthority(
    caseName: string,
    authority: Authority
): Promise<Authority[]> {
    return invoke('save_authority', { caseName, authority });
}

export async function loadAuthorities(caseName: string): Promise<Authority[]> {
    return invoke('load_authorities', { caseName });
}

export async function removeAuthority(
    caseName: string,
    authorityId: string
): Promise<Authority[]> {
    return invoke('remove_authority', { caseName, authorityId });
}
