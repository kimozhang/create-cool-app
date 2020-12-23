import path from 'path'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

const packageDir = path.resolve(__dirname)
const name = path.basename(packageDir)
const resolve = (p) => path.resolve(packageDir, p)
const outputConfigs = {
  esm: {
    file: resolve(`dist/${name}.esm.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife',
  },
}
const pascalCase = (s) => {
  s = s.replace(/-(\w)/g, (_, m) => m.toUpperCase())
  return s[0].toUpperCase() + s.slice(1)
}
const packageFormats = Object.keys(outputConfigs)
const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format])
)

packageFormats.forEach((format) => {
  if (format === 'cjs') {
    packageConfigs.push(createProductionConfig(format))
  }

  if (/^global/.test(format)) {
    packageConfigs.push(createMinifiedConfig(format))
  }
})

export default packageConfigs

function createConfig(format, output, plugins = []) {
  output.externalLiveBindings = false

  const entryFile = 'src/index.js'
  const isTestBuild = process.env.NODE_ENV !== 'production'
  const isGlobalBuild = /global/.test(format)

  if (isGlobalBuild) {
    output.name = pascalCase(name)
  }

  const external = []
  const nodePlugins =
    format !== 'cjs'
      ? [
          require('@rollup/plugin-node-resolve').nodeResolve(),
          require('@rollup/plugin-commonjs')({
            sourceMap: false,
          }),
          require('rollup-plugin-node-builtins')(),
          require('rollup-plugin-node-globals')(),
        ]
      : []
  const babelPlugin = getBabelOutputPlugin({
    configFile: resolve('.babelrc'),
    allowAllFormats: true,
  })

  return {
    input: entryFile,
    external,
    output,
    plugins: [
      json(),
      createReplacePlugin(isTestBuild),
      babelPlugin,
      ...nodePlugins,
      ...plugins,
    ],
    onwarn(msg, warn) {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    },
  }
}

function createReplacePlugin(isTestBuild) {
  return replace({
    __DEV__: false,
    __TEST__: isTestBuild,
  })
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format,
  })
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser')

  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
      format: outputConfigs[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
        safari10: true,
      }),
    ]
  )
}
