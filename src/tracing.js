// ============================================================
// OpenTelemetry Browser Tracing — done-todoapp frontend
// Add "import './tracing'" as the FIRST line in src/main.jsx
// ============================================================

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// ── Trace exporter → your Alloy on Tailscale ──────────────
const exporter = new OTLPTraceExporter({
  url: 'http://100.91.128.68:4321/v1/traces',
});

// ── Provider with service metadata ────────────────────────
const provider = new WebTracerProvider({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'done-todoapp-frontend',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
    'deployment.environment': 'production',
  }),
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

provider.register({
  contextManager: new ZoneContextManager(),
});

// ── Auto-instrument fetch, XHR, page load, user clicks ────
registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-fetch': {
        enabled: true,
        propagateTraceHeaderCorsUrls: [
          // Add your Render backend URL here so trace IDs link frontend → backend
          /https:\/\/.*\.onrender\.com/,
        ],
      },
      '@opentelemetry/instrumentation-xml-http-request': {
        enabled: true,
        propagateTraceHeaderCorsUrls: [/https:\/\/.*\.onrender\.com/],
      },
      '@opentelemetry/instrumentation-document-load': { enabled: true },
      '@opentelemetry/instrumentation-user-interaction': {
        enabled: true,
        eventNames: ['click', 'submit', 'change'],
      },
    }),
  ],
});

console.debug('[OTEL] Browser tracing initialised → done-todoapp-frontend');
