import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { HomePage } from "./pages/HomePage";
import { registerAllMicroApps } from "./micro-apps";

function MicroAppContainer() {
  return <div id="subapp-container" className="h-full" />;
}

function App() {
  useEffect(() => {
    registerAllMicroApps();
  }, []);

  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/admin/*" element={<MicroAppContainer />} />
        <Route path="/owl/*" element={<MicroAppContainer />} />
        <Route path="/cron/*" element={<MicroAppContainer />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthGuard>
  );
}

export default App;
