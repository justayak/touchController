!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.TouchController=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";

var Utils = require('./utils');

function AnalogStick(domid, position) {

    var topTouchOffset = Utils.topTouchOffset();

    // ============ H E L P E R  F U N C T I O N S ============
    function handleStart(e) {
        self.pressed = true;
        e.preventDefault();
        self.fx = e.changedTouches[0].screenX;
        self.fy = e.changedTouches[0].screenY - topTouchOffset;
        if (self.allowOnClick && self.onClick !== null) self.onClick.call(self);
    }

    function handleEnd(e) {
        self.pressed = false;
        e.preventDefault();
        if (self.allowOnClick && self.onRelease !== null) self.onRelease.call(self);
    }

    function handleMove(e) {
        e.preventDefault();
        self.fx = e.changedTouches[0].screenX;
        self.fy = e.changedTouches[0].screenY - topTouchOffset;
        if (self.allowOnClick && self.onClick !== null) self.onClick.call(self);
    }
    // ============ H E L P E R  F U N C T I O N S ============

    this.allowOnClick = true;
    var el = document.getElementById(domid);
    var style = "";
    var self = this, id;
    var diameter = Utils.diameter();
    if (Utils.isTouchDevice()) {
        if (typeof position === 'undefined') {
            position = {};
        }
        if ("bottom" in position) {
            style += "bottom:" +position.bottom + "px;";
        } else if ("top" in position) {
            style += "top:" +position.top + "px;";
        }
        if ("left" in position){
            style += "left:" +position.left + "px;";
        } else if ("right" in position) {
            style += "right:" +position.right + "px;";
        }
        id = Utils.newId();
        el.innerHTML = '<div style="'+
            style+
            '" id="'+ id
            +'" class="touchController"><div class="innerTouchController"></div></div>';

        this.fx = -1;
        this.fy = -1;
        this.pressed = false;
        this.x = 0;
        this.y = 0;

        this.onClick = null;
        this.onRelease = null;

        el.addEventListener("touchstart", handleStart, false);
        el.addEventListener("touchend", handleEnd, false);
        el.addEventListener("touchmove", handleMove, false);
        el.addEventListener("touchcancel", handleEnd, false);

        setTimeout(function(){
            var el = document.getElementById(id);
            var o = Utils.getOffsetRect(el);
            self.x = o.left + Math.ceil(diameter/2);
            self.y = o.top + Math.ceil(diameter/2);
        },100);

    } else {
        // NON-TOUCH-DEVICE
        el.parentNode.removeChild(el);
    }
}

AnalogStick.prototype.isPressed = function(){
    return this.pressed;
};

AnalogStick.prototype.getDegree = function(){
    return Utils.getDegree(this.x, this.y, this.fx, this.fy);
};

module.exports = AnalogStick;
},{"./utils":7}],2:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";
var Utils = require('./utils.js');
var KeyboardController = require('./keyboardController.js');
var nextID = 0;

function Button(domid, name, options) {
    // ============ H E L P E R  F U N C T I O N S ============
    function handleStart(e) {
        document.getElementById(id).className = "touchBtn pressed";
        e.preventDefault();
    }

    function handleEnd(e) {
        if (self.onClick !== null) {
            self.onClick.call(self);
        }
        document.getElementById(id).className = "touchBtn";
        e.preventDefault();
    }

    function handleCancel(e){
        document.getElementById(id).className = "touchBtn";
        e.preventDefault();
    }
    // ============ H E L P E R  F U N C T I O N S ============

    var self = this;
    var el = document.getElementById(domid);
    var keyToButton = KeyboardController.keyToButton();
    if (Utils.isTouchDevice()) {
        var style = "";
        if (typeof options === "undefined") {
            options = {};
        }
        if ("bottom" in options){
            style += "bottom:" +options.bottom + "px;";
        } else if ("top" in options) {
            style += "top:" +options.top + "px;";
        }
        if ("left" in options){
            style += "left:" +options.left + "px;";
        } else if ("right" in options) {
            style += "right:" +options.right + "px;";
        }

        var id = "touchBtn" + nextID++;
        el.innerHTML = '<div style="'+
            style+
            '" id="'+ id
            +'" class="touchBtn"><div class="touchBtnTxt">' + name +'</div></div>';

        el.addEventListener("touchstart", handleStart, false);
        el.addEventListener("touchend", handleEnd, false);
        el.addEventListener("touchcancel", handleCancel, false);

    } else {
        // NON TOUCH DEVICE
        el.parentNode.removeChild(el);
        if ("key" in options) {
            keyToButton[options["key"]] = this;
        }
    }
    this.onClick = null;
}

module.exports = Button;
},{"./keyboardController.js":5,"./utils.js":7}],3:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";
var Utils = require('./utils.js');
var KeyboardController = require('./keyboardController.js');
var AnalogStick = require('./AnalogStick.js');

var listener = -1;

function DPad(domid, options) {
    var CLICK_INTERVAL_IN_MS = 500;
    var INTERVAL_SPEED = 125;
    var self = this;
    var lastTimePressedMs = 0;
    var firstClick = true;
    var keyPressCheck = null;
    var iskeydown = false;
    var currentKey = -1;

    AnalogStick.call(this, domid,options);
    if ("WASDEvents" in options && options["WASDEvents"]){
        if (listener !== -1) {
            clearInterval(listener);
        }

        if (Utils.isTouchDevice()) {
            this.onClick = function () {
                var now = new Date().getTime();
                if (firstClick) {
                    lastTimePressedMs = now;
                    firstClick = false;
                    switch (self.getDirection()){
                        case DPad.UP:
                            if (self.onUp !== null) self.onUp.call(self);
                            break;
                        case DPad.DOWN:
                            if (self.onDown !== null) self.onDown.call(self);
                            break;
                        case DPad.LEFT:
                            if (self.onLeft !== null) self.onLeft.call(self);
                            break;
                        case DPad.RIGHT:
                            if (self.onRight !== null) self.onRight.call(self);
                            break;
                    }
                } else {
                    if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                        lastTimePressedMs = now;
                        switch (self.getDirection()){
                            case DPad.UP:
                                if (self.onUp !== null) self.onUp.call(self);
                                break;
                            case DPad.DOWN:
                                if (self.onDown !== null) self.onDown.call(self);
                                break;
                            case DPad.LEFT:
                                if (self.onLeft !== null) self.onLeft.call(self);
                                break;
                            case DPad.RIGHT:
                                if (self.onRight !== null) self.onRight.call(self);
                                break;
                        }
                    }
                }
            };

            this.onRelease = function(){
                firstClick = true;
            };

            keyPressCheck = function() {
                if (self.isPressed()) {
                    var now = new Date().getTime();
                    if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                        lastTimePressedMs = now;
                        switch (self.getDirection()) {
                            case DPad.UP:
                                if (self.onUp !== null) self.onUp.call(self);
                                break;
                            case DPad.DOWN:
                                if (self.onDown !== null) self.onDown.call(self);
                                break;
                            case DPad.LEFT:
                                if (self.onLeft !== null) self.onLeft.call(self);
                                break;
                            case DPad.RIGHT:
                                if (self.onRight !== null) self.onRight.call(self);
                                break;
                        }
                    }
                }
            };
        } else {
            // NOT TOUCH DEVICE
            var keyPressed = {
                "87": false,
                "65": false,
                "68": false,
                "83": false
            };
            document.onkeydown = function(e){
                var keyCode = e.keyCode;
                if (keyCode === 87 || keyCode === 65 || keyCode === 68 || keyCode === 83) {
                    currentKey = keyCode;
                    keyPressed[""+keyCode] = true;
                    self.keyDirection = currentKey;
                    iskeydown = true;
                    var now = new Date().getTime();
                    if (firstClick) {
                        lastTimePressedMs = now;
                        firstClick = false;
                        switch (keyCode){
                            case DPad.UP:
                                if (self.onUp !== null) self.onUp.call(self);
                                break;
                            case DPad.DOWN:
                                if (self.onDown !== null) self.onDown.call(self);
                                break;
                            case DPad.LEFT:
                                if (self.onLeft !== null) self.onLeft.call(self);
                                break;
                            case DPad.RIGHT:
                                if (self.onRight !== null) self.onRight.call(self);
                                break;
                        }
                    } else {
                        if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                            lastTimePressedMs = now;
                            switch (keyCode){
                                case DPad.UP:
                                    if (self.onUp !== null) self.onUp.call(self);
                                    break;
                                case DPad.DOWN:
                                    if (self.onDown !== null) self.onDown.call(self);
                                    break;
                                case DPad.LEFT:
                                    if (self.onLeft !== null) self.onLeft.call(self);
                                    break;
                                case DPad.RIGHT:
                                    if (self.onRight !== null) self.onRight.call(self);
                                    break;
                            }
                        }
                    }
                }
            };
            KeyboardController.onWASDUp(domid, function (keyCode) {
                if (keyCode === 87 || keyCode === 65 || keyCode === 68 || keyCode === 83) {
                    keyPressed[""+keyCode] = false;
                    if (!keyPressed["87"] && !keyPressed["65"] && !keyPressed["68"] && !keyPressed["83"]){
                        self.keyDirection = DPad.NONE;
                        iskeydown = false;
                        firstClick = true;
                    }
                }
            });
            keyPressCheck = function() {
                if (iskeydown) {
                    var now = new Date().getTime();
                    if ((now - lastTimePressedMs) > CLICK_INTERVAL_IN_MS) {
                        lastTimePressedMs = now;
                        switch (currentKey){
                            case DPad.UP:
                                if (self.onUp !== null) self.onUp.call(self);
                                break;
                            case DPad.DOWN:
                                if (self.onDown !== null) self.onDown.call(self);
                                break;
                            case DPad.LEFT:
                                if (self.onLeft !== null) self.onLeft.call(self);
                                break;
                            case DPad.RIGHT:
                                if (self.onRight !== null) self.onRight.call(self);
                                break;
                        }
                    }
                }
            };
        }

        listener = setInterval(keyPressCheck, INTERVAL_SPEED);

        this.onUp = null;
        this.onDown = null;
        this.onLeft = null;
        this.onRight = null;
    }
    this.keyDirection = DPad.NONE;
}

DPad.prototype = Object.create(AnalogStick.prototype);

DPad.UP = 87;
DPad.DOWN = 83;
DPad.LEFT = 65;
DPad.RIGHT = 68;
DPad.NONE = -1;

if (Utils.isTouchDevice()) {
    DPad.prototype.getDirection = function(){
        if (this.isPressed()) {
            var deg = this.getDegree();
            if (deg < 45 || deg >= 315){
                return DPad.LEFT;
            } else if (deg < 315 && deg >= 225) {
                return DPad.UP;
            } else if (deg < 225 && deg >= 135) {
                return DPad.RIGHT;
            } else {
                return DPad.DOWN;
            }
        } else {
            return DPad.NONE;
        }
    };
} else {
    DPad.prototype.getDirection = function(){
        return this.keyDirection;
    };
}

module.exports = DPad;
},{"./AnalogStick.js":1,"./keyboardController.js":5,"./utils.js":7}],4:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";
module.exports = {
    SPACE : "sp",
    ENTER : "en",
    ESC : "esc",
    Q : "q",
    E : "e"
};
},{}],5:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";

var Utils = require('./utils.js');
var KEYS = require('./KEYS.js');

var _keyToButton = {};

function testAndExecKey(keycode, expectedKeycode, value) {
    if (expectedKeycode === keycode && value in _keyToButton) {
        var btn = _keyToButton[value];
        if (btn.onClick !== null) {
            btn.onClick.call(btn);
        }
        return true;
    }
    return false;
}

if (!Utils.isTouchDevice()) {

    document.onkeyup = function (e) {

        var keyCode = e.keyCode;

        // ignore WASD
        if (keyCode !== 87 && keyCode !== 65 &&
            keyCode !== 83 && keyCode !== 68) {
            if (!testAndExecKey(keyCode, 32, KEYS.SPACE))
                if (!testAndExecKey(keyCode, 13, KEYS.ENTER))
                    if (!testAndExecKey(keyCode, 27, KEYS.ESC))
                        if (!testAndExecKey(keyCode, 81, KEYS.Q))
                            if (!testAndExecKey(keyCode, 69, KEYS.E)) {
                            }
        } else {
            var i = 0, L = _wasdCallbacks.length;
            for (; i < L; i++) {
                _wasdCallbacks[i].callback(keyCode);
            }
        }

    };

}

var _wasdCallbacks = [];

function deleteById(domId, list) {
    var i = 0, L = list.length;
    for (; i < L; i++) {
        if (list[i].id === domId) {
            list.splice(i, 1);
            break;
        }
    }
}

module.exports = {

    /**
     * Event will be called when a WASD key was pressed and is up again
     * @param domId to make it removable
     * @param callback {function}
     */
    onWASDUp: function (domId, callback) {
        deleteById(domId, _wasdCallbacks);
        _wasdCallbacks.push({id: domId, callback: callback});
    },

    keyToButton: function () {
        return _keyToButton;
    }

};
},{"./KEYS.js":4,"./utils.js":7}],6:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";

//require('./touchController.js');

var Peerjs = require('peerjs');
console.log(Peerjs);
var Utils = require('./utils.js');
var AnalogStick = require('./AnalogStick.js');
var DPad = require('./DPad.js');
var Button = require('./Button.js');
var KEYS = require('./KEYS.js');

var _diameter = Utils.diameter();
var _btnDiameter = Utils.btnDiameter();

if (Utils.isTouchDevice()) {
    document.write("<style id='touchControllerStyle'>.touchController{ " +
        "width:"+_diameter+"px;height:"+_diameter+"px;border:2px solid black;position:absolute;border-radius:50%;" +
        " } .innerTouchController {" +
        "width:5px;height:5px;margin-left:auto;margin-right:auto;margin-top:"+(Math.ceil(_diameter/2))+
        "px;background-color:black;}" +
        ".touchBtn{position:absolute;border:2px solid black;position:absolute;border-radius:50%;" +
        "width:"+_btnDiameter+"px;height:"+_btnDiameter+"px;}" +
        ".touchBtnTxt{text-align:center;line-height:"+_btnDiameter+"px;}" +
        ".touchBtn.pressed{background-color:cornflowerblue;}" +
        "</style>");
}

module.exports = {

    /**
     * Checks weather the current device can use touch or not
     * @returns {*}
     */
    isTouchDevice: function () {
        return Utils.isTouchDevice();
    },

    /**
     * strips away the default style
     */
    stripStyle: function () {
        var element = document.getElementById('touchControllerStyle');
        element.outerHTML = "";
    },

    AnalogStick: AnalogStick,

    DPad: DPad,

    Button: Button,

    KEYS: KEYS

};
},{"./AnalogStick.js":1,"./Button.js":2,"./DPad.js":3,"./KEYS.js":4,"./utils.js":7,"peerjs":12}],7:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";

function isTouchDevice() {
    return (('ontouchstart' in window)
        || (navigator.MaxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0));
}

var _isTouchDevice = isTouchDevice();

var _isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

var _toDeg = 180 / Math.PI;

var _currentId = 0;

var _topTouchOffset = 0;
if (_isChrome) {
    _topTouchOffset = 100;
}

var _diameter = 140;
var _btnDiameter = 65;

module.exports = {

    diameter: function () {
        return _diameter;
    },

    btnDiameter: function () {
        return _btnDiameter;
    },

    /**
     * generates a new unique id
     * @returns {string}
     */
    newId: function () {
        return "touchController" + _currentId++;
    },

    /**
     * Checks weather the device can use touch or not
     * @returns {boolean}
     */
    isTouchDevice: function () {
        return _isTouchDevice;
    },

    /**
     * Returnes true when the renderer is Chrome
     * @returns {boolean}
     */
    isChrome: function () {
        return _isChrome;
    },

    /**
     *
     * @param elem
     * @returns {{top: number, left: number}}
     */
    getOffsetRect: function (elem) {
        // (1)
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        // (2)
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        // (3)
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        // (4)
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { top: Math.round(top), left: Math.round(left) };
    },

    /**
     * transforms two points to the degree in between
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number}
     */
    getDegree: function(x1, y1, x2, y2) {
        var x = x1-x2;
        var y = y1-y2;
        var theta = Math.atan2(-y, x);
        if (theta < 0) theta += 2 * Math.PI;
        return theta * _toDeg;
    },

    /**
     * Needed for some offsetting
     * @returns {number}
     */
    topTouchOffset: function () {
        return _topTouchOffset;
    }

};
},{}],8:[function(require,module,exports){
module.exports.RTCSessionDescription = window.RTCSessionDescription ||
	window.mozRTCSessionDescription;
module.exports.RTCPeerConnection = window.RTCPeerConnection ||
	window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
module.exports.RTCIceCandidate = window.RTCIceCandidate ||
	window.mozRTCIceCandidate;

},{}],9:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Negotiator = require('./negotiator');
var Reliable = require('reliable');

/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(peer, provider, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({
    serialization: 'binary',
    reliable: false
  }, options);

  // Connection is not open yet.
  this.open = false;
  this.type = 'data';
  this.peer = peer;
  this.provider = provider;

  this.id = this.options.connectionId || DataConnection._idPrefix + util.randomToken();

  this.label = this.options.label || this.id;
  this.metadata = this.options.metadata;
  this.serialization = this.options.serialization;
  this.reliable = this.options.reliable;

  // Data channel buffering.
  this._buffer = [];
  this._buffering = false;
  this.bufferSize = 0;

  // For storing large data.
  this._chunkedData = {};

  if (this.options._payload) {
    this._peerBrowser = this.options._payload.browser;
  }

  Negotiator.startConnection(
    this,
    this.options._payload || {
      originator: true
    }
  );
}

util.inherits(DataConnection, EventEmitter);

DataConnection._idPrefix = 'dc_';

/** Called by the Negotiator when the DataChannel is ready. */
DataConnection.prototype.initialize = function(dc) {
  this._dc = this.dataChannel = dc;
  this._configureDataChannel();
}

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  if (util.supports.sctp) {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  }

  // Use the Reliable shim for non Firefox browsers
  if (!util.supports.sctp && this.reliable) {
    this._reliable = new Reliable(this._dc, util.debug);
  }

  if (this._reliable) {
    this._reliable.onmessage = function(msg) {
      self.emit('data', msg);
    };
  } else {
    this._dc.onmessage = function(e) {
      self._handleDataMessage(e);
    };
  }
  this._dc.onclose = function(e) {
    util.log('DataChannel closed for:', self.peer);
    self.close();
  };
}

// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function(e) {
  var self = this;
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      // Datatype should never be blob
      util.blobToArrayBuffer(data, function(ab) {
        data = util.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = util.unpack(data);
    } else if (datatype === String) {
      // String fallback for binary data for browsers that don't support binary yet
      var ab = util.binaryStringToArrayBuffer(data);
      data = util.unpack(ab);
    }
  } else if (this.serialization === 'json') {
    data = JSON.parse(data);
  }

  // Check if we've chunked--if so, piece things back together.
  // We're guaranteed that this isn't 0.
  if (data.__peerData) {
    var id = data.__peerData;
    var chunkInfo = this._chunkedData[id] || {data: [], count: 0, total: data.total};

    chunkInfo.data[data.n] = data.data;
    chunkInfo.count += 1;

    if (chunkInfo.total === chunkInfo.count) {
      // Clean up before making the recursive call to `_handleDataMessage`.
      delete this._chunkedData[id];

      // We've received all the chunks--time to construct the complete data.
      data = new Blob(chunkInfo.data);
      this._handleDataMessage({data: data});
    }

    this._chunkedData[id] = chunkInfo;
    return;
  }

  this.emit('data', data);
}

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
DataConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this.open = false;
  Negotiator.cleanup(this);
  this.emit('close');
}

/** Allows user to send data. */
DataConnection.prototype.send = function(data, chunked) {
  if (!this.open) {
    this.emit('error', new Error('Connection is not open. You should listen for the `open` event before sending messages.'));
    return;
  }
  if (this._reliable) {
    // Note: reliable shim sending will make it so that you cannot customize
    // serialization.
    this._reliable.send(data);
    return;
  }
  var self = this;
  if (this.serialization === 'json') {
    this._bufferedSend(JSON.stringify(data));
  } else if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    var blob = util.pack(data);

    // For Chrome-Firefox interoperability, we need to make Firefox "chunk"
    // the data it sends out.
    var needsChunking = util.chunkedBrowsers[this._peerBrowser] || util.chunkedBrowsers[util.browser];
    if (needsChunking && !chunked && blob.size > util.chunkedMTU) {
      this._sendChunks(blob);
      return;
    }

    // DataChannel currently only supports strings.
    if (!util.supports.sctp) {
      util.blobToBinaryString(blob, function(str) {
        self._bufferedSend(str);
      });
    } else if (!util.supports.binaryBlob) {
      // We only do this if we really need to (e.g. blobs are not supported),
      // because this conversion is costly.
      util.blobToArrayBuffer(blob, function(ab) {
        self._bufferedSend(ab);
      });
    } else {
      this._bufferedSend(blob);
    }
  } else {
    this._bufferedSend(data);
  }
}

DataConnection.prototype._bufferedSend = function(msg) {
  if (this._buffering || !this._trySend(msg)) {
    this._buffer.push(msg);
    this.bufferSize = this._buffer.length;
  }
}

// Returns true if the send succeeds.
DataConnection.prototype._trySend = function(msg) {
  try {
    this._dc.send(msg);
  } catch (e) {
    this._buffering = true;

    var self = this;
    setTimeout(function() {
      // Try again.
      self._buffering = false;
      self._tryBuffer();
    }, 100);
    return false;
  }
  return true;
}

// Try to send the first message in the buffer.
DataConnection.prototype._tryBuffer = function() {
  if (this._buffer.length === 0) {
    return;
  }

  var msg = this._buffer[0];

  if (this._trySend(msg)) {
    this._buffer.shift();
    this.bufferSize = this._buffer.length;
    this._tryBuffer();
  }
}

DataConnection.prototype._sendChunks = function(blob) {
  var blobs = util.chunk(blob);
  for (var i = 0, ii = blobs.length; i < ii; i += 1) {
    var blob = blobs[i];
    this.send(blob, true);
  }
}

DataConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      this._peerBrowser = payload.browser;

      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      break;
    case 'CANDIDATE':
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

module.exports = DataConnection;

},{"./negotiator":11,"./util":14,"eventemitter3":15,"reliable":18}],10:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Negotiator = require('./negotiator');

/**
 * Wraps the streaming interface between two Peers.
 */
function MediaConnection(peer, provider, options) {
  if (!(this instanceof MediaConnection)) return new MediaConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({}, options);

  this.open = false;
  this.type = 'media';
  this.peer = peer;
  this.provider = provider;
  this.metadata = this.options.metadata;
  this.localStream = this.options._stream;

  this.id = this.options.connectionId || MediaConnection._idPrefix + util.randomToken();
  if (this.localStream) {
    Negotiator.startConnection(
      this,
      {_stream: this.localStream, originator: true}
    );
  }
};

util.inherits(MediaConnection, EventEmitter);

MediaConnection._idPrefix = 'mc_';

MediaConnection.prototype.addStream = function(remoteStream) {
  util.log('Receiving stream', remoteStream);

  this.remoteStream = remoteStream;
  this.emit('stream', remoteStream); // Should we call this `open`?

};

MediaConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      this.open = true;
      break;
    case 'CANDIDATE':
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

MediaConnection.prototype.answer = function(stream) {
  if (this.localStream) {
    util.warn('Local stream already exists on this MediaConnection. Are you answering a call twice?');
    return;
  }

  this.options._payload._stream = stream;

  this.localStream = stream;
  Negotiator.startConnection(
    this,
    this.options._payload
  )
  // Retrieve lost messages stored because PeerConnection not set up.
  var messages = this.provider._getMessages(this.id);
  for (var i = 0, ii = messages.length; i < ii; i += 1) {
    this.handleMessage(messages[i]);
  }
  this.open = true;
};

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
MediaConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this.open = false;
  Negotiator.cleanup(this);
  this.emit('close')
};

module.exports = MediaConnection;

},{"./negotiator":11,"./util":14,"eventemitter3":15}],11:[function(require,module,exports){
var util = require('./util');
var RTCPeerConnection = require('./adapter').RTCPeerConnection;
var RTCSessionDescription = require('./adapter').RTCSessionDescription;
var RTCIceCandidate = require('./adapter').RTCIceCandidate;

/**
 * Manages all negotiations between Peers.
 */
var Negotiator = {
  pcs: {
    data: {},
    media: {}
  }, // type => {peerId: {pc_id: pc}}.
  //providers: {}, // provider's id => providers (there may be multiple providers/client.
  queue: [] // connections that are delayed due to a PC being in use.
}

Negotiator._idPrefix = 'pc_';

/** Returns a PeerConnection object set up correctly (for data, media). */
Negotiator.startConnection = function(connection, options) {
  var pc = Negotiator._getPeerConnection(connection, options);

  if (connection.type === 'media' && options._stream) {
    // Add the stream.
    pc.addStream(options._stream);
  }

  // Set the connection's PC.
  connection.pc = connection.peerConnection = pc;
  // What do we need to do now?
  if (options.originator) {
    if (connection.type === 'data') {
      // Create the datachannel.
      var config = {};
      // Dropping reliable:false support, since it seems to be crashing
      // Chrome.
      /*if (util.supports.sctp && !options.reliable) {
        // If we have canonical reliable support...
        config = {maxRetransmits: 0};
      }*/
      // Fallback to ensure older browsers don't crash.
      if (!util.supports.sctp) {
        config = {reliable: options.reliable};
      }
      var dc = pc.createDataChannel(connection.label, config);
      connection.initialize(dc);
    }

    if (!util.supports.onnegotiationneeded) {
      Negotiator._makeOffer(connection);
    }
  } else {
    Negotiator.handleSDP('OFFER', connection, options.sdp);
  }
}

Negotiator._getPeerConnection = function(connection, options) {
  if (!Negotiator.pcs[connection.type]) {
    util.error(connection.type + ' is not a valid connection type. Maybe you overrode the `type` property somewhere.');
  }

  if (!Negotiator.pcs[connection.type][connection.peer]) {
    Negotiator.pcs[connection.type][connection.peer] = {};
  }
  var peerConnections = Negotiator.pcs[connection.type][connection.peer];

  var pc;
  // Not multiplexing while FF and Chrome have not-great support for it.
  /*if (options.multiplex) {
    ids = Object.keys(peerConnections);
    for (var i = 0, ii = ids.length; i < ii; i += 1) {
      pc = peerConnections[ids[i]];
      if (pc.signalingState === 'stable') {
        break; // We can go ahead and use this PC.
      }
    }
  } else */
  if (options.pc) { // Simplest case: PC id already provided for us.
    pc = Negotiator.pcs[connection.type][connection.peer][options.pc];
  }

  if (!pc || pc.signalingState !== 'stable') {
    pc = Negotiator._startPeerConnection(connection);
  }
  return pc;
}

/*
Negotiator._addProvider = function(provider) {
  if ((!provider.id && !provider.disconnected) || !provider.socket.open) {
    // Wait for provider to obtain an ID.
    provider.on('open', function(id) {
      Negotiator._addProvider(provider);
    });
  } else {
    Negotiator.providers[provider.id] = provider;
  }
}*/


/** Start a PC. */
Negotiator._startPeerConnection = function(connection) {
  util.log('Creating RTCPeerConnection.');

  var id = Negotiator._idPrefix + util.randomToken();
  var optional = {};

  if (connection.type === 'data' && !util.supports.sctp) {
    optional = {optional: [{RtpDataChannels: true}]};
  } else if (connection.type === 'media') {
    // Interop req for chrome.
    optional = {optional: [{DtlsSrtpKeyAgreement: true}]};
  }

  var pc = new RTCPeerConnection(connection.provider.options.config, optional);
  Negotiator.pcs[connection.type][connection.peer][id] = pc;

  Negotiator._setupListeners(connection, pc, id);

  return pc;
}

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function(connection, pc, pc_id) {
  var peerId = connection.peer;
  var connectionId = connection.id;
  var provider = connection.provider;

  // ICE CANDIDATES.
  util.log('Listening for ICE candidates.');
  pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates for:', connection.peer);
      provider.socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate,
          type: connection.type,
          connectionId: connection.id
        },
        dst: peerId
      });
    }
  };

  pc.oniceconnectionstatechange = function() {
    switch (pc.iceConnectionState) {
      case 'disconnected':
      case 'failed':
        util.log('iceConnectionState is disconnected, closing connections to ' + peerId);
        connection.close();
        break;
      case 'completed':
        pc.onicecandidate = util.noop;
        break;
    }
  };

  // Fallback for older Chrome impls.
  pc.onicechange = pc.oniceconnectionstatechange;

  // ONNEGOTIATIONNEEDED (Chrome)
  util.log('Listening for `negotiationneeded`');
  pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    if (pc.signalingState == 'stable') {
      Negotiator._makeOffer(connection);
    } else {
      util.log('onnegotiationneeded triggered when not stable. Is another connection being established?');
    }
  };

  // DATACONNECTION.
  util.log('Listening for data channel');
  // Fired between offer and answer, so options should already be saved
  // in the options hash.
  pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    var connection = provider.getConnection(peerId, connectionId);
    connection.initialize(dc);
  };

  // MEDIACONNECTION.
  util.log('Listening for remote stream');
  pc.onaddstream = function(evt) {
    util.log('Received remote stream');
    var stream = evt.stream;
    var connection = provider.getConnection(peerId, connectionId);
    // 10/10/2014: looks like in Chrome 38, onaddstream is triggered after
    // setting the remote description. Our connection object in these cases
    // is actually a DATA connection, so addStream fails.
    // TODO: This is hopefully just a temporary fix. We should try to
    // understand why this is happening.
    if (connection.type === 'media') {
      connection.addStream(stream);
    }
  };
}

Negotiator.cleanup = function(connection) {
  util.log('Cleaning up PeerConnection to ' + connection.peer);

  var pc = connection.pc;

  if (!!pc && (pc.readyState !== 'closed' || pc.signalingState !== 'closed')) {
    pc.close();
    connection.pc = null;
  }
}

Negotiator._makeOffer = function(connection) {
  var pc = connection.pc;
  pc.createOffer(function(offer) {
    util.log('Created offer.');

    if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
      offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }

    pc.setLocalDescription(offer, function() {
      util.log('Set localDescription: offer', 'for:', connection.peer);
      connection.provider.socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          type: connection.type,
          label: connection.label,
          connectionId: connection.id,
          reliable: connection.reliable,
          serialization: connection.serialization,
          metadata: connection.metadata,
          browser: util.browser
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emitError('webrtc', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to createOffer, ', err);
  }, connection.options.constraints);
}

Negotiator._makeAnswer = function(connection) {
  var pc = connection.pc;

  pc.createAnswer(function(answer) {
    util.log('Created answer.');

    if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
      answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }

    pc.setLocalDescription(answer, function() {
      util.log('Set localDescription: answer', 'for:', connection.peer);
      connection.provider.socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer,
          type: connection.type,
          connectionId: connection.id,
          browser: util.browser
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emitError('webrtc', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to create answer, ', err);
  });
}

/** Handle an SDP. */
Negotiator.handleSDP = function(type, connection, sdp) {
  sdp = new RTCSessionDescription(sdp);
  var pc = connection.pc;

  util.log('Setting remote description', sdp);
  pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription:', type, 'for:', connection.peer);

    if (type === 'OFFER') {
      Negotiator._makeAnswer(connection);
    }
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
}

/** Handle a candidate. */
Negotiator.handleCandidate = function(connection, ice) {
  var candidate = ice.candidate;
  var sdpMLineIndex = ice.sdpMLineIndex;
  connection.pc.addIceCandidate(new RTCIceCandidate({
    sdpMLineIndex: sdpMLineIndex,
    candidate: candidate
  }));
  util.log('Added ICE candidate for:', connection.peer);
}

module.exports = Negotiator;

},{"./adapter":8,"./util":14}],12:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Socket = require('./socket');
var MediaConnection = require('./mediaconnection');
var DataConnection = require('./dataconnection');

/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (!(this instanceof Peer)) return new Peer(id, options);
  EventEmitter.call(this);

  // Deal with overloading
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  } else if (id) {
    // Ensure id is a string
    id = id.toString();
  }
  //

  // Configurize options
  options = util.extend({
    debug: 0, // 1: Errors, 2: Warnings, 3: All logs
    host: util.CLOUD_HOST,
    port: util.CLOUD_PORT,
    key: 'peerjs',
    path: '/',
    token: util.randomToken(),
    config: util.defaultConfig
  }, options);
  this.options = options;
  // Detect relative URL host.
  if (options.host === '/') {
    options.host = window.location.hostname;
  }
  // Set path correctly.
  if (options.path[0] !== '/') {
    options.path = '/' + options.path;
  }
  if (options.path[options.path.length - 1] !== '/') {
    options.path += '/';
  }

  // Set whether we use SSL to same as current host
  if (options.secure === undefined && options.host !== util.CLOUD_HOST) {
    options.secure = util.isSecure();
  }
  // Set a custom log function if present
  if (options.logFunction) {
    util.setLogFunction(options.logFunction);
  }
  util.setLogLevel(options.debug);
  //

  // Sanity checks
  // Ensure WebRTC supported
  if (!util.supports.audioVideo && !util.supports.data ) {
    this._delayedAbort('browser-incompatible', 'The current browser does not support WebRTC');
    return;
  }
  // Ensure alphanumeric id
  if (!util.validateId(id)) {
    this._delayedAbort('invalid-id', 'ID "' + id + '" is invalid');
    return;
  }
  // Ensure valid key
  if (!util.validateKey(options.key)) {
    this._delayedAbort('invalid-key', 'API KEY "' + options.key + '" is invalid');
    return;
  }
  // Ensure not using unsecure cloud server on SSL page
  if (options.secure && options.host === '0.peerjs.com') {
    this._delayedAbort('ssl-unavailable',
      'The cloud server currently does not support HTTPS. Please run your own PeerServer to use HTTPS.');
    return;
  }
  //

  // States.
  this.destroyed = false; // Connections have been killed
  this.disconnected = false; // Connection to PeerServer killed but P2P connections still active
  this.open = false; // Sockets and such are not yet open.
  //

  // References
  this.connections = {}; // DataConnections for this peer.
  this._lostMessages = {}; // src => [list of messages]
  //

  // Start the server connection
  this._initializeServerConnection();
  if (id) {
    this._initialize(id);
  } else {
    this._retrieveId();
  }
  //
}

util.inherits(Peer, EventEmitter);

// Initialize the 'socket' (which is actually a mix of XHR streaming and
// websockets.)
Peer.prototype._initializeServerConnection = function() {
  var self = this;
  this.socket = new Socket(this.options.secure, this.options.host, this.options.port, this.options.path, this.options.key);
  this.socket.on('message', function(data) {
    self._handleMessage(data);
  });
  this.socket.on('error', function(error) {
    self._abort('socket-error', error);
  });
  this.socket.on('disconnected', function() {
    // If we haven't explicitly disconnected, emit error and disconnect.
    if (!self.disconnected) {
      self.emitError('network', 'Lost connection to server.');
      self.disconnect();
    }
  });
  this.socket.on('close', function() {
    // If we haven't explicitly disconnected, emit error.
    if (!self.disconnected) {
      self._abort('socket-closed', 'Underlying socket is already closed.');
    }
  });
};

/** Get a unique ID from the server via XHR. */
Peer.prototype._retrieveId = function(cb) {
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/id';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    util.error('Error retrieving ID', e);
    var pathError = '';
    if (self.options.path === '/' && self.options.host !== util.CLOUD_HOST) {
      pathError = ' If you passed in a `path` to your self-hosted PeerServer, ' +
        'you\'ll also need to pass in that same path when creating a new ' +
        'Peer.';
    }
    self._abort('server-error', 'Could not get an ID from the server.' + pathError);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status !== 200) {
      http.onerror();
      return;
    }
    self._initialize(http.responseText);
  };
  http.send(null);
};

/** Initialize a connection with the server. */
Peer.prototype._initialize = function(id) {
  this.id = id;
  this.socket.start(this.id, this.options.token);
};

/** Handles messages from the server. */
Peer.prototype._handleMessage = function(message) {
  var type = message.type;
  var payload = message.payload;
  var peer = message.src;
  var connection;

  switch (type) {
    case 'OPEN': // The connection to the server is open.
      this.emit('open', this.id);
      this.open = true;
      break;
    case 'ERROR': // Server error.
      this._abort('server-error', payload.msg);
      break;
    case 'ID-TAKEN': // The selected ID is taken.
      this._abort('unavailable-id', 'ID `' + this.id + '` is taken');
      break;
    case 'INVALID-KEY': // The given API key cannot be found.
      this._abort('invalid-key', 'API KEY "' + this.options.key + '" is invalid');
      break;

    //
    case 'LEAVE': // Another peer has closed its connection to this peer.
      util.log('Received leave message from', peer);
      this._cleanupPeer(peer);
      break;

    case 'EXPIRE': // The offer sent to a peer has expired without response.
      this.emitError('peer-unavailable', 'Could not connect to peer ' + peer);
      break;
    case 'OFFER': // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
      var connectionId = payload.connectionId;
      connection = this.getConnection(peer, connectionId);

      if (connection) {
        util.warn('Offer received for existing Connection ID:', connectionId);
        //connection.handleMessage(message);
      } else {
        // Create a new connection.
        if (payload.type === 'media') {
          connection = new MediaConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata
          });
          this._addConnection(peer, connection);
          this.emit('call', connection);
        } else if (payload.type === 'data') {
          connection = new DataConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata,
            label: payload.label,
            serialization: payload.serialization,
            reliable: payload.reliable
          });
          this._addConnection(peer, connection);
          this.emit('connection', connection);
        } else {
          util.warn('Received malformed connection type:', payload.type);
          return;
        }
        // Find messages.
        var messages = this._getMessages(connectionId);
        for (var i = 0, ii = messages.length; i < ii; i += 1) {
          connection.handleMessage(messages[i]);
        }
      }
      break;
    default:
      if (!payload) {
        util.warn('You received a malformed message from ' + peer + ' of type ' + type);
        return;
      }

      var id = payload.connectionId;
      connection = this.getConnection(peer, id);

      if (connection && connection.pc) {
        // Pass it on.
        connection.handleMessage(message);
      } else if (id) {
        // Store for possible later use
        this._storeMessage(id, message);
      } else {
        util.warn('You received an unrecognized message:', message);
      }
      break;
  }
};

/** Stores messages without a set up connection, to be claimed later. */
Peer.prototype._storeMessage = function(connectionId, message) {
  if (!this._lostMessages[connectionId]) {
    this._lostMessages[connectionId] = [];
  }
  this._lostMessages[connectionId].push(message);
};

/** Retrieve messages from lost message store */
Peer.prototype._getMessages = function(connectionId) {
  var messages = this._lostMessages[connectionId];
  if (messages) {
    delete this._lostMessages[connectionId];
    return messages;
  } else {
    return [];
  }
};

/**
 * Returns a DataConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.connect = function(peer, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect, or call reconnect ' +
      'on this peer if you believe its ID to still be available.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  var connection = new DataConnection(peer, this, options);
  this._addConnection(peer, connection);
  return connection;
};

/**
 * Returns a MediaConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.call = function(peer, stream, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  if (!stream) {
    util.error('To call a peer, you must provide a stream from your browser\'s `getUserMedia`.');
    return;
  }
  options = options || {};
  options._stream = stream;
  var call = new MediaConnection(peer, this, options);
  this._addConnection(peer, call);
  return call;
};

/** Add a data/media connection to this peer. */
Peer.prototype._addConnection = function(peer, connection) {
  if (!this.connections[peer]) {
    this.connections[peer] = [];
  }
  this.connections[peer].push(connection);
};

/** Retrieve a data/media connection for this peer. */
Peer.prototype.getConnection = function(peer, id) {
  var connections = this.connections[peer];
  if (!connections) {
    return null;
  }
  for (var i = 0, ii = connections.length; i < ii; i++) {
    if (connections[i].id === id) {
      return connections[i];
    }
  }
  return null;
};

Peer.prototype._delayedAbort = function(type, message) {
  var self = this;
  util.setZeroTimeout(function(){
    self._abort(type, message);
  });
};

/**
 * Destroys the Peer and emits an error message.
 * The Peer is not destroyed if it's in a disconnected state, in which case
 * it retains its disconnected state and its existing connections.
 */
Peer.prototype._abort = function(type, message) {
  util.error('Aborting!');
  if (!this._lastServerId) {
    this.destroy();
  } else {
    this.disconnect();
  }
  this.emitError(type, message);
};

/** Emits a typed error message. */
Peer.prototype.emitError = function(type, err) {
  util.error('Error:', err);
  if (typeof err === 'string') {
    err = new Error(err);
  }
  err.type = type;
  this.emit('error', err);
};

/**
 * Destroys the Peer: closes all active connections as well as the connection
 *  to the server.
 * Warning: The peer can no longer create or accept connections after being
 *  destroyed.
 */
Peer.prototype.destroy = function() {
  if (!this.destroyed) {
    this._cleanup();
    this.disconnect();
    this.destroyed = true;
  }
};


/** Disconnects every connection on this peer. */
Peer.prototype._cleanup = function() {
  if (this.connections) {
    var peers = Object.keys(this.connections);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      this._cleanupPeer(peers[i]);
    }
  }
  this.emit('close');
};

/** Closes all connections to this peer. */
Peer.prototype._cleanupPeer = function(peer) {
  var connections = this.connections[peer];
  for (var j = 0, jj = connections.length; j < jj; j += 1) {
    connections[j].close();
  }
};

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  var self = this;
  util.setZeroTimeout(function(){
    if (!self.disconnected) {
      self.disconnected = true;
      self.open = false;
      if (self.socket) {
        self.socket.close();
      }
      self.emit('disconnected', self.id);
      self._lastServerId = self.id;
      self.id = null;
    }
  });
};

/** Attempts to reconnect with the same ID. */
Peer.prototype.reconnect = function() {
  if (this.disconnected && !this.destroyed) {
    util.log('Attempting reconnection to server with ID ' + this._lastServerId);
    this.disconnected = false;
    this._initializeServerConnection();
    this._initialize(this._lastServerId);
  } else if (this.destroyed) {
    throw new Error('This peer cannot reconnect to the server. It has already been destroyed.');
  } else if (!this.disconnected && !this.open) {
    // Do nothing. We're still connecting the first time.
    util.error('In a hurry? We\'re still trying to make the initial connection!');
  } else {
    throw new Error('Peer ' + this.id + ' cannot reconnect because it is not disconnected from the server!');
  }
};

/**
 * Get a list of available peer IDs. If you're running your own server, you'll
 * want to set allow_discovery: true in the PeerServer options. If you're using
 * the cloud server, email team@peerjs.com to get the functionality enabled for
 * your key.
 */
Peer.prototype.listAllPeers = function(cb) {
  cb = cb || function() {};
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/peers';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    self._abort('server-error', 'Could not get peers from the server.');
    cb([]);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status === 401) {
      var helpfulError = '';
      if (self.options.host !== util.CLOUD_HOST) {
        helpfulError = 'It looks like you\'re using the cloud server. You can email ' +
          'team@peerjs.com to enable peer listing for your API key.';
      } else {
        helpfulError = 'You need to enable `allow_discovery` on your self-hosted ' +
          'PeerServer to use this feature.';
      }
      cb([]);
      throw new Error('It doesn\'t look like you have permission to list peers IDs. ' + helpfulError);
    } else if (http.status !== 200) {
      cb([]);
    } else {
      cb(JSON.parse(http.responseText));
    }
  };
  http.send(null);
};

module.exports = Peer;

},{"./dataconnection":9,"./mediaconnection":10,"./socket":13,"./util":14,"eventemitter3":15}],13:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');

/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
function Socket(secure, host, port, path, key) {
  if (!(this instanceof Socket)) return new Socket(secure, host, port, path, key);

  EventEmitter.call(this);

  // Disconnected manually.
  this.disconnected = false;
  this._queue = [];

  var httpProtocol = secure ? 'https://' : 'http://';
  var wsProtocol = secure ? 'wss://' : 'ws://';
  this._httpUrl = httpProtocol + host + ':' + port + path + key;
  this._wsUrl = wsProtocol + host + ':' + port + path + 'peerjs?key=' + key;
}

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function(id, token) {
  this.id = id;

  this._httpUrl += '/' + id + '/' + token;
  this._wsUrl += '&id=' + id + '&token=' + token;

  this._startXhrStream();
  this._startWebSocket();
}


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function(id) {
  var self = this;

  if (this._socket) {
    return;
  }

  this._socket = new WebSocket(this._wsUrl);

  this._socket.onmessage = function(event) {
    try {
      var data = JSON.parse(event.data);
    } catch(e) {
      util.log('Invalid server message', event.data);
      return;
    }
    self.emit('message', data);
  };

  this._socket.onclose = function(event) {
    util.log('Socket closed.');
    self.disconnected = true;
    self.emit('disconnected');
  };

  // Take care of the queue of connections if necessary and make sure Peer knows
  // socket is open.
  this._socket.onopen = function() {
    if (self._timeout) {
      clearTimeout(self._timeout);
      setTimeout(function(){
        self._http.abort();
        self._http = null;
      }, 5000);
    }
    self._sendQueuedMessages();
    util.log('Socket open');
  };
}

/** Start XHR streaming. */
Socket.prototype._startXhrStream = function(n) {
  try {
    var self = this;
    this._http = new XMLHttpRequest();
    this._http._index = 1;
    this._http._streamIndex = n || 0;
    this._http.open('post', this._httpUrl + '/id?i=' + this._http._streamIndex, true);
    this._http.onerror = function() {
      // If we get an error, likely something went wrong.
      // Stop streaming.
      clearTimeout(self._timeout);
      self.emit('disconnected');
    }
    this._http.onreadystatechange = function() {
      if (this.readyState == 2 && this.old) {
        this.old.abort();
        delete this.old;
      } else if (this.readyState > 2 && this.status === 200 && this.responseText) {
        self._handleStream(this);
      }
    };
    this._http.send(null);
    this._setHTTPTimeout();
  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
}


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function(http) {
  // 3 and 4 are loading/done state. All others are not relevant.
  var messages = http.responseText.split('\n');

  // Check to see if anything needs to be processed on buffer.
  if (http._buffer) {
    while (http._buffer.length > 0) {
      var index = http._buffer.shift();
      var bufferedMessage = messages[index];
      try {
        bufferedMessage = JSON.parse(bufferedMessage);
      } catch(e) {
        http._buffer.shift(index);
        break;
      }
      this.emit('message', bufferedMessage);
    }
  }

  var message = messages[http._index];
  if (message) {
    http._index += 1;
    // Buffering--this message is incomplete and we'll get to it next time.
    // This checks if the httpResponse ended in a `\n`, in which case the last
    // element of messages should be the empty string.
    if (http._index === messages.length) {
      if (!http._buffer) {
        http._buffer = [];
      }
      http._buffer.push(http._index - 1);
    } else {
      try {
        message = JSON.parse(message);
      } catch(e) {
        util.log('Invalid server message', message);
        return;
      }
      this.emit('message', message);
    }
  }
}

Socket.prototype._setHTTPTimeout = function() {
  var self = this;
  this._timeout = setTimeout(function() {
    var old = self._http;
    if (!self._wsOpen()) {
      self._startXhrStream(old._streamIndex + 1);
      self._http.old = old;
    } else {
      old.abort();
    }
  }, 25000);
}

/** Is the websocket currently open? */
Socket.prototype._wsOpen = function() {
  return this._socket && this._socket.readyState == 1;
}

/** Send queued messages. */
Socket.prototype._sendQueuedMessages = function() {
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    this.send(this._queue[i]);
  }
}

/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  if (this.disconnected) {
    return;
  }

  // If we didn't get an ID yet, we can't yet send anything so we should queue
  // up these messages.
  if (!this.id) {
    this._queue.push(data);
    return;
  }

  if (!data.type) {
    this.emit('error', 'Invalid message');
    return;
  }

  var message = JSON.stringify(data);
  if (this._wsOpen()) {
    this._socket.send(message);
  } else {
    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/' + data.type.toLowerCase();
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.send(message);
  }
}

Socket.prototype.close = function() {
  if (!this.disconnected && this._wsOpen()) {
    this._socket.close();
    this.disconnected = true;
  }
}

module.exports = Socket;

},{"./util":14,"eventemitter3":15}],14:[function(require,module,exports){
var defaultConfig = {'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};
var dataCount = 1;

var BinaryPack = require('js-binarypack');
var RTCPeerConnection = require('./adapter').RTCPeerConnection;

var util = {
  noop: function() {},

  CLOUD_HOST: '0.peerjs.com',
  CLOUD_PORT: 9000,

  // Browsers that need chunking:
  chunkedBrowsers: {'Chrome': 1},
  chunkedMTU: 16300, // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Logging logic
  logLevel: 0,
  setLogLevel: function(level) {
    var debugLevel = parseInt(level, 10);
    if (!isNaN(parseInt(level, 10))) {
      util.logLevel = debugLevel;
    } else {
      // If they are using truthy/falsy values for debug
      util.logLevel = level ? 3 : 0;
    }
    util.log = util.warn = util.error = util.noop;
    if (util.logLevel > 0) {
      util.error = util._printWith('ERROR');
    }
    if (util.logLevel > 1) {
      util.warn = util._printWith('WARNING');
    }
    if (util.logLevel > 2) {
      util.log = util._print;
    }
  },
  setLogFunction: function(fn) {
    if (fn.constructor !== Function) {
      util.warn('The log function you passed in is not a function. Defaulting to regular logs.');
    } else {
      util._print = fn;
    }
  },

  _printWith: function(prefix) {
    return function() {
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift(prefix);
      util._print.apply(util, copy);
    };
  },
  _print: function () {
    var err = false;
    var copy = Array.prototype.slice.call(arguments);
    copy.unshift('PeerJS: ');
    for (var i = 0, l = copy.length; i < l; i++){
      if (copy[i] instanceof Error) {
        copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
        err = true;
      }
    }
    err ? console.error.apply(console, copy) : console.log.apply(console, copy);
  },
  //

  // Returns browser-agnostic default config
  defaultConfig: defaultConfig,
  //

  // Returns the current browser.
  browser: (function() {
    if (window.mozRTCPeerConnection) {
      return 'Firefox';
    } else if (window.webkitRTCPeerConnection) {
      return 'Chrome';
    } else if (window.RTCPeerConnection) {
      return 'Supported';
    } else {
      return 'Unsupported';
    }
  })(),
  //

  // Lists which features are supported
  supports: (function() {
    if (typeof RTCPeerConnection === 'undefined') {
      return {};
    }

    var data = true;
    var audioVideo = true;

    var binaryBlob = false;
    var sctp = false;
    var onnegotiationneeded = !!window.webkitRTCPeerConnection;

    var pc, dc;
    try {
      pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
    } catch (e) {
      data = false;
      audioVideo = false;
    }

    if (data) {
      try {
        dc = pc.createDataChannel('_PEERJSTEST');
      } catch (e) {
        data = false;
      }
    }

    if (data) {
      // Binary test
      try {
        dc.binaryType = 'blob';
        binaryBlob = true;
      } catch (e) {
      }

      // Reliable test.
      // Unfortunately Chrome is a bit unreliable about whether or not they
      // support reliable.
      var reliablePC = new RTCPeerConnection(defaultConfig, {});
      try {
        var reliableDC = reliablePC.createDataChannel('_PEERJSRELIABLETEST', {});
        sctp = reliableDC.reliable;
      } catch (e) {
      }
      reliablePC.close();
    }

    // FIXME: not really the best check...
    if (audioVideo) {
      audioVideo = !!pc.addStream;
    }

    // FIXME: this is not great because in theory it doesn't work for
    // av-only browsers (?).
    if (!onnegotiationneeded && data) {
      // sync default check.
      var negotiationPC = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
      negotiationPC.onnegotiationneeded = function() {
        onnegotiationneeded = true;
        // async check.
        if (util && util.supports) {
          util.supports.onnegotiationneeded = true;
        }
      };
      negotiationPC.createDataChannel('_PEERJSNEGOTIATIONTEST');

      setTimeout(function() {
        negotiationPC.close();
      }, 1000);
    }

    if (pc) {
      pc.close();
    }

    return {
      audioVideo: audioVideo,
      data: data,
      binaryBlob: binaryBlob,
      binary: sctp, // deprecated; sctp implies binary support.
      reliable: sctp, // deprecated; sctp implies reliable data.
      sctp: sctp,
      onnegotiationneeded: onnegotiationneeded
    };
  }()),
  //

  // Ensure alphanumeric ids
  validateId: function(id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id);
  },

  validateKey: function(key) {
    // Allow empty keys
    return !key || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(key);
  },


  debug: false,

  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,

  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PeerJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(window)),

  // Binary stuff

  // chunks a blob.
  chunk: function(bl) {
    var chunks = [];
    var size = bl.size;
    var start = index = 0;
    var total = Math.ceil(size / util.chunkedMTU);
    while (start < size) {
      var end = Math.min(size, start + util.chunkedMTU);
      var b = bl.slice(start, end);

      var chunk = {
        __peerData: dataCount,
        n: index,
        data: b,
        total: total
      };

      chunks.push(chunk);

      start = end;
      index += 1;
    }
    dataCount += 1;
    return chunks;
  },

  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  //

  isSecure: function() {
    return location.protocol === 'https:';
  }
};

module.exports = util;

},{"./adapter":8,"js-binarypack":16}],15:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],16:[function(require,module,exports){
var BufferBuilder = require('./bufferbuilder').BufferBuilder;
var binaryFeatures = require('./bufferbuilder').binaryFeatures;

var BinaryPack = {
  unpack: function(data){
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function(data){
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data){
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function(){
  var type = this.unpack_uint8();
  if (type < 0x80){
    var positive_fixnum = type;
    return positive_fixnum;
  } else if ((type ^ 0xe0) < 0x20){
    var negative_fixnum = (type ^ 0xe0) - 0x20;
    return negative_fixnum;
  }
  var size;
  if ((size = type ^ 0xa0) <= 0x0f){
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f){
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f){
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f){
    return this.unpack_map(size);
  }
  switch(type){
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
}

Unpacker.prototype.unpack_uint8 = function(){
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function(){
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
}

Unpacker.prototype.unpack_uint32 = function(){
  var bytes = this.read(4);
  var uint32 =
     ((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3];
  this.index += 4;
  return uint32;
}

Unpacker.prototype.unpack_uint64 = function(){
  var bytes = this.read(8);
  var uint64 =
   ((((((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3]) * 256 +
       bytes[4]) * 256 +
       bytes[5]) * 256 +
       bytes[6]) * 256 +
       bytes[7];
  this.index += 8;
  return uint64;
}


Unpacker.prototype.unpack_int8 = function(){
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80 ) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function(){
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000 ) ? uint16 : uint16 - (1 << 16);
}

Unpacker.prototype.unpack_int32 = function(){
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31) ) ? uint32 :
    uint32 - Math.pow(2, 32);
}

Unpacker.prototype.unpack_int64 = function(){
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63) ) ? uint64 :
    uint64 - Math.pow(2, 64);
}

Unpacker.prototype.unpack_raw = function(size){
  if ( this.length < this.index + size){
    throw new Error('BinaryPackFailure: index is out of range'
      + ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

    //buf = util.bufferToString(buf);

  return buf;
}

Unpacker.prototype.unpack_string = function(size){
  var bytes = this.read(size);
  var i = 0, str = '', c, code;
  while(i < size){
    c = bytes[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (bytes[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i+1] & 63) << 6) |
        (bytes[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  this.index += size;
  return str;
}

Unpacker.prototype.unpack_array = function(size){
  var objects = new Array(size);
  for(var i = 0; i < size ; i++){
    objects[i] = this.unpack();
  }
  return objects;
}

Unpacker.prototype.unpack_map = function(size){
  var map = {};
  for(var i = 0; i < size ; i++){
    var key  = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
}

Unpacker.prototype.unpack_float = function(){
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp  = ((uint32 >> 23) & 0xff) - 127;
  var fraction = ( uint32 & 0x7fffff ) | 0x800000;
  return (sign == 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
}

Unpacker.prototype.unpack_double = function(){
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp  = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = ( h32 & 0xfffff ) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32   * Math.pow(2, exp - 52);
  return (sign == 0 ? 1 : -1) * frac;
}

Unpacker.prototype.read = function(length){
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
}

function Packer(){
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function(){
  return this.bufferBuilder.getBuffer();
}

Packer.prototype.pack = function(value){
  var type = typeof(value);
  if (type == 'string'){
    this.pack_string(value);
  } else if (type == 'number'){
    if (Math.floor(value) === value){
      this.pack_integer(value);
    } else{
      this.pack_double(value);
    }
  } else if (type == 'boolean'){
    if (value === true){
      this.bufferBuilder.append(0xc3);
    } else if (value === false){
      this.bufferBuilder.append(0xc2);
    }
  } else if (type == 'undefined'){
    this.bufferBuilder.append(0xc0);
  } else if (type == 'object'){
    if (value === null){
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array){
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value){
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if (constructor == Object){
        this.pack_object(value);
      } else if (constructor == Date){
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack == 'function'){
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
}


Packer.prototype.pack_bin = function(blob){
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f){
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xda) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
}

Packer.prototype.pack_string = function(str){
  var length = utf8Length(str);

  if (length <= 0x0f){
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xd8) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
}

Packer.prototype.pack_array = function(ary){
  var length = ary.length;
  if (length <= 0x0f){
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xdc)
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var i = 0; i < length ; i++){
    this.pack(ary[i]);
  }
}

Packer.prototype.pack_integer = function(num){
  if ( -0x20 <= num && num <= 0x7f){
    this.bufferBuilder.append(num & 0xff);
  } else if (0x00 <= num && num <= 0xff){
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (-0x80 <= num && num <= 0x7f){
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if ( 0x0000 <= num && num <= 0xffff){
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (-0x8000 <= num && num <= 0x7fff){
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if ( 0x00000000 <= num && num <= 0xffffffff){
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (-0x80000000 <= num && num <= 0x7fffffff){
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (-0x8000000000000000 <= num && num <= 0x7FFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (0x0000000000000000 <= num && num <= 0xFFFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else{
    throw new Error('Invalid integer');
  }
}

Packer.prototype.pack_double = function(num){
  var sign = 0;
  if (num < 0){
    sign = 1;
    num = -num;
  }
  var exp  = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32   = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp+1023) << 20) |
      (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
}

Packer.prototype.pack_object = function(obj){
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f){
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
}

Packer.prototype.pack_uint8 = function(num){
  this.bufferBuilder.append(num);
}

Packer.prototype.pack_uint16 = function(num){
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_uint32 = function(num){
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((n & 0x000000ff));
}

Packer.prototype.pack_uint64 = function(num){
  var high = num / Math.pow(2, 32);
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

Packer.prototype.pack_int8 = function(num){
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int16 = function(num){
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int32 = function(num){
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
}

Packer.prototype.pack_int64 = function(num){
  var high = Math.floor(num / Math.pow(2, 32));
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

function _utf8Replace(m){
  var code = m.charCodeAt(0);

  if(code <= 0x7ff) return '00';
  if(code <= 0xffff) return '000';
  if(code <= 0x1fffff) return '0000';
  if(code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length(str){
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}

},{"./bufferbuilder":17}],17:[function(require,module,exports){
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function(){
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function(){
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window != 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder(){
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function(data) {
  if(typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function() {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if(!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function() {
  this.flush();
  if(binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for(var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;

},{}],18:[function(require,module,exports){
var util = require('./util');

/**
 * Reliable transfer for Chrome Canary DataChannel impl.
 * Author: @michellebu
 */
function Reliable(dc, debug) {
  if (!(this instanceof Reliable)) return new Reliable(dc);
  this._dc = dc;

  util.debug = debug;

  // Messages sent/received so far.
  // id: { ack: n, chunks: [...] }
  this._outgoing = {};
  // id: { ack: ['ack', id, n], chunks: [...] }
  this._incoming = {};
  this._received = {};

  // Window size.
  this._window = 1000;
  // MTU.
  this._mtu = 500;
  // Interval for setInterval. In ms.
  this._interval = 0;

  // Messages sent.
  this._count = 0;

  // Outgoing message queue.
  this._queue = [];

  this._setupDC();
};

// Send a message reliably.
Reliable.prototype.send = function(msg) {
  // Determine if chunking is necessary.
  var bl = util.pack(msg);
  if (bl.size < this._mtu) {
    this._handleSend(['no', bl]);
    return;
  }

  this._outgoing[this._count] = {
    ack: 0,
    chunks: this._chunk(bl)
  };

  if (util.debug) {
    this._outgoing[this._count].timer = new Date();
  }

  // Send prelim window.
  this._sendWindowedChunks(this._count);
  this._count += 1;
};

// Set up interval for processing queue.
Reliable.prototype._setupInterval = function() {
  // TODO: fail gracefully.

  var self = this;
  this._timeout = setInterval(function() {
    // FIXME: String stuff makes things terribly async.
    var msg = self._queue.shift();
    if (msg._multiple) {
      for (var i = 0, ii = msg.length; i < ii; i += 1) {
        self._intervalSend(msg[i]);
      }
    } else {
      self._intervalSend(msg);
    }
  }, this._interval);
};

Reliable.prototype._intervalSend = function(msg) {
  var self = this;
  msg = util.pack(msg);
  util.blobToBinaryString(msg, function(str) {
    self._dc.send(str);
  });
  if (self._queue.length === 0) {
    clearTimeout(self._timeout);
    self._timeout = null;
    //self._processAcks();
  }
};

// Go through ACKs to send missing pieces.
Reliable.prototype._processAcks = function() {
  for (var id in this._outgoing) {
    if (this._outgoing.hasOwnProperty(id)) {
      this._sendWindowedChunks(id);
    }
  }
};

// Handle sending a message.
// FIXME: Don't wait for interval time for all messages...
Reliable.prototype._handleSend = function(msg) {
  var push = true;
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    var item = this._queue[i];
    if (item === msg) {
      push = false;
    } else if (item._multiple && item.indexOf(msg) !== -1) {
      push = false;
    }
  }
  if (push) {
    this._queue.push(msg);
    if (!this._timeout) {
      this._setupInterval();
    }
  }
};

// Set up DataChannel handlers.
Reliable.prototype._setupDC = function() {
  // Handle various message types.
  var self = this;
  this._dc.onmessage = function(e) {
    var msg = e.data;
    var datatype = msg.constructor;
    // FIXME: msg is String until binary is supported.
    // Once that happens, this will have to be smarter.
    if (datatype === String) {
      var ab = util.binaryStringToArrayBuffer(msg);
      msg = util.unpack(ab);
      self._handleMessage(msg);
    }
  };
};

// Handles an incoming message.
Reliable.prototype._handleMessage = function(msg) {
  var id = msg[1];
  var idata = this._incoming[id];
  var odata = this._outgoing[id];
  var data;
  switch (msg[0]) {
    // No chunking was done.
    case 'no':
      var message = id;
      if (!!message) {
        this.onmessage(util.unpack(message));
      }
      break;
    // Reached the end of the message.
    case 'end':
      data = idata;

      // In case end comes first.
      this._received[id] = msg[2];

      if (!data) {
        break;
      }

      this._ack(id);
      break;
    case 'ack':
      data = odata;
      if (!!data) {
        var ack = msg[2];
        // Take the larger ACK, for out of order messages.
        data.ack = Math.max(ack, data.ack);

        // Clean up when all chunks are ACKed.
        if (data.ack >= data.chunks.length) {
          util.log('Time: ', new Date() - data.timer);
          delete this._outgoing[id];
        } else {
          this._processAcks();
        }
      }
      // If !data, just ignore.
      break;
    // Received a chunk of data.
    case 'chunk':
      // Create a new entry if none exists.
      data = idata;
      if (!data) {
        var end = this._received[id];
        if (end === true) {
          break;
        }
        data = {
          ack: ['ack', id, 0],
          chunks: []
        };
        this._incoming[id] = data;
      }

      var n = msg[2];
      var chunk = msg[3];
      data.chunks[n] = new Uint8Array(chunk);

      // If we get the chunk we're looking for, ACK for next missing.
      // Otherwise, ACK the same N again.
      if (n === data.ack[2]) {
        this._calculateNextAck(id);
      }
      this._ack(id);
      break;
    default:
      // Shouldn't happen, but would make sense for message to just go
      // through as is.
      this._handleSend(msg);
      break;
  }
};

// Chunks BL into smaller messages.
Reliable.prototype._chunk = function(bl) {
  var chunks = [];
  var size = bl.size;
  var start = 0;
  while (start < size) {
    var end = Math.min(size, start + this._mtu);
    var b = bl.slice(start, end);
    var chunk = {
      payload: b
    }
    chunks.push(chunk);
    start = end;
  }
  util.log('Created', chunks.length, 'chunks.');
  return chunks;
};

// Sends ACK N, expecting Nth blob chunk for message ID.
Reliable.prototype._ack = function(id) {
  var ack = this._incoming[id].ack;

  // if ack is the end value, then call _complete.
  if (this._received[id] === ack[2]) {
    this._complete(id);
    this._received[id] = true;
  }

  this._handleSend(ack);
};

// Calculates the next ACK number, given chunks.
Reliable.prototype._calculateNextAck = function(id) {
  var data = this._incoming[id];
  var chunks = data.chunks;
  for (var i = 0, ii = chunks.length; i < ii; i += 1) {
    // This chunk is missing!!! Better ACK for it.
    if (chunks[i] === undefined) {
      data.ack[2] = i;
      return;
    }
  }
  data.ack[2] = chunks.length;
};

// Sends the next window of chunks.
Reliable.prototype._sendWindowedChunks = function(id) {
  util.log('sendWindowedChunks for: ', id);
  var data = this._outgoing[id];
  var ch = data.chunks;
  var chunks = [];
  var limit = Math.min(data.ack + this._window, ch.length);
  for (var i = data.ack; i < limit; i += 1) {
    if (!ch[i].sent || i === data.ack) {
      ch[i].sent = true;
      chunks.push(['chunk', id, i, ch[i].payload]);
    }
  }
  if (data.ack + this._window >= ch.length) {
    chunks.push(['end', id, ch.length])
  }
  chunks._multiple = true;
  this._handleSend(chunks);
};

// Puts together a message from chunks.
Reliable.prototype._complete = function(id) {
  util.log('Completed called for', id);
  var self = this;
  var chunks = this._incoming[id].chunks;
  var bl = new Blob(chunks);
  util.blobToArrayBuffer(bl, function(ab) {
    self.onmessage(util.unpack(ab));
  });
  delete this._incoming[id];
};

// Ups bandwidth limit on SDP. Meant to be called during offer/answer.
Reliable.higherBandwidthSDP = function(sdp) {
  // AS stands for Application-Specific Maximum.
  // Bandwidth number is in kilobits / sec.
  // See RFC for more info: http://www.ietf.org/rfc/rfc2327.txt

  // Chrome 31+ doesn't want us munging the SDP, so we'll let them have their
  // way.
  var version = navigator.appVersion.match(/Chrome\/(.*?) /);
  if (version) {
    version = parseInt(version[1].split('.').shift());
    if (version < 31) {
      var parts = sdp.split('b=AS:30');
      var replace = 'b=AS:102400'; // 100 Mbps
      if (parts.length > 1) {
        return parts[0] + replace + parts[1];
      }
    }
  }

  return sdp;
};

// Overwritten, typically.
Reliable.prototype.onmessage = function(msg) {};

module.exports.Reliable = Reliable;

},{"./util":19}],19:[function(require,module,exports){
var BinaryPack = require('js-binarypack');

var util = {
  debug: false,
  
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,
  
  log: function () {
    if (util.debug) {
      var copy = [];
      for (var i = 0; i < arguments.length; i++) {
        copy[i] = arguments[i];
      }
      copy.unshift('Reliable: ');
      console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),
  
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  }
};

module.exports = util;

},{"js-binarypack":16}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImxpYi9BbmFsb2dTdGljay5qcyIsImxpYi9CdXR0b24uanMiLCJsaWIvRFBhZC5qcyIsImxpYi9LRVlTLmpzIiwibGliL2tleWJvYXJkQ29udHJvbGxlci5qcyIsImxpYi90b3VjaENvbnRyb2xsZXIuanMiLCJsaWIvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL2xpYi9hZGFwdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BlZXJqcy9saWIvZGF0YWNvbm5lY3Rpb24uanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL2xpYi9tZWRpYWNvbm5lY3Rpb24uanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL2xpYi9uZWdvdGlhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3BlZXJqcy9saWIvcGVlci5qcyIsIm5vZGVfbW9kdWxlcy9wZWVyanMvbGliL3NvY2tldC5qcyIsIm5vZGVfbW9kdWxlcy9wZWVyanMvbGliL3V0aWwuanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL25vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BlZXJqcy9ub2RlX21vZHVsZXMvanMtYmluYXJ5cGFjay9saWIvYmluYXJ5cGFjay5qcyIsIm5vZGVfbW9kdWxlcy9wZWVyanMvbm9kZV9tb2R1bGVzL2pzLWJpbmFyeXBhY2svbGliL2J1ZmZlcmJ1aWxkZXIuanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL25vZGVfbW9kdWxlcy9yZWxpYWJsZS9saWIvcmVsaWFibGUuanMiLCJub2RlX21vZHVsZXMvcGVlcmpzL25vZGVfbW9kdWxlcy9yZWxpYWJsZS9saWIvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbmZ1bmN0aW9uIEFuYWxvZ1N0aWNrKGRvbWlkLCBwb3NpdGlvbikge1xuXG4gICAgdmFyIHRvcFRvdWNoT2Zmc2V0ID0gVXRpbHMudG9wVG91Y2hPZmZzZXQoKTtcblxuICAgIC8vID09PT09PT09PT09PSBIIEUgTCBQIEUgUiAgRiBVIE4gQyBUIEkgTyBOIFMgPT09PT09PT09PT09XG4gICAgZnVuY3Rpb24gaGFuZGxlU3RhcnQoZSkge1xuICAgICAgICBzZWxmLnByZXNzZWQgPSB0cnVlO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNlbGYuZnggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblg7XG4gICAgICAgIHNlbGYuZnkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblkgLSB0b3BUb3VjaE9mZnNldDtcbiAgICAgICAgaWYgKHNlbGYuYWxsb3dPbkNsaWNrICYmIHNlbGYub25DbGljayAhPT0gbnVsbCkgc2VsZi5vbkNsaWNrLmNhbGwoc2VsZik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlRW5kKGUpIHtcbiAgICAgICAgc2VsZi5wcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHNlbGYuYWxsb3dPbkNsaWNrICYmIHNlbGYub25SZWxlYXNlICE9PSBudWxsKSBzZWxmLm9uUmVsZWFzZS5jYWxsKHNlbGYpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZU1vdmUoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNlbGYuZnggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblg7XG4gICAgICAgIHNlbGYuZnkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblkgLSB0b3BUb3VjaE9mZnNldDtcbiAgICAgICAgaWYgKHNlbGYuYWxsb3dPbkNsaWNrICYmIHNlbGYub25DbGljayAhPT0gbnVsbCkgc2VsZi5vbkNsaWNrLmNhbGwoc2VsZik7XG4gICAgfVxuICAgIC8vID09PT09PT09PT09PSBIIEUgTCBQIEUgUiAgRiBVIE4gQyBUIEkgTyBOIFMgPT09PT09PT09PT09XG5cbiAgICB0aGlzLmFsbG93T25DbGljayA9IHRydWU7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZG9taWQpO1xuICAgIHZhciBzdHlsZSA9IFwiXCI7XG4gICAgdmFyIHNlbGYgPSB0aGlzLCBpZDtcbiAgICB2YXIgZGlhbWV0ZXIgPSBVdGlscy5kaWFtZXRlcigpO1xuICAgIGlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiYm90dG9tXCIgaW4gcG9zaXRpb24pIHtcbiAgICAgICAgICAgIHN0eWxlICs9IFwiYm90dG9tOlwiICtwb3NpdGlvbi5ib3R0b20gKyBcInB4O1wiO1xuICAgICAgICB9IGVsc2UgaWYgKFwidG9wXCIgaW4gcG9zaXRpb24pIHtcbiAgICAgICAgICAgIHN0eWxlICs9IFwidG9wOlwiICtwb3NpdGlvbi50b3AgKyBcInB4O1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImxlZnRcIiBpbiBwb3NpdGlvbil7XG4gICAgICAgICAgICBzdHlsZSArPSBcImxlZnQ6XCIgK3Bvc2l0aW9uLmxlZnQgKyBcInB4O1wiO1xuICAgICAgICB9IGVsc2UgaWYgKFwicmlnaHRcIiBpbiBwb3NpdGlvbikge1xuICAgICAgICAgICAgc3R5bGUgKz0gXCJyaWdodDpcIiArcG9zaXRpb24ucmlnaHQgKyBcInB4O1wiO1xuICAgICAgICB9XG4gICAgICAgIGlkID0gVXRpbHMubmV3SWQoKTtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9XCInK1xuICAgICAgICAgICAgc3R5bGUrXG4gICAgICAgICAgICAnXCIgaWQ9XCInKyBpZFxuICAgICAgICAgICAgKydcIiBjbGFzcz1cInRvdWNoQ29udHJvbGxlclwiPjxkaXYgY2xhc3M9XCJpbm5lclRvdWNoQ29udHJvbGxlclwiPjwvZGl2PjwvZGl2Pic7XG5cbiAgICAgICAgdGhpcy5meCA9IC0xO1xuICAgICAgICB0aGlzLmZ5ID0gLTE7XG4gICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuXG4gICAgICAgIHRoaXMub25DbGljayA9IG51bGw7XG4gICAgICAgIHRoaXMub25SZWxlYXNlID0gbnVsbDtcblxuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBoYW5kbGVTdGFydCwgZmFsc2UpO1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgaGFuZGxlRW5kLCBmYWxzZSk7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgaGFuZGxlTW92ZSwgZmFsc2UpO1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIiwgaGFuZGxlRW5kLCBmYWxzZSk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAgICAgdmFyIG8gPSBVdGlscy5nZXRPZmZzZXRSZWN0KGVsKTtcbiAgICAgICAgICAgIHNlbGYueCA9IG8ubGVmdCArIE1hdGguY2VpbChkaWFtZXRlci8yKTtcbiAgICAgICAgICAgIHNlbGYueSA9IG8udG9wICsgTWF0aC5jZWlsKGRpYW1ldGVyLzIpO1xuICAgICAgICB9LDEwMCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOT04tVE9VQ0gtREVWSUNFXG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xuICAgIH1cbn1cblxuQW5hbG9nU3RpY2sucHJvdG90eXBlLmlzUHJlc3NlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMucHJlc3NlZDtcbn07XG5cbkFuYWxvZ1N0aWNrLnByb3RvdHlwZS5nZXREZWdyZWUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBVdGlscy5nZXREZWdyZWUodGhpcy54LCB0aGlzLnksIHRoaXMuZngsIHRoaXMuZnkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbmFsb2dTdGljazsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDQvNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBLZXlib2FyZENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2tleWJvYXJkQ29udHJvbGxlci5qcycpO1xudmFyIG5leHRJRCA9IDA7XG5cbmZ1bmN0aW9uIEJ1dHRvbihkb21pZCwgbmFtZSwgb3B0aW9ucykge1xuICAgIC8vID09PT09PT09PT09PSBIIEUgTCBQIEUgUiAgRiBVIE4gQyBUIEkgTyBOIFMgPT09PT09PT09PT09XG4gICAgZnVuY3Rpb24gaGFuZGxlU3RhcnQoZSkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NOYW1lID0gXCJ0b3VjaEJ0biBwcmVzc2VkXCI7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFbmQoZSkge1xuICAgICAgICBpZiAoc2VsZi5vbkNsaWNrICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZWxmLm9uQ2xpY2suY2FsbChzZWxmKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NOYW1lID0gXCJ0b3VjaEJ0blwiO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlQ2FuY2VsKGUpe1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NOYW1lID0gXCJ0b3VjaEJ0blwiO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICAgIC8vID09PT09PT09PT09PSBIIEUgTCBQIEUgUiAgRiBVIE4gQyBUIEkgTyBOIFMgPT09PT09PT09PT09XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZG9taWQpO1xuICAgIHZhciBrZXlUb0J1dHRvbiA9IEtleWJvYXJkQ29udHJvbGxlci5rZXlUb0J1dHRvbigpO1xuICAgIGlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gXCJcIjtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiYm90dG9tXCIgaW4gb3B0aW9ucyl7XG4gICAgICAgICAgICBzdHlsZSArPSBcImJvdHRvbTpcIiArb3B0aW9ucy5ib3R0b20gKyBcInB4O1wiO1xuICAgICAgICB9IGVsc2UgaWYgKFwidG9wXCIgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgc3R5bGUgKz0gXCJ0b3A6XCIgK29wdGlvbnMudG9wICsgXCJweDtcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJsZWZ0XCIgaW4gb3B0aW9ucyl7XG4gICAgICAgICAgICBzdHlsZSArPSBcImxlZnQ6XCIgK29wdGlvbnMubGVmdCArIFwicHg7XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJyaWdodFwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHN0eWxlICs9IFwicmlnaHQ6XCIgK29wdGlvbnMucmlnaHQgKyBcInB4O1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlkID0gXCJ0b3VjaEJ0blwiICsgbmV4dElEKys7XG4gICAgICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IHN0eWxlPVwiJytcbiAgICAgICAgICAgIHN0eWxlK1xuICAgICAgICAgICAgJ1wiIGlkPVwiJysgaWRcbiAgICAgICAgICAgICsnXCIgY2xhc3M9XCJ0b3VjaEJ0blwiPjxkaXYgY2xhc3M9XCJ0b3VjaEJ0blR4dFwiPicgKyBuYW1lICsnPC9kaXY+PC9kaXY+JztcblxuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBoYW5kbGVTdGFydCwgZmFsc2UpO1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgaGFuZGxlRW5kLCBmYWxzZSk7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCBoYW5kbGVDYW5jZWwsIGZhbHNlKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5PTiBUT1VDSCBERVZJQ0VcbiAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgIGlmIChcImtleVwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGtleVRvQnV0dG9uW29wdGlvbnNbXCJrZXlcIl1dID0gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm9uQ2xpY2sgPSBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbjsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDQvNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBLZXlib2FyZENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2tleWJvYXJkQ29udHJvbGxlci5qcycpO1xudmFyIEFuYWxvZ1N0aWNrID0gcmVxdWlyZSgnLi9BbmFsb2dTdGljay5qcycpO1xuXG52YXIgbGlzdGVuZXIgPSAtMTtcblxuZnVuY3Rpb24gRFBhZChkb21pZCwgb3B0aW9ucykge1xuICAgIHZhciBDTElDS19JTlRFUlZBTF9JTl9NUyA9IDUwMDtcbiAgICB2YXIgSU5URVJWQUxfU1BFRUQgPSAxMjU7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBsYXN0VGltZVByZXNzZWRNcyA9IDA7XG4gICAgdmFyIGZpcnN0Q2xpY2sgPSB0cnVlO1xuICAgIHZhciBrZXlQcmVzc0NoZWNrID0gbnVsbDtcbiAgICB2YXIgaXNrZXlkb3duID0gZmFsc2U7XG4gICAgdmFyIGN1cnJlbnRLZXkgPSAtMTtcblxuICAgIEFuYWxvZ1N0aWNrLmNhbGwodGhpcywgZG9taWQsb3B0aW9ucyk7XG4gICAgaWYgKFwiV0FTREV2ZW50c1wiIGluIG9wdGlvbnMgJiYgb3B0aW9uc1tcIldBU0RFdmVudHNcIl0pe1xuICAgICAgICBpZiAobGlzdGVuZXIgIT09IC0xKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGxpc3RlbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcbiAgICAgICAgICAgIHRoaXMub25DbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0Q2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzZWxmLmdldERpcmVjdGlvbigpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5VUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblVwICE9PSBudWxsKSBzZWxmLm9uVXAuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5ET1dOOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uRG93biAhPT0gbnVsbCkgc2VsZi5vbkRvd24uY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5MRUZUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uTGVmdCAhPT0gbnVsbCkgc2VsZi5vbkxlZnQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5SSUdIVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblJpZ2h0ICE9PSBudWxsKSBzZWxmLm9uUmlnaHQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lUHJlc3NlZE1zID0gbm93O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzZWxmLmdldERpcmVjdGlvbigpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMub25SZWxlYXNlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBmaXJzdENsaWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGtleVByZXNzQ2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5pc1ByZXNzZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lUHJlc3NlZE1zID0gbm93O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzZWxmLmdldERpcmVjdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblVwICE9PSBudWxsKSBzZWxmLm9uVXAuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uRG93biAhPT0gbnVsbCkgc2VsZi5vbkRvd24uY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uTGVmdCAhPT0gbnVsbCkgc2VsZi5vbkxlZnQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblJpZ2h0ICE9PSBudWxsKSBzZWxmLm9uUmlnaHQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTk9UIFRPVUNIIERFVklDRVxuICAgICAgICAgICAgdmFyIGtleVByZXNzZWQgPSB7XG4gICAgICAgICAgICAgICAgXCI4N1wiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcIjY1XCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiNjhcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCI4M1wiOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBrZXlDb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAgICAgICAgIGlmIChrZXlDb2RlID09PSA4NyB8fCBrZXlDb2RlID09PSA2NSB8fCBrZXlDb2RlID09PSA2OCB8fCBrZXlDb2RlID09PSA4Mykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50S2V5ID0ga2V5Q29kZTtcbiAgICAgICAgICAgICAgICAgICAga2V5UHJlc3NlZFtcIlwiK2tleUNvZGVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5rZXlEaXJlY3Rpb24gPSBjdXJyZW50S2V5O1xuICAgICAgICAgICAgICAgICAgICBpc2tleWRvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdENsaWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0VGltZVByZXNzZWRNcyA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Q2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5Q29kZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblVwICE9PSBudWxsKSBzZWxmLm9uVXAuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uRG93biAhPT0gbnVsbCkgc2VsZi5vbkRvd24uY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uTGVmdCAhPT0gbnVsbCkgc2VsZi5vbkxlZnQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vblJpZ2h0ICE9PSBudWxsKSBzZWxmLm9uUmlnaHQuY2FsbChzZWxmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG5vdyAtIGxhc3RUaW1lUHJlc3NlZE1zKSA+IENMSUNLX0lOVEVSVkFMX0lOX01TKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChrZXlDb2RlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgS2V5Ym9hcmRDb250cm9sbGVyLm9uV0FTRFVwKGRvbWlkLCBmdW5jdGlvbiAoa2V5Q29kZSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXlDb2RlID09PSA4NyB8fCBrZXlDb2RlID09PSA2NSB8fCBrZXlDb2RlID09PSA2OCB8fCBrZXlDb2RlID09PSA4Mykge1xuICAgICAgICAgICAgICAgICAgICBrZXlQcmVzc2VkW1wiXCIra2V5Q29kZV0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFrZXlQcmVzc2VkW1wiODdcIl0gJiYgIWtleVByZXNzZWRbXCI2NVwiXSAmJiAha2V5UHJlc3NlZFtcIjY4XCJdICYmICFrZXlQcmVzc2VkW1wiODNcIl0pe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5rZXlEaXJlY3Rpb24gPSBEUGFkLk5PTkU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc2tleWRvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Q2xpY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBrZXlQcmVzc0NoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlza2V5ZG93bikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lUHJlc3NlZE1zID0gbm93O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjdXJyZW50S2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBsaXN0ZW5lciA9IHNldEludGVydmFsKGtleVByZXNzQ2hlY2ssIElOVEVSVkFMX1NQRUVEKTtcblxuICAgICAgICB0aGlzLm9uVXAgPSBudWxsO1xuICAgICAgICB0aGlzLm9uRG93biA9IG51bGw7XG4gICAgICAgIHRoaXMub25MZWZ0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5vblJpZ2h0ID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5rZXlEaXJlY3Rpb24gPSBEUGFkLk5PTkU7XG59XG5cbkRQYWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBbmFsb2dTdGljay5wcm90b3R5cGUpO1xuXG5EUGFkLlVQID0gODc7XG5EUGFkLkRPV04gPSA4MztcbkRQYWQuTEVGVCA9IDY1O1xuRFBhZC5SSUdIVCA9IDY4O1xuRFBhZC5OT05FID0gLTE7XG5cbmlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcbiAgICBEUGFkLnByb3RvdHlwZS5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiAodGhpcy5pc1ByZXNzZWQoKSkge1xuICAgICAgICAgICAgdmFyIGRlZyA9IHRoaXMuZ2V0RGVncmVlKCk7XG4gICAgICAgICAgICBpZiAoZGVnIDwgNDUgfHwgZGVnID49IDMxNSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIERQYWQuTEVGVDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVnIDwgMzE1ICYmIGRlZyA+PSAyMjUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5VUDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVnIDwgMjI1ICYmIGRlZyA+PSAxMzUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5SSUdIVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIERQYWQuRE9XTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBEUGFkLk5PTkU7XG4gICAgICAgIH1cbiAgICB9O1xufSBlbHNlIHtcbiAgICBEUGFkLnByb3RvdHlwZS5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlEaXJlY3Rpb247XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEUGFkOyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgU1BBQ0UgOiBcInNwXCIsXG4gICAgRU5URVIgOiBcImVuXCIsXG4gICAgRVNDIDogXCJlc2NcIixcbiAgICBRIDogXCJxXCIsXG4gICAgRSA6IFwiZVwiXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG52YXIgS0VZUyA9IHJlcXVpcmUoJy4vS0VZUy5qcycpO1xuXG52YXIgX2tleVRvQnV0dG9uID0ge307XG5cbmZ1bmN0aW9uIHRlc3RBbmRFeGVjS2V5KGtleWNvZGUsIGV4cGVjdGVkS2V5Y29kZSwgdmFsdWUpIHtcbiAgICBpZiAoZXhwZWN0ZWRLZXljb2RlID09PSBrZXljb2RlICYmIHZhbHVlIGluIF9rZXlUb0J1dHRvbikge1xuICAgICAgICB2YXIgYnRuID0gX2tleVRvQnV0dG9uW3ZhbHVlXTtcbiAgICAgICAgaWYgKGJ0bi5vbkNsaWNrICE9PSBudWxsKSB7XG4gICAgICAgICAgICBidG4ub25DbGljay5jYWxsKGJ0bik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuaWYgKCFVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcblxuICAgIGRvY3VtZW50Lm9ua2V5dXAgPSBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgIHZhciBrZXlDb2RlID0gZS5rZXlDb2RlO1xuXG4gICAgICAgIC8vIGlnbm9yZSBXQVNEXG4gICAgICAgIGlmIChrZXlDb2RlICE9PSA4NyAmJiBrZXlDb2RlICE9PSA2NSAmJlxuICAgICAgICAgICAga2V5Q29kZSAhPT0gODMgJiYga2V5Q29kZSAhPT0gNjgpIHtcbiAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgMzIsIEtFWVMuU1BBQ0UpKVxuICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgMTMsIEtFWVMuRU5URVIpKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RBbmRFeGVjS2V5KGtleUNvZGUsIDI3LCBLRVlTLkVTQykpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RBbmRFeGVjS2V5KGtleUNvZGUsIDgxLCBLRVlTLlEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgNjksIEtFWVMuRSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsIEwgPSBfd2FzZENhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IEw7IGkrKykge1xuICAgICAgICAgICAgICAgIF93YXNkQ2FsbGJhY2tzW2ldLmNhbGxiYWNrKGtleUNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xuXG59XG5cbnZhciBfd2FzZENhbGxiYWNrcyA9IFtdO1xuXG5mdW5jdGlvbiBkZWxldGVCeUlkKGRvbUlkLCBsaXN0KSB7XG4gICAgdmFyIGkgPSAwLCBMID0gbGlzdC5sZW5ndGg7XG4gICAgZm9yICg7IGkgPCBMOyBpKyspIHtcbiAgICAgICAgaWYgKGxpc3RbaV0uaWQgPT09IGRvbUlkKSB7XG4gICAgICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IHdpbGwgYmUgY2FsbGVkIHdoZW4gYSBXQVNEIGtleSB3YXMgcHJlc3NlZCBhbmQgaXMgdXAgYWdhaW5cbiAgICAgKiBAcGFyYW0gZG9tSWQgdG8gbWFrZSBpdCByZW1vdmFibGVcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sge2Z1bmN0aW9ufVxuICAgICAqL1xuICAgIG9uV0FTRFVwOiBmdW5jdGlvbiAoZG9tSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGRlbGV0ZUJ5SWQoZG9tSWQsIF93YXNkQ2FsbGJhY2tzKTtcbiAgICAgICAgX3dhc2RDYWxsYmFja3MucHVzaCh7aWQ6IGRvbUlkLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9LFxuXG4gICAga2V5VG9CdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9rZXlUb0J1dHRvbjtcbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vcmVxdWlyZSgnLi90b3VjaENvbnRyb2xsZXIuanMnKTtcblxudmFyIFBlZXJqcyA9IHJlcXVpcmUoJ3BlZXJqcycpO1xuY29uc29sZS5sb2coUGVlcmpzKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbnZhciBBbmFsb2dTdGljayA9IHJlcXVpcmUoJy4vQW5hbG9nU3RpY2suanMnKTtcbnZhciBEUGFkID0gcmVxdWlyZSgnLi9EUGFkLmpzJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24uanMnKTtcbnZhciBLRVlTID0gcmVxdWlyZSgnLi9LRVlTLmpzJyk7XG5cbnZhciBfZGlhbWV0ZXIgPSBVdGlscy5kaWFtZXRlcigpO1xudmFyIF9idG5EaWFtZXRlciA9IFV0aWxzLmJ0bkRpYW1ldGVyKCk7XG5cbmlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcbiAgICBkb2N1bWVudC53cml0ZShcIjxzdHlsZSBpZD0ndG91Y2hDb250cm9sbGVyU3R5bGUnPi50b3VjaENvbnRyb2xsZXJ7IFwiICtcbiAgICAgICAgXCJ3aWR0aDpcIitfZGlhbWV0ZXIrXCJweDtoZWlnaHQ6XCIrX2RpYW1ldGVyK1wicHg7Ym9yZGVyOjJweCBzb2xpZCBibGFjaztwb3NpdGlvbjphYnNvbHV0ZTtib3JkZXItcmFkaXVzOjUwJTtcIiArXG4gICAgICAgIFwiIH0gLmlubmVyVG91Y2hDb250cm9sbGVyIHtcIiArXG4gICAgICAgIFwid2lkdGg6NXB4O2hlaWdodDo1cHg7bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0bzttYXJnaW4tdG9wOlwiKyhNYXRoLmNlaWwoX2RpYW1ldGVyLzIpKStcbiAgICAgICAgXCJweDtiYWNrZ3JvdW5kLWNvbG9yOmJsYWNrO31cIiArXG4gICAgICAgIFwiLnRvdWNoQnRue3Bvc2l0aW9uOmFic29sdXRlO2JvcmRlcjoycHggc29saWQgYmxhY2s7cG9zaXRpb246YWJzb2x1dGU7Ym9yZGVyLXJhZGl1czo1MCU7XCIgK1xuICAgICAgICBcIndpZHRoOlwiK19idG5EaWFtZXRlcitcInB4O2hlaWdodDpcIitfYnRuRGlhbWV0ZXIrXCJweDt9XCIgK1xuICAgICAgICBcIi50b3VjaEJ0blR4dHt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDpcIitfYnRuRGlhbWV0ZXIrXCJweDt9XCIgK1xuICAgICAgICBcIi50b3VjaEJ0bi5wcmVzc2Vke2JhY2tncm91bmQtY29sb3I6Y29ybmZsb3dlcmJsdWU7fVwiICtcbiAgICAgICAgXCI8L3N0eWxlPlwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2VhdGhlciB0aGUgY3VycmVudCBkZXZpY2UgY2FuIHVzZSB0b3VjaCBvciBub3RcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBpc1RvdWNoRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5pc1RvdWNoRGV2aWNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0cmlwcyBhd2F5IHRoZSBkZWZhdWx0IHN0eWxlXG4gICAgICovXG4gICAgc3RyaXBTdHlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b3VjaENvbnRyb2xsZXJTdHlsZScpO1xuICAgICAgICBlbGVtZW50Lm91dGVySFRNTCA9IFwiXCI7XG4gICAgfSxcblxuICAgIEFuYWxvZ1N0aWNrOiBBbmFsb2dTdGljayxcblxuICAgIERQYWQ6IERQYWQsXG5cbiAgICBCdXR0b246IEJ1dHRvbixcblxuICAgIEtFWVM6IEtFWVNcblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDQvNC8yMDE1LlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gaXNUb3VjaERldmljZSgpIHtcbiAgICByZXR1cm4gKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpXG4gICAgICAgIHx8IChuYXZpZ2F0b3IuTWF4VG91Y2hQb2ludHMgPiAwKVxuICAgICAgICB8fCAobmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMgPiAwKSk7XG59XG5cbnZhciBfaXNUb3VjaERldmljZSA9IGlzVG91Y2hEZXZpY2UoKTtcblxudmFyIF9pc0Nocm9tZSA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdjaHJvbWUnKSA+IC0xO1xuXG52YXIgX3RvRGVnID0gMTgwIC8gTWF0aC5QSTtcblxudmFyIF9jdXJyZW50SWQgPSAwO1xuXG52YXIgX3RvcFRvdWNoT2Zmc2V0ID0gMDtcbmlmIChfaXNDaHJvbWUpIHtcbiAgICBfdG9wVG91Y2hPZmZzZXQgPSAxMDA7XG59XG5cbnZhciBfZGlhbWV0ZXIgPSAxNDA7XG52YXIgX2J0bkRpYW1ldGVyID0gNjU7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgZGlhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9kaWFtZXRlcjtcbiAgICB9LFxuXG4gICAgYnRuRGlhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9idG5EaWFtZXRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2VuZXJhdGVzIGEgbmV3IHVuaXF1ZSBpZFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgbmV3SWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidG91Y2hDb250cm9sbGVyXCIgKyBfY3VycmVudElkKys7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3ZWF0aGVyIHRoZSBkZXZpY2UgY2FuIHVzZSB0b3VjaCBvciBub3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1RvdWNoRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfaXNUb3VjaERldmljZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuZXMgdHJ1ZSB3aGVuIHRoZSByZW5kZXJlciBpcyBDaHJvbWVcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc0Nocm9tZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX2lzQ2hyb21lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHJldHVybnMge3t0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfX1cbiAgICAgKi9cbiAgICBnZXRPZmZzZXRSZWN0OiBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICAvLyAoMSlcbiAgICAgICAgdmFyIGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIC8vICgyKVxuICAgICAgICB2YXIgc2Nyb2xsVG9wID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsVG9wIHx8IGJvZHkuc2Nyb2xsVG9wO1xuICAgICAgICB2YXIgc2Nyb2xsTGVmdCA9IHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbExlZnQgfHwgYm9keS5zY3JvbGxMZWZ0O1xuICAgICAgICAvLyAoMylcbiAgICAgICAgdmFyIGNsaWVudFRvcCA9IGRvY0VsZW0uY2xpZW50VG9wIHx8IGJvZHkuY2xpZW50VG9wIHx8IDA7XG4gICAgICAgIHZhciBjbGllbnRMZWZ0ID0gZG9jRWxlbS5jbGllbnRMZWZ0IHx8IGJvZHkuY2xpZW50TGVmdCB8fCAwO1xuICAgICAgICAvLyAoNClcbiAgICAgICAgdmFyIHRvcCA9IGJveC50b3AgKyBzY3JvbGxUb3AgLSBjbGllbnRUb3A7XG4gICAgICAgIHZhciBsZWZ0ID0gYm94LmxlZnQgKyBzY3JvbGxMZWZ0IC0gY2xpZW50TGVmdDtcbiAgICAgICAgcmV0dXJuIHsgdG9wOiBNYXRoLnJvdW5kKHRvcCksIGxlZnQ6IE1hdGgucm91bmQobGVmdCkgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdHJhbnNmb3JtcyB0d28gcG9pbnRzIHRvIHRoZSBkZWdyZWUgaW4gYmV0d2VlblxuICAgICAqIEBwYXJhbSB4MVxuICAgICAqIEBwYXJhbSB5MVxuICAgICAqIEBwYXJhbSB4MlxuICAgICAqIEBwYXJhbSB5MlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0RGVncmVlOiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB2YXIgeCA9IHgxLXgyO1xuICAgICAgICB2YXIgeSA9IHkxLXkyO1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKC15LCB4KTtcbiAgICAgICAgaWYgKHRoZXRhIDwgMCkgdGhldGEgKz0gMiAqIE1hdGguUEk7XG4gICAgICAgIHJldHVybiB0aGV0YSAqIF90b0RlZztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTmVlZGVkIGZvciBzb21lIG9mZnNldHRpbmdcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRvcFRvdWNoT2Zmc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdG9wVG91Y2hPZmZzZXQ7XG4gICAgfVxuXG59OyIsIm1vZHVsZS5leHBvcnRzLlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiA9IHdpbmRvdy5SVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcblx0d2luZG93Lm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcbm1vZHVsZS5leHBvcnRzLlJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG5cdHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fCB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG5tb2R1bGUuZXhwb3J0cy5SVENJY2VDYW5kaWRhdGUgPSB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlIHx8XG5cdHdpbmRvdy5tb3pSVENJY2VDYW5kaWRhdGU7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcbnZhciBOZWdvdGlhdG9yID0gcmVxdWlyZSgnLi9uZWdvdGlhdG9yJyk7XG52YXIgUmVsaWFibGUgPSByZXF1aXJlKCdyZWxpYWJsZScpO1xuXG4vKipcbiAqIFdyYXBzIGEgRGF0YUNoYW5uZWwgYmV0d2VlbiB0d28gUGVlcnMuXG4gKi9cbmZ1bmN0aW9uIERhdGFDb25uZWN0aW9uKHBlZXIsIHByb3ZpZGVyLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEYXRhQ29ubmVjdGlvbikpIHJldHVybiBuZXcgRGF0YUNvbm5lY3Rpb24ocGVlciwgcHJvdmlkZXIsIG9wdGlvbnMpO1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICB0aGlzLm9wdGlvbnMgPSB1dGlsLmV4dGVuZCh7XG4gICAgc2VyaWFsaXphdGlvbjogJ2JpbmFyeScsXG4gICAgcmVsaWFibGU6IGZhbHNlXG4gIH0sIG9wdGlvbnMpO1xuXG4gIC8vIENvbm5lY3Rpb24gaXMgbm90IG9wZW4geWV0LlxuICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgdGhpcy50eXBlID0gJ2RhdGEnO1xuICB0aGlzLnBlZXIgPSBwZWVyO1xuICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXI7XG5cbiAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5jb25uZWN0aW9uSWQgfHwgRGF0YUNvbm5lY3Rpb24uX2lkUHJlZml4ICsgdXRpbC5yYW5kb21Ub2tlbigpO1xuXG4gIHRoaXMubGFiZWwgPSB0aGlzLm9wdGlvbnMubGFiZWwgfHwgdGhpcy5pZDtcbiAgdGhpcy5tZXRhZGF0YSA9IHRoaXMub3B0aW9ucy5tZXRhZGF0YTtcbiAgdGhpcy5zZXJpYWxpemF0aW9uID0gdGhpcy5vcHRpb25zLnNlcmlhbGl6YXRpb247XG4gIHRoaXMucmVsaWFibGUgPSB0aGlzLm9wdGlvbnMucmVsaWFibGU7XG5cbiAgLy8gRGF0YSBjaGFubmVsIGJ1ZmZlcmluZy5cbiAgdGhpcy5fYnVmZmVyID0gW107XG4gIHRoaXMuX2J1ZmZlcmluZyA9IGZhbHNlO1xuICB0aGlzLmJ1ZmZlclNpemUgPSAwO1xuXG4gIC8vIEZvciBzdG9yaW5nIGxhcmdlIGRhdGEuXG4gIHRoaXMuX2NodW5rZWREYXRhID0ge307XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5fcGF5bG9hZCkge1xuICAgIHRoaXMuX3BlZXJCcm93c2VyID0gdGhpcy5vcHRpb25zLl9wYXlsb2FkLmJyb3dzZXI7XG4gIH1cblxuICBOZWdvdGlhdG9yLnN0YXJ0Q29ubmVjdGlvbihcbiAgICB0aGlzLFxuICAgIHRoaXMub3B0aW9ucy5fcGF5bG9hZCB8fCB7XG4gICAgICBvcmlnaW5hdG9yOiB0cnVlXG4gICAgfVxuICApO1xufVxuXG51dGlsLmluaGVyaXRzKERhdGFDb25uZWN0aW9uLCBFdmVudEVtaXR0ZXIpO1xuXG5EYXRhQ29ubmVjdGlvbi5faWRQcmVmaXggPSAnZGNfJztcblxuLyoqIENhbGxlZCBieSB0aGUgTmVnb3RpYXRvciB3aGVuIHRoZSBEYXRhQ2hhbm5lbCBpcyByZWFkeS4gKi9cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oZGMpIHtcbiAgdGhpcy5fZGMgPSB0aGlzLmRhdGFDaGFubmVsID0gZGM7XG4gIHRoaXMuX2NvbmZpZ3VyZURhdGFDaGFubmVsKCk7XG59XG5cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5fY29uZmlndXJlRGF0YUNoYW5uZWwgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAodXRpbC5zdXBwb3J0cy5zY3RwKSB7XG4gICAgdGhpcy5fZGMuYmluYXJ5VHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gIH1cbiAgdGhpcy5fZGMub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5sb2coJ0RhdGEgY2hhbm5lbCBjb25uZWN0aW9uIHN1Y2Nlc3MnKTtcbiAgICBzZWxmLm9wZW4gPSB0cnVlO1xuICAgIHNlbGYuZW1pdCgnb3BlbicpO1xuICB9XG5cbiAgLy8gVXNlIHRoZSBSZWxpYWJsZSBzaGltIGZvciBub24gRmlyZWZveCBicm93c2Vyc1xuICBpZiAoIXV0aWwuc3VwcG9ydHMuc2N0cCAmJiB0aGlzLnJlbGlhYmxlKSB7XG4gICAgdGhpcy5fcmVsaWFibGUgPSBuZXcgUmVsaWFibGUodGhpcy5fZGMsIHV0aWwuZGVidWcpO1xuICB9XG5cbiAgaWYgKHRoaXMuX3JlbGlhYmxlKSB7XG4gICAgdGhpcy5fcmVsaWFibGUub25tZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBzZWxmLmVtaXQoJ2RhdGEnLCBtc2cpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZGMub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgc2VsZi5faGFuZGxlRGF0YU1lc3NhZ2UoZSk7XG4gICAgfTtcbiAgfVxuICB0aGlzLl9kYy5vbmNsb3NlID0gZnVuY3Rpb24oZSkge1xuICAgIHV0aWwubG9nKCdEYXRhQ2hhbm5lbCBjbG9zZWQgZm9yOicsIHNlbGYucGVlcik7XG4gICAgc2VsZi5jbG9zZSgpO1xuICB9O1xufVxuXG4vLyBIYW5kbGVzIGEgRGF0YUNoYW5uZWwgbWVzc2FnZS5cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5faGFuZGxlRGF0YU1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRhdGEgPSBlLmRhdGE7XG4gIHZhciBkYXRhdHlwZSA9IGRhdGEuY29uc3RydWN0b3I7XG4gIGlmICh0aGlzLnNlcmlhbGl6YXRpb24gPT09ICdiaW5hcnknIHx8IHRoaXMuc2VyaWFsaXphdGlvbiA9PT0gJ2JpbmFyeS11dGY4Jykge1xuICAgIGlmIChkYXRhdHlwZSA9PT0gQmxvYikge1xuICAgICAgLy8gRGF0YXR5cGUgc2hvdWxkIG5ldmVyIGJlIGJsb2JcbiAgICAgIHV0aWwuYmxvYlRvQXJyYXlCdWZmZXIoZGF0YSwgZnVuY3Rpb24oYWIpIHtcbiAgICAgICAgZGF0YSA9IHV0aWwudW5wYWNrKGFiKTtcbiAgICAgICAgc2VsZi5lbWl0KCdkYXRhJywgZGF0YSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGRhdGF0eXBlID09PSBBcnJheUJ1ZmZlcikge1xuICAgICAgZGF0YSA9IHV0aWwudW5wYWNrKGRhdGEpO1xuICAgIH0gZWxzZSBpZiAoZGF0YXR5cGUgPT09IFN0cmluZykge1xuICAgICAgLy8gU3RyaW5nIGZhbGxiYWNrIGZvciBiaW5hcnkgZGF0YSBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IGJpbmFyeSB5ZXRcbiAgICAgIHZhciBhYiA9IHV0aWwuYmluYXJ5U3RyaW5nVG9BcnJheUJ1ZmZlcihkYXRhKTtcbiAgICAgIGRhdGEgPSB1dGlsLnVucGFjayhhYik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMuc2VyaWFsaXphdGlvbiA9PT0gJ2pzb24nKSB7XG4gICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gIH1cblxuICAvLyBDaGVjayBpZiB3ZSd2ZSBjaHVua2VkLS1pZiBzbywgcGllY2UgdGhpbmdzIGJhY2sgdG9nZXRoZXIuXG4gIC8vIFdlJ3JlIGd1YXJhbnRlZWQgdGhhdCB0aGlzIGlzbid0IDAuXG4gIGlmIChkYXRhLl9fcGVlckRhdGEpIHtcbiAgICB2YXIgaWQgPSBkYXRhLl9fcGVlckRhdGE7XG4gICAgdmFyIGNodW5rSW5mbyA9IHRoaXMuX2NodW5rZWREYXRhW2lkXSB8fCB7ZGF0YTogW10sIGNvdW50OiAwLCB0b3RhbDogZGF0YS50b3RhbH07XG5cbiAgICBjaHVua0luZm8uZGF0YVtkYXRhLm5dID0gZGF0YS5kYXRhO1xuICAgIGNodW5rSW5mby5jb3VudCArPSAxO1xuXG4gICAgaWYgKGNodW5rSW5mby50b3RhbCA9PT0gY2h1bmtJbmZvLmNvdW50KSB7XG4gICAgICAvLyBDbGVhbiB1cCBiZWZvcmUgbWFraW5nIHRoZSByZWN1cnNpdmUgY2FsbCB0byBgX2hhbmRsZURhdGFNZXNzYWdlYC5cbiAgICAgIGRlbGV0ZSB0aGlzLl9jaHVua2VkRGF0YVtpZF07XG5cbiAgICAgIC8vIFdlJ3ZlIHJlY2VpdmVkIGFsbCB0aGUgY2h1bmtzLS10aW1lIHRvIGNvbnN0cnVjdCB0aGUgY29tcGxldGUgZGF0YS5cbiAgICAgIGRhdGEgPSBuZXcgQmxvYihjaHVua0luZm8uZGF0YSk7XG4gICAgICB0aGlzLl9oYW5kbGVEYXRhTWVzc2FnZSh7ZGF0YTogZGF0YX0pO1xuICAgIH1cblxuICAgIHRoaXMuX2NodW5rZWREYXRhW2lkXSA9IGNodW5rSW5mbztcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVtaXQoJ2RhdGEnLCBkYXRhKTtcbn1cblxuLyoqXG4gKiBFeHBvc2VkIGZ1bmN0aW9uYWxpdHkgZm9yIHVzZXJzLlxuICovXG5cbi8qKiBBbGxvd3MgdXNlciB0byBjbG9zZSBjb25uZWN0aW9uLiAqL1xuRGF0YUNvbm5lY3Rpb24ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5vcGVuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMub3BlbiA9IGZhbHNlO1xuICBOZWdvdGlhdG9yLmNsZWFudXAodGhpcyk7XG4gIHRoaXMuZW1pdCgnY2xvc2UnKTtcbn1cblxuLyoqIEFsbG93cyB1c2VyIHRvIHNlbmQgZGF0YS4gKi9cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oZGF0YSwgY2h1bmtlZCkge1xuICBpZiAoIXRoaXMub3Blbikge1xuICAgIHRoaXMuZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ0Nvbm5lY3Rpb24gaXMgbm90IG9wZW4uIFlvdSBzaG91bGQgbGlzdGVuIGZvciB0aGUgYG9wZW5gIGV2ZW50IGJlZm9yZSBzZW5kaW5nIG1lc3NhZ2VzLicpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHRoaXMuX3JlbGlhYmxlKSB7XG4gICAgLy8gTm90ZTogcmVsaWFibGUgc2hpbSBzZW5kaW5nIHdpbGwgbWFrZSBpdCBzbyB0aGF0IHlvdSBjYW5ub3QgY3VzdG9taXplXG4gICAgLy8gc2VyaWFsaXphdGlvbi5cbiAgICB0aGlzLl9yZWxpYWJsZS5zZW5kKGRhdGEpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmICh0aGlzLnNlcmlhbGl6YXRpb24gPT09ICdqc29uJykge1xuICAgIHRoaXMuX2J1ZmZlcmVkU2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gIH0gZWxzZSBpZiAodGhpcy5zZXJpYWxpemF0aW9uID09PSAnYmluYXJ5JyB8fCB0aGlzLnNlcmlhbGl6YXRpb24gPT09ICdiaW5hcnktdXRmOCcpIHtcbiAgICB2YXIgYmxvYiA9IHV0aWwucGFjayhkYXRhKTtcblxuICAgIC8vIEZvciBDaHJvbWUtRmlyZWZveCBpbnRlcm9wZXJhYmlsaXR5LCB3ZSBuZWVkIHRvIG1ha2UgRmlyZWZveCBcImNodW5rXCJcbiAgICAvLyB0aGUgZGF0YSBpdCBzZW5kcyBvdXQuXG4gICAgdmFyIG5lZWRzQ2h1bmtpbmcgPSB1dGlsLmNodW5rZWRCcm93c2Vyc1t0aGlzLl9wZWVyQnJvd3Nlcl0gfHwgdXRpbC5jaHVua2VkQnJvd3NlcnNbdXRpbC5icm93c2VyXTtcbiAgICBpZiAobmVlZHNDaHVua2luZyAmJiAhY2h1bmtlZCAmJiBibG9iLnNpemUgPiB1dGlsLmNodW5rZWRNVFUpIHtcbiAgICAgIHRoaXMuX3NlbmRDaHVua3MoYmxvYik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRGF0YUNoYW5uZWwgY3VycmVudGx5IG9ubHkgc3VwcG9ydHMgc3RyaW5ncy5cbiAgICBpZiAoIXV0aWwuc3VwcG9ydHMuc2N0cCkge1xuICAgICAgdXRpbC5ibG9iVG9CaW5hcnlTdHJpbmcoYmxvYiwgZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHNlbGYuX2J1ZmZlcmVkU2VuZChzdHIpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghdXRpbC5zdXBwb3J0cy5iaW5hcnlCbG9iKSB7XG4gICAgICAvLyBXZSBvbmx5IGRvIHRoaXMgaWYgd2UgcmVhbGx5IG5lZWQgdG8gKGUuZy4gYmxvYnMgYXJlIG5vdCBzdXBwb3J0ZWQpLFxuICAgICAgLy8gYmVjYXVzZSB0aGlzIGNvbnZlcnNpb24gaXMgY29zdGx5LlxuICAgICAgdXRpbC5ibG9iVG9BcnJheUJ1ZmZlcihibG9iLCBmdW5jdGlvbihhYikge1xuICAgICAgICBzZWxmLl9idWZmZXJlZFNlbmQoYWIpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2J1ZmZlcmVkU2VuZChibG9iKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fYnVmZmVyZWRTZW5kKGRhdGEpO1xuICB9XG59XG5cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5fYnVmZmVyZWRTZW5kID0gZnVuY3Rpb24obXNnKSB7XG4gIGlmICh0aGlzLl9idWZmZXJpbmcgfHwgIXRoaXMuX3RyeVNlbmQobXNnKSkge1xuICAgIHRoaXMuX2J1ZmZlci5wdXNoKG1zZyk7XG4gICAgdGhpcy5idWZmZXJTaXplID0gdGhpcy5fYnVmZmVyLmxlbmd0aDtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIHNlbmQgc3VjY2VlZHMuXG5EYXRhQ29ubmVjdGlvbi5wcm90b3R5cGUuX3RyeVNlbmQgPSBmdW5jdGlvbihtc2cpIHtcbiAgdHJ5IHtcbiAgICB0aGlzLl9kYy5zZW5kKG1zZyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aGlzLl9idWZmZXJpbmcgPSB0cnVlO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUcnkgYWdhaW4uXG4gICAgICBzZWxmLl9idWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgIHNlbGYuX3RyeUJ1ZmZlcigpO1xuICAgIH0sIDEwMCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBUcnkgdG8gc2VuZCB0aGUgZmlyc3QgbWVzc2FnZSBpbiB0aGUgYnVmZmVyLlxuRGF0YUNvbm5lY3Rpb24ucHJvdG90eXBlLl90cnlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX2J1ZmZlci5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbXNnID0gdGhpcy5fYnVmZmVyWzBdO1xuXG4gIGlmICh0aGlzLl90cnlTZW5kKG1zZykpIHtcbiAgICB0aGlzLl9idWZmZXIuc2hpZnQoKTtcbiAgICB0aGlzLmJ1ZmZlclNpemUgPSB0aGlzLl9idWZmZXIubGVuZ3RoO1xuICAgIHRoaXMuX3RyeUJ1ZmZlcigpO1xuICB9XG59XG5cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5fc2VuZENodW5rcyA9IGZ1bmN0aW9uKGJsb2IpIHtcbiAgdmFyIGJsb2JzID0gdXRpbC5jaHVuayhibG9iKTtcbiAgZm9yICh2YXIgaSA9IDAsIGlpID0gYmxvYnMubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMSkge1xuICAgIHZhciBibG9iID0gYmxvYnNbaV07XG4gICAgdGhpcy5zZW5kKGJsb2IsIHRydWUpO1xuICB9XG59XG5cbkRhdGFDb25uZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICB2YXIgcGF5bG9hZCA9IG1lc3NhZ2UucGF5bG9hZDtcblxuICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgIGNhc2UgJ0FOU1dFUic6XG4gICAgICB0aGlzLl9wZWVyQnJvd3NlciA9IHBheWxvYWQuYnJvd3NlcjtcblxuICAgICAgLy8gRm9yd2FyZCB0byBuZWdvdGlhdG9yXG4gICAgICBOZWdvdGlhdG9yLmhhbmRsZVNEUChtZXNzYWdlLnR5cGUsIHRoaXMsIHBheWxvYWQuc2RwKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0NBTkRJREFURSc6XG4gICAgICBOZWdvdGlhdG9yLmhhbmRsZUNhbmRpZGF0ZSh0aGlzLCBwYXlsb2FkLmNhbmRpZGF0ZSk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdXRpbC53YXJuKCdVbnJlY29nbml6ZWQgbWVzc2FnZSB0eXBlOicsIG1lc3NhZ2UudHlwZSwgJ2Zyb20gcGVlcjonLCB0aGlzLnBlZXIpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhQ29ubmVjdGlvbjtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xudmFyIE5lZ290aWF0b3IgPSByZXF1aXJlKCcuL25lZ290aWF0b3InKTtcblxuLyoqXG4gKiBXcmFwcyB0aGUgc3RyZWFtaW5nIGludGVyZmFjZSBiZXR3ZWVuIHR3byBQZWVycy5cbiAqL1xuZnVuY3Rpb24gTWVkaWFDb25uZWN0aW9uKHBlZXIsIHByb3ZpZGVyLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNZWRpYUNvbm5lY3Rpb24pKSByZXR1cm4gbmV3IE1lZGlhQ29ubmVjdGlvbihwZWVyLCBwcm92aWRlciwgb3B0aW9ucyk7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHRoaXMub3B0aW9ucyA9IHV0aWwuZXh0ZW5kKHt9LCBvcHRpb25zKTtcblxuICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgdGhpcy50eXBlID0gJ21lZGlhJztcbiAgdGhpcy5wZWVyID0gcGVlcjtcbiAgdGhpcy5wcm92aWRlciA9IHByb3ZpZGVyO1xuICB0aGlzLm1ldGFkYXRhID0gdGhpcy5vcHRpb25zLm1ldGFkYXRhO1xuICB0aGlzLmxvY2FsU3RyZWFtID0gdGhpcy5vcHRpb25zLl9zdHJlYW07XG5cbiAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5jb25uZWN0aW9uSWQgfHwgTWVkaWFDb25uZWN0aW9uLl9pZFByZWZpeCArIHV0aWwucmFuZG9tVG9rZW4oKTtcbiAgaWYgKHRoaXMubG9jYWxTdHJlYW0pIHtcbiAgICBOZWdvdGlhdG9yLnN0YXJ0Q29ubmVjdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICB7X3N0cmVhbTogdGhpcy5sb2NhbFN0cmVhbSwgb3JpZ2luYXRvcjogdHJ1ZX1cbiAgICApO1xuICB9XG59O1xuXG51dGlsLmluaGVyaXRzKE1lZGlhQ29ubmVjdGlvbiwgRXZlbnRFbWl0dGVyKTtcblxuTWVkaWFDb25uZWN0aW9uLl9pZFByZWZpeCA9ICdtY18nO1xuXG5NZWRpYUNvbm5lY3Rpb24ucHJvdG90eXBlLmFkZFN0cmVhbSA9IGZ1bmN0aW9uKHJlbW90ZVN0cmVhbSkge1xuICB1dGlsLmxvZygnUmVjZWl2aW5nIHN0cmVhbScsIHJlbW90ZVN0cmVhbSk7XG5cbiAgdGhpcy5yZW1vdGVTdHJlYW0gPSByZW1vdGVTdHJlYW07XG4gIHRoaXMuZW1pdCgnc3RyZWFtJywgcmVtb3RlU3RyZWFtKTsgLy8gU2hvdWxkIHdlIGNhbGwgdGhpcyBgb3BlbmA/XG5cbn07XG5cbk1lZGlhQ29ubmVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgdmFyIHBheWxvYWQgPSBtZXNzYWdlLnBheWxvYWQ7XG5cbiAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICBjYXNlICdBTlNXRVInOlxuICAgICAgLy8gRm9yd2FyZCB0byBuZWdvdGlhdG9yXG4gICAgICBOZWdvdGlhdG9yLmhhbmRsZVNEUChtZXNzYWdlLnR5cGUsIHRoaXMsIHBheWxvYWQuc2RwKTtcbiAgICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdDQU5ESURBVEUnOlxuICAgICAgTmVnb3RpYXRvci5oYW5kbGVDYW5kaWRhdGUodGhpcywgcGF5bG9hZC5jYW5kaWRhdGUpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHV0aWwud2FybignVW5yZWNvZ25pemVkIG1lc3NhZ2UgdHlwZTonLCBtZXNzYWdlLnR5cGUsICdmcm9tIHBlZXI6JywgdGhpcy5wZWVyKTtcbiAgICAgIGJyZWFrO1xuICB9XG59XG5cbk1lZGlhQ29ubmVjdGlvbi5wcm90b3R5cGUuYW5zd2VyID0gZnVuY3Rpb24oc3RyZWFtKSB7XG4gIGlmICh0aGlzLmxvY2FsU3RyZWFtKSB7XG4gICAgdXRpbC53YXJuKCdMb2NhbCBzdHJlYW0gYWxyZWFkeSBleGlzdHMgb24gdGhpcyBNZWRpYUNvbm5lY3Rpb24uIEFyZSB5b3UgYW5zd2VyaW5nIGEgY2FsbCB0d2ljZT8nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLm9wdGlvbnMuX3BheWxvYWQuX3N0cmVhbSA9IHN0cmVhbTtcblxuICB0aGlzLmxvY2FsU3RyZWFtID0gc3RyZWFtO1xuICBOZWdvdGlhdG9yLnN0YXJ0Q29ubmVjdGlvbihcbiAgICB0aGlzLFxuICAgIHRoaXMub3B0aW9ucy5fcGF5bG9hZFxuICApXG4gIC8vIFJldHJpZXZlIGxvc3QgbWVzc2FnZXMgc3RvcmVkIGJlY2F1c2UgUGVlckNvbm5lY3Rpb24gbm90IHNldCB1cC5cbiAgdmFyIG1lc3NhZ2VzID0gdGhpcy5wcm92aWRlci5fZ2V0TWVzc2FnZXModGhpcy5pZCk7XG4gIGZvciAodmFyIGkgPSAwLCBpaSA9IG1lc3NhZ2VzLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICB0aGlzLmhhbmRsZU1lc3NhZ2UobWVzc2FnZXNbaV0pO1xuICB9XG4gIHRoaXMub3BlbiA9IHRydWU7XG59O1xuXG4vKipcbiAqIEV4cG9zZWQgZnVuY3Rpb25hbGl0eSBmb3IgdXNlcnMuXG4gKi9cblxuLyoqIEFsbG93cyB1c2VyIHRvIGNsb3NlIGNvbm5lY3Rpb24uICovXG5NZWRpYUNvbm5lY3Rpb24ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5vcGVuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMub3BlbiA9IGZhbHNlO1xuICBOZWdvdGlhdG9yLmNsZWFudXAodGhpcyk7XG4gIHRoaXMuZW1pdCgnY2xvc2UnKVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZWRpYUNvbm5lY3Rpb247XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIFJUQ1BlZXJDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9hZGFwdGVyJykuUlRDUGVlckNvbm5lY3Rpb247XG52YXIgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gcmVxdWlyZSgnLi9hZGFwdGVyJykuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uO1xudmFyIFJUQ0ljZUNhbmRpZGF0ZSA9IHJlcXVpcmUoJy4vYWRhcHRlcicpLlJUQ0ljZUNhbmRpZGF0ZTtcblxuLyoqXG4gKiBNYW5hZ2VzIGFsbCBuZWdvdGlhdGlvbnMgYmV0d2VlbiBQZWVycy5cbiAqL1xudmFyIE5lZ290aWF0b3IgPSB7XG4gIHBjczoge1xuICAgIGRhdGE6IHt9LFxuICAgIG1lZGlhOiB7fVxuICB9LCAvLyB0eXBlID0+IHtwZWVySWQ6IHtwY19pZDogcGN9fS5cbiAgLy9wcm92aWRlcnM6IHt9LCAvLyBwcm92aWRlcidzIGlkID0+IHByb3ZpZGVycyAodGhlcmUgbWF5IGJlIG11bHRpcGxlIHByb3ZpZGVycy9jbGllbnQuXG4gIHF1ZXVlOiBbXSAvLyBjb25uZWN0aW9ucyB0aGF0IGFyZSBkZWxheWVkIGR1ZSB0byBhIFBDIGJlaW5nIGluIHVzZS5cbn1cblxuTmVnb3RpYXRvci5faWRQcmVmaXggPSAncGNfJztcblxuLyoqIFJldHVybnMgYSBQZWVyQ29ubmVjdGlvbiBvYmplY3Qgc2V0IHVwIGNvcnJlY3RseSAoZm9yIGRhdGEsIG1lZGlhKS4gKi9cbk5lZ290aWF0b3Iuc3RhcnRDb25uZWN0aW9uID0gZnVuY3Rpb24oY29ubmVjdGlvbiwgb3B0aW9ucykge1xuICB2YXIgcGMgPSBOZWdvdGlhdG9yLl9nZXRQZWVyQ29ubmVjdGlvbihjb25uZWN0aW9uLCBvcHRpb25zKTtcblxuICBpZiAoY29ubmVjdGlvbi50eXBlID09PSAnbWVkaWEnICYmIG9wdGlvbnMuX3N0cmVhbSkge1xuICAgIC8vIEFkZCB0aGUgc3RyZWFtLlxuICAgIHBjLmFkZFN0cmVhbShvcHRpb25zLl9zdHJlYW0pO1xuICB9XG5cbiAgLy8gU2V0IHRoZSBjb25uZWN0aW9uJ3MgUEMuXG4gIGNvbm5lY3Rpb24ucGMgPSBjb25uZWN0aW9uLnBlZXJDb25uZWN0aW9uID0gcGM7XG4gIC8vIFdoYXQgZG8gd2UgbmVlZCB0byBkbyBub3c/XG4gIGlmIChvcHRpb25zLm9yaWdpbmF0b3IpIHtcbiAgICBpZiAoY29ubmVjdGlvbi50eXBlID09PSAnZGF0YScpIHtcbiAgICAgIC8vIENyZWF0ZSB0aGUgZGF0YWNoYW5uZWwuXG4gICAgICB2YXIgY29uZmlnID0ge307XG4gICAgICAvLyBEcm9wcGluZyByZWxpYWJsZTpmYWxzZSBzdXBwb3J0LCBzaW5jZSBpdCBzZWVtcyB0byBiZSBjcmFzaGluZ1xuICAgICAgLy8gQ2hyb21lLlxuICAgICAgLyppZiAodXRpbC5zdXBwb3J0cy5zY3RwICYmICFvcHRpb25zLnJlbGlhYmxlKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgY2Fub25pY2FsIHJlbGlhYmxlIHN1cHBvcnQuLi5cbiAgICAgICAgY29uZmlnID0ge21heFJldHJhbnNtaXRzOiAwfTtcbiAgICAgIH0qL1xuICAgICAgLy8gRmFsbGJhY2sgdG8gZW5zdXJlIG9sZGVyIGJyb3dzZXJzIGRvbid0IGNyYXNoLlxuICAgICAgaWYgKCF1dGlsLnN1cHBvcnRzLnNjdHApIHtcbiAgICAgICAgY29uZmlnID0ge3JlbGlhYmxlOiBvcHRpb25zLnJlbGlhYmxlfTtcbiAgICAgIH1cbiAgICAgIHZhciBkYyA9IHBjLmNyZWF0ZURhdGFDaGFubmVsKGNvbm5lY3Rpb24ubGFiZWwsIGNvbmZpZyk7XG4gICAgICBjb25uZWN0aW9uLmluaXRpYWxpemUoZGMpO1xuICAgIH1cblxuICAgIGlmICghdXRpbC5zdXBwb3J0cy5vbm5lZ290aWF0aW9ubmVlZGVkKSB7XG4gICAgICBOZWdvdGlhdG9yLl9tYWtlT2ZmZXIoY29ubmVjdGlvbik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIE5lZ290aWF0b3IuaGFuZGxlU0RQKCdPRkZFUicsIGNvbm5lY3Rpb24sIG9wdGlvbnMuc2RwKTtcbiAgfVxufVxuXG5OZWdvdGlhdG9yLl9nZXRQZWVyQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24sIG9wdGlvbnMpIHtcbiAgaWYgKCFOZWdvdGlhdG9yLnBjc1tjb25uZWN0aW9uLnR5cGVdKSB7XG4gICAgdXRpbC5lcnJvcihjb25uZWN0aW9uLnR5cGUgKyAnIGlzIG5vdCBhIHZhbGlkIGNvbm5lY3Rpb24gdHlwZS4gTWF5YmUgeW91IG92ZXJyb2RlIHRoZSBgdHlwZWAgcHJvcGVydHkgc29tZXdoZXJlLicpO1xuICB9XG5cbiAgaWYgKCFOZWdvdGlhdG9yLnBjc1tjb25uZWN0aW9uLnR5cGVdW2Nvbm5lY3Rpb24ucGVlcl0pIHtcbiAgICBOZWdvdGlhdG9yLnBjc1tjb25uZWN0aW9uLnR5cGVdW2Nvbm5lY3Rpb24ucGVlcl0gPSB7fTtcbiAgfVxuICB2YXIgcGVlckNvbm5lY3Rpb25zID0gTmVnb3RpYXRvci5wY3NbY29ubmVjdGlvbi50eXBlXVtjb25uZWN0aW9uLnBlZXJdO1xuXG4gIHZhciBwYztcbiAgLy8gTm90IG11bHRpcGxleGluZyB3aGlsZSBGRiBhbmQgQ2hyb21lIGhhdmUgbm90LWdyZWF0IHN1cHBvcnQgZm9yIGl0LlxuICAvKmlmIChvcHRpb25zLm11bHRpcGxleCkge1xuICAgIGlkcyA9IE9iamVjdC5rZXlzKHBlZXJDb25uZWN0aW9ucyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gaWRzLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICAgIHBjID0gcGVlckNvbm5lY3Rpb25zW2lkc1tpXV07XG4gICAgICBpZiAocGMuc2lnbmFsaW5nU3RhdGUgPT09ICdzdGFibGUnKSB7XG4gICAgICAgIGJyZWFrOyAvLyBXZSBjYW4gZ28gYWhlYWQgYW5kIHVzZSB0aGlzIFBDLlxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlICovXG4gIGlmIChvcHRpb25zLnBjKSB7IC8vIFNpbXBsZXN0IGNhc2U6IFBDIGlkIGFscmVhZHkgcHJvdmlkZWQgZm9yIHVzLlxuICAgIHBjID0gTmVnb3RpYXRvci5wY3NbY29ubmVjdGlvbi50eXBlXVtjb25uZWN0aW9uLnBlZXJdW29wdGlvbnMucGNdO1xuICB9XG5cbiAgaWYgKCFwYyB8fCBwYy5zaWduYWxpbmdTdGF0ZSAhPT0gJ3N0YWJsZScpIHtcbiAgICBwYyA9IE5lZ290aWF0b3IuX3N0YXJ0UGVlckNvbm5lY3Rpb24oY29ubmVjdGlvbik7XG4gIH1cbiAgcmV0dXJuIHBjO1xufVxuXG4vKlxuTmVnb3RpYXRvci5fYWRkUHJvdmlkZXIgPSBmdW5jdGlvbihwcm92aWRlcikge1xuICBpZiAoKCFwcm92aWRlci5pZCAmJiAhcHJvdmlkZXIuZGlzY29ubmVjdGVkKSB8fCAhcHJvdmlkZXIuc29ja2V0Lm9wZW4pIHtcbiAgICAvLyBXYWl0IGZvciBwcm92aWRlciB0byBvYnRhaW4gYW4gSUQuXG4gICAgcHJvdmlkZXIub24oJ29wZW4nLCBmdW5jdGlvbihpZCkge1xuICAgICAgTmVnb3RpYXRvci5fYWRkUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIE5lZ290aWF0b3IucHJvdmlkZXJzW3Byb3ZpZGVyLmlkXSA9IHByb3ZpZGVyO1xuICB9XG59Ki9cblxuXG4vKiogU3RhcnQgYSBQQy4gKi9cbk5lZ290aWF0b3IuX3N0YXJ0UGVlckNvbm5lY3Rpb24gPSBmdW5jdGlvbihjb25uZWN0aW9uKSB7XG4gIHV0aWwubG9nKCdDcmVhdGluZyBSVENQZWVyQ29ubmVjdGlvbi4nKTtcblxuICB2YXIgaWQgPSBOZWdvdGlhdG9yLl9pZFByZWZpeCArIHV0aWwucmFuZG9tVG9rZW4oKTtcbiAgdmFyIG9wdGlvbmFsID0ge307XG5cbiAgaWYgKGNvbm5lY3Rpb24udHlwZSA9PT0gJ2RhdGEnICYmICF1dGlsLnN1cHBvcnRzLnNjdHApIHtcbiAgICBvcHRpb25hbCA9IHtvcHRpb25hbDogW3tSdHBEYXRhQ2hhbm5lbHM6IHRydWV9XX07XG4gIH0gZWxzZSBpZiAoY29ubmVjdGlvbi50eXBlID09PSAnbWVkaWEnKSB7XG4gICAgLy8gSW50ZXJvcCByZXEgZm9yIGNocm9tZS5cbiAgICBvcHRpb25hbCA9IHtvcHRpb25hbDogW3tEdGxzU3J0cEtleUFncmVlbWVudDogdHJ1ZX1dfTtcbiAgfVxuXG4gIHZhciBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihjb25uZWN0aW9uLnByb3ZpZGVyLm9wdGlvbnMuY29uZmlnLCBvcHRpb25hbCk7XG4gIE5lZ290aWF0b3IucGNzW2Nvbm5lY3Rpb24udHlwZV1bY29ubmVjdGlvbi5wZWVyXVtpZF0gPSBwYztcblxuICBOZWdvdGlhdG9yLl9zZXR1cExpc3RlbmVycyhjb25uZWN0aW9uLCBwYywgaWQpO1xuXG4gIHJldHVybiBwYztcbn1cblxuLyoqIFNldCB1cCB2YXJpb3VzIFdlYlJUQyBsaXN0ZW5lcnMuICovXG5OZWdvdGlhdG9yLl9zZXR1cExpc3RlbmVycyA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24sIHBjLCBwY19pZCkge1xuICB2YXIgcGVlcklkID0gY29ubmVjdGlvbi5wZWVyO1xuICB2YXIgY29ubmVjdGlvbklkID0gY29ubmVjdGlvbi5pZDtcbiAgdmFyIHByb3ZpZGVyID0gY29ubmVjdGlvbi5wcm92aWRlcjtcblxuICAvLyBJQ0UgQ0FORElEQVRFUy5cbiAgdXRpbC5sb2coJ0xpc3RlbmluZyBmb3IgSUNFIGNhbmRpZGF0ZXMuJyk7XG4gIHBjLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgaWYgKGV2dC5jYW5kaWRhdGUpIHtcbiAgICAgIHV0aWwubG9nKCdSZWNlaXZlZCBJQ0UgY2FuZGlkYXRlcyBmb3I6JywgY29ubmVjdGlvbi5wZWVyKTtcbiAgICAgIHByb3ZpZGVyLnNvY2tldC5zZW5kKHtcbiAgICAgICAgdHlwZTogJ0NBTkRJREFURScsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBjYW5kaWRhdGU6IGV2dC5jYW5kaWRhdGUsXG4gICAgICAgICAgdHlwZTogY29ubmVjdGlvbi50eXBlLFxuICAgICAgICAgIGNvbm5lY3Rpb25JZDogY29ubmVjdGlvbi5pZFxuICAgICAgICB9LFxuICAgICAgICBkc3Q6IHBlZXJJZFxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgc3dpdGNoIChwYy5pY2VDb25uZWN0aW9uU3RhdGUpIHtcbiAgICAgIGNhc2UgJ2Rpc2Nvbm5lY3RlZCc6XG4gICAgICBjYXNlICdmYWlsZWQnOlxuICAgICAgICB1dGlsLmxvZygnaWNlQ29ubmVjdGlvblN0YXRlIGlzIGRpc2Nvbm5lY3RlZCwgY2xvc2luZyBjb25uZWN0aW9ucyB0byAnICsgcGVlcklkKTtcbiAgICAgICAgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbXBsZXRlZCc6XG4gICAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gdXRpbC5ub29wO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH07XG5cbiAgLy8gRmFsbGJhY2sgZm9yIG9sZGVyIENocm9tZSBpbXBscy5cbiAgcGMub25pY2VjaGFuZ2UgPSBwYy5vbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZTtcblxuICAvLyBPTk5FR09USUFUSU9OTkVFREVEIChDaHJvbWUpXG4gIHV0aWwubG9nKCdMaXN0ZW5pbmcgZm9yIGBuZWdvdGlhdGlvbm5lZWRlZGAnKTtcbiAgcGMub25uZWdvdGlhdGlvbm5lZWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwubG9nKCdgbmVnb3RpYXRpb25uZWVkZWRgIHRyaWdnZXJlZCcpO1xuICAgIGlmIChwYy5zaWduYWxpbmdTdGF0ZSA9PSAnc3RhYmxlJykge1xuICAgICAgTmVnb3RpYXRvci5fbWFrZU9mZmVyKGNvbm5lY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB1dGlsLmxvZygnb25uZWdvdGlhdGlvbm5lZWRlZCB0cmlnZ2VyZWQgd2hlbiBub3Qgc3RhYmxlLiBJcyBhbm90aGVyIGNvbm5lY3Rpb24gYmVpbmcgZXN0YWJsaXNoZWQ/Jyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIERBVEFDT05ORUNUSU9OLlxuICB1dGlsLmxvZygnTGlzdGVuaW5nIGZvciBkYXRhIGNoYW5uZWwnKTtcbiAgLy8gRmlyZWQgYmV0d2VlbiBvZmZlciBhbmQgYW5zd2VyLCBzbyBvcHRpb25zIHNob3VsZCBhbHJlYWR5IGJlIHNhdmVkXG4gIC8vIGluIHRoZSBvcHRpb25zIGhhc2guXG4gIHBjLm9uZGF0YWNoYW5uZWwgPSBmdW5jdGlvbihldnQpIHtcbiAgICB1dGlsLmxvZygnUmVjZWl2ZWQgZGF0YSBjaGFubmVsJyk7XG4gICAgdmFyIGRjID0gZXZ0LmNoYW5uZWw7XG4gICAgdmFyIGNvbm5lY3Rpb24gPSBwcm92aWRlci5nZXRDb25uZWN0aW9uKHBlZXJJZCwgY29ubmVjdGlvbklkKTtcbiAgICBjb25uZWN0aW9uLmluaXRpYWxpemUoZGMpO1xuICB9O1xuXG4gIC8vIE1FRElBQ09OTkVDVElPTi5cbiAgdXRpbC5sb2coJ0xpc3RlbmluZyBmb3IgcmVtb3RlIHN0cmVhbScpO1xuICBwYy5vbmFkZHN0cmVhbSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgIHV0aWwubG9nKCdSZWNlaXZlZCByZW1vdGUgc3RyZWFtJyk7XG4gICAgdmFyIHN0cmVhbSA9IGV2dC5zdHJlYW07XG4gICAgdmFyIGNvbm5lY3Rpb24gPSBwcm92aWRlci5nZXRDb25uZWN0aW9uKHBlZXJJZCwgY29ubmVjdGlvbklkKTtcbiAgICAvLyAxMC8xMC8yMDE0OiBsb29rcyBsaWtlIGluIENocm9tZSAzOCwgb25hZGRzdHJlYW0gaXMgdHJpZ2dlcmVkIGFmdGVyXG4gICAgLy8gc2V0dGluZyB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uLiBPdXIgY29ubmVjdGlvbiBvYmplY3QgaW4gdGhlc2UgY2FzZXNcbiAgICAvLyBpcyBhY3R1YWxseSBhIERBVEEgY29ubmVjdGlvbiwgc28gYWRkU3RyZWFtIGZhaWxzLlxuICAgIC8vIFRPRE86IFRoaXMgaXMgaG9wZWZ1bGx5IGp1c3QgYSB0ZW1wb3JhcnkgZml4LiBXZSBzaG91bGQgdHJ5IHRvXG4gICAgLy8gdW5kZXJzdGFuZCB3aHkgdGhpcyBpcyBoYXBwZW5pbmcuXG4gICAgaWYgKGNvbm5lY3Rpb24udHlwZSA9PT0gJ21lZGlhJykge1xuICAgICAgY29ubmVjdGlvbi5hZGRTdHJlYW0oc3RyZWFtKTtcbiAgICB9XG4gIH07XG59XG5cbk5lZ290aWF0b3IuY2xlYW51cCA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgdXRpbC5sb2coJ0NsZWFuaW5nIHVwIFBlZXJDb25uZWN0aW9uIHRvICcgKyBjb25uZWN0aW9uLnBlZXIpO1xuXG4gIHZhciBwYyA9IGNvbm5lY3Rpb24ucGM7XG5cbiAgaWYgKCEhcGMgJiYgKHBjLnJlYWR5U3RhdGUgIT09ICdjbG9zZWQnIHx8IHBjLnNpZ25hbGluZ1N0YXRlICE9PSAnY2xvc2VkJykpIHtcbiAgICBwYy5jbG9zZSgpO1xuICAgIGNvbm5lY3Rpb24ucGMgPSBudWxsO1xuICB9XG59XG5cbk5lZ290aWF0b3IuX21ha2VPZmZlciA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgdmFyIHBjID0gY29ubmVjdGlvbi5wYztcbiAgcGMuY3JlYXRlT2ZmZXIoZnVuY3Rpb24ob2ZmZXIpIHtcbiAgICB1dGlsLmxvZygnQ3JlYXRlZCBvZmZlci4nKTtcblxuICAgIGlmICghdXRpbC5zdXBwb3J0cy5zY3RwICYmIGNvbm5lY3Rpb24udHlwZSA9PT0gJ2RhdGEnICYmIGNvbm5lY3Rpb24ucmVsaWFibGUpIHtcbiAgICAgIG9mZmVyLnNkcCA9IFJlbGlhYmxlLmhpZ2hlckJhbmR3aWR0aFNEUChvZmZlci5zZHApO1xuICAgIH1cblxuICAgIHBjLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIsIGZ1bmN0aW9uKCkge1xuICAgICAgdXRpbC5sb2coJ1NldCBsb2NhbERlc2NyaXB0aW9uOiBvZmZlcicsICdmb3I6JywgY29ubmVjdGlvbi5wZWVyKTtcbiAgICAgIGNvbm5lY3Rpb24ucHJvdmlkZXIuc29ja2V0LnNlbmQoe1xuICAgICAgICB0eXBlOiAnT0ZGRVInLFxuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgc2RwOiBvZmZlcixcbiAgICAgICAgICB0eXBlOiBjb25uZWN0aW9uLnR5cGUsXG4gICAgICAgICAgbGFiZWw6IGNvbm5lY3Rpb24ubGFiZWwsXG4gICAgICAgICAgY29ubmVjdGlvbklkOiBjb25uZWN0aW9uLmlkLFxuICAgICAgICAgIHJlbGlhYmxlOiBjb25uZWN0aW9uLnJlbGlhYmxlLFxuICAgICAgICAgIHNlcmlhbGl6YXRpb246IGNvbm5lY3Rpb24uc2VyaWFsaXphdGlvbixcbiAgICAgICAgICBtZXRhZGF0YTogY29ubmVjdGlvbi5tZXRhZGF0YSxcbiAgICAgICAgICBicm93c2VyOiB1dGlsLmJyb3dzZXJcbiAgICAgICAgfSxcbiAgICAgICAgZHN0OiBjb25uZWN0aW9uLnBlZXJcbiAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgY29ubmVjdGlvbi5wcm92aWRlci5lbWl0RXJyb3IoJ3dlYnJ0YycsIGVycik7XG4gICAgICB1dGlsLmxvZygnRmFpbGVkIHRvIHNldExvY2FsRGVzY3JpcHRpb24sICcsIGVycik7XG4gICAgfSk7XG4gIH0sIGZ1bmN0aW9uKGVycikge1xuICAgIGNvbm5lY3Rpb24ucHJvdmlkZXIuZW1pdEVycm9yKCd3ZWJydGMnLCBlcnIpO1xuICAgIHV0aWwubG9nKCdGYWlsZWQgdG8gY3JlYXRlT2ZmZXIsICcsIGVycik7XG4gIH0sIGNvbm5lY3Rpb24ub3B0aW9ucy5jb25zdHJhaW50cyk7XG59XG5cbk5lZ290aWF0b3IuX21ha2VBbnN3ZXIgPSBmdW5jdGlvbihjb25uZWN0aW9uKSB7XG4gIHZhciBwYyA9IGNvbm5lY3Rpb24ucGM7XG5cbiAgcGMuY3JlYXRlQW5zd2VyKGZ1bmN0aW9uKGFuc3dlcikge1xuICAgIHV0aWwubG9nKCdDcmVhdGVkIGFuc3dlci4nKTtcblxuICAgIGlmICghdXRpbC5zdXBwb3J0cy5zY3RwICYmIGNvbm5lY3Rpb24udHlwZSA9PT0gJ2RhdGEnICYmIGNvbm5lY3Rpb24ucmVsaWFibGUpIHtcbiAgICAgIGFuc3dlci5zZHAgPSBSZWxpYWJsZS5oaWdoZXJCYW5kd2lkdGhTRFAoYW5zd2VyLnNkcCk7XG4gICAgfVxuXG4gICAgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihhbnN3ZXIsIGZ1bmN0aW9uKCkge1xuICAgICAgdXRpbC5sb2coJ1NldCBsb2NhbERlc2NyaXB0aW9uOiBhbnN3ZXInLCAnZm9yOicsIGNvbm5lY3Rpb24ucGVlcik7XG4gICAgICBjb25uZWN0aW9uLnByb3ZpZGVyLnNvY2tldC5zZW5kKHtcbiAgICAgICAgdHlwZTogJ0FOU1dFUicsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBzZHA6IGFuc3dlcixcbiAgICAgICAgICB0eXBlOiBjb25uZWN0aW9uLnR5cGUsXG4gICAgICAgICAgY29ubmVjdGlvbklkOiBjb25uZWN0aW9uLmlkLFxuICAgICAgICAgIGJyb3dzZXI6IHV0aWwuYnJvd3NlclxuICAgICAgICB9LFxuICAgICAgICBkc3Q6IGNvbm5lY3Rpb24ucGVlclxuICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25uZWN0aW9uLnByb3ZpZGVyLmVtaXRFcnJvcignd2VicnRjJywgZXJyKTtcbiAgICAgIHV0aWwubG9nKCdGYWlsZWQgdG8gc2V0TG9jYWxEZXNjcmlwdGlvbiwgJywgZXJyKTtcbiAgICB9KTtcbiAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgY29ubmVjdGlvbi5wcm92aWRlci5lbWl0RXJyb3IoJ3dlYnJ0YycsIGVycik7XG4gICAgdXRpbC5sb2coJ0ZhaWxlZCB0byBjcmVhdGUgYW5zd2VyLCAnLCBlcnIpO1xuICB9KTtcbn1cblxuLyoqIEhhbmRsZSBhbiBTRFAuICovXG5OZWdvdGlhdG9yLmhhbmRsZVNEUCA9IGZ1bmN0aW9uKHR5cGUsIGNvbm5lY3Rpb24sIHNkcCkge1xuICBzZHAgPSBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XG4gIHZhciBwYyA9IGNvbm5lY3Rpb24ucGM7XG5cbiAgdXRpbC5sb2coJ1NldHRpbmcgcmVtb3RlIGRlc2NyaXB0aW9uJywgc2RwKTtcbiAgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24oc2RwLCBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmxvZygnU2V0IHJlbW90ZURlc2NyaXB0aW9uOicsIHR5cGUsICdmb3I6JywgY29ubmVjdGlvbi5wZWVyKTtcblxuICAgIGlmICh0eXBlID09PSAnT0ZGRVInKSB7XG4gICAgICBOZWdvdGlhdG9yLl9tYWtlQW5zd2VyKGNvbm5lY3Rpb24pO1xuICAgIH1cbiAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgY29ubmVjdGlvbi5wcm92aWRlci5lbWl0RXJyb3IoJ3dlYnJ0YycsIGVycik7XG4gICAgdXRpbC5sb2coJ0ZhaWxlZCB0byBzZXRSZW1vdGVEZXNjcmlwdGlvbiwgJywgZXJyKTtcbiAgfSk7XG59XG5cbi8qKiBIYW5kbGUgYSBjYW5kaWRhdGUuICovXG5OZWdvdGlhdG9yLmhhbmRsZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24sIGljZSkge1xuICB2YXIgY2FuZGlkYXRlID0gaWNlLmNhbmRpZGF0ZTtcbiAgdmFyIHNkcE1MaW5lSW5kZXggPSBpY2Uuc2RwTUxpbmVJbmRleDtcbiAgY29ubmVjdGlvbi5wYy5hZGRJY2VDYW5kaWRhdGUobmV3IFJUQ0ljZUNhbmRpZGF0ZSh7XG4gICAgc2RwTUxpbmVJbmRleDogc2RwTUxpbmVJbmRleCxcbiAgICBjYW5kaWRhdGU6IGNhbmRpZGF0ZVxuICB9KSk7XG4gIHV0aWwubG9nKCdBZGRlZCBJQ0UgY2FuZGlkYXRlIGZvcjonLCBjb25uZWN0aW9uLnBlZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5lZ290aWF0b3I7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcbnZhciBTb2NrZXQgPSByZXF1aXJlKCcuL3NvY2tldCcpO1xudmFyIE1lZGlhQ29ubmVjdGlvbiA9IHJlcXVpcmUoJy4vbWVkaWFjb25uZWN0aW9uJyk7XG52YXIgRGF0YUNvbm5lY3Rpb24gPSByZXF1aXJlKCcuL2RhdGFjb25uZWN0aW9uJyk7XG5cbi8qKlxuICogQSBwZWVyIHdobyBjYW4gaW5pdGlhdGUgY29ubmVjdGlvbnMgd2l0aCBvdGhlciBwZWVycy5cbiAqL1xuZnVuY3Rpb24gUGVlcihpZCwgb3B0aW9ucykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUGVlcikpIHJldHVybiBuZXcgUGVlcihpZCwgb3B0aW9ucyk7XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIC8vIERlYWwgd2l0aCBvdmVybG9hZGluZ1xuICBpZiAoaWQgJiYgaWQuY29uc3RydWN0b3IgPT0gT2JqZWN0KSB7XG4gICAgb3B0aW9ucyA9IGlkO1xuICAgIGlkID0gdW5kZWZpbmVkO1xuICB9IGVsc2UgaWYgKGlkKSB7XG4gICAgLy8gRW5zdXJlIGlkIGlzIGEgc3RyaW5nXG4gICAgaWQgPSBpZC50b1N0cmluZygpO1xuICB9XG4gIC8vXG5cbiAgLy8gQ29uZmlndXJpemUgb3B0aW9uc1xuICBvcHRpb25zID0gdXRpbC5leHRlbmQoe1xuICAgIGRlYnVnOiAwLCAvLyAxOiBFcnJvcnMsIDI6IFdhcm5pbmdzLCAzOiBBbGwgbG9nc1xuICAgIGhvc3Q6IHV0aWwuQ0xPVURfSE9TVCxcbiAgICBwb3J0OiB1dGlsLkNMT1VEX1BPUlQsXG4gICAga2V5OiAncGVlcmpzJyxcbiAgICBwYXRoOiAnLycsXG4gICAgdG9rZW46IHV0aWwucmFuZG9tVG9rZW4oKSxcbiAgICBjb25maWc6IHV0aWwuZGVmYXVsdENvbmZpZ1xuICB9LCBvcHRpb25zKTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgLy8gRGV0ZWN0IHJlbGF0aXZlIFVSTCBob3N0LlxuICBpZiAob3B0aW9ucy5ob3N0ID09PSAnLycpIHtcbiAgICBvcHRpb25zLmhvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWU7XG4gIH1cbiAgLy8gU2V0IHBhdGggY29ycmVjdGx5LlxuICBpZiAob3B0aW9ucy5wYXRoWzBdICE9PSAnLycpIHtcbiAgICBvcHRpb25zLnBhdGggPSAnLycgKyBvcHRpb25zLnBhdGg7XG4gIH1cbiAgaWYgKG9wdGlvbnMucGF0aFtvcHRpb25zLnBhdGgubGVuZ3RoIC0gMV0gIT09ICcvJykge1xuICAgIG9wdGlvbnMucGF0aCArPSAnLyc7XG4gIH1cblxuICAvLyBTZXQgd2hldGhlciB3ZSB1c2UgU1NMIHRvIHNhbWUgYXMgY3VycmVudCBob3N0XG4gIGlmIChvcHRpb25zLnNlY3VyZSA9PT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuaG9zdCAhPT0gdXRpbC5DTE9VRF9IT1NUKSB7XG4gICAgb3B0aW9ucy5zZWN1cmUgPSB1dGlsLmlzU2VjdXJlKCk7XG4gIH1cbiAgLy8gU2V0IGEgY3VzdG9tIGxvZyBmdW5jdGlvbiBpZiBwcmVzZW50XG4gIGlmIChvcHRpb25zLmxvZ0Z1bmN0aW9uKSB7XG4gICAgdXRpbC5zZXRMb2dGdW5jdGlvbihvcHRpb25zLmxvZ0Z1bmN0aW9uKTtcbiAgfVxuICB1dGlsLnNldExvZ0xldmVsKG9wdGlvbnMuZGVidWcpO1xuICAvL1xuXG4gIC8vIFNhbml0eSBjaGVja3NcbiAgLy8gRW5zdXJlIFdlYlJUQyBzdXBwb3J0ZWRcbiAgaWYgKCF1dGlsLnN1cHBvcnRzLmF1ZGlvVmlkZW8gJiYgIXV0aWwuc3VwcG9ydHMuZGF0YSApIHtcbiAgICB0aGlzLl9kZWxheWVkQWJvcnQoJ2Jyb3dzZXItaW5jb21wYXRpYmxlJywgJ1RoZSBjdXJyZW50IGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBXZWJSVEMnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gRW5zdXJlIGFscGhhbnVtZXJpYyBpZFxuICBpZiAoIXV0aWwudmFsaWRhdGVJZChpZCkpIHtcbiAgICB0aGlzLl9kZWxheWVkQWJvcnQoJ2ludmFsaWQtaWQnLCAnSUQgXCInICsgaWQgKyAnXCIgaXMgaW52YWxpZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBFbnN1cmUgdmFsaWQga2V5XG4gIGlmICghdXRpbC52YWxpZGF0ZUtleShvcHRpb25zLmtleSkpIHtcbiAgICB0aGlzLl9kZWxheWVkQWJvcnQoJ2ludmFsaWQta2V5JywgJ0FQSSBLRVkgXCInICsgb3B0aW9ucy5rZXkgKyAnXCIgaXMgaW52YWxpZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBFbnN1cmUgbm90IHVzaW5nIHVuc2VjdXJlIGNsb3VkIHNlcnZlciBvbiBTU0wgcGFnZVxuICBpZiAob3B0aW9ucy5zZWN1cmUgJiYgb3B0aW9ucy5ob3N0ID09PSAnMC5wZWVyanMuY29tJykge1xuICAgIHRoaXMuX2RlbGF5ZWRBYm9ydCgnc3NsLXVuYXZhaWxhYmxlJyxcbiAgICAgICdUaGUgY2xvdWQgc2VydmVyIGN1cnJlbnRseSBkb2VzIG5vdCBzdXBwb3J0IEhUVFBTLiBQbGVhc2UgcnVuIHlvdXIgb3duIFBlZXJTZXJ2ZXIgdG8gdXNlIEhUVFBTLicpO1xuICAgIHJldHVybjtcbiAgfVxuICAvL1xuXG4gIC8vIFN0YXRlcy5cbiAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTsgLy8gQ29ubmVjdGlvbnMgaGF2ZSBiZWVuIGtpbGxlZFxuICB0aGlzLmRpc2Nvbm5lY3RlZCA9IGZhbHNlOyAvLyBDb25uZWN0aW9uIHRvIFBlZXJTZXJ2ZXIga2lsbGVkIGJ1dCBQMlAgY29ubmVjdGlvbnMgc3RpbGwgYWN0aXZlXG4gIHRoaXMub3BlbiA9IGZhbHNlOyAvLyBTb2NrZXRzIGFuZCBzdWNoIGFyZSBub3QgeWV0IG9wZW4uXG4gIC8vXG5cbiAgLy8gUmVmZXJlbmNlc1xuICB0aGlzLmNvbm5lY3Rpb25zID0ge307IC8vIERhdGFDb25uZWN0aW9ucyBmb3IgdGhpcyBwZWVyLlxuICB0aGlzLl9sb3N0TWVzc2FnZXMgPSB7fTsgLy8gc3JjID0+IFtsaXN0IG9mIG1lc3NhZ2VzXVxuICAvL1xuXG4gIC8vIFN0YXJ0IHRoZSBzZXJ2ZXIgY29ubmVjdGlvblxuICB0aGlzLl9pbml0aWFsaXplU2VydmVyQ29ubmVjdGlvbigpO1xuICBpZiAoaWQpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplKGlkKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9yZXRyaWV2ZUlkKCk7XG4gIH1cbiAgLy9cbn1cblxudXRpbC5pbmhlcml0cyhQZWVyLCBFdmVudEVtaXR0ZXIpO1xuXG4vLyBJbml0aWFsaXplIHRoZSAnc29ja2V0JyAod2hpY2ggaXMgYWN0dWFsbHkgYSBtaXggb2YgWEhSIHN0cmVhbWluZyBhbmRcbi8vIHdlYnNvY2tldHMuKVxuUGVlci5wcm90b3R5cGUuX2luaXRpYWxpemVTZXJ2ZXJDb25uZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5zb2NrZXQgPSBuZXcgU29ja2V0KHRoaXMub3B0aW9ucy5zZWN1cmUsIHRoaXMub3B0aW9ucy5ob3N0LCB0aGlzLm9wdGlvbnMucG9ydCwgdGhpcy5vcHRpb25zLnBhdGgsIHRoaXMub3B0aW9ucy5rZXkpO1xuICB0aGlzLnNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBzZWxmLl9oYW5kbGVNZXNzYWdlKGRhdGEpO1xuICB9KTtcbiAgdGhpcy5zb2NrZXQub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBzZWxmLl9hYm9ydCgnc29ja2V0LWVycm9yJywgZXJyb3IpO1xuICB9KTtcbiAgdGhpcy5zb2NrZXQub24oJ2Rpc2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKCkge1xuICAgIC8vIElmIHdlIGhhdmVuJ3QgZXhwbGljaXRseSBkaXNjb25uZWN0ZWQsIGVtaXQgZXJyb3IgYW5kIGRpc2Nvbm5lY3QuXG4gICAgaWYgKCFzZWxmLmRpc2Nvbm5lY3RlZCkge1xuICAgICAgc2VsZi5lbWl0RXJyb3IoJ25ldHdvcmsnLCAnTG9zdCBjb25uZWN0aW9uIHRvIHNlcnZlci4nKTtcbiAgICAgIHNlbGYuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgfSk7XG4gIHRoaXMuc29ja2V0Lm9uKCdjbG9zZScsIGZ1bmN0aW9uKCkge1xuICAgIC8vIElmIHdlIGhhdmVuJ3QgZXhwbGljaXRseSBkaXNjb25uZWN0ZWQsIGVtaXQgZXJyb3IuXG4gICAgaWYgKCFzZWxmLmRpc2Nvbm5lY3RlZCkge1xuICAgICAgc2VsZi5fYWJvcnQoJ3NvY2tldC1jbG9zZWQnLCAnVW5kZXJseWluZyBzb2NrZXQgaXMgYWxyZWFkeSBjbG9zZWQuJyk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKiBHZXQgYSB1bmlxdWUgSUQgZnJvbSB0aGUgc2VydmVyIHZpYSBYSFIuICovXG5QZWVyLnByb3RvdHlwZS5fcmV0cmlldmVJZCA9IGZ1bmN0aW9uKGNiKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgdmFyIHByb3RvY29sID0gdGhpcy5vcHRpb25zLnNlY3VyZSA/ICdodHRwczovLycgOiAnaHR0cDovLyc7XG4gIHZhciB1cmwgPSBwcm90b2NvbCArIHRoaXMub3B0aW9ucy5ob3N0ICsgJzonICsgdGhpcy5vcHRpb25zLnBvcnQgK1xuICAgIHRoaXMub3B0aW9ucy5wYXRoICsgdGhpcy5vcHRpb25zLmtleSArICcvaWQnO1xuICB2YXIgcXVlcnlTdHJpbmcgPSAnP3RzPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSArICcnICsgTWF0aC5yYW5kb20oKTtcbiAgdXJsICs9IHF1ZXJ5U3RyaW5nO1xuXG4gIC8vIElmIHRoZXJlJ3Mgbm8gSUQgd2UgbmVlZCB0byB3YWl0IGZvciBvbmUgYmVmb3JlIHRyeWluZyB0byBpbml0IHNvY2tldC5cbiAgaHR0cC5vcGVuKCdnZXQnLCB1cmwsIHRydWUpO1xuICBodHRwLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgdXRpbC5lcnJvcignRXJyb3IgcmV0cmlldmluZyBJRCcsIGUpO1xuICAgIHZhciBwYXRoRXJyb3IgPSAnJztcbiAgICBpZiAoc2VsZi5vcHRpb25zLnBhdGggPT09ICcvJyAmJiBzZWxmLm9wdGlvbnMuaG9zdCAhPT0gdXRpbC5DTE9VRF9IT1NUKSB7XG4gICAgICBwYXRoRXJyb3IgPSAnIElmIHlvdSBwYXNzZWQgaW4gYSBgcGF0aGAgdG8geW91ciBzZWxmLWhvc3RlZCBQZWVyU2VydmVyLCAnICtcbiAgICAgICAgJ3lvdVxcJ2xsIGFsc28gbmVlZCB0byBwYXNzIGluIHRoYXQgc2FtZSBwYXRoIHdoZW4gY3JlYXRpbmcgYSBuZXcgJyArXG4gICAgICAgICdQZWVyLic7XG4gICAgfVxuICAgIHNlbGYuX2Fib3J0KCdzZXJ2ZXItZXJyb3InLCAnQ291bGQgbm90IGdldCBhbiBJRCBmcm9tIHRoZSBzZXJ2ZXIuJyArIHBhdGhFcnJvcik7XG4gIH07XG4gIGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKGh0dHAucmVhZHlTdGF0ZSAhPT0gNCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaHR0cC5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgaHR0cC5vbmVycm9yKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYuX2luaXRpYWxpemUoaHR0cC5yZXNwb25zZVRleHQpO1xuICB9O1xuICBodHRwLnNlbmQobnVsbCk7XG59O1xuXG4vKiogSW5pdGlhbGl6ZSBhIGNvbm5lY3Rpb24gd2l0aCB0aGUgc2VydmVyLiAqL1xuUGVlci5wcm90b3R5cGUuX2luaXRpYWxpemUgPSBmdW5jdGlvbihpZCkge1xuICB0aGlzLmlkID0gaWQ7XG4gIHRoaXMuc29ja2V0LnN0YXJ0KHRoaXMuaWQsIHRoaXMub3B0aW9ucy50b2tlbik7XG59O1xuXG4vKiogSGFuZGxlcyBtZXNzYWdlcyBmcm9tIHRoZSBzZXJ2ZXIuICovXG5QZWVyLnByb3RvdHlwZS5faGFuZGxlTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgdmFyIHR5cGUgPSBtZXNzYWdlLnR5cGU7XG4gIHZhciBwYXlsb2FkID0gbWVzc2FnZS5wYXlsb2FkO1xuICB2YXIgcGVlciA9IG1lc3NhZ2Uuc3JjO1xuICB2YXIgY29ubmVjdGlvbjtcblxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICdPUEVOJzogLy8gVGhlIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlciBpcyBvcGVuLlxuICAgICAgdGhpcy5lbWl0KCdvcGVuJywgdGhpcy5pZCk7XG4gICAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnRVJST1InOiAvLyBTZXJ2ZXIgZXJyb3IuXG4gICAgICB0aGlzLl9hYm9ydCgnc2VydmVyLWVycm9yJywgcGF5bG9hZC5tc2cpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnSUQtVEFLRU4nOiAvLyBUaGUgc2VsZWN0ZWQgSUQgaXMgdGFrZW4uXG4gICAgICB0aGlzLl9hYm9ydCgndW5hdmFpbGFibGUtaWQnLCAnSUQgYCcgKyB0aGlzLmlkICsgJ2AgaXMgdGFrZW4nKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0lOVkFMSUQtS0VZJzogLy8gVGhlIGdpdmVuIEFQSSBrZXkgY2Fubm90IGJlIGZvdW5kLlxuICAgICAgdGhpcy5fYWJvcnQoJ2ludmFsaWQta2V5JywgJ0FQSSBLRVkgXCInICsgdGhpcy5vcHRpb25zLmtleSArICdcIiBpcyBpbnZhbGlkJyk7XG4gICAgICBicmVhaztcblxuICAgIC8vXG4gICAgY2FzZSAnTEVBVkUnOiAvLyBBbm90aGVyIHBlZXIgaGFzIGNsb3NlZCBpdHMgY29ubmVjdGlvbiB0byB0aGlzIHBlZXIuXG4gICAgICB1dGlsLmxvZygnUmVjZWl2ZWQgbGVhdmUgbWVzc2FnZSBmcm9tJywgcGVlcik7XG4gICAgICB0aGlzLl9jbGVhbnVwUGVlcihwZWVyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnRVhQSVJFJzogLy8gVGhlIG9mZmVyIHNlbnQgdG8gYSBwZWVyIGhhcyBleHBpcmVkIHdpdGhvdXQgcmVzcG9uc2UuXG4gICAgICB0aGlzLmVtaXRFcnJvcigncGVlci11bmF2YWlsYWJsZScsICdDb3VsZCBub3QgY29ubmVjdCB0byBwZWVyICcgKyBwZWVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ09GRkVSJzogLy8gd2Ugc2hvdWxkIGNvbnNpZGVyIHN3aXRjaGluZyB0aGlzIHRvIENBTEwvQ09OTkVDVCwgYnV0IHRoaXMgaXMgdGhlIGxlYXN0IGJyZWFraW5nIG9wdGlvbi5cbiAgICAgIHZhciBjb25uZWN0aW9uSWQgPSBwYXlsb2FkLmNvbm5lY3Rpb25JZDtcbiAgICAgIGNvbm5lY3Rpb24gPSB0aGlzLmdldENvbm5lY3Rpb24ocGVlciwgY29ubmVjdGlvbklkKTtcblxuICAgICAgaWYgKGNvbm5lY3Rpb24pIHtcbiAgICAgICAgdXRpbC53YXJuKCdPZmZlciByZWNlaXZlZCBmb3IgZXhpc3RpbmcgQ29ubmVjdGlvbiBJRDonLCBjb25uZWN0aW9uSWQpO1xuICAgICAgICAvL2Nvbm5lY3Rpb24uaGFuZGxlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBjb25uZWN0aW9uLlxuICAgICAgICBpZiAocGF5bG9hZC50eXBlID09PSAnbWVkaWEnKSB7XG4gICAgICAgICAgY29ubmVjdGlvbiA9IG5ldyBNZWRpYUNvbm5lY3Rpb24ocGVlciwgdGhpcywge1xuICAgICAgICAgICAgY29ubmVjdGlvbklkOiBjb25uZWN0aW9uSWQsXG4gICAgICAgICAgICBfcGF5bG9hZDogcGF5bG9hZCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBwYXlsb2FkLm1ldGFkYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5fYWRkQ29ubmVjdGlvbihwZWVyLCBjb25uZWN0aW9uKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2NhbGwnLCBjb25uZWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXlsb2FkLnR5cGUgPT09ICdkYXRhJykge1xuICAgICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgRGF0YUNvbm5lY3Rpb24ocGVlciwgdGhpcywge1xuICAgICAgICAgICAgY29ubmVjdGlvbklkOiBjb25uZWN0aW9uSWQsXG4gICAgICAgICAgICBfcGF5bG9hZDogcGF5bG9hZCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBwYXlsb2FkLm1ldGFkYXRhLFxuICAgICAgICAgICAgbGFiZWw6IHBheWxvYWQubGFiZWwsXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uOiBwYXlsb2FkLnNlcmlhbGl6YXRpb24sXG4gICAgICAgICAgICByZWxpYWJsZTogcGF5bG9hZC5yZWxpYWJsZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuX2FkZENvbm5lY3Rpb24ocGVlciwgY29ubmVjdGlvbik7XG4gICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0aW9uJywgY29ubmVjdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXRpbC53YXJuKCdSZWNlaXZlZCBtYWxmb3JtZWQgY29ubmVjdGlvbiB0eXBlOicsIHBheWxvYWQudHlwZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZpbmQgbWVzc2FnZXMuXG4gICAgICAgIHZhciBtZXNzYWdlcyA9IHRoaXMuX2dldE1lc3NhZ2VzKGNvbm5lY3Rpb25JZCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG1lc3NhZ2VzLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICAgICAgICBjb25uZWN0aW9uLmhhbmRsZU1lc3NhZ2UobWVzc2FnZXNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKCFwYXlsb2FkKSB7XG4gICAgICAgIHV0aWwud2FybignWW91IHJlY2VpdmVkIGEgbWFsZm9ybWVkIG1lc3NhZ2UgZnJvbSAnICsgcGVlciArICcgb2YgdHlwZSAnICsgdHlwZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGlkID0gcGF5bG9hZC5jb25uZWN0aW9uSWQ7XG4gICAgICBjb25uZWN0aW9uID0gdGhpcy5nZXRDb25uZWN0aW9uKHBlZXIsIGlkKTtcblxuICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5wYykge1xuICAgICAgICAvLyBQYXNzIGl0IG9uLlxuICAgICAgICBjb25uZWN0aW9uLmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKGlkKSB7XG4gICAgICAgIC8vIFN0b3JlIGZvciBwb3NzaWJsZSBsYXRlciB1c2VcbiAgICAgICAgdGhpcy5fc3RvcmVNZXNzYWdlKGlkLCBtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwud2FybignWW91IHJlY2VpdmVkIGFuIHVucmVjb2duaXplZCBtZXNzYWdlOicsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8qKiBTdG9yZXMgbWVzc2FnZXMgd2l0aG91dCBhIHNldCB1cCBjb25uZWN0aW9uLCB0byBiZSBjbGFpbWVkIGxhdGVyLiAqL1xuUGVlci5wcm90b3R5cGUuX3N0b3JlTWVzc2FnZSA9IGZ1bmN0aW9uKGNvbm5lY3Rpb25JZCwgbWVzc2FnZSkge1xuICBpZiAoIXRoaXMuX2xvc3RNZXNzYWdlc1tjb25uZWN0aW9uSWRdKSB7XG4gICAgdGhpcy5fbG9zdE1lc3NhZ2VzW2Nvbm5lY3Rpb25JZF0gPSBbXTtcbiAgfVxuICB0aGlzLl9sb3N0TWVzc2FnZXNbY29ubmVjdGlvbklkXS5wdXNoKG1lc3NhZ2UpO1xufTtcblxuLyoqIFJldHJpZXZlIG1lc3NhZ2VzIGZyb20gbG9zdCBtZXNzYWdlIHN0b3JlICovXG5QZWVyLnByb3RvdHlwZS5fZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbihjb25uZWN0aW9uSWQpIHtcbiAgdmFyIG1lc3NhZ2VzID0gdGhpcy5fbG9zdE1lc3NhZ2VzW2Nvbm5lY3Rpb25JZF07XG4gIGlmIChtZXNzYWdlcykge1xuICAgIGRlbGV0ZSB0aGlzLl9sb3N0TWVzc2FnZXNbY29ubmVjdGlvbklkXTtcbiAgICByZXR1cm4gbWVzc2FnZXM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBEYXRhQ29ubmVjdGlvbiB0byB0aGUgc3BlY2lmaWVkIHBlZXIuIFNlZSBkb2N1bWVudGF0aW9uIGZvciBhXG4gKiBjb21wbGV0ZSBsaXN0IG9mIG9wdGlvbnMuXG4gKi9cblBlZXIucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbihwZWVyLCBvcHRpb25zKSB7XG4gIGlmICh0aGlzLmRpc2Nvbm5lY3RlZCkge1xuICAgIHV0aWwud2FybignWW91IGNhbm5vdCBjb25uZWN0IHRvIGEgbmV3IFBlZXIgYmVjYXVzZSB5b3UgY2FsbGVkICcgK1xuICAgICAgJy5kaXNjb25uZWN0KCkgb24gdGhpcyBQZWVyIGFuZCBlbmRlZCB5b3VyIGNvbm5lY3Rpb24gd2l0aCB0aGUgJyArXG4gICAgICAnc2VydmVyLiBZb3UgY2FuIGNyZWF0ZSBhIG5ldyBQZWVyIHRvIHJlY29ubmVjdCwgb3IgY2FsbCByZWNvbm5lY3QgJyArXG4gICAgICAnb24gdGhpcyBwZWVyIGlmIHlvdSBiZWxpZXZlIGl0cyBJRCB0byBzdGlsbCBiZSBhdmFpbGFibGUuJyk7XG4gICAgdGhpcy5lbWl0RXJyb3IoJ2Rpc2Nvbm5lY3RlZCcsICdDYW5ub3QgY29ubmVjdCB0byBuZXcgUGVlciBhZnRlciBkaXNjb25uZWN0aW5nIGZyb20gc2VydmVyLicpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgY29ubmVjdGlvbiA9IG5ldyBEYXRhQ29ubmVjdGlvbihwZWVyLCB0aGlzLCBvcHRpb25zKTtcbiAgdGhpcy5fYWRkQ29ubmVjdGlvbihwZWVyLCBjb25uZWN0aW9uKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb247XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBNZWRpYUNvbm5lY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBwZWVyLiBTZWUgZG9jdW1lbnRhdGlvbiBmb3IgYVxuICogY29tcGxldGUgbGlzdCBvZiBvcHRpb25zLlxuICovXG5QZWVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24ocGVlciwgc3RyZWFtLCBvcHRpb25zKSB7XG4gIGlmICh0aGlzLmRpc2Nvbm5lY3RlZCkge1xuICAgIHV0aWwud2FybignWW91IGNhbm5vdCBjb25uZWN0IHRvIGEgbmV3IFBlZXIgYmVjYXVzZSB5b3UgY2FsbGVkICcgK1xuICAgICAgJy5kaXNjb25uZWN0KCkgb24gdGhpcyBQZWVyIGFuZCBlbmRlZCB5b3VyIGNvbm5lY3Rpb24gd2l0aCB0aGUgJyArXG4gICAgICAnc2VydmVyLiBZb3UgY2FuIGNyZWF0ZSBhIG5ldyBQZWVyIHRvIHJlY29ubmVjdC4nKTtcbiAgICB0aGlzLmVtaXRFcnJvcignZGlzY29ubmVjdGVkJywgJ0Nhbm5vdCBjb25uZWN0IHRvIG5ldyBQZWVyIGFmdGVyIGRpc2Nvbm5lY3RpbmcgZnJvbSBzZXJ2ZXIuJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghc3RyZWFtKSB7XG4gICAgdXRpbC5lcnJvcignVG8gY2FsbCBhIHBlZXIsIHlvdSBtdXN0IHByb3ZpZGUgYSBzdHJlYW0gZnJvbSB5b3VyIGJyb3dzZXJcXCdzIGBnZXRVc2VyTWVkaWFgLicpO1xuICAgIHJldHVybjtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5fc3RyZWFtID0gc3RyZWFtO1xuICB2YXIgY2FsbCA9IG5ldyBNZWRpYUNvbm5lY3Rpb24ocGVlciwgdGhpcywgb3B0aW9ucyk7XG4gIHRoaXMuX2FkZENvbm5lY3Rpb24ocGVlciwgY2FsbCk7XG4gIHJldHVybiBjYWxsO1xufTtcblxuLyoqIEFkZCBhIGRhdGEvbWVkaWEgY29ubmVjdGlvbiB0byB0aGlzIHBlZXIuICovXG5QZWVyLnByb3RvdHlwZS5fYWRkQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKHBlZXIsIGNvbm5lY3Rpb24pIHtcbiAgaWYgKCF0aGlzLmNvbm5lY3Rpb25zW3BlZXJdKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uc1twZWVyXSA9IFtdO1xuICB9XG4gIHRoaXMuY29ubmVjdGlvbnNbcGVlcl0ucHVzaChjb25uZWN0aW9uKTtcbn07XG5cbi8qKiBSZXRyaWV2ZSBhIGRhdGEvbWVkaWEgY29ubmVjdGlvbiBmb3IgdGhpcyBwZWVyLiAqL1xuUGVlci5wcm90b3R5cGUuZ2V0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uKHBlZXIsIGlkKSB7XG4gIHZhciBjb25uZWN0aW9ucyA9IHRoaXMuY29ubmVjdGlvbnNbcGVlcl07XG4gIGlmICghY29ubmVjdGlvbnMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgaWkgPSBjb25uZWN0aW9ucy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgaWYgKGNvbm5lY3Rpb25zW2ldLmlkID09PSBpZCkge1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cblBlZXIucHJvdG90eXBlLl9kZWxheWVkQWJvcnQgPSBmdW5jdGlvbih0eXBlLCBtZXNzYWdlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdXRpbC5zZXRaZXJvVGltZW91dChmdW5jdGlvbigpe1xuICAgIHNlbGYuX2Fib3J0KHR5cGUsIG1lc3NhZ2UpO1xuICB9KTtcbn07XG5cbi8qKlxuICogRGVzdHJveXMgdGhlIFBlZXIgYW5kIGVtaXRzIGFuIGVycm9yIG1lc3NhZ2UuXG4gKiBUaGUgUGVlciBpcyBub3QgZGVzdHJveWVkIGlmIGl0J3MgaW4gYSBkaXNjb25uZWN0ZWQgc3RhdGUsIGluIHdoaWNoIGNhc2VcbiAqIGl0IHJldGFpbnMgaXRzIGRpc2Nvbm5lY3RlZCBzdGF0ZSBhbmQgaXRzIGV4aXN0aW5nIGNvbm5lY3Rpb25zLlxuICovXG5QZWVyLnByb3RvdHlwZS5fYWJvcnQgPSBmdW5jdGlvbih0eXBlLCBtZXNzYWdlKSB7XG4gIHV0aWwuZXJyb3IoJ0Fib3J0aW5nIScpO1xuICBpZiAoIXRoaXMuX2xhc3RTZXJ2ZXJJZCkge1xuICAgIHRoaXMuZGVzdHJveSgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICB9XG4gIHRoaXMuZW1pdEVycm9yKHR5cGUsIG1lc3NhZ2UpO1xufTtcblxuLyoqIEVtaXRzIGEgdHlwZWQgZXJyb3IgbWVzc2FnZS4gKi9cblBlZXIucHJvdG90eXBlLmVtaXRFcnJvciA9IGZ1bmN0aW9uKHR5cGUsIGVycikge1xuICB1dGlsLmVycm9yKCdFcnJvcjonLCBlcnIpO1xuICBpZiAodHlwZW9mIGVyciA9PT0gJ3N0cmluZycpIHtcbiAgICBlcnIgPSBuZXcgRXJyb3IoZXJyKTtcbiAgfVxuICBlcnIudHlwZSA9IHR5cGU7XG4gIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xufTtcblxuLyoqXG4gKiBEZXN0cm95cyB0aGUgUGVlcjogY2xvc2VzIGFsbCBhY3RpdmUgY29ubmVjdGlvbnMgYXMgd2VsbCBhcyB0aGUgY29ubmVjdGlvblxuICogIHRvIHRoZSBzZXJ2ZXIuXG4gKiBXYXJuaW5nOiBUaGUgcGVlciBjYW4gbm8gbG9uZ2VyIGNyZWF0ZSBvciBhY2NlcHQgY29ubmVjdGlvbnMgYWZ0ZXIgYmVpbmdcbiAqICBkZXN0cm95ZWQuXG4gKi9cblBlZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmRlc3Ryb3llZCkge1xuICAgIHRoaXMuX2NsZWFudXAoKTtcbiAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWU7XG4gIH1cbn07XG5cblxuLyoqIERpc2Nvbm5lY3RzIGV2ZXJ5IGNvbm5lY3Rpb24gb24gdGhpcyBwZWVyLiAqL1xuUGVlci5wcm90b3R5cGUuX2NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY29ubmVjdGlvbnMpIHtcbiAgICB2YXIgcGVlcnMgPSBPYmplY3Qua2V5cyh0aGlzLmNvbm5lY3Rpb25zKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwZWVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICB0aGlzLl9jbGVhbnVwUGVlcihwZWVyc1tpXSk7XG4gICAgfVxuICB9XG4gIHRoaXMuZW1pdCgnY2xvc2UnKTtcbn07XG5cbi8qKiBDbG9zZXMgYWxsIGNvbm5lY3Rpb25zIHRvIHRoaXMgcGVlci4gKi9cblBlZXIucHJvdG90eXBlLl9jbGVhbnVwUGVlciA9IGZ1bmN0aW9uKHBlZXIpIHtcbiAgdmFyIGNvbm5lY3Rpb25zID0gdGhpcy5jb25uZWN0aW9uc1twZWVyXTtcbiAgZm9yICh2YXIgaiA9IDAsIGpqID0gY29ubmVjdGlvbnMubGVuZ3RoOyBqIDwgamo7IGogKz0gMSkge1xuICAgIGNvbm5lY3Rpb25zW2pdLmNsb3NlKCk7XG4gIH1cbn07XG5cbi8qKlxuICogRGlzY29ubmVjdHMgdGhlIFBlZXIncyBjb25uZWN0aW9uIHRvIHRoZSBQZWVyU2VydmVyLiBEb2VzIG5vdCBjbG9zZSBhbnlcbiAqICBhY3RpdmUgY29ubmVjdGlvbnMuXG4gKiBXYXJuaW5nOiBUaGUgcGVlciBjYW4gbm8gbG9uZ2VyIGNyZWF0ZSBvciBhY2NlcHQgY29ubmVjdGlvbnMgYWZ0ZXIgYmVpbmdcbiAqICBkaXNjb25uZWN0ZWQuIEl0IGFsc28gY2Fubm90IHJlY29ubmVjdCB0byB0aGUgc2VydmVyLlxuICovXG5QZWVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdXRpbC5zZXRaZXJvVGltZW91dChmdW5jdGlvbigpe1xuICAgIGlmICghc2VsZi5kaXNjb25uZWN0ZWQpIHtcbiAgICAgIHNlbGYuZGlzY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xuICAgICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICAgIHNlbGYuc29ja2V0LmNsb3NlKCk7XG4gICAgICB9XG4gICAgICBzZWxmLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcsIHNlbGYuaWQpO1xuICAgICAgc2VsZi5fbGFzdFNlcnZlcklkID0gc2VsZi5pZDtcbiAgICAgIHNlbGYuaWQgPSBudWxsO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKiogQXR0ZW1wdHMgdG8gcmVjb25uZWN0IHdpdGggdGhlIHNhbWUgSUQuICovXG5QZWVyLnByb3RvdHlwZS5yZWNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlzY29ubmVjdGVkICYmICF0aGlzLmRlc3Ryb3llZCkge1xuICAgIHV0aWwubG9nKCdBdHRlbXB0aW5nIHJlY29ubmVjdGlvbiB0byBzZXJ2ZXIgd2l0aCBJRCAnICsgdGhpcy5fbGFzdFNlcnZlcklkKTtcbiAgICB0aGlzLmRpc2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2luaXRpYWxpemVTZXJ2ZXJDb25uZWN0aW9uKCk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZSh0aGlzLl9sYXN0U2VydmVySWQpO1xuICB9IGVsc2UgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIHBlZXIgY2Fubm90IHJlY29ubmVjdCB0byB0aGUgc2VydmVyLiBJdCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgfSBlbHNlIGlmICghdGhpcy5kaXNjb25uZWN0ZWQgJiYgIXRoaXMub3Blbikge1xuICAgIC8vIERvIG5vdGhpbmcuIFdlJ3JlIHN0aWxsIGNvbm5lY3RpbmcgdGhlIGZpcnN0IHRpbWUuXG4gICAgdXRpbC5lcnJvcignSW4gYSBodXJyeT8gV2VcXCdyZSBzdGlsbCB0cnlpbmcgdG8gbWFrZSB0aGUgaW5pdGlhbCBjb25uZWN0aW9uIScpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignUGVlciAnICsgdGhpcy5pZCArICcgY2Fubm90IHJlY29ubmVjdCBiZWNhdXNlIGl0IGlzIG5vdCBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgc2VydmVyIScpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBhIGxpc3Qgb2YgYXZhaWxhYmxlIHBlZXIgSURzLiBJZiB5b3UncmUgcnVubmluZyB5b3VyIG93biBzZXJ2ZXIsIHlvdSdsbFxuICogd2FudCB0byBzZXQgYWxsb3dfZGlzY292ZXJ5OiB0cnVlIGluIHRoZSBQZWVyU2VydmVyIG9wdGlvbnMuIElmIHlvdSdyZSB1c2luZ1xuICogdGhlIGNsb3VkIHNlcnZlciwgZW1haWwgdGVhbUBwZWVyanMuY29tIHRvIGdldCB0aGUgZnVuY3Rpb25hbGl0eSBlbmFibGVkIGZvclxuICogeW91ciBrZXkuXG4gKi9cblBlZXIucHJvdG90eXBlLmxpc3RBbGxQZWVycyA9IGZ1bmN0aW9uKGNiKSB7XG4gIGNiID0gY2IgfHwgZnVuY3Rpb24oKSB7fTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgaHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB2YXIgcHJvdG9jb2wgPSB0aGlzLm9wdGlvbnMuc2VjdXJlID8gJ2h0dHBzOi8vJyA6ICdodHRwOi8vJztcbiAgdmFyIHVybCA9IHByb3RvY29sICsgdGhpcy5vcHRpb25zLmhvc3QgKyAnOicgKyB0aGlzLm9wdGlvbnMucG9ydCArXG4gICAgdGhpcy5vcHRpb25zLnBhdGggKyB0aGlzLm9wdGlvbnMua2V5ICsgJy9wZWVycyc7XG4gIHZhciBxdWVyeVN0cmluZyA9ICc/dHM9JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgJycgKyBNYXRoLnJhbmRvbSgpO1xuICB1cmwgKz0gcXVlcnlTdHJpbmc7XG5cbiAgLy8gSWYgdGhlcmUncyBubyBJRCB3ZSBuZWVkIHRvIHdhaXQgZm9yIG9uZSBiZWZvcmUgdHJ5aW5nIHRvIGluaXQgc29ja2V0LlxuICBodHRwLm9wZW4oJ2dldCcsIHVybCwgdHJ1ZSk7XG4gIGh0dHAub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBzZWxmLl9hYm9ydCgnc2VydmVyLWVycm9yJywgJ0NvdWxkIG5vdCBnZXQgcGVlcnMgZnJvbSB0aGUgc2VydmVyLicpO1xuICAgIGNiKFtdKTtcbiAgfTtcbiAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoaHR0cC5yZWFkeVN0YXRlICE9PSA0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChodHRwLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICB2YXIgaGVscGZ1bEVycm9yID0gJyc7XG4gICAgICBpZiAoc2VsZi5vcHRpb25zLmhvc3QgIT09IHV0aWwuQ0xPVURfSE9TVCkge1xuICAgICAgICBoZWxwZnVsRXJyb3IgPSAnSXQgbG9va3MgbGlrZSB5b3VcXCdyZSB1c2luZyB0aGUgY2xvdWQgc2VydmVyLiBZb3UgY2FuIGVtYWlsICcgK1xuICAgICAgICAgICd0ZWFtQHBlZXJqcy5jb20gdG8gZW5hYmxlIHBlZXIgbGlzdGluZyBmb3IgeW91ciBBUEkga2V5Lic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWxwZnVsRXJyb3IgPSAnWW91IG5lZWQgdG8gZW5hYmxlIGBhbGxvd19kaXNjb3ZlcnlgIG9uIHlvdXIgc2VsZi1ob3N0ZWQgJyArXG4gICAgICAgICAgJ1BlZXJTZXJ2ZXIgdG8gdXNlIHRoaXMgZmVhdHVyZS4nO1xuICAgICAgfVxuICAgICAgY2IoW10pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJdCBkb2VzblxcJ3QgbG9vayBsaWtlIHlvdSBoYXZlIHBlcm1pc3Npb24gdG8gbGlzdCBwZWVycyBJRHMuICcgKyBoZWxwZnVsRXJyb3IpO1xuICAgIH0gZWxzZSBpZiAoaHR0cC5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgY2IoW10pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYihKU09OLnBhcnNlKGh0dHAucmVzcG9uc2VUZXh0KSk7XG4gICAgfVxuICB9O1xuICBodHRwLnNlbmQobnVsbCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBlZXI7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcblxuLyoqXG4gKiBBbiBhYnN0cmFjdGlvbiBvbiB0b3Agb2YgV2ViU29ja2V0cyBhbmQgWEhSIHN0cmVhbWluZyB0byBwcm92aWRlIGZhc3Rlc3RcbiAqIHBvc3NpYmxlIGNvbm5lY3Rpb24gZm9yIHBlZXJzLlxuICovXG5mdW5jdGlvbiBTb2NrZXQoc2VjdXJlLCBob3N0LCBwb3J0LCBwYXRoLCBrZXkpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNvY2tldCkpIHJldHVybiBuZXcgU29ja2V0KHNlY3VyZSwgaG9zdCwgcG9ydCwgcGF0aCwga2V5KTtcblxuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICAvLyBEaXNjb25uZWN0ZWQgbWFudWFsbHkuXG4gIHRoaXMuZGlzY29ubmVjdGVkID0gZmFsc2U7XG4gIHRoaXMuX3F1ZXVlID0gW107XG5cbiAgdmFyIGh0dHBQcm90b2NvbCA9IHNlY3VyZSA/ICdodHRwczovLycgOiAnaHR0cDovLyc7XG4gIHZhciB3c1Byb3RvY29sID0gc2VjdXJlID8gJ3dzczovLycgOiAnd3M6Ly8nO1xuICB0aGlzLl9odHRwVXJsID0gaHR0cFByb3RvY29sICsgaG9zdCArICc6JyArIHBvcnQgKyBwYXRoICsga2V5O1xuICB0aGlzLl93c1VybCA9IHdzUHJvdG9jb2wgKyBob3N0ICsgJzonICsgcG9ydCArIHBhdGggKyAncGVlcmpzP2tleT0nICsga2V5O1xufVxuXG51dGlsLmluaGVyaXRzKFNvY2tldCwgRXZlbnRFbWl0dGVyKTtcblxuXG4vKiogQ2hlY2sgaW4gd2l0aCBJRCBvciBnZXQgb25lIGZyb20gc2VydmVyLiAqL1xuU29ja2V0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGlkLCB0b2tlbikge1xuICB0aGlzLmlkID0gaWQ7XG5cbiAgdGhpcy5faHR0cFVybCArPSAnLycgKyBpZCArICcvJyArIHRva2VuO1xuICB0aGlzLl93c1VybCArPSAnJmlkPScgKyBpZCArICcmdG9rZW49JyArIHRva2VuO1xuXG4gIHRoaXMuX3N0YXJ0WGhyU3RyZWFtKCk7XG4gIHRoaXMuX3N0YXJ0V2ViU29ja2V0KCk7XG59XG5cblxuLyoqIFN0YXJ0IHVwIHdlYnNvY2tldCBjb21tdW5pY2F0aW9ucy4gKi9cblNvY2tldC5wcm90b3R5cGUuX3N0YXJ0V2ViU29ja2V0ID0gZnVuY3Rpb24oaWQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICh0aGlzLl9zb2NrZXQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9zb2NrZXQgPSBuZXcgV2ViU29ja2V0KHRoaXMuX3dzVXJsKTtcblxuICB0aGlzLl9zb2NrZXQub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgdXRpbC5sb2coJ0ludmFsaWQgc2VydmVyIG1lc3NhZ2UnLCBldmVudC5kYXRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi5lbWl0KCdtZXNzYWdlJywgZGF0YSk7XG4gIH07XG5cbiAgdGhpcy5fc29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHV0aWwubG9nKCdTb2NrZXQgY2xvc2VkLicpO1xuICAgIHNlbGYuZGlzY29ubmVjdGVkID0gdHJ1ZTtcbiAgICBzZWxmLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcpO1xuICB9O1xuXG4gIC8vIFRha2UgY2FyZSBvZiB0aGUgcXVldWUgb2YgY29ubmVjdGlvbnMgaWYgbmVjZXNzYXJ5IGFuZCBtYWtlIHN1cmUgUGVlciBrbm93c1xuICAvLyBzb2NrZXQgaXMgb3Blbi5cbiAgdGhpcy5fc29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLl90aW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2VsZi5fdGltZW91dCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYuX2h0dHAuYWJvcnQoKTtcbiAgICAgICAgc2VsZi5faHR0cCA9IG51bGw7XG4gICAgICB9LCA1MDAwKTtcbiAgICB9XG4gICAgc2VsZi5fc2VuZFF1ZXVlZE1lc3NhZ2VzKCk7XG4gICAgdXRpbC5sb2coJ1NvY2tldCBvcGVuJyk7XG4gIH07XG59XG5cbi8qKiBTdGFydCBYSFIgc3RyZWFtaW5nLiAqL1xuU29ja2V0LnByb3RvdHlwZS5fc3RhcnRYaHJTdHJlYW0gPSBmdW5jdGlvbihuKSB7XG4gIHRyeSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuX2h0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB0aGlzLl9odHRwLl9pbmRleCA9IDE7XG4gICAgdGhpcy5faHR0cC5fc3RyZWFtSW5kZXggPSBuIHx8IDA7XG4gICAgdGhpcy5faHR0cC5vcGVuKCdwb3N0JywgdGhpcy5faHR0cFVybCArICcvaWQ/aT0nICsgdGhpcy5faHR0cC5fc3RyZWFtSW5kZXgsIHRydWUpO1xuICAgIHRoaXMuX2h0dHAub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gSWYgd2UgZ2V0IGFuIGVycm9yLCBsaWtlbHkgc29tZXRoaW5nIHdlbnQgd3JvbmcuXG4gICAgICAvLyBTdG9wIHN0cmVhbWluZy5cbiAgICAgIGNsZWFyVGltZW91dChzZWxmLl90aW1lb3V0KTtcbiAgICAgIHNlbGYuZW1pdCgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuICAgIHRoaXMuX2h0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09IDIgJiYgdGhpcy5vbGQpIHtcbiAgICAgICAgdGhpcy5vbGQuYWJvcnQoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMub2xkO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnJlYWR5U3RhdGUgPiAyICYmIHRoaXMuc3RhdHVzID09PSAyMDAgJiYgdGhpcy5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgc2VsZi5faGFuZGxlU3RyZWFtKHRoaXMpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5faHR0cC5zZW5kKG51bGwpO1xuICAgIHRoaXMuX3NldEhUVFBUaW1lb3V0KCk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHV0aWwubG9nKCdYTUxIdHRwUmVxdWVzdCBub3QgYXZhaWxhYmxlOyBkZWZhdWx0aW5nIHRvIFdlYlNvY2tldHMnKTtcbiAgfVxufVxuXG5cbi8qKiBIYW5kbGVzIG9ucmVhZHlzdGF0ZWNoYW5nZSByZXNwb25zZSBhcyBhIHN0cmVhbS4gKi9cblNvY2tldC5wcm90b3R5cGUuX2hhbmRsZVN0cmVhbSA9IGZ1bmN0aW9uKGh0dHApIHtcbiAgLy8gMyBhbmQgNCBhcmUgbG9hZGluZy9kb25lIHN0YXRlLiBBbGwgb3RoZXJzIGFyZSBub3QgcmVsZXZhbnQuXG4gIHZhciBtZXNzYWdlcyA9IGh0dHAucmVzcG9uc2VUZXh0LnNwbGl0KCdcXG4nKTtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgYW55dGhpbmcgbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIG9uIGJ1ZmZlci5cbiAgaWYgKGh0dHAuX2J1ZmZlcikge1xuICAgIHdoaWxlIChodHRwLl9idWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGluZGV4ID0gaHR0cC5fYnVmZmVyLnNoaWZ0KCk7XG4gICAgICB2YXIgYnVmZmVyZWRNZXNzYWdlID0gbWVzc2FnZXNbaW5kZXhdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYnVmZmVyZWRNZXNzYWdlID0gSlNPTi5wYXJzZShidWZmZXJlZE1lc3NhZ2UpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGh0dHAuX2J1ZmZlci5zaGlmdChpbmRleCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5lbWl0KCdtZXNzYWdlJywgYnVmZmVyZWRNZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgbWVzc2FnZSA9IG1lc3NhZ2VzW2h0dHAuX2luZGV4XTtcbiAgaWYgKG1lc3NhZ2UpIHtcbiAgICBodHRwLl9pbmRleCArPSAxO1xuICAgIC8vIEJ1ZmZlcmluZy0tdGhpcyBtZXNzYWdlIGlzIGluY29tcGxldGUgYW5kIHdlJ2xsIGdldCB0byBpdCBuZXh0IHRpbWUuXG4gICAgLy8gVGhpcyBjaGVja3MgaWYgdGhlIGh0dHBSZXNwb25zZSBlbmRlZCBpbiBhIGBcXG5gLCBpbiB3aGljaCBjYXNlIHRoZSBsYXN0XG4gICAgLy8gZWxlbWVudCBvZiBtZXNzYWdlcyBzaG91bGQgYmUgdGhlIGVtcHR5IHN0cmluZy5cbiAgICBpZiAoaHR0cC5faW5kZXggPT09IG1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgaWYgKCFodHRwLl9idWZmZXIpIHtcbiAgICAgICAgaHR0cC5fYnVmZmVyID0gW107XG4gICAgICB9XG4gICAgICBodHRwLl9idWZmZXIucHVzaChodHRwLl9pbmRleCAtIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB1dGlsLmxvZygnSW52YWxpZCBzZXJ2ZXIgbWVzc2FnZScsIG1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmVtaXQoJ21lc3NhZ2UnLCBtZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cblxuU29ja2V0LnByb3RvdHlwZS5fc2V0SFRUUFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl90aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICB2YXIgb2xkID0gc2VsZi5faHR0cDtcbiAgICBpZiAoIXNlbGYuX3dzT3BlbigpKSB7XG4gICAgICBzZWxmLl9zdGFydFhoclN0cmVhbShvbGQuX3N0cmVhbUluZGV4ICsgMSk7XG4gICAgICBzZWxmLl9odHRwLm9sZCA9IG9sZDtcbiAgICB9IGVsc2Uge1xuICAgICAgb2xkLmFib3J0KCk7XG4gICAgfVxuICB9LCAyNTAwMCk7XG59XG5cbi8qKiBJcyB0aGUgd2Vic29ja2V0IGN1cnJlbnRseSBvcGVuPyAqL1xuU29ja2V0LnByb3RvdHlwZS5fd3NPcGVuID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9zb2NrZXQgJiYgdGhpcy5fc29ja2V0LnJlYWR5U3RhdGUgPT0gMTtcbn1cblxuLyoqIFNlbmQgcXVldWVkIG1lc3NhZ2VzLiAqL1xuU29ja2V0LnByb3RvdHlwZS5fc2VuZFF1ZXVlZE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuX3F1ZXVlLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICB0aGlzLnNlbmQodGhpcy5fcXVldWVbaV0pO1xuICB9XG59XG5cbi8qKiBFeHBvc2VkIHNlbmQgZm9yIERDICYgUGVlci4gKi9cblNvY2tldC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgaWYgKHRoaXMuZGlzY29ubmVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgd2UgZGlkbid0IGdldCBhbiBJRCB5ZXQsIHdlIGNhbid0IHlldCBzZW5kIGFueXRoaW5nIHNvIHdlIHNob3VsZCBxdWV1ZVxuICAvLyB1cCB0aGVzZSBtZXNzYWdlcy5cbiAgaWYgKCF0aGlzLmlkKSB7XG4gICAgdGhpcy5fcXVldWUucHVzaChkYXRhKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIWRhdGEudHlwZSkge1xuICAgIHRoaXMuZW1pdCgnZXJyb3InLCAnSW52YWxpZCBtZXNzYWdlJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgaWYgKHRoaXMuX3dzT3BlbigpKSB7XG4gICAgdGhpcy5fc29ja2V0LnNlbmQobWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgdXJsID0gdGhpcy5faHR0cFVybCArICcvJyArIGRhdGEudHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGh0dHAub3BlbigncG9zdCcsIHVybCwgdHJ1ZSk7XG4gICAgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgIGh0dHAuc2VuZChtZXNzYWdlKTtcbiAgfVxufVxuXG5Tb2NrZXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5kaXNjb25uZWN0ZWQgJiYgdGhpcy5fd3NPcGVuKCkpIHtcbiAgICB0aGlzLl9zb2NrZXQuY2xvc2UoKTtcbiAgICB0aGlzLmRpc2Nvbm5lY3RlZCA9IHRydWU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTb2NrZXQ7XG4iLCJ2YXIgZGVmYXVsdENvbmZpZyA9IHsnaWNlU2VydmVycyc6IFt7ICd1cmwnOiAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMicgfV19O1xudmFyIGRhdGFDb3VudCA9IDE7XG5cbnZhciBCaW5hcnlQYWNrID0gcmVxdWlyZSgnanMtYmluYXJ5cGFjaycpO1xudmFyIFJUQ1BlZXJDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9hZGFwdGVyJykuUlRDUGVlckNvbm5lY3Rpb247XG5cbnZhciB1dGlsID0ge1xuICBub29wOiBmdW5jdGlvbigpIHt9LFxuXG4gIENMT1VEX0hPU1Q6ICcwLnBlZXJqcy5jb20nLFxuICBDTE9VRF9QT1JUOiA5MDAwLFxuXG4gIC8vIEJyb3dzZXJzIHRoYXQgbmVlZCBjaHVua2luZzpcbiAgY2h1bmtlZEJyb3dzZXJzOiB7J0Nocm9tZSc6IDF9LFxuICBjaHVua2VkTVRVOiAxNjMwMCwgLy8gVGhlIG9yaWdpbmFsIDYwMDAwIGJ5dGVzIHNldHRpbmcgZG9lcyBub3Qgd29yayB3aGVuIHNlbmRpbmcgZGF0YSBmcm9tIEZpcmVmb3ggdG8gQ2hyb21lLCB3aGljaCBpcyBcImN1dCBvZmZcIiBhZnRlciAxNjM4NCBieXRlcyBhbmQgZGVsaXZlcmVkIGluZGl2aWR1YWxseS5cblxuICAvLyBMb2dnaW5nIGxvZ2ljXG4gIGxvZ0xldmVsOiAwLFxuICBzZXRMb2dMZXZlbDogZnVuY3Rpb24obGV2ZWwpIHtcbiAgICB2YXIgZGVidWdMZXZlbCA9IHBhcnNlSW50KGxldmVsLCAxMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZUludChsZXZlbCwgMTApKSkge1xuICAgICAgdXRpbC5sb2dMZXZlbCA9IGRlYnVnTGV2ZWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXkgYXJlIHVzaW5nIHRydXRoeS9mYWxzeSB2YWx1ZXMgZm9yIGRlYnVnXG4gICAgICB1dGlsLmxvZ0xldmVsID0gbGV2ZWwgPyAzIDogMDtcbiAgICB9XG4gICAgdXRpbC5sb2cgPSB1dGlsLndhcm4gPSB1dGlsLmVycm9yID0gdXRpbC5ub29wO1xuICAgIGlmICh1dGlsLmxvZ0xldmVsID4gMCkge1xuICAgICAgdXRpbC5lcnJvciA9IHV0aWwuX3ByaW50V2l0aCgnRVJST1InKTtcbiAgICB9XG4gICAgaWYgKHV0aWwubG9nTGV2ZWwgPiAxKSB7XG4gICAgICB1dGlsLndhcm4gPSB1dGlsLl9wcmludFdpdGgoJ1dBUk5JTkcnKTtcbiAgICB9XG4gICAgaWYgKHV0aWwubG9nTGV2ZWwgPiAyKSB7XG4gICAgICB1dGlsLmxvZyA9IHV0aWwuX3ByaW50O1xuICAgIH1cbiAgfSxcbiAgc2V0TG9nRnVuY3Rpb246IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKGZuLmNvbnN0cnVjdG9yICE9PSBGdW5jdGlvbikge1xuICAgICAgdXRpbC53YXJuKCdUaGUgbG9nIGZ1bmN0aW9uIHlvdSBwYXNzZWQgaW4gaXMgbm90IGEgZnVuY3Rpb24uIERlZmF1bHRpbmcgdG8gcmVndWxhciBsb2dzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1dGlsLl9wcmludCA9IGZuO1xuICAgIH1cbiAgfSxcblxuICBfcHJpbnRXaXRoOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29weSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBjb3B5LnVuc2hpZnQocHJlZml4KTtcbiAgICAgIHV0aWwuX3ByaW50LmFwcGx5KHV0aWwsIGNvcHkpO1xuICAgIH07XG4gIH0sXG4gIF9wcmludDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlcnIgPSBmYWxzZTtcbiAgICB2YXIgY29weSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgY29weS51bnNoaWZ0KCdQZWVySlM6ICcpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY29weS5sZW5ndGg7IGkgPCBsOyBpKyspe1xuICAgICAgaWYgKGNvcHlbaV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBjb3B5W2ldID0gJygnICsgY29weVtpXS5uYW1lICsgJykgJyArIGNvcHlbaV0ubWVzc2FnZTtcbiAgICAgICAgZXJyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZXJyID8gY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBjb3B5KSA6IGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGNvcHkpO1xuICB9LFxuICAvL1xuXG4gIC8vIFJldHVybnMgYnJvd3Nlci1hZ25vc3RpYyBkZWZhdWx0IGNvbmZpZ1xuICBkZWZhdWx0Q29uZmlnOiBkZWZhdWx0Q29uZmlnLFxuICAvL1xuXG4gIC8vIFJldHVybnMgdGhlIGN1cnJlbnQgYnJvd3Nlci5cbiAgYnJvd3NlcjogKGZ1bmN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cubW96UlRDUGVlckNvbm5lY3Rpb24pIHtcbiAgICAgIHJldHVybiAnRmlyZWZveCc7XG4gICAgfSBlbHNlIGlmICh3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb24pIHtcbiAgICAgIHJldHVybiAnQ2hyb21lJztcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5SVENQZWVyQ29ubmVjdGlvbikge1xuICAgICAgcmV0dXJuICdTdXBwb3J0ZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ1Vuc3VwcG9ydGVkJztcbiAgICB9XG4gIH0pKCksXG4gIC8vXG5cbiAgLy8gTGlzdHMgd2hpY2ggZmVhdHVyZXMgYXJlIHN1cHBvcnRlZFxuICBzdXBwb3J0czogKGZ1bmN0aW9uKCkge1xuICAgIGlmICh0eXBlb2YgUlRDUGVlckNvbm5lY3Rpb24gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgdmFyIGRhdGEgPSB0cnVlO1xuICAgIHZhciBhdWRpb1ZpZGVvID0gdHJ1ZTtcblxuICAgIHZhciBiaW5hcnlCbG9iID0gZmFsc2U7XG4gICAgdmFyIHNjdHAgPSBmYWxzZTtcbiAgICB2YXIgb25uZWdvdGlhdGlvbm5lZWRlZCA9ICEhd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uO1xuXG4gICAgdmFyIHBjLCBkYztcbiAgICB0cnkge1xuICAgICAgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oZGVmYXVsdENvbmZpZywge29wdGlvbmFsOiBbe1J0cERhdGFDaGFubmVsczogdHJ1ZX1dfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZGF0YSA9IGZhbHNlO1xuICAgICAgYXVkaW9WaWRlbyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkYyA9IHBjLmNyZWF0ZURhdGFDaGFubmVsKCdfUEVFUkpTVEVTVCcpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBkYXRhID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIC8vIEJpbmFyeSB0ZXN0XG4gICAgICB0cnkge1xuICAgICAgICBkYy5iaW5hcnlUeXBlID0gJ2Jsb2InO1xuICAgICAgICBiaW5hcnlCbG9iID0gdHJ1ZTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIH1cblxuICAgICAgLy8gUmVsaWFibGUgdGVzdC5cbiAgICAgIC8vIFVuZm9ydHVuYXRlbHkgQ2hyb21lIGlzIGEgYml0IHVucmVsaWFibGUgYWJvdXQgd2hldGhlciBvciBub3QgdGhleVxuICAgICAgLy8gc3VwcG9ydCByZWxpYWJsZS5cbiAgICAgIHZhciByZWxpYWJsZVBDID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKGRlZmF1bHRDb25maWcsIHt9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciByZWxpYWJsZURDID0gcmVsaWFibGVQQy5jcmVhdGVEYXRhQ2hhbm5lbCgnX1BFRVJKU1JFTElBQkxFVEVTVCcsIHt9KTtcbiAgICAgICAgc2N0cCA9IHJlbGlhYmxlREMucmVsaWFibGU7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICB9XG4gICAgICByZWxpYWJsZVBDLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLy8gRklYTUU6IG5vdCByZWFsbHkgdGhlIGJlc3QgY2hlY2suLi5cbiAgICBpZiAoYXVkaW9WaWRlbykge1xuICAgICAgYXVkaW9WaWRlbyA9ICEhcGMuYWRkU3RyZWFtO1xuICAgIH1cblxuICAgIC8vIEZJWE1FOiB0aGlzIGlzIG5vdCBncmVhdCBiZWNhdXNlIGluIHRoZW9yeSBpdCBkb2Vzbid0IHdvcmsgZm9yXG4gICAgLy8gYXYtb25seSBicm93c2VycyAoPykuXG4gICAgaWYgKCFvbm5lZ290aWF0aW9ubmVlZGVkICYmIGRhdGEpIHtcbiAgICAgIC8vIHN5bmMgZGVmYXVsdCBjaGVjay5cbiAgICAgIHZhciBuZWdvdGlhdGlvblBDID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKGRlZmF1bHRDb25maWcsIHtvcHRpb25hbDogW3tSdHBEYXRhQ2hhbm5lbHM6IHRydWV9XX0pO1xuICAgICAgbmVnb3RpYXRpb25QQy5vbm5lZ290aWF0aW9ubmVlZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIG9ubmVnb3RpYXRpb25uZWVkZWQgPSB0cnVlO1xuICAgICAgICAvLyBhc3luYyBjaGVjay5cbiAgICAgICAgaWYgKHV0aWwgJiYgdXRpbC5zdXBwb3J0cykge1xuICAgICAgICAgIHV0aWwuc3VwcG9ydHMub25uZWdvdGlhdGlvbm5lZWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBuZWdvdGlhdGlvblBDLmNyZWF0ZURhdGFDaGFubmVsKCdfUEVFUkpTTkVHT1RJQVRJT05URVNUJyk7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG5lZ290aWF0aW9uUEMuY2xvc2UoKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIGlmIChwYykge1xuICAgICAgcGMuY2xvc2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYXVkaW9WaWRlbzogYXVkaW9WaWRlbyxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBiaW5hcnlCbG9iOiBiaW5hcnlCbG9iLFxuICAgICAgYmluYXJ5OiBzY3RwLCAvLyBkZXByZWNhdGVkOyBzY3RwIGltcGxpZXMgYmluYXJ5IHN1cHBvcnQuXG4gICAgICByZWxpYWJsZTogc2N0cCwgLy8gZGVwcmVjYXRlZDsgc2N0cCBpbXBsaWVzIHJlbGlhYmxlIGRhdGEuXG4gICAgICBzY3RwOiBzY3RwLFxuICAgICAgb25uZWdvdGlhdGlvbm5lZWRlZDogb25uZWdvdGlhdGlvbm5lZWRlZFxuICAgIH07XG4gIH0oKSksXG4gIC8vXG5cbiAgLy8gRW5zdXJlIGFscGhhbnVtZXJpYyBpZHNcbiAgdmFsaWRhdGVJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAvLyBBbGxvdyBlbXB0eSBpZHNcbiAgICByZXR1cm4gIWlkIHx8IC9eW0EtWmEtejAtOV0rKD86WyBfLV1bQS1aYS16MC05XSspKiQvLmV4ZWMoaWQpO1xuICB9LFxuXG4gIHZhbGlkYXRlS2V5OiBmdW5jdGlvbihrZXkpIHtcbiAgICAvLyBBbGxvdyBlbXB0eSBrZXlzXG4gICAgcmV0dXJuICFrZXkgfHwgL15bQS1aYS16MC05XSsoPzpbIF8tXVtBLVphLXowLTldKykqJC8uZXhlYyhrZXkpO1xuICB9LFxuXG5cbiAgZGVidWc6IGZhbHNlLFxuXG4gIGluaGVyaXRzOiBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvcjtcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGV4dGVuZDogZnVuY3Rpb24oZGVzdCwgc291cmNlKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZihzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBkZXN0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG4gIHBhY2s6IEJpbmFyeVBhY2sucGFjayxcbiAgdW5wYWNrOiBCaW5hcnlQYWNrLnVucGFjayxcblxuICBsb2c6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodXRpbC5kZWJ1Zykge1xuICAgICAgdmFyIGVyciA9IGZhbHNlO1xuICAgICAgdmFyIGNvcHkgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgY29weS51bnNoaWZ0KCdQZWVySlM6ICcpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjb3B5Lmxlbmd0aDsgaSA8IGw7IGkrKyl7XG4gICAgICAgIGlmIChjb3B5W2ldIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICBjb3B5W2ldID0gJygnICsgY29weVtpXS5uYW1lICsgJykgJyArIGNvcHlbaV0ubWVzc2FnZTtcbiAgICAgICAgICBlcnIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlcnIgPyBjb25zb2xlLmVycm9yLmFwcGx5KGNvbnNvbGUsIGNvcHkpIDogY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgY29weSk7XG4gICAgfVxuICB9LFxuXG4gIHNldFplcm9UaW1lb3V0OiAoZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICAgdmFyIHRpbWVvdXRzID0gW107XG4gICAgdmFyIG1lc3NhZ2VOYW1lID0gJ3plcm8tdGltZW91dC1tZXNzYWdlJztcblxuICAgIC8vIExpa2Ugc2V0VGltZW91dCwgYnV0IG9ubHkgdGFrZXMgYSBmdW5jdGlvbiBhcmd1bWVudC5cdCBUaGVyZSdzXG4gICAgLy8gbm8gdGltZSBhcmd1bWVudCAoYWx3YXlzIHplcm8pIGFuZCBubyBhcmd1bWVudHMgKHlvdSBoYXZlIHRvXG4gICAgLy8gdXNlIGEgY2xvc3VyZSkuXG4gICAgZnVuY3Rpb24gc2V0WmVyb1RpbWVvdXRQb3N0TWVzc2FnZShmbikge1xuICAgICAgdGltZW91dHMucHVzaChmbik7XG4gICAgICBnbG9iYWwucG9zdE1lc3NhZ2UobWVzc2FnZU5hbWUsICcqJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldmVudCkge1xuICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PSBnbG9iYWwgJiYgZXZlbnQuZGF0YSA9PSBtZXNzYWdlTmFtZSkge1xuICAgICAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpbWVvdXRzLmxlbmd0aCkge1xuICAgICAgICAgIHRpbWVvdXRzLnNoaWZ0KCkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlTWVzc2FnZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChnbG9iYWwuYXR0YWNoRXZlbnQpIHtcbiAgICAgIGdsb2JhbC5hdHRhY2hFdmVudCgnb25tZXNzYWdlJywgaGFuZGxlTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiBzZXRaZXJvVGltZW91dFBvc3RNZXNzYWdlO1xuICB9KHdpbmRvdykpLFxuXG4gIC8vIEJpbmFyeSBzdHVmZlxuXG4gIC8vIGNodW5rcyBhIGJsb2IuXG4gIGNodW5rOiBmdW5jdGlvbihibCkge1xuICAgIHZhciBjaHVua3MgPSBbXTtcbiAgICB2YXIgc2l6ZSA9IGJsLnNpemU7XG4gICAgdmFyIHN0YXJ0ID0gaW5kZXggPSAwO1xuICAgIHZhciB0b3RhbCA9IE1hdGguY2VpbChzaXplIC8gdXRpbC5jaHVua2VkTVRVKTtcbiAgICB3aGlsZSAoc3RhcnQgPCBzaXplKSB7XG4gICAgICB2YXIgZW5kID0gTWF0aC5taW4oc2l6ZSwgc3RhcnQgKyB1dGlsLmNodW5rZWRNVFUpO1xuICAgICAgdmFyIGIgPSBibC5zbGljZShzdGFydCwgZW5kKTtcblxuICAgICAgdmFyIGNodW5rID0ge1xuICAgICAgICBfX3BlZXJEYXRhOiBkYXRhQ291bnQsXG4gICAgICAgIG46IGluZGV4LFxuICAgICAgICBkYXRhOiBiLFxuICAgICAgICB0b3RhbDogdG90YWxcbiAgICAgIH07XG5cbiAgICAgIGNodW5rcy5wdXNoKGNodW5rKTtcblxuICAgICAgc3RhcnQgPSBlbmQ7XG4gICAgICBpbmRleCArPSAxO1xuICAgIH1cbiAgICBkYXRhQ291bnQgKz0gMTtcbiAgICByZXR1cm4gY2h1bmtzO1xuICB9LFxuXG4gIGJsb2JUb0FycmF5QnVmZmVyOiBmdW5jdGlvbihibG9iLCBjYil7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgIGNiKGV2dC50YXJnZXQucmVzdWx0KTtcbiAgICB9O1xuICAgIGZyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpO1xuICB9LFxuICBibG9iVG9CaW5hcnlTdHJpbmc6IGZ1bmN0aW9uKGJsb2IsIGNiKXtcbiAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgY2IoZXZ0LnRhcmdldC5yZXN1bHQpO1xuICAgIH07XG4gICAgZnIucmVhZEFzQmluYXJ5U3RyaW5nKGJsb2IpO1xuICB9LFxuICBiaW5hcnlTdHJpbmdUb0FycmF5QnVmZmVyOiBmdW5jdGlvbihiaW5hcnkpIHtcbiAgICB2YXIgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5Lmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ5dGVBcnJheVtpXSA9IGJpbmFyeS5jaGFyQ29kZUF0KGkpICYgMHhmZjtcbiAgICB9XG4gICAgcmV0dXJuIGJ5dGVBcnJheS5idWZmZXI7XG4gIH0sXG4gIHJhbmRvbVRva2VuOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyKTtcbiAgfSxcbiAgLy9cblxuICBpc1NlY3VyZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZHMgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZlbnRdKSByZXR1cm4gW107XG4gIGlmICh0aGlzLl9ldmVudHNbZXZlbnRdLmZuKSByZXR1cm4gW3RoaXMuX2V2ZW50c1tldmVudF0uZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZXZlbnRzW2V2ZW50XS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSB0aGlzLl9ldmVudHNbZXZlbnRdW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZlbnRdKSB0aGlzLl9ldmVudHNbZXZlbnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XS5mbikgdGhpcy5fZXZlbnRzW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldmVudF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZlbnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XSkgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldmVudF0uZm4pIHRoaXMuX2V2ZW50c1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZlbnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2ZW50XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIG9uY2UpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldmVudF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuICYmIChsaXN0ZW5lcnMuZm4gIT09IGZuIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSkpKSB7XG4gICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgIH1cbiAgICBpZiAoIWxpc3RlbmVycy5mbikgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5mbiAhPT0gZm4gfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKSkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZlbnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2ZW50XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyO1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlcjMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiIsInZhciBCdWZmZXJCdWlsZGVyID0gcmVxdWlyZSgnLi9idWZmZXJidWlsZGVyJykuQnVmZmVyQnVpbGRlcjtcclxudmFyIGJpbmFyeUZlYXR1cmVzID0gcmVxdWlyZSgnLi9idWZmZXJidWlsZGVyJykuYmluYXJ5RmVhdHVyZXM7XHJcblxyXG52YXIgQmluYXJ5UGFjayA9IHtcclxuICB1bnBhY2s6IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHVucGFja2VyID0gbmV3IFVucGFja2VyKGRhdGEpO1xyXG4gICAgcmV0dXJuIHVucGFja2VyLnVucGFjaygpO1xyXG4gIH0sXHJcbiAgcGFjazogZnVuY3Rpb24oZGF0YSl7XHJcbiAgICB2YXIgcGFja2VyID0gbmV3IFBhY2tlcigpO1xyXG4gICAgcGFja2VyLnBhY2soZGF0YSk7XHJcbiAgICB2YXIgYnVmZmVyID0gcGFja2VyLmdldEJ1ZmZlcigpO1xyXG4gICAgcmV0dXJuIGJ1ZmZlcjtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJpbmFyeVBhY2s7XHJcblxyXG5mdW5jdGlvbiBVbnBhY2tlciAoZGF0YSl7XHJcbiAgLy8gRGF0YSBpcyBBcnJheUJ1ZmZlclxyXG4gIHRoaXMuaW5kZXggPSAwO1xyXG4gIHRoaXMuZGF0YUJ1ZmZlciA9IGRhdGE7XHJcbiAgdGhpcy5kYXRhVmlldyA9IG5ldyBVaW50OEFycmF5KHRoaXMuZGF0YUJ1ZmZlcik7XHJcbiAgdGhpcy5sZW5ndGggPSB0aGlzLmRhdGFCdWZmZXIuYnl0ZUxlbmd0aDtcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFjayA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIHR5cGUgPSB0aGlzLnVucGFja191aW50OCgpO1xyXG4gIGlmICh0eXBlIDwgMHg4MCl7XHJcbiAgICB2YXIgcG9zaXRpdmVfZml4bnVtID0gdHlwZTtcclxuICAgIHJldHVybiBwb3NpdGl2ZV9maXhudW07XHJcbiAgfSBlbHNlIGlmICgodHlwZSBeIDB4ZTApIDwgMHgyMCl7XHJcbiAgICB2YXIgbmVnYXRpdmVfZml4bnVtID0gKHR5cGUgXiAweGUwKSAtIDB4MjA7XHJcbiAgICByZXR1cm4gbmVnYXRpdmVfZml4bnVtO1xyXG4gIH1cclxuICB2YXIgc2l6ZTtcclxuICBpZiAoKHNpemUgPSB0eXBlIF4gMHhhMCkgPD0gMHgwZil7XHJcbiAgICByZXR1cm4gdGhpcy51bnBhY2tfcmF3KHNpemUpO1xyXG4gIH0gZWxzZSBpZiAoKHNpemUgPSB0eXBlIF4gMHhiMCkgPD0gMHgwZil7XHJcbiAgICByZXR1cm4gdGhpcy51bnBhY2tfc3RyaW5nKHNpemUpO1xyXG4gIH0gZWxzZSBpZiAoKHNpemUgPSB0eXBlIF4gMHg5MCkgPD0gMHgwZil7XHJcbiAgICByZXR1cm4gdGhpcy51bnBhY2tfYXJyYXkoc2l6ZSk7XHJcbiAgfSBlbHNlIGlmICgoc2l6ZSA9IHR5cGUgXiAweDgwKSA8PSAweDBmKXtcclxuICAgIHJldHVybiB0aGlzLnVucGFja19tYXAoc2l6ZSk7XHJcbiAgfVxyXG4gIHN3aXRjaCh0eXBlKXtcclxuICAgIGNhc2UgMHhjMDpcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBjYXNlIDB4YzE6XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICBjYXNlIDB4YzI6XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIGNhc2UgMHhjMzpcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICBjYXNlIDB4Y2E6XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19mbG9hdCgpO1xyXG4gICAgY2FzZSAweGNiOlxyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfZG91YmxlKCk7XHJcbiAgICBjYXNlIDB4Y2M6XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja191aW50OCgpO1xyXG4gICAgY2FzZSAweGNkOlxyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfdWludDE2KCk7XHJcbiAgICBjYXNlIDB4Y2U6XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja191aW50MzIoKTtcclxuICAgIGNhc2UgMHhjZjpcclxuICAgICAgcmV0dXJuIHRoaXMudW5wYWNrX3VpbnQ2NCgpO1xyXG4gICAgY2FzZSAweGQwOlxyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfaW50OCgpO1xyXG4gICAgY2FzZSAweGQxOlxyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfaW50MTYoKTtcclxuICAgIGNhc2UgMHhkMjpcclxuICAgICAgcmV0dXJuIHRoaXMudW5wYWNrX2ludDMyKCk7XHJcbiAgICBjYXNlIDB4ZDM6XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19pbnQ2NCgpO1xyXG4gICAgY2FzZSAweGQ0OlxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgY2FzZSAweGQ1OlxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgY2FzZSAweGQ2OlxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgY2FzZSAweGQ3OlxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgY2FzZSAweGQ4OlxyXG4gICAgICBzaXplID0gdGhpcy51bnBhY2tfdWludDE2KCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19zdHJpbmcoc2l6ZSk7XHJcbiAgICBjYXNlIDB4ZDk6XHJcbiAgICAgIHNpemUgPSB0aGlzLnVucGFja191aW50MzIoKTtcclxuICAgICAgcmV0dXJuIHRoaXMudW5wYWNrX3N0cmluZyhzaXplKTtcclxuICAgIGNhc2UgMHhkYTpcclxuICAgICAgc2l6ZSA9IHRoaXMudW5wYWNrX3VpbnQxNigpO1xyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfcmF3KHNpemUpO1xyXG4gICAgY2FzZSAweGRiOlxyXG4gICAgICBzaXplID0gdGhpcy51bnBhY2tfdWludDMyKCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19yYXcoc2l6ZSk7XHJcbiAgICBjYXNlIDB4ZGM6XHJcbiAgICAgIHNpemUgPSB0aGlzLnVucGFja191aW50MTYoKTtcclxuICAgICAgcmV0dXJuIHRoaXMudW5wYWNrX2FycmF5KHNpemUpO1xyXG4gICAgY2FzZSAweGRkOlxyXG4gICAgICBzaXplID0gdGhpcy51bnBhY2tfdWludDMyKCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19hcnJheShzaXplKTtcclxuICAgIGNhc2UgMHhkZTpcclxuICAgICAgc2l6ZSA9IHRoaXMudW5wYWNrX3VpbnQxNigpO1xyXG4gICAgICByZXR1cm4gdGhpcy51bnBhY2tfbWFwKHNpemUpO1xyXG4gICAgY2FzZSAweGRmOlxyXG4gICAgICBzaXplID0gdGhpcy51bnBhY2tfdWludDMyKCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnVucGFja19tYXAoc2l6ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5VbnBhY2tlci5wcm90b3R5cGUudW5wYWNrX3VpbnQ4ID0gZnVuY3Rpb24oKXtcclxuICB2YXIgYnl0ZSA9IHRoaXMuZGF0YVZpZXdbdGhpcy5pbmRleF0gJiAweGZmO1xyXG4gIHRoaXMuaW5kZXgrKztcclxuICByZXR1cm4gYnl0ZTtcclxufTtcclxuXHJcblVucGFja2VyLnByb3RvdHlwZS51bnBhY2tfdWludDE2ID0gZnVuY3Rpb24oKXtcclxuICB2YXIgYnl0ZXMgPSB0aGlzLnJlYWQoMik7XHJcbiAgdmFyIHVpbnQxNiA9XHJcbiAgICAoKGJ5dGVzWzBdICYgMHhmZikgKiAyNTYpICsgKGJ5dGVzWzFdICYgMHhmZik7XHJcbiAgdGhpcy5pbmRleCArPSAyO1xyXG4gIHJldHVybiB1aW50MTY7XHJcbn1cclxuXHJcblVucGFja2VyLnByb3RvdHlwZS51bnBhY2tfdWludDMyID0gZnVuY3Rpb24oKXtcclxuICB2YXIgYnl0ZXMgPSB0aGlzLnJlYWQoNCk7XHJcbiAgdmFyIHVpbnQzMiA9XHJcbiAgICAgKChieXRlc1swXSAgKiAyNTYgK1xyXG4gICAgICAgYnl0ZXNbMV0pICogMjU2ICtcclxuICAgICAgIGJ5dGVzWzJdKSAqIDI1NiArXHJcbiAgICAgICBieXRlc1szXTtcclxuICB0aGlzLmluZGV4ICs9IDQ7XHJcbiAgcmV0dXJuIHVpbnQzMjtcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja191aW50NjQgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBieXRlcyA9IHRoaXMucmVhZCg4KTtcclxuICB2YXIgdWludDY0ID1cclxuICAgKCgoKCgoYnl0ZXNbMF0gICogMjU2ICtcclxuICAgICAgIGJ5dGVzWzFdKSAqIDI1NiArXHJcbiAgICAgICBieXRlc1syXSkgKiAyNTYgK1xyXG4gICAgICAgYnl0ZXNbM10pICogMjU2ICtcclxuICAgICAgIGJ5dGVzWzRdKSAqIDI1NiArXHJcbiAgICAgICBieXRlc1s1XSkgKiAyNTYgK1xyXG4gICAgICAgYnl0ZXNbNl0pICogMjU2ICtcclxuICAgICAgIGJ5dGVzWzddO1xyXG4gIHRoaXMuaW5kZXggKz0gODtcclxuICByZXR1cm4gdWludDY0O1xyXG59XHJcblxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja19pbnQ4ID0gZnVuY3Rpb24oKXtcclxuICB2YXIgdWludDggPSB0aGlzLnVucGFja191aW50OCgpO1xyXG4gIHJldHVybiAodWludDggPCAweDgwICkgPyB1aW50OCA6IHVpbnQ4IC0gKDEgPDwgOCk7XHJcbn07XHJcblxyXG5VbnBhY2tlci5wcm90b3R5cGUudW5wYWNrX2ludDE2ID0gZnVuY3Rpb24oKXtcclxuICB2YXIgdWludDE2ID0gdGhpcy51bnBhY2tfdWludDE2KCk7XHJcbiAgcmV0dXJuICh1aW50MTYgPCAweDgwMDAgKSA/IHVpbnQxNiA6IHVpbnQxNiAtICgxIDw8IDE2KTtcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja19pbnQzMiA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIHVpbnQzMiA9IHRoaXMudW5wYWNrX3VpbnQzMigpO1xyXG4gIHJldHVybiAodWludDMyIDwgTWF0aC5wb3coMiwgMzEpICkgPyB1aW50MzIgOlxyXG4gICAgdWludDMyIC0gTWF0aC5wb3coMiwgMzIpO1xyXG59XHJcblxyXG5VbnBhY2tlci5wcm90b3R5cGUudW5wYWNrX2ludDY0ID0gZnVuY3Rpb24oKXtcclxuICB2YXIgdWludDY0ID0gdGhpcy51bnBhY2tfdWludDY0KCk7XHJcbiAgcmV0dXJuICh1aW50NjQgPCBNYXRoLnBvdygyLCA2MykgKSA/IHVpbnQ2NCA6XHJcbiAgICB1aW50NjQgLSBNYXRoLnBvdygyLCA2NCk7XHJcbn1cclxuXHJcblVucGFja2VyLnByb3RvdHlwZS51bnBhY2tfcmF3ID0gZnVuY3Rpb24oc2l6ZSl7XHJcbiAgaWYgKCB0aGlzLmxlbmd0aCA8IHRoaXMuaW5kZXggKyBzaXplKXtcclxuICAgIHRocm93IG5ldyBFcnJvcignQmluYXJ5UGFja0ZhaWx1cmU6IGluZGV4IGlzIG91dCBvZiByYW5nZSdcclxuICAgICAgKyAnICcgKyB0aGlzLmluZGV4ICsgJyAnICsgc2l6ZSArICcgJyArIHRoaXMubGVuZ3RoKTtcclxuICB9XHJcbiAgdmFyIGJ1ZiA9IHRoaXMuZGF0YUJ1ZmZlci5zbGljZSh0aGlzLmluZGV4LCB0aGlzLmluZGV4ICsgc2l6ZSk7XHJcbiAgdGhpcy5pbmRleCArPSBzaXplO1xyXG5cclxuICAgIC8vYnVmID0gdXRpbC5idWZmZXJUb1N0cmluZyhidWYpO1xyXG5cclxuICByZXR1cm4gYnVmO1xyXG59XHJcblxyXG5VbnBhY2tlci5wcm90b3R5cGUudW5wYWNrX3N0cmluZyA9IGZ1bmN0aW9uKHNpemUpe1xyXG4gIHZhciBieXRlcyA9IHRoaXMucmVhZChzaXplKTtcclxuICB2YXIgaSA9IDAsIHN0ciA9ICcnLCBjLCBjb2RlO1xyXG4gIHdoaWxlKGkgPCBzaXplKXtcclxuICAgIGMgPSBieXRlc1tpXTtcclxuICAgIGlmICggYyA8IDEyOCl7XHJcbiAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xyXG4gICAgICBpKys7XHJcbiAgICB9IGVsc2UgaWYgKChjIF4gMHhjMCkgPCAzMil7XHJcbiAgICAgIGNvZGUgPSAoKGMgXiAweGMwKSA8PCA2KSB8IChieXRlc1tpKzFdICYgNjMpO1xyXG4gICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgaSArPSAyO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29kZSA9ICgoYyAmIDE1KSA8PCAxMikgfCAoKGJ5dGVzW2krMV0gJiA2MykgPDwgNikgfFxyXG4gICAgICAgIChieXRlc1tpKzJdICYgNjMpO1xyXG4gICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgaSArPSAzO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aGlzLmluZGV4ICs9IHNpemU7XHJcbiAgcmV0dXJuIHN0cjtcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja19hcnJheSA9IGZ1bmN0aW9uKHNpemUpe1xyXG4gIHZhciBvYmplY3RzID0gbmV3IEFycmF5KHNpemUpO1xyXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBzaXplIDsgaSsrKXtcclxuICAgIG9iamVjdHNbaV0gPSB0aGlzLnVucGFjaygpO1xyXG4gIH1cclxuICByZXR1cm4gb2JqZWN0cztcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja19tYXAgPSBmdW5jdGlvbihzaXplKXtcclxuICB2YXIgbWFwID0ge307XHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IHNpemUgOyBpKyspe1xyXG4gICAgdmFyIGtleSAgPSB0aGlzLnVucGFjaygpO1xyXG4gICAgdmFyIHZhbHVlID0gdGhpcy51bnBhY2soKTtcclxuICAgIG1hcFtrZXldID0gdmFsdWU7XHJcbiAgfVxyXG4gIHJldHVybiBtYXA7XHJcbn1cclxuXHJcblVucGFja2VyLnByb3RvdHlwZS51bnBhY2tfZmxvYXQgPSBmdW5jdGlvbigpe1xyXG4gIHZhciB1aW50MzIgPSB0aGlzLnVucGFja191aW50MzIoKTtcclxuICB2YXIgc2lnbiA9IHVpbnQzMiA+PiAzMTtcclxuICB2YXIgZXhwICA9ICgodWludDMyID4+IDIzKSAmIDB4ZmYpIC0gMTI3O1xyXG4gIHZhciBmcmFjdGlvbiA9ICggdWludDMyICYgMHg3ZmZmZmYgKSB8IDB4ODAwMDAwO1xyXG4gIHJldHVybiAoc2lnbiA9PSAwID8gMSA6IC0xKSAqXHJcbiAgICBmcmFjdGlvbiAqIE1hdGgucG93KDIsIGV4cCAtIDIzKTtcclxufVxyXG5cclxuVW5wYWNrZXIucHJvdG90eXBlLnVucGFja19kb3VibGUgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBoMzIgPSB0aGlzLnVucGFja191aW50MzIoKTtcclxuICB2YXIgbDMyID0gdGhpcy51bnBhY2tfdWludDMyKCk7XHJcbiAgdmFyIHNpZ24gPSBoMzIgPj4gMzE7XHJcbiAgdmFyIGV4cCAgPSAoKGgzMiA+PiAyMCkgJiAweDdmZikgLSAxMDIzO1xyXG4gIHZhciBoZnJhYyA9ICggaDMyICYgMHhmZmZmZiApIHwgMHgxMDAwMDA7XHJcbiAgdmFyIGZyYWMgPSBoZnJhYyAqIE1hdGgucG93KDIsIGV4cCAtIDIwKSArXHJcbiAgICBsMzIgICAqIE1hdGgucG93KDIsIGV4cCAtIDUyKTtcclxuICByZXR1cm4gKHNpZ24gPT0gMCA/IDEgOiAtMSkgKiBmcmFjO1xyXG59XHJcblxyXG5VbnBhY2tlci5wcm90b3R5cGUucmVhZCA9IGZ1bmN0aW9uKGxlbmd0aCl7XHJcbiAgdmFyIGogPSB0aGlzLmluZGV4O1xyXG4gIGlmIChqICsgbGVuZ3RoIDw9IHRoaXMubGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhVmlldy5zdWJhcnJheShqLCBqICsgbGVuZ3RoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdCaW5hcnlQYWNrRmFpbHVyZTogcmVhZCBpbmRleCBvdXQgb2YgcmFuZ2UnKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFBhY2tlcigpe1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlciA9IG5ldyBCdWZmZXJCdWlsZGVyKCk7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUuZ2V0QnVmZmVyID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gdGhpcy5idWZmZXJCdWlsZGVyLmdldEJ1ZmZlcigpO1xyXG59XHJcblxyXG5QYWNrZXIucHJvdG90eXBlLnBhY2sgPSBmdW5jdGlvbih2YWx1ZSl7XHJcbiAgdmFyIHR5cGUgPSB0eXBlb2YodmFsdWUpO1xyXG4gIGlmICh0eXBlID09ICdzdHJpbmcnKXtcclxuICAgIHRoaXMucGFja19zdHJpbmcodmFsdWUpO1xyXG4gIH0gZWxzZSBpZiAodHlwZSA9PSAnbnVtYmVyJyl7XHJcbiAgICBpZiAoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlKXtcclxuICAgICAgdGhpcy5wYWNrX2ludGVnZXIodmFsdWUpO1xyXG4gICAgfSBlbHNle1xyXG4gICAgICB0aGlzLnBhY2tfZG91YmxlKHZhbHVlKTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHR5cGUgPT0gJ2Jvb2xlYW4nKXtcclxuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSl7XHJcbiAgICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjMyk7XHJcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBmYWxzZSl7XHJcbiAgICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjMik7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmICh0eXBlID09ICd1bmRlZmluZWQnKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjMCk7XHJcbiAgfSBlbHNlIGlmICh0eXBlID09ICdvYmplY3QnKXtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCl7XHJcbiAgICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgY29uc3RydWN0b3IgPSB2YWx1ZS5jb25zdHJ1Y3RvcjtcclxuICAgICAgaWYgKGNvbnN0cnVjdG9yID09IEFycmF5KXtcclxuICAgICAgICB0aGlzLnBhY2tfYXJyYXkodmFsdWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNvbnN0cnVjdG9yID09IEJsb2IgfHwgY29uc3RydWN0b3IgPT0gRmlsZSkge1xyXG4gICAgICAgIHRoaXMucGFja19iaW4odmFsdWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNvbnN0cnVjdG9yID09IEFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgaWYoYmluYXJ5RmVhdHVyZXMudXNlQXJyYXlCdWZmZXJWaWV3KSB7XHJcbiAgICAgICAgICB0aGlzLnBhY2tfYmluKG5ldyBVaW50OEFycmF5KHZhbHVlKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMucGFja19iaW4odmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICgnQllURVNfUEVSX0VMRU1FTlQnIGluIHZhbHVlKXtcclxuICAgICAgICBpZihiaW5hcnlGZWF0dXJlcy51c2VBcnJheUJ1ZmZlclZpZXcpIHtcclxuICAgICAgICAgIHRoaXMucGFja19iaW4obmV3IFVpbnQ4QXJyYXkodmFsdWUuYnVmZmVyKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMucGFja19iaW4odmFsdWUuYnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoY29uc3RydWN0b3IgPT0gT2JqZWN0KXtcclxuICAgICAgICB0aGlzLnBhY2tfb2JqZWN0KHZhbHVlKTtcclxuICAgICAgfSBlbHNlIGlmIChjb25zdHJ1Y3RvciA9PSBEYXRlKXtcclxuICAgICAgICB0aGlzLnBhY2tfc3RyaW5nKHZhbHVlLnRvU3RyaW5nKCkpO1xyXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZS50b0JpbmFyeVBhY2sgPT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCh2YWx1ZS50b0JpbmFyeVBhY2soKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUeXBlIFwiJyArIGNvbnN0cnVjdG9yLnRvU3RyaW5nKCkgKyAnXCIgbm90IHlldCBzdXBwb3J0ZWQnKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1R5cGUgXCInICsgdHlwZSArICdcIiBub3QgeWV0IHN1cHBvcnRlZCcpO1xyXG4gIH1cclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuZmx1c2goKTtcclxufVxyXG5cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja19iaW4gPSBmdW5jdGlvbihibG9iKXtcclxuICB2YXIgbGVuZ3RoID0gYmxvYi5sZW5ndGggfHwgYmxvYi5ieXRlTGVuZ3RoIHx8IGJsb2Iuc2l6ZTtcclxuICBpZiAobGVuZ3RoIDw9IDB4MGYpe1xyXG4gICAgdGhpcy5wYWNrX3VpbnQ4KDB4YTAgKyBsZW5ndGgpO1xyXG4gIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDB4ZmZmZil7XHJcbiAgICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKDB4ZGEpIDtcclxuICAgIHRoaXMucGFja191aW50MTYobGVuZ3RoKTtcclxuICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmZmZmZmKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhkYik7XHJcbiAgICB0aGlzLnBhY2tfdWludDMyKGxlbmd0aCk7XHJcbiAgfSBlbHNle1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxlbmd0aCcpO1xyXG4gIH1cclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKGJsb2IpO1xyXG59XHJcblxyXG5QYWNrZXIucHJvdG90eXBlLnBhY2tfc3RyaW5nID0gZnVuY3Rpb24oc3RyKXtcclxuICB2YXIgbGVuZ3RoID0gdXRmOExlbmd0aChzdHIpO1xyXG5cclxuICBpZiAobGVuZ3RoIDw9IDB4MGYpe1xyXG4gICAgdGhpcy5wYWNrX3VpbnQ4KDB4YjAgKyBsZW5ndGgpO1xyXG4gIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDB4ZmZmZil7XHJcbiAgICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKDB4ZDgpIDtcclxuICAgIHRoaXMucGFja191aW50MTYobGVuZ3RoKTtcclxuICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmZmZmZmKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhkOSk7XHJcbiAgICB0aGlzLnBhY2tfdWludDMyKGxlbmd0aCk7XHJcbiAgfSBlbHNle1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxlbmd0aCcpO1xyXG4gIH1cclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKHN0cik7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja19hcnJheSA9IGZ1bmN0aW9uKGFyeSl7XHJcbiAgdmFyIGxlbmd0aCA9IGFyeS5sZW5ndGg7XHJcbiAgaWYgKGxlbmd0aCA8PSAweDBmKXtcclxuICAgIHRoaXMucGFja191aW50OCgweDkwICsgbGVuZ3RoKTtcclxuICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGRjKVxyXG4gICAgdGhpcy5wYWNrX3VpbnQxNihsZW5ndGgpO1xyXG4gIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDB4ZmZmZmZmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGRkKTtcclxuICAgIHRoaXMucGFja191aW50MzIobGVuZ3RoKTtcclxuICB9IGVsc2V7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbGVuZ3RoJyk7XHJcbiAgfVxyXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBsZW5ndGggOyBpKyspe1xyXG4gICAgdGhpcy5wYWNrKGFyeVtpXSk7XHJcbiAgfVxyXG59XHJcblxyXG5QYWNrZXIucHJvdG90eXBlLnBhY2tfaW50ZWdlciA9IGZ1bmN0aW9uKG51bSl7XHJcbiAgaWYgKCAtMHgyMCA8PSBudW0gJiYgbnVtIDw9IDB4N2Ype1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZChudW0gJiAweGZmKTtcclxuICB9IGVsc2UgaWYgKDB4MDAgPD0gbnVtICYmIG51bSA8PSAweGZmKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjYyk7XHJcbiAgICB0aGlzLnBhY2tfdWludDgobnVtKTtcclxuICB9IGVsc2UgaWYgKC0weDgwIDw9IG51bSAmJiBudW0gPD0gMHg3Zil7XHJcbiAgICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKDB4ZDApO1xyXG4gICAgdGhpcy5wYWNrX2ludDgobnVtKTtcclxuICB9IGVsc2UgaWYgKCAweDAwMDAgPD0gbnVtICYmIG51bSA8PSAweGZmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGNkKTtcclxuICAgIHRoaXMucGFja191aW50MTYobnVtKTtcclxuICB9IGVsc2UgaWYgKC0weDgwMDAgPD0gbnVtICYmIG51bSA8PSAweDdmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGQxKTtcclxuICAgIHRoaXMucGFja19pbnQxNihudW0pO1xyXG4gIH0gZWxzZSBpZiAoIDB4MDAwMDAwMDAgPD0gbnVtICYmIG51bSA8PSAweGZmZmZmZmZmKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjZSk7XHJcbiAgICB0aGlzLnBhY2tfdWludDMyKG51bSk7XHJcbiAgfSBlbHNlIGlmICgtMHg4MDAwMDAwMCA8PSBudW0gJiYgbnVtIDw9IDB4N2ZmZmZmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGQyKTtcclxuICAgIHRoaXMucGFja19pbnQzMihudW0pO1xyXG4gIH0gZWxzZSBpZiAoLTB4ODAwMDAwMDAwMDAwMDAwMCA8PSBudW0gJiYgbnVtIDw9IDB4N0ZGRkZGRkZGRkZGRkZGRil7XHJcbiAgICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKDB4ZDMpO1xyXG4gICAgdGhpcy5wYWNrX2ludDY0KG51bSk7XHJcbiAgfSBlbHNlIGlmICgweDAwMDAwMDAwMDAwMDAwMDAgPD0gbnVtICYmIG51bSA8PSAweEZGRkZGRkZGRkZGRkZGRkYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGNmKTtcclxuICAgIHRoaXMucGFja191aW50NjQobnVtKTtcclxuICB9IGVsc2V7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaW50ZWdlcicpO1xyXG4gIH1cclxufVxyXG5cclxuUGFja2VyLnByb3RvdHlwZS5wYWNrX2RvdWJsZSA9IGZ1bmN0aW9uKG51bSl7XHJcbiAgdmFyIHNpZ24gPSAwO1xyXG4gIGlmIChudW0gPCAwKXtcclxuICAgIHNpZ24gPSAxO1xyXG4gICAgbnVtID0gLW51bTtcclxuICB9XHJcbiAgdmFyIGV4cCAgPSBNYXRoLmZsb29yKE1hdGgubG9nKG51bSkgLyBNYXRoLkxOMik7XHJcbiAgdmFyIGZyYWMwID0gbnVtIC8gTWF0aC5wb3coMiwgZXhwKSAtIDE7XHJcbiAgdmFyIGZyYWMxID0gTWF0aC5mbG9vcihmcmFjMCAqIE1hdGgucG93KDIsIDUyKSk7XHJcbiAgdmFyIGIzMiAgID0gTWF0aC5wb3coMiwgMzIpO1xyXG4gIHZhciBoMzIgPSAoc2lnbiA8PCAzMSkgfCAoKGV4cCsxMDIzKSA8PCAyMCkgfFxyXG4gICAgICAoZnJhYzEgLyBiMzIpICYgMHgwZmZmZmY7XHJcbiAgdmFyIGwzMiA9IGZyYWMxICUgYjMyO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhjYik7XHJcbiAgdGhpcy5wYWNrX2ludDMyKGgzMik7XHJcbiAgdGhpcy5wYWNrX2ludDMyKGwzMik7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja19vYmplY3QgPSBmdW5jdGlvbihvYmope1xyXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcclxuICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XHJcbiAgaWYgKGxlbmd0aCA8PSAweDBmKXtcclxuICAgIHRoaXMucGFja191aW50OCgweDgwICsgbGVuZ3RoKTtcclxuICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmYpe1xyXG4gICAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgweGRlKTtcclxuICAgIHRoaXMucGFja191aW50MTYobGVuZ3RoKTtcclxuICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmZmZmZmKXtcclxuICAgIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoMHhkZik7XHJcbiAgICB0aGlzLnBhY2tfdWludDMyKGxlbmd0aCk7XHJcbiAgfSBlbHNle1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxlbmd0aCcpO1xyXG4gIH1cclxuICBmb3IodmFyIHByb3AgaW4gb2JqKXtcclxuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpe1xyXG4gICAgICB0aGlzLnBhY2socHJvcCk7XHJcbiAgICAgIHRoaXMucGFjayhvYmpbcHJvcF0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuUGFja2VyLnByb3RvdHlwZS5wYWNrX3VpbnQ4ID0gZnVuY3Rpb24obnVtKXtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKG51bSk7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja191aW50MTYgPSBmdW5jdGlvbihudW0pe1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQobnVtID4+IDgpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQobnVtICYgMHhmZik7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja191aW50MzIgPSBmdW5jdGlvbihudW0pe1xyXG4gIHZhciBuID0gbnVtICYgMHhmZmZmZmZmZjtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChuICYgMHhmZjAwMDAwMCkgPj4+IDI0KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChuICYgMHgwMGZmMDAwMCkgPj4+IDE2KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChuICYgMHgwMDAwZmYwMCkgPj4+ICA4KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChuICYgMHgwMDAwMDBmZikpO1xyXG59XHJcblxyXG5QYWNrZXIucHJvdG90eXBlLnBhY2tfdWludDY0ID0gZnVuY3Rpb24obnVtKXtcclxuICB2YXIgaGlnaCA9IG51bSAvIE1hdGgucG93KDIsIDMyKTtcclxuICB2YXIgbG93ICA9IG51bSAlIE1hdGgucG93KDIsIDMyKTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHhmZjAwMDAwMCkgPj4+IDI0KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMGZmMDAwMCkgPj4+IDE2KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMDAwZmYwMCkgPj4+ICA4KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMDAwMDBmZikpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweGZmMDAwMDAwKSA+Pj4gMjQpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwZmYwMDAwKSA+Pj4gMTYpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwMDBmZjAwKSA+Pj4gIDgpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwMDAwMGZmKSk7XHJcbn1cclxuXHJcblBhY2tlci5wcm90b3R5cGUucGFja19pbnQ4ID0gZnVuY3Rpb24obnVtKXtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKG51bSAmIDB4ZmYpO1xyXG59XHJcblxyXG5QYWNrZXIucHJvdG90eXBlLnBhY2tfaW50MTYgPSBmdW5jdGlvbihudW0pe1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKG51bSAmIDB4ZmYwMCkgPj4gOCk7XHJcbiAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZChudW0gJiAweGZmKTtcclxufVxyXG5cclxuUGFja2VyLnByb3RvdHlwZS5wYWNrX2ludDMyID0gZnVuY3Rpb24obnVtKXtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChudW0gPj4+IDI0KSAmIDB4ZmYpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKG51bSAmIDB4MDBmZjAwMDApID4+PiAxNik7XHJcbiAgdGhpcy5idWZmZXJCdWlsZGVyLmFwcGVuZCgobnVtICYgMHgwMDAwZmYwMCkgPj4+IDgpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKG51bSAmIDB4MDAwMDAwZmYpKTtcclxufVxyXG5cclxuUGFja2VyLnByb3RvdHlwZS5wYWNrX2ludDY0ID0gZnVuY3Rpb24obnVtKXtcclxuICB2YXIgaGlnaCA9IE1hdGguZmxvb3IobnVtIC8gTWF0aC5wb3coMiwgMzIpKTtcclxuICB2YXIgbG93ICA9IG51bSAlIE1hdGgucG93KDIsIDMyKTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHhmZjAwMDAwMCkgPj4+IDI0KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMGZmMDAwMCkgPj4+IDE2KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMDAwZmYwMCkgPj4+ICA4KTtcclxuICB0aGlzLmJ1ZmZlckJ1aWxkZXIuYXBwZW5kKChoaWdoICYgMHgwMDAwMDBmZikpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweGZmMDAwMDAwKSA+Pj4gMjQpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwZmYwMDAwKSA+Pj4gMTYpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwMDBmZjAwKSA+Pj4gIDgpO1xyXG4gIHRoaXMuYnVmZmVyQnVpbGRlci5hcHBlbmQoKGxvdyAgJiAweDAwMDAwMGZmKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF91dGY4UmVwbGFjZShtKXtcclxuICB2YXIgY29kZSA9IG0uY2hhckNvZGVBdCgwKTtcclxuXHJcbiAgaWYoY29kZSA8PSAweDdmZikgcmV0dXJuICcwMCc7XHJcbiAgaWYoY29kZSA8PSAweGZmZmYpIHJldHVybiAnMDAwJztcclxuICBpZihjb2RlIDw9IDB4MWZmZmZmKSByZXR1cm4gJzAwMDAnO1xyXG4gIGlmKGNvZGUgPD0gMHgzZmZmZmZmKSByZXR1cm4gJzAwMDAwJztcclxuICByZXR1cm4gJzAwMDAwMCc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHV0ZjhMZW5ndGgoc3RyKXtcclxuICBpZiAoc3RyLmxlbmd0aCA+IDYwMCkge1xyXG4gICAgLy8gQmxvYiBtZXRob2QgZmFzdGVyIGZvciBsYXJnZSBzdHJpbmdzXHJcbiAgICByZXR1cm4gKG5ldyBCbG9iKFtzdHJdKSkuc2l6ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXlxcdTAwMDAtXFx1MDA3Rl0vZywgX3V0ZjhSZXBsYWNlKS5sZW5ndGg7XHJcbiAgfVxyXG59XHJcbiIsInZhciBiaW5hcnlGZWF0dXJlcyA9IHt9O1xyXG5iaW5hcnlGZWF0dXJlcy51c2VCbG9iQnVpbGRlciA9IChmdW5jdGlvbigpe1xyXG4gIHRyeSB7XHJcbiAgICBuZXcgQmxvYihbXSk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxuYmluYXJ5RmVhdHVyZXMudXNlQXJyYXlCdWZmZXJWaWV3ID0gIWJpbmFyeUZlYXR1cmVzLnVzZUJsb2JCdWlsZGVyICYmIChmdW5jdGlvbigpe1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gKG5ldyBCbG9iKFtuZXcgVWludDhBcnJheShbXSldKSkuc2l6ZSA9PT0gMDtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5iaW5hcnlGZWF0dXJlcyA9IGJpbmFyeUZlYXR1cmVzO1xyXG52YXIgQmxvYkJ1aWxkZXIgPSBtb2R1bGUuZXhwb3J0cy5CbG9iQnVpbGRlcjtcclxuaWYgKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICBCbG9iQnVpbGRlciA9IG1vZHVsZS5leHBvcnRzLkJsb2JCdWlsZGVyID0gd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8XHJcbiAgICB3aW5kb3cuTW96QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1TQmxvYkJ1aWxkZXIgfHwgd2luZG93LkJsb2JCdWlsZGVyO1xyXG59XHJcblxyXG5mdW5jdGlvbiBCdWZmZXJCdWlsZGVyKCl7XHJcbiAgdGhpcy5fcGllY2VzID0gW107XHJcbiAgdGhpcy5fcGFydHMgPSBbXTtcclxufVxyXG5cclxuQnVmZmVyQnVpbGRlci5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gIGlmKHR5cGVvZiBkYXRhID09PSAnbnVtYmVyJykge1xyXG4gICAgdGhpcy5fcGllY2VzLnB1c2goZGF0YSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuZmx1c2goKTtcclxuICAgIHRoaXMuX3BhcnRzLnB1c2goZGF0YSk7XHJcbiAgfVxyXG59O1xyXG5cclxuQnVmZmVyQnVpbGRlci5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5fcGllY2VzLmxlbmd0aCA+IDApIHtcclxuICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLl9waWVjZXMpO1xyXG4gICAgaWYoIWJpbmFyeUZlYXR1cmVzLnVzZUFycmF5QnVmZmVyVmlldykge1xyXG4gICAgICBidWYgPSBidWYuYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fcGFydHMucHVzaChidWYpO1xyXG4gICAgdGhpcy5fcGllY2VzID0gW107XHJcbiAgfVxyXG59O1xyXG5cclxuQnVmZmVyQnVpbGRlci5wcm90b3R5cGUuZ2V0QnVmZmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5mbHVzaCgpO1xyXG4gIGlmKGJpbmFyeUZlYXR1cmVzLnVzZUJsb2JCdWlsZGVyKSB7XHJcbiAgICB2YXIgYnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xyXG4gICAgZm9yKHZhciBpID0gMCwgaWkgPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XHJcbiAgICAgIGJ1aWxkZXIuYXBwZW5kKHRoaXMuX3BhcnRzW2ldKTtcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsZGVyLmdldEJsb2IoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5ldyBCbG9iKHRoaXMuX3BhcnRzKTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5CdWZmZXJCdWlsZGVyID0gQnVmZmVyQnVpbGRlcjtcclxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBSZWxpYWJsZSB0cmFuc2ZlciBmb3IgQ2hyb21lIENhbmFyeSBEYXRhQ2hhbm5lbCBpbXBsLlxuICogQXV0aG9yOiBAbWljaGVsbGVidVxuICovXG5mdW5jdGlvbiBSZWxpYWJsZShkYywgZGVidWcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlbGlhYmxlKSkgcmV0dXJuIG5ldyBSZWxpYWJsZShkYyk7XG4gIHRoaXMuX2RjID0gZGM7XG5cbiAgdXRpbC5kZWJ1ZyA9IGRlYnVnO1xuXG4gIC8vIE1lc3NhZ2VzIHNlbnQvcmVjZWl2ZWQgc28gZmFyLlxuICAvLyBpZDogeyBhY2s6IG4sIGNodW5rczogWy4uLl0gfVxuICB0aGlzLl9vdXRnb2luZyA9IHt9O1xuICAvLyBpZDogeyBhY2s6IFsnYWNrJywgaWQsIG5dLCBjaHVua3M6IFsuLi5dIH1cbiAgdGhpcy5faW5jb21pbmcgPSB7fTtcbiAgdGhpcy5fcmVjZWl2ZWQgPSB7fTtcblxuICAvLyBXaW5kb3cgc2l6ZS5cbiAgdGhpcy5fd2luZG93ID0gMTAwMDtcbiAgLy8gTVRVLlxuICB0aGlzLl9tdHUgPSA1MDA7XG4gIC8vIEludGVydmFsIGZvciBzZXRJbnRlcnZhbC4gSW4gbXMuXG4gIHRoaXMuX2ludGVydmFsID0gMDtcblxuICAvLyBNZXNzYWdlcyBzZW50LlxuICB0aGlzLl9jb3VudCA9IDA7XG5cbiAgLy8gT3V0Z29pbmcgbWVzc2FnZSBxdWV1ZS5cbiAgdGhpcy5fcXVldWUgPSBbXTtcblxuICB0aGlzLl9zZXR1cERDKCk7XG59O1xuXG4vLyBTZW5kIGEgbWVzc2FnZSByZWxpYWJseS5cblJlbGlhYmxlLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24obXNnKSB7XG4gIC8vIERldGVybWluZSBpZiBjaHVua2luZyBpcyBuZWNlc3NhcnkuXG4gIHZhciBibCA9IHV0aWwucGFjayhtc2cpO1xuICBpZiAoYmwuc2l6ZSA8IHRoaXMuX210dSkge1xuICAgIHRoaXMuX2hhbmRsZVNlbmQoWydubycsIGJsXSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5fb3V0Z29pbmdbdGhpcy5fY291bnRdID0ge1xuICAgIGFjazogMCxcbiAgICBjaHVua3M6IHRoaXMuX2NodW5rKGJsKVxuICB9O1xuXG4gIGlmICh1dGlsLmRlYnVnKSB7XG4gICAgdGhpcy5fb3V0Z29pbmdbdGhpcy5fY291bnRdLnRpbWVyID0gbmV3IERhdGUoKTtcbiAgfVxuXG4gIC8vIFNlbmQgcHJlbGltIHdpbmRvdy5cbiAgdGhpcy5fc2VuZFdpbmRvd2VkQ2h1bmtzKHRoaXMuX2NvdW50KTtcbiAgdGhpcy5fY291bnQgKz0gMTtcbn07XG5cbi8vIFNldCB1cCBpbnRlcnZhbCBmb3IgcHJvY2Vzc2luZyBxdWV1ZS5cblJlbGlhYmxlLnByb3RvdHlwZS5fc2V0dXBJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBmYWlsIGdyYWNlZnVsbHkuXG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl90aW1lb3V0ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgLy8gRklYTUU6IFN0cmluZyBzdHVmZiBtYWtlcyB0aGluZ3MgdGVycmlibHkgYXN5bmMuXG4gICAgdmFyIG1zZyA9IHNlbGYuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgaWYgKG1zZy5fbXVsdGlwbGUpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG1zZy5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XG4gICAgICAgIHNlbGYuX2ludGVydmFsU2VuZChtc2dbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLl9pbnRlcnZhbFNlbmQobXNnKTtcbiAgICB9XG4gIH0sIHRoaXMuX2ludGVydmFsKTtcbn07XG5cblJlbGlhYmxlLnByb3RvdHlwZS5faW50ZXJ2YWxTZW5kID0gZnVuY3Rpb24obXNnKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgbXNnID0gdXRpbC5wYWNrKG1zZyk7XG4gIHV0aWwuYmxvYlRvQmluYXJ5U3RyaW5nKG1zZywgZnVuY3Rpb24oc3RyKSB7XG4gICAgc2VsZi5fZGMuc2VuZChzdHIpO1xuICB9KTtcbiAgaWYgKHNlbGYuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgIGNsZWFyVGltZW91dChzZWxmLl90aW1lb3V0KTtcbiAgICBzZWxmLl90aW1lb3V0ID0gbnVsbDtcbiAgICAvL3NlbGYuX3Byb2Nlc3NBY2tzKCk7XG4gIH1cbn07XG5cbi8vIEdvIHRocm91Z2ggQUNLcyB0byBzZW5kIG1pc3NpbmcgcGllY2VzLlxuUmVsaWFibGUucHJvdG90eXBlLl9wcm9jZXNzQWNrcyA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpZCBpbiB0aGlzLl9vdXRnb2luZykge1xuICAgIGlmICh0aGlzLl9vdXRnb2luZy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgIHRoaXMuX3NlbmRXaW5kb3dlZENodW5rcyhpZCk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBIYW5kbGUgc2VuZGluZyBhIG1lc3NhZ2UuXG4vLyBGSVhNRTogRG9uJ3Qgd2FpdCBmb3IgaW50ZXJ2YWwgdGltZSBmb3IgYWxsIG1lc3NhZ2VzLi4uXG5SZWxpYWJsZS5wcm90b3R5cGUuX2hhbmRsZVNlbmQgPSBmdW5jdGlvbihtc2cpIHtcbiAgdmFyIHB1c2ggPSB0cnVlO1xuICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLl9xdWV1ZS5sZW5ndGg7IGkgPCBpaTsgaSArPSAxKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLl9xdWV1ZVtpXTtcbiAgICBpZiAoaXRlbSA9PT0gbXNnKSB7XG4gICAgICBwdXNoID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpdGVtLl9tdWx0aXBsZSAmJiBpdGVtLmluZGV4T2YobXNnKSAhPT0gLTEpIHtcbiAgICAgIHB1c2ggPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKHB1c2gpIHtcbiAgICB0aGlzLl9xdWV1ZS5wdXNoKG1zZyk7XG4gICAgaWYgKCF0aGlzLl90aW1lb3V0KSB7XG4gICAgICB0aGlzLl9zZXR1cEludGVydmFsKCk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBTZXQgdXAgRGF0YUNoYW5uZWwgaGFuZGxlcnMuXG5SZWxpYWJsZS5wcm90b3R5cGUuX3NldHVwREMgPSBmdW5jdGlvbigpIHtcbiAgLy8gSGFuZGxlIHZhcmlvdXMgbWVzc2FnZSB0eXBlcy5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9kYy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIG1zZyA9IGUuZGF0YTtcbiAgICB2YXIgZGF0YXR5cGUgPSBtc2cuY29uc3RydWN0b3I7XG4gICAgLy8gRklYTUU6IG1zZyBpcyBTdHJpbmcgdW50aWwgYmluYXJ5IGlzIHN1cHBvcnRlZC5cbiAgICAvLyBPbmNlIHRoYXQgaGFwcGVucywgdGhpcyB3aWxsIGhhdmUgdG8gYmUgc21hcnRlci5cbiAgICBpZiAoZGF0YXR5cGUgPT09IFN0cmluZykge1xuICAgICAgdmFyIGFiID0gdXRpbC5iaW5hcnlTdHJpbmdUb0FycmF5QnVmZmVyKG1zZyk7XG4gICAgICBtc2cgPSB1dGlsLnVucGFjayhhYik7XG4gICAgICBzZWxmLl9oYW5kbGVNZXNzYWdlKG1zZyk7XG4gICAgfVxuICB9O1xufTtcblxuLy8gSGFuZGxlcyBhbiBpbmNvbWluZyBtZXNzYWdlLlxuUmVsaWFibGUucHJvdG90eXBlLl9oYW5kbGVNZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7XG4gIHZhciBpZCA9IG1zZ1sxXTtcbiAgdmFyIGlkYXRhID0gdGhpcy5faW5jb21pbmdbaWRdO1xuICB2YXIgb2RhdGEgPSB0aGlzLl9vdXRnb2luZ1tpZF07XG4gIHZhciBkYXRhO1xuICBzd2l0Y2ggKG1zZ1swXSkge1xuICAgIC8vIE5vIGNodW5raW5nIHdhcyBkb25lLlxuICAgIGNhc2UgJ25vJzpcbiAgICAgIHZhciBtZXNzYWdlID0gaWQ7XG4gICAgICBpZiAoISFtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMub25tZXNzYWdlKHV0aWwudW5wYWNrKG1lc3NhZ2UpKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIC8vIFJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgbWVzc2FnZS5cbiAgICBjYXNlICdlbmQnOlxuICAgICAgZGF0YSA9IGlkYXRhO1xuXG4gICAgICAvLyBJbiBjYXNlIGVuZCBjb21lcyBmaXJzdC5cbiAgICAgIHRoaXMuX3JlY2VpdmVkW2lkXSA9IG1zZ1syXTtcblxuICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9hY2soaWQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnYWNrJzpcbiAgICAgIGRhdGEgPSBvZGF0YTtcbiAgICAgIGlmICghIWRhdGEpIHtcbiAgICAgICAgdmFyIGFjayA9IG1zZ1syXTtcbiAgICAgICAgLy8gVGFrZSB0aGUgbGFyZ2VyIEFDSywgZm9yIG91dCBvZiBvcmRlciBtZXNzYWdlcy5cbiAgICAgICAgZGF0YS5hY2sgPSBNYXRoLm1heChhY2ssIGRhdGEuYWNrKTtcblxuICAgICAgICAvLyBDbGVhbiB1cCB3aGVuIGFsbCBjaHVua3MgYXJlIEFDS2VkLlxuICAgICAgICBpZiAoZGF0YS5hY2sgPj0gZGF0YS5jaHVua3MubGVuZ3RoKSB7XG4gICAgICAgICAgdXRpbC5sb2coJ1RpbWU6ICcsIG5ldyBEYXRlKCkgLSBkYXRhLnRpbWVyKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fb3V0Z29pbmdbaWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Byb2Nlc3NBY2tzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIElmICFkYXRhLCBqdXN0IGlnbm9yZS5cbiAgICAgIGJyZWFrO1xuICAgIC8vIFJlY2VpdmVkIGEgY2h1bmsgb2YgZGF0YS5cbiAgICBjYXNlICdjaHVuayc6XG4gICAgICAvLyBDcmVhdGUgYSBuZXcgZW50cnkgaWYgbm9uZSBleGlzdHMuXG4gICAgICBkYXRhID0gaWRhdGE7XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMuX3JlY2VpdmVkW2lkXTtcbiAgICAgICAgaWYgKGVuZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgYWNrOiBbJ2FjaycsIGlkLCAwXSxcbiAgICAgICAgICBjaHVua3M6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2luY29taW5nW2lkXSA9IGRhdGE7XG4gICAgICB9XG5cbiAgICAgIHZhciBuID0gbXNnWzJdO1xuICAgICAgdmFyIGNodW5rID0gbXNnWzNdO1xuICAgICAgZGF0YS5jaHVua3Nbbl0gPSBuZXcgVWludDhBcnJheShjaHVuayk7XG5cbiAgICAgIC8vIElmIHdlIGdldCB0aGUgY2h1bmsgd2UncmUgbG9va2luZyBmb3IsIEFDSyBmb3IgbmV4dCBtaXNzaW5nLlxuICAgICAgLy8gT3RoZXJ3aXNlLCBBQ0sgdGhlIHNhbWUgTiBhZ2Fpbi5cbiAgICAgIGlmIChuID09PSBkYXRhLmFja1syXSkge1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVOZXh0QWNrKGlkKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2FjayhpZCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gU2hvdWxkbid0IGhhcHBlbiwgYnV0IHdvdWxkIG1ha2Ugc2Vuc2UgZm9yIG1lc3NhZ2UgdG8ganVzdCBnb1xuICAgICAgLy8gdGhyb3VnaCBhcyBpcy5cbiAgICAgIHRoaXMuX2hhbmRsZVNlbmQobXNnKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG4vLyBDaHVua3MgQkwgaW50byBzbWFsbGVyIG1lc3NhZ2VzLlxuUmVsaWFibGUucHJvdG90eXBlLl9jaHVuayA9IGZ1bmN0aW9uKGJsKSB7XG4gIHZhciBjaHVua3MgPSBbXTtcbiAgdmFyIHNpemUgPSBibC5zaXplO1xuICB2YXIgc3RhcnQgPSAwO1xuICB3aGlsZSAoc3RhcnQgPCBzaXplKSB7XG4gICAgdmFyIGVuZCA9IE1hdGgubWluKHNpemUsIHN0YXJ0ICsgdGhpcy5fbXR1KTtcbiAgICB2YXIgYiA9IGJsLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIHZhciBjaHVuayA9IHtcbiAgICAgIHBheWxvYWQ6IGJcbiAgICB9XG4gICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgIHN0YXJ0ID0gZW5kO1xuICB9XG4gIHV0aWwubG9nKCdDcmVhdGVkJywgY2h1bmtzLmxlbmd0aCwgJ2NodW5rcy4nKTtcbiAgcmV0dXJuIGNodW5rcztcbn07XG5cbi8vIFNlbmRzIEFDSyBOLCBleHBlY3RpbmcgTnRoIGJsb2IgY2h1bmsgZm9yIG1lc3NhZ2UgSUQuXG5SZWxpYWJsZS5wcm90b3R5cGUuX2FjayA9IGZ1bmN0aW9uKGlkKSB7XG4gIHZhciBhY2sgPSB0aGlzLl9pbmNvbWluZ1tpZF0uYWNrO1xuXG4gIC8vIGlmIGFjayBpcyB0aGUgZW5kIHZhbHVlLCB0aGVuIGNhbGwgX2NvbXBsZXRlLlxuICBpZiAodGhpcy5fcmVjZWl2ZWRbaWRdID09PSBhY2tbMl0pIHtcbiAgICB0aGlzLl9jb21wbGV0ZShpZCk7XG4gICAgdGhpcy5fcmVjZWl2ZWRbaWRdID0gdHJ1ZTtcbiAgfVxuXG4gIHRoaXMuX2hhbmRsZVNlbmQoYWNrKTtcbn07XG5cbi8vIENhbGN1bGF0ZXMgdGhlIG5leHQgQUNLIG51bWJlciwgZ2l2ZW4gY2h1bmtzLlxuUmVsaWFibGUucHJvdG90eXBlLl9jYWxjdWxhdGVOZXh0QWNrID0gZnVuY3Rpb24oaWQpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9pbmNvbWluZ1tpZF07XG4gIHZhciBjaHVua3MgPSBkYXRhLmNodW5rcztcbiAgZm9yICh2YXIgaSA9IDAsIGlpID0gY2h1bmtzLmxlbmd0aDsgaSA8IGlpOyBpICs9IDEpIHtcbiAgICAvLyBUaGlzIGNodW5rIGlzIG1pc3NpbmchISEgQmV0dGVyIEFDSyBmb3IgaXQuXG4gICAgaWYgKGNodW5rc1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBkYXRhLmFja1syXSA9IGk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGRhdGEuYWNrWzJdID0gY2h1bmtzLmxlbmd0aDtcbn07XG5cbi8vIFNlbmRzIHRoZSBuZXh0IHdpbmRvdyBvZiBjaHVua3MuXG5SZWxpYWJsZS5wcm90b3R5cGUuX3NlbmRXaW5kb3dlZENodW5rcyA9IGZ1bmN0aW9uKGlkKSB7XG4gIHV0aWwubG9nKCdzZW5kV2luZG93ZWRDaHVua3MgZm9yOiAnLCBpZCk7XG4gIHZhciBkYXRhID0gdGhpcy5fb3V0Z29pbmdbaWRdO1xuICB2YXIgY2ggPSBkYXRhLmNodW5rcztcbiAgdmFyIGNodW5rcyA9IFtdO1xuICB2YXIgbGltaXQgPSBNYXRoLm1pbihkYXRhLmFjayArIHRoaXMuX3dpbmRvdywgY2gubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IGRhdGEuYWNrOyBpIDwgbGltaXQ7IGkgKz0gMSkge1xuICAgIGlmICghY2hbaV0uc2VudCB8fCBpID09PSBkYXRhLmFjaykge1xuICAgICAgY2hbaV0uc2VudCA9IHRydWU7XG4gICAgICBjaHVua3MucHVzaChbJ2NodW5rJywgaWQsIGksIGNoW2ldLnBheWxvYWRdKTtcbiAgICB9XG4gIH1cbiAgaWYgKGRhdGEuYWNrICsgdGhpcy5fd2luZG93ID49IGNoLmxlbmd0aCkge1xuICAgIGNodW5rcy5wdXNoKFsnZW5kJywgaWQsIGNoLmxlbmd0aF0pXG4gIH1cbiAgY2h1bmtzLl9tdWx0aXBsZSA9IHRydWU7XG4gIHRoaXMuX2hhbmRsZVNlbmQoY2h1bmtzKTtcbn07XG5cbi8vIFB1dHMgdG9nZXRoZXIgYSBtZXNzYWdlIGZyb20gY2h1bmtzLlxuUmVsaWFibGUucHJvdG90eXBlLl9jb21wbGV0ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gIHV0aWwubG9nKCdDb21wbGV0ZWQgY2FsbGVkIGZvcicsIGlkKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgY2h1bmtzID0gdGhpcy5faW5jb21pbmdbaWRdLmNodW5rcztcbiAgdmFyIGJsID0gbmV3IEJsb2IoY2h1bmtzKTtcbiAgdXRpbC5ibG9iVG9BcnJheUJ1ZmZlcihibCwgZnVuY3Rpb24oYWIpIHtcbiAgICBzZWxmLm9ubWVzc2FnZSh1dGlsLnVucGFjayhhYikpO1xuICB9KTtcbiAgZGVsZXRlIHRoaXMuX2luY29taW5nW2lkXTtcbn07XG5cbi8vIFVwcyBiYW5kd2lkdGggbGltaXQgb24gU0RQLiBNZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIG9mZmVyL2Fuc3dlci5cblJlbGlhYmxlLmhpZ2hlckJhbmR3aWR0aFNEUCA9IGZ1bmN0aW9uKHNkcCkge1xuICAvLyBBUyBzdGFuZHMgZm9yIEFwcGxpY2F0aW9uLVNwZWNpZmljIE1heGltdW0uXG4gIC8vIEJhbmR3aWR0aCBudW1iZXIgaXMgaW4ga2lsb2JpdHMgLyBzZWMuXG4gIC8vIFNlZSBSRkMgZm9yIG1vcmUgaW5mbzogaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjMjMyNy50eHRcblxuICAvLyBDaHJvbWUgMzErIGRvZXNuJ3Qgd2FudCB1cyBtdW5naW5nIHRoZSBTRFAsIHNvIHdlJ2xsIGxldCB0aGVtIGhhdmUgdGhlaXJcbiAgLy8gd2F5LlxuICB2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci5hcHBWZXJzaW9uLm1hdGNoKC9DaHJvbWVcXC8oLio/KSAvKTtcbiAgaWYgKHZlcnNpb24pIHtcbiAgICB2ZXJzaW9uID0gcGFyc2VJbnQodmVyc2lvblsxXS5zcGxpdCgnLicpLnNoaWZ0KCkpO1xuICAgIGlmICh2ZXJzaW9uIDwgMzEpIHtcbiAgICAgIHZhciBwYXJ0cyA9IHNkcC5zcGxpdCgnYj1BUzozMCcpO1xuICAgICAgdmFyIHJlcGxhY2UgPSAnYj1BUzoxMDI0MDAnOyAvLyAxMDAgTWJwc1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRzWzBdICsgcmVwbGFjZSArIHBhcnRzWzFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZHA7XG59O1xuXG4vLyBPdmVyd3JpdHRlbiwgdHlwaWNhbGx5LlxuUmVsaWFibGUucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1zZykge307XG5cbm1vZHVsZS5leHBvcnRzLlJlbGlhYmxlID0gUmVsaWFibGU7XG4iLCJ2YXIgQmluYXJ5UGFjayA9IHJlcXVpcmUoJ2pzLWJpbmFyeXBhY2snKTtcblxudmFyIHV0aWwgPSB7XG4gIGRlYnVnOiBmYWxzZSxcbiAgXG4gIGluaGVyaXRzOiBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvcjtcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGV4dGVuZDogZnVuY3Rpb24oZGVzdCwgc291cmNlKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZihzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBkZXN0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH0sXG4gIHBhY2s6IEJpbmFyeVBhY2sucGFjayxcbiAgdW5wYWNrOiBCaW5hcnlQYWNrLnVucGFjayxcbiAgXG4gIGxvZzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh1dGlsLmRlYnVnKSB7XG4gICAgICB2YXIgY29weSA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29weVtpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIH1cbiAgICAgIGNvcHkudW5zaGlmdCgnUmVsaWFibGU6ICcpO1xuICAgICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgY29weSk7XG4gICAgfVxuICB9LFxuXG4gIHNldFplcm9UaW1lb3V0OiAoZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICAgdmFyIHRpbWVvdXRzID0gW107XG4gICAgdmFyIG1lc3NhZ2VOYW1lID0gJ3plcm8tdGltZW91dC1tZXNzYWdlJztcblxuICAgIC8vIExpa2Ugc2V0VGltZW91dCwgYnV0IG9ubHkgdGFrZXMgYSBmdW5jdGlvbiBhcmd1bWVudC5cdCBUaGVyZSdzXG4gICAgLy8gbm8gdGltZSBhcmd1bWVudCAoYWx3YXlzIHplcm8pIGFuZCBubyBhcmd1bWVudHMgKHlvdSBoYXZlIHRvXG4gICAgLy8gdXNlIGEgY2xvc3VyZSkuXG4gICAgZnVuY3Rpb24gc2V0WmVyb1RpbWVvdXRQb3N0TWVzc2FnZShmbikge1xuICAgICAgdGltZW91dHMucHVzaChmbik7XG4gICAgICBnbG9iYWwucG9zdE1lc3NhZ2UobWVzc2FnZU5hbWUsICcqJyk7XG4gICAgfVx0XHRcblxuICAgIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5zb3VyY2UgPT0gZ2xvYmFsICYmIGV2ZW50LmRhdGEgPT0gbWVzc2FnZU5hbWUpIHtcbiAgICAgICAgaWYgKGV2ZW50LnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lb3V0cy5sZW5ndGgpIHtcbiAgICAgICAgICB0aW1lb3V0cy5zaGlmdCgpKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGhhbmRsZU1lc3NhZ2UsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZ2xvYmFsLmF0dGFjaEV2ZW50KSB7XG4gICAgICBnbG9iYWwuYXR0YWNoRXZlbnQoJ29ubWVzc2FnZScsIGhhbmRsZU1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gc2V0WmVyb1RpbWVvdXRQb3N0TWVzc2FnZTtcbiAgfSh0aGlzKSksXG4gIFxuICBibG9iVG9BcnJheUJ1ZmZlcjogZnVuY3Rpb24oYmxvYiwgY2Ipe1xuICAgIHZhciBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgZnIub25sb2FkID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgICBjYihldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgfTtcbiAgICBmci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgfSxcbiAgYmxvYlRvQmluYXJ5U3RyaW5nOiBmdW5jdGlvbihibG9iLCBjYil7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgIGNiKGV2dC50YXJnZXQucmVzdWx0KTtcbiAgICB9O1xuICAgIGZyLnJlYWRBc0JpbmFyeVN0cmluZyhibG9iKTtcbiAgfSxcbiAgYmluYXJ5U3RyaW5nVG9BcnJheUJ1ZmZlcjogZnVuY3Rpb24oYmluYXJ5KSB7XG4gICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpbmFyeS5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBieXRlQXJyYXlbaV0gPSBiaW5hcnkuY2hhckNvZGVBdChpKSAmIDB4ZmY7XG4gICAgfVxuICAgIHJldHVybiBieXRlQXJyYXkuYnVmZmVyO1xuICB9LFxuICByYW5kb21Ub2tlbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMik7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
