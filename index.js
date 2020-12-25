#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const { prompt } = require('enquirer')
const args = require('minimist')(process.argv.slice(2))

const langAlias = {
  JavaScript: 'js',
  TypeScript: 'ts'
}

async function main() {
  const targetDir = args._[0] || '.'
  const cwd = process.cwd()
  const root = path.join(cwd, targetDir)

  // check if there is already target directory
  await fs.ensureDir(root)
  const existing = await fs.readdir(root)
  if (existing.length) {
    console.warn(`Error: target directory is not empty.`)
    process.exit(1)
  }
  
  // select a template
  const answer = await prompt([
    {
      type: 'select',
      name: 'type',
      message: 'what\'s type of template?',
      choices: ['Library']
    },
    {
      type: 'select',
      name: 'lang',
      message: 'Select a language',
      choices: ['JavaScript', 'TypeScript']
    }
  ])

  // start scaffolding project
  console.log(`\nScaffolding project in ${root}...`)
  const templateType = answer.type.toLowerCase()
  const templateLang = langAlias[answer.lang] === 'ts' ? '-ts' : ''
  const templateDir = path.join(
    __dirname,
    `template-${templateType}${templateLang}`
  )

  // copy template
  await copyTemplate(templateDir, root)

  // replace placeholder
  if (templateType === 'library') {
    const libraryName = path.basename(root)
    await replaceLibraryName(libraryName, root)
  }

  // done
  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run dev (or \`yarn dev\`)`)
  console.log()
}

async function copyTemplate(templateDir, root) {
  const files = await fs.readdir(templateDir)
  const excludeFiles = ['node_modules', 'yarn.lock', 'package-lock.json']
  const renameFiles = { _gitignore: '.gitignore' }
  const filesToCopy = files.filter(f => !excludeFiles.includes(f))

  for(const file of filesToCopy) {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    await fs.copy(path.join(templateDir, file), targetPath)
  }
}

async function replaceLibraryName(name, root) {
  const replaceFiles = [
    path.join(root, 'package.json'),
    path.join(root, 'index.js')
  ]
  const placeholder = /(my-library)/ig

  for(const file of replaceFiles) {
    const content = await fs.readFile(file, { encoding: 'utf-8' })
    const result = content.replace(placeholder, name)
    await fs.writeFile(file, result)
  }
}

main().catch(console.error)
