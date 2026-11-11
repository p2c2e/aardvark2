# Chrome Web Store release

## Version 3.1.1

Short description:

Edit and simplify web pages for printing: remove or isolate content, adjust styling, and undo or redo changes.

Suggested store listing description:

Aardvark2 lets you simplify a web page before printing or reading. Activate the
extension, hover over content, and use keyboard commands to remove or isolate
sections, adjust styling, and undo or redo your edits.

Highlights in version 3.1.1:

- Extension-management icons included at 32, 48 and 128 pixels.
- Reliable activation and exit without duplicate editor overlays.
- Undo and redo for removal, isolation, paste and styling changes.
- A green page-edge glow and toolbar ON badge while editing is active.
- Keyboard shortcuts leave typing fields and modifier shortcuts alone.
- Editor overlays are hidden in print output while page edits remain.
- Safer rendering of page-derived labels and source views.

Click the toolbar icon to activate or exit. Press q outside editable fields to
exit. Use u to undo, y to redo, and o to restore edits retained in history.
Undo retains the latest 50 edits. Refreshing the page resets edits.

## Build the upload

Run from the repository root after tests pass. This allowlist excludes development
dependencies, tests, local files, Git metadata and the historical CRX.

```sh
mkdir -p /Users/sudharsanr/Downloads/aardvark2-releases
zip -j /Users/sudharsanr/Downloads/aardvark2-releases/aardvark2-3.1.1.zip manifest.json background.js allinone.js aardvarkStrings.js aardvarkUtils.js aardvarkHistory.js aardvarkDBox.js aardvarkCommands.js aardvarkMain.js icon.png icon48.png icon128.png aardvark.gif aardvarkhelp.gif closedbox.gif
```

Use a fresh output filename for each version; zip updates an existing archive and
can retain obsolete entries. The manifest must be at the archive root.

## Publish an update

1. Open https://chrome.google.com/webstore/devconsole with the owning account.
2. Select the existing Aardvark2 item, not a new item, to preserve its extension ID.
3. On Package, choose Upload New Package and upload the release ZIP.
4. Confirm the version is greater than the published version. If not, choose a
   higher version, update manifest/package metadata, and rebuild the ZIP.
5. Update the store listing description. Review Privacy practices and Distribution.
6. Submit for Review and choose automatic publication after approval or deferred
   manual publication. Submission alone does not replace the published version.

If Verified CRX Uploads is enabled, the store requires a signed CRX rather than
this ZIP. Keep any signing key private and outside the repository.

The extension requests activeTab and scripting to edit the user-selected page.
Runtime code is bundled locally. Verify any existing privacy declaration against
current code and policies; do not guess answers to store attestations.

## Verification

- npm run check
- npm test
- git diff --check
- Unpacked install in Brave/Chrome: edit, undo/redo, type in a field, toggle off/on.
- Print preview: no editor overlays, edits retained, screen UI returns on cancel.
- Check the upload contains only the allowlisted runtime files and version 3.1.1.

Reference: https://developer.chrome.com/docs/webstore/update
