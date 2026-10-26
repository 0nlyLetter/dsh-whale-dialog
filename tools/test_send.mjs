import fs from 'node:fs'

const TARGET = 'session-REPLACE-WITH-YOUR-SESSION-ID'
const source = fs.readFileSync('client.js', 'utf8')

let definition = null
const storage = new Map()
globalThis.window = {
  __ModuleLoader__: { load(value) { definition = value } },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null },
    setItem(key, value) { storage.set(key, String(value)) },
    removeItem(key) { storage.delete(key) },
  },
  setTimeout: (fn) => { fn(); return 0 },
  clearTimeout: () => {},
}

let hookSlots = []
let hookIndex = 0
let dirty = false

const React = {
  Fragment: 'Fragment',
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children }
  },
  useState(initial) {
    const index = hookIndex++
    if (!(index in hookSlots)) hookSlots[index] = { value: typeof initial === 'function' ? initial() : initial }
    const slot = hookSlots[index]
    const set = (next) => {
      const value = typeof next === 'function' ? next(slot.value) : next
      if (value !== slot.value) {
        slot.value = value
        dirty = true
      }
    }
    return [slot.value, set]
  },
  useEffect() { hookIndex++ },
  useMemo(factory) { hookIndex++; return factory() },
  useRef(initial) {
    const index = hookIndex++
    if (!(index in hookSlots)) hookSlots[index] = { value: { current: initial } }
    return hookSlots[index].value
  },
  useCallback(fn) { hookIndex++; return fn },
}

// eslint-disable-next-line no-eval
eval(source)

const exported = definition.factory((name) => {
  if (name === 'react') return React
  throw new Error('unexpected require: ' + name)
})

let registered = null
exported.apply({
  slots: {
    inject(key, callback) { return callback() },
    register(options, component) {
      if (options.name === 'conversation.view') registered = component
      return () => {}
    },
  },
})

const user = { key: 'u1', kind: 'user', anchorSeq: 1, visibility: 'visible', data: { content: [] } }
const reply = {
  key: 'a1',
  kind: 'assistant-step',
  anchorSeq: 5,
  visibility: 'visible',
  data: { status: 'settled', blocks: [{ kind: 'text', text: '之前的回复' }] },
}
const nodes = new Map([['u1', user], ['a1', reply]])
const snapshot = { order: ['u1', 'a1'], nodes: { get(key) { return nodes.get(key) } } }

const calls = { drafts: [], submits: 0 }
const props = {
  sessionId: TARGET,
  useChat: (selector) => selector(snapshot),
  useSessionStatus: (selector) => selector(new Map([[TARGET, { running: false, pendingInteraction: undefined }]])),
  openView: () => {},
  completeViewRequest: () => {},
  viewRequest: null,
  inputActions: {
    setDraft(text) { calls.drafts.push(text) },
    submit() { calls.submits += 1 },
  },
}

function resolve(element) {
  if (element === null || typeof element !== 'object' || Array.isArray(element)) return element
  if (typeof element.type === 'function') return resolve(element.type({ ...element.props, children: element.children }))
  return element
}

function findElement(element, predicate) {
  if (element === null || typeof element !== 'object') return null
  if (Array.isArray(element)) {
    for (const child of element) {
      const found = findElement(child, predicate)
      if (found !== null) return found
    }
    return null
  }
  const resolved = resolve(element)
  if (resolved !== element) return findElement(resolved, predicate)
  if (element.type === 'style') return null
  if (predicate(element)) return element
  for (const child of element.children ?? []) {
    const found = findElement(child, predicate)
    if (found !== null) return found
  }
  return null
}

function render() {
  let tree = null
  for (let attempt = 0; attempt < 30; attempt += 1) {
    hookIndex = 0
    dirty = false
    tree = registered(props)
    if (!dirty) break
  }
  return tree
}

let tree = render()
let textarea = findElement(tree, (element) => element.type === 'textarea')
if (textarea === null) throw new Error('textarea missing')
textarea.props.onChange({ target: { value: '你好，DeepSeek' } })

tree = render()
textarea = findElement(tree, (element) => element.type === 'textarea')
if (textarea.props.value !== '你好，DeepSeek') throw new Error('textarea value did not update: ' + textarea.props.value)

const sendButton = findElement(tree, (element) => element.type === 'button' && element.props.className === 'wd-send')
if (sendButton === null) throw new Error('send button missing')
if (sendButton.props.disabled) throw new Error('send button should be enabled with text')

sendButton.props.onClick()
if (calls.drafts.length !== 1 || calls.drafts[0] !== '你好，DeepSeek') throw new Error('setDraft calls: ' + JSON.stringify(calls))
if (calls.submits !== 1) throw new Error('submit calls: ' + calls.submits)

tree = render()
textarea = findElement(tree, (element) => element.type === 'textarea')
if (textarea.props.value !== '') throw new Error('textarea should clear after send: ' + textarea.props.value)

// Enter path.
const second = render()
const input = findElement(second, (element) => element.type === 'textarea')
input.props.onChange({ target: { value: '回车发送' } })
const afterChange = render()
const ready = findElement(afterChange, (element) => element.type === 'textarea')
let prevented = false
ready.props.onKeyDown({
  key: 'Enter',
  shiftKey: false,
  nativeEvent: { isComposing: false },
  preventDefault() { prevented = true },
})
if (!prevented) throw new Error('Enter should prevent default')
if (calls.drafts.at(-1) !== '回车发送') throw new Error('Enter draft: ' + JSON.stringify(calls.drafts))
if (calls.submits !== 2) throw new Error('Enter submit calls: ' + calls.submits)

// Shift+Enter must not send.
const third = render()
const forShift = findElement(third, (element) => element.type === 'textarea')
forShift.props.onChange({ target: { value: '换行' } })
const fourth = render()
const shiftInput = findElement(fourth, (element) => element.type === 'textarea')
shiftInput.props.onKeyDown({ key: 'Enter', shiftKey: true, nativeEvent: { isComposing: false }, preventDefault() {} })
if (calls.submits !== 2) throw new Error('Shift+Enter should not submit')

const settingsButton = findElement(render(), (element) => element.type === 'button' && element.props.className === 'wd-settingsBtn')
if (settingsButton === null) throw new Error('in-view settings button missing')
if (settingsButton.props['aria-expanded'] !== 'false') throw new Error('settings button should start collapsed')

settingsButton.props.onClick()
let openTree = render()
const settingsCard = findElement(openTree, (element) => element.props && element.props.className === 'wd-setCard')
if (settingsCard === null) throw new Error('in-view settings card did not open')
const widthSlider = findElement(openTree, (element) => element.type === 'input' && element.props['aria-label'] === '对话框宽度')
if (widthSlider === null) throw new Error('in-view width control missing')
const soundSwitch = findElement(openTree, (element) => element.type === 'button' && element.props.className === 'wdpopSwitch')
if (soundSwitch === null) throw new Error('in-view sound control missing')

const overlay = findElement(openTree, (element) => element.props && element.props.className === 'wd-setOverlay')
if (overlay === null) throw new Error('settings overlay missing')
overlay.props.onClick()
openTree = render()
if (findElement(openTree, (element) => element.props && element.props.className === 'wd-setCard') !== null) throw new Error('settings card did not close')

console.log('send and in-view settings checks passed')
console.log('drafts:', calls.drafts)
console.log('submits:', calls.submits)
