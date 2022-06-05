class LevelGenDemo extends Phaser.Scene {
    constructor() {
        super("levelGenDemoScene");
    }

    preload() {
        this.load.image("playerSprite", "./assets/Jeb Temp.png");
        this.load.image("puzPieceSprite", "./assets/Key Temp.png");
        this.load.image("puzHoleSprite", "./assets/Enemy Temp.png");
        this.load.image("background", "./assets/Metal Plating 1 64x64.png");

        // Testing tilemap
        this.load.tilemapTiledJSON("levelGenDemoTileMap", "./assets/Template Level Example.json");
        this.load.atlas("gameAtlas", "./assets/bulletHellTileSet.png", "./assets/bulletHellTileSet.json");
    }

    create() {
        // Player character
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: globalGame.config.width/2,
            y: globalGame.config.height/2,
            texture: "gameAtlas",
            frame: "jeb legs temp.png"
        });

        this.plrMovManager = this.playerChar.getMovManager();
        this.plrMovManager.setMovSpd(400);
        this.playerChar.setCollideWorldBounds(true);

        // Puzzle manager
        this.puzManager = new PuzzleManager(this, {playerChar: this.playerChar});

        let levelTilemap = this.add.tilemap("levelGenDemoTileMap");

        // Walls and floor
        const levelTileset = levelTilemap.addTilesetImage("bulletHellTileSet", "gameAtlas");
        const floorLayer = levelTilemap.createLayer("Floor", levelTileset, 0, 0).setDepth(-100);
        const wallLayer = levelTilemap.createLayer("Walls", levelTileset, 0, 0).setDepth(-99);
        wallLayer.setCollisionByProperty({
            collides: true
        });
        this.physics.add.collider(this.playerChar, wallLayer);

        // Generate the tilemap's puzzle
        this.puzManager.createPuzzleFromTilemap(levelTilemap);

        // Other stuff
        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
    }

    update() {
        let movVector = this.plrMovManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);
        this.playerChar.updateGraphics();
    }
}