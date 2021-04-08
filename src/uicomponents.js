import { GameObject } from './engine.js';
import { COLORS } from './colors.js';
import { Util } from './util.js';

export class VerticalDivider extends GameObject {
    constructor() {
        super();
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.shape = new Two.Line(game.width / 2, 0, game.width / 2, game.height);
        this.shape.linewidth = 2;
        this.shape.stroke = "rgba(0, 0, 0, 0.1)";
        game.background.add(this.shape);
    }

    OnRemove() {
        this.shape.remove();
    }

    OnCanvasResize(width, height) {
        this.shape.vertices[0].set(width / 2, 0);
        this.shape.vertices[1].set(width / 2, height);
    }
}

export class Text extends GameObject {
    constructor(textValue, alignment, size, family, color, positionFunc, shadow, shadowOffset) {
        super();
        this.styles = {
            alignment: alignment,
            size: size,
            family: family,
            opacity: 1
        }
        this.textValue = textValue;
        this.color = color;
        this.position = new Two.Vector(0, 0);
        this.positionFunc = positionFunc;
        this.shadowEnabled = shadow;
        this.shadowOffset = shadowOffset;
        this.shadowPosition = new Two.Vector(0, 0);
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.position = this.positionFunc(this.game.width, this.game.height);

        if (this.shadowEnabled) {
            this.shadowPosition = new Two.Vector(this.position.x + this.shadowOffset, this.position.y + this.shadowOffset);
            this.shadow = new Two.Text(this.textValue, this.shadowPosition.x, this.shadowPosition.y, this.styles);
            this.shadow.fill = COLORS.GREY;
            game.foreground.add(this.shadow);
            this.shadow.translation = this.shadowPosition;
        }

        this.text = new Two.Text(this.textValue, this.position.x, this.position.y, this.styles);
        this.text.fill = this.color;
        // this.text.rotation = -(Math.PI / 2);
        game.foreground.add(this.text);
        this.text.translation = this.position;
    }

    OnRemove() {
        this.text.remove();
        if (this.shadowEnabled)
            this.shadow.remove();
    }

    OnCanvasResize(width, height) {
        let pos = this.positionFunc(width, height);
        this.position.set(pos.x, pos.y);
        if (this.shadowEnabled)
            this.shadowPosition.set(pos.x + this.shadowOffset, pos.y + this.shadowOffset);
    }

    ChangeValue(value) {
        this.text.value = value;
        if (this.shadowEnabled)
            this.shadow.value = value;
    }
}

export class Button extends GameObject {
    constructor(text, width, height, radius, shadowOffset, fillColor, hoverColor, positionFunc) {
        super();
        this.textValue = text;
        this.styles = {
            alignment: "center",
            size: 24,
            family: "Raleway",
            opacity: 1
        };
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.fillColor = fillColor;
        this.hoverColor = hoverColor;
        this.shadowOffset = shadowOffset;
        this.basePosition = new Two.Vector(0, 0);
        this.position = new Two.Vector(0, 0);
        this.shadowPosition = new Two.Vector(0, 0);
        this.positionFunc = positionFunc;
        this.isDown = false;
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.position = this.positionFunc(this.game.width, this.game.height);
        this.basePosition = this.positionFunc(this.game.width, this.game.height);
        this.shadowPosition.set(this.position.x + this.shadowOffset, this.position.y + this.shadowOffset);

        this.shadow = new Two.RoundedRectangle(this.shadowPosition.x, this.shadowPosition.y, this.width, this.height, this.radius);
        this.shadow.fill = COLORS.GREY;
        this.shadow.stroke = "transparent";
        game.background.add(this.shadow);

        this.shape = new Two.RoundedRectangle(this.position.x, this.position.y, this.width, this.height, this.radius);
        this.shape.fill = this.fillColor;
        this.shape.stroke = "transparent";
        this.shape.linewidth = 6;
        game.background.add(this.shape);

        this.text = new Two.Text(this.textValue, this.position.x, this.position.y, this.styles);
        this.text.fill = "rgb(255, 255, 255)";
        game.background.add(this.text);

        this.shape.translation = this.position;
        this.text.translation = this.position;
        this.shadow.translation = this.shadowPosition;

        this.CursorClickEventId = game.Events.RegisterEventListener("CursorClick", this, this.CursorClickListener);
        this.CursorMoveEventId = game.Events.RegisterEventListener("CursorMove", this, this.CursorMoveListener);
    }

    OnRemove() {
        this.shape.remove();
        this.shadow.remove();
        this.text.remove();
        this.game.Events.DeregisterEventListener("CursorClick", this.CursorClickEventId);
        this.game.Events.DeregisterEventListener("CursorMove", this.CursorMoveEventId);
    }

    OnCanvasResize(width, height) {
        let pos = this.positionFunc(width, height);
        this.basePosition.set(pos.x, pos.y);
        this.position.set(pos.x, pos.y);
        this.shadowPosition.set(pos.x + this.shadowOffset, pos.y + this.shadowOffset);
    }

    CursorMoveListener(event) {
        if (Util.intersectCirclePill(event.cursorPos, event.cursorRadius, this.basePosition, this.width, this.height)) {
            this.shape.fill = this.hoverColor;
        } else {
            this.shape.fill = this.fillColor;
        }
    }

    CursorClickListener(event) {
        if (Util.intersectCirclePill(event.cursorPos, event.cursorRadius, this.basePosition, this.width, this.height)) {
            if (event.mouseDown) {
                this.position.set(this.basePosition.x + this.shadowOffset, this.basePosition.y + this.shadowOffset);
                this.isDown = true;
                this.ButtonDown();
            } else {
                this.ButtonUp();

                if (this.isDown)
                    this.Click();

                this.isDown = false;
            }
        }

        if (!event.mouseDown) {
            this.position.set(this.basePosition.x, this.basePosition.y);
            this.isDown = false;
        }
    }

    ButtonDown() {}

    ButtonUp() {}

    Click() {}
}

export class StartButton extends Button {
    constructor() {
        super("Start", 200, 50, 25, 5, COLORS.GREEN, COLORS.LIGHT_GREEN, (width, height) => { return new Two.Vector(width * 0.75, height - 200) });
    }

    Click() {
        this.game.ChangeState(this.game.GAME_STATE.COUNTDOWN);
    }
}

export class Countdown extends GameObject {
    constructor(duration, size, color, shadow, shadowOffset, font, endText, name, positionFunction) {
        super();
        this.duration = duration;
        this.size = size;
        this.color = color;
        this.shadow = shadow;
        this.shadowOffset = shadowOffset;
        this.font = font;
        this.name = name;
        this.endText = endText;
        this.positionFunction = positionFunction;
        
        this.active = false;
        this.currentCount = this.duration;
        this.lastCountTime = 0;

        this.text = new Text(this.currentCount, "center", this.size, this.font, this.color, this.positionFunction, this.shadow, this.shadowOffset);
    }

    OnUpdate(delta, frameCount) {
        if (Date.now() - this.lastCountTime >= 1000 && this.active) {
            if (this.currentCount === 0) {
                this.active = false;
                this.game.RemoveObject(this);
                return;
            }
            this.lastCountTime = Date.now();
            this.currentCount--;
            this.text.ChangeValue(this.currentCount);
            if (this.currentCount === 0) {
                this.text.ChangeValue(this.endText);
                this.game.Events.TriggerEvent("CountdownElapsed", {name: this.name});
            }
        }
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.currentCount = this.duration;
        this.lastCountTime = Date.now();

        this.active = true;

        game.AddObject(this.text);
    }

    OnRemove() {
        this.game.RemoveObject(this.text);
        this.active = false;
    }
}

export class Score extends GameObject {
    constructor(score, accuracy) {
        super();
        this.score = score;
        this.accuracy = accuracy;
    }

    OnAdd(game) {
        super.OnAdd(game);

        this.position = new Two.Vector(game.width / 2, game.height / 2);
        this.shape = new Two.RoundedRectangle(this.position.x, this.position.y, 400, 300, 45);
        this.shape.fill = COLORS.LIGHT_GREY;
        this.shape.linewidth = 2;
        this.shape.stroke = COLORS.GREY;
        game.foreground.add(this.shape);
        this.shape.translation = this.position;

        this.scoreText = new Text("Score: " + this.score, "center", "32", "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width / 2, (height / 2) - 50) }, false, 0);
        this.accText = new Text("Accuracy: " + this.accuracy + "%", "center", "32", "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width / 2, (height / 2) + 50) }, false, 0);
        this.game.AddObject(this.scoreText);
        this.game.AddObject(this.accText);
    }

    OnRemove() {
        this.shape.remove();
        this.game.RemoveObject(this.scoreText);
        this.game.RemoveObject(this.accText);
    }

    OnCanvasResize(width, height) {
        this.position.set(width / 2, height / 2);
    }
}

export class MouseSelector extends GameObject {
    constructor(numLevels) {
        super();

        this.numLevels = numLevels;
        this.buttons = Array();
        this.activeLevel = Math.floor(this.numLevels / 2);
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.position = new Two.Vector(game.width / 2, game.height / 2);
        this.shape = new Two.RoundedRectangle(this.position.x, this.position.y, 70, this.numLevels * 70, 15);
        this.shape.fill = COLORS.LIGHT_GREY;
        this.shape.linewidth = 2;
        this.shape.stroke = COLORS.GREY;
        game.background.add(this.shape);
        this.shape.translation = this.position;

        for (let i = 0; i < this.numLevels; i++) {
            // let color = Util.interpColor([255, 88, 27], [119, 0, 255], i, this.numOptions - 1);
            let color = Util.interpColor([255, 99, 99], [0, 159, 255], i, this.numLevels - 1);
            let button = new MouseSelectorButton(i, this.numLevels, i - ((this.numLevels - 1) / 2), color);
            this.game.AddObject(button);
            this.buttons[i] = button;
            if (i === this.activeLevel) {
                button.SetActive(true);
                this.game.Events.TriggerEvent("FilterLevelSelect", { level: i, numLevels: this.numLevels, color: button.fillColor });
            }
        }

        this.title = new Text("Select Mouse Filter Strength", "center", 24, "Raleway", COLORS.DARK_GREY, (width, height) => { return new Two.Vector(width / 2 - 60, height / 2) }, false, 0)
        this.game.AddObject(this.title);
        this.title.text.rotation = -(Math.PI / 2);

        this.low = new Text("Low", "center", 18, "Raleway", COLORS.DARK_GREY, (width, height) => { return new Two.Vector(width / 2 + 60, height / 2 + (this.numLevels - 1) * 35) }, false, 0)
        this.game.AddObject(this.low);
        this.low.text.rotation = -(Math.PI / 4);

        this.high = new Text("High", "center", 18, "Raleway", COLORS.DARK_GREY, (width, height) => { return new Two.Vector(width / 2 + 60, height / 2 - (this.numLevels - 1) * 35) }, false, 0)
        this.game.AddObject(this.high);
        this.high.text.rotation = -(Math.PI / 4);

        this.OnFilterLevelSelectEventId = this.game.Events.RegisterEventListener("FilterLevelSelect", this, this.OnFilterLevelSelect);
    }

    OnRemove() {
        this.shape.remove();
        this.game.RemoveObject(this.title);
        this.game.RemoveObject(this.low);
        this.game.RemoveObject(this.high);
        
        for (let i = 0; i < this.numLevels; i++) {
            this.game.RemoveObject(this.buttons[i]);
        }

        this.game.Events.DeregisterEventListener("FilterLevelSelect", this.OnFilterLevelSelectEventId);
    }

    OnFilterLevelSelect(event) {
        this.activeLevel = event.level;
    }

    OnCanvasResize(width, height) {
        this.position.set(width / 2, height / 2);
    }
}

export class MouseSelectorButton extends Button {
    constructor(level, numLevels, centerOffset, color) {
        super("", 40, 40, 20, 0, Util.arrayToRGB(color), Util.lightenColor(color), (width, height) => { return new Two.Vector(width / 2, (height / 2) + centerOffset * 65) });
        this.active = true;
        this.level = level;
        this.numLevels = numLevels;
        this.hover = false;
    }

    OnAdd(game) {
        this.game = game;
        this.position = this.positionFunc(this.game.width, this.game.height);
        this.basePosition = this.positionFunc(this.game.width, this.game.height);
        this.shadowPosition.set(this.position.x + this.shadowOffset, this.position.y + this.shadowOffset);

        this.shape = new Two.RoundedRectangle(this.position.x, this.position.y, this.width, this.height, this.radius);
        this.shape.fill = this.fillColor;
        this.shape.stroke = "transparent";
        this.shape.linewidth = 6;
        game.background.add(this.shape);

        this.shape.translation = this.position;
        this.OnFilterLevelSelectEventId = this.game.Events.RegisterEventListener("FilterLevelSelect", this, this.OnFilterLevelSelect);
    }

    OnRemove() {
        this.shape.remove();
        this.game.Events.DeregisterEventListener("FilterLevelSelect", this.OnFilterLevelSelectEventId);
    }

    SetActive(active) {
        if (active) {
            this.shape.stroke = COLORS.GREEN;
        } else {
            this.shape.stroke = "transparent";
        }
    }

    ButtonDown() {
        this.game.Events.TriggerEvent("FilterLevelSelect", { level: this.level, numLevels: this.numLevels, color: this.fillColor});
    }

    OnFilterLevelSelect(event) {
        if (event.level === this.level) {
            this.SetActive(true);
        } else {
            this.SetActive(false);
        }
    }

    CursorClickListener(event) { }

    OnMouseDown() {
        if (Util.intersectCircles(this.game.mousePos, 0, this.position, 20)) {
            this.ButtonDown();
        }
    }

    OnMouseMove(mousePos) {
        if (this.game.elem.style.cursor === "none") return;
        if (Util.intersectCircles(this.game.mousePos, 0, this.position, 20)) {
            if (!this.hover) {
                this.hover = true;
                this.game.elem.style.cursor = "pointer";
                this.shape.fill = this.hoverColor;
            }
        } else {
            if (this.hover) {
                this.hover = false;
                this.game.elem.style.cursor = "default";
                this.shape.fill = this.fillColor;
            }
        }
    }
}