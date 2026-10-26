import fs from 'node:fs'

const TARGET = 'session-REPLACE-WITH-YOUR-SESSION-ID'
const source = fs.readFileSync('client.js', 'utf8')

let definition = null
const storage = new Map()
const timers = []
globalThis.window = {
  __ModuleLoader__: { load(value) { definition = value } },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null },
    setItem(key, value) { storage.set(key, String(value)) },
    removeItem(key) { storage.delete(key) },
  },
  setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length },
  clearTimeout: (id) => { if (id > 0) timers[id - 1] = null },
  requestAnimationFrame: () => 0,
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

const chatState = {
  userSeq: 1,
  userText: '你好',
  replyKey: 'a1',
  replySeq: 5,
  replyText: '你好呀',
}
const props = {
  sessionId: TARGET,
  useChat: (selector) => {
    const user = {
      key: 'u' + chatState.userSeq,
      kind: 'user',
      anchorSeq: chatState.userSeq,
      visibility: 'visible',
      data: { content: chatState.userText === '' ? [] : [{ type: 'text', text: chatState.userText }] },
    }
    const reply = {
      key: chatState.replyKey,
      kind: 'assistant-step',
      anchorSeq: chatState.replySeq,
      visibility: 'visible',
      data: { status: 'settled', blocks: chatState.replyText === '' ? [] : [{ kind: 'text', text: chatState.replyText }] },
    }
    const nodes = new Map([[user.key, user], [reply.key, reply]])
    return selector({ order: [user.key, reply.key], nodes: { get(key) { return nodes.get(key) } } })
  },
  useSessionStatus: (selector) => selector(new Map([[TARGET, { running: false, pendingInteraction: undefined }]])),
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
  if (predicate(element)) return element
  for (const child of element.children ?? []) {
    const found = findElement(child, predicate)
    if (found !== null) return found
  }
  return null
}

function activeSrc() {
  const image = findElement(tree, (element) => element.type === 'img' && String(element.props.className).includes('is-active'))
  return image === null ? null : image.props.src
}

const modeSrc = new Map()
tree = renderComponent()
for (const image of (function collect(element, out = []) {
  if (element === null || typeof element !== 'object') return out
  if (Array.isArray(element)) { for (const child of element) collect(child, out); return out }
  const resolved = resolve(element)
  if (resolved !== element) return collect(resolved, out)
  if (element.type === 'img') out.push(element)
  for (const child of element.children ?? []) collect(child, out)
  return out
})(tree)) {
  if (String(image.props.className).includes('wd-portrait')) {
    const index = image.props.className.includes('is-active') ? 'active' : 'other'
    if (!modeSrc.has(image.props.src)) modeSrc.set(image.props.src, [])
    modeSrc.get(image.props.src).push(index)
  }
}

const idleSrc = activeSrc()
if (idleSrc === null) throw new Error('idle portrait missing')

chatState.userSeq = 9
chatState.userText = '今天真的很难过，想哭'
chatState.replyKey = 'a2'
chatState.replySeq = 12
chatState.replyText = ''
tree = renderComponent()
const sadSrc = activeSrc()
if (sadSrc === null || sadSrc === idleSrc) throw new Error('sad reaction was not shown')

chatState.userSeq = 20
chatState.userText = '太好了，谢谢你！'
chatState.replyKey = 'a3'
chatState.replySeq = 23
chatState.replyText = ''
tree = renderComponent()
const happySrc = activeSrc()
if (happySrc === null || happySrc === idleSrc || happySrc === sadSrc) throw new Error('happy reaction was not shown')

// Let the six-second reaction timer expire.
for (const timer of timers) {
  if (timer !== null && timer.ms >= 6000) timer.fn()
}
tree = renderComponent()
if (activeSrc() !== idleSrc) throw new Error('reaction should return to idle after the hold')

console.log('emotion reaction checks passed')
console.log('portraits:', [...modeSrc.keys()].length)
