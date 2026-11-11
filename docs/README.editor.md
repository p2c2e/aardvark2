# Editor lifecycle, history and safe rendering

## Runtime

The Manifest V3 service worker injects local scripts in order using
`chrome.scripting.executeScript()`. They run in the default isolated world, not
through page-context script tags. Only image assets are web-accessible.

One controller is retained per document. Toolbar clicks toggle it. Concurrent
clicks during activation are ignored. Quit removes listeners, overlays, dialogs,
styles and timers, but preserves editing history for the next activation.
Reloading the page discards the edits and controller.
While active, a non-interactive green glow outlines the page and a green `ON`
badge appears on the toolbar icon. Press `q` or click the toolbar icon again to
exit and clear both indicators. Navigation clears the badge. The page glow is
hidden in print output and uses a shadow root to isolate its styling.


Developer integrations that used the page's `window.aardvark`, `window.elem1`,
`Logger` or `SimplePath` can no longer access the isolated controller. This is an
intentional boundary; the editor does not require page JavaScript integrations.

## Undo and redo

- `u`: undo the last edit.
- `y`: redo the last undone edit.
- `o`: restore edits still retained in the undo history.
- `p`: paste the most recently removed element before the selected element.

Removal, paste, isolation, colorize, black-on-white and de-widthify record
reversible operations. A new edit clears redo history. The history retains at most
50 operations to bound references to removed subtrees. Consequently, restore is
not a complete page snapshot: edits older than the retained history cannot be
reversed without reloading.

Style operations restore the original affected attributes, including whether
attributes were absent. Redo reuses the captured result rather than generating
new random colors. Isolation moves the original selected node and restores its
placement and complete body/element style attributes; it does not clone content.
This preserves listeners, input state and canvas identity.

If a saved sibling disappears, removal undo appends to the original parent. If
the original parent disappears, undo reports the conflict and retains the
operation instead of inserting into a disconnected subtree. Isolation restores
retained original body nodes without deleting newly added unrelated body nodes.
These operations do not freeze page scripts or guarantee compatibility with SPA
reconciliation. Attribute undo may overwrite later site changes to those same
attributes.

## Rendering

Page-derived IDs, classes, attributes, source text, comments and XPath values are
HTML-escaped before entering formatted editor markup. JavaScript display values
are JSON-escaped and then HTML-escaped. Static markup keeps its formatting.

## Development and verification

Node 24.15.0 or newer is required by the test dependency.

```sh
npm ci --ignore-scripts
npm run check
npm test
```

The runtime has no npm dependencies. jsdom is used only for tests, with
`runScripts: 'outside-only'` and no remote resource loading.

The suite covers repeated activation, cleanup, original node identity, complete
attribute restoration, redo, history limits, changed page structure, hostile
rendering values, serialized toolbar clicks and injection errors. The service
worker APIs are mocked; these tests are not real Chrome extension integration
or print-preview tests.

Manual browser checks after loading the repository as an unpacked extension:

- Activate, quit and reactivate repeatedly on an ordinary page and a strict-CSP page.
- Remove and undo content, change each style, isolate/undo an input and table cell.
- Use `y` and `o`, and confirm exact restoration within the retained history.
- Close while help/source dialogs and key indicators are visible.
- Confirm no editor artifacts remain after quit.
- Open a restricted browser page and confirm a useful toolbar-title error.

The prebuilt CRX in `build/` is historical and is not rebuilt by these changes.
