import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { TabBar } from "./components/TabBar";
import { HomePage } from "./pages/HomePage";
import { MallPage } from "./pages/MallPage";
import { MessagePage } from "./pages/MessagePage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/mall" element={<MallPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <TabBar />
    </AuthGuard>
  );
}

export default App;
