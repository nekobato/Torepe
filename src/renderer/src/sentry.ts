import * as Sentry from "@sentry/electron/renderer";
import type { App } from "vue";

export function initSentry(app: App<Element>): void {
  if (!__SENTRY_ENABLED__) return;

  Sentry.init({
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      graphQL: { document: false, variables: false },
      queues: false,
      stackFrameVariables: false,
    },
    beforeSendLog: () => null,
  });

  const currentErrorHandler = app.config.errorHandler;

  app.config.errorHandler = (error, instance, info) => {
    Sentry.withScope((scope) => {
      scope.setContext("vue", { info });
      Sentry.captureException(error);
    });

    currentErrorHandler?.(error, instance, info);
  };
}
