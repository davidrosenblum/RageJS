# RageJS
JavaScript game library for the HTML-5 canvas.

## Browser Requirements
 ES6 compatible browser (must support...)
* __HTML5 canvas__ element
* __WebGL 2D Rendering Context__ canvas context
* __class__ keyword
*  __const__ keyword
* __let__ keyword
* __for ... of__ loops


## Script Import
Download the javascript file (rage.min.js) and place it in the __head__ of your HTML page.
```html
<script src="/path/to/rage.min.js"></script>
```
After importing the script, the library is bound to the __rage__ namespace.
```javascript
// this should display true if the import was successful
console.log("Namespace exists? " + (typeof rage === "object"));
console.log("Canvas supported? " + (rage.isSupported());
```

## Canvas Setup
```javascript
// First we need to initialize the library's canvas and place it into the DOM

// initialize the stage to an HTMLElement
rage.init(document.querySelector("#canvas-container"));

// or use a CSS selector
rage.init("#canvas-container");

// width, height, and callback arguments are optional
rage.init("#canvas-container", WIDTH, HEIGHT, () => console.log("Initialized!"));
```