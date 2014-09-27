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


    var diameter = 175;
    var btnDiameter = 65;
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

    // =============== ANALOG STICK =================

    function AnalogStick(domid, position) {
        var el = document.getElementById(domid);
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

        function handleStart(e) {
            self.pressed = true;
            e.preventDefault();
            self.fx = e.changedTouches[0].screenX;
            self.fy = e.changedTouches[0].screenY - topTouchOffset;
        }

        function handleEnd(e) {
            self.pressed = false;
            e.preventDefault();
        }

        function handleMove(e) {
            e.preventDefault();
            self.fx = e.changedTouches[0].screenX;
            self.fy = e.changedTouches[0].screenY - topTouchOffset;
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
    }

    AnalogStick.prototype.isPressed = function(){
        return this.pressed;
    };

    AnalogStick.prototype.getDegree = function(){
        return getDegree(this.x, this.y, this.fx, this.fy);
    };

    // =============== D STICK =================

    function DPad(domid, position){
        AnalogStick.call(this, domid,position);
    }

    DPad.prototype = Object.create(AnalogStick.prototype);

    DPad.UP = 0;
    DPad.DOWN = 1;
    DPad.LEFT = 2;
    DPad.RIGHT = 3;
    DPad.NONE = 4;

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

    // =============== BUTTON =================

    function Button(domid, name, position) {
        var el = document.getElementById(domid);
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

        var id = "touchBtn" + nextID++;
        el.innerHTML = '<div style="'+
            style+
            '" id="'+ id
            +'" class="touchBtn"><div class="touchBtnTxt">' + name +'</div></div>';

        var self = this;

        function handleStart(e) {
            self.pressed = true;
            if (self.onClick !== null) {
                self.onClick.call(self);
            }
            document.getElementById(id).className = "touchBtn pressed";
            e.preventDefault();
        }

        function handleEnd(e) {
            self.pressed = false;
            document.getElementById(id).className = "touchBtn";
            e.preventDefault();
        }

        el.addEventListener("touchstart", handleStart, false);
        el.addEventListener("touchend", handleEnd, false);
        el.addEventListener("touchcancel", handleEnd, false);

        this.onClick = null;

    }

    Button.prototype.isPressed = function(){
        return this.pressed;
    };

    return {
        AnalogStick: AnalogStick,
        DPad: DPad,
        Button: Button,
        isTouchDevice: isTouchDevice()
    };
}();