import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const testMode = process.env.NODE_ENV !== 'production'
const { name } = pkg
const banner =
  '/*!\n' +
  ` * ${name}.js v${pkg.version}\n` +
  ` * (c) 2020-${new Date().getFullYear()} ${pkg.author.split(' ')[0]} \n` +
  ' * Released under the MIT License.\n' +
  ' */'
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
  'global-prod': {
    file: `dist/${name}.global.min.js`,
    format: 'iife',
  },
}

const pascalCase = (s) => {
  s = s.replace(/-(\w)/g, (_, m) => m.toUpperCase())
  return s[0].toUpperCase() + s.slice(1)
}
const getPackageConfig = () => {
  return Object.entries(outputConfigs).map(([mod, output]) => {
    const isMini = /\.min\.js$/.test(output.file)
    const isGlobal = /global/.test(mod)
    const isCjs = /cjs/.test(mod)
    const plugins = [
      resolve(),
      json(),
      replace({
        __DEV__: false,
        __TEST__: testMode,
      }),
    ].concat(isMini ? terser() : [])

    if (isGlobal) output.name = pascalCase(name)
    if (isCjs) output.exports = 'auto'
    output.banner = banner

    return {
      input: 'src/index.js',
      output,
      plugins,
    }
  })
}

export default getPackageConfig()
