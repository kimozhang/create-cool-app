interface Options {
  txt?: string
}

function init(options?: Options) {
  if (__TEST__) {
    console.log('test')
  }
  if (__DEV__) {
    console.log('development environment')
  }
  // to do something
  console.log('I am ready!')
}

export {
  init,
}
