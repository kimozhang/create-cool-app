module.exports = {
  rootDir: __dirname,
  globals: {
    __DEV__: true,
    __TEST__: true,
  },
  testMatch: ['<rootDir>/**/__tests__/**/*spec.[jt]s?(x)'],
}
