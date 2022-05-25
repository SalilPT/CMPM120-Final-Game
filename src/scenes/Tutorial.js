class Tutorial extends Phaser.Scene {
    constructor() {
        super("tutorialScene");
    }
    
    preload(){
        //visual assets
        this.load.atlas("gameAtlas", "./assets/bulletHellTileSet.png", "./assets/bulletHellTileSet.json");
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json"); // tile map JSON file (from tiled software)
        //audio assets
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
    }

    create() {
        // mainly followed Nathan Altice's mappy example for collisions using tile maps
        const map = this.add.tilemap("tileMap");
        // set a tileset for the map and its corresponding layers
        const tileset = map.addTilesetImage("bulletHellTileSet", "gameAtlas");
        const floorLayer = map.createLayer("Floor", tileset, 0, 0);
        const wallLayer = map.createLayer("Walls", tileset, 0, 0);
        floorLayer.setDepth(-2); // change as needed, note:puzzle piece sprite is 1 less than player depth, and keyhole is 2 less
        // set collision based on the "collision" property that is set in the Tiled software
        wallLayer.setCollisionByProperty({
            collides: true
        });
        //collision group
        this.anythingAndWalls = this.physics.add.group(); // group to keep things inside the walls
        // create a player
        this.jebPlayer = this.physics.add.sprite(globalGameConfig.width/4, globalGameConfig.height/2, "gameAtlas", "jeb legs temp.png");
        this.jebPlayer.body.setCollideWorldBounds(true);
        this.jebPlayer.setCircle(this.textures.getFrame("gameAtlas", "jeb legs temp.png").width/2); // make collsion into circle shape
        this.anythingAndWalls.add(this.jebPlayer);
        //create the collider and instance of the movement manager
        this.physics.add.collider(this.anythingAndWalls, wallLayer, (object1) => {
            if(object1 != this.jebPlayer){ // check it is not player sprite
                object1.destroy();
            }
        });
        this.movManager = new PlayerMovementManager(this);
        this.movManager.setMovSpd(400);
        // changing scenes debubgger
        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
        //code based off the shooting demo
        this.input.on("pointerdown", () => {
            let newPlayerBullet = this.physics.add.sprite(this.jebPlayer.x, this.jebPlayer.y, "gameAtlas", "Key Temp.png").setOrigin(0.5);
            this.anythingAndWalls.add(newPlayerBullet);
            let fireAngle = Phaser.Math.Angle.Between(this.jebPlayer.body.center.x, this.jebPlayer.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
            fireAngle = Phaser.Math.RadToDeg(fireAngle);
            let fireVector = this.physics.velocityFromAngle(fireAngle, 250);
            newPlayerBullet.body.setVelocity(fireVector.x, fireVector.y);
            newPlayerBullet.setScale(0.5);
            this.sound.play("shootingSFX");
        });
        //code based on the puzzle demo
        this.puzManager = new PuzzleManager(this, {playerChar: this.jebPlayer});
        //let thing = this.puzManager.interactKeyObj;
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.F, false);
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
        // Make a sequence
        let seqIndex = this.puzManager.addSequence();
        for (let i = 1; i < 4 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 128*i,
                y: 800 + 64 * Math.pow(-1, i),
                texture: "gameAtlas",
                frame: "puzzlePiece" + i + ".png"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqIndex);
            let newPuzHole = this.physics.add.sprite(128*i, 128 + 64 * Math.pow(-1, i), "gameAtlas", "puzzleSlot" + i + ".png").setOrigin(0);
            newPuzHole.numInSequence = i;
            this.puzManager.addHoleToSeq(newPuzHole, seqIndex);
        }

    }

    update(){
        let movVector = this.movManager.getMovementVector();
        this.jebPlayer.body.setVelocity(movVector.x, movVector.y);

    }
}