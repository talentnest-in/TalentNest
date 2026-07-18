// Grafana dashboard provisioning configurations
// These JSON definitions can be imported into Grafana via provisioning API
// or the Grafana UI dashboard import feature.

export const DASHBOARDS = {
  INFRASTRUCTURE: 'talentnest-infrastructure',
  API: 'talentnest-api',
  QUEUE: 'talentnest-queue',
  REDIS: 'talentnest-redis',
  DATABASE: 'talentnest-database',
  AUTH: 'talentnest-auth',
  BUSINESS: 'talentnest-business',
};

export const GRAFANA_DATASOURCE_UID = process.env.GRAFANA_DATASOURCE_UID || 'prometheus';

export const infrastructureDashboard = {
  uid: DASHBOARDS.INFRASTRUCTURE,
  title: 'TalentNest — Infrastructure',
  tags: ['talentnest', 'infrastructure'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'CPU Usage',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'rate(process_cpu_user_seconds_total{job="talentnest-api"}[1m])',
          legendFormat: 'CPU User',
        },
        {
          expr: 'rate(process_cpu_system_seconds_total{job="talentnest-api"}[1m])',
          legendFormat: 'CPU System',
        },
      ],
      gridPos: { h: 8, w: 8, x: 0, y: 0 },
    },
    {
      title: 'Memory Usage',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'talentnest_app_info',
          legendFormat: 'App Info',
        },
        {
          expr: 'process_resident_memory_bytes{job="talentnest-api"}',
          legendFormat: 'RSS',
        },
        {
          expr: 'process_heap_bytes{job="talentnest-api"}',
          legendFormat: 'Heap',
        },
      ],
      gridPos: { h: 8, w: 8, x: 8, y: 0 },
    },
    {
      title: 'Active Connections',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'talentnest_active_connections{job="talentnest-api"}',
          legendFormat: 'HTTP Connections',
        },
      ],
      gridPos: { h: 8, w: 8, x: 16, y: 0 },
    },
  ],
};

export const apiDashboard = {
  uid: DASHBOARDS.API,
  title: 'TalentNest — API',
  tags: ['talentnest', 'api'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Request Rate',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'rate(talentnest_http_requests_total{job="talentnest-api"}[5m])',
          legendFormat: '{{method}} {{route}}',
        },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
    },
    {
      title: 'P99 Latency',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'histogram_quantile(0.99, rate(talentnest_http_request_duration_seconds_bucket{job="talentnest-api"}[5m]))',
          legendFormat: 'P99 {{method}} {{route}}',
        },
      ],
      gridPos: { h: 8, w: 12, x: 12, y: 0 },
    },
    {
      title: 'HTTP Status Codes',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'rate(talentnest_http_requests_total{job="talentnest-api", status_code=~"5.."}[5m])',
          legendFormat: '5xx',
        },
        {
          expr: 'rate(talentnest_http_requests_total{job="talentnest-api", status_code=~"4.."}[5m])',
          legendFormat: '4xx',
        },
        {
          expr: 'rate(talentnest_http_requests_total{job="talentnest-api", status_code=~"2.."}[5m])',
          legendFormat: '2xx',
        },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 8 },
    },
  ],
};

export const queueDashboard = {
  uid: DASHBOARDS.QUEUE,
  title: 'TalentNest — Queue',
  tags: ['talentnest', 'queue'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Queue Length (Waiting)',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_queue_waiting{job="talentnest-api"}', legendFormat: '{{queue}}' },
      ],
      gridPos: { h: 8, w: 8, x: 0, y: 0 },
    },
    {
      title: 'Active Jobs',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_queue_active{job="talentnest-api"}', legendFormat: '{{queue}}' },
      ],
      gridPos: { h: 8, w: 8, x: 8, y: 0 },
    },
    {
      title: 'Failed Jobs',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_queue_failed{job="talentnest-api"}', legendFormat: '{{queue}}' },
      ],
      gridPos: { h: 8, w: 8, x: 16, y: 0 },
    },
    {
      title: 'Job Throughput',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_queue_completed_total{job="talentnest-api"}[5m])', legendFormat: '{{queue}} Completed' },
        { expr: 'rate(talentnest_queue_failed_total{job="talentnest-api"}[5m])', legendFormat: '{{queue}} Failed' },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 8 },
    },
  ],
};

export const redisDashboard = {
  uid: DASHBOARDS.REDIS,
  title: 'TalentNest — Redis',
  tags: ['talentnest', 'redis'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Redis Operations',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_redis_operations_total{job="talentnest-api"}[5m])', legendFormat: '{{operation}}' },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
    },
    {
      title: 'Cache Hit Ratio',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        {
          expr: 'rate(talentnest_cache_hits_total{type="hit", job="talentnest-api"}[5m]) / (rate(talentnest_cache_hits_total{job="talentnest-api"}[5m]) + 0.001)',
          legendFormat: 'Hit Ratio',
        },
      ],
      gridPos: { h: 8, w: 12, x: 12, y: 0 },
    },
    {
      title: 'Redis Connected',
      type: 'stat',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_redis_connected{job="talentnest-api"}' },
      ],
      gridPos: { h: 4, w: 4, x: 0, y: 8 },
    },
  ],
};

export const databaseDashboard = {
  uid: DASHBOARDS.DATABASE,
  title: 'TalentNest — Database',
  tags: ['talentnest', 'database'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Query Duration (P50)',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'histogram_quantile(0.5, rate(talentnest_db_query_duration_seconds_bucket[5m]))', legendFormat: '{{model}} {{operation}}' },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
    },
    {
      title: 'Query Duration (P99)',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'histogram_quantile(0.99, rate(talentnest_db_query_duration_seconds_bucket[5m]))', legendFormat: '{{model}} {{operation}}' },
      ],
      gridPos: { h: 8, w: 12, x: 12, y: 0 },
    },
    {
      title: 'DB Health',
      type: 'stat',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_database_connected{job="talentnest-api"}' },
      ],
      gridPos: { h: 4, w: 4, x: 0, y: 8 },
    },
  ],
};

export const authDashboard = {
  uid: DASHBOARDS.AUTH,
  title: 'TalentNest — Authentication',
  tags: ['talentnest', 'auth'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Login Rate',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_auth_logins_total{job="talentnest-api"}[5m])', legendFormat: 'Success' },
      ],
      gridPos: { h: 8, w: 8, x: 0, y: 0 },
    },
    {
      title: 'Registration Rate',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_auth_registrations_total{job="talentnest-api"}[5m])', legendFormat: 'Registrations' },
      ],
      gridPos: { h: 8, w: 8, x: 8, y: 0 },
    },
    {
      title: 'Auth Failures',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_auth_failures_total{job="talentnest-api"}[5m])', legendFormat: '{{reason}}' },
      ],
      gridPos: { h: 8, w: 8, x: 16, y: 0 },
    },
  ],
};

export const businessDashboard = {
  uid: DASHBOARDS.BUSINESS,
  title: 'TalentNest — Business Metrics',
  tags: ['talentnest', 'business'],
  timezone: 'browser',
  editable: true,
  panels: [
    {
      title: 'Active Users',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_active_users{job="talentnest-api"}', legendFormat: 'Active Users' },
      ],
      gridPos: { h: 8, w: 8, x: 0, y: 0 },
    },
    {
      title: 'Socket Connections',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'talentnest_socket_connections{job="talentnest-api"}', legendFormat: 'Socket Connections' },
      ],
      gridPos: { h: 8, w: 8, x: 8, y: 0 },
    },
    {
      title: 'Jobs Posted',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_jobs_posted_total{job="talentnest-api"}[1d])', legendFormat: 'Jobs/Day' },
      ],
      gridPos: { h: 8, w: 8, x: 16, y: 0 },
    },
    {
      title: 'Applications Submitted',
      type: 'timeseries',
      datasource: { uid: GRAFANA_DATASOURCE_UID },
      targets: [
        { expr: 'rate(talentnest_applications_total{job="talentnest-api"}[1d])', legendFormat: 'Apps/Day' },
      ],
      gridPos: { h: 8, w: 12, x: 0, y: 8 },
    },
  ],
};

// Export all dashboards for bulk provisioning
export const allDashboards = [
  infrastructureDashboard,
  apiDashboard,
  queueDashboard,
  redisDashboard,
  databaseDashboard,
  authDashboard,
  businessDashboard,
];
