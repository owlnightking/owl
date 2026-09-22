import { createRoot } from "react-dom/client";
import "@arco-design/mobile-react/dist/style.css";
import "./index.css";
import { installSampleMock } from "./mock";
import { SampleListPage } from "../src/pages/SampleListPage";

installSampleMock();

createRoot(document.getElementById("root") as HTMLElement).render(<SampleListPage />);
