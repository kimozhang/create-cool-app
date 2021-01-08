const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const ESLintWebpackPlugin = require('eslint-webpack-plugin')

const root = pathname => path.join(__dirname, pathname)
const getDirName = file => file.match(/pages\/(.+?)\//)[1]
const getEntry = () => {
  return glob
    .sync('./pages/*/app.js')
    .reduce((entry, file) => {
      const dirName = getDirName(file)
      entry[dirName] = file
      return entry
    }, {})
}
const createHTMLPlugin = () => {
  return glob
    .sync('./pages/*/index.html')
    .map(file => {
      const dirName = getDirName(file)
      return new HTMLWebpackPlugin({
        template: root(file),
        filename: `${dirName}/index.html`,
        chunks: [dirName],
      })
    })
}

module.exports = (env) => {
  const devMode = env.NODE_ENV !== 'production'

  return {
    mode: env.NODE_ENV,
    devtool: devMode ? 'cheap-module-source-map' : false,
    entry: getEntry(),
    output: {
      path: root('dist'),
      filename: '[name]/js/[name].js',
    },
    resolve: {
      extensions: ['.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          },
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new ESLintWebpackPlugin({
        files: ['pages/**/*.js'],
      }),
      new webpack.DefinePlugin({
        __DEV__: devMode,
      }),
      ...createHTMLPlugin(),
    ],
    devServer: {
      contentBase: [root('dist')],
      open: true,
      proxy: {},
    },
  }
}
