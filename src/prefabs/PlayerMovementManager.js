class PlayerMovementManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene) {
        super(parentScene, "PlayerMovementManager");
        this.parentScene = parentScene;

        /*
        Constants
        */
        this.CONFLICTING_MOV_ACTIONS = {
            "up": "down",
            "right": "left",
            "down": "up",
            "left": "right"
        };

        this.ACTIONS_TO_VECTORS = {
            "up": Phaser.Math.Vector2.UP,
            "right": Phaser.Math.Vector2.RIGHT,
            "down": Phaser.Math.Vector2.DOWN,
            "left": Phaser.Math.Vector2.LEFT
        };

        this.DIAG_MOVEMENT_SCALAR = Math.sqrt(2)/2; // Scale diagonal movement by this. Should be very close to sin(45 degrees).

        this.DEFAULT_MOVEMENT_SPEED = 100;

        /*
        Mutable properties
        */
        // Keycodes that will be used to determine which direction to move the player character
        // Default here is WASD
        this.movKeyKeycodes = {
            "up": Phaser.Input.Keyboard.KeyCodes.W,
            "right": Phaser.Input.Keyboard.KeyCodes.D,
            "down": Phaser.Input.Keyboard.KeyCodes.S,
            "left": Phaser.Input.Keyboard.KeyCodes.A
        };

        // Create an object containing movement actions mapped to key objects
        this.movKeyObjects = this.parentScene.input.keyboard.addKeys(this.movKeyKeycodes, true);

        // Store currently held movement inputs in the order that they were pressed
        this.movActionList = [];

        this.movSpd = this.DEFAULT_MOVEMENT_SPEED;
    }

    /*
    Public Methods
    */
    // Re-map all of the movement action keycodes to new ones
    bindAllMovementKeys(movKeyKeycodesMap, removeOldKeyObjs = true) {
        // Don't need to do anything
        if (this.movKeyKeycodes == movKeyKeycodesMap) {
            return;
        }

        this.removeCaptureMovementKeycodes(this.movKeyKeycodes);
        if (removeOldKeyObjs) {
            for (const keyObj of Object.values(this.movKeyObjects || null)) {
                this.parentScene.input.keyboard.removeKey(keyObj);
            }
        }

        this.movKeyKeycodes = movKeyKeycodesMap;
        this.movKeyObjects = this.parentScene.input.keyboard.addKeys(this.movKeyKeycodes, true);
    }

    // Prevent all of the selected movement keys from bubbling up the browser
    // This prevents things like scrolling down when SPACE is pressed
    captureMovementKeycodes(keycodesObj) {
        for (let keycode of Object.values(keycodesObj)) {
            this.parentScene.input.keyboard.addCapture(keycode);
        }
    }

    getMovementVector() {
        this.#updateMovActionList();
        let conflictingEntries = new Set();
        let resultingVector = new Phaser.Math.Vector2(0, 0);
        let numDifferentDirs = 0;
        // Prioritize only the most recent inputs
        for (const movAction of this.movActionList.slice().reverse()) {
            if (!conflictingEntries.has(movAction)) {
                conflictingEntries.add(this.CONFLICTING_MOV_ACTIONS[movAction]);
                resultingVector.add(this.ACTIONS_TO_VECTORS[movAction]);
                numDifferentDirs += 1;
            }
        }

        // Scale diagonal vectors to prevent faster movement in diagonal directions
        // I technically could've used the normalize() method here, but this is both less intensive and more precise.
        if (numDifferentDirs == 2) {
            resultingVector.scale(this.DIAG_MOVEMENT_SCALAR);
        }

        resultingVector.scale(this.movSpd);
        return resultingVector;
    }

    // Stops keycodes from being captured
    removeCaptureMovementKeycodes(keycodesObj) {
        for (let keycode of Object.values(keycodesObj)) {
            this.parentScene.input.keyboard.removeCapture(keycode);
        }
    }

    setMovSpd(value) {
        this.movSpd = value;
    }

    /*
    Private Methods
    */
    #updateMovActionList() {
        for (const [keyActionName, keyObj] of Object.entries(this.movKeyObjects)) {
            if (keyObj.isUp) {
                Phaser.Utils.Array.Remove(this.movActionList, keyActionName);
            }
            else if (keyObj.isDown && !this.movActionList.includes(keyActionName)) {
                Phaser.Utils.Array.Add(this.movActionList, keyActionName);
            }
        }
    }
}