import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: 'https://8e4ceb0e46f7eb0e110995f080ce384e@o4511165720100864.ingest.us.sentry.io/4511173356945408',
  environment: 'production',
  tracesSampleRate: 1.0
})
