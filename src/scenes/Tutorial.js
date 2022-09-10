class Tutorial extends Phaser.Scene {
    constructor() {
        super("tutorialScene");
    }
    
    preload() {

    }

    create() {
        this.fullTutorialComplete = false;
        this.movementTutorialComplete = false;
        this.aimingTutorialComplete = false;
        this.InteractingTutorialComplete = false;

        // mainly followed Nathan Altice's mappy example for collisions using tile maps
        const map = this.add.tilemap("tutorialMap");
        // set a tileset for the map and its corresponding layers
        const tileset = map.addTilesetImage("gameTileset", "gameTilesetAtlas");
        const floorLayer = map.createLayer("floor", tileset, 0, 0);
        const wallLayer = map.createLayer("walls", tileset, 0, 0);
        floorLayer.setDepth(-2); // change as needed, note:puzzle piece sprite is 1 less than player depth, and keyhole is 2 less
        // set collision based on the "collision" property that is set in the Tiled software
        wallLayer.setCollisionByProperty({
            collides: true
        });

        //groups
        this.anythingAndWalls = this.physics.add.group(); // group to keep things inside the walls
        this.puzPieceGroup = this.physics.add.group(); // group to house the puzzle pieces
        this.puzHoleGroup = this.physics.add.group(); // group to house the puzzle holes

        // create a player
        let plrSpawnPt = this.getPlayerCharacterCoordsFromObjectLayer(map, "spawnerLayer", "gameTileset");
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: plrSpawnPt.x,
            y: plrSpawnPt.y,
            // Get the first frame of Jeb's bottom idle spritesheet extracted from gameAtlas
            texture: "jebBottomIdleSpritesheet",
            frame: 0
        });
        this.playerChar.getMovManager().setMovSpd(400);
        this.playerChar.body.setCollideWorldBounds(true);
        this.anythingAndWalls.add(this.playerChar);

        //create the colliders
        this.physics.add.collider(this.anythingAndWalls, wallLayer, (object1) => {
            if (object1 != this.playerChar) { // check it is not player sprite
                object1.destroy();
            }
        });

        // Generate puzzle
        this.puzManager = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzManager.createPuzzleFromTilemap(map);

        this.puzPieceGroup.addMultiple(this.puzManager.getAllPieces());
        this.puzHoleGroup.addMultiple(this.puzManager.getAllHoles());

        // Camera
        this.cameras.main.startFollow(this.playerChar, false, 0.75, 0.75);
        // Camera behavior copied from Play.js
        let mapWidthGreaterOrEqual = map.widthInPixels >= globalGame.config.width;
        let mapHeightGreaterOrEqual = map.heightInPixels >= globalGame.config.height;
        this.cameras.main.setBounds(
            mapWidthGreaterOrEqual ? 0 : -(globalGame.config.width - map.widthInPixels)/2,
            mapHeightGreaterOrEqual ? 0 : -(globalGame.config.height - map.heightInPixels)/2,
            mapWidthGreaterOrEqual ? map.widthInPixels : globalGame.config.width,
            mapHeightGreaterOrEqual ? map.heightInPixels : globalGame.config.height
        );

        // Glowing Holes Tween
        this.tweens.add({
            targets: this.puzHoleGroup.getChildren(),
            alpha: {from: 0.5, to: 1},
            duration: 500,
            repeat: -1,
            yoyo: true,
        });

        // Make a textBox that explains movement and interaction controls
        this.time.delayedCall(125, () => {
            this.scene.launch("textBoxesScene", {
                textChain: ["Wasd"],
                scenesToPauseAtStart: ["tutorialScene"],
                scenesToResumeAtEnd: ["tutorialScene"],             
            });
            this.movementTutorialComplete = true;
        });

        // check if the puzzle is complete
        this.input.keyboard.on('keyup-SPACE', () => {
            if (this.fullTutorialComplete == false) {
                this.checkForCompletion();
            }
        });
    }

    update() {
        //simple over lap logic to call the textbox for puzzle piece interaction
        if (this.movementTutorialComplete == true && this.InteractingTutorialComplete == false) {
            for (let puzPiece of this.puzPieceGroup.getChildren()) {
                if (puzPiece.x - puzPiece.width < this.playerChar.x && this.playerChar.x < puzPiece.x + puzPiece.width*2) {
                    if (puzPiece.y - puzPiece.height < this.playerChar.y && this.playerChar.y < puzPiece.y + puzPiece.height*2) {
                        if (this.movementTutorialComplete == true && this.InteractingTutorialComplete == false) {
                            this.scene.launch("textBoxesScene", {
                                textChain:["SpaceToInteract"],
                                scenesToPauseAtStart: ["tutorialScene"],
                                scenesToResumeAtEnd: ["tutorialScene"]
                            });
                            this.InteractingTutorialComplete = true;
                        }
                    }
                }
            }
        }
    }

    checkForCompletion() {
        if (!this.puzManager.puzzleCompleted()) {
            return;
        }
        this.fullTutorialComplete = true;
        this.scene.launch("textBoxesScene", {
            textChain:["tutorialEnd"],
            scenesToPauseAtStart: ["tutorialScene"],
            scenesToStopAtEnd: ["tutorialScene"],
            scenesToStartAtEnd: ["menuScene"]
        });
        this.sound.removeByKey("menuBeat");
    }

    // Return the x and y of the player spawner as defined in Tiled
    // Copied from Play.js
    getPlayerCharacterCoordsFromObjectLayer(tilemap, layerName, tilesetName) {
        let objLayer = tilemap.getObjectLayer(layerName);
        let tileset = tilemap.getTileset(tilesetName);
        for (const tiledObj of objLayer.objects) {
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj["spawnerType"] == "player") {
                return new Phaser.Geom.Point(tiledObj.x + tiledObj.width/2, tiledObj.y - tileset.tileHeight + tiledObj.height/2); // subtract tileHeight here because of Tiled's origin convention of (0, 1)
            }
        }
    }
}