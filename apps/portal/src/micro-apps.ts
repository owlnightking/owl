import { registerMicroApps, start } from "qiankun";

const isDev = import.meta.env.DEV;

function getEntry(_name: string, devPort: number, prodPath: string): string {
  if (isDev) {
    return `http://${window.location.hostname}:${devPort}${prodPath}`;
  }
  return prodPath;
}

const MICRO_APPS = [
  {
    name: "admin",
    entry: getEntry("admin", 5274, "/admin/"),
    container: "#subapp-container",
    activeRule: "/admin",
  },
  {
    name: "owl",
    entry: getEntry("owl", 5273, "/owl/"),
    container: "#subapp-container",
    activeRule: "/owl",
  },
  {
    name: "cron",
    entry: getEntry("cron", 5275, "/cron/"),
    container: "#subapp-container",
    activeRule: "/cron",
  },
];

export function registerAllMicroApps() {
  registerMicroApps(
    MICRO_APPS.map((app) => ({
      ...app,
      props: {
        routerBase: `/${app.name}`,
      },
    })),
    {
      beforeLoad: (app) => {
        console.warn("[portal] before load", app.name);
        return Promise.resolve();
      },
      afterMount: (app) => {
        console.warn("[portal] after mount", app.name);
        return Promise.resolve();
      },
    }
  );

  start({
    prefetch: false,
    sandbox: {
      experimentalStyleIsolation: true,
    },
  });
}
