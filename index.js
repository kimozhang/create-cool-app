#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))

async function init() {
  console.log(argv)
}

init().catch(console.error)
