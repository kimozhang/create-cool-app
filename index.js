#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const { prompt } = require('enquirer')
const argv = require('minimist')(process.argv.slice(2))

async function init() {
  const targetDir = argv._[0] || '.'
  const cwd = process.cwd()
  const root = path.join(cwd, targetDir)
  const languageAlias = {
    JavaScript: 'js',
    TypeScript: 'ts'
  }
  const renameFiles = {
    _gitignore: '.gitignore'
  }
  const answer = await prompt([
    {
      type: 'select',
      name: 'type',
      message: 'what\'s type of template?',
      choices: ['Library']
    },
    {
      type: 'select',
      name: 'language',
      message: 'Select a language',
      choices: ['JavaScript', 'TypeScript']
    }
  ])
  console.log(`\nScaffolding project in ${root}...`)

  await fs.ensureDir(root)
  const existing = await fs.readdir(root)
  if (existing.length) {
    console.error(`Error: target directory is not empty.`)
    process.exit(1)
  }

  const templateType = answer.type.toLowerCase()
  const language = languageAlias[answer.language]
  const templateDir = path.join(
    __dirname,
    `template-${templateType}${language === 'ts' ? '-ts' : ''}`
  )
  const write = async (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFile(targetPath, content)
    } else {
      fs.copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = await fs.readdir(templateDir)
  for(let file of files.filter((f) => f !== 'package.json')) {
    await write(file)
  }

  const pkg = require(path.join(templateDir, 'package.json'))
  const pkgName = path.basename(root)
  const rewritedPkgNames = [
    { name: 'name', value: pkgName },
    { name: 'main', type: 'cjs' }, 
    { name: 'module', type: 'es' }
  ]
  rewritedPkgNames.forEach(({ name, type, value }) => {
    pkg[name] = type ? `dist/${pkgName}.${type}.js` : value
  })
  await write('package.json', JSON.stringify(pkg, null, 2))

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run dev (or \`yarn dev\`)`)
  console.log()
}

init().catch(console.error)
