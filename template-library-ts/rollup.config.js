import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'

const packageDir = path.resolve(__dirname)
const name = path.basename(packageDir)
const outputConfigs = {
  esm: {
    file: `dist/${name}.esm.js`,
    format: 'es',
  },
  cjs: {
    file: `dist/${name}.cjs.js`,
    format: 'cjs',
  },
  global: {
    file: `dist/${name}.global.js`,
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
  if (/^global/.test(format)) {
    packageConfigs.push(createMinifiedConfig(format))
  }
})

export default packageConfigs

function createConfig(format, output, plugins = []) {
  output.externalLiveBindings = false

  const entryFile = 'src/index.ts'
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
      createReplacePlugin(isTestBuild),
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

function createReplacePlugin(isTestBuild) {
  return replace({
    __DEV__: false,
    __TEST__: isTestBuild,
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
