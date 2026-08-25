import { registerMicroApps, start, prefetchApps } from "qiankun";

const MICRO_APPS = [
  {
    name: "admin",
    entry: "//localhost:5274",
    container: "#subapp-container",
    activeRule: "/admin",
  },
  {
    name: "owl",
    entry: "//localhost:5273",
    container: "#subapp-container",
    activeRule: "/owl",
  },
  {
    name: "cron",
    entry: "//localhost:5275",
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

  prefetchApps(
    MICRO_APPS.map((app) => ({
      name: app.name,
      entry: app.entry,
    }))
  );

  start({
    prefetch: true,
    sandbox: {
      experimentalStyleIsolation: true,
    },
  });
}
