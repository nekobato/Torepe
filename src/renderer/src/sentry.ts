import * as Sentry from "@sentry/electron/renderer";
import type { App } from "vue";

export function initSentry(app: App<Element>): void {
  if (!__SENTRY_ENABLED__) return;

  Sentry.init();

  const currentErrorHandler = app.config.errorHandler;

  app.config.errorHandler = (error, instance, info) => {
    Sentry.withScope((scope) => {
      scope.setContext("vue", { info });
      Sentry.captureException(error);
    });

    currentErrorHandler?.(error, instance, info);
  };
}
