'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/my-library.cjs.prod.js')
} else {
  module.exports = require('./dist/my-library.cjs.js')
}
