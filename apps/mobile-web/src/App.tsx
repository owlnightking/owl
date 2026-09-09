import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { TabBar } from "./components/TabBar";
import { HomePage } from "./pages/HomePage";
import { MallPage } from "./pages/MallPage";
import { MessagePage } from "./pages/MessagePage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateRecognitionPage } from "./pages/CreateRecognitionPage";
import { MdDocsPage } from "./pages/MdDocsPage";
import { MdDocEditorPage } from "./pages/MdDocEditorPage";
import { MdDocPreviewPage } from "./pages/MdDocPreviewPage";

function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/create" element={<CreateRecognitionPage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/mall" element={<MallPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/md-docs" element={<MdDocsPage />} />
        <Route path="/md-docs/new" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/edit" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/preview" element={<MdDocPreviewPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <TabBar />
    </AuthGuard>
  );
}

export default App;
