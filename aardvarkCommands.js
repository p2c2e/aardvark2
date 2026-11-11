aardvark.loadObject ({

keyCommands : [],

//------------------------------------------------------------
loadCommands : function () {
if (this.keyCommands.length > 0)
  return;
// 0: name (member of this.strings, or literal string)
// 1: function
// 2: no element needed (null for element commands)
// 3: "extension" of ext only, "bookmarklet" for bm only, null for both
var keyCommands = [
  ["wider", this.wider],
  ["narrower", this.narrower],
  ["undo", this.undo, true],
  ["redo", this.redo, true, null, "y"],
  ["restore edits", this.restoreOriginal, true, null, "o"],
  ["quit", this.quit, true],
  ["remove", this.removeElement],
  ["kill", this.rip, null, "extension"],
  ["isolate", this.isolateElement],
  ["black on white", this.blackOnWhite],
  ["deWidthify", this.deWidthify],
  ["colorize", this.colorize],
  ["view source", this.viewSource],
  ["javascript", this.makeJavascript],
  ["paste", this.paste],
  ["help", this.showMenu, true],
  ["xpath", this.getElementXPath],
  ["element path", this.getElementPath],
  ["global", this.makeGlobalFromElement]
  ];

for (var i=0; i<keyCommands.length; i++)
  this.addCommandInternal(keyCommands[i]);
},

addCommandInternal : function (a) {
  this.addCommand(a[0], a[1], a[2], a[3], a[4], true);
},

keyCommands : [],

//-----------------------------------------------------
addCommand : function (name, func,
    noElementNeeded, mode, keystroke, suppressMessage) {
if (this.isBookmarklet) {
  if (mode == "extension")
    return;
  }
else {
  if (mode == "bookmarklet")
    return;
  }

if (this.strings[name] && this.strings[name] != "")
  name = this.strings[name];

if (keystroke) {
  keyOffset = -1;
  }
else {
  var keyOffset = name.indexOf('&');
  if (keyOffset != -1) {
    keystroke = name.charAt(keyOffset+1);
    name = name.substring (0, keyOffset) + name.substring (keyOffset+1);
    }
  else {
    keystroke = name.charAt(0);
    keyOffset = 0;
    }
  }
var command = {
    name: name,
    keystroke: keystroke,
    keyOffset: keyOffset,
    func: func
    }
if (noElementNeeded)
  command.noElementNeeded = true;

for (var i=0; i<this.keyCommands.length; i++) {
  if (this.keyCommands[i].keystroke == keystroke) {
    /*if (!suppressMessage)
      this.showMessage ("<p style='color: #000; margin: 3px 0 0 0;'>command \"<b>" + this.keyCommands[i].name + "</b>\" replaced with \"<b>" + name + "</b>\"</p>");*/
    this.keyCommands[i] = command;
    return;
    }
  }
if (!suppressMessage)
  this.showMessage ("<p style='color: #000; margin: 3px 0 0 0;'>command \"<b>" + name + "</b>\" added</p>");
this.keyCommands.push (command);
},


//------------------------------------------------------------
rip : function (elem) {
if (window.RemoveItPermanently)
  RemoveItPermanently.doRipNode(elem);
else {
  var dbox = new AardvarkDBox ("#fff", true);
  dbox.innerContainer.innerHTML = this.strings.ripHelp;
  dbox.show ();
  }
return true;
},

//------------------------------------------------------------
wider : function (elem) {
if (elem && elem.parentNode) {
  var newElem = this.findValidElement (elem.parentNode);
  if (!newElem)
    return false;

  if (this.widerStack && this.widerStack.length>0 &&
    this.widerStack[this.widerStack.length-1] == elem) {
    this.widerStack.push (newElem);
    }
  else {
    this.widerStack = [elem, newElem];
    }
  this.selectedElem = newElem;
  this.showBoxAndLabel (newElem,
      this.makeElementLabelString (newElem));
  this.didWider = true;
  return true;
  }
return false;
},

//------------------------------------------------------------
narrower : function (elem) {
if (elem) {
  if (this.widerStack && this.widerStack.length>1 &&
    this.widerStack[this.widerStack.length-1] == elem) {
    this.widerStack.pop();
    newElem = this.widerStack[this.widerStack.length-1];
    this.selectedElem = newElem;
    this.showBoxAndLabel (newElem,
        this.makeElementLabelString (newElem));
    this.didWider = true;
    return true;
    }
  }
return false;
},

//------------------------------------------------------------
quit : function () {
this.doc.aardvarkRunning = false;
if (this.activeGlow)
  this.activeGlow.remove();
this.activeGlow = null;
this.notifyActiveState();
this.doc.removeEventListener("mouseover", this.mouseOver, false);
this.doc.removeEventListener("mousemove", this.mouseMove, false);
this.doc.removeEventListener("mouseup", this.mouseUp, false);
this.doc.removeEventListener("keypress", this.keyDown, false);
clearTimeout(this.keyboxTimeoutHandle);
this.keyboxTimeoutHandle = null;
this.dboxTimers.forEach(clearTimeout);
this.dboxTimers.length = 0;
for (var i=0; i<this.dBoxArray.length; i++) {
  if (this.dBoxArray[i])
    this.dBoxArray[i].close();
}
this.dBoxArray.length = 0;
this.dBoxId = 0;
this.helpBoxId = null;
this.styleNodes.forEach(function (node) { node.remove(); });
this.styleNodes.length = 0;
this.doc.didDboxCss = false;
this.doc.didViewSourceDboxCss = false;
this.removeBoxFromBody();
this.selectedElem = null;
this.widerStack = null;
this.dragElement = null;
return true;
},

//------------------------------------------------------------
suspend : function () {
if (this.doc.all) {
  this.doc.detachEvent ("onmouseover", this.mouseOver);
  this.doc.detachEvent ("onkeypress", this.keyDown);
  }
else {
  this.doc.removeEventListener("mouseover", this.mouseOver, false);
  this.doc.removeEventListener("keypress", this.keyDown, false);
  }
return true;
},

//------------------------------------------------------------
resume : function () {
if (this.doc.all) {
  this.doc.attachEvent ("onmouseover", this.mouseOver);
  this.doc.attachEvent ("onkeypress", this.keyDown);
  }
else {
  this.doc.addEventListener ("mouseover", this.mouseOver, false);
  this.doc.addEventListener ("keypress", this.keyDown, false);
  }
return true;
},

//------------------------------------------------------------

viewSource : function (elem) {
var dbox = new AardvarkDBox ("#fff", true, false, false, this.strings.viewHtmlSource, true);
var v = this.getOuterHtmlFormatted(elem, 0);
dbox.innerContainer.innerHTML = v;

if (!this.doc.didViewSourceDboxCss) {
  this.createCSSRule ("div.aardvarkdbox div", "font-size: 13px; margin: 0; padding: 0;");
  this.createCSSRule ("div.aardvarkdbox div.vsblock", "font-size: 13px; border: 1px solid #ccc; border-right: 0;margin: -1px 0 -1px 1em; padding: 0;");
  this.createCSSRule ("div.aardvarkdbox div.vsline", "font-size: 13px; border-right: 0;margin: 0 0 0 .6em;text-indent: -.6em; padding: 0;");
  this.createCSSRule ("div.aardvarkdbox div.vsindent", "font-size: 13px; border-right: 0;margin: 0 0 0 1.6em;text-indent: -.6em; padding: 0;");
  this.createCSSRule ("div.aardvarkdbox span.tag", "color: #c00;font-weight:bold;");
  this.createCSSRule ("div.aardvarkdbox span.pname", "color: #080;font-weight: bold;");
  this.createCSSRule ("div.aardvarkdbox span.pval", "color:#00a;font-weight: bold;");
  this.createCSSRule ("div.aardvarkdbox span.aname", "color: #050;font-style: italic;font-weight: normal;");
  this.createCSSRule ("div.aardvarkdbox span.aval", "color:#007;font-style: italic;font-weight: normal;");
  this.doc.didViewSourceDboxCss = true;
  }
dbox.show ();
return true;
},

//------------------------------------------------------------

colorize : function (elem) {
var color = "#" + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0");
return this.editAttributes(elem, ["style"], false, function () {
  elem.style.backgroundColor = color;
  elem.style.backgroundImage = "none";
});
},

removeElement : function (elem) {
if (!elem.parentNode || elem === this.doc.body || elem === this.doc.documentElement)
  return false;
var editor = this, parent = elem.parentNode, sibling = elem.nextSibling;
return this.recordEdit({
  removedElement: elem,
  undo: function () { editor.restoreNode(elem, parent, sibling); },
  redo: function () {
    if (!elem.isConnected)
      throw new Error("Element is no longer connected");
    elem.remove();
  }
});
},

paste : function (target) {
var previous = this.undoStack[this.undoStack.length - 1];
if (!previous || !previous.removedElement || !target.parentNode)
  return false;
var editor = this, elem = previous.removedElement;
var parent = target.parentNode;
return this.recordEdit({
  undo: function () { elem.remove(); },
  redo: function () { editor.restoreNode(elem, parent, target); }
});
},

isolateElement : function (elem) {
var body = this.doc.body, editor = this;
if (!body.contains(elem) || elem === body)
  return false;
var parent = elem.parentNode, sibling = elem.nextSibling;
var originals = Array.prototype.slice.call(body.childNodes).filter(function (node) {
  return !node.isAardvark;
}).map(function (node) { return {node: node, sibling: node.nextSibling}; });
var bodyBefore = this.captureAttributes(body, ["style"], false);
var elementBefore = this.captureAttributes(elem, ["style"], false);
var container = this.doc.createElement("div");
var contentParent = container;
if (elem.tagName === "TR" || elem.tagName === "TD" || elem.tagName === "TH") {
  var table = this.doc.createElement("table");
  var tbody = this.doc.createElement("tbody");
  table.appendChild(tbody);
  container.appendChild(table);
  contentParent = tbody;
  if (elem.tagName !== "TR") {
    contentParent = this.doc.createElement("tr");
    tbody.appendChild(contentParent);
  }
}
return this.recordEdit({
  undo: function () {
    if (!body.isConnected || !container.contains(elem) ||
        (parent !== body && !originals.some(function (entry) {
          return entry.node === parent || entry.node.contains(parent);
        })))
      throw new Error("Original structure has changed");
    container.remove();
    for (var i=originals.length-1; i>=0; i--)
      editor.restoreNode(originals[i].node, body, originals[i].sibling);
    editor.restoreNode(elem, parent, sibling);
    editor.restoreAttributes(bodyBefore);
    editor.restoreAttributes(elementBefore);
  },
  redo: function () {
    if (!body.contains(elem))
      throw new Error("Selected element is no longer connected");
    contentParent.appendChild(elem);
    originals.forEach(function (entry) {
      if (entry.node.parentNode === body)
        entry.node.remove();
    });
    body.style.width = "100%";
    body.style.background = "white";
    body.style.textAlign = "left";
    elem.style.textAlign = "";
    elem.style.cssFloat = "none";
    elem.style.position = "";
    elem.style.padding = "5px";
    elem.style.margin = "5px";
    body.appendChild(container);
    editor.window.scroll(0, 0);
  }
});
},

deWidthify : function (node) {
return this.editAttributes(node, ["style", "width"], true, function () {
  var nodes = [node].concat(Array.prototype.slice.call(node.querySelectorAll("*")));
  nodes.forEach(function (elem) {
    if (elem.tagName !== "IMG") {
      elem.style.width = "auto";
      elem.removeAttribute("width");
    }
  });
});
},

blackOnWhite : function (node) {
return this.editAttributes(node, ["style", "align"], true, function () {
  var nodes = [node].concat(Array.prototype.slice.call(node.querySelectorAll("*")));
  nodes.forEach(function (elem) {
    if (elem.tagName !== "IMG") {
      elem.style.color = "#000";
      if (elem.closest("a"))
        elem.style.textDecoration = "underline";
      elem.style.backgroundColor = "#fff";
      elem.style.fontFamily = "arial";
      elem.style.fontSize = "13px";
      elem.style.textAlign = "left";
      elem.setAttribute("align", "left");
      elem.style.backgroundImage = "none";
    }
  });
});
},

//--------------------------------------------------------
getOuterHtmlFormatted : function (node, indent) {
var str = "";

if (this.doc.all) {
  return "<pre>" + this.escapeHTML(node.outerHTML) + "</pre>";
  }

switch (node.nodeType) {
  case 1: // ELEMENT_NODE
    {
    if (node.style.display == 'none')
      break;
    var isLeaf = (node.childNodes.length == 0 && this.leafElems[node.nodeName]);
    var isTbody = (node.nodeName == "TBODY" && node.attributes.length == 0);

    if (isTbody) {
      for (var i=0; i<node.childNodes.length; i++)
        str += this.getOuterHtmlFormatted(node.childNodes.item(i), indent);
      }
    else {
      if (isLeaf)
        str += "\n<div class='vsindent'>\n";
      else if (indent>0)
        str += "\n<div class='vsblock' style=''>\n<div class='vsline'>\n";
      else
        str += "\n<div class='vsline'>\n";

      str += "&lt;<span class='tag'>" +
            node.nodeName.toLowerCase() + "</span>";
      for (var i=0; i<node.attributes.length; i++) {
        if (node.attributes.item(i).nodeValue != null &&
          node.attributes.item(i).nodeValue != '') {
          str += " <span class='pname'>"
          str += this.escapeHTML(node.attributes.item(i).nodeName);

          if (node.attributes.item(i).nodeName == "style") {
            var styles = "";
            var a = node.attributes.item(i).nodeValue.split(";");
            for (var j=0; j<a.length; j++) {
              var pair = a[j].split (":");
              if (pair.length == 2) {
                var s = this.trimSpaces(pair[0]), index;
                styles += "; <span class='aname'>" + this.escapeHTML(s) + "</span>: <span class='aval'>" + this.escapeHTML(this.trimSpaces(pair[1])) + "</span>";
                }
              }
            styles = styles.substring (2);
            str += "</span>=\"" +  styles + "\"";
            }
          else {
            str += "</span>=\"<span class='pval'>" + this.escapeHTML(node.attributes.item(i).nodeValue) + "</span>\"";
            }
          }
        }
      if (isLeaf)
        str += " /&gt;\n</div>\n";
      else {
        str += "&gt;\n</div>\n";
        for (var i=0; i<node.childNodes.length; i++)
          str += this.getOuterHtmlFormatted(node.childNodes.item(i), indent+1);
        str += "\n<div class='vsline'>\n&lt;/<span class='tag'>" +
          node.nodeName.toLowerCase() + "</span>&gt;\n</div>\n</div>\n"
        }
      }
    }
    break;

  case 3: //TEXT_NODE
    {
    var v = node.nodeValue;
    v = this.escapeHTML(v);

    v = this.trimSpaces (v);
    if (v != '' && v != '\n'
        && v != '\r\n' && v.charCodeAt(0) != 160)
      str += "<div class='vsindent'>" + v + "</div>";
    }
    break;

  case 4: // CDATA_SECTION_NODE
    str += "<div class='vsindent'>&lt;![CDATA[" + this.escapeHTML(node.nodeValue) + "]]></div>";
    break;

  case 5: // ENTITY_REFERENCE_NODE
    str += "&amp;" + this.escapeHTML(node.nodeName) + ";<br>"
    break;

  case 8: // COMMENT_NODE
    str += "<div class='vsindent'>&lt;!--" + this.escapeHTML(node.nodeValue) + "--></div>"
    break;
  }
return str;
},

camelCaseProps : {
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'accesskey': 'accessKey',
  'class': 'className',
  'for': 'htmlFor',
  'tabindex': 'tabIndex',
  'maxlength': 'maxLength',
  'readonly': 'readOnly',
  'frameborder': 'frameBorder',
  'cellspacing': 'cellSpacing',
  'cellpadding': 'cellPadding'
},

//--------------------------------------------------------
domJavascript : function (node, indent) {
var indentStr = "";
for (var c=0; c<indent; c++)
  indentStr += "  ";

switch (node.nodeType) {
  case 1: // ELEMENT_NODE
    {
    if (node.style.display == 'none')
      break;

    var isLeaf = (node.childNodes.length == 0 && this.leafElems[node.nodeName]);

    var children = "", numChildren = 0, t, useInnerHTML = false;
    if (!isLeaf) {
      for (var i=0; i<node.childNodes.length; i++) {
        t = this.domJavascript(node.childNodes.item(i), indent+1);
        if (t == "useInnerHTML") {
          useInnerHTML = true;
          break;
          }
        if (t) {
          children += indentStr + "  " + t + ",\n";
          numChildren++;
          }
        }
      //  children = indentStr + "   [\n" + children.substring(0, children.length-2) + "\n" + indentStr + "   ]\n";
      if (numChildren && !useInnerHTML)
        children = children.substring(0, children.length-2) + "\n";
      }

    var properties = "", styles = "", numProps = 0, sCount = 0;

    for (var i=0; i<node.attributes.length; i++) {
      if (node.attributes.item(i).nodeValue != null && node.attributes.item(i).nodeValue != '') {
        var n = node.attributes.item(i).nodeName,
           v = node.attributes.item(i).nodeValue;

        switch (n) {
          case "style": {
            var a = node.attributes.item(i).nodeValue.split(";");
            for (var j=0; j<a.length; j++) {
              var pair = a[j].split (":");
              if (pair.length == 2) {
                var s = this.trimSpaces(pair[0]), index;
                while ((index = s.indexOf("-")) != -1)
                 s = s.substring(0, index) + s.charAt(index+1).toUpperCase() + s.substring(index+2);

                if (s == "float") { // yuk
                 styles += ", <span style='color:#060; font-style:italic'>styleFloat</span>: \"<span style='color:#008;font-style:italic'>" + this.escapeForJavascript(this.trimSpaces(pair[1])) + "</span>\", <span style='color:#060; font-style:italic'>cssFloat</span>: \"<span style='color:#008;font-style:italic'>" + this.escapeForJavascript(this.trimSpaces(pair[1])) + "</span>\"";
                 }
                else {
                 styles += ", <span style='color:#060; font-style:italic'>" + this.escapeHTML(s) + "</span>: \"<span style='color:#008;font-style:italic'>" + this.escapeForJavascript(this.trimSpaces(pair[1])) + "</span>\"";
                 }
                sCount++;
                }
              }
            styles = styles.substring (2);
            break;
            }
          default:
            {
            var newN;
            if ((newIn = this.camelCaseProps[n]) != null)
              n = newIn;
            properties += ", <span style='color:#080;font-weight: bold'>" + this.escapeHTML(n) + "</span>:\"<span style='color:#00b;font-weight: bold'>" + this.escapeForJavascript(v) + "</span>\"";
            numProps++;
            break;
            }
          }
        }
      }

    if (useInnerHTML) {
      var ih = node.innerHTML, index;

      if ((index = ih.indexOf("useInnerHTML")) != -1) {
        ih = ih.substring(index + "useInnerHTML".length);
        if (index = ih.indexOf("->") != -1)
          ih = ih.substring(index+3);
        }

      properties += ", <span style='color:#080;font-weight: bold'>innerHTML</span>:\"<span style='color:#00b;font-weight: bold'>" +  this.escapeForJavascript (ih) + "</span>\"";
      numProps++;
      numChildren = 0;
      }

    if (styles != "") {
      properties = "{<span style='color:#080;font-weight: bold'>style</span>:{" + styles + "}" + properties + "}";
      numProps++;
      }
    else
      properties = "{" + properties.substring(2) + "}";

    // element does not start with an indent, does not end with a linefeed or comma
    // children string starts with indent, has indent for each child

    str = "<span style='color:red;font-weight:bold'>" + node.nodeName + "</span> (";

    if (numChildren)
      if (numProps)
        return str + properties + ",\n" + children + indentStr + ")";
      else
        return str + "\n" + children + indentStr + ")";
    else
      if (numProps)
        return str + properties  + ")";
      else
        return str + ")";
    }
    break;

  case 3: //TEXT_NODE
    {
    var n = node.nodeValue;
    if (node.nodeValue != '')
      n = this.escapeForJavascript (n);

    n = this.trimSpaces (n);
    if (n.length > 0)
      return "\"<b>" + n + "</b>\"";
    }
    break;

  case 4: // CDATA_SECTION_NODE
    break;

  case 5: // ENTITY_REFERENCE_NODE
    break;

  case 8: // COMMENT_NODE
    if (node.nodeValue.indexOf("useInnerHTML") != -1)
      return "useInnerHTML";
    break;
  }
return null;
},

//------------------------------------------------------------
makeJavascript : function (elem) {
var dbox = new AardvarkDBox ("#fff", true, false, false, this.strings.javascriptDomCode, true);
dbox.innerContainer.innerHTML = "<pre style=\"margin:3; width: 97%\">" + this.domJavascript(elem, 0) + "</pre><br>";
dbox.show ();
return true;
},

//-------------------------------------------------
showMenu : function () {
if(window.Logger)Logger.write(this.helpBoxId);
if (this.helpBoxId != null) {
  if (this.killDbox (this.helpBoxId) == true) {
    delete (this.helpBoxId);
    return;
    }
  }
var s = "<table style='margin:5px 10px 0 10px'>";
for (var i=0; i<this.keyCommands.length; i++) {
  s += "<tr><td style='padding: 3px 7px; border: 1px solid black; font-family: courier; font-weight: bold;" +
    "background-color: #fff'>" + this.keyCommands[i].keystroke +
    "</td><td style='padding: 3px 7px; font-size: .9em;  text-align: left;'>" + this.keyCommands[i].name + "</td></tr>";
  }
s += "</table><br>" + this.strings.karmaticsPlug;

var dbox = new AardvarkDBox ("#fff2db", true, true, true, this.strings.aardvarkKeystrokes);
dbox.innerContainer.innerHTML = s;
dbox.show ();
this.helpBoxId = dbox.id;
return true;
},


//------------------------------------------------------------
getByKey : function (key) {
var s = key + " - ";
for (var i=0; i<this.keyCommands.length; i++) {
    s += this.keyCommands[i].keystroke;
    if (this.keyCommands[i].keystroke == key) {
        return this.keyCommands[i];
        }
    }
return null;
},

//------------------------------------------------------------
getElementXPath: function(elem) {
  var path = "";
  for (; elem && elem.nodeType == 1; elem = elem.parentNode) {
    var index = 1;
    for (var sib = elem.previousSibling; sib; sib = sib.previousSibling) {
      if (sib.nodeType == 1 && sib.tagName == elem.tagName)
        index++;
      }
    var xname = "xhtml:" + elem.tagName.toLowerCase();
    if (elem.id) {
      xname += "[@id='" + elem.id + "']";
    } else {
      if (index > 1)
        xname += "[" + index + "]";
    }
    path = "/" + xname + path;
  }
var dbox = new AardvarkDBox ("#fff", true, false, false, "xPath", true);
dbox.innerContainer.innerHTML = "<pre wrap=\"virtual\" style=\"margin:3; width: 97%\">" + this.escapeHTML(path) + "</pre><br>";
dbox.show ();
},

//------------------------------------------------------------
getElementPath: function(elem) {
  if(window.SimplePath) {
    SimplePath.openEditor(elem);
  }
},

//--------------------------------------------------------
// make a global variable, available to javascript running inside the page
// handy tool for javascript developers
// The bookmarklet version also adds a function to the element that iterates
// the descendents
makeGlobalFromElement: function(elem) {
if (this.isBookmarklet) {
  for (var i=1; i<100; i++) {
    if (this.window["elem"+i]==undefined) {
      this.window["elem"+i] = elem;
      elem.tree = this.tree;
      var dbox = new AardvarkDBox ("#feb", false, true, true);
      dbox.innerContainer.innerHTML = "<p style='color: #000; margin: 3px 0 0 0;'>global variable \"<b>elem" + i + "</b>\" created</p>";
      dbox.show ();
      this.scheduleDboxClose(dbox);

      return true;
      }
    }
  }
else {
  // this is kind of a hack to make the variable available to javascript
  // within the page
  if (this.doc.aardvarkElemNum == null)
    this.doc.aardvarkElemNum = 1;
  else
    this.doc.aardvarkElemNum++;
  var removeId = false;
  if (elem.id == null || elem.id == "") {
    elem.id = "aardvarkTmpId" + this.doc.aardvarkElemNum;
    removeId = true;
    }
  var s = "window.elem" + this.doc.aardvarkElemNum + "= document.getElementById('" + elem.id + "');\n";
  if (removeId)
    s += "document.getElementById('" + elem.id + "').id = '';";


  this.showMessage ("<p style='color: #000; margin: 3px 0 0 0;'>global variable \"<b>elem" + this.doc.aardvarkElemNum + "</b>\" created</p>");

  var scriptElem=this.doc.createElement('script');
  scriptElem.type='text/javascript';
  scriptElem.appendChild (this.doc.createTextNode(s));
  var h = this.doc.getElementsByTagName("head")[0];
  h.appendChild(scriptElem);
  return true;
  }
return false;
},

//--------------------------------------------------------
showMessage : function (s) {
  var dbox = new AardvarkDBox ("#feb", false, true, true);
  dbox.innerContainer.innerHTML = s;
  dbox.show ();
  this.scheduleDboxClose(dbox);

},

//--------------------------------------------------------
getNextElement : function () {
this.index++;
if (this.index < this.list.length) {
  this.depth = this.list[this.index].depth;
  return this.list[this.index].elem;
  }
return null;
},

//--------------------------------------------------------
tree : function () {
var t = {
  list: [{elem: this, depth: 0}],
  index: -1,
  depth: 0,
  next: aardvark.getNextElement
  };
aardvark.addChildren (this, t, 1);
return t;
},

//--------------------------------------------------------
addChildren : function (elem, t, depth) {
  for (var i=0; i<elem.childNodes.length; i++) {
    var child = elem.childNodes[i];
    if (child.nodeType == 1) {
      t.list.push({elem: child, depth: depth});
      if (child.childNodes.length != 0 && !aardvark.leafElems[child.nodeName])
        aardvark.addChildren(child, t, depth + 1);
      }
    }
  }

});
