class WallsDemo extends Phaser.Scene {
    constructor() {
        super("wallsDemoScene");
    }
    
    preload(){
        this.load.image("wall", "./assets/Metal Wall 1 temp.png");
    }

    create() {
        this.wallTileWidth = this.textures.get("wall").getSourceImage().width;
        this.wallTileHeight = this.textures.get("wall").getSourceImage().height;
        this.wall = this.physics.add.existing(this.add.tileSprite(
            globalGameConfig.width/2,  
            globalGameConfig.height/2, 
            this.wallTileWidth * ((globalGameConfig.width) / this.wallTileWidth), 
            this.wallTileHeight * ((globalGameConfig.height) / this.wallTileHeight),
            "wall"));
        this.wall
    }

    makeSquareRoom(x, y, roomWidth, roomHeight, wallThickness) {
        
    }
}