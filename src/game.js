import { Game, GameObject } from './engine.js';
import { VerticalDivider, Text, StartButton, Countdown, Button, Score, MouseSelector } from './uicomponents.js';
import { COLORS } from './colors.js';
import { Util } from './util.js';

class Mouse extends GameObject {
    // Handles filtering logic for the mouse
    constructor() {
        super();
        this.top = new MouseLayer(200, 200, 25, COLORS.GREEN);
        this.base = new MouseLayer(200, 200, 25, COLORS.GREY);
        this.cursor = new Cursor(15, COLORS.DARK_GREY);
        this.active = false;
        this.positions = Array();
        this.averagePosition = new Two.Vector(0, 0);
        this.hover = false;

        this.FILTER_LENGTH_MAX = 30;
        this.FILTER_LENGTH_MIN = 6;
        this.filterLength = this.FILTER_LENGTH_MIN;

        this.lastUpdateTime = 0;
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.game.AddObject(this.base);
        this.game.AddObject(this.top);
        this.game.AddObject(this.cursor);

        this.OnFilterLevelSelectEventId = this.game.Events.RegisterEventListener("FilterLevelSelect", this, this.OnFilterLevelSelect);
    }

    OnRemove() {
        super.OnRemove(game);
        this.game.RemoveObject(this.base);
        this.game.RemoveObject(this.top);
        this.game.RemoveObject(this.cursor);

        this.game.Events.DeregisterEventListener("FilterLevelSelect", this.OnFilterLevelSelectEventId);
    }

    OnFilterLevelSelect(event) {
        this.top.shape.stroke = event.color;
        this.filterLength = Util.linearInterp(this.FILTER_LENGTH_MIN, this.FILTER_LENGTH_MAX, event.numLevels - 1 - event.level, event.numLevels - 1);
        console.log(this.filterLength);
        // this.filterLength = 1;
    }

    OnUpdate(delta, frameCount) {
        if (!this.active) return;

        let topPos = this.game.mousePos.clone();

        if (topPos.x > this.base.position.x + (this.base.width / 2))
            topPos.x = this.base.position.x + (this.base.width / 2);
        if (topPos.y > this.base.position.y + (this.base.height / 2))
            topPos.y = this.base.position.y + (this.base.height / 2);
        if (topPos.x < this.base.position.x - (this.base.width / 2))
            topPos.x = this.base.position.x - (this.base.width / 2);
        if (topPos.y < this.base.position.y - (this.base.height / 2))
            topPos.y = this.base.position.y - (this.base.height / 2);

        let mousePadMin = new Two.Vector(0, 0);
        let mousePadMax = new Two.Vector(this.game.width / 2, this.game.height);

        if (topPos.x > mousePadMax.x)
            topPos.x = mousePadMax.x;
        if (topPos.y > mousePadMax.y)
            topPos.y = mousePadMax.y;
        if (topPos.x < mousePadMin.x)
            topPos.x = mousePadMin.x;
        if (topPos.y < mousePadMin.y)
            topPos.y = mousePadMin.y;

        this.top.position.set(topPos.x, topPos.y);

        if (Date.now() - this.lastUpdateTime < 16)
            return;
        else
            this.lastUpdateTime = Date.now();

        if (this.positions.length >= this.filterLength) {
            this.averagePosition.subSelf(this.positions[0]);
            this.positions.shift();
        }

        this.positions.push(topPos.clone());
        this.averagePosition.addSelf(topPos);
        let basePos = this.averagePosition.clone().divideScalar(this.positions.length);

        this.base.position.set(Math.round(basePos.x), Math.round(basePos.y));

        let cursorPos = new Two.Vector(Math.round(basePos.x + (this.game.width / 2)), Math.round(basePos.y));

        if (this.cursor.position.x !== cursorPos.x || this.cursor.position.y !== cursorPos.y)
            this.game.Events.TriggerEvent("CursorMove", { cursorPos, cursorRadius: this.cursor.radius });

        this.cursor.position.set(cursorPos.x, cursorPos.y);
    }

    OnMouseMove(mousePos) {
        if (!this.active) {
            this.HighlightBase();
        }
    }

    OnMouseDown() {
        if (!this.active) {
            if (Util.isCoordInRect(this.game.mousePos, this.base.position, this.base.width, this.base.height)) {
                this.SetActive(true);
            }
        }
    }

    OnMouseUp() {
        if (this.active && !this.cursor.active)
            this.cursor.SetActive(true);
    }

    OnKeyDown(keyCode) {
        if (keyCode === 27 && this.active) {
            this.SetActive(false);
            this.cursor.SetActive(false);
        }
    }

    OnCanvasResize(width, height) {
        if (!this.active) {
            this.top.position.set(width / 4, height / 2);
            this.base.position.set(width / 4, height / 2);
            this.cursor.position.set(this.base.position.x + (width / 2), this.base.position.y)
        }
    }

    HighlightBase() {
        if (Util.isCoordInRect(this.game.mousePos, this.base.position, this.base.width, this.base.height)) {
            if (!this.hover) {
                this.game.elem.style.cursor = "pointer";
                this.base.shape.fill = "rgba(235, 235, 235, 1)";
                this.hover = true;
            }
        } else {
            if (this.hover) {
                this.game.elem.style.cursor = "default";
                this.base.shape.fill = "transparent";
                this.hover = false;
            }
        }
    }

    SetActive(active) {
        this.active = active;

        if (active) {
            this.averagePosition = new Two.Vector(0, 0);
            this.game.elem.style.cursor = "none";
            this.base.shape.fill = "transparent";
            this.hover = false;
            this.game.Events.TriggerEvent("MouseActive", { mouseActive: true });
        } else {
            this.positions = Array();
            this.averagePosition = new Two.Vector(0, 0);
            this.top.position.set(this.base.position.x, this.base.position.y);
            this.HighlightBase();
            this.OnCanvasResize(this.game.width, this.game.height);
            this.game.Events.TriggerEvent("MouseActive", { mouseActive: false });
        }
    }
}

class MouseLayer extends GameObject {
    constructor(width, height, radius, color) {
        super();
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.color = color
        this.position = new Two.Vector(0, 0);
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.position = new Two.Vector(game.width / 4, game.height / 2);
        this.shape = new Two.RoundedRectangle(this.position.x, this.position.y, this.width, this.height, this.radius);
        this.shape.fill = "transparent";
        this.shape.linewidth = 4;
        this.shape.stroke = this.color;
        game.background.add(this.shape);
        this.shape.translation = this.position;
    }

    OnRemove() {
        this.shape.remove();
    }
}

class Cursor extends GameObject {
    constructor(radius, color) {
        super();
        this.position = new Two.Vector(0, 0);
        this.radius = radius;
        this.color = color;
        this.active = false;
        this.mouseDown = false;
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.position.set(this.game.width * 0.75, this.game.height / 2);
        this.shape = new Two.Circle(this.position.x, this.position.y, this.radius);
        this.shape.fill = this.color;
        this.shape.stroke = "transparent";
        this.shape.translation = this.position;
        this.game.middleground.add(this.shape);
    }

    OnRemove() {
        this.shape.remove();
    }

    OnMouseDown() {
        if (this.active) {
            this.mouseDown = true;
            this.shape.fill = COLORS.GREY;
            this.game.Events.TriggerEvent("CursorClick", { mouseDown: true, cursorPos: this.position, cursorRadius: this.radius });
        }
    }

    OnMouseUp() {
        if (this.active && this.mouseDown) {
            this.mouseDown = false;
            this.shape.fill = COLORS.DARK_GREY;
            this.game.Events.TriggerEvent("CursorClick", { mouseDown: false, cursorPos: this.position, cursorRadius: this.radius });
        }
    }

    SetActive(active) {
        this.active = active;
        if (active) {
        } else {
            this.shape.fill = COLORS.DARK_GREY;
            if (this.mouseDown) {
                this.game.Events.TriggerEvent("CursorClick", { mouseDown: false, position: this.position });
                this.mouseDown = false;
            }
        }
    }
}

class MouseTrail extends GameObject {
    constructor() {
        super();
    }

    OnUpdate(delta, frameCount) {

    }

    OnAdd(game) {
        super.OnAdd(game);
    }

    OnRemove() {
    }
}

class TargetSpawner extends GameObject {
    constructor() {
        super();
    }

    OnAdd(game) {
        super.OnAdd(game);

        this.score = 0;
        this.accuracy = 0;
        this.shotsMissed = 0;
        this.shotsHit = 0;

        this.OnTargetDestroyEventId = game.Events.RegisterEventListener("TargetDestroy", this, this.OnTargetDestroy);
        this.OnTargetMissEventId = game.Events.RegisterEventListener("TargetMiss", this, this.OnTargetMiss);

        this.SpawnTarget();
    }

    OnRemove() {
        this.game.Events.DeregisterEventListener("TargetDestroy", this.OnTargetDestroyEventId);
        this.game.Events.DeregisterEventListener("TargetMiss", this.OnTargetMissEventId);
        this.game.RemoveObject(this.currentTarget);
    }

    SpawnTarget() {
        this.currentTarget = new Target(Util.getRandomTargetPosition(this.game.width, this.game.height), 30, COLORS.GREEN);
        this.game.AddObject(this.currentTarget);
    }

    OnTargetDestroy(event) {
        this.shotsHit++;
        this.game.RemoveObject(this.currentTarget);
        this.SpawnTarget();
    }

    OnTargetMiss(event) {
        this.shotsMissed++;
    }

    GetScore() {
        let divisor = this.shotsHit + this.shotsMissed === 0 ? 1 : this.shotsHit + this.shotsMissed;
        this.accuracy = this.shotsHit / (divisor);
        this.score = Math.round(this.shotsHit * 100 * this.accuracy);
        this.accuracy = Math.round(this.accuracy * 100);
        return {
            score: this.score,
            accuracy: this.accuracy,
        };
    }
}

class Target extends GameObject {
    constructor(position, radius, color) {
        super();
        this.position = position;
        this.radius = radius;
        this.color = color;
    }

    OnAdd(game) {
        super.OnAdd(game);
        this.shape = new Two.Circle(this.position.x, this.position.y, this.radius);
        this.shape.fill = this.color;
        this.shape.stroke = "transparent";
        this.shape.translation = this.position;
        this.game.background.add(this.shape);

        this.CursorClickListenerEventId = game.Events.RegisterEventListener("CursorClick", this, this.CursorClickListener);
    }

    OnRemove() {
        this.shape.remove();
        this.game.Events.DeregisterEventListener("CursorClick", this.CursorClickListenerEventId);
    }

    CursorClickListener(event) {
        if (event.mouseDown) {
            if (Util.intersectCircles(event.cursorPos, event.cursorRadius, this.position, this.radius)) {
                this.game.Events.TriggerEvent("TargetDestroy", {});
            } else {
                this.game.Events.TriggerEvent("TargetMiss", {});
            }
        }
    }
}

let StableMouseGame = new Game({ fullscreen: true }, document.getElementById("main"));

let mouse = new Mouse();
StableMouseGame.AddObject(mouse);

let targetSpawner = new TargetSpawner();
let score;

StableMouseGame.AddObject(new VerticalDivider());

let mouseSelector = new MouseSelector(5);

let startButton = new StartButton();
let retryButton = new Button("Retry", 200, 50, 25, 5, COLORS.GREEN, COLORS.LIGHT_GREEN, (width, height) => { return new Two.Vector(width * 0.75, (height - 300) / 4) });
retryButton.Click = function () { this.game.ChangeState(this.game.GAME_STATE.COUNTDOWN) }

let changeMouseSettingsButton = new Button("Change Mouse", 200, 50, 25, 5, COLORS.BLUE, COLORS.LIGHT_BLUE, (width, height) => { return new Two.Vector(width * 0.75, height - ((height - 300) / 4)) });
changeMouseSettingsButton.Click = function () { mouse.OnKeyDown(27) };

let startCountdown = new Countdown(5, 144, COLORS.GREEN, true, 4, "'Press Start 2P', cursive", "Go", "START", (width, height) => { return new Two.Vector(width / 2, height / 2) });
let mainCountdown = new Countdown(60, 48, COLORS.DARK_GREY, false, 0, "Raleway", "", "MAIN", (width, height) => { return new Two.Vector(width * 0.75, 50) });

let helpText1 = new Text("Click inside the mouse to start.", "center", "32", "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width * 0.25, 100) }, false, 0);
let helpText2FontSize = StableMouseGame.width < 1360 ? 24 : 32;
let helpText2 = new Text("Use the virtual cursor to click the start button.", "center", helpText2FontSize, "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width * 0.75, 100) }, false, 0);
helpText2.OnCanvasResize = function(width, height) {
    let pos = this.positionFunc(width, height);
    this.position.set(pos.x, pos.y);
    this.text.size = width < 1360 ? "24" : "32";
};
let helpText3 = new Text("Click on as many targets in 60 seconds as you can.", "center", "32", "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width * 0.5, 100) }, false, 0);

let helpText4 = new Text("Tip: Playing in fullscreen may be easier (F11).", "center", "32", "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width * 0.5, height - 75) }, false, 0);
helpText4.OnCanvasResize = function (width, height) {
    let pos = this.positionFunc(width, height);
    this.position.set(pos.x, pos.y);
    if (window.innerHeight !== screen.height && this.game.State === this.game.GAME_STATE.PREGAME)
        this.text.visible = true;
    else
        this.text.visible = false;
};

let helpText5FontSize = StableMouseGame.width < 1360 ? 24 : 32;
let helpText5 = new Text("Press Escape (Esc) at any time to exit.", "center", helpText5FontSize, "Raleway", COLORS.TEXT_DARK, (width, height) => { return new Two.Vector(width * 0.25, 100) }, false, 0);
helpText5.OnCanvasResize = function (width, height) {
    let pos = this.positionFunc(width, height);
    this.position.set(pos.x, pos.y);
    this.text.size = width < 1360 ? "24" : "32";
};
StableMouseGame.AddObject(helpText1);
StableMouseGame.AddObject(helpText2);
StableMouseGame.AddObject(helpText3);
StableMouseGame.AddObject(helpText4);
StableMouseGame.AddObject(helpText5);

helpText1.text.visible = false;
helpText2.text.visible = false;
helpText3.text.visible = false;
helpText5.text.visible = false;

StableMouseGame.Events.RegisterEventListener("GameStateChange", StableMouseGame, function (event) {
    if (event.State === this.GAME_STATE.PREGAME) {
        //If this is the first time reaching this state (ie from loading as we never go back to loading)
        //then init everything we need.
        if (event.PrevState === this.GAME_STATE.LOADING) {
            helpText1.text.visible = true;
            this.AddObject(mouseSelector);
        } else { //If arriving at this state from any other it means we cancel the ongoing game and reset a new one.
            this.RemoveObject(startButton);
            this.RemoveObject(startCountdown);
            this.RemoveObject(mainCountdown);
            this.RemoveObject(targetSpawner);
            this.RemoveObject(score);
            this.RemoveObject(retryButton);
            this.RemoveObject(changeMouseSettingsButton);
            helpText1.text.visible = true;
            helpText2.text.visible = false;
            helpText3.text.visible = false;
            helpText5.text.visible = false;
            //Instead of individually removing objects, remove all and add back ones needed to start
        }

        helpText4.OnCanvasResize(this.width, this.height);
    } else if (event.State === this.GAME_STATE.COUNTDOWN) {
        if (event.PrevState === this.GAME_STATE.PREGAME) {
            this.RemoveObject(startButton);
            helpText2.text.visible = false;
            helpText3.text.visible = true;
            helpText5.text.visible = false;
        } else if (event.PrevState === this.GAME_STATE.SCORE) {
            this.RemoveObject(score);
            this.RemoveObject(retryButton);
            this.RemoveObject(changeMouseSettingsButton);
        }

        helpText4.text.visible = false;
        this.AddObject(startCountdown);
    } else if (event.State === this.GAME_STATE.MAIN) {
        helpText3.text.visible = false;
        this.AddObject(mainCountdown);
        this.AddObject(targetSpawner);
    } else if (event.State === this.GAME_STATE.SCORE) {
        let s = targetSpawner.GetScore();
        this.RemoveObject(targetSpawner);
        score = new Score(s.score, s.accuracy);
        this.AddObject(score);
        this.AddObject(retryButton);
        this.AddObject(changeMouseSettingsButton);
    }
});

StableMouseGame.Events.RegisterEventListener("MouseActive", StableMouseGame, function (event) {
    if (event.mouseActive) {
        helpText1.text.visible = false;
        helpText2.text.visible = true;
        helpText5.text.visible = true;
        this.AddObject(startButton);
        this.RemoveObject(mouseSelector);
    } else {
        this.AddObject(mouseSelector);
        this.ChangeState(this.GAME_STATE.PREGAME);
    }
});

StableMouseGame.Events.RegisterEventListener("CountdownElapsed", StableMouseGame, function (event) {
    if (event.name === "START")
        this.ChangeState(this.GAME_STATE.MAIN);
    else if (event.name === "MAIN")
        this.ChangeState(this.GAME_STATE.SCORE);
});

StableMouseGame.ChangeState(StableMouseGame.GAME_STATE.PREGAME)