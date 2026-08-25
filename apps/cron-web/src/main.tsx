import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { renderWithQiankun, qiankunWindow, type QiankunProps } from "vite-plugin-qiankun/dist/helper";
import "@arco-design/web-react/dist/css/arco.css";
import "./index.css";
import App from "./App";

let root: ReactDOM.Root | null = null;

function render(props: QiankunProps) {
  const { container } = props;
  const dom = container ? container.querySelector("#root") : document.getElementById("root");

  if (!dom) {
    return;
  }

  root = ReactDOM.createRoot(dom);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={qiankunWindow.__POWERED_BY_QIANKUN__ ? "/cron" : "/"}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

renderWithQiankun({
  mount(props) {
    render(props);
  },
  bootstrap() {
    return Promise.resolve();
  },
  unmount() {
    root?.unmount();
    root = null;
  },
  update() {
    return Promise.resolve();
  },
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
}
