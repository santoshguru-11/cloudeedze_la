module.exports = {
  apps: [{
    name: 'cloudedze',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
