const path = require('path')
const execa = require('execa')
const chalk = require('chalk')
const args = require('minimist')(process.argv.slice(2))

const run = (bin, args, opts) => execa(bin, args, { stdio: 'inherit', ...opts })
const step = msg => console.log(chalk.bold.yellow(msg))

run().catch(console.error)

async function run() {
  const env = args.e || args.env || 'production'
  const target = path.basename(process.cwd())
  const dist = 'dist'

  step(`\nremoving ${dist} directory...`)
  await run('rimraf', [dist])

  step(`\nRolling up for ${target}...`)
  await run(
    'rollup',
    ['-c', '--environment', [`NODE_ENV:${env}`].join(',')]
  )
}
