class PuzzleDemo extends Phaser.Scene {
    constructor() {
        super("puzzleDemoScene");
    }

    preload() {
        this.load.image("playerSprite", "./assets/Jeb Temp.png");
    }

    create() {
        this.movManager = new PlayerMovementManager(this);
        this.movManager.setMovSpd(400);
        // Player stuff
        this.playerChar = this.physics.add.sprite(globalGame.config.width/2, globalGame.config.height/2, "playerSprite").setOrigin(0.5);
        this.playerChar.setCollideWorldBounds(true);
    }

    update() {
        let movVector = this.movManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);
    }
}