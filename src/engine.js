// export class GameState {
//     constructor(game) {
//         this.GAME_STATE = {
//             LOADING: 0,
//             PREGAME: 1,
//             COUNTDOWN: 2,
//             MAIN: 3,
//             SCORE: 4
//         };
//         this.GAME_STATE_NAMES = {
//             0: "Loading",
//             1: "Pre Game",
//             2: "Countdown",
//             3: "Main",
//             4: "Score"
//         };
//         this.State = this.GAME_STATE.LOADING;
//         this.GameStateChangeEventListeners = {};
//         this.InitEventListenerMap();
//         this.game = game;
//     }

//     InitEventListenerMap() {
//         Object.keys(this.GAME_STATE).forEach(state => this.GameStateChangeEventListeners[this.GAME_STATE[state]] = []);
//         console.log(this.GameStateChangeEventListeners);
//     }

//     RegisterEventListener(state, listener) {
//         this.GameStateChangeEventListeners[state].push(listener);
//     }

//     ChangeState(state) {
//         let event = {
//             PrevState: this.State,
//             State: state,
//             PrevStateName: this.GAME_STATE_NAMES[this.State],
//             StateName: this.GAME_STATE_NAMES[state]
//         }

//         for (let listener of this.GameStateChangeEventListeners[state]) {
//             listener.call(this.game, event);
//         }

//         this.State = state;
//     }
// }

export class Events {
    constructor() {
        this.listeners = {};
        this.uniqueId = 0;
    }

    RegisterEventListener(eventName, context, listenerFunction) {
        if (!this.listeners[eventName])
            this.listeners[eventName] = {};

        let id = this.uniqueId;
        this.uniqueId++;
        this.listeners[eventName][id] = { context: context, listener: listenerFunction };

        return id;
    }

    DeregisterEventListener(eventName, id) {
        if (this.listeners[eventName]) {
            if (this.listeners[eventName][id]) {
                delete this.listeners[eventName][id];
                // console.log("Removed id: " + id);
            } else {
                console.log("Failed to remove id: " + id);
            }
        }
    }

    //If an event handler gets removed while triggering an event (ie button clicks get heard by all buttons, so if 1 button removed another the
    // 2nd button's handler will try to be called, but it has already been removed from the list.)
    //Check if the handler exists before calling it
    TriggerEvent(eventName, event) {
        if (this.listeners[eventName]) {
            Object.keys(this.listeners[eventName]).forEach((id) => {
                let handler = this.listeners[eventName][id];
                if (handler)
                    handler.listener.call(handler.context, event);
            });
        }
    }
}

export class Game {
    constructor(twoOptions, twoElem) {
        this.GameObjects = [];
        this.GAME_STATE = {
            LOADING: 0,
            PREGAME: 1,
            COUNTDOWN: 2,
            MAIN: 3,
            SCORE: 4
        };
        this.GAME_STATE_NAMES = {
            0: "Loading",
            1: "Pre Game",
            2: "Countdown",
            3: "Main",
            4: "Score"
        };
        this.State = this.GAME_STATE.LOADING;
        this.Events = new Events();
        this.elem = twoElem;
        this.two = new Two(twoOptions).appendTo(this.elem);
        this.mousePos = new Two.Vector(0, 0);
        this.lastFrameTime = Date.now();
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.background = this.two.makeGroup();
        this.middleground = this.two.makeGroup();
        this.foreground = this.two.makeGroup();

        this.two.bind("update", frameCount => {
            let time = Date.now();
            let delta = time - this.lastFrameTime;
            this.lastFrameTime = time;
            this.Update(delta, frameCount);
        }).play();

        this.elem.onmousemove = event => this.OnMouseMove(event.pageX, event.pageY);

        this.elem.onresize = () => this.OnCanvasResize(window.innerWidth, window.innerHeight);

        document.addEventListener("keyup", event => this.OnKeyUp(event.keyCode));
        document.addEventListener("keydown", event => this.OnKeyDown(event.keyCode));

        document.addEventListener("mouseup", () => this.OnMouseUp());
        document.addEventListener("mousedown", () => this.OnMouseDown());

        window.addEventListener("wheel", event => this.OnWheel(Math.sign(event.deltaY) < 0));
    }

    ChangeState(state) {
        let event = {
            PrevState: this.State,
            State: state,
            PrevStateName: this.GAME_STATE_NAMES[this.State],
            StateName: this.GAME_STATE_NAMES[state]
        }

        this.State = state;

        this.Events.TriggerEvent("GameStateChange", event);
    }

    AddObject(gameObject) {
        let index = this.GameObjects.indexOf(gameObject);
        // console.log(this.GameObjects);
        if (index === -1) {
            this.GameObjects.push(gameObject);
            gameObject.OnAdd(this);
        }
    }

    RemoveObject(gameObject) {
        let index = this.GameObjects.indexOf(gameObject);
        if (index > -1) {
            this.GameObjects.splice(index, 1);
            gameObject.OnRemove();
        }
    }

    Update(delta, frameCount) {
        for (let gameObject of this.GameObjects) {
            gameObject.OnUpdate(delta, frameCount);
        }
    }

    OnMouseMove(x, y) {
        this.mousePos = new Two.Vector(x, y);
        for (let gameObject of this.GameObjects) {
            gameObject.OnMouseMove(this.mousePos);
        }
    }

    OnCanvasResize(width, height) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        for (let gameObject of this.GameObjects) {
            gameObject.OnCanvasResize(width, height);
        }
    }

    OnMouseUp() {
        for (let gameObject of this.GameObjects) {
            gameObject.OnMouseUp();
        }
    }

    OnMouseDown() {
        for (let gameObject of this.GameObjects) {
            gameObject.OnMouseDown();
        }
    }

    OnKeyUp(keyCode) {
        for (let gameObject of this.GameObjects) {
            gameObject.OnKeyUp(keyCode);
        }
    }

    OnKeyDown(keyCode) {
        for (let gameObject of this.GameObjects) {
            gameObject.OnKeyDown(keyCode);
        }
    }

    OnWheel(up) {
        for (let gameObject of this.GameObjects) {
            gameObject.OnWheel(up);
        }
    }
}

export class GameObject {
    constructor() {
    }

    OnAdd(game) {
        this.game = game;
    }

    OnRemove() {
    }

    OnUpdate(delta, frameCount) {
    }

    OnMouseMove(mousePos) {
    }

    OnCanvasResize(width, height) {
    }

    OnMouseUp() {
    }

    OnMouseDown() {
    }

    OnKeyUp(keyCode) {
    }

    OnKeyDown(keyCode) {
    }

    OnWheel(up) {
    }
}