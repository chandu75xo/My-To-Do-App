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

const GRAFANA_INSTANCE_ID = '1629463';
const GRAFANA_TOKEN = import.meta.env.VITE_GRAFANA_TOKEN;

const exporter = new OTLPTraceExporter({
  url: 'https://tempo-prod-19-prod-ap-south-1.grafana.net/v1/traces',
  headers: {
    Authorization: 'Basic ' + btoa(`${GRAFANA_INSTANCE_ID}:${GRAFANA_TOKEN}`),
    'X-Scope-OrgID': GRAFANA_INSTANCE_ID,
  },
});

const provider = new WebTracerProvider({
  resource: {
    attributes: {
      'service.name': 'done-todoapp-frontend',
      'service.version': '1.0.0',
      'deployment.environment': 'production',
    },
  },
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

provider.register({
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-fetch': {
        enabled: true,
        propagateTraceHeaderCorsUrls: [
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