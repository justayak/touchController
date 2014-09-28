TouchController

- Browser-Touch-Controller with Fallback to Keyboard

following HTML is given:
```html
<div id="dpad"></div>
<div id="analog"></div>
<div id="abtn"></div>
```

```javascript

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ANALOG STICK
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Create a analog stick that measures the user input
// in a 360Deg manner.
var analogStick = new TouchController.AnalogStick(
    "analog",
    {left: 100, bottom: 5}
);

// querying the analog stick:
var isPressed = analogStick.isPressed(); // BOOLEAN
var degree = analogStick.getDegree(); // DOUBLE

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~
// DPAD
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~



```