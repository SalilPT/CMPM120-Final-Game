class WallsDemo extends Phaser.Scene {
    constructor() {
        super("wallsDemoScene");
    }
    
    preload(){
        this.load.image("wall", "./assets/Metal Wall 1 temp.png");
        //load tileset that is used by the tile map
        this.load.image("bTileSet", "./assets/bulletHellTileSet.png"); // tile sheet
        //load jsonfile used by the tilemap
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json");    // Tiled JSON file
    }

    create() {
        
        // add tilemap
        const map = this.add.tilemap("tileMap");
        //set a tileset for the map
        const tileset = map.addTilesetImage("bulletHellTileSet", "bTileSet");
        const wallLayer = map.createLayer("Walls", tileset, 0, 0);
        const floorLayer = map.createLayer("Floor", tileset, 0, 0);

        wallLayer.setCollisionByProperty({
            collides: true
        });

        


        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
    }

    /*makeSquareRoom(x, y, roomWidth, roomHeight, wallThickness) {
        
    }*/
}