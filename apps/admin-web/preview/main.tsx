import { createRoot } from "react-dom/client";
import "@arco-design/web-react/dist/css/arco.css";
import "./index.css";
import { installSampleMock } from "./mock";
import { SampleListPage } from "../src/pages/SampleListPage";

installSampleMock();

createRoot(document.getElementById("root") as HTMLElement).render(<SampleListPage />);
