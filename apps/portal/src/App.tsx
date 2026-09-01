import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { registerAllMicroApps } from "./micro-apps";

function MicroAppContainer() {
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      registerAllMicroApps();
    }
  }, []);

  return <div id="subapp-container" className="h-full" />;
}

function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/*" element={<MicroAppContainer />} />
          <Route path="/owl/*" element={<MicroAppContainer />} />
          <Route path="/cron/*" element={<MicroAppContainer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
}

export default App;
