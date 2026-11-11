// Compatibility entry point; the service worker now loads scripts directly.
if (globalThis.aardvark && globalThis.aardvark.ready)
  globalThis.aardvark.start();
