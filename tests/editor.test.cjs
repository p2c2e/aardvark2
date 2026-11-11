const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

const root = path.resolve(__dirname, '..');
const scripts = [
  'allinone.js', 'aardvarkStrings.js', 'aardvarkUtils.js',
  'aardvarkHistory.js', 'aardvarkDBox.js', 'aardvarkCommands.js',
  'aardvarkMain.js'
];
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(html = '<main><p id="selected">Keep me</p><p id="sibling">Other</p></main>') {
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', {
    url: 'https://example.test/', runScripts: 'outside-only'
  });
  const {window} = dom;
  const messages = [];
  window.chrome = {runtime: {
    getURL: file => 'chrome-extension://test/' + file,
    sendMessage: async message => { messages.push(message); return {ok: true}; }
  }};
  window.scroll = function () {};
  for (const file of scripts)
    window.eval(source(file));
  const editor = window.aardvark;
  editor.start();
  return {dom, window, document: window.document, editor, messages};
}

function withFixture(t, html) {
  const f = fixture(html);
  t.after(() => f.dom.window.close());
  return f;
}

function state(node) {
  return Array.from(node.attributes, a => [a.name, a.value]).sort((a, b) => a[0].localeCompare(b[0]));
}

test('reload and repeated toggles reuse the controller and clean all editor UI', t => {
  const {window, document, editor} = withFixture(t);
  editor.showMenu();
  editor.showHelpTip();
  editor.viewSource(document.getElementById('selected'));
  editor.showKeybox(editor.getByKey('r'));
  assert.ok(document.querySelector('.aardvarkdbox'));
  const removed = document.getElementById('sibling');
  editor.removeElement(removed);
  const handler = editor.mouseOver;
  for (const file of scripts)
    window.eval(source(file));
  assert.equal(window.aardvark, editor);
  assert.equal(editor.mouseOver, handler);
  editor.start();
  assert.equal(document.aardvarkRunning, false);
  assert.equal(document.querySelectorAll('.aardvarkdbox').length, 0);
  assert.equal(document.querySelectorAll('style').length, 0);
  assert.equal(editor.dboxTimers.length, 0);
  assert.equal(editor.keyboxTimeoutHandle, null);
  assert.doesNotThrow(() => editor.hideKeybox());
  for (let i = 0; i < 3; i++) {
    editor.start();
    assert.equal(editor.borderElems.length, 4);
    editor.start();
  }
  assert.equal(document.body.children.length, 1);
  editor.start();
  assert.equal(editor.undo(), true);
  assert.equal(removed.isConnected, true);
  let calls = 0;
  editor.addCommand('test', () => { calls++; return false; }, true, null, 't', true);
  document.dispatchEvent(new window.KeyboardEvent('keypress', {keyCode: 116, bubbles: true}));
  assert.equal(calls, 1);
});

test('style commands restore original attributes and redo deterministically', t => {
  const {document, editor} = withFixture(t,
    '<div id="selected" style="width: 70%; color: red !important" width="500" align="right"><a><span style="font-size: 18px">Text</span></a><img width="100"></div>');
  const elem = document.getElementById('selected');
  for (const command of ['colorize', 'blackOnWhite', 'deWidthify']) {
    const nodes = [elem, ...elem.querySelectorAll('*')];
    const before = nodes.map(state);
    editor[command](elem);
    const after = nodes.map(state);
    assert.equal(editor.undo(), true);
    assert.deepEqual(nodes.map(state), before, command + ' undo');
    assert.equal(editor.redo(), true);
    assert.deepEqual(nodes.map(state), after, command + ' redo');
    editor.undo();
  }
});

test('remove, paste, undo and redo retain the original nodes', t => {
  const {document, editor} = withFixture(t);
  const elem = document.getElementById('selected');
  const target = document.getElementById('sibling');
  editor.removeElement(elem);
  assert.equal(elem.isConnected, false);
  assert.equal(editor.getByKey('p').func, editor.paste);
  assert.equal(editor.paste(target), true);
  assert.equal(elem.nextSibling, target);
  editor.undo();
  assert.equal(elem.isConnected, false);
  editor.undo();
  assert.equal(elem.nextSibling, target);
  editor.redo();
  editor.redo();
  assert.equal(elem.nextSibling, target);
});

test('undo removal tolerates a missing sibling and rejects a missing parent', t => {
  const {document, editor} = withFixture(t);
  const elem = document.getElementById('selected');
  const sibling = document.getElementById('sibling');
  const parent = elem.parentNode;
  editor.removeElement(elem);
  sibling.remove();
  assert.equal(editor.undo(), true);
  assert.equal(parent.lastChild, elem);
  editor.removeElement(elem);
  parent.remove();
  assert.equal(editor.undo(), false);
  assert.equal(editor.undoStack.length, 1);
  assert.equal(elem.isConnected, false);
});

test('isolate restores complete body style, placement, listeners and runtime state', t => {
  const {window, document, editor} = withFixture(t,
    '<header>Header</header><main><input id="selected" value="initial"><p>Sibling</p></main><footer>Footer</footer>');
  document.body.setAttribute('style', 'width: 60%; margin: 17px; background: red !important');
  const elem = document.getElementById('selected');
  elem.value = 'edited';
  elem.setAttribute('style', 'padding: 1px !important');
  const parent = elem.parentNode;
  const sibling = elem.nextSibling;
  const beforeBody = document.body.getAttribute('style');
  const beforeElem = elem.getAttribute('style');
  const originalNodes = Array.from(document.body.childNodes);
  let clicks = 0;
  elem.addEventListener('click', () => { clicks++; });
  editor.isolateElement(elem);
  assert.equal(document.getElementById('selected'), elem);
  assert.equal(elem.value, 'edited');
  elem.dispatchEvent(new window.Event('click'));
  assert.equal(clicks, 1);
  assert.equal(editor.undo(), true);
  assert.deepEqual(Array.from(document.body.childNodes), originalNodes);
  assert.equal(elem.parentNode, parent);
  assert.equal(elem.nextSibling, sibling);
  assert.equal(document.body.getAttribute('style'), beforeBody);
  assert.equal(elem.getAttribute('style'), beforeElem);
  assert.equal(editor.redo(), true);
  assert.equal(editor.undo(), true);
  assert.equal(elem.value, 'edited');
});

test('isolate handles a direct body child and table cell without cloning', t => {
  const {document, editor} = withFixture(t,
    '<article id="article">Article</article><table><tbody><tr><td id="cell">Cell</td><td>Other</td></tr></tbody></table>');
  for (const id of ['article', 'cell']) {
    const elem = document.getElementById(id);
    const parent = elem.parentNode;
    editor.isolateElement(elem);
    assert.equal(document.getElementById(id), elem);
    if (id === 'cell')
      assert.equal(elem.parentNode.tagName, 'TR');
    assert.equal(editor.undo(), true);
    assert.equal(elem.parentNode, parent);
  }
});

test('restore reverses mixed retained history; new edits invalidate redo', t => {
  const {document, editor} = withFixture(t);
  const elem = document.getElementById('selected');
  const before = elem.outerHTML;
  editor.blackOnWhite(elem);
  editor.deWidthify(elem);
  editor.colorize(elem);
  editor.removeElement(elem);
  assert.equal(editor.restoreOriginal(), true);
  assert.equal(elem.outerHTML, before);
  assert.equal(editor.undoStack.length, 0);
  assert.equal(editor.redoStack.length, 4);
  editor.colorize(elem);
  assert.equal(editor.redoStack.length, 0);
  assert.equal(editor.redo(), false);
});

test('history is bounded and document roots cannot be removed', t => {
  const {document, editor} = withFixture(t);
  editor.historyLimit = 3;
  const elem = document.getElementById('selected');
  for (let i = 0; i < 5; i++)
    editor.colorize(elem);
  assert.equal(editor.undoStack.length, 3);
  assert.equal(editor.removeElement(document.body), false);
  assert.equal(editor.removeElement(document.documentElement), false);
});

test('labels, source, XPath and JavaScript viewers treat hostile values as text', t => {
  const {document, editor} = withFixture(t);
  const elem = document.getElementById('selected');
  const payload = '<img src=x onerror="window.compromised=true">&<svg onload="alert(1)"></svg>';
  elem.id = payload;
  elem.className = payload;
  elem.setAttribute('title', payload);
  elem.setAttribute('style', 'font-family: "<img src=x>"');
  elem.textContent = payload + payload;
  elem.appendChild(document.createComment(payload));
  editor.showBoxAndLabel(elem, editor.makeElementLabelString(elem));
  assert.equal(editor.labelElem.querySelectorAll('img,svg,script').length, 0);
  assert.ok(editor.labelElem.textContent.includes(payload));
  for (const command of ['viewSource', 'makeJavascript', 'getElementXPath']) {
    editor[command](elem);
    const box = editor.dBoxArray[editor.dBoxId - 1];
    assert.equal(box.innerContainer.querySelectorAll('img,svg,script').length, 0, command);
    assert.ok(box.innerContainer.textContent.includes('<img'), command);
    box.close();
  }
  assert.ok(editor.getOuterHtmlFormatted(elem, 0).includes('&amp;'));
});

test('isolation undo preserves late page nodes and reports removed selection', t => {
  const {document, editor} = withFixture(t);
  const elem = document.getElementById('selected');
  editor.isolateElement(elem);
  const late = document.createElement('aside');
  document.body.appendChild(late);
  assert.equal(editor.undo(), true);
  assert.equal(late.isConnected, true);
  editor.isolateElement(elem);
  elem.remove();
  assert.equal(editor.undo(), false);
  assert.equal(editor.undoStack.length, 1);
});

test('nested isolation and removal can be restored in reverse order', t => {
  const {document, editor} = withFixture(t);
  const main = document.querySelector('main');
  const elem = document.getElementById('selected');
  editor.isolateElement(main);
  editor.isolateElement(elem);
  editor.removeElement(elem);
  assert.equal(editor.restoreOriginal(), true);
  assert.equal(elem.parentNode, main);
  assert.equal(document.getElementById('sibling').parentNode, main);
});

test('expired dialog timers and repeated close cannot affect a reused dialog ID', t => {
  const {window, editor} = withFixture(t);
  const callbacks = new Map();
  let next = 1;
  window.setTimeout = callback => { const id = next++; callbacks.set(id, callback); return id; };
  window.clearTimeout = id => callbacks.delete(id);
  editor.showHelpTip();
  const oldBox = editor.dBoxArray[0];
  const expired = callbacks.get(1);
  editor.quit();
  editor.start();
  editor.showHelpTip();
  const newBox = editor.dBoxArray[0];
  expired();
  assert.equal(newBox.outerContainer.isConnected, true);
  assert.equal(editor.dBoxArray[0], newBox);
  oldBox.close();
  assert.equal(editor.dBoxArray[0], newBox);
  const current = callbacks.get(2);
  current();
  assert.equal(editor.dboxTimers.length, 0);
  assert.equal(newBox.outerContainer.isConnected, false);
});

test('keyboard commands leave editable targets and focused fields alone', t => {
  const {window, document, editor} = withFixture(t,
    '<p id="selected">Keep</p><input><textarea></textarea><select><option>One</option></select>' +
    '<div contenteditable="true"><span id="editable">Text</span></div>' +
    '<div contenteditable="plaintext-only">Plain</div><div role="textbox">Custom</div>');
  editor.selectedElem = document.getElementById('selected');
  const press = target => {
    const event = new window.KeyboardEvent('keypress', {key: 'r', bubbles: true, cancelable: true});
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.ok(document.getElementById('selected'));
  };
  for (const target of document.querySelectorAll('input, textarea, select, #editable, [contenteditable], [role="textbox"]'))
    press(target);
  document.querySelector('input').focus();
  press(document.body);
  document.querySelector('input').blur();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({mode: 'open'});
  const input = document.createElement('input');
  shadow.appendChild(input);
  input.dispatchEvent(new window.KeyboardEvent('keypress', {key: 'r', bubbles: true, composed: true, cancelable: true}));
  assert.ok(document.getElementById('selected'));
  input.focus();
  press(document.body);
  input.blur();
  document.designMode = 'on';
  press(document.body);
});

test('keyboard suppresses only successfully handled unmodified commands', t => {
  const {window, document, editor} = withFixture(t);
  const press = options => {
    const event = new window.KeyboardEvent('keypress', {bubbles: true, cancelable: true, ...options});
    document.body.dispatchEvent(event);
    return event.defaultPrevented;
  };
  editor.selectedElem = document.getElementById('selected');
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'isComposing'])
    assert.equal(press({key: 'r', [modifier]: true}), false);
  assert.equal(press({key: 'r', keyCode: 229}), false);
  assert.equal(press({key: 'z'}), false);
  assert.equal(press({key: 'Enter'}), false);
  const prevented = new window.KeyboardEvent('keypress', {key: 'r', cancelable: true});
  prevented.preventDefault();
  editor.keyDown(prevented);
  assert.ok(document.getElementById('selected'));
  editor.selectedElem = null;
  assert.equal(press({key: 'r'}), false);
  assert.equal(press({key: 'u'}), false);
  editor.selectedElem = document.getElementById('selected');
  assert.equal(press({key: 'r'}), true);
  assert.equal(document.getElementById('selected'), null);
  assert.equal(press({key: 'u'}), true);
  assert.ok(document.getElementById('selected'));
});

test('many activation cycles leave exactly one overlay set and no UI when off', t => {
  const {document, editor} = withFixture(t);
  for (let cycle = 0; cycle < 20; cycle++) {
    assert.equal(document.querySelectorAll('[data-aardvark-ui]').length, 7);
    assert.equal(document.querySelectorAll('[data-aardvark-active-glow]').length, 1);
    assert.equal(document.querySelectorAll('[data-aardvark-print-style]').length, 1);
    editor.showMenu();
    editor.showHelpTip();
    editor.quit();
    assert.equal(document.querySelectorAll('[data-aardvark-ui]').length, 0);
    assert.equal(document.querySelectorAll('[data-aardvark-print-style]').length, 0);
    assert.equal(editor.styleNodes.length, 0);
    assert.equal(editor.dboxTimers.length, 0);
    assert.equal(editor.dBoxArray.length, 0);
    editor.start();
  }
});

test('print-only styles cover editor overlays without reverting page edits', t => {
  const {document, editor} = withFixture(t);
  editor.viewSource(document.getElementById('selected'));
  editor.showMenu();
  const ui = [...editor.borderElems, editor.labelElem, editor.keyboxElem,
    editor.activeGlow, ...Array.from(document.querySelectorAll('.aardvarkdbox'))];
  for (const node of ui) {
    assert.ok(node);
    assert.equal(node.hasAttribute('data-aardvark-ui'), true);
  }
  const style = document.querySelector('[data-aardvark-print-style]');
  assert.ok(style);
  const media = style.sheet.cssRules[0];
  assert.equal(media.conditionText, 'print');
  assert.equal(media.cssRules[0].selectorText, '[data-aardvark-ui]');
  assert.equal(media.cssRules[0].style.getPropertyValue('display'), 'none');
  assert.equal(media.cssRules[0].style.getPropertyPriority('display'), 'important');
  const sibling = document.getElementById('sibling');
  editor.removeElement(sibling);
  const state = ui.map(node => node.getAttribute('style'));
  document.defaultView.dispatchEvent(new document.defaultView.Event('beforeprint'));
  document.defaultView.dispatchEvent(new document.defaultView.Event('afterprint'));
  assert.deepEqual(ui.map(node => node.getAttribute('style')), state);
  assert.equal(document.getElementById('sibling'), null);
  assert.equal(document.aardvarkRunning, true);
  editor.quit();
  assert.equal(style.isConnected, false);
  assert.equal(document.querySelectorAll('[data-aardvark-ui]').length, 0);
  assert.equal(document.getElementById('sibling'), null);
  editor.start();
  assert.equal(document.querySelectorAll('[data-aardvark-print-style]').length, 1);
  editor.undo();
  assert.equal(document.getElementById('sibling'), sibling);
});

test('active glow survives edits and q removes it and notifies the service worker', t => {
  const {window, document, editor, messages} = withFixture(t);
  const glow = document.querySelector('[data-aardvark-active-glow]');
  assert.ok(glow);
  assert.equal(glow.style.pointerEvents, 'none');
  assert.equal(glow.getAttribute('aria-hidden'), 'true');
  assert.equal(glow.isAardvark, true);
  assert.equal(messages.length, 1);
  editor.isolateElement(document.getElementById('selected'));
  assert.equal(glow.isConnected, true);
  editor.undo();
  assert.equal(glow.isConnected, true);
  document.dispatchEvent(new window.KeyboardEvent('keypress', {keyCode: 113, bubbles: true}));
  assert.equal(document.aardvarkRunning, false);
  assert.equal(glow.isConnected, false);
  assert.equal(editor.activeGlow, null);
  assert.equal(messages.length, 2);
  editor.start();
  assert.equal(document.querySelectorAll('[data-aardvark-active-glow]').length, 1);
});

test('toolbar badge follows current document state and clears on navigation', async () => {
  let messageListener, updateListener;
  let active = true;
  const badges = [], titles = [], colors = [];
  const context = vm.createContext({console, chrome: {
    runtime: {onMessage: {addListener(fn) { messageListener = fn; }}},
    tabs: {onUpdated: {addListener(fn) { updateListener = fn; }}},
    action: {
      onClicked: {addListener() {}},
      async setBadgeBackgroundColor(value) { colors.push(value.color); },
      async setBadgeTextColor() {},
      async setBadgeText(value) { badges.push(value); },
      async setTitle(value) { titles.push(value.title); }
    },
    scripting: {async executeScript() { return [{result: active, documentId: 'current'}]; }}
  }});
  vm.runInContext(source('background.js'), context);
  const send = sender => new Promise(resolve => {
    const asynchronous = messageListener({type: 'aardvark-active-state'}, sender, resolve);
    assert.equal(asynchronous, true);
  });
  const sender = {tab: {id: 7}, frameId: 0, documentId: 'current'};
  await send(sender);
  assert.equal(badges.at(-1).text, 'ON');
  assert.equal(badges.at(-1).tabId, 7);
  assert.equal(colors.at(-1), '#15803d');
  assert.ok(titles.at(-1).includes('press q'));
  active = false;
  await send(sender);
  assert.equal(badges.at(-1).text, '');
  const count = badges.length;
  await send({...sender, documentId: 'previous'});
  assert.equal(badges.length, count);
  assert.equal(messageListener({type: 'aardvark-active-state'}, {...sender, frameId: 1}, () => {}), false);
  updateListener(7, {status: 'loading'});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(badges.at(-1).text, '');
});

test('service worker injects ordered isolated scripts once and toggles thereafter', async t => {
  const {window, editor} = withFixture(t);
  editor.quit();
  const calls = [];
  let click;
  const context = vm.createContext({
    console,
    chrome: {
      runtime: {onMessage: {addListener() {}}},
      tabs: {onUpdated: {addListener() {}}},
      action: {
        onClicked: {addListener(fn) { click = fn; }}, async setTitle() {},
        async setBadgeBackgroundColor() {}, async setBadgeTextColor() {}, async setBadgeText() {}
      },
      scripting: {async executeScript(details) {
        calls.push(details);
        if (details.files)
          details.files.forEach(file => window.eval(source(file)));
        else
          return [{result: window.eval('(' + details.func.toString() + ')()')}];
        return [{result: undefined}];
      }}
    }
  });
  delete window.aardvark;
  vm.runInContext(source('background.js'), context);
  await click({id: 7});
  await click({id: 7});
  await click({id: 7});
  const injections = calls.filter(call => call.files);
  assert.equal(injections.length, 1);
  assert.deepEqual(Array.from(injections[0].files), scripts);
  assert.equal(window.document.aardvarkRunning, true);
  assert.equal(window.document.getElementById('extensionpath'), null);
  assert.equal(window.document.querySelectorAll('script[src]').length, 0);
});

test('service worker ignores duplicate in-flight clicks and handles injection rejection', async () => {
  let click;
  let release;
  let count = 0;
  const titles = [];
  const context = vm.createContext({
    console: {warn() {}},
    chrome: {
      runtime: {onMessage: {addListener() {}}},
      tabs: {onUpdated: {addListener() {}}},
      action: {
        onClicked: {addListener(fn) { click = fn; }},
        async setBadgeBackgroundColor() {}, async setBadgeTextColor() {}, async setBadgeText() {},
        async setTitle(value) { titles.push(value.title); }
      },
      scripting: {executeScript() {
        count++;
        return new Promise((resolve, reject) => { release = () => reject(new Error('restricted page')); });
      }}
    }
  });
  vm.runInContext(source('background.js'), context);
  const first = click({id: 8});
  await click({id: 8});
  assert.equal(count, 1);
  release();
  await first;
  assert.ok(titles[titles.length - 1].includes('cannot edit'));
  const retry = click({id: 8});
  assert.equal(count, 2);
  release();
  await retry;
});
