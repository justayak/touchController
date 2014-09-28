/**
 * Created by Julian on 9/26/2014.
 */
window.TouchController = function(){

    var nextID = 0;

    function isTouchDevice() {
        return (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
    }
    var _isTouchDevice = isTouchDevice();

    var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

    function getOffsetRect(elem) {
        // (1)
        var box = elem.getBoundingClientRect()

        var body = document.body
        var docElem = document.documentElement

        // (2)
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

        // (3)
        var clientTop = docElem.clientTop || body.clientTop || 0
        var clientLeft = docElem.clientLeft || body.clientLeft || 0

        // (4)
        var top  = box.top +  scrollTop - clientTop
        var left = box.left + scrollLeft - clientLeft

        return { top: Math.round(top), left: Math.round(left) }
    }

    var toDeg = 180 / Math.PI;
    function getDegree(x1,y1,x2,y2) {
        var x = x1-x2;
        var y = y1-y2;
        var theta = Math.atan2(-y, x);
        if (theta < 0) theta += 2 * Math.PI;
        return theta * toDeg;
    }

    var topTouchOffset = 0;
    if (isChrome) {
        topTouchOffset = 100;
    }

    // KEY LISTENING

    var keyToButton = {};

    var KEYS = {
        SPACE : "sp",
        ENTER : "en",
        ESC : "esc",
        Q : "q",
        E : "e"
    }

    function testAndExecKey(keycode, expectedKeycode, value) {
        if (expectedKeycode === keycode && value in keyToButton ){
            var btn = keyToButton[value];
            if (btn.onClick !== null) {
                btn.onClick.call(btn);
            }
            return true;
        }
        return false;
    }

    if (!_isTouchDevice){

        document.onkeyup = function(e){
            var keyCode = e.keyCode;
            // Do not listen on WASD
            if (keyCode !== 87 && keyCode !== 65 &&
                keyCode !== 83 && keyCode !== 68)
                if (!testAndExecKey(keyCode, 32, KEYS.SPACE))
                    if (!testAndExecKey(keyCode, 13, KEYS.ENTER))
                        if (!testAndExecKey(keyCode, 27, KEYS.ESC))
                            if (!testAndExecKey(keyCode, 81, KEYS.Q))
                                if (!testAndExecKey(keyCode, 69, KEYS.E))
                                {}
        }

    }

    // END KEY LISTENING


    var diameter = 140;
    var btnDiameter = 65;
    if (_isTouchDevice) {
        document.write("<style>.touchController{ " +
            "width:"+diameter+"px;height:"+diameter+"px;border:2px solid black;position:absolute;border-radius:50%;" +
            " } .innerTouchController {" +
            "width:5px;height:5px;margin-left:auto;margin-right:auto;margin-top:"+(Math.ceil(diameter/2))+
            "px;background-color:black;}" +
            ".touchBtn{position:absolute;border:2px solid black;position:absolute;border-radius:50%;" +
            "width:"+btnDiameter+"px;height:"+btnDiameter+"px;}" +
            ".touchBtnTxt{text-align:center;line-height:"+btnDiameter+"px;}" +
            ".touchBtn.pressed{background-color:cornflowerblue;}" +
            "</style>");
    }


    // =============== ANALOG STICK =================

    function AnalogStick(domid, position) {
        this.allowOnClick = true;
        var el = document.getElementById(domid);
        if (_isTouchDevice) {
            var style = "";
            if (typeof position === "undefined") {
                position = {};
            }
            if ("bottom" in position){
                style += "bottom:" +position.bottom + "px;";
            } else if ("top" in position) {
                style += "top:" +position.top + "px;";
            }
            if ("left" in position){
                style += "left:" +position.left + "px;";
            } else if ("right" in position) {
                style += "right:" +position.right + "px;";
            }

            var id = "touchController" + nextID++;
            el.innerHTML = '<div style="'+
                style+
                '" id="'+ id
                +'" class="touchController"><div class="innerTouchController"></div></div>';

            this.fx = -1;
            this.fy = -1;
            this.pressed = false;
            this.x = 0;
            this.y = 0;
            var self = this;

            this.onClick = null;
            this.onRelease = null;

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

            el.addEventListener("touchstart", handleStart, false);
            el.addEventListener("touchend", handleEnd, false);
            el.addEventListener("touchmove", handleMove, false);
            el.addEventListener("touchcancel", handleEnd, false);

            setTimeout(function(){
                var el = document.getElementById(id);
                var o = getOffsetRect(el);
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
        return getDegree(this.x, this.y, this.fx, this.fy);
    };

    // =============== D STICK =================

    var listener = -1;
    function DPad(domid, options){
        AnalogStick.call(this, domid,options);
        if ("WASDEvents" in options && options["WASDEvents"]){

            var CLICK_INTERVAL_IN_MS = 500;
            var INTERVAL_SPEED = 125;

            if (listener !== -1) {
                clearInterval(listener);
            }

            var self = this;
            var lastTimePressedMs = 0;
            var firstClick = true;
            var keyPressCheck = null;
            var iskeydown = false;
            var currentKey = -1;
            if (_isTouchDevice) {
                this.onClick = function(){
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
                }

                keyPressCheck = function() {
                    if (self.isPressed()) {
                        var now = new Date().getTime();
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

            } else {
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
                document.onkeyup = function(e){
                    var keyCode = e.keyCode;
                    if (keyCode === 87 || keyCode === 65 || keyCode === 68 || keyCode === 83) {
                        keyPressed[""+keyCode] = false;
                        if (!keyPressed["87"] && !keyPressed["65"] && !keyPressed["68"] && !keyPressed["83"]){
                            self.keyDirection = DPad.NONE;
                            iskeydown = false;
                            firstClick = true;
                        }
                    }
                };

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

    if (_isTouchDevice) {
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
        }
    }




    // =============== BUTTON =================

    /**
     *
     * @param domid
     * @param name
     * @param options
     * @constructor
     */
    function Button(domid, name, options) {
        var el = document.getElementById(domid);
        if (_isTouchDevice){
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

            var self = this;

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

            el.addEventListener("touchstart", handleStart, false);
            el.addEventListener("touchend", handleEnd, false);
            el.addEventListener("touchcancel", handleCancel, false);
        } else {
            // NON-TOUCH-DEVICE
            el.parentNode.removeChild(el);
            if ("key" in options) {
                keyToButton[options["key"]] = this;
            }
        }
        this.onClick = null;
    }

    return {
        KEYS : KEYS,
        AnalogStick: AnalogStick,
        DPad: DPad,
        Button: Button,
        isTouchDevice: _isTouchDevice
    };
}();