import * as Sentry from "@sentry/electron/main";

export function initSentry(): void {
  if (!__SENTRY_ENABLED__) return;

  Sentry.init({
    dsn: __SENTRY_DSN__,
    skipOpenTelemetrySetup: true,
  });
}
