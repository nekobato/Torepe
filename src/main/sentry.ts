import * as Sentry from "@sentry/electron/main";

export function initSentry(): void {
  if (!__SENTRY_ENABLED__) return;

  Sentry.init({
    dsn: __SENTRY_DSN__,
    enableOpenTelemetrySetup: false,
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
}
