import fs from 'node:fs'
import path from 'node:path'

const TARGET = 'session-REPLACE-WITH-YOUR-SESSION-ID'
const source = fs.readFileSync(path.resolve('client.js'), 'utf8')

let definition = null
const storage = new Map()
globalThis.window = {
  __ModuleLoader__: { load(value) { definition = value } },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null },
    setItem(key, value) { storage.set(key, String(value)) },
    removeItem(key) { storage.delete(key) },
  },
  setTimeout: () => 0,
  clearTimeout: () => {},
}

const React = {
  Fragment: 'Fragment',
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children }
  },
  useState(initial) {
    const value = typeof initial === 'function' ? initial() : initial
    return [value, () => {}]
  },
  useEffect() {},
  useMemo(factory) { return factory() },
  useRef(initial) { return { current: initial } },
  useCallback(fn) { return fn },
}

// eslint-disable-next-line no-eval
eval(source)

if (definition === null) throw new Error('module definition missing')
if (definition.id !== '@local/dsh-whale-dialog') throw new Error('unexpected module id: ' + definition.id)

const exported = definition.factory((name) => {
  if (name === 'react') return React
  throw new Error('unexpected require: ' + name)
})

let registered = null
let settingsPage = null
const registrations = []
exported.apply({
  slots: {
    inject(key, callback) {
      const dispose = callback()
      return dispose
    },
    register(options, component) {
      registrations.push(options)
      if (options.name === 'conversation.view') registered = component
      if (options.name === 'settings.section') settingsPage = component
      return () => {}
    },
  },
})

if (registrations.length !== 2) throw new Error('expected two registrations, got ' + registrations.length)
const options = registrations.find((entry) => entry.name === 'conversation.view')
const settingsOptions = registrations.find((entry) => entry.name === 'settings.section')
if (options === undefined) throw new Error('view registration missing')
if (settingsOptions === undefined || settingsOptions.id !== 'whale-dialog') throw new Error('settings registration missing')
if (options.id !== 'whale-dialog') throw new Error('unexpected view id: ' + options.id)
if (registered === null || settingsPage === null) throw new Error('components were not captured')

const seeded = storage.get('dsh.conversation.' + TARGET)
if (seeded !== undefined) throw new Error('view preference should not be seeded when TARGET_SESSION is empty')

function makeSnapshot(entries) {
  const map = new Map(entries.map((node, index) => [node.key ?? 'n' + index, node]))
  const order = [...map.keys()]
  return {
    order,
    nodes: {
      get(key) { return map.get(key) },
    },
  }
}

function statuses(running, pending) {
  return new Map([[TARGET, { running, pendingInteraction: pending ? { kind: 'question' } : undefined }]])
}

function resolve(element, depth = 0) {
  if (depth > 40) return element
  if (element === null || element === undefined || typeof element !== 'object' || Array.isArray(element)) return element
  if (typeof element.type === 'function') {
    return resolve(element.type({ ...element.props, children: element.children }), depth + 1)
  }
  return element
}

function textOf(element, depth = 0) {
  if (element === null || element === undefined || typeof element === 'boolean') return ''
  if (typeof element === 'string' || typeof element === 'number') return String(element)
  if (Array.isArray(element)) return element.map((child) => textOf(child, depth + 1)).join('')
  if (typeof element !== 'object') return ''
  const resolved = resolve(element, depth)
  if (resolved !== element) return textOf(resolved, depth + 1)
  if (element.type === 'style') return ''
  return (element.children ?? []).map((child) => textOf(child, depth + 1)).join('')
}

function findImages(element, out = []) {
  if (element === null || typeof element !== 'object') return out
  if (Array.isArray(element)) {
    for (const child of element) findImages(child, out)
    return out
  }
  const resolved = resolve(element)
  if (resolved !== element) return findImages(resolved, out)
  if (element.type === 'img' && element.props && typeof element.props.src === 'string') out.push(element.props.src)
  for (const child of element.children ?? []) findImages(child, out)
  return out
}

function findElements(element, predicate, out = []) {
  if (element === null || typeof element !== 'object') return out
  if (Array.isArray(element)) {
    for (const child of element) findElements(child, predicate, out)
    return out
  }
  const resolved = resolve(element)
  if (resolved !== element) return findElements(resolved, predicate, out)
  if (element.type === 'style') return out
  if (predicate(element)) out.push(element)
  for (const child of element.children ?? []) findElements(child, predicate, out)
  return out
}

function render(props) {
  return registered({
    sessionId: TARGET,
    useChat: (selector) => selector(props.snapshot),
    useSessionStatus: (selector) => selector(statuses(props.running, props.pending)),
    openView: () => {},
    completeViewRequest: () => {},
    viewRequest: null,
    inputActions: {
      setDraft() {},
      submit() {},
    },
    ...props,
  })
}

const reply = {
  key: 'a1',
  kind: 'assistant-step',
  anchorSeq: 5,
  visibility: 'visible',
  data: {
    status: 'settled',
    blocks: [{ kind: 'text', text: '**你好呀**，这是 `测试`。\n\n- 第一条\n- 第二条\n\n```js\nconst x = 1\n```' }],
  },
}
const user = { key: 'u1', kind: 'user', anchorSeq: 1, visibility: 'visible', data: { content: [] } }

const settledTree = render({ snapshot: makeSnapshot([user, reply]), running: false })
const settledText = textOf(settledTree)
if (!settledText.includes('你好呀')) throw new Error('settled reply text missing: ' + settledText)
if (!settledText.includes('第一条')) throw new Error('list item missing')
const images = findImages(settledTree)
if (images.length !== 5) throw new Error('expected five portrait layers, got ' + images.length)
for (const src of images) {
  if (!src.startsWith('data:image/jpeg;base64,')) throw new Error('portrait layer is not an embedded jpeg')
}
if (!settledText.includes('deepseek')) throw new Error('default name missing')
if (!settledText.includes('DeepSeek')) throw new Error('brand missing')

const staleTree = render({ snapshot: makeSnapshot([user, reply, { key: 'u2', kind: 'user', anchorSeq: 9, visibility: 'visible', data: { content: [] } }]), running: true })
const staleText = textOf(staleTree)
if (!staleText.includes('正在思考')) throw new Error('thinking state missing: ' + staleText)
if (staleText.includes('你好呀')) throw new Error('stale reply should be hidden')

const streamingTree = render({ snapshot: makeSnapshot([user, { ...reply, data: { status: 'running', blocks: [{ kind: 'text', text: '正在为你写一段回复' }] } }]), running: true })
const streamingText = textOf(streamingTree)
if (!streamingText.includes('正在为你写一段回复')) throw new Error('streaming text missing')
if (!streamingText.includes('正在回应')) throw new Error('running HUD missing')

const foreignTree = render({ sessionId: 'session-other', snapshot: makeSnapshot([]), running: false })
const foreignText = textOf(foreignTree)
if (foreignText.includes('仅在本对话中启用')) throw new Error('unexpected guard when TARGET_SESSION is empty')
if (!foreignText.includes('今天想和你聊点什么')) throw new Error('view should render in every session by default')

const emptyTree = render({ snapshot: makeSnapshot([]), running: false })
const emptyText = textOf(emptyTree)
if (!emptyText.includes('今天想和你聊点什么')) throw new Error('greeting missing: ' + emptyText)

const brokenFence = render({ snapshot: makeSnapshot([user, { ...reply, key: 'a3', anchorSeq: 7, data: { status: 'running', blocks: [{ kind: 'text', text: '开头\n\n```js\nconst a = 1' }] } }]), running: true })
if (!textOf(brokenFence).includes('const a = 1')) throw new Error('unclosed fence lost its content')

const textareas = findElements(settledTree, (element) => element.type === 'textarea')
if (textareas.length !== 1) throw new Error('expected one message textarea, got ' + textareas.length)
if (!String(textareas[0].props.placeholder).includes('对 DeepSeek 说点什么')) throw new Error('input placeholder missing: ' + textareas[0].props.placeholder)
if (textareas[0].props.disabled) throw new Error('idle textarea should be enabled')
const sendButtons = findElements(settledTree, (element) => element.type === 'button' && element.props.className === 'wd-send')
if (sendButtons.length !== 1) throw new Error('send button missing')
if (!textOf(sendButtons[0]).includes('发送')) throw new Error('send button label missing')

const pendingTree = render({ snapshot: makeSnapshot([user, reply]), running: false, pending: true })
const pendingTextarea = findElements(pendingTree, (element) => element.type === 'textarea')[0]
if (!pendingTextarea.props.disabled) throw new Error('pending textarea should be disabled')
if (!String(pendingTextarea.props.placeholder).includes('请先处理')) throw new Error('pending placeholder missing')

const settingsTree = settingsPage({})
const settingsText = textOf(settingsTree)
for (const label of ['立绘位置', '对话框宽度', '对话字号', '提示音', '恢复默认']) {
  if (!settingsText.includes(label)) throw new Error('settings label missing: ' + label)
}
const settingsRanges = findElements(settingsTree, (element) => element.type === 'input' && element.props.type === 'range')
if (settingsRanges.length !== 2) throw new Error('expected two settings sliders, got ' + settingsRanges.length)
if (settingsRanges[0].props.min !== 720 || settingsRanges[0].props.max !== 1240) throw new Error('frame width slider range wrong')
if (settingsRanges[1].props.min !== 13 || settingsRanges[1].props.max !== 20) throw new Error('font size slider range wrong')

function activePortrait(tree) {
  return findElements(tree, (element) => element.type === 'img' && String(element.props.className).includes('is-active'))[0]
}
if (activePortrait(settledTree).props.src !== images[0]) throw new Error('idle state should show the default portrait')
const thinkingActive = activePortrait(staleTree)
if (thinkingActive.props.src !== images[1]) throw new Error('thinking state portrait missing')
const speakingActive = activePortrait(streamingTree)
if (speakingActive.props.src !== images[2]) throw new Error('speaking state portrait missing')

const leftButton = findElements(settingsTree, (element) => element.type === 'button' && textOf(element).trim() === '左侧')[0]
if (leftButton === undefined) throw new Error('portrait side control missing')
leftButton.props.onClick()
const leftTree = render({ snapshot: makeSnapshot([user, reply]), running: false })
const panelBody = findElements(leftTree, (element) => typeof element.props.className === 'string' && element.props.className.indexOf('wd-panelBody') === 0)[0]
if (!String(panelBody.props.className).includes('wd-panelBody--left')) throw new Error('portrait side setting was not applied')

settingsRanges[1].props.onChange({ target: { value: '20' } })
const sizeTree = render({ snapshot: makeSnapshot([user, reply]), running: false })
const stage = findElements(sizeTree, (element) => typeof element.props.className === 'string' && element.props.className.indexOf('wd-stage') === 0 && element.props.className.indexOf('Foreign') === -1)[0]
if (stage.props.style['--wd-font-size'] !== '20px') throw new Error('font size setting was not applied: ' + JSON.stringify(stage.props.style))

console.log('all client checks passed')
console.log('TARGET_SESSION empty: view available in every session')
console.log('view label:', options.label)
