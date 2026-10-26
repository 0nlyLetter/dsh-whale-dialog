import fs from 'node:fs'

const TARGET = 'session-REPLACE-WITH-YOUR-SESSION-ID'
const source = fs.readFileSync('client.js', 'utf8')

let definition = null
const storage = new Map()
const frames = []
globalThis.window = {
  __ModuleLoader__: { load(value) { definition = value } },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null },
    setItem(key, value) { storage.set(key, String(value)) },
    removeItem(key) { storage.delete(key) },
  },
  setTimeout: (fn) => { fn(); return 0 },
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => { frames.push(fn); return frames.length },
  cancelAnimationFrame: () => {},
}

const stateSlots = []
const effectSlots = []
let hookIndex = 0
let dirty = false

function sameDeps(left, right) {
  if (left === undefined || right === undefined) return false
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) if (!Object.is(left[index], right[index])) return false
  return true
}

const React = {
  Fragment: 'Fragment',
  createElement(type, props, ...children) { return { type, props: props ?? {}, children } },
  useState(initial) {
    const index = hookIndex++
    if (!(index in stateSlots)) stateSlots[index] = { value: typeof initial === 'function' ? initial() : initial }
    const slot = stateSlots[index]
    return [slot.value, (next) => {
      const value = typeof next === 'function' ? next(slot.value) : next
      if (!Object.is(value, slot.value)) {
        slot.value = value
        dirty = true
      }
    }]
  },
  useEffect(effect, deps) {
    const index = hookIndex++
    const previous = effectSlots[index]
    const changed = previous === undefined || !sameDeps(previous.deps, deps)
    effectSlots[index] = { effect, deps, cleanup: previous === undefined ? undefined : previous.cleanup, pending: changed }
  },
  useMemo(factory) { hookIndex++; return factory() },
  useRef(initial) {
    const index = hookIndex++
    if (!(index in stateSlots)) stateSlots[index] = { value: { current: initial } }
    return stateSlots[index].value
  },
  useCallback(fn) { hookIndex++; return fn },
}

function runEffects() {
  for (const slot of effectSlots) {
    if (slot === undefined || !slot.pending) continue
    slot.pending = false
    try {
      if (typeof slot.cleanup === 'function') slot.cleanup()
    } catch (error) { /* ignore */ }
    const cleanup = slot.effect()
    slot.cleanup = typeof cleanup === 'function' ? cleanup : undefined
  }
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
const chatState = { key: '', text: '', running: true }
const props = {
  sessionId: TARGET,
  useChat: (selector) => {
    const nodes = new Map([['u1', user]])
    const order = ['u1']
    if (chatState.key !== '') {
      nodes.set(chatState.key, {
        key: chatState.key,
        kind: 'assistant-step',
        anchorSeq: 5,
        visibility: 'visible',
        data: { status: chatState.running ? 'running' : 'settled', blocks: [{ kind: 'text', text: chatState.text }] },
      })
      order.push(chatState.key)
    }
    return selector({ order, nodes: { get(key) { return nodes.get(key) } } })
  },
  useSessionStatus: (selector) => selector(new Map([[TARGET, { running: chatState.running, pendingInteraction: undefined }]])),
  openView: () => {},
  completeViewRequest: () => {},
  viewRequest: null,
  inputActions: { setDraft() {}, submit() {} },
}

let tree = null
function renderComponent() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    hookIndex = 0
    dirty = false
    tree = registered(props)
    runEffects()
    if (!dirty) break
  }
  return tree
}

function resolve(element) {
  if (element === null || typeof element !== 'object' || Array.isArray(element)) return element
  if (typeof element.type === 'function') return resolve(element.type({ ...element.props, children: element.children }))
  return element
}

function textOf(element) {
  if (element === null || element === undefined || typeof element === 'boolean') return ''
  if (typeof element === 'string' || typeof element === 'number') return String(element)
  if (Array.isArray(element)) return element.map(textOf).join('')
  if (typeof element !== 'object') return ''
  const resolved = resolve(element)
  if (resolved !== element) return textOf(resolved)
  if (element.type === 'style') return ''
  return (element.children ?? []).map(textOf).join('')
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

function flushFrame(time) {
  const pending = frames.splice(0, frames.length)
  for (const fn of pending) fn(time)
  renderComponent()
}

tree = renderComponent()
if (!textOf(tree).includes('正在思考')) throw new Error('should start in thinking state')

chatState.key = 'a1'
chatState.text = '你好世界'
tree = renderComponent()
if (textOf(tree).includes('你好世界')) throw new Error('new text should start unrevealed')

flushFrame(1000)
flushFrame(1052)
tree = renderComponent()
const partial = textOf(tree)
if (!partial.includes('你好')) throw new Error('typewriter did not reveal characters: ' + JSON.stringify(partial))
if (partial.includes('世界')) throw new Error('typewriter revealed too much: ' + JSON.stringify(partial))
if (!partial.includes('点击显示全文')) throw new Error('skip hint missing while typing')

let textArea = findElement(tree, (element) => element.props.className === 'wd-text')
if (typeof textArea.props.onClick !== 'function') throw new Error('text area is not clickable while typing')
textArea.props.onClick()
tree = renderComponent()
if (!textOf(tree).includes('你好世界')) throw new Error('click did not reveal the whole text')
if (textOf(tree).includes('点击显示全文')) throw new Error('skip hint should disappear after skipping')

chatState.key = 'a2'
chatState.text = 'abcdef'
tree = renderComponent()
flushFrame(2000)
flushFrame(2026)
tree = renderComponent()
textArea = findElement(tree, (element) => element.props.className === 'wd-text')
const partialSecond = textOf(tree)
if (!partialSecond.includes('a') || partialSecond.includes('abcdef')) throw new Error('second reply should start typing from zero: ' + JSON.stringify(partialSecond))

console.log('typewriter checks passed')
