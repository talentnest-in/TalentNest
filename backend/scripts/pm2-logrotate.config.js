// ── PM2 Log Rotation Configuration ──────────────────────────────────
// Install: pm2 install pm2-logrotate
// Apply:   pm2 set pm2-logrotate:rotate_module true

module.exports = {
  // Max size of a log file before rotation (10MB)
  max_size: '10M',
  // Retain 10 rotated files per app
  retain: 10,
  // Compress rotated files with gzip
  compress: true,
  // Rotate logs every day regardless of size (at midnight)
  rotateInterval: '0 0 * * *',
  // Rotate on PM2 startup
  rotateOnStart: true,
};
