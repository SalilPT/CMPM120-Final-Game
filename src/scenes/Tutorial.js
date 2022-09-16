class Tutorial extends Phaser.Scene {
    constructor() {
        super("tutorialScene");
    }
    
    init(data) {
        // A bit of code to determine which part of the tutorial is currently being played
        this.part1Active = true;
        if (data.part2Active) {
            this.part1Active = false;
            this.part2Active = true;            
        }

        /*
        Part 1 Variables
        */
        this.fullTutorialComplete = false;
        this.movementTutorialComplete = false;
        this.interactingTutorialComplete = false;

        /*
        Part 2 Variables
        */
        this.combatTutorialComplete = false;
        // If this scene was restarted, don't display a text box explaining combat.
        // This scene can only restart from part 2
        if (data.fromRestart) {
            this.combatTutorialComplete = true;
            this.scene.settings.data.fromRestart = false;
        }
    }

    preload() {

    }

    create() {
        // mainly followed Nathan Altice's mappy example for collisions using tile maps
        this.map = this.add.tilemap(this.part1Active ? "tutorialMap" : "tutorialMapPart2");
        // set a tileset for the map and its corresponding layers
        const tileset = this.map.addTilesetImage("gameTileset", "gameTilesetAtlas");
        const floorLayer = this.map.createLayer("floor", tileset, 0, 0).setDepth(-100);
        this.wallLayer = this.map.createLayer("walls", tileset, 0, 0).setDepth(-99);
        // set collision based on the "collision" property that is set in the Tiled software
        this.wallLayer.setCollisionByProperty({
            collides: true
        });

        //groups
        this.puzPieceGroup = this.physics.add.group(); // group to house the puzzle pieces
        this.puzHoleGroup = this.physics.add.group(); // group to house the puzzle holes

        // create a player
        let plrSpawnPt = this.getPlayerCharacterCoordsFromObjectLayer(this.map, "spawnerLayer", "gameTileset");
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: plrSpawnPt.x,
            y: plrSpawnPt.y,
            // Get the first frame of Jeb's bottom idle spritesheet extracted from gameAtlas
            texture: "jebBottomIdleSpritesheet",
            frame: 0
        });
        this.playerChar.getMovManager().setMovSpd(400);
        this.physics.add.collider(this.playerChar, this.wallLayer);

        // Generate puzzle
        this.puzMgr = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzMgr.createPuzzleFromTilemap(this.map);

        this.puzPieceGroup.addMultiple(this.puzMgr.getAllPieces());
        this.puzHoleGroup.addMultiple(this.puzMgr.getAllHoles());

        // Camera
        this.cameras.main.startFollow(this.playerChar, false, 0.75, 0.75);
        // Camera behavior copied from Play.js
        let mapWidthGreaterOrEqual = this.map.widthInPixels >= globalGame.config.width;
        let mapHeightGreaterOrEqual = this.map.heightInPixels >= globalGame.config.height;
        this.cameras.main.setBounds(
            mapWidthGreaterOrEqual ? 0 : -(globalGame.config.width - this.map.widthInPixels)/2,
            mapHeightGreaterOrEqual ? 0 : -(globalGame.config.height - this.map.heightInPixels)/2,
            mapWidthGreaterOrEqual ? this.map.widthInPixels : globalGame.config.width,
            mapHeightGreaterOrEqual ? this.map.heightInPixels : globalGame.config.height
        );

        this.cameras.main.setBackgroundColor("#222222");

        // Glowing Holes Tween
        this.tweens.add({
            targets: this.puzHoleGroup.getChildren(),
            alpha: {from: 0.5, to: 1},
            duration: 500,
            repeat: -1,
            yoyo: true,
        });

        // Set up parts 1 and 2 in tutorial
        if (this.part1Active) {
            this.setUpPart1SpecificInteractions();
        }
        else if (this.part2Active) {
            this.setUpPart2SpecificInteractions();
        }
    }

    update() {
        // Logic to call the text box for puzzle piece interaction for part 1
        if (this.part1Active && this.movementTutorialComplete == true && this.interactingTutorialComplete == false) {
            for (const puzPiece of this.puzPieceGroup.getChildren()) {
                let pieceCloseHorizontally = (puzPiece.x - puzPiece.width < this.playerChar.x && this.playerChar.x < puzPiece.x + puzPiece.width*2);
                let pieceCloseVertically = (puzPiece.y - puzPiece.height < this.playerChar.y && this.playerChar.y < puzPiece.y + puzPiece.height*2);
                if (!(pieceCloseHorizontally && pieceCloseVertically)) {
                    continue;
                }

                this.scene.launch("textBoxesScene", {
                    textChain:["SpaceToInteract"],
                    scenesToPauseAtStart: ["tutorialScene"],
                    scenesToResumeAtEnd: ["tutorialScene"]
                });
                this.interactingTutorialComplete = true;
            }
        }
    }

    checkForPart1Completion() {
        
        if (!this.puzMgr.puzzleCompleted()) {
            return;
        }
        
        this.fullTutorialComplete = true;
        // Change the init data of this scene
        this.scene.settings.data.part2Active = true;

        // Launch text box for end of part 1
        this.scene.launch("textBoxesScene", {
            textChain:["TutorialPart1End"],
            scenesToPauseAtStart: ["tutorialScene"],
            scenesToStopAtEnd: ["tutorialScene"],
            scenesToStartAtEnd: ["tutorialScene"]
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

    // Set up events for part 1 of the tutorial
    setUpPart1SpecificInteractions() {
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
                this.checkForPart1Completion();
            }
        });
    }

    setUpPart2SpecificInteractions() {
        // Code below is heavily copied from Play.js

        // Prevent bullets from sometimes going through walls
        // Code copied from Play.js
        this.physics.world.TILE_BIAS = Math.max(this.map.getLayer("walls").tileWidth, this.map.getLayer("walls").tileHeight);

        // Enemy spawners
        this.enemyMgr = new EnemyManager(this, {
            playerChar: this.playerChar,
            tilemap: this.map,
            enemyBulletPatternCooldown: 750
        });
        this.enemyMgr.createEnemySpawnersFromTilemap(this.map);
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                // Don't exceed the maximum amount of enemies
                if (this.enemyMgr.getEnemiesGroup().getLength() == 3) {
                    return;
                }

                // Don't spawn any more enemies after the puzzle is completed
                if (this.puzMgr.puzzleCompleted()) {
                    return;
                }

                this.enemyMgr.spawnEnemyAtRandomSpawner();
            },
            loop: true
        });
        // Enemy collisions with walls
        this.physics.add.collider(this.enemyMgr.getEnemiesGroup(), this.wallLayer);

        // Bullets
        this.bltMgr = new BulletManager(this);

        this.physics.add.collider(this.playerChar, this.bltMgr.getEnemyBulletsGroup(), (player, bullet) => {
            bullet.setVelocity(0);
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);

            // If the bullet wouldn't bring the player character to 0 health, update health and health box normally.
            // Otherwise, trigger a restart of the level without playing the player character death animation
            if (player.health > 1) {
                player.takeDamage();
                this.userInterfaceMgr.setHealthBoxValue(player.health);
            }
            else {
                this.userInterfaceMgr.setHealthBoxValue(0);

                // Change the value of of fromRestart in the data that will be passed to the next init() call for this scene
                this.scene.settings.data.fromRestart = true;

                // Restart level
                this.scene.launch("textBoxesScene", {
                    textChain:["TookTooMuchDamage"],
                    scenesToPauseAtStart: ["tutorialScene"],
                    scenesToStopAtEnd: ["tutorialScene"],
                    scenesToStartAtEnd: ["tutorialScene"]
                });
            }
        });

        // Player bullets
        this.time.addEvent({
            delay: 0.125 * 1000,
            callback: () => {
                // Only fire when there's an enemy
                if (this.enemyMgr.getEnemiesGroup().getLength() == 0) {
                    return;
                }

                // Don't fire any bullets when player character is dead
                if (this.playerChar.isDead()) {
                    return;
                }

                this.bltMgr.addPattern("shootAtTarget", {
                    sourcePt: this.playerChar.body.center,
                    targetPt: new Phaser.Geom.Point(this.input.activePointer.worldX, this.input.activePointer.worldY),
                    bulletType: "purpleBullet",
                    bulletSpd: 1000,
                    enemyBullet: false
                });
                this.sound.play("jebShoot");
                this.playerChar.playAttackAnim();
            },
            loop: true
        });

        this.physics.add.collider(this.bltMgr.getPlayerBulletsGroup(), this.enemyMgr.getEnemiesGroup(), (bullet, enemy) => {
            this.bltMgr.getPlayerBulletsGroup().remove(bullet)
            enemy.takeDamage();
        });

        this.physics.add.collider(this.bltMgr.getPlayerBulletsGroup(), this.wallLayer, (bullet) => {
            this.bltMgr.getPlayerBulletsGroup().remove(bullet)
        });

        // Enemy bullets
        this.physics.add.collider(this.bltMgr.getEnemyBulletsGroup(), this.wallLayer, (bullet, wall) => {
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);
        });

        // User Interface
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        this.userInterfaceMgr.createHealthBox(32, 32, this.playerChar.health);

        // End game
        let gameEndCheck = this.time.addEvent({
            delay: 1000/globalGame.loop.targetFps,
            callback: () => {
                if (this.puzMgr.puzzleCompleted() && this.enemyMgr.getEnemiesGroup().getLength() == 0 && this.bltMgr.getEnemyBulletsGroup().getLength() == 0) {
                    this.time.removeEvent(gameEndCheck);

                    // Change the init data of this scene so that it resets properly
                    this.scene.settings.data.part2Active = undefined;

                    this.scene.launch("textBoxesScene", {
                        textChain:["TutorialPart2End"],
                        scenesToPauseAtStart: ["tutorialScene"],
                        scenesToStopAtEnd: ["tutorialScene"],
                        scenesToStartAtEnd: ["menuScene"]
                    });
                }
            },
            loop: true
        });

        // Make a textBox that explains combat
        if (!this.combatTutorialComplete) {
            this.time.delayedCall(125, () => {
                this.scene.launch("textBoxesScene", {
                    textChain: ["WatchOutForEnemies"],
                    scenesToPauseAtStart: ["tutorialScene"],
                    scenesToResumeAtEnd: ["tutorialScene"],             
                });
                this.combatTutorialComplete = true;
            });
        }
    }
}