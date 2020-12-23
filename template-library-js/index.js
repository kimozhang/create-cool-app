'use strict'

const path = require('path')
const name = path.basename(__dirname)

if (process.env.NODE_ENV === 'production') {
  module.exports = require(`./dist/${name}.cjs.prod.js`)
} else {
  module.exports = require(`./dist/${name}.cjs.js`)
}
