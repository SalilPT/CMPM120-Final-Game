class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init(data) {
        // Constants for game balancing
        let isNormalPlaythrough = !globalGame.registry.values.extremeModeOn;
        const NUM_EASY_LEVELS_REQUIRED = (isNormalPlaythrough ? 3 : 4);
        const NUM_MEDIUM_LEVELS_REQUIRED = (isNormalPlaythrough ? 1 : 3);
        const NUM_HARD_LEVELS_REQUIRED = (isNormalPlaythrough ? 1 : 3);
        const TOTAL_LEVELS = NUM_EASY_LEVELS_REQUIRED + NUM_HARD_LEVELS_REQUIRED + NUM_HARD_LEVELS_REQUIRED;

        // Update the number of levels left
        this.levelsLeft = (data.levelsLeft ?? TOTAL_LEVELS) - 1;
        // If this level was restarted because the player character reached 0 health, play the same level again
        if (data.fromRestart) {
            this.possibleLevels = [data.restartLevelName];
            this.levelsLeft = data.levelsLeft;
            return;
        }

        // Figure out what difficulty this map should be
        this.completedLevels = data.completedLevels ?? [];
        let numCompletedLevels = this.completedLevels.length;
        this.difficulty = undefined;
        if (numCompletedLevels < NUM_EASY_LEVELS_REQUIRED) {
            this.difficulty = "easy";
        }
        else if (numCompletedLevels < NUM_EASY_LEVELS_REQUIRED + NUM_MEDIUM_LEVELS_REQUIRED) {
            this.difficulty = "medium";
        }
        else {
            this.difficulty = "hard";
        }

        // Based on the difficulty, get the appropriate level data keys
        this.possibleLevels = this.registry.values.levels[this.difficulty];
        
        this.possibleLevels = this.possibleLevels.filter((level) => {return !this.completedLevels.includes(level);}); 
    }

    preload() {
        
    }

    create() {
        /*
        Constants
        */
        // The maximum amount of enemies concurrently allowed in the current level
        const MAX_ENEMIES_OBJ = {
            "easy": 3,
            "medium": 6,
            "hard": 12
        };

        // Object to hold the time, in milliseconds, between the enemy manager's attempts to spawn an enemy
        const ENEMY_SPAWN_COOLDOWN_TIMES = {
            "easy": 2000,
            "medium": 1950,
            "hard": 1900
        }

        // Object to hold the time, in milliseconds, between each enemy's attempt to fire a bullet pattern
        const ENEMY_FIRING_COOLDOWN_TIMES = {
            "easy": 750,
            "medium": 625,
            "hard": 500
        }

        this.PLAY_SCENE_TEXT_CONFIG = {
            color: "white",
            fontFamily: "bulletFont",
            fontSize: "50px",
            stroke: "black",
            strokeThickness: 1,
            resolution: 8
        }

        this.TEXT_Z_INDEX = 20;

        /*
        */
        //this.possibleLevels = ["hard1"].filter((level) => {return !this.completedLevels.includes(level)});
        if (this.possibleLevels.length == 0) {
            console.log("No possible levels");
            this.scene.start("menuScene");
            return;
        }

        // Tilemap
        this.levelThatWasPicked = Phaser.Math.RND.pick(this.possibleLevels);
        let levelTilemap = this.add.tilemap(this.levelThatWasPicked);
        const levelTilemapTileset = levelTilemap.addTilesetImage("gameTileset", "gameTilesetAtlas");
        const floorLayer = levelTilemap.createLayer("floor", levelTilemapTileset, 0, 0).setDepth(-100);
        const wallLayer = levelTilemap.createLayer("walls", levelTilemapTileset, 0, 0).setDepth(-99);
        wallLayer.setCollisionByProperty({
            collides: true
        });

        // Prevent bullets from sometimes going through walls
        // Thanks to samme for their answer here: https://www.html5gamedevs.com/topic/36294-small-arcade-sprite-and-tilemap-collision-bug/?do=findComment&comment=208136
        this.physics.world.TILE_BIAS = Math.max(levelTilemap.getLayer("walls").tileWidth, levelTilemap.getLayer("walls").tileHeight);

        // Player character
        let plrSpawnPt = this.getPlayerCharacterCoordsFromObjectLayer(levelTilemap, "spawnerLayer", "gameTileset");
        this.playerChar = new PlayerCharacter({
        scene: this,
        //x: globalGame.config.width/2,
        //y: globalGame.config.height/2,
        x: plrSpawnPt.x,
        y: plrSpawnPt.y,
        // Get the first frame of Jeb's bottom idle spritesheet extracted from gameAtlas
        texture: "jebBottomIdleSpritesheet",
        frame: 0
        });

        if (globalGame.registry.values.extremeModeOn) {
            this.playerChar.health = 4;
        }

        this.playerChar.getMovManager().setMovSpd(400);
        this.physics.add.collider(this.playerChar, wallLayer);

        // Puzzles
        this.puzMgr = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzMgr.createPuzzleFromTilemap(levelTilemap);

        // Enemy spawners
        this.enemyMgr = new EnemyManager(this, {
            playerChar: this.playerChar,
            tilemap: levelTilemap,
            enemyBulletPatternCooldown: ENEMY_FIRING_COOLDOWN_TIMES[this.difficulty]
        });
        this.enemyMgr.createEnemySpawnersFromTilemap(levelTilemap);
        this.time.addEvent({
            delay: ENEMY_SPAWN_COOLDOWN_TIMES[this.difficulty],
            callback: () => {
                // Don't exceed the maximum amount of enemies
                if (this.enemyMgr.getEnemiesGroup().getLength() == MAX_ENEMIES_OBJ[this.difficulty]) {
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
        this.physics.add.collider(this.enemyMgr.getEnemiesGroup(), wallLayer);

        
        // Bullets
        this.bltMgr = new BulletManager(this);

        this.physics.add.collider(this.playerChar, this.bltMgr.getEnemyBulletsGroup(), (player, bullet) => {
            bullet.setVelocity(0);
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);

            player.takeDamage();
            this.userInterfaceMgr.setHealthBoxValue(player.health);
            if (player.health != 0) {
                return;
            }
            
            this.fadeOutBGM(750);

            this.playerChar.once("deathAnimCompleted", () => {
                // Extreme mode is off; restart the current level
                if (!globalGame.registry.values.extremeModeOn) {
                    this.restartLevelFromDeath();
                }
                
                // Extreme mode is on; return to the menu screen
                else {
                    this.playExtremeModeLoseSequence();
                }
            });
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

        this.physics.add.collider(this.bltMgr.getPlayerBulletsGroup(), wallLayer, (bullet) => {
            this.bltMgr.getPlayerBulletsGroup().remove(bullet)
        });

        // Enemy bullets
        this.physics.add.collider(this.bltMgr.getEnemyBulletsGroup(), wallLayer, (bullet, wall) => {
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);
        });

        // End game
        let gameEndCheck = this.time.addEvent({
            delay: 1000/globalGame.loop.targetFps,
            callback: () => {
                if (this.puzMgr.puzzleCompleted()
                    && this.enemyMgr.getEnemiesGroup().getLength() == 0
                    && this.bltMgr.getEnemyBulletsGroup().getLength() == 0
                    && !this.playerChar.isDead()) {
                    this.time.removeEvent(gameEndCheck);
                    // Put text at center of screen
                    if (this.levelsLeft >= 1) {
                        this.add.text(this.cameras.main.x + this.cameras.main.width/2, this.cameras.main.y + this.cameras.main.height/2, `Room Cleared\n${this.levelsLeft} Remain` + (this.levelsLeft == 1 ? "s ": ""), this.PLAY_SCENE_TEXT_CONFIG)
                        .setAlign("center")
                        .setOrigin(0.5)
                        .setScrollFactor(0)
                        .setDepth(this.TEXT_Z_INDEX)
                        ;
                    }
                    else {
                        let completionMessage = !globalGame.registry.values.extremeModeOn ? "MISSION COMPLETED" : "MISSION COMPLETED!";
                        this.add.text(this.cameras.main.x + this.cameras.main.width/2, this.cameras.main.y + this.cameras.main.height/2, completionMessage, this.PLAY_SCENE_TEXT_CONFIG)
                        .setOrigin(0.5)
                        .setScrollFactor(0)
                        .setDepth(this.TEXT_Z_INDEX)
                        ;
                    }

                    this.fadeOutBGM(1500);

                    this.time.delayedCall(2000, () => {
                        this.transitionToNextLevel();
                    });
                }
            },
            loop: true
        })

        // User Interface
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        this.userInterfaceMgr.createHealthBox(32, 32, this.playerChar.health);

        // Audio
        this.backgroundMusic = this.sound.add("backgroundMusic").play({loop: true});

        // Camera
        this.cameras.main.startFollow(this.playerChar, false, 0.75, 0.75);
        // If the map width is greater than or equal to the game width, have the camera's x center be based on the player character's center and the left and right edges of the map.
        // Otherwise, horizontally center the camera on the map center.
        // Similar deal with height
        let mapWidthGreaterOrEqual = levelTilemap.widthInPixels >= globalGame.config.width;
        let mapHeightGreaterOrEqual = levelTilemap.heightInPixels >= globalGame.config.height;
        this.cameras.main.setBounds(
            mapWidthGreaterOrEqual ? 0 : -(globalGame.config.width - levelTilemap.widthInPixels)/2,
            mapHeightGreaterOrEqual ? 0 : -(globalGame.config.height - levelTilemap.heightInPixels)/2,
            mapWidthGreaterOrEqual ? levelTilemap.widthInPixels : globalGame.config.width,
            mapHeightGreaterOrEqual ? levelTilemap.heightInPixels : globalGame.config.height
        );

        this.cameras.main.setBackgroundColor("#222222");
    }

    update() {

    }

    // Fade out the background music over the specified amount of milliseconds
    fadeOutBGM(milliseconds) {
        this.tweens.add({
            targets: this.sound.get("backgroundMusic"),
            volume: 0,
            duration: milliseconds
        });
    }

    // Return the x and y of the player spawner as defined in Tiled
    getPlayerCharacterCoordsFromObjectLayer(tilemap, layerName, tilesetName) {
        let objLayer = tilemap.getObjectLayer(layerName);
        let tileset = tilemap.getTileset(tilesetName);
        for (const tiledObj of objLayer.objects) {
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj["spawnerType"] == "player") {
                return new Phaser.Geom.Point(tiledObj.x + tiledObj.width/2, tiledObj.y - tileset.tileHeight + tiledObj.height/2); // Subtract tileHeight here because of Tiled's origin convention of (0, 1)
            }
        }
    }

    playExtremeModeLoseSequence() {
        // Game over text
        this.time.delayedCall(250, () => {
            this.add.text(this.cameras.main.x + this.cameras.main.width/2, this.cameras.main.y + this.cameras.main.height/2, "GAME OVER", this.PLAY_SCENE_TEXT_CONFIG)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(this.TEXT_Z_INDEX)
                ;
        });

        // Return to the menu
        this.time.delayedCall(2000 + 250, () => {
            this.sound.removeByKey("backgroundMusic");
            this.scene.start("menuScene");
        });
    }

    restartLevelFromDeath() {
        this.time.delayedCall(750, () => {
            this.sound.removeByKey("backgroundMusic");
            this.scene.restart({
                fromRestart: true,
                levelsLeft: this.levelsLeft,
                completedLevels: this.completedLevels,
                restartLevelName: this.levelThatWasPicked
            });
        });
    }

    transitionToNextLevel() {
        this.sound.removeByKey("backgroundMusic");
        if (this.levelsLeft == 0) {
            this.scene.start("menuScene");
            return;
        }
        this.scene.restart({
            levelsLeft: this.levelsLeft,
            completedLevels: this.completedLevels.concat([this.levelThatWasPicked])
        });
    }

}