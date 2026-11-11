## Aardvark2 - Aardvark re-incarnate for Chrome 

There used to be a nifty tool called Aardvark from karmatic. It seems to 
no longer be maintained. The firefox version is still found at
http://www.karmatics.com/aardvark/ and also a bookmarklet version.

These version now suffer from mixed-content (https/http) and CORS issues.

I took the liberty of taking all the scripts and bundling them into 
a chrome extension.

Manifest-V3


Load this directory as an unpacked Chrome extension to use the current code.
The prebuilt CRX in `build/` is historical.

See [editor documentation](docs/README.editor.md) for undo/redo behavior,
limitations, development setup and regression tests.
