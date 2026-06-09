import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const sentryDsn = env.VITE_SENTRY_DSN ?? "";
  const sentryEnabled = mode === "production" && sentryDsn.length > 0;
  const sentryDefines = {
    __SENTRY_DSN__: JSON.stringify(sentryDsn),
    __SENTRY_ENABLED__: JSON.stringify(sentryEnabled),
  };
  const externalizeDeps = externalizeDepsPlugin({
    exclude: ["@sentry/electron"],
  });

  return {
    main: {
      define: sentryDefines,
      plugins: [externalizeDeps],
    },
    preload: {
      define: sentryDefines,
      plugins: [externalizeDeps],
    },
    renderer: {
      define: sentryDefines,
      plugins: [vue()],
      resolve: {
        alias: {
          "@": resolve("src/renderer/src"),
        },
      },
    },
  };
});
