class PuzzleDemo extends Phaser.Scene {
    constructor() {
        super("puzzleDemoScene");
    }

    preload() {
        this.load.image("playerSprite", "./assets/Jeb Temp.png");
        this.load.image("puzPieceSprite", "./assets/Key Temp.png");
        this.load.image("puzHoleSprite", "./assets/Enemy Temp.png");
        this.load.image("background", "./assets/Metal Plating 1 64x64.png");
    }

    create() {
        // Background
        this.background = this.add.tileSprite(0, 0, globalGame.config.width, globalGame.config.height, "background").setOrigin(0);
        this.background.setDepth(-1000);

        this.movManager = new PlayerMovementManager(this);
        this.movManager.setMovSpd(600);
        // Player stuff
        this.playerChar = this.physics.add.sprite(globalGame.config.width/2, globalGame.config.height/2, "playerSprite").setOrigin(0.5);
        this.playerChar.setCollideWorldBounds(true);

        this.input.keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pickupKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pickupKey.on("down", () => {
            //this.pickUpPiece();
            this.controlsTextObj.destroy();
        });

        this.puzManager = new PuzzleManager(this, {playerChar: this.playerChar});
        let thing = this.puzManager.interactKeyObj;
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.F, false);
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
        // Make one sequence
        let seqIndex = this.puzManager.addSequence();
        for (let i = 1; i < 5 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 128*i,
                y: 800 + 64 * Math.pow(-1, i),
                texture: "puzPieceSprite"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqIndex);
            let newPuzHole = this.physics.add.sprite(128*i, 128 + 64 * Math.pow(-1, i), "puzHoleSprite").setOrigin(0);
            newPuzHole.numInSequence = i;
            this.puzManager.addHoleToSeq(newPuzHole, seqIndex);
        }
        this.puzManager.attachDebugTextToSeq(seqIndex);

        // Make another sequence
        seqIndex = this.puzManager.addSequence();
        for (let i = 1; i < 5 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 768 + 128*i,
                y: 800 + 64 * Math.pow(-1, i),
                texture: "puzPieceSprite"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqIndex);
            let newPuzHole = this.physics.add.sprite(768 + 128*i, 128 + 64 * Math.pow(-1, i), "puzHoleSprite").setOrigin(0);
            newPuzHole.numInSequence = i;
            this.puzManager.addHoleToSeq(newPuzHole, seqIndex);
        }
        this.puzManager.attachDebugTextToSeq(seqIndex);



        // Other stuff
        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.controlsTextObj = this.add.text(this.playerChar.x, this.playerChar.y - 64, "Controls: WASD to move, SPACE to pick up/place down", debugTextConfig).setOrigin(0.5);
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
    }

    update() {
        let movVector = this.movManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);
    }
}