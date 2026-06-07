// ============================================================
// Grafana Faro — done-todoapp frontend
// Add "import './tracing'" as the FIRST line in src/main.jsx
// Faro key is public-safe, no need for env vars
// ============================================================

import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

initializeFaro({
  url: "https://faro-collector-prod-ap-south-1.grafana.net/collect/507dc396572937a73cde42db766b8a94",
  app: {
    name: "done-todoapp-frontend",
    version: "1.0.0",
    environment: "production",
  },
  instrumentations: [
    ...getWebInstrumentations({
      captureConsole: true,
      captureConsoleDisabledLevels: [],
    }),
    new TracingInstrumentation(),
  ],
});
