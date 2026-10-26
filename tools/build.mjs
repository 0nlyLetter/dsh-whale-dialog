import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const portraits = new Map([
  ['__PORTRAIT_DATA_URL__', 'expr-idle.jpg'],
  ['__SPEAKING_DATA_URL__', 'expr-speaking-new.jpg'],
  ['__THINKING_DATA_URL__', 'expr-thinking.jpg'],
  ['__HAPPY_DATA_URL__', 'expr-happy.jpg'],
  ['__SAD_DATA_URL__', 'expr-sad.jpg'],
])

let source = await readFile(path.join(root, 'tools', 'client.template.js'), 'utf8')
for (const [placeholder, file] of portraits) {
  if (!source.includes(placeholder)) throw new Error(`missing placeholder: ${placeholder}`)
  const bytes = await readFile(path.join(root, 'assets', file))
  source = source.replaceAll(placeholder, `data:image/jpeg;base64,${bytes.toString('base64')}`)
}
if (/__[A-Z_]+_DATA_URL__/.test(source)) throw new Error('unreplaced portrait placeholder in template')
await writeFile(path.join(root, 'client.js'), source)
console.log(`built client.js (${Buffer.byteLength(source)} bytes)`)
