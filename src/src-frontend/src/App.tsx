import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ScrollToTop from './components/layout/ScrollToTop';

// Information pages (no case needed)
import LandingPage from './components/info/LandingPage';
import ReadThisFirst from './components/info/ReadThisFirst';

import UsefulLinks from './components/info/UsefulLinks';
import HowToSaveEmails from './components/info/HowToSaveEmails';
import Pricing from './components/info/Pricing';
import TechnicalOverview from './components/info/TechnicalOverview';
import RisksOfLitigation from './components/info/RisksOfLitigation';
import YourDataAndAi from './components/info/YourDataAndAi';
import ProceduralRoadmap from './components/procedure/ProceduralRoadmap';
import TemplateLibrary from './components/templates/TemplateLibrary';
import ReferralPanel from './components/common/ReferralPanel';

// Case management
import CaseOverview from './components/case/CaseOverview';
import DocumentLibrary from './components/documents/DocumentLibrary';
import ChronologyView from './components/chronology/ChronologyView';

// AI tools
import ApiKeySetup from './components/ai/ApiKeySetup';
import AiReviewPanel from './components/ai/AiReviewPanel';

// Export
import BundleExport from './components/export/BundleExport';

// Legal Research
import CitationAudit from './components/research/CitationAudit';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          {/* Information hub (accessible without a case) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/read-this-first" element={<ReadThisFirst />} />

          <Route path="/procedure" element={<ProceduralRoadmap />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/links" element={<UsefulLinks />} />
          <Route path="/help" element={<ReferralPanel />} />
          <Route path="/how-to-save-emails" element={<HowToSaveEmails />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/technical" element={<TechnicalOverview />} />
          <Route path="/risks" element={<RisksOfLitigation />} />
          <Route path="/your-data" element={<YourDataAndAi />} />

          {/* Case management */}
          <Route path="/cases" element={<CaseOverview />} />
          <Route path="/documents" element={<DocumentLibrary />} />
          <Route path="/chronology" element={<ChronologyView />} />

          {/* AI tools */}
          <Route path="/api-setup" element={<ApiKeySetup />} />
          <Route path="/ai-review" element={<AiReviewPanel />} />

          {/* Legal Research */}
          <Route path="/citation-audit" element={<CitationAudit />} />

          {/* Export */}
          <Route path="/export" element={<BundleExport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
