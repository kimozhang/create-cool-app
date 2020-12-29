#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const execa = require('execa')
const { prompt } = require('enquirer')
const args = require('minimist')(process.argv.slice(2))

const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts })

main().catch(console.error)

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
  const langAlias = {
    JavaScript: 'js',
    TypeScript: 'ts'
  }
  const templateType = answer.type.toLowerCase()
  const templateLang = langAlias[answer.lang] === 'ts' ? '-ts' : ''
  const templateDir = path.join(
    __dirname,
    `template-${templateType}${templateLang}`
  )

  // copy template
  await copy(templateDir, root)

  // replace placeholder
  await replace(templateType, root)

  // initialize git
  await git(root)

  // done
  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run dev (or \`yarn dev\`)`)
  console.log()
}

async function copy(templateDir, root) {
  const files = await fs.readdir(templateDir)
  const excludeFiles = ['node_modules', 'dist']
  const renameFiles = { _gitignore: '.gitignore' }
  const filesToCopy = files.filter(f => !excludeFiles.includes(f))

  for(const file of filesToCopy) {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    await fs.copy(path.join(templateDir, file), targetPath)
  }
}

async function replace(templateType, root) {
  const projectName = path.basename(root)
  const { stdout } = await run('git', ['config', '--list'], { cwd: root, stdio: 'pipe' })
  const { user = {} } = parseGitConfig(stdout)

  switch (templateType) {
    case 'library':
      await replacePlaceholder(
        projectName,
        /--projectname--/ig,
        [
          path.join(root, 'index.js'),
        ]
      )
      break
  }
  
  await replacePlaceholder(
    (_, m) => {
      switch (m) {
        case 'projectname':
          return projectName
        case 'username':
          return user.name || m
        case 'useremail':
          return user.email || m
      }
    },
    /--(\w+)--/ig,
    [
      path.join(root, 'package.json'),
      path.join(root, 'README.md'),
    ]
  )
}

async function replacePlaceholder(str, placeholder, files) {
  for (const file of files) {
    const content = await fs.readFile(file, { encoding: 'utf-8' })
    const result = content.replace(placeholder, str)
    await fs.writeFile(file, result)
  }
}

function parseGitConfig(str) {
  const pairs = {}
  str.split('\n').forEach(s => {
    const [ keys, val ] = s.split('=')
    keys.split('.').reduce((result, key, index, array) => {
      return result[key] = index === array.length - 1
        ? val
        : result[key] || {}
    }, pairs)
  })
  return pairs
}

async function git(root) {
  await run('git', ['init', root], { stdio: 'pipe' })
}
