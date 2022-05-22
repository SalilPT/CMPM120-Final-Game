class Tutorial extends Phaser.Scene {
    constructor() {
        super("tutorialScene");
    }
    
    preload(){
        //visual assets
        this.load.image("wall", "./assets/Metal Wall 1 temp.png");
        this.load.spritesheet("bSpritesheet", "./assets/bulletHellTileSet.png", {frameWidth: 64, frameHeight:64}); // tile sheet
        // load tileset that is used by the tile map and load jsonfile used by the tilemap
        this.load.image("bTileSet", "./assets/bulletHellTileSet.png"); // tile sheet
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json");    // Tiled JSON file
        
        //audio assets
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
    }

    create() {
        // mainly followed Nathan Altice's mappy example for collisions using tile maps
        const map = this.add.tilemap("tileMap");
        // set a tileset for the map and its corresponding layers
        const tileset = map.addTilesetImage("bulletHellTileSet", "bTileSet");
        const floorLayer = map.createLayer("Floor", tileset, 0, 0);
        const wallLayer = map.createLayer("Walls", tileset, 0, 0);
        // set collision based on the "collision" property that is set in the Tiled software
        wallLayer.setCollisionByProperty({
            collides: true
        });
        // create a player
        this.jebPlayer = this.physics.add.sprite(globalGameConfig.width/4, globalGameConfig.height/2, "bSpritesheet", 2);
        this.jebPlayer.body.setCollideWorldBounds(true);
        this.jebPlayer.setCircle(32); // make collsion into circle shape
        //create the collider and instance of the movement manager
        this.collidesWithWalls = this.physics.add.group();
        this.collidesWithWalls.add(this.jebPlayer);
        this.physics.add.collider(this.collidesWithWalls, wallLayer);
        this.movementMan = new PlayerMovementManager(this);
        this.movementMan.setMovSpd(300);
        // changing scenes debubgger
        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
        //code based off the shooting demo
        this.playerBulletGroup = this.add.group();
        this.input.on("pointerdown", () => {
            let newPlayerBullet = this.physics.add.sprite(this.jebPlayer.x, this.jebPlayer.y, "bSpritesheet", 4).setOrigin(0.5);
            this.playerBulletGroup.add(newPlayerBullet);
            this.collidesWithWalls.add(newPlayerBullet);
            let fireAngle = Phaser.Math.Angle.Between(this.jebPlayer.body.center.x, this.jebPlayer.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
            fireAngle = Phaser.Math.RadToDeg(fireAngle);
            let fireVector = this.physics.velocityFromAngle(fireAngle, 250);
            newPlayerBullet.body.setVelocity(fireVector.x, fireVector.y);
            newPlayerBullet.setScale(0.5);
            this.sound.play("shootingSFX");
        });

    }

    update(){
        let movVector = this.movementMan.getMovementVector();
        this.jebPlayer.body.setVelocity(movVector.x, movVector.y);

    }
}