import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions';

const pkg = require('../../package.json');

let sdk: NodeSDK | null = null;

export function initTracer(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName = process.env.OTEL_SERVICE_NAME || 'talentnest-backend';

  if (!endpoint) {
    console.log('[Tracer] OpenTelemetry disabled — no OTEL_EXPORTER_OTLP_ENDPOINT set');
    return;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: pkg.version,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (request: any) => {
            const url = request?.url || '';
            return url === '/health' || url.startsWith('/metrics');
          },
        },
      }),
      ...(shouldInstrumentPrisma() ? [new (require('@prisma/instrumentation').PrismaInstrumentation)()] : []),
    ],
  });

  sdk.start();
  console.log(`[Tracer] OpenTelemetry started — exporting to ${endpoint}`);
}

function shouldInstrumentPrisma(): boolean {
  try {
    require.resolve('@prisma/instrumentation');
    return true;
  } catch {
    return false;
  }
}

export async function shutdownTracer(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log('[Tracer] OpenTelemetry shut down');
    } catch (err) {
      console.error('[Tracer] Shutdown error:', err);
    }
  }
}
