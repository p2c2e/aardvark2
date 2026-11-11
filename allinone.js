(function () {
  if (globalThis.aardvark && globalThis.aardvark.ready)
    return;

  globalThis.aardvark = {
    isBookmarklet: true,
    resourcePrefix: chrome.runtime.getURL(""),
    objectsLeftToLoad: 6,
    ready: false,
    dboxTimers: [],
    styleNodes: [],

    loadObject: function (object) {
      if (this.ready)
        return;
      for (var name in object) {
        if (Object.prototype.hasOwnProperty.call(object, name))
          this[name] = object[name];
      }
      this.objectsLeftToLoad--;
      this.ready = this.objectsLeftToLoad === 0;
    }
  };
})();
