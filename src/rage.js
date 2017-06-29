"use strict";

let rage = (function(){
	const 	AUTHOR = "David Rosenblum",
			VERSION = "1.0.0";

	let GLOBAL_STAGE = null; // initialized later

	let init = function(width, height, parent, callback){
		window.addEventListener("load", function(){
			wrap(GLOBAL_STAGE.canvas, "div", {"data-id": "canvas-container"}, parent);

			if(typeof callback === "function"){
				callback();
			}
		});
	};

	let wrap = function(element, wrapType=null, wrapAttributes=null, parent=null){
		wrapType = (typeof wrapType === "string") ? wrapType : "div";
		wrapAttributes = (typeof wrapAttributes === "object" && wrapAttributes) ? wrapAttributes : {};

		parent = (typeof parent === "string") ? document.querySelector(parent) : parent;
		parent = (parent instanceof window.HTMLElement) ? parent : document.body;

		let wrapper = document.createElement(wrapType);
		for(let attr in wrapAttributes){
			wrapper.setAttribute(attr, wrapAttributes[attr]);
		}

		wrapper.appendChild(element);
		parent.appendChild(wrapper);

		return wrapper;
	};

	let ajax = function(opts){
		opts = (!opts) ? {} : opts;

		let url = (typeof opts.url === "string") ? opts.url : window.location.href,
			method = (typeof opts.method === "string") ? opts.method.toUpperCase() : "GET",
			headers = (typeof opts.headers === "object" && opts.headers) ? opts.headers : {},
			data = (typeof opts.data !== "undefined") ? opts.data : null;

		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(this.readyState === 4 && typeof opts.callback === "function"){
				opts.callback(this.result, this.status);
			}
		};

		xhr.open(method, url, true);

		for(let h in headers){
			xhr.setRequestHeader(h, headers[h]);
		}

		xhr.send(data);
	};

	let isSupported = function(){
		return typeof window["WebGLRenderingContext"] !== "undefined";
	};

	let DisplayEvent = class DisplayEvent{
		constructor(type){
			this.type = type;
		}

		toString(){
			return "[object RageJS.DisplayEvent]";
		}
	};
	DisplayEvent.ANIM_UPDATE =			"anim_update";
	DisplayEvent.CLICK =				"click";
	DisplayEvent.HOVER_OVER =			"hover_over";
	DisplayEvent.HOVER_OFF =			"hover_off";
	DisplayEvent.RENDER_START = 		"render_start";
	DisplayEvent.RENDER_DONE = 			"render_done";
	DisplayEvent.RESIZE = 				"resize";
	DisplayEvent.REPOSITION = 			"resposition";
	DisplayEvent.LOAD = 				"load";
	DisplayEvent.ADDED_TO_STAGE = 		"added_to_stage";
	DisplayEvent.REMOVED_FROM_STAGE =	"removed_from_stage";

	let EventDispatcher = class EventDispatcher{
		constructor(){
			this._eventHandlers = {};
		}

		dispatchEvent(event){
			event.dispatcher = this;

			if(this.willTrigger(event.type)){
				for(let fn of this._eventHandlers[event.type]){
					fn(event);
				}
			}
		}

		on(eventType, handler){
			if(!this.willTrigger(eventType)){
				this._eventHandlers[eventType] = [];
			}

			this._eventHandlers[eventType].push(handler);
		}

		removeHandler(eventType, handler){
			let handlers = this._eventHandlers[eventType];
			if(handlers){
				for(let i = 0; i < handlers.length; i++){
					if(handlers[i] === handler){
						handlers.splice(i, 1);
						break;
					}
				}
			}
		}

		removeAllHandlers(eventType){
			if(this._eventHandlers[eventType]){
				delete this._eventHandlers[eventType];
			}
		}

		willTrigger(eventType){
			return typeof this._eventHandlers[eventType] !== "undefined";
		}

		toString(){
			return "[object RageJS.EventDispatcher]";
		}
	};

	let ImageData = class ImageData extends EventDispatcher{
		constructor(src){
			super();

			this.element = document.createElement("img");
			this.element.addEventListener("load", (evt) => {
				this.dispatchEvent(new DisplayEvent(DisplayEvent.LOAD));
			});
			this.element.setAttribute("src", src);
		}

		width(){
			return this.element.width;
		}

		height(){
			return this.element.height;
		}

		getImage(){
			return this.element;
		}

		toString(){
			return "[object RageJS.ImageData]";
		}
	};

	let AnimationData = class AnimationData{
		constructor(clipX, clipY, clipWidth, clipHeight){
			this.clipX = clipX;
			this.clipY = clipY;
			this.clipWidth = clipWidth;
			this.clipHeight = clipHeight;
		}

		toString(){
			return "[object RageJS.AnimationData]";
		}
	};

	let DisplayObject = class DisplayObject extends EventDispatcher{
		constructor(x=0, y=0, width=0, height=0){
			super();

			this._x = x;
			this._y = y;
			this._width = width;
			this._height = height;
			this.stage = GLOBAL_STAGE;

			this.visible = true;
			this.alpha = 1;

			this._parent = null;
			this._offsetX = 0;
			this._offsetY = 0;
		}

		render(){
			if(this.visible){
				this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_START));
				this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_DONE));
			}
		}

		hitTestObject(object){
			if(object instanceof DisplayObject){
				return (this.x <= object.right && object.x <= this.right && this.y <= object.bottom && object.y <= this.bottom);

			}
			return false;
		}

		hitTestGroup(group){
			for(let obj of group){
				if(this.hitTestObject(obj)){
					return obj;
				}
			}
			return null;
		}

		remove(){
			if(this.parent){
				this.parent.removeChild(this);
			}
		}

		setPosition(x, y){
			this.x = x;
			this.y = y;
		}

		setSize(width, height){
			this.width = width;
			this.height = height;
		}

		set x(x){
			this._x = (typeof x === "number" && !(isNaN(x))) ? x : this._x;
			this.dispatchEvent(new DisplayEvent(DisplayEvent.REPOSITION));
		}

		set y(y){
			this._y = (typeof y === "number" && !(isNaN(y))) ? y : this._y;
			this.dispatchEvent(new DisplayEvent(DisplayEvent.REPOSITION));
		}

		set width(width){
			this._width = (typeof width === "number" && !(isNaN(width))) ? width : this._width;
			this.dispatchEvent(new DisplayEvent(DisplayEvent.RESIZE));
		}

		set height(height){
			this._height = (typeof height === "number" && !(isNaN(height))) ? height : this._height;
			this.dispatchEvent(new DisplayEvent(DisplayEvent.RESIZE));
		}

		get x(){
			return this._x;
		}

		get y(){
			return this._y;
		}

		get width(){
			return this._width;
		}

		get height(){
			return this._height;
		}

		get parent(){
			return this._parent;
		}

		get offsetX(){
			return this._offsetX;
		}

		get offsetY(){
			return this._offsetY;
		}

		get centerX(){
			return this.x + this.width * 0.5;
		}

		get centerY(){
			return this.y + this.height * 0.5;
		}

		get right(){
			return this.x + this.width;
		}

		get bottom(){
			return this.y + this.height;
		}

		toString(){
			return "[object RageJS.DisplayObject]";
		}
	};

	let TextField = class TextField extends DisplayObject{
		constructor(x=0, y=0){
			super(x, y);

			this.fontFamily = "calibri";
			this.frontSize = "12px";
			this.fillColor = "white";
			this.strokeColor = "black";
			this.text = "";
		}

		render(){
			if(!this.visible){
				return;
			}

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_START));

			GLOBAL_STAGE.context.save();
			GLOBAL_STAGE.context.globalAlpha = this.alpha;
			GLOBAL_STAGE.context.fillStyle = this.fillColor;
			GLOBAL_STAGE.context.strokeStyle = this.strokeColor;
			GLOBAL_STAGE.context.font = this.font;
			GLOBAL_STAGE.context.fillText(this.text, this.x, this.y);
			GLOBAL_STAGE.context.strokeText(this.text, this.x, this.y);
			GLOBAL_STAGE.context.restore();

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_DONE));
		}

		setColors(fill, stroke){
			this.fillColor = fill;
			this.strokeColor = stroke;
		}

		get font(){
			return this.fontSize + " " + this.fontFamily;
		}

		toString(){
			return "[object RageJS.TextField]";
		}
	};

	let DisplayObjectContainer = class DisplayObjectContainer extends DisplayObject{
		constructor(x=0, y=0, width=0, height=0){
			super(x, y, width, height);

			this._children = new ArrayList();

			this.on(DisplayEvent.RENDER_START, () => this.renderChildren());
		}

		renderChildren(){
			this.forEachChild(obj => obj.render());
		}

		addChild(object){
			if(object instanceof DisplayObject && this._children.add(object)){
				object._parent = this;
				object.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_STAGE));
				return true;
			}
			return false;
		}

		addChildAt(object, index){
			if(object instanceof DisplayObject && this._children.addAt(object, index)){
				object._parent = this;
				object.dispatchEvent(new DisplayEvent(DisplayEvent.ADDED_TO_STAGE));
				return true;
			}
			return false;	
		}

		removeChild(object){
			if(this._children.remove(object)){
				object._parent = null;
				object.dispatchEvent(new DisplayEvent(DisplayEvent.REMOVED_FROM_STAGE));
				return object;
			}
			return null;
		}

		removeChildAt(index){
			let obj = this._children.removeAt(index);
			if(obj){
				obj._parent = null;
				object.dispatchEvent(new DisplayEvent(DisplayEvent.REMOVED_FROM_STAGE));
			}
			return obj;
		}

		swapChildren(object1, object2){
			return this._children.swap(object1, object2);
		}

		swapChildrenAt(index1, index2){
			return this._children.swapAt(index1, index2);	
		}

		getChildAt(index){
			return this._children.getAt(index);
		}

		forEachChild(fn){
			for(let i = 0; i < this.numChildren; i++){
				fn(this.getChildAt(i), i);
			}
		}

		get numChildren(){
			return this._children.size();
		}

		toString(){
			return "[object RageJS.DisplayObjectContainer]";
		}
	};

	let Stage = class Stage extends DisplayObjectContainer{
		constructor(x=0, y=0, width=550, height=400){
			super(x, y, width, height);

			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");

			this.animFrameRate = 30;
			this._framesUntilUpdate = this.animFrameRate;

			this.on(DisplayEvent.RESIZE, (evt) => evt.dispatcher.resize());

			this.resize();

			let renderLoop = (() => {
				this.context.clearRect(this.x, this.y, this.width, this.height);
				this.render();

				this._framesUntilUpdate--;
				if(this._framesUntilUpdate === 0){
					this._framesUntilUpdate = this.animFrameRate;
					this.dispatchEvent(new DisplayEvent(DisplayEvent.ANIM_UPDATE));
				}

				window.requestAnimationFrame(renderLoop);
			});
			renderLoop();
		}

		resize(){
			this.canvas.setAttribute("width", this.width);
			this.canvas.setAttribute("height", this.height);
		}

		toString(){
			return "[object RageJS.Stage]";
		}
	};

	let Sprite = class Sprite extends DisplayObjectContainer{
		constructor(image=null, x=0, y=0, width=0, height=0){
			super(x, y, width, height);

			this.imageData = null;
			if(typeof image === "string"){
				this.imageData = new ImageData(image);
			}
			else if(image instanceof ImageData){
				this.imageData = image;
			}

			this.imageData.on(DisplayEvent.LOAD, () => {
				this.autoSize();
				this.clipWidth = (this.clipWidth <= 0) ? this.imageData.width() : this.clipWidth;
				this.clipHeight = (this.clipHeight <= 0) ? this.imageData.height() : this.clipHeight;
			});

			this.clipX = 0;
			this.clipY = 0;
			this.clipWidth = this.width;
			this.clipHeight = this.height;
			this.clipEnabled = false;
		}

		render(){
			let img = this.getImage();

			if(!this.visible || !img){
				return;
			}

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_START));

			GLOBAL_STAGE.context.save();
			GLOBAL_STAGE.context.globalAlpha = this.alpha;

			if(!this.clipEnabled){
				GLOBAL_STAGE.context.drawImage(img, this.x, this.y, this.width, this.height);	
			}
			else{
				GLOBAL_STAGE.context.drawImage(img, this.clipX, this.clipY, this.clipWidth, this.clipHeight, this.x, this.y, this.width, this.height);
			}
			
			GLOBAL_STAGE.context.restore();

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_DONE));
		}

		autoSize(){
			this.width = (this.width <= 0) ? this.imageData.width() : this.width;
			this.height = (this.height <= 0) ? this.imageData.height() : this.height;
		}

		getImage(){
			return (this.imageData) ? this.imageData.getImage() : null;
		}

		toString(){
			return "[object RageJS.Sprite]";
		}
	};

	let MovieClip = class MovieClip extends Sprite{
		constructor(image=null, x=0, y=0, width=0, height=0){
			super(image, x, y, width, height);

			this.currentFrame = 0;
			this.currentAnimation = null;
			this.animations = {};
			this.animating = true;

			GLOBAL_STAGE.on(DisplayEvent.ANIM_UPDATE, (evt) => {
				if(this.animating){
					this.nextFrame();
				}
			});
		}

		render(){
			if(!this.visible){
				return;
			}


			let frame = this.getCurrentFrame(),
				img = this.getImage();

			if(!this.animating || !frame || !img){
				super.render();
				return;
			}

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_START));

			GLOBAL_STAGE.context.save();
			GLOBAL_STAGE.context.globalAlpha = this.alpha;	

			this.applyAnimationData(frame);

			GLOBAL_STAGE.context.drawImage(img, this.clipX, this.clipY, this.clipWidth, this.clipHeight, this.x, this.y, this.width, this.height);

			GLOBAL_STAGE.context.restore();

			this.dispatchEvent(new DisplayEvent(DisplayEvent.RENDER_DONE));
		}

		applyAnimationData(animData){
			if(animData instanceof AnimationData){
				this.clipX = animData.clipX;
				this.clipY = animData.clipY;
				this.clipWidth = animData.clipWidth;
				this.clipHeight = animData.clipHeight;
			}
		}

		playAnimation(name){
			if(typeof this.animations[name] !== "undefined"){
				this.currentAnimation = name;
			}
			else{
				console.warn(this + " does not have an animation " + name + ".");
			}
		}

		prevFrame(){
			this.currentFrame--;
			if(this.currentFrame < 0){
				this.currentFrame = (this.getCurrentAnimation()) ? (this.getCurrentAnimation().length - 1) : 0;
			}
		}

		nextFrame(){
			this.currentFrame++;
			if(this.currentFrame >= ((this.getCurrentAnimation()) ? this.getCurrentAnimation().length : 1)){
				this.currentFrame = 0;
			}
		}

		gotoAndPlay(frame){
			this.currentFrame = frame;
			this.animating = true;
		}

		gotoAndStop(frame){
			this.currentFrame = frame;
			this.animating = false;
		}

		setAnimation(name, frames){
			this.animations[name] = [];

			for(let frame of frames){
				if(frame instanceof AnimationData){
					this.animations[name].push(frame);
				}
				else{
					console.warn("Animation data ignored because it is not an instance of AnimationData.");
				}
			}
		}

		getCurrentFrame(){
			return (this.getCurrentAnimation()) ? this.getCurrentAnimation()[this.currentFrame] : null;
		}

		getCurrentAnimation(){
			return (this.animating && typeof this.animations[this.currentAnimation] !== "undefined") ? this.animations[this.currentAnimation] : null;
		}

		toString(){
			return "[object RageJS.MovieClip]";
		}
	};

	let GameObject = class GameObject extends MovieClip{
		constructor(opts=null){
			opts = (!opts) ? {} : opts

			super(opts.image, opts.x, opts.y, opts.width, opts.height);

			this._moveSpeed = (typeof opts.moveSpeed === "number") ? opts.moveSpeed : 1;
			this._facing = GameObject.FACING_RIGHT;
		}

		move(collidables=null, newFacing=null, bounds=null){
			if(typeof newFacing === "string"){
				this.facing = newFacing;
			}

			if(this.facing === GameObject.FACING_LEFT){
				this.moveLeft(collidables, bounds);
			}
			else if(this.facing === GameObject.FACING_RIGHT){
				this.moveRight(collidables, bounds);
			}
			else if(this.facing === GameObject.FACING_UP){
				this.moveUp(collidables, bounds);
			}
			else if(this.facing === GameObject.FACING_DOWN){
				this.moveDown(collidables, bounds);
			}
		}

		moveUp(collidables=null, bounds=null){
			this.y -= this.moveSpeed;

			if(collidables){
				let hit = this.hitTestGroup(collidables);
				if(hit){
					this.y = hit.bottom;
				}
			}

			if(bounds && this.y < bounds.y){
				this.y = bounds.y;
			}
		}

		moveDown(collidables=null, bounds=null){
			this.y += this.moveSpeed;

			if(collidables){
				let hit = this.hitTestGroup(collidables);
				if(hit){
					this.y = hit.y;
				}
			}

			if(bounds && this.height > bounds.height){
				this.y = bounds.height;
			}
		}

		moveLeft(collidables=null, bounds=null){
			this.x -= this.moveSpeed;

			if(collidables){
				let hit = this.hitTestGroup(collidables);
				if(hit){
					this.x = hit.right;
				}
			}

			if(bounds && this.x < bounds.x){
				this.x = bounds.x;
			}
		}

		moveRight(collidables=null, bounds=null){
			this.x += this.moveSpeed;

			if(collidables){
				let hit = this.hitTestGroup(collidables);
				if(hit){
					this.x = hit.right;
				}
			}

			if(bounds && this.right > bounds.right){
				this.x = bounds.right;
			}
		}

		set moveSpeed(moveSpeed){
			this._moveSpeed = (typeof moveSpeed === "number") ? Math.abs(moveSpeed) : this.moveSpeed;
		}

		set facing(facing){
			if(facing === GameObject.FACING_UP || facing === GameObject.FACING_DOWN || facing === GameObject.FACING_LEFT || facing === GameObject.FACING_RIGHT){
				this._facing = facing;
			}
		}

		get moveSpeed(){
			return this._moveSpeed;
		}

		get facing(){
			return this._facing;
		}

		toString(){
			return "[object RageJS.GameObject]";
		}
	};
	GameObject.FACING_UP = 		"up";
	GameObject.FACING_DOWN = 	"down";
	GameObject.FACING_LEFT = 	"left";
	GameObject.FACING_RIGHT = 	"right";

	let ArrayList = class ArrayList{
		constructor(){
			this._list = [];
		}

		add(object){
			if(!this.contains(object)){
				this._list.push(object);
				return true;
			}
			return false;
		}

		addAt(object, index){
			if(!this.contains(object)){
				let updatedList = [];
				for(let i = 0; i < this.size(); i++){
					if(i === index){
						updatedList.push(object);
					}
					updatedList.push(this.getAt(i));
				}
				this._list = updatedList;
			}
			return false;
		}

		remove(object){
			return this.removeAt(this.findIndex(object));
		}

		removeAt(index){
			if(index > -1 && index < this.size()){
				return this._list.splice(index, 1);
			}
			return null;
		}

		swap(object1, object2){
			let index1 = -1,
				index2 = -1;

			for(let i = 0; i < this.size(); i++){
				if(this.getAt(i) === object1){
					index1 = this.getAt(i);
				}
				else if(this.getAt(i) === object2){
					index2 = this.getAt(i);
				}

				if(index1 > -1 && index2 > -1){
					this.swapAt(index1, index2);
					return true;
				}
			}

			return false;
		}

		swapAt(index1, index2){
			let c1 = this.getAt(index1),
				c2 = this.getAt(index2);

			if(c1 && c2){
				this._list[index1] = c2;
				this._list[index2] = c1;
				return true;
			}
			return false;
		}

		findIndex(object){
			for(let i = 0; i < this.size(); i++){
				if(this.getAt(i) === object){
					return i;
				}
			}
			return -1;
		}

		contains(object){
			return this.findIndex(object) > -1;
		}

		size(){
			return this._list.length;
		}

		isEmpty(){
			return this.size() === 0;
		}

		toArray(){
			let shallowCopy = [];
			for(let obj of this._list){
				shallowCopy.push(obj);
			}
			return shallowCopy;
		}

		getAt(index){
			return (index > -1 && index < this.size()) ? this._list[index] : null;
		}

		toString(){
			return "[object RageJS.ArrayList]";
		}
	};

	let KeyHandler = class KeyHandler extends EventDispatcher{
		constructor(){
			super();

			this._keys = {};
			this._numKeys = 0;

			document.addEventListener("keyup", (evt) => this.handleKeyUp(evt));
			document.addEventListener("keydown", (evt) => this.handleKeyDown(evt)); 
		}

		handleKeyUp(evt){
			this.forceKeyUp(evt.keyCode);
			this.dispatchEvent(evt);
		}

		handleKeyDown(evt){
			this.forceKeyDown(evt.keyCode);
			this.dispatchEvent(evt);
		}

		keyUp(keyCode){
			return typeof this._keys[keyCode] === "undefined";			
		}

		keyDown(keyCode){
			return typeof this._keys[keyCode] !== "undefined";
		}

		oneKeyUp(keyCodes){
			for(let keyCode in this._keys){
				if(this.keyUp(keyCode)){
					return true;
				}
			}
			return false;
		}

		oneKeyDown(keyCodes){
			for(let keyCode in this._keys){
				if(this.keyDown(keyCode)){
					return true;
				}
			}
			return false;
		}

		allKeysUp(keyCodes){
			for(let keyCode in this._keys){
				if(this.keyDown(keyCode)){
					return false;
				}
			}
			return true;
		}

		allKeysDown(keyCodes){
			for(let keyCode in this._keys){
				if(this.keyUp(keyCode)){
					return false;
				}
			}
			return true;
		}

		forceKeyUp(keyCode){
			if(typeof this.keyDown(keyCode))
				this._numKeys--;

			delete this._keys[keyCode];
		}

		forceKeyDown(keyCode){
			if(typeof this.keyUp(keyCode))
				this._numKeys++;

			this._keys[keyCode] = true;
		}

		get numKeys(){
			return this._numKeys;
		}

		toString(){
			return "[object RageJS.KeyHandler]";
		}
	};

	let Rectangle = class Rectangle{
		constructor(x, y, width, height){
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}

		get bottom(){
			return this.y + this.height;
		}

		get right(){
			return this.x + this.width;
		}

		get centerX(){
			return this.x + this.width * 0.5;
		}	

		get centerY(){
			return this.y + this.height * 0.5;
		}
	};

	let Scroller = class Scroller{
		constructor(viewportWidth, viewportHeight, bounds){
			this._bounds = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
		}
	};

	// intanstiate the global stage object (stage is defined at this point)
	GLOBAL_STAGE = new Stage();
	
	// global clicking handler
	document.addEventListener("click", (evt) => {
		let bounds = GLOBAL_STAGE.canvas.getBoundingClientRect(),
			mouseX = evt.clientX - bounds.left,
			mouseY = evt.clientY - bounds.top,
			mouseBox = new DisplayObject(mouseX, mouseY, 3, 3);

		GLOBAL_STAGE.forEachChild((obj) => {
			if(obj.hitTestObject(mouseBox)){
				obj.dispatchEvent(new DisplayEvent(DisplayEvent.CLICK));
			}
		});
	});

	let RageJSLibrary = class RageJSLibrary{
		constructor(){
			console.log("RageJS Library - v" + VERSION);
		}

		get DisplayEvent(){
			return DisplayEvent;
		}

		get ImageData(){
			return ImageData;
		}

		get AnimationData(){
			return AnimationData;
		}

		get EventDispatcher(){
			return EventDispatcher;
		}

		get DisplayObject(){
			return DisplayObject;
		}

		get TextField(){
			return TextField;
		}

		get DisplayObjectContainer(){
			return DisplayObjectContainer;
		}

		get Stage(){
			return Stage;
		}

		get Sprite(){
			return Sprite;
		}

		get MovieClip(){
			return MovieClip;
		}

		get ArrayList(){
			return ArrayList;
		}

		get KeyHandler(){
			return KeyHandler;
		}

		get Rectangle(){
			return Rectangle;
		}

		get GameObject(){
			return GameObject;
		}

		get wrap(){
			return wrap;
		}

		get ajax(){
			return ajax;
		}

		get isSupported(){
			return isSupported;
		}

		get init(){
			return init;
		}

		get AUTHOR(){
			return AUTHOR;
		}

		get VERSION(){
			return VERSION;
		}

		get stage(){
			return GLOBAL_STAGE;
		}
	};

	return new RageJSLibrary();
})();