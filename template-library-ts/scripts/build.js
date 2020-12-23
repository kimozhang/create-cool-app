const path = require('path')
const execa = require('execa')
const rollup = require('rollup')
const chalk = require('chalk')
const args = require('minimist')(process.argv.slice(2))

run().catch(console.error)

async function run() {
  const env = args.env || args.e || 'production'
  const target = path.basename(process.cwd())
  const dist = 'dist'

  console.log()
  console.log(chalk.bold(chalk.yellow(`removing ${dist} directory...`)))
  await execa('rimraf', [dist], { stdio: 'inherit' })

  console.log()
  console.log(chalk.bold(chalk.yellow(`Rolling up for ${target}...`)))
  await execa(
    'rollup',
    ['-c', '--environment', [`NODE_ENV:${env}`].join(',')],
    { stdio: 'inherit' }
  )
}
