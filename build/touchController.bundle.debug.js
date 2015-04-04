!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.TouchController=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";

var Utils = require('./utils');

function AnalogStick(domid, position) {

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

module.exports = AnalogStick;
},{"./utils":7}],2:[function(require,module,exports){
/**
 * Created by Julian on 4/4/2015.
 */
"use strict";
var Utils = require('./utils.js');
var KeyboardController = require('./keyboardController.js');

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

require('./touchController.js');
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
},{"./AnalogStick.js":1,"./Button.js":2,"./DPad.js":3,"./KEYS.js":4,"./touchController.js":6,"./utils.js":7}],7:[function(require,module,exports){
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
},{}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcQmFrYVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImxpYlxcQW5hbG9nU3RpY2suanMiLCJsaWJcXEJ1dHRvbi5qcyIsImxpYlxcRFBhZC5qcyIsImxpYlxcS0VZUy5qcyIsImxpYlxca2V5Ym9hcmRDb250cm9sbGVyLmpzIiwibGliXFx0b3VjaENvbnRyb2xsZXIuanMiLCJsaWJcXHV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuZnVuY3Rpb24gQW5hbG9nU3RpY2soZG9taWQsIHBvc2l0aW9uKSB7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVN0YXJ0KGUpIHtcclxuICAgICAgICBzZWxmLnByZXNzZWQgPSB0cnVlO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZWxmLmZ4ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5zY3JlZW5YO1xyXG4gICAgICAgIHNlbGYuZnkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblkgLSB0b3BUb3VjaE9mZnNldDtcclxuICAgICAgICBpZiAoc2VsZi5hbGxvd09uQ2xpY2sgJiYgc2VsZi5vbkNsaWNrICE9PSBudWxsKSBzZWxmLm9uQ2xpY2suY2FsbChzZWxmKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVFbmQoZSkge1xyXG4gICAgICAgIHNlbGYucHJlc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAoc2VsZi5hbGxvd09uQ2xpY2sgJiYgc2VsZi5vblJlbGVhc2UgIT09IG51bGwpIHNlbGYub25SZWxlYXNlLmNhbGwoc2VsZik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlTW92ZShlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNlbGYuZnggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLnNjcmVlblg7XHJcbiAgICAgICAgc2VsZi5meSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uc2NyZWVuWSAtIHRvcFRvdWNoT2Zmc2V0O1xyXG4gICAgICAgIGlmIChzZWxmLmFsbG93T25DbGljayAmJiBzZWxmLm9uQ2xpY2sgIT09IG51bGwpIHNlbGYub25DbGljay5jYWxsKHNlbGYpO1xyXG4gICAgfVxyXG4gICAgLy8gPT09PT09PT09PT09IEggRSBMIFAgRSBSICBGIFUgTiBDIFQgSSBPIE4gUyA9PT09PT09PT09PT1cclxuXHJcbiAgICB0aGlzLmFsbG93T25DbGljayA9IHRydWU7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkb21pZCk7XHJcbiAgICB2YXIgc3R5bGUgPSBcIlwiO1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzLCBpZDtcclxuICAgIHZhciBkaWFtZXRlciA9IFV0aWxzLmRpYW1ldGVyKCk7XHJcbiAgICBpZiAoVXRpbHMuaXNUb3VjaERldmljZSgpKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFwiYm90dG9tXCIgaW4gcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgc3R5bGUgKz0gXCJib3R0b206XCIgK3Bvc2l0aW9uLmJvdHRvbSArIFwicHg7XCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcInRvcFwiIGluIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHN0eWxlICs9IFwidG9wOlwiICtwb3NpdGlvbi50b3AgKyBcInB4O1wiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXCJsZWZ0XCIgaW4gcG9zaXRpb24pe1xyXG4gICAgICAgICAgICBzdHlsZSArPSBcImxlZnQ6XCIgK3Bvc2l0aW9uLmxlZnQgKyBcInB4O1wiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXCJyaWdodFwiIGluIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHN0eWxlICs9IFwicmlnaHQ6XCIgK3Bvc2l0aW9uLnJpZ2h0ICsgXCJweDtcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWQgPSBVdGlscy5uZXdJZCgpO1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IHN0eWxlPVwiJytcclxuICAgICAgICAgICAgc3R5bGUrXHJcbiAgICAgICAgICAgICdcIiBpZD1cIicrIGlkXHJcbiAgICAgICAgICAgICsnXCIgY2xhc3M9XCJ0b3VjaENvbnRyb2xsZXJcIj48ZGl2IGNsYXNzPVwiaW5uZXJUb3VjaENvbnRyb2xsZXJcIj48L2Rpdj48L2Rpdj4nO1xyXG5cclxuICAgICAgICB0aGlzLmZ4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5meSA9IC0xO1xyXG4gICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMueCA9IDA7XHJcbiAgICAgICAgdGhpcy55ID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gbnVsbDtcclxuICAgICAgICB0aGlzLm9uUmVsZWFzZSA9IG51bGw7XHJcblxyXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGhhbmRsZVN0YXJ0LCBmYWxzZSk7XHJcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIGhhbmRsZUVuZCwgZmFsc2UpO1xyXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgaGFuZGxlTW92ZSwgZmFsc2UpO1xyXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCBoYW5kbGVFbmQsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgICAgIHZhciBvID0gVXRpbHMuZ2V0T2Zmc2V0UmVjdChlbCk7XHJcbiAgICAgICAgICAgIHNlbGYueCA9IG8ubGVmdCArIE1hdGguY2VpbChkaWFtZXRlci8yKTtcclxuICAgICAgICAgICAgc2VsZi55ID0gby50b3AgKyBNYXRoLmNlaWwoZGlhbWV0ZXIvMik7XHJcbiAgICAgICAgfSwxMDApO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTk9OLVRPVUNILURFVklDRVxyXG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFuYWxvZ1N0aWNrOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XHJcbnZhciBLZXlib2FyZENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2tleWJvYXJkQ29udHJvbGxlci5qcycpO1xyXG5cclxuZnVuY3Rpb24gQnV0dG9uKGRvbWlkLCBuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAvLyA9PT09PT09PT09PT0gSCBFIEwgUCBFIFIgIEYgVSBOIEMgVCBJIE8gTiBTID09PT09PT09PT09PVxyXG4gICAgZnVuY3Rpb24gaGFuZGxlU3RhcnQoZSkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jbGFzc05hbWUgPSBcInRvdWNoQnRuIHByZXNzZWRcIjtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRW5kKGUpIHtcclxuICAgICAgICBpZiAoc2VsZi5vbkNsaWNrICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHNlbGYub25DbGljay5jYWxsKHNlbGYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2xhc3NOYW1lID0gXCJ0b3VjaEJ0blwiO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVDYW5jZWwoZSl7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNsYXNzTmFtZSA9IFwidG91Y2hCdG5cIjtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9XHJcbiAgICAvLyA9PT09PT09PT09PT0gSCBFIEwgUCBFIFIgIEYgVSBOIEMgVCBJIE8gTiBTID09PT09PT09PT09PVxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRvbWlkKTtcclxuICAgIHZhciBrZXlUb0J1dHRvbiA9IEtleWJvYXJkQ29udHJvbGxlci5rZXlUb0J1dHRvbigpO1xyXG4gICAgaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xyXG4gICAgICAgIHZhciBzdHlsZSA9IFwiXCI7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFwiYm90dG9tXCIgaW4gb3B0aW9ucyl7XHJcbiAgICAgICAgICAgIHN0eWxlICs9IFwiYm90dG9tOlwiICtvcHRpb25zLmJvdHRvbSArIFwicHg7XCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcInRvcFwiIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgc3R5bGUgKz0gXCJ0b3A6XCIgK29wdGlvbnMudG9wICsgXCJweDtcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFwibGVmdFwiIGluIG9wdGlvbnMpe1xyXG4gICAgICAgICAgICBzdHlsZSArPSBcImxlZnQ6XCIgK29wdGlvbnMubGVmdCArIFwicHg7XCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcInJpZ2h0XCIgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBzdHlsZSArPSBcInJpZ2h0OlwiICtvcHRpb25zLnJpZ2h0ICsgXCJweDtcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpZCA9IFwidG91Y2hCdG5cIiArIG5leHRJRCsrO1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IHN0eWxlPVwiJytcclxuICAgICAgICAgICAgc3R5bGUrXHJcbiAgICAgICAgICAgICdcIiBpZD1cIicrIGlkXHJcbiAgICAgICAgICAgICsnXCIgY2xhc3M9XCJ0b3VjaEJ0blwiPjxkaXYgY2xhc3M9XCJ0b3VjaEJ0blR4dFwiPicgKyBuYW1lICsnPC9kaXY+PC9kaXY+JztcclxuXHJcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgaGFuZGxlU3RhcnQsIGZhbHNlKTtcclxuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgaGFuZGxlRW5kLCBmYWxzZSk7XHJcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIGhhbmRsZUNhbmNlbCwgZmFsc2UpO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTk9OIFRPVUNIIERFVklDRVxyXG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1xyXG4gICAgICAgIGlmIChcImtleVwiIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAga2V5VG9CdXR0b25bb3B0aW9uc1tcImtleVwiXV0gPSB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMub25DbGljayA9IG51bGw7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XHJcbnZhciBLZXlib2FyZENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2tleWJvYXJkQ29udHJvbGxlci5qcycpO1xyXG52YXIgQW5hbG9nU3RpY2sgPSByZXF1aXJlKCcuL0FuYWxvZ1N0aWNrLmpzJyk7XHJcblxyXG52YXIgbGlzdGVuZXIgPSAtMTtcclxuXHJcbmZ1bmN0aW9uIERQYWQoZG9taWQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBDTElDS19JTlRFUlZBTF9JTl9NUyA9IDUwMDtcclxuICAgIHZhciBJTlRFUlZBTF9TUEVFRCA9IDEyNTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBsYXN0VGltZVByZXNzZWRNcyA9IDA7XHJcbiAgICB2YXIgZmlyc3RDbGljayA9IHRydWU7XHJcbiAgICB2YXIga2V5UHJlc3NDaGVjayA9IG51bGw7XHJcbiAgICB2YXIgaXNrZXlkb3duID0gZmFsc2U7XHJcbiAgICB2YXIgY3VycmVudEtleSA9IC0xO1xyXG5cclxuICAgIEFuYWxvZ1N0aWNrLmNhbGwodGhpcywgZG9taWQsb3B0aW9ucyk7XHJcbiAgICBpZiAoXCJXQVNERXZlbnRzXCIgaW4gb3B0aW9ucyAmJiBvcHRpb25zW1wiV0FTREV2ZW50c1wiXSl7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyICE9PSAtMSkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGxpc3RlbmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChVdGlscy5pc1RvdWNoRGV2aWNlKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5vbkNsaWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0Q2xpY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0VGltZVByZXNzZWRNcyA9IG5vdztcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdENsaWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzZWxmLmdldERpcmVjdGlvbigpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc2VsZi5nZXREaXJlY3Rpb24oKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuVVA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuRE9XTjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuTEVGVDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERQYWQuUklHSFQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLm9uUmVsZWFzZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICBmaXJzdENsaWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGtleVByZXNzQ2hlY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmlzUHJlc3NlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93IC0gbGFzdFRpbWVQcmVzc2VkTXMpID4gQ0xJQ0tfSU5URVJWQUxfSU5fTVMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc2VsZi5nZXREaXJlY3Rpb24oKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE5PVCBUT1VDSCBERVZJQ0VcclxuICAgICAgICAgICAgdmFyIGtleVByZXNzZWQgPSB7XHJcbiAgICAgICAgICAgICAgICBcIjg3XCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgXCI2NVwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIFwiNjhcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBcIjgzXCI6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleUNvZGUgPSBlLmtleUNvZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5Q29kZSA9PT0gODcgfHwga2V5Q29kZSA9PT0gNjUgfHwga2V5Q29kZSA9PT0gNjggfHwga2V5Q29kZSA9PT0gODMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50S2V5ID0ga2V5Q29kZTtcclxuICAgICAgICAgICAgICAgICAgICBrZXlQcmVzc2VkW1wiXCIra2V5Q29kZV0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYua2V5RGlyZWN0aW9uID0gY3VycmVudEtleTtcclxuICAgICAgICAgICAgICAgICAgICBpc2tleWRvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RDbGljaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0VGltZVByZXNzZWRNcyA9IG5vdztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RDbGljayA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleUNvZGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChub3cgLSBsYXN0VGltZVByZXNzZWRNcykgPiBDTElDS19JTlRFUlZBTF9JTl9NUykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWVQcmVzc2VkTXMgPSBub3c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleUNvZGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5VUDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25VcCAhPT0gbnVsbCkgc2VsZi5vblVwLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5ET1dOOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkRvd24gIT09IG51bGwpIHNlbGYub25Eb3duLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5MRUZUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbkxlZnQgIT09IG51bGwpIHNlbGYub25MZWZ0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRFBhZC5SSUdIVDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25SaWdodCAhPT0gbnVsbCkgc2VsZi5vblJpZ2h0LmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBLZXlib2FyZENvbnRyb2xsZXIub25XQVNEVXAoZG9taWQsIGZ1bmN0aW9uIChrZXlDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5Q29kZSA9PT0gODcgfHwga2V5Q29kZSA9PT0gNjUgfHwga2V5Q29kZSA9PT0gNjggfHwga2V5Q29kZSA9PT0gODMpIHtcclxuICAgICAgICAgICAgICAgICAgICBrZXlQcmVzc2VkW1wiXCIra2V5Q29kZV0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWtleVByZXNzZWRbXCI4N1wiXSAmJiAha2V5UHJlc3NlZFtcIjY1XCJdICYmICFrZXlQcmVzc2VkW1wiNjhcIl0gJiYgIWtleVByZXNzZWRbXCI4M1wiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYua2V5RGlyZWN0aW9uID0gRFBhZC5OT05FO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc2tleWRvd24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RDbGljayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAga2V5UHJlc3NDaGVjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlza2V5ZG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKG5vdyAtIGxhc3RUaW1lUHJlc3NlZE1zKSA+IENMSUNLX0lOVEVSVkFMX0lOX01TKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lUHJlc3NlZE1zID0gbm93O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN1cnJlbnRLZXkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlVQOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uVXAgIT09IG51bGwpIHNlbGYub25VcC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkRPV046XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25Eb3duICE9PSBudWxsKSBzZWxmLm9uRG93bi5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLkxFRlQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYub25MZWZ0ICE9PSBudWxsKSBzZWxmLm9uTGVmdC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEUGFkLlJJR0hUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uUmlnaHQgIT09IG51bGwpIHNlbGYub25SaWdodC5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdGVuZXIgPSBzZXRJbnRlcnZhbChrZXlQcmVzc0NoZWNrLCBJTlRFUlZBTF9TUEVFRCk7XHJcblxyXG4gICAgICAgIHRoaXMub25VcCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5vbkRvd24gPSBudWxsO1xyXG4gICAgICAgIHRoaXMub25MZWZ0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLm9uUmlnaHQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgdGhpcy5rZXlEaXJlY3Rpb24gPSBEUGFkLk5PTkU7XHJcbn1cclxuXHJcbkRQYWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBbmFsb2dTdGljay5wcm90b3R5cGUpO1xyXG5cclxuRFBhZC5VUCA9IDg3O1xyXG5EUGFkLkRPV04gPSA4MztcclxuRFBhZC5MRUZUID0gNjU7XHJcbkRQYWQuUklHSFQgPSA2ODtcclxuRFBhZC5OT05FID0gLTE7XHJcblxyXG5pZiAoVXRpbHMuaXNUb3VjaERldmljZSgpKSB7XHJcbiAgICBEUGFkLnByb3RvdHlwZS5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGlmICh0aGlzLmlzUHJlc3NlZCgpKSB7XHJcbiAgICAgICAgICAgIHZhciBkZWcgPSB0aGlzLmdldERlZ3JlZSgpO1xyXG4gICAgICAgICAgICBpZiAoZGVnIDwgNDUgfHwgZGVnID49IDMxNSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5MRUZUO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRlZyA8IDMxNSAmJiBkZWcgPj0gMjI1KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5VUDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkZWcgPCAyMjUgJiYgZGVnID49IDEzNSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIERQYWQuUklHSFQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBhZC5ET1dOO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIERQYWQuTk9ORTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IGVsc2Uge1xyXG4gICAgRFBhZC5wcm90b3R5cGUuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlEaXJlY3Rpb247XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERQYWQ7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgSnVsaWFuIG9uIDQvNC8yMDE1LlxyXG4gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgU1BBQ0UgOiBcInNwXCIsXHJcbiAgICBFTlRFUiA6IFwiZW5cIixcclxuICAgIEVTQyA6IFwiZXNjXCIsXHJcbiAgICBRIDogXCJxXCIsXHJcbiAgICBFIDogXCJlXCJcclxufTsiLCIvKipcclxuICogQ3JlYXRlZCBieSBKdWxpYW4gb24gNC80LzIwMTUuXHJcbiAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcclxudmFyIEtFWVMgPSByZXF1aXJlKCcuL0tFWVMuanMnKTtcclxuXHJcbnZhciBfa2V5VG9CdXR0b24gPSB7fTtcclxuXHJcbmZ1bmN0aW9uIHRlc3RBbmRFeGVjS2V5KGtleWNvZGUsIGV4cGVjdGVkS2V5Y29kZSwgdmFsdWUpIHtcclxuICAgIGlmIChleHBlY3RlZEtleWNvZGUgPT09IGtleWNvZGUgJiYgdmFsdWUgaW4gX2tleVRvQnV0dG9uKSB7XHJcbiAgICAgICAgdmFyIGJ0biA9IF9rZXlUb0J1dHRvblt2YWx1ZV07XHJcbiAgICAgICAgaWYgKGJ0bi5vbkNsaWNrICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGJ0bi5vbkNsaWNrLmNhbGwoYnRuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmlmICghVXRpbHMuaXNUb3VjaERldmljZSgpKSB7XHJcblxyXG4gICAgZG9jdW1lbnQub25rZXl1cCA9IGZ1bmN0aW9uIChlKSB7XHJcblxyXG4gICAgICAgIHZhciBrZXlDb2RlID0gZS5rZXlDb2RlO1xyXG5cclxuICAgICAgICAvLyBpZ25vcmUgV0FTRFxyXG4gICAgICAgIGlmIChrZXlDb2RlICE9PSA4NyAmJiBrZXlDb2RlICE9PSA2NSAmJlxyXG4gICAgICAgICAgICBrZXlDb2RlICE9PSA4MyAmJiBrZXlDb2RlICE9PSA2OCkge1xyXG4gICAgICAgICAgICBpZiAoIXRlc3RBbmRFeGVjS2V5KGtleUNvZGUsIDMyLCBLRVlTLlNQQUNFKSlcclxuICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgMTMsIEtFWVMuRU5URVIpKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgMjcsIEtFWVMuRVNDKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZXN0QW5kRXhlY0tleShrZXlDb2RlLCA4MSwgS0VZUy5RKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGVzdEFuZEV4ZWNLZXkoa2V5Q29kZSwgNjksIEtFWVMuRSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIEwgPSBfd2FzZENhbGxiYWNrcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBfd2FzZENhbGxiYWNrc1tpXS5jYWxsYmFjayhrZXlDb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufVxyXG5cclxudmFyIF93YXNkQ2FsbGJhY2tzID0gW107XHJcblxyXG5mdW5jdGlvbiBkZWxldGVCeUlkKGRvbUlkLCBsaXN0KSB7XHJcbiAgICB2YXIgaSA9IDAsIEwgPSBsaXN0Lmxlbmd0aDtcclxuICAgIGZvciAoOyBpIDwgTDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGxpc3RbaV0uaWQgPT09IGRvbUlkKSB7XHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgd2lsbCBiZSBjYWxsZWQgd2hlbiBhIFdBU0Qga2V5IHdhcyBwcmVzc2VkIGFuZCBpcyB1cCBhZ2FpblxyXG4gICAgICogQHBhcmFtIGRvbUlkIHRvIG1ha2UgaXQgcmVtb3ZhYmxlXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sge2Z1bmN0aW9ufVxyXG4gICAgICovXHJcbiAgICBvbldBU0RVcDogZnVuY3Rpb24gKGRvbUlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGRlbGV0ZUJ5SWQoZG9tSWQsIF93YXNkQ2FsbGJhY2tzKTtcclxuICAgICAgICBfd2FzZENhbGxiYWNrcy5wdXNoKHtpZDogZG9tSWQsIGNhbGxiYWNrOiBjYWxsYmFja30pO1xyXG4gICAgfSxcclxuXHJcbiAgICBrZXlUb0J1dHRvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBfa2V5VG9CdXR0b247XHJcbiAgICB9XHJcblxyXG59OyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxucmVxdWlyZSgnLi90b3VjaENvbnRyb2xsZXIuanMnKTtcclxudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xyXG52YXIgQW5hbG9nU3RpY2sgPSByZXF1aXJlKCcuL0FuYWxvZ1N0aWNrLmpzJyk7XHJcbnZhciBEUGFkID0gcmVxdWlyZSgnLi9EUGFkLmpzJyk7XHJcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbi5qcycpO1xyXG52YXIgS0VZUyA9IHJlcXVpcmUoJy4vS0VZUy5qcycpO1xyXG5cclxudmFyIF9kaWFtZXRlciA9IFV0aWxzLmRpYW1ldGVyKCk7XHJcbnZhciBfYnRuRGlhbWV0ZXIgPSBVdGlscy5idG5EaWFtZXRlcigpO1xyXG5cclxuaWYgKFV0aWxzLmlzVG91Y2hEZXZpY2UoKSkge1xyXG4gICAgZG9jdW1lbnQud3JpdGUoXCI8c3R5bGUgaWQ9J3RvdWNoQ29udHJvbGxlclN0eWxlJz4udG91Y2hDb250cm9sbGVyeyBcIiArXHJcbiAgICAgICAgXCJ3aWR0aDpcIitfZGlhbWV0ZXIrXCJweDtoZWlnaHQ6XCIrX2RpYW1ldGVyK1wicHg7Ym9yZGVyOjJweCBzb2xpZCBibGFjaztwb3NpdGlvbjphYnNvbHV0ZTtib3JkZXItcmFkaXVzOjUwJTtcIiArXHJcbiAgICAgICAgXCIgfSAuaW5uZXJUb3VjaENvbnRyb2xsZXIge1wiICtcclxuICAgICAgICBcIndpZHRoOjVweDtoZWlnaHQ6NXB4O21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87bWFyZ2luLXRvcDpcIisoTWF0aC5jZWlsKF9kaWFtZXRlci8yKSkrXHJcbiAgICAgICAgXCJweDtiYWNrZ3JvdW5kLWNvbG9yOmJsYWNrO31cIiArXHJcbiAgICAgICAgXCIudG91Y2hCdG57cG9zaXRpb246YWJzb2x1dGU7Ym9yZGVyOjJweCBzb2xpZCBibGFjaztwb3NpdGlvbjphYnNvbHV0ZTtib3JkZXItcmFkaXVzOjUwJTtcIiArXHJcbiAgICAgICAgXCJ3aWR0aDpcIitfYnRuRGlhbWV0ZXIrXCJweDtoZWlnaHQ6XCIrX2J0bkRpYW1ldGVyK1wicHg7fVwiICtcclxuICAgICAgICBcIi50b3VjaEJ0blR4dHt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDpcIitfYnRuRGlhbWV0ZXIrXCJweDt9XCIgK1xyXG4gICAgICAgIFwiLnRvdWNoQnRuLnByZXNzZWR7YmFja2dyb3VuZC1jb2xvcjpjb3JuZmxvd2VyYmx1ZTt9XCIgK1xyXG4gICAgICAgIFwiPC9zdHlsZT5cIik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHdlYXRoZXIgdGhlIGN1cnJlbnQgZGV2aWNlIGNhbiB1c2UgdG91Y2ggb3Igbm90XHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqL1xyXG4gICAgaXNUb3VjaERldmljZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBVdGlscy5pc1RvdWNoRGV2aWNlKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc3RyaXBzIGF3YXkgdGhlIGRlZmF1bHQgc3R5bGVcclxuICAgICAqL1xyXG4gICAgc3RyaXBTdHlsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvdWNoQ29udHJvbGxlclN0eWxlJyk7XHJcbiAgICAgICAgZWxlbWVudC5vdXRlckhUTUwgPSBcIlwiO1xyXG4gICAgfSxcclxuXHJcbiAgICBBbmFsb2dTdGljazogQW5hbG9nU3RpY2ssXHJcblxyXG4gICAgRFBhZDogRFBhZCxcclxuXHJcbiAgICBCdXR0b246IEJ1dHRvbixcclxuXHJcbiAgICBLRVlTOiBLRVlTXHJcblxyXG59OyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IEp1bGlhbiBvbiA0LzQvMjAxNS5cclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuZnVuY3Rpb24gaXNUb3VjaERldmljZSgpIHtcclxuICAgIHJldHVybiAoKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdylcclxuICAgICAgICB8fCAobmF2aWdhdG9yLk1heFRvdWNoUG9pbnRzID4gMClcclxuICAgICAgICB8fCAobmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMgPiAwKSk7XHJcbn1cclxuXHJcbnZhciBfaXNUb3VjaERldmljZSA9IGlzVG91Y2hEZXZpY2UoKTtcclxuXHJcbnZhciBfaXNDaHJvbWUgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignY2hyb21lJykgPiAtMTtcclxuXHJcbnZhciBfdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xyXG5cclxudmFyIF9jdXJyZW50SWQgPSAwO1xyXG5cclxudmFyIF90b3BUb3VjaE9mZnNldCA9IDA7XHJcbmlmIChfaXNDaHJvbWUpIHtcclxuICAgIF90b3BUb3VjaE9mZnNldCA9IDEwMDtcclxufVxyXG5cclxudmFyIF9kaWFtZXRlciA9IDE0MDtcclxudmFyIF9idG5EaWFtZXRlciA9IDY1O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgZGlhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gX2RpYW1ldGVyO1xyXG4gICAgfSxcclxuXHJcbiAgICBidG5EaWFtZXRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBfYnRuRGlhbWV0ZXI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2VuZXJhdGVzIGEgbmV3IHVuaXF1ZSBpZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgbmV3SWQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gXCJ0b3VjaENvbnRyb2xsZXJcIiArIF9jdXJyZW50SWQrKztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3Mgd2VhdGhlciB0aGUgZGV2aWNlIGNhbiB1c2UgdG91Y2ggb3Igbm90XHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgaXNUb3VjaERldmljZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBfaXNUb3VjaERldmljZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5lcyB0cnVlIHdoZW4gdGhlIHJlbmRlcmVyIGlzIENocm9tZVxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGlzQ2hyb21lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIF9pc0Nocm9tZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGVsZW1cclxuICAgICAqIEByZXR1cm5zIHt7dG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcn19XHJcbiAgICAgKi9cclxuICAgIGdldE9mZnNldFJlY3Q6IGZ1bmN0aW9uIChlbGVtKSB7XHJcbiAgICAgICAgLy8gKDEpXHJcbiAgICAgICAgdmFyIGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgICAgIC8vICgyKVxyXG4gICAgICAgIHZhciBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxUb3AgfHwgYm9keS5zY3JvbGxUb3A7XHJcbiAgICAgICAgdmFyIHNjcm9sbExlZnQgPSB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0IHx8IGJvZHkuc2Nyb2xsTGVmdDtcclxuICAgICAgICAvLyAoMylcclxuICAgICAgICB2YXIgY2xpZW50VG9wID0gZG9jRWxlbS5jbGllbnRUb3AgfHwgYm9keS5jbGllbnRUb3AgfHwgMDtcclxuICAgICAgICB2YXIgY2xpZW50TGVmdCA9IGRvY0VsZW0uY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMDtcclxuICAgICAgICAvLyAoNClcclxuICAgICAgICB2YXIgdG9wID0gYm94LnRvcCArIHNjcm9sbFRvcCAtIGNsaWVudFRvcDtcclxuICAgICAgICB2YXIgbGVmdCA9IGJveC5sZWZ0ICsgc2Nyb2xsTGVmdCAtIGNsaWVudExlZnQ7XHJcbiAgICAgICAgcmV0dXJuIHsgdG9wOiBNYXRoLnJvdW5kKHRvcCksIGxlZnQ6IE1hdGgucm91bmQobGVmdCkgfTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0cmFuc2Zvcm1zIHR3byBwb2ludHMgdG8gdGhlIGRlZ3JlZSBpbiBiZXR3ZWVuXHJcbiAgICAgKiBAcGFyYW0geDFcclxuICAgICAqIEBwYXJhbSB5MVxyXG4gICAgICogQHBhcmFtIHgyXHJcbiAgICAgKiBAcGFyYW0geTJcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldERlZ3JlZTogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcclxuICAgICAgICB2YXIgeCA9IHgxLXgyO1xyXG4gICAgICAgIHZhciB5ID0geTEteTI7XHJcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMigteSwgeCk7XHJcbiAgICAgICAgaWYgKHRoZXRhIDwgMCkgdGhldGEgKz0gMiAqIE1hdGguUEk7XHJcbiAgICAgICAgcmV0dXJuIHRoZXRhICogX3RvRGVnO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE5lZWRlZCBmb3Igc29tZSBvZmZzZXR0aW5nXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0b3BUb3VjaE9mZnNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBfdG9wVG91Y2hPZmZzZXQ7XHJcbiAgICB9XHJcblxyXG59OyJdfQ==
