module.exports = {
  apps: [{
    name: 'cloudedze-app',
    script: 'dist/index.js',
    cwd: '/Users/santoshgurudarbha/Desktop/cloudedze-backup-19-sept-0528',
    instances: 1,
    exec_mode: 'fork', // Use fork instead of cluster for better compatibility
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048', // Increase memory limit
    env: {
      NODE_ENV: 'production',
      PORT: 443,
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    log_file: '/Users/santoshgurudarbha/Desktop/cloudedze-backup-19-sept-0528/logs/combined.log',
    out_file: '/Users/santoshgurudarbha/Desktop/cloudedze-backup-19-sept-0528/logs/out.log',
    error_file: '/Users/santoshgurudarbha/Desktop/cloudedze-backup-19-sept-0528/logs/err.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
