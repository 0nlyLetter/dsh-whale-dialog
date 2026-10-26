import fs from 'node:fs'

const src = fs.readFileSync('tools/client.template.js', 'utf8')
const backtick = String.fromCharCode(96)

function extractCss(name) {
  const marker = 'const ' + name + ' = ' + backtick
  const start = src.indexOf(marker)
  if (start < 0) return ''
  const from = start + marker.length
  const to = src.indexOf('\n' + backtick + '\n', from)
  return src.slice(from, to)
}

const css = extractCss('CSS')
const settingsCss = extractCss('SETTINGS_CSS')
const characterCss = extractCss('CHARACTER_CSS')
const studyCss = extractCss('STUDY_CSS')
const combined = css + '\n' + settingsCss + '\n' + characterCss + '\n' + studyCss
const open = (combined.match(/\{/g) || []).length
const close = (combined.match(/\}/g) || []).length
console.log('css chars:', combined.length, 'open:', open, 'close:', close)
console.log('main css chars:', css.length, 'settings css chars:', settingsCss.length, 'character css chars:', characterCss.length, 'study css chars:', studyCss.length)

const defined = new Set([...combined.matchAll(/\.(wd[a-z-]*[a-zA-Z0-9_-]*)/g)].map((m) => m[1]))
const used = new Set()
for (const m of src.matchAll(/'((?:wd[a-z-]*[a-zA-Z0-9_-]*)(?: wd[a-z-]*[a-zA-Z0-9_-]*)*)'/g)) {
  for (const part of m[1].split(' ')) used.add(part)
}
for (const m of src.matchAll(/className: '([^']+)'/g)) {
  for (const part of m[1].split(' ')) used.add(part)
}
console.log('used:', [...used].sort().join(', '))
console.log('missing:', [...used].filter((c) => !defined.has(c)).sort())
console.log('unused:', [...defined].filter((c) => !used.has(c)).sort())
