class WallsDemo extends Phaser.Scene {
    constructor() {
        super("wallsDemoScene");
    }
    
    preload(){
        this.load.image("wall", "./assets/Metal Wall 1 temp.png");
        this.load.spritesheet("bSpritesheet", "./assets/bulletHellTileSet.png", {frameWidth: 64, frameHeight:64}); // tile sheet

        // load tileset that is used by the tile map
        this.load.image("bTileSet", "./assets/bulletHellTileSet.png"); // tile sheet
        //load jsonfile used by the tilemap
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json");    // Tiled JSON file
    }

    create() {
        // mainly following the the Tiledplatform scene from the Nathan's mappy example to handle collisions 
        // add tilemap
        const map = this.add.tilemap("tileMap");
        // set a tileset for the map
        const tileset = map.addTilesetImage("bulletHellTileSet", "bTileSet");
        // create seperate layers for walls and floor tiles
        const floorLayer = map.createLayer("Floor", tileset, 0, 0);
        const wallLayer = map.createLayer("Walls", tileset, 0, 0);
        // set collision based on the "collision" property that is set in the Tiled software
        wallLayer.setCollisionByProperty({
            collides: true
        });

        this.bouncyobject = this.physics.add.sprite(globalGameConfig.width/4, globalGameConfig.height/2, "bSpritesheet", 4);
        this.bouncyobject.setVelocityX(200);
        this.bouncyobject.body.setCollideWorldBounds(true);

        this.physics.add.collider(this.bouncyobject, wallLayer);


        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
    }
}