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
      main: root('demo/main.js'),
    },
    output: {
      path: root('dist'),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
      ],
    },
    plugins: [
      new ESLintWebpackPlugin({
        files: ['src/**/*.js'],
      }),
      new webpack.DefinePlugin({
        __DEV__: devMode,
        __TEST__: devMode,
      }),
      new HTMLWebpackPlugin({
        template: root('demo/index.html'),
      }),
    ],
    devServer: {
      contentBase: [root('dist')],
      open: true,
      proxy: {},
    },
  }
}
