const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const ESLintWebpackPlugin = require('eslint-webpack-plugin')

const root = (pathname) => path.resolve(__dirname, pathname)

module.exports = (env) => {
  const devMode = env.NODE_ENV !== 'production'

  return {
    mode: env.NODE_ENV,
    devtool: devMode ? 'cheap-module-source-map' : false,
    entry: {
      main: root('demo/index.ts'),
    },
    output: {
      path: root('dist'),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[tj]s$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
      ],
    },
    plugins: [
      new ESLintWebpackPlugin({
        files: ['src/**/*.ts', 'demo/**/*.ts'],
      }),
      new webpack.DefinePlugin({
        __DEV__: devMode,
        __TEST__: devMode,
      }),
      new HTMLWebpackPlugin({
        template: root('demo/index.html'),
        inject: 'head',
        scriptLoading: 'blocking',
      }),
    ],
    devServer: {
      contentBase: [root('dist')],
      host: 'local.localhost.com',
      open: true,
      proxy: {},
    },
  }
}
