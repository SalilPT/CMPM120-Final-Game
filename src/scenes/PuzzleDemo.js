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
        this.movManager.setMovSpd(400);
        // Player stuff
        this.playerChar = this.physics.add.sprite(globalGame.config.width/2, globalGame.config.height/2, "playerSprite").setOrigin(0.5);
        this.playerChar.setCollideWorldBounds(true);

        // Puzzle piece stuff
        //this.piecePickupRange = 64;
        //this.pieceInventory = new Phaser.Structs.List(this);
        //this.scatteredPiecesGroup = this.add.group();
        //this.pickupPieceExample = this.physics.add.sprite(globalGame.config.width/2, globalGame.config.height/2 + 96, "keySprite").setOrigin(0.5);
        //this.scatteredPiecesGroup.add(this.pickupPieceExample);

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
        let seqIndex = this.puzManager.addSequence();
        let newPiece = new PuzzlePiece({
            scene: this,
            x: 600,
            y: 800,
            texture: "puzPieceSprite"
        }).setOrigin(0);
        newPiece.numInSequence = 1;
        this.puzManager.addPuzzlePieceToSeq(newPiece, seqIndex);
        let newPuzHole = this.physics.add.sprite(640, 640, "puzHoleSprite");
        newPuzHole.numInSequence = 1;
        this.puzManager.addHoleToSeq(newPuzHole, seqIndex);
        this.puzManager.attachDebugTextToSeqObjs(seqIndex);



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

    pickUpPiece() {
        // Since pieces won't move on their own, using their game objects instead of their physics bodies here is fine
        let closestPiece = this.physics.closest(this.playerChar.body.center, this.scatteredPiecesGroup.getChildren());
        if (closestPiece == null) {
            return;
        }
        if (Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, closestPiece.body.center) <= this.piecePickupRange) {
            this.pieceInventory.add(closestPiece);
            this.scatteredPiecesGroup.remove(closestPiece);
            closestPiece.setVisible(false);
        }
    }
}