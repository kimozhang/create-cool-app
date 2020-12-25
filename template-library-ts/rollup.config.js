import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'

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

  const entryFile = 'src/index.ts'
  const isDevBuild = process.env.NODE_ENV !== 'production'
  const isGlobalBuild = /global/.test(format)

  if (isGlobalBuild) {
    output.name = pascalCase(name)
  }
  if (format === 'cjs') {
    output.exports = 'auto'
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
  const tsPlugin = ts({
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: false,
        declaration: true,
      },
      exclude: ['**/__tests__'],
    },
  })

  return {
    input: entryFile,
    external,
    output,
    plugins: [
      json(),
      createReplacePlugin(isDevBuild),
      tsPlugin,
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

function createReplacePlugin(isDevBuild) {
  return replace({
    __DEV__: isDevBuild,
    __TEST__: false,
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
