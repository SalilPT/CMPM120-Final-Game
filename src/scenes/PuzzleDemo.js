class PuzzleDemo extends Phaser.Scene {
    constructor() {
        super("puzzleDemoScene");
    }

    preload() {
        this.load.image("playerSprite", "./assets/Jeb Temp.png");
        this.load.image("puzPieceSprite", "./assets/Key Temp.png");
        this.load.image("puzHoleSprite", "./assets/Enemy Temp.png");
        this.load.image("background", "./assets/Metal Plating 1 64x64.png");

        // Testing tilemap
        this.load.tilemapTiledJSON("testTileMap", "./assets/tilemap-testing/tilePropertiesTest.json");
        this.load.json("testObjectTypes", "./assets/tilemap-testing/objectTypesTest.json");
        this.load.atlas("gameAtlas", "./assets/bulletHellTileSet.png", "./assets/bulletHellTileSet.json");
    }

    create() {
        /* Tile testing stuff */
        let testMap = this.add.tilemap("testTileMap");
        console.log(testMap);
        //let testTileset = testMap.addTilesetImage("bulletHellTileSet", "gameAtlas");
        //let floorLayer = testMap.createLayer("Floor", testTileset, 0, 0);
        //let wallLayer = testMap.createLayer("Walls", testTileset, 0, 0);
        //let newObjLayer = testMap.createLayer("testObjectLayer", testTileset, 0, 0);
        //let testTileset = testMap.getTileset("bulletHellTileSet");
        console.log("Tileset: ", testTileset);
        let objectTypeData = this.cache.json.get("testObjectTypes");
        console.log("Object type data: ", objectTypeData);
        
        // The idea here is to loop through every tile in the tilemap's specified object layer and 
        // create a new object based on the "type" field of the tile object. Do this by 
        // referencing the corresponding object types file from the project to find out what 
        // properties every tile with a certain type is supposed to have.
        let objLayer = testMap.getObjectLayer("testObjectLayer");
        console.log("objLayer.objects: ", objLayer.objects);
        console.log("objLayer.properties: ", objLayer.properties);
        console.log("Tileset image frames: ", testTileset.image.frames);
        for (let obj of objLayer.objects) {
            console.log("Tile tex coords: ", testTileset.getTileTextureCoordinates(obj.gid));
            console.log("obj.properties: ", obj.properties);
            console.log("Properties assigned to every instance of this tile (doesn't use object types): ", testTileset.getTileProperties(obj.gid));
            // Using the global ID of the current tile (located on an object layer), get the current tile's corresponding data from the tileset object.
            // Then, get the "type" property of the corresponding data. This will be the object type of the current tile.
            let objType = testTileset.getTileData(obj.gid).type;
            console.log(objType);
            // Loop through the array of object types objects that was exported from Tiled. Find the one that applies to the current tile.
            let objTypePropertiesObj = objectTypeData.find((obj) => {return obj.name == objType});
            // Finally, get the properties of the object type object.
            // This will be the properties that this tile has because of its type that was defined in Tiled.
            let objTypeProperties = objTypePropertiesObj.properties;
            console.log("Inherited properties of current tile: ", objTypeProperties);
        }
        /**/
        
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
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
        // Make one sequence
        let seqName = "sequence1";
        this.puzManager.addSequence(seqName);
        for (let i = 1; i < 5 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 128*i,
                y: 800 + 64 * Math.pow(-1, i),
                texture: "puzPieceSprite"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqName);
            let newPuzHole = this.physics.add.sprite(128*i, 128 + 64 * Math.pow(-1, i), "puzHoleSprite").setOrigin(0);
            newPuzHole.numInSequence = i;
            this.puzManager.addPuzzleHoleToSeq(newPuzHole, seqName);
        }
        this.puzManager.attachDebugTextToSeq(seqName);

        // Make another sequence
        seqName = "sequence2"
        this.puzManager.addSequence(seqName);
        for (let i = 1; i < 5 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 768 + 128*i,
                y: 800 + 64 * Math.pow(-1, i),
                texture: "puzPieceSprite"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqName);
            let newPuzHole = this.physics.add.sprite(768 + 128*i, 128 + 64 * Math.pow(-1, i), "puzHoleSprite").setOrigin(0);
            newPuzHole.numInSequence = i;
            this.puzManager.addPuzzleHoleToSeq(newPuzHole, seqName);
        }
        this.puzManager.attachDebugTextToSeq(seqName);



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