// Browsersync options: https://www.browsersync.io/docs/options

const { createProxyMiddleware } = require('http-proxy-middleware')
const proxyTable = {
  '/api': {
    target: 'http://api.domain.com',
    changeOrigin: true,
  },
}

const proxyMiddlewares = Object.keys(proxyTable)
  .map(key => createProxyMiddleware(key, proxyTable[key]))

module.exports = {
  // host: 'local.domain.com',
  // open: 'external',
  server: {
    baseDir: './html',
    middleware: [ ...proxyMiddlewares ],
    directory: true
  },
  watch: true,
  notify: false,
}
