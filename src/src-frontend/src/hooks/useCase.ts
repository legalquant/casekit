import { create } from 'zustand';
import type { CaseMetadata } from '../types/case';
import type { DocumentEntry } from '../types/document';
import type { ChronologyEntry } from '../types/ai';
import * as commands from '../lib/tauri-commands';

interface CaseStore {
    // State
    cases: CaseMetadata[];
    currentCase: CaseMetadata | null;
    documents: DocumentEntry[];
    chronology: ChronologyEntry[];
    loading: boolean;
    error: string | null;

    // Actions
    loadCases: () => Promise<void>;
    selectCase: (caseName: string) => Promise<void>;
    createNewCase: (name: string, claimantName: string, defendantName: string) => Promise<CaseMetadata>;
    updateCurrentCase: (metadata: CaseMetadata) => Promise<void>;
    clearCurrentCase: () => void;
    setError: (error: string | null) => void;

    // Documents
    loadDocuments: () => Promise<void>;
    addDocument: (doc: DocumentEntry) => Promise<void>;
    removeDocument: (docId: string) => Promise<void>;

    // Chronology
    loadChronology: () => Promise<void>;
    addChronologyEntry: (entry: ChronologyEntry) => Promise<void>;
    removeChronologyEntry: (entryId: string) => Promise<void>;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
    cases: [],
    currentCase: null,
    documents: [],
    chronology: [],
    loading: false,
    error: null,

    loadCases: async () => {
        try {
            set({ loading: true, error: null });
            await commands.ensureBaseDirectory();
            const cases = await commands.listCases();
            set({ cases, loading: false });
        } catch (e) {
            set({ error: String(e), loading: false });
        }
    },

    selectCase: async (caseName: string) => {
        try {
            set({ loading: true, error: null });
            const caseData = await commands.loadCase(caseName);
            set({ currentCase: caseData, loading: false });
            // Also load documents and chronology
            get().loadDocuments();
            get().loadChronology();
        } catch (e) {
            set({ error: String(e), loading: false });
        }
    },

    createNewCase: async (name: string, claimantName: string, defendantName: string) => {
        try {
            set({ loading: true, error: null });
            const newCase = await commands.createCase(name, claimantName, defendantName);
            set({ currentCase: newCase, loading: false });
            await get().loadCases();
            return newCase;
        } catch (e) {
            set({ error: String(e), loading: false });
            throw e;
        }
    },

    updateCurrentCase: async (metadata: CaseMetadata) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const updated = await commands.updateCase(currentCase.name, metadata);
            set({ currentCase: updated });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    clearCurrentCase: () => {
        set({ currentCase: null, documents: [], chronology: [] });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    // Documents — loaded from Tauri backend
    loadDocuments: async () => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            // Documents are stored in documents.json, loaded by the backend
            // For now, we read it via the load_case flow — documents.json is external
            // We'll add a dedicated command later; for now use what we have
            set({ documents: [] }); // Placeholder
        } catch (e) {
            set({ error: String(e) });
        }
    },

    addDocument: async (doc: DocumentEntry) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const updated = await commands.addDocumentMetadata(currentCase.name, doc);
            set({ documents: updated });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    removeDocument: async (docId: string) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const updated = await commands.removeDocumentMetadata(currentCase.name, docId);
            set({ documents: updated });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    loadChronology: async () => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const entries = await commands.buildChronology(currentCase.name);
            set({ chronology: entries });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    addChronologyEntry: async (entry: ChronologyEntry) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const updated = await commands.addChronologyEntry(currentCase.name, entry);
            set({ chronology: updated });
        } catch (e) {
            set({ error: String(e) });
        }
    },

    removeChronologyEntry: async (entryId: string) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        try {
            const updated = await commands.removeChronologyEntry(currentCase.name, entryId);
            set({ chronology: updated });
        } catch (e) {
            set({ error: String(e) });
        }
    },
}));
