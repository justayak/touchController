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

    if(isTouchDevice() || true) {
        var diameter = 210;
        document.write("<style>.touchController { " +
            "width:"+diameter+"px;height:"+diameter+"px;border:2px solid black;position:absolute;border-radius:50%;" +
            " } .innerTouchController {" +
            "width:5px;height:5px;margin-left:auto;margin-right:auto;margin-top:"+(Math.ceil(diameter/2))+"px;background-color:black;" +
            "}</style>");
        function CircleController(domid, position) {
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

            this.degree = -1;
            this.pressed = false;
            this.x = 0;
            this.y = 0;
            var self = this;

            function handleStart(e) {
                self.pressed = true;
                e.preventDefault();
                self.degree = e.changedTouches[0].screenX;
            }

            function handleEnd(e) {
                self.pressed = false;
                e.preventDefault();
                self.degree = 10;
            }

            function handleMove(e) {
                e.preventDefault();
                self.degree = e.changedTouches[0].screenX;
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

        CircleController.prototype.isPressed = function(){
            return this.pressed;
        };

        CircleController.prototype.getDegree = function(){
            return this.degree + " " + this.x + " " + this.y;
        };

        return {
            CircleController: CircleController,
            isTouchDevice: true
        };
    } else {
        return {
            isTouchDevice : false
        }
    }
}();