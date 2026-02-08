/**
 * Tests for the useCase Zustand store — case CRUD, document management, chronology.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaseStore } from '../hooks/useCase';
import { mockInvoke } from './setup';
import type { CaseMetadata } from '../types/case';
import type { DocumentEntry } from '../types/document';
import type { ChronologyEntry } from '../types/ai';

// ── Fixtures ──

const MOCK_CASE: CaseMetadata = {
    id: 'case-1',
    name: 'Smith v Jones',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    claimant_name: 'John Smith',
    defendant_name: 'Jones Ltd',
    defendant_type: 'company',
    description: 'Faulty laptop',
    claim_type: 'cra_goods',
    product_service_type: 'goods',
    issues: ['faulty_goods'],
    desired_outcome: ['refund'],
    claim_value: 850,
    date_of_purchase: '2024-06-15',
    date_problem_discovered: '2024-07-01',
    date_first_complained: '2024-07-05',
    defendant_responded: true,
    defendant_response: 'Denied liability',
    status: 'pre_action',
    complexity_triggers: [],
    overall_risk: 'within_scope',
    multiple_parties: false,
    cross_border: false,
    personal_injury: false,
    existing_proceedings: false,
    insolvency: false,
    regulatory_overlap: false,
    counterclaim: false,
    user_role: 'claimant',
};

const MOCK_CASE_2: CaseMetadata = {
    ...MOCK_CASE,
    id: 'case-2',
    name: 'Brown v Green',
    claimant_name: 'Alice Brown',
    defendant_name: 'Green Services',
};

const MOCK_DOC: DocumentEntry = {
    id: 'doc-1',
    filename: 'receipt.pdf',
    path: '02/receipt.pdf',
    folder: '02',
    document_type: 'receipt',
    date: '2024-06-15',
    from: null,
    to: null,
    description: 'Laptop receipt',
    tags: [],
    extracted_text: 'Receipt for laptop purchase £849.99',
    added_at: '2025-01-01T00:00:00Z',
};

const MOCK_CHRON: ChronologyEntry = {
    id: 'chron-1',
    date: '2024-06-15',
    description: 'Laptop purchased from Jones Ltd',
    source: 'manual',
    significance: 'key',
};

// ── Helpers ──

function resetStore() {
    useCaseStore.setState({
        cases: [],
        currentCase: null,
        documents: [],
        chronology: [],
        loading: false,
        error: null,
    });
}

// ── Tests ──

describe('useCaseStore', () => {
    beforeEach(() => {
        resetStore();
    });

    describe('loadCases', () => {
        it('loads cases from backend', async () => {
            mockInvoke('ensure_base_directory', () => '/mock/path');
            mockInvoke('list_cases', () => [MOCK_CASE, MOCK_CASE_2]);

            await useCaseStore.getState().loadCases();

            const state = useCaseStore.getState();
            expect(state.cases).toHaveLength(2);
            expect(state.cases[0].name).toBe('Smith v Jones');
            expect(state.cases[1].name).toBe('Brown v Green');
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('sets error on failure', async () => {
            mockInvoke('ensure_base_directory', () => '/mock/path');
            mockInvoke('list_cases', () => { throw new Error('Disk error'); });

            await useCaseStore.getState().loadCases();

            const state = useCaseStore.getState();
            expect(state.error).toContain('Disk error');
            expect(state.loading).toBe(false);
        });
    });

    describe('createNewCase', () => {
        it('creates a case and sets it as current', async () => {
            mockInvoke('create_case', () => MOCK_CASE);
            mockInvoke('ensure_base_directory', () => '/mock/path');
            mockInvoke('list_cases', () => [MOCK_CASE]);

            const result = await useCaseStore.getState().createNewCase(
                'Smith v Jones', 'John Smith', 'Jones Ltd', 'claimant'
            );

            expect(result.name).toBe('Smith v Jones');
            const state = useCaseStore.getState();
            expect(state.currentCase).not.toBeNull();
            expect(state.currentCase?.name).toBe('Smith v Jones');
        });

        it('rejects empty fields', async () => {
            mockInvoke('create_case', () => { throw new Error('All fields are required'); });

            await expect(
                useCaseStore.getState().createNewCase('', '', '', 'claimant')
            ).rejects.toThrow();

            expect(useCaseStore.getState().error).toContain('required');
        });
    });

    describe('selectCase', () => {
        it('loads case data, documents, and chronology', async () => {
            mockInvoke('load_case', () => MOCK_CASE);
            mockInvoke('load_documents_index', () => [MOCK_DOC]);
            mockInvoke('build_chronology', () => [MOCK_CHRON]);

            await useCaseStore.getState().selectCase('Smith v Jones');

            const state = useCaseStore.getState();
            expect(state.currentCase?.name).toBe('Smith v Jones');
            // Documents and chronology load asynchronously
            await new Promise((r) => setTimeout(r, 50));
            const updatedState = useCaseStore.getState();
            expect(updatedState.documents).toHaveLength(1);
            expect(updatedState.chronology).toHaveLength(1);
        });
    });

    describe('clearCurrentCase', () => {
        it('clears case, documents, and chronology', () => {
            useCaseStore.setState({
                currentCase: MOCK_CASE,
                documents: [MOCK_DOC],
                chronology: [MOCK_CHRON],
            });

            useCaseStore.getState().clearCurrentCase();

            const state = useCaseStore.getState();
            expect(state.currentCase).toBeNull();
            expect(state.documents).toHaveLength(0);
            expect(state.chronology).toHaveLength(0);
        });
    });

    describe('deleteCase', () => {
        it('deletes case and clears current if it was selected', async () => {
            useCaseStore.setState({
                currentCase: MOCK_CASE,
                cases: [MOCK_CASE, MOCK_CASE_2],
            });

            mockInvoke('delete_case', () => undefined);
            mockInvoke('ensure_base_directory', () => '/mock/path');
            mockInvoke('list_cases', () => [MOCK_CASE_2]);

            await useCaseStore.getState().deleteCase('Smith v Jones');

            const state = useCaseStore.getState();
            expect(state.currentCase).toBeNull();
            expect(state.cases).toHaveLength(1);
            expect(state.cases[0].name).toBe('Brown v Green');
        });

        it('does not clear current case if different case is deleted', async () => {
            useCaseStore.setState({
                currentCase: MOCK_CASE,
                cases: [MOCK_CASE, MOCK_CASE_2],
            });

            mockInvoke('delete_case', () => undefined);
            mockInvoke('ensure_base_directory', () => '/mock/path');
            mockInvoke('list_cases', () => [MOCK_CASE]);

            await useCaseStore.getState().deleteCase('Brown v Green');

            expect(useCaseStore.getState().currentCase?.name).toBe('Smith v Jones');
        });
    });

    describe('document management', () => {
        beforeEach(() => {
            useCaseStore.setState({ currentCase: MOCK_CASE });
        });

        it('adds a document', async () => {
            mockInvoke('add_document_metadata', () => [MOCK_DOC]);

            await useCaseStore.getState().addDocument(MOCK_DOC);

            expect(useCaseStore.getState().documents).toHaveLength(1);
            expect(useCaseStore.getState().documents[0].filename).toBe('receipt.pdf');
        });

        it('removes a document', async () => {
            useCaseStore.setState({ documents: [MOCK_DOC] });
            mockInvoke('remove_document_metadata', () => []);

            await useCaseStore.getState().removeDocument('doc-1');

            expect(useCaseStore.getState().documents).toHaveLength(0);
        });

        it('does nothing without a current case', async () => {
            useCaseStore.setState({ currentCase: null });

            await useCaseStore.getState().addDocument(MOCK_DOC);

            expect(useCaseStore.getState().documents).toHaveLength(0);
        });
    });

    describe('chronology management', () => {
        beforeEach(() => {
            useCaseStore.setState({ currentCase: MOCK_CASE });
        });

        it('adds a chronology entry', async () => {
            mockInvoke('add_chronology_entry', () => [MOCK_CHRON]);

            await useCaseStore.getState().addChronologyEntry(MOCK_CHRON);

            expect(useCaseStore.getState().chronology).toHaveLength(1);
        });

        it('removes a chronology entry', async () => {
            useCaseStore.setState({ chronology: [MOCK_CHRON] });
            mockInvoke('remove_chronology_entry', () => []);

            await useCaseStore.getState().removeChronologyEntry('chron-1');

            expect(useCaseStore.getState().chronology).toHaveLength(0);
        });

        it('updates a chronology entry', async () => {
            const updated = { ...MOCK_CHRON, description: 'Updated description' };
            useCaseStore.setState({ chronology: [MOCK_CHRON] });
            mockInvoke('update_chronology_entry', () => [updated]);

            await useCaseStore.getState().updateChronologyEntry(updated);

            expect(useCaseStore.getState().chronology[0].description).toBe('Updated description');
        });

        it('scans documents for dates', async () => {
            const scanned: ChronologyEntry[] = [
                { id: 'scan-1', date: '2024-06-15', description: 'Purchase', source: 'document', significance: 'key' },
                { id: 'scan-2', date: '2024-07-01', description: 'Problem', source: 'document', significance: 'supporting' },
            ];
            mockInvoke('scan_documents_for_dates', () => scanned);

            const results = await useCaseStore.getState().scanDocumentsForDates();

            expect(results).toHaveLength(2);
            expect(results[0].date).toBe('2024-06-15');
        });
    });
});
