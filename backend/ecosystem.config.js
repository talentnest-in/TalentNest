module.exports = {
  apps: [
    {
      name: 'talentnest-api',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // ── Graceful Shutdown ──────────────────────────────────────────
      kill_timeout: 10000,
      listen_timeout: 15000,
      shutdown_with_message: true,
      // ── Memory Management ──────────────────────────────────────────
      max_memory_restart: '1G',
      // ── Logging ────────────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      combine_logs: true,
      merge_logs: true,
      // ── Watch & Reload ─────────────────────────────────────────────
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      min_uptime: '30s',
      // ── Environment Variables ─────────────────────────────────────
      node_args: '--max-old-space-size=1024',
    },
  ],
};
