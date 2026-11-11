aardvark.loadObject({

historyLimit: 50,
undoStack: [],
redoStack: [],

recordEdit: function (operation) {
  operation.redo();
  this.undoStack.push(operation);
  if (this.undoStack.length > this.historyLimit)
    this.undoStack.shift();
  this.redoStack.length = 0;
  this.clearBox();
  return true;
},

undo: function () {
  if (!this.undoStack.length)
    return false;
  var operation = this.undoStack[this.undoStack.length - 1];
  try {
    operation.undo();
  } catch (error) {
    this.showMessage("Unable to undo: the page has changed.");
    return false;
  }
  this.undoStack.pop();
  this.redoStack.push(operation);
  this.clearBox();
  return true;
},

redo: function () {
  if (!this.redoStack.length)
    return false;
  var operation = this.redoStack[this.redoStack.length - 1];
  try {
    operation.redo();
  } catch (error) {
    this.showMessage("Unable to redo: the page has changed.");
    return false;
  }
  this.redoStack.pop();
  this.undoStack.push(operation);
  this.clearBox();
  return true;
},

restoreOriginal: function () {
  while (this.undoStack.length) {
    if (!this.undo())
      return false;
  }
  return true;
},

restoreNode: function (node, parent, sibling) {
  if (!parent || !parent.isConnected)
    throw new Error("Original parent is no longer connected");
  if (sibling && sibling.parentNode === parent)
    parent.insertBefore(node, sibling);
  else
    parent.appendChild(node);
},

captureAttributes: function (root, names, descendants) {
  var nodes = [root];
  if (descendants)
    nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll("*")));
  return nodes.map(function (node) {
    return {
      node: node,
      values: names.map(function (name) {
        return {name: name, value: node.getAttribute(name)};
      })
    };
  });
},

restoreAttributes: function (snapshot) {
  snapshot.forEach(function (entry) {
    entry.values.forEach(function (attribute) {
      if (attribute.value === null)
        entry.node.removeAttribute(attribute.name);
      else
        entry.node.setAttribute(attribute.name, attribute.value);
    });
  });
},

editAttributes: function (root, names, descendants, mutate) {
  var editor = this;
  var before = this.captureAttributes(root, names, descendants);
  var after = null;
  return this.recordEdit({
    undo: function () { editor.restoreAttributes(before); },
    redo: function () {
      if (after)
        editor.restoreAttributes(after);
      else {
        mutate();
        after = editor.captureAttributes(root, names, descendants);
      }
    }
  });
}

});
