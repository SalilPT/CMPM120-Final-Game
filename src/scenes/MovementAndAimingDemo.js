class MovementAndAimingDemo extends Phaser.Scene {
    constructor() {
        super("movementAndAimingDemoScene");
    }

    preload() {
        this.load.image("playerSprite", "./assets/Jeb Temp.png");
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
        this.load.image("background", "./assets/Metal Plating 1 64x64.png");
    }

    create() {
        // Background
        this.background = this.add.tileSprite(0, 0, globalGame.config.width, globalGame.config.height, "background").setOrigin(0);

        /////
        // Player and movement stuff
        this.playerChar = this.physics.add.sprite(globalGame.config.width/2, globalGame.config.height/2, "playerSprite").setOrigin(0.5);
        this.playerChar.setCollideWorldBounds(true);
        // Keycodes that will be used to determine which direction to move the player character
        // Default here is WASD
        this.upMovKey = Phaser.Input.Keyboard.KeyCodes.W;
        this.rightMovKey = Phaser.Input.Keyboard.KeyCodes.D;
        this.downMovKey = Phaser.Input.Keyboard.KeyCodes.S;
        this.leftMovKey = Phaser.Input.Keyboard.KeyCodes.A;

        this.movKeyKeycodes = {
            "up": this.upMovKey,
            "right": this.rightMovKey,
            "down": this.downMovKey,
            "left": this.leftMovKey,
        }

        this.captureMovementKeycodes(this.movKeyKeycodes);

        this.movKeyObjects = this.input.keyboard.addKeys(this.movKeyKeycodes);

        // List of movement keys, in order that they were pressed
        this.movActionList = [];

        this.CONFLICTING_MOV_KEYS = {
            "up": "down",
            "right": "left",
            "down": "up",
            "left": "right"
        }

        this.ACTIONS_TO_VECTORS = {
            "up": Phaser.Math.Vector2.UP,
            "right": Phaser.Math.Vector2.RIGHT,
            "down": Phaser.Math.Vector2.DOWN,
            "left": Phaser.Math.Vector2.LEFT
        }

        this.playerMovSpd = 400;

        this.DIAG_MOVEMENT_SCALAR = Math.sqrt(2)/2; // Scale diagonal movement by this. Should be very close to sin(45 degrees).

        /////

        // Shooting stuff
        this.playerBulletGroup = this.add.group({});
        this.input.on("pointerdown", () => {
            let newPlayerBullet = this.physics.add.sprite(this.playerChar.x, this.playerChar.y, "playerSprite").setOrigin(0.5);
            this.playerBulletGroup.add(newPlayerBullet);
            let fireAngle = Phaser.Math.Angle.Between(this.playerChar.body.center.x, this.playerChar.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
            fireAngle = Phaser.Math.RadToDeg(fireAngle);
            let fireVector = this.physics.velocityFromAngle(fireAngle, 250);
            newPlayerBullet.body.setVelocity(fireVector.x, fireVector.y);
            newPlayerBullet.setScale(0.5);

            this.sound.play("shootingSFX");

            this.controlsTextObj.alpha = 0;
        });
        
        // Informational text and transition back to Menu
        let debugTextConfig = {color: "white", fontSize: "36px", stroke: "black", strokeThickness: 1};
        this.controlsTextObj = this.add.text(this.playerChar.x, this.playerChar.y - 64, "Controls: WASD to move, left-click to shoot", debugTextConfig).setOrigin(0.5);
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
        // Debugging text
        this.mousePosDebug = this.add.text(32, 32, "World mouse: " + this.input.activePointer.worldX.toString() + ", " + this.input.activePointer.worldY, debugTextConfig);
        this.facingDebug = this.add.text(this.mousePosDebug.x, this.mousePosDebug.y + 48, "Facing angle: " + Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.playerChar.body.center.x, this.playerChar.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY)), debugTextConfig);
        this.movActionListDebug = this.add.text(this.facingDebug.x, this.facingDebug.y + 48, "movActionList: " + this.movActionList, debugTextConfig);
        this.spdDebug = this.add.text(this.movActionListDebug.x, this.movActionListDebug.y + 48, "Player movement vector speed: " + this.playerChar.body.speed, debugTextConfig);
    }

    update() {
        // Movement input list
        for (const [keyActionName, keyObj] of Object.entries(this.movKeyObjects)) {
            if (keyObj.isUp) {
                Phaser.Utils.Array.Remove(this.movActionList, keyActionName);
            }
            else if (keyObj.isDown && !this.movActionList.includes(keyActionName)) {
                Phaser.Utils.Array.Add(this.movActionList, keyActionName);
            }
        }

        let movVector = this.determineMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);

        // Clean up bullets
        for (let bullet of this.playerBulletGroup.getChildren()) {
            if (this.cameras.main.worldView.contains(bullet.x, bullet.y) == false) {
                this.playerBulletGroup.remove(bullet, true, true);
            }
        }
        
        this.mousePosDebug.text = "World mouse: " + this.input.activePointer.worldX.toString() + ", " + this.input.activePointer.worldY;
        // Update mouse world position specifically for debugging purposes here. It's automatically updated by mouse events.
        this.input.activePointer.updateWorldPoint(this.cameras.main);
        this.facingDebug.text = "Facing angle (deg): " + Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.playerChar.body.center.x, this.playerChar.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY));
        this.movActionListDebug.text = "movActionList: " + this.movActionList;
        this.spdDebug.text = `Player movement vector speed: ${this.playerChar.body.speed}, \nVec2: {${movVector.x},${movVector.y}}`;
    }

    // Prevent all of the selected movement keys from bubbling up the browser
    // This prevents things like scrolling down when SPACE is pressed
    captureMovementKeycodes(keycodesObj) {
        for (let keycode of Object.values(keycodesObj)) {
            this.input.keyboard.addCapture(keycode);
        }
    }

    // Stops keycodes from being captured
    removeCaptureMovementKeycodes(keycodesObj) {
        for (let keycode of Object.values(keycodesObj)) {
            this.input.keyboard.removeCapture(keycode);
        }
    }

    determineMovementVector() {
        let conflictingEntries = new Set();
        let resultingVector = new Phaser.Math.Vector2(0, 0);
        let numDifferentDirs = 0;
        // Prioritize only the most recent inputs
        for (const movAction of this.movActionList.slice().reverse()) {
            if (!conflictingEntries.has(movAction)) {
                conflictingEntries.add(this.CONFLICTING_MOV_KEYS[movAction]);
                resultingVector.add(this.ACTIONS_TO_VECTORS[movAction]);
                numDifferentDirs += 1;
            }
        }

        // Scale diagonal vectors to prevent faster movement in diagnonal directions
        // I technically could've use the normalize() method here, but this is both less intensive and more precise.
        if (numDifferentDirs == 2) {
            resultingVector.scale(this.DIAG_MOVEMENT_SCALAR);
        }

        resultingVector.scale(this.playerMovSpd);
        return resultingVector;
    }
}