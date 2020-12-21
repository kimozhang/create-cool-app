import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import tsPlugin from 'rollup-plugin-typescript2'
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
    const plugins = [
      resolve(),
      replace({
        __DEV__: false,
        __TEST__: testMode,
      }),
      tsPlugin({ useTsconfigDeclarationDir: true }),
      isMini ? terser() : null,
    ]

    output.banner = banner
    if (mod === 'cjs') output.exports = 'auto'
    if (isGlobal) output.name = pascalCase(name)

    return {
      input: 'src/index.ts',
      output,
      plugins,
    }
  })
}

export default getPackageConfig()
