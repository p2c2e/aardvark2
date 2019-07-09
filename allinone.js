var showHtml = function (elem) {
    };

var basePath = document.getElementById('extensionpath').getAttribute("path");
var aardvark = {

isBookmarklet: true,
// resourcePrefix: "http://karmatics.com/aardvark/",
resourcePrefix: basePath,
  srcFiles: [
  'aardvarkStrings.js',
  'aardvarkUtils.js',
  'aardvarkDBox.js',
  'aardvarkCommands.js',
  'aardvarkMain.js'
  ],

//------------------------------------------------
// onload function for script elements
loadObject: function  (obj) {
  var c = 0;

  for (var x in obj) {
    if (aardvark[x] == undefined)
      aardvark[x] = obj[x];
     c++;
    }

  if (this.objectsLeftToLoad == undefined) {
    this.objectsLeftToLoad = this.srcFiles.length;
    }
  this.objectsLeftToLoad--;

  if (this.objectsLeftToLoad < 1) {
    // add anything here you want to happen when it is loaded
    // copy our own functions etc over aardvark's

    // start aardvark and show its help tip
    this.start ();
    this.showHelpTip(0);

    // add our custom commands
    aardvark.addCommand ("xpath", function(e) {
      if (window.SimplePath)
        SimplePath.showPathInSnippetEditor(e);
      else
        alert("please load snippet editor");
      });
    // add our custom commands
    }
  }
};

// function loadScript(scriptName, callback) {
//   var scriptEl = document.createElement('script');
//   scriptEl.src = chrome.extension.getURL(scriptName);
//   scriptEl.addEventListener('load', callback, false);
//   document.head.appendChild(scriptEl);
// }

// // load the aardvark code from karmatics.com
// (function () {
//
// // leave commented out if you wish to have it load a new
// // copy each time (for dev purposes...no need to refresh page)
// /*if (window.aardvark) {
//   aardvark.start ();
//   return;
//   } */
//
// // anti caching....dev only (leave empty string otherwise)
// var ensureFresh = ""; // "?" + Math.round(Math.random()*100);
//
// for (var i=0; i<aardvark.srcFiles.length; i++) {
// 	// var scriptElem = document.createElement('script');
// 	// scriptElem.isAardvark = true;
// 	// scriptElem.src = ((aardvark.srcFiles[i].indexOf("http://") == 0) ?
// 	//     aardvark.srcFiles[i] : aardvark.resourcePrefix + aardvark.srcFiles[i]) + ensureFresh;
// 	// document.body.appendChild(scriptElem);
//     loadScript(aardvark.srcFiles[i], null);
//     // console.log(aardvark.srcFiles[i]);
// 	}
// }
//
// )();

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
  ["quit", this.quit, true],
  ["remove", this.removeElement],
  ["kill", this.rip, null, "extension"],
  ["isolate", this.isolateElement],
  ["black on white", this.blackOnWhite],
  ["deWidthify", this.deWidthify],
  ["colorize", this.colorize],
  ["view source", this.viewSource],
  ["javascript", this.makeJavascript],
  ["paste", this.domPath],
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

if (this.doc.all) {
  this.doc.detachEvent ("onmouseover", this.mouseOver);
  this.doc.detachEvent ("onmousemove", this.mouseMove);
  this.doc.detachEvent ("onkeypress", this.keyDown);
  this.doc.detachEvent ("onmouseup", this.mouseUp, false);
  }
else {
  this.doc.removeEventListener("mouseover", this.mouseOver, false);
  this.doc.removeEventListener("mousemove", this.mouseMove, false);
  this.doc.removeEventListener("mouseup", this.mouseUp, false);
  this.doc.removeEventListener("keypress", this.keyDown, false);
  }

this.removeBoxFromBody ();

delete (this.selectedElem);
if (this.widerStack)
  delete (this.widerStack);
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
elem.style.backgroundColor = "#" +
    Math.floor(Math.random()*16).toString(16) +
    Math.floor(Math.random()*16).toString(16) +
    Math.floor(Math.random()*16).toString(16);
elem.style.backgroundImage = "";
return true;
},

//------------------------------------------------------------
removeElement : function (elem) {
if (elem.parentNode != null) {
  var tmpUndoData = {
    next : this.undoData,
    mode : 'R',
    elem : elem,
    parent : elem.parentNode,
    nextSibling : elem.nextSibling
    };
  this.undoData = tmpUndoData;
  elem.parentNode.removeChild (elem);
  this.clearBox ();
  return true;
  }
return false;
},

//------------------------------------------------------------
paste : function (o) {
if (o.parentNode != null) {
  if (this.undoData.mode == "R") {
    e = this.undoData.elem;
    if (e.nodeName == "TR" && o.nodeName != "TR") {
      var t = this.doc.createElement ("TABLE");
      var tb = this.doc.createElement ("TBODY");
      t.appendChild (tb);
      tb.appendChild (e);
      e = t;
      }
    else if (e.nodeName == "TD" && o.nodeName != "TD") {
      var t2 = this.doc.createElement ("DIV");

      var len = e.childNodes.length, i, a = [];

      for (i=0; i<len; i++)
        a[i] = e.childNodes.item(i);

      for (i=0; i<len; i++) {
        e.removeChild(a[i]);
        t2.appendChild (e);
        }
      t2.appendChild (e);
      e = t2;
      }

    if (o.nodeName == "TD" && e.nodeName != "TD")
      o.insertBefore (e, o.firstChild);
    else if (o.nodeName == "TR" && e.nodeName != "TR")
      o.insertBefore (e, o.firstChild.firstChild);
    else
      o.parentNode.insertBefore (e, o);
    this.clearBox ();
    this.undoData = this.undoData.next;
    }
  }
return true;
},

//------------------------------------------------------------
isolateElement : function (o) {
if (o.parentNode != null) {
  this.clearBox ();

  var clone;

  if (document.all) {
    // this hack prevents a crash on cnn.com
    if (o.tagName == "TR" || o.tagName == "TD") {
      var t = this.doc.createElement ("TABLE");
      var tb = this.doc.createElement ("TBODY");
      t.appendChild (tb);

      if (o.tagName == "TD") {
        var tr = this.doc.createElement ("TR");
        var td = this.doc.createElement ("TD");
        td.innerHTML = o.innerHTML;
        tr.appendChild (td);
        tb.appendChild (tr);
        }
      else {
        var tr = this.doc.createElement ("TR");
        var len = o.childNodes.length;

        for (var i=0; i<len; i++) {
          var td = o.childNodes.item(i);
          if (td.nodeName == "TD") {
            var newTd = this.doc.createElement ("TD");
            newTd.innerHTML = td.innerHTML;
            tr.appendChild (newTd);
            }
          }
        tb.appendChild (tr);
        }
      clone = t;
      }
    else {
      var div = document.createElement ("DIV");
      div.innerHTML = o.outerHTML;
      clone = div.firstChild;
      }
    }
  else {
    clone = o.cloneNode (true);
    }

  clone.style.textAlign = "";
  clone.style.cssFloat = "none";
  clone.style.styleFloat = "none";
  clone.style.position = "";
  clone.style.padding = "5px";
  clone.style.margin = "5px";

  if (clone.tagName == "TR" || clone.tagName == "TD") {
    if (clone.tagName == "TD") {
      var tr = this.doc.createElement ("TR");
      tr.appendChild (clone);
      clone = tr;
      }
    var t = this.doc.createElement ("TABLE");
    var tb = this.doc.createElement ("TBODY");
    t.appendChild (tb);
    tb.appendChild (clone);
    clone = t;
    }

  var tmpUndoData = [];
  var len = this.doc.body.childNodes.length, i, count = 0, e;

  for (i=0; i<len; i++) {
    e = this.doc.body.childNodes.item(i);
    if (!e.isAardvark) {
      tmpUndoData[count] = e;
      count++;
      }
    }
  tmpUndoData.numElems = count;

  for (i=count-1; i>=0; i--)
    this.doc.body.removeChild (tmpUndoData[i]);

  tmpUndoData.mode = 'I';
  tmpUndoData.bg = this.doc.body.style.background;
  tmpUndoData.bgc = this.doc.body.style.backgroundColor;
  tmpUndoData.bgi = this.doc.body.style.backgroundImage;
  tmpUndoData.m = this.doc.body.style.margin;
  tmpUndoData.ta = this.doc.body.style.textAlign;
  tmpUndoData.next = this.undoData;
  this.undoData = tmpUndoData;

  this.doc.body.style.width = "100%";
  this.doc.body.style.background = "none";
  this.doc.body.style.backgroundColor = "white";
  this.doc.body.style.backgroundImage = "none";
  this.doc.body.style.textAlign = "left";

  this.doc.body.appendChild (clone);

  //this.makeElems ();
  this.window.scroll (0, 0);
  }
return true;
},

//-------------------------------------------------
deWidthify : function (node, skipClear) {
switch (node.nodeType) {
  case 1: // ELEMENT_NODE
    {
    if (node.tagName != "IMG") {
      node.style.width = 'auto';
      if (node.width)
        node.width = null;
      }
    var isLeaf = (node.childNodes.length == 0 && this.leafElems[node.nodeName]);

    if (!isLeaf)
      for (var i=0; i<node.childNodes.length; i++)
        this.deWidthify (node.childNodes.item(i));
    }
    break;
  }
if (!skipClear)
  this.clearBox ();
return true;
},

//--------------------------------------------------------
blackOnWhite : function (node, isLink) {
// this could be done way better using the createCSSRule thing
switch (node.nodeType) {
  case 1: // ELEMENT_NODE
    {
    if (node.tagName != "IMG") {
      if (node.tagName == "A")
        isLink = true;
      node.style.color = "#000";
//      node.style.color = (isLink)?"#006":"#000";
      if (isLink)
        node.style.textDecoration = "underline";
      node.style.backgroundColor = "#fff";
      node.style.fontFamily = "arial";
      node.style.fontSize = "13px";
      node.style.textAlign = "left";
      node.align = "left";
      node.style.backgroundImage = "";

      var isLeaf = (node.childNodes.length == 0 && this.leafElems[node.nodeName]);

      if (!isLeaf)
        for (var i=0; i<node.childNodes.length; i++)
          this.blackOnWhite(node.childNodes.item(i), isLink);
      }
    }
    break;
  }
return true;
},

//--------------------------------------------------------
getOuterHtmlFormatted : function (node, indent) {
var str = "";

if (this.doc.all) {
  return "<pre>" + node.outerHTML.replace(/\</g, '&lt;').replace(/\>/g, '&gt;') + "</pre>";
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
          str += node.attributes.item(i).nodeName;

          if (node.attributes.item(i).nodeName == "style") {
            var styles = "";
            var a = node.attributes.item(i).nodeValue.split(";");
            for (var j=0; j<a.length; j++) {
              var pair = a[j].split (":");
              if (pair.length == 2) {
                var s = this.trimSpaces(pair[0]), index;
                styles += "; <span class='aname'>" + s + "</span>: <span class='aval'>" + this.trimSpaces(pair[1]) + "</span>";
                }
              }
            styles = styles.substring (2);
            str += "</span>=\"" +  styles + "\"";
            }
          else {
            str += "</span>=\"<span class='pval'>" +  node.attributes.item(i).nodeValue + "</span>\"";
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
    v = v.replace ("<", "&amp;lt;").replace (">", "&amp;gt;");

    v = this.trimSpaces (v);
    if (v != '' && v != '\n'
        && v != '\r\n' && v.charCodeAt(0) != 160)
      str += "<div class='vsindent'>" + v + "</div>";
    }
    break;

  case 4: // CDATA_SECTION_NODE
    str += "<div class='vsindent'>&lt;![CDATA[" + node.nodeValue + "]]></div>";
    break;

  case 5: // ENTITY_REFERENCE_NODE
    str += "&amp;" + node.nodeName + ";<br>"
    break;

  case 8: // COMMENT_NODE
    str += "<div class='vsindent'>&lt;!--" + node.nodeValue + "--></div>"
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
                 styles += ", <span style='color:#060; font-style:italic'>styleFloat</span>: \"<span style='color:#008;font-style:italic'>" + this.trimSpaces(pair[1]) + "</span>\", <span style='color:#060; font-style:italic'>cssFloat</span>: \"<span style='color:#008;font-style:italic'>" + this.trimSpaces(pair[1]) + "</span>\"";
                 }
                else {
                 styles += ", <span style='color:#060; font-style:italic'>" + s + "</span>: \"<span style='color:#008;font-style:italic'>" + this.trimSpaces(pair[1]) + "</span>\"";
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
            properties += ", <span style='color:#080;font-weight: bold'>" + n + "</span>:\"<span style='color:#00b;font-weight: bold'>" + v + "</span>\"";
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
undo : function () {
if (this.undoData == null)
  return false;

this.clearBox ();
var ud = this.undoData;
switch (ud.mode) {
  case "I": {
    var a = [];
    var len = this.doc.body.childNodes.length, i, count = 0, e;

    for (i=0; i<len; i++)
      {
      e = this.doc.body.childNodes.item (i);
      if (!e.isAardvark)
        {
        a[count] = e;
        count++;
        }
      }
    for (i=count-1; i>=0; i--)
      this.doc.body.removeChild (a[i]);

    len = this.undoData.numElems;
    for (i=0; i<len; i++)
      this.doc.body.appendChild (this.undoData[i]);

    this.doc.body.style.background = this.undoData.bg;
    this.doc.body.style.backgroundColor = this.undoData.bgc;
    this.doc.body.style.backgroundImage = this.undoData.bgi;
    this.doc.body.style.margin = this.undoData.m;
    this.doc.body.style.textAlign = this.undoData.ta;
    break;
    }
  case "R": {
    if (ud.nextSibling)
      ud.parent.insertBefore (ud.elem, ud.nextSibling);
    else
      ud.parent.appendChild (ud.elem);
    break;
    }
  default:
    return false;
  }
this.undoData = this.undoData.next;
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
dbox.innerContainer.innerHTML = "<pre wrap=\"virtual\" style=\"margin:3; width: 97%\">" + path + "</pre><br>";
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
      setTimeout ("aardvark.killDbox(" + dbox.id + ")", 2000);
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
  setTimeout ("aardvark.killDbox(" + dbox.id + ")", 2000);
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
aardvark.loadObject ({

killDbox : function(id) {
var d = aardvark.doc.getElementById ("aardvarkdbox-" + id);
if (d) {
 aardvark.doc.body.removeChild (d);
 return true;
 }
return false;
},

dboxMouseDown : function(evt) {
if (!evt)
 evt = this.window.event;

var s = "aardvarkdbox-";
var killDbox = false;
var elem = aardvark.getElemFromEvent (evt);
var doClose = false, doSelect = false, index;

while (elem) {
 if (elem.isAardvarkSelectLink)
  doSelect = true;
 else if (elem.isAardvarkCloseButton)
  doClose = true;

 if (elem.id && elem.id.indexOf (s) == 0) {
  if (doSelect) {
   var e;
   for (var i=0; i<elem.childNodes.length; i++) {
    e = elem.childNodes.item(i);
    if (e.isDboxInnerContainer) {
     highlightText (e);
     }
    }
   }
  else if (doClose) {
   aardvark.doc.body.removeChild (elem);
   aardvark.dBoxArray[parseInt (elem.id.substring(s.length))] = null;
   }
  else {
   aardvark.dragElement = elem;
   aardvark.dragStartPos = aardvark.getPos (elem);
   aardvark.dragClickX = aardvark.mousePosX;
   aardvark.dragClickY = aardvark.mousePosY;
   }
  if (evt.preventDefault)
   evt.preventDefault ();
  else
   evt.returnValue = false;
  return false;
  }
 elem = elem.parentNode;
 }
},

dBoxId : 0,
dBoxArray : []
});

// todo:  remove use of prototype

function AardvarkDBox (bgColor, dragger, upperLeft, hideScrollbar, title, addSelectLink) {
if (!aardvark.doc.didDboxCss) {
 aardvark.createCSSRule ("div.aardvarkdbox div,div.aardvarkdbox table,div.aardvarkdbox td,div.aardvarkdbox tr,div.aardvarkdbox p,div.aardvarkdbox a", "color: black; background-color: transparent; border: 0; font-family: arial; font-weight: normal; font-size: 13px; font-style: normal; text-align: left; text-decoration: none;  text-indent: 0;vertical-align: top; ");
 aardvark.createCSSRule ("div.aardvarkdbox table", "border-spacing:2px;border-collapse:separate;");
 aardvark.createCSSRule ("div.aardvarkdbox td", "text-align: center; vertical-align: middle");
 aardvark.createCSSRule ("div.aardvarkdbox a, div.aardvarkdbox a:visited", "color: #007;text-decoration: underline");
 aardvark.createCSSRule ("div.aardvarkdbox a:hover", "color: #00f;");
 aardvark.doc.didDboxCss = true;
 }
 var outerDiv, f = null;

if (upperLeft)
 this.upperLeft = true;
this.dims = aardvark.getWindowDimensions ();
var dims = this.dims;
dims.width -= 15;
dims.height -= 15;
this.bgColor = bgColor;

this.id = aardvark.dBoxId;

outerDiv = aardvark.doc.createElement ("DIV");
// outerDiv.style.visibility = "hidden";
outerDiv.style.padding = "0";
outerDiv.style.margin = "0";
outerDiv.style.position = "absolute";
outerDiv.style.top = "-5000px"; /* (dims.scrollY + 5) + "px"; */
outerDiv.style.left =  "-5000px"; /* (dims.scrollX + 5) + "px"; */
outerDiv.style.zIndex = "5025";
outerDiv.style.width = (dims.width-20) + "px";
outerDiv.style.height = (dims.height-20) + "px";
outerDiv.id = "aardvarkdbox-" + aardvark.dBoxId;
outerDiv.className = "aardvarkdbox";

var draggerDiv = null;
if (dragger) {
 draggerDiv = aardvark.doc.createElement ("DIV");
 draggerDiv.style.cssFloat = "left";
 draggerDiv.style.styleFloat = "left";
 draggerDiv.style.fontFamily = "arial";
 draggerDiv.style.padding = "2px";
 draggerDiv.style.margin = "0";
 draggerDiv.style.height = "14px";

 outerDiv.appendChild (draggerDiv);
 var closer = aardvark.doc.createElement("IMG");

 closer.src = aardvark.resourcePrefix + "closedbox.gif";
 closer.style.cssFloat = "left";
 closer.style.styleFloat = "left";
 closer.style.width = "17px";
 closer.style.height = "17px";
 closer.alt = "close";
 closer.style.margin = "-2px 4px 0 0";
 closer.style.cursor = "pointer";
 closer.isAardvark = true;
 closer.isAardvarkCloseButton = true;
 draggerDiv.appendChild (closer);
 if (addSelectLink) {
  var a = aardvark.doc.createElement ("div")
  a.innerHTML = "select all";
  a.style.fontFamily = "arial";
  a.style.padding = '0';
  a.style.margin = '0';
  a.style.textDecoration = 'underline';
  a.style.cssFloat = "right";
  a.style.styleFloat = "right";
  a.style.color = "#008";
  a.style.fontSize = "11px";
  a.style.cursor = "pointer";
  a.isAardvarkSelectLink = true;
  draggerDiv.appendChild (a);
  }
 if (title) {
  draggerDiv.style.fontFamily = "arial";
  draggerDiv.style.textAlign = "left";
  draggerDiv.style.color = "#000";
  draggerDiv.style.fontSize = "12px";
  draggerDiv.appendChild (aardvark.doc.createTextNode (title));
  draggerDiv.appendChild (aardvark.doc.createElement ("br"));
  }
 aardvark.setHandler (draggerDiv, "mousedown", aardvark.dboxMouseDown);
 }
f = aardvark.doc.createElement ("DIV");
f.isDboxInnerContainer = true;
f.style.cssFloat = "left";
f.style.styleFloat = "left";
f.style.border = '0';
f.style.margin = '0';
f.style.padding = '4px';
f.style.fontFamily = "arial";
f.style.fontSize = "13px";
f.style.color = "#000";
if (hideScrollbar) {
 f.style.overflow = 'hidden';
 f.scrolling = "no";
 }
else
 f.style.overflow = 'auto';
outerDiv.appendChild (f);
aardvark.doc.body.appendChild (outerDiv);

this.outerContainer = outerDiv;
this.dragBar = draggerDiv;

this.innerContainer = f;
aardvark.dBoxArray[aardvark.dBoxId] = this;
aardvark.dBoxId++;

return this;
};

AardvarkDBox.prototype.show = function () {
var dims = this.dims;
var draggerHeight = 1;

if (this.dragBar)
 draggerHeight = 18;

var w = this.innerContainer.offsetWidth
if (!this.innerContainer.style.width || this.innerContainer.style.width != '')
 w += 25;
if (this.dragBar) {
 var w2 = this.dragBar.offsetWidth + 12;
 if (w2 > w)
  w = w2;
 this.dragBar.style.cssFloat = "";
 this.dragBar.style.styleFloat = "";
 }

if (w > dims.width - 20)
 w = dims.width - 20;
this.outerContainer.style.width = w + "px";
this.innerContainer.style.width = w + "px";

if ((diff = this.innerContainer.offsetWidth-w) > 0)
 this.innerContainer.style.width = (w - diff) + "px";

var h = this.innerContainer.offsetHeight, diff;
if (h > dims.height-45)
 h = dims.height-45;
this.outerContainer.style.height = (h + draggerHeight) + "px";
this.innerContainer.style.height = h + "px";

if ((diff = this.innerContainer.offsetHeight-h) > 0)
 this.innerContainer.style.height = (h - diff) + "px";

this.innerContainer.style.backgroundColor = this.bgColor;
var x, y;

if (this.upperLeft) {
 x = dims.scrollX + 20;
 y = dims.scrollY + 20;
 }
else {
 x = dims.scrollX + (dims.width / 2) - (w/2);
 y = dims.scrollY + (dims.height / 2) - (h/2);
 }
aardvark.moveElem (this.outerContainer, x, y);

this.outerContainer.style.border = '1px solid #000';
this.outerContainer.style.backgroundColor = "#888";

if (this.dragBar)
 this.dragBar.style.backgroundColor = "#d8d7dc";
aardvark.setAardvarkElem (this.outerContainer);
// this.outerContainer.style.visibility = '';
}

AardvarkDBox.prototype.close = function () {
aardvark.doc.body.removeChild (this.outerContainer)
};

function highlightText(elem) {
if (aardvark.doc.selection) {
 var r1 = aardvark.doc.body.createTextRange();
 r1.moveToElementText(elem);
 r1.setEndPoint("EndToEnd", r1);
 r1.moveStart('character', 4);
 r1.moveEnd('character', 8);
 r1.select();
 }
else {
 s = aardvark.window.getSelection();
 var r1 = aardvark.doc.createRange();
 r1.setStartBefore(elem);
 r1.setEndAfter(elem) ;
 s.addRange(r1);
 }
};
aardvark.loadObject ({

//-------------------------------------------------
showHelpTip : function () {
var dbox = new AardvarkDBox ("#fff2db", false, true, true);
dbox.innerContainer.innerHTML = "<p style='clear: both; margin: 3px 0 0 0;'><img src='" +  this.resourcePrefix + "aardvarkhelp.gif' style=' float: right; margin: 0 0 0px 0'>" + this.strings.initialTipText + "</p>";
dbox.innerContainer.style.width = "14em";
dbox.innerContainer.style.height = "54px";
dbox.show ();
setTimeout ("aardvark.killDbox(" + dbox.id + ")", 2000);
return true;
},

//-------------------------------------------------
// create the box and tag etc (done once and saved)
makeElems : function () {
this.borderElems = [];
var d, i, s;

for (i=0; i<4; i++) {
  d = this.doc.createElement ("DIV");
  s = d.style;
  s.display = "none";
  s.overflow = "hidden";
  s.position = "absolute";
  s.height = "2px";
  s.width = "2px";
  s.top = "20px";
  s.left = "20px";
  s.zIndex = "5000";
  d.isAardvark = true; // mark as ours
  this.borderElems[i] = d;
  this.doc.body.appendChild (d);
  }
var be = this.borderElems;
be[0].style.borderTopWidth = "2px";
be[0].style.borderTopColor = "#f00";
be[0].style.borderTopStyle = "solid";
be[1].style.borderBottomWidth = "2px";
be[1].style.borderBottomColor = "#f00";
be[1].style.borderBottomStyle = "solid";
be[2].style.borderLeftWidth = "2px";
be[2].style.borderLeftColor = "#f00";
be[2].style.borderLeftStyle = "solid";
be[3].style.borderRightWidth = "2px";
be[3].style.borderRightColor = "#f00";
be[3].style.borderRightStyle = "solid";

d = this.doc.createElement ("DIV");
this.setElementStyleDefault (d, "#fff0cc");
d.isAardvark = true; // mark as ours
d.isLabel = true; //
d.style.borderTopWidth = "0";
d.style.MozBorderRadiusBottomleft = "6px";
d.style.MozBorderRadiusBottomright = "6px";
d.style.WebkitBorderBottomLeftRadius = "6px";
d.style.WebkitBorderBottomRightRadius = "6px";
d.style.zIndex = "5005";
d.style.visibility = "hidden";
this.doc.body.appendChild (d);
this.labelElem = d;

d = this.doc.createElement ("DIV");
this.setElementStyleDefault (d, "#dfd");
d.isAardvark = true; // mark as ours
d.isKeybox = true; //
d.style.backgroundColor = "#cfc";
d.style.zIndex = "5008";
this.doc.body.appendChild (d);
this.keyboxElem = d;
},

//-------------------------------------------------
// show the red box around the element, and display
// the string in the little tag
showBoxAndLabel : function (elem, string) {
var pos = this.getPos(elem)
var dims = this.getWindowDimensions ();
var y = pos.y;

this.moveElem (this.borderElems[0], pos.x, y);
this.borderElems[0].style.width = elem.offsetWidth + "px";
this.borderElems[0].style.display = "";

this.moveElem (this.borderElems[1], pos.x, y+elem.offsetHeight-2);
this.borderElems[1].style.width = (elem.offsetWidth + 2)  + "px";
this.borderElems[1].style.display = "";

this.moveElem (this.borderElems[2], pos.x, y);
this.borderElems[2].style.height = elem.offsetHeight  + "px";
this.borderElems[2].style.display = "";

this.moveElem (this.borderElems[3], pos.x+elem.offsetWidth-2, y);
this.borderElems[3].style.height = elem.offsetHeight + "px";
this.borderElems[3].style.display = "";

y += elem.offsetHeight + 2;

this.labelElem.innerHTML = string;
this.labelElem.style.display = '';

// adjust the label as necessary to make sure it is within screen and
// the border is pretty
if ((y + this.labelElem.offsetHeight) >= dims.scrollY + dims.height) {
  this.labelElem.style.borderTopWidth = "1px";
  this.labelElem.style.MozBorderRadiusTopleft = "6px";
  this.labelElem.style.MozBorderRadiusTopright = "6px";
  this.labelElem.style.WebkitBorderTopLeftRadius = "6px";
  this.labelElem.style.WebkitBorderTopRightRadius = "6px";
  this.labelDrawnHigh = true;
  y = (dims.scrollY + dims.height) - this.labelElem.offsetHeight;
  }
else if (this.labelElem.offsetWidth > elem.offsetWidth) {
  this.labelElem.style.borderTopWidth = "1px";
  this.labelElem.style.MozBorderRadiusTopright = "6px";
  this.labelElem.style.WebkitBorderTopRightRadius = "6px";
  this.labelDrawnHigh = true;
  }
else if (this.labelDrawnHigh) {
  this.labelElem.style.borderTopWidth = "0";
  this.labelElem.style.MozBorderRadiusTopleft = "";
  this.labelElem.style.MozBorderRadiusTopright = "";
  this.labelElem.style.WebkitBorderTopLeftRadius = "";
  this.labelElem.style.WebkitBorderTopRightRadius = "";
  delete (this.labelDrawnHigh);
  }
this.moveElem (this.labelElem, pos.x+2, y);
this.labelElem.style.visibility = "visible";
},

//-------------------------------------------------
removeBoxFromBody : function () {
if (this.labelElem) {
  this.doc.body.removeChild(this.labelElem);
  this.labelElem = null;
  }
if (this.keyboxElem) {
  this.doc.body.removeChild(this.keyboxElem);
  this.keyboxElem = null;
  }
if (this.borderElems != null) {
  for (var i=0; i<4; i++)
    this.doc.body.removeChild(this.borderElems[i]);
  this.borderElems = null;
  }
},

//-------------------------------------------------
// remove the red box and tag
clearBox : function () {
this.selectedElem = null;
if (this.borderElems != null) {
  for (var i=0; i<4; i++)
    this.borderElems[i].style.display = "none";
  this.labelElem.style.display = "none";
  this.labelElem.style.visibility = "hidden";
  }
},

//-------------------------------------------------
hideKeybox : function () {
this.keyboxElem.style.display = "none";
this.keyboxTimeoutHandle = null;
},

//-------------------------------------------------
showKeybox : function (command){
if (this.keyboxElem == null)
  return;

if (command.keyOffset >= 0) {
  var s1 = command.name.substring(0, command.keyOffset);
  var s2 = command.name.substring(command.keyOffset+1);

  this.keyboxElem.innerHTML = s1 + "<b style='font-size:2em;'>" +
      command.name.charAt(command.keyOffset) + "</b>" + s2;
  }
else {
  this.keyboxElem.innerHTML = command.name;
  }

var dims = this.getWindowDimensions ();
var y = dims.scrollY + this.mousePosY + 10;
if (y < 0)
  y = 0;
else if (y > (dims.scrollY + dims.height) - 30)
  y = (dims.scrollY + dims.height) - 60;
var x = this.mousePosX + 10;
if (x < 0)
  x = 0;
else if (x > (dims.scrollX + dims.width) - 60)
  x = (dims.scrollX + dims.width) - 100;

this.moveElem (this.keyboxElem, x, y);
this.keyboxElem.style.display = "";
if (this.keyboxTimeoutHandle)
  clearTimeout (this.keyboxTimeoutHandle);
this.keyboxTimeoutHandle = setTimeout ("aardvark.hideKeybox()", 400);
},

validIfBlockElements : {
  SPAN: 1,
  A: 1
  },

validIfNotInlineElements : {
  UL: 1,
  LI: 1,
  OL: 1,
  PRE: 1,
  CODE: 1
  },

alwaysValidElements : {
  DIV: 1,
  IFRAME: 1,
  OBJECT: 1,
  APPLET: 1,
  BLOCKQUOTE: 1,
  H1: 1,
  H2: 1,
  H3: 1,
  FORM: 1,
  P: 1,
  TABLE: 1,
  TD: 1,
  TH: 1,
  TR: 1,
  IMG: 1
  },

//-------------------------------------------------
// given an element, walk upwards to find the first
// valid selectable element
findValidElement : function (elem) {
while (elem) {
  if (this.alwaysValidElements[elem.tagName])
    return elem;
  else if (this.validIfBlockElements[elem.tagName]) {
    if (this.doc.defaultView) {
      if (this.doc.defaultView.getComputedStyle
            (elem, null).getPropertyValue("display") == 'block')
        return elem;
      }
    else if (elem.currentStyle){
      if (elem.currentStyle["display"] == 'block')
        return elem;
      }
    }
  else if (this.validIfNotInlineElements[elem.tagName]){
    if (this.doc.defaultView) {
      if (this.doc.defaultView.getComputedStyle
            (elem, null).getPropertyValue("display") != 'inline')
        return elem;
      }
    else if (elem.currentStyle) {
      if (elem.currentStyle["display"] != 'inline')
        return elem;
      }
    }
  elem = elem.parentNode;
  }
return elem;
},

//-------------------------------------------------
makeElementLabelString : function (elem) {
var s = "<b style='color:#000'>" + elem.tagName.toLowerCase() + "</b>";
if (elem.id != '')
  s += ", id: " + elem.id;
if (elem.className != '')
  s += ", class: " + elem.className;
return s;
},

//-------------------------------------------------
mouseUp : function (evt) {
// todo: remove all this when we replace dlogbox with our popupwindow
if (aardvark.dragElement) {
  delete aardvark.dragElement;
  delete aardvark.dragClickX;
  delete aardvark.dragClickY;
  delete aardvark.dragStartPos;
  }
return false;
},

// the following three functions are the main event handlers
// note: "this" does not point to aardvark.main in these
//-------------------------------------------------
mouseMove : function (evt) {
if (!evt)
  evt = aardvark.window.event;

if (aardvark.mousePosX == evt.clientX &&
      aardvark.mousePosY == evt.clientY) {
  aardvark.mouseMoved = false;
  return;
  }

// todo: remove all this when we replace dlogbox with our popupwindow
aardvark.mousePosX  = evt.clientX;
aardvark.mousePosY = evt.clientY;

if (aardvark.dragElement) {
  aardvark.moveElem (aardvark.dragElement,
      (aardvark.mousePosX - aardvark.dragClickX) + aardvark.dragStartPos.x,
      (aardvark.mousePosY - aardvark.dragClickY) + aardvark.dragStartPos.y);
  aardvark.mouseMoved = false;
  return true;
  }

// if it hasn't actually moved (for instance, if something 
// changed under it causing a mouseover), we want to know that
aardvark.mouseMoved = true;
return false;
},

//-------------------------------------------------
mouseOver : function (evt) {
if (!evt)
  evt = aardvark.window.event;

if (!aardvark.mouseMoved)
  return;

var elem = aardvark.getElemFromEvent (evt);
if (elem == null) {
  aardvark.clearBox ();
  return;
  }
elem = aardvark.findValidElement (elem);

if (elem == null) {
  aardvark.clearBox();
  return;
  }

// note: this assumes that:
// 1. our display elements would be selectable types, and
// 2. elements inside display elements would not
if (elem.isAardvark) {
  if (elem.isKeybox)
    aardvark.hideKeybox();
  else if (elem.isLabel)
    aardvark.clearBox();
  else
    aardvark.isOnAardvarkElem = true;
  return;
  }

// this prevents it from snapping back to another element
// if you do a "wider" or "narrower" while on top of one
// of the border lines.  not fond of this, but its about
// the best i can do
if (aardvark.isOnAardvarkElem && aardvark.didWider) {
  var e = elem, foundIt = false;
  while ((e = e.parentNode) != null) {
    if (e == aardvark.selectedElem) {
      foundIt = true;
      break;
      }
    }
  if (foundIt) {
    aardvark.isOnAardvarkElem = false;
    return;
    }
  }
aardvark.isOnAardvarkElem = false;
aardvark.didWider = false;

if (elem == aardvark.selectedElem)
  return;
aardvark.widerStack = null;
aardvark.selectedElem = elem;
aardvark.showBoxAndLabel (elem, aardvark.makeElementLabelString (elem));
aardvark.mouseMoved = false;
},

//-------------------------------------------------
keyDown : function (evt) {
if (!evt)
  evt = aardvark.window.event;
var c;

if (evt.ctrlKey || evt.metaKey || evt.altKey)
  return true;

var keyCode = evt.keyCode ? evt.keyCode :
      evt.charCode ? evt.charCode :
      evt.which ? evt.which : 0;
c = String.fromCharCode(keyCode).toLowerCase();
var command = aardvark.getByKey(c);

if (command) {
  if (command.noElementNeeded) {
    if (command.func.call (aardvark) == true)
      aardvark.showKeybox (command);
    }
  else {
    if (aardvark.selectedElem &&
        (command.func.call (aardvark, aardvark.selectedElem) == true))
      aardvark.showKeybox (command);
    }
  }
if (c < 'a' || c > 'z')
  return true;
if (evt.preventDefault)
  evt.preventDefault ();
else
  evt.returnValue = false;
return false;
},

//-------------------------------------------------
// this is the main entry point when starting aardvark
start : function () {
this.loadCommands();

if (this.isBookmarklet) {
  this.window = window;
  this.doc = document;
  }
else {
  this.doc = ((gContextMenu) ? gContextMenu.target.ownerDocument : window._content.document);
  this.window = window._content;
  }

if (this.doc.aardvarkRunning) {
  this.quit();
  return;
  }
else {
  this.makeElems ();
  this.selectedElem = null;

  // need this to be page specific (for extension)...if you
  // change the page, aardvark will not be running
  this.doc.aardvarkRunning = true;

  if (this.doc.all) {
    this.doc.attachEvent ("onmouseover", this.mouseOver);
    this.doc.attachEvent ("onmousemove", this.mouseMove);
    this.doc.attachEvent ("onmouseup", this.mouseUp);
    this.doc.attachEvent ("onkeypress", this.keyDown);
    }
  else {
    this.doc.addEventListener ("mouseover", this.mouseOver, false);
    this.doc.addEventListener ("mouseup", this.mouseUp, false);
    this.doc.addEventListener ("mousemove", this.mouseMove, false);
    this.doc.addEventListener ("keypress", this.keyDown, false);
    }

  // show tip if its been more than an hour
  if (!this.isBookmarklet) {
    var t = new Date().getTime()/(1000*60);
    var diff = t - this.tipLastShown;
    if (diff > 60) { // more than an hour
      this.tipLastShown = Math.round(t);
      this.prefManager.setIntPref("extensions.aardvark@rob.brown.tipLastShown",
        this.tipLastShown);
      this.showHelpTip();
      }
    }
  }
}
});aardvark.loadObject ({strings: {

initialTipText : "Press the <span style='padding: 3px 7px; border: 1px solid black; font-family: courier; font-weight: bold; -moz-border-radius: 5px; background-color: #fff'>h</span> key for help",
viewHtmlSource : "View HTML source",
javascriptDomCode : "Javascript DOM code",
aardvarkKeystrokes : "Aardvark keystrokes",
karmaticsPlug : "<center><span style='font-size: .9em'>&copy;2005-2012 Rob Brown<br><span style='font-size: .9em'>( <a href='http://karmatics.com/aardvark/' target='_new'>aardvark docs</a> )</span></center>",
ripHelp : "<center>If you install the excellent <a href='http://addons.mozilla.org/firefox/521/' target='_new'>R.I.P.</a>,<br> (Remove It Permanently), the K command will<br>permanently remove items from a page.</center>",

// commands (precede shortcut letter with & if not first letter)
wider : "wider",
narrower : "narrower",
undo : "undo",
quit : "quit aardvark",
remove : "remove",
kill : "kill (<a href='http://addons.mozilla.org/firefox/521/' target='_new'>r.i.p.</a>)",
isolate : "isolate",
blackOnWhite : "black on white",
deWidthify : "de-widthify",
colorize : "colorize",
viewSource : "view source",
javascript : "javascript",
paste : "",
help : "help / hide help"

}});
aardvark.loadObject ({
//-----------------------------------------------------
setElementStyleDefault : function (elem, bgColor) {
  var s = elem.style;
  s.display = "none";
  s.backgroundColor = bgColor;
  s.borderColor = "black";
  s.borderWidth = "1px 2px 2px 1px";
  s.borderStyle = "solid";
  s.fontFamily = "arial";
  s.textAlign = "left";
  s.color = "#000";
  s.fontSize = "12px";
  s.position = "absolute";
  s.paddingTop = "2px";
  s.paddingBottom = "2px";
  s.paddingLeft = "5px";
  s.paddingRight = "5px";
  },

//-----------------------------------------------------
getPos : function (elem) {
  var pos = {};
  var originalElement = elem;
  var leftX = 0;
  var leftY = 0;
  if (elem.offsetParent) {
    while (elem.offsetParent) {
      leftX += elem.offsetLeft;
      leftY += elem.offsetTop;

      if (elem != originalElement && elem != document.body && elem != document.documentElement) {
        leftX -= elem.scrollLeft;
        leftY -= elem.scrollTop;
        }
      elem = elem.offsetParent;
      }
    }
  else if (elem.x) {
    leftX += elem.x;
    leftY += elem.y;
    }
  pos.x = leftX;
  pos.y = leftY;
  return pos;
  },

setAardvarkElem : function (elem) {
  if (elem.nodeType == 1) { // ELEMENT_NODE
    for (var i=0; i<elem.childNodes.length; i++) {
      elem.isAardvark = true;
      this.setAardvarkElem(elem.childNodes.item(i));
      }
    }
  },

//-----------------------------------------------------
setHandler : function(obj, eventName, code) {
  if (aardvark.doc.all)
    obj.attachEvent ("on" + eventName, code);
  else
    obj.addEventListener (eventName, code, false);
  },

//-----------------------------------------------------
// move a div (or whatever) to an x y location
moveElem : function (o, x, y) {
  o = o.style;

  if (aardvark.doc.all) {
    o.pixelLeft=x;
    o.pixelTop=y;
    }
  else {
    o.left=x + "px";
    o.top=y + "px";
    }
  },

//-------------------------------------------------
getElemFromEvent : function (evt) {
  return ((evt.target) ? evt.target : evt.srcElement);
  },

//-------------------------------------------------
getWindowDimensions : function () {
  var out = {};

  if (aardvark.window.pageXOffset) {
    out.scrollX = aardvark.window.pageXOffset;
    out.scrollY = aardvark.window.pageYOffset;
    }
  else if (aardvark.doc.documentElement) {
    out.scrollX = aardvark.doc.body.scrollLeft +
          aardvark.doc.documentElement.scrollLeft;
    out.scrollY = aardvark.doc.body.scrollTop +
          aardvark.doc.documentElement.scrollTop;
    }
  else if (aardvark.doc.body.scrollLeft >= 0) {
    out.scrollX = aardvark.doc.body.scrollLeft;
    out.scrollY = aardvark.doc.body.scrollTop;
    }
  if (aardvark.doc.compatMode == "BackCompat") {
    out.width = aardvark.doc.body.clientWidth;
    out.height = aardvark.doc.body.clientHeight;
    }
  else {
    out.width = aardvark.doc.documentElement.clientWidth;
    out.height = aardvark.doc.documentElement.clientHeight;
    }
  return out;
  },

leafElems : {IMG:true, HR:true, BR:true, INPUT:true},

//--------------------------------------------------------
// generate "outerHTML" for an element
// this doesn't work on IE, but its got its own outerHTML property
getOuterHtml : function (node) {
  var str = "";

  switch (node.nodeType) {
    case 1: { // ELEMENT_NODE
      var isLeaf = (node.childNodes.length == 0 && aardvark.leafElems[node.nodeName]);

      str += "<" + node.nodeName.toLowerCase() + " ";
      for (var i=0; i<node.attributes.length; i++) {
        if (node.attributes.item(i).nodeValue != null &&
          node.attributes.item(i).nodeValue != '') {
          str += node.attributes.item(i).nodeName +
            "='" +
            node.attributes.item(i).nodeValue +
            "' ";
          }
        }
      if (isLeaf)
        str += " />";
      else {
        str += ">";

        for (var i=0; i<node.childNodes.length; i++)
          str += aardvark.getOuterHtml(node.childNodes.item(i));

        str += "</" +
          node.nodeName.toLowerCase() + ">"
        }
      }
      break;

    case 3: //TEXT_NODE
      str += node.nodeValue;
      break;
    }
  return str;
  },


// borrowed from somewhere
createCSSRule : function (selector, declaration) {
  // test for IE (can i just use "aardvark.doc.all"?)
  var ua = navigator.userAgent.toLowerCase();
  var isIE = (/msie/.test(ua)) && !(/opera/.test(ua)) && (/win/.test(ua));

  // create the style node for all browsers
  var style_node = aardvark.doc.createElement("style");
  style_node.setAttribute("type", "text/css");
  style_node.setAttribute("media", "screen");
  style_node.isAardvark = true;

  // append a rule for good browsers
  if (!isIE)
    style_node.appendChild(aardvark.doc.createTextNode(selector + " {" + declaration + "}"));

  // append the style node
  aardvark.doc.getElementsByTagName("head")[0].appendChild(style_node);

  // use alternative methods for IE
  if (isIE && aardvark.doc.styleSheets && aardvark.doc.styleSheets.length > 0) {
    var last_style_node = aardvark.doc.styleSheets[aardvark.doc.styleSheets.length - 1];
    if (typeof(last_style_node.addRule) == "object"){
      var a = selector.split (",");
      for (var i=0; i<a.length; i++) {
        last_style_node.addRule(a[i], declaration);
        }
      }
    }
  },

trimSpaces : function (s) {
  while (s.charAt(0) == ' ')
    s = s.substring(1);
  while (s.charAt(s.length-1) == ' ')
    s = s.substring(0, s.length-1);
  return s;
  },

escapeForJavascript : function (s) {
  return s.replace(new RegExp("\n", "g"), " ").replace(new RegExp("\t", "g"), " ").replace(new RegExp("\"", "g"), "\\\"").replace(new RegExp("\'", "g"), "\\'").replace(new RegExp("<", "g"), "&lt;").replace(new RegExp(">", "g"), "&gt;");
  }
});
