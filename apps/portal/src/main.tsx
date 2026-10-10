import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// React 19 的 react-dom 不再导出 render/createRoot，缺此适配时 Arco 命令式组件（Notification/Message）调用即抛错
import "@arco-design/web-react/es/_util/react-19-adapter";
import "@arco-design/web-react/dist/css/arco.css";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
