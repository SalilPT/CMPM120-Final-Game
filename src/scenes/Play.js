class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init(data) {
        // Constants for game balancing
        const NUM_EASY_LEVELS_REQUIRED = 3;
        const NUM_MEDIUM_LEVELS_REQUIRED = 1;
        const NUM_HARD_LEVELS_REQUIRED = 1;
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
        let difficulty;
        if (numCompletedLevels < NUM_EASY_LEVELS_REQUIRED) {
            difficulty = "easy";
        }
        else if (numCompletedLevels < NUM_EASY_LEVELS_REQUIRED + NUM_MEDIUM_LEVELS_REQUIRED) {
            difficulty = "medium";
        }
        else {
            difficulty = "hard";
        }

        // Based on the difficulty, get the appropriate level data keys
        this.possibleLevels = this.registry.values.levels[difficulty];
        
        this.possibleLevels = this.possibleLevels.filter((level) => {return !this.completedLevels.includes(level);}); 
    }

    preload() {
        
    }

    create() {
        //this.possibleLevels = ["hard1"].filter((level) => {return !this.completedLevels.includes(level)});
        if (this.possibleLevels.length == 0) {
            console.log("No possible levels");
            this.scene.start("menuScene");
            return;
        }

        // Tilemap
        this.levelThatWasPicked = Phaser.Math.RND.pick(this.possibleLevels);
        let testTilemap2 = this.add.tilemap(this.levelThatWasPicked);
        const testTilemap2Tileset = testTilemap2.addTilesetImage("gameTileset", "gameTilesetAtlas");
        const floorLayer = testTilemap2.createLayer("floor", testTilemap2Tileset, 0, 0).setDepth(-100);
        const wallLayer = testTilemap2.createLayer("walls", testTilemap2Tileset, 0, 0).setDepth(-99);
        wallLayer.setCollisionByProperty({
            collides: true
        });

        // Player character
        let plrSpawnPt = this.getPlayerCharacterCoordsFromObjectLayer(testTilemap2, "spawnerLayer", "gameTileset");
        this.playerChar = new PlayerCharacter({
        scene: this,
        //x: globalGame.config.width/2,
        //y: globalGame.config.height/2,
        x: plrSpawnPt.x,
        y: plrSpawnPt.y,
        texture: "gameAtlas",
        frame: "JebBottomIdle1.png"
        });
        this.playerChar.body.setCircle(this.playerChar.width/2);
        this.plrMovManager = this.playerChar.getMovManager();
        this.plrMovManager.setMovSpd(400);
        this.physics.add.collider(this.playerChar, wallLayer);

        // Puzzles
        this.puzMgr = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzMgr.createPuzzleFromTilemap(testTilemap2);

        // Enemy spawners
        this.enemyMgr = new EnemyManager(this, {playerChar: this.playerChar});
        this.enemyMgr.createEnemySpawnersFromTilemap(testTilemap2);
        let spawners = this.enemyMgr.getEnemySpawnerGroup();
        this.time.addEvent({
            delay: 2 * 1000,
            callback: () => {
                if (this.puzMgr.puzzleCompleted()) {
                    return;
                }
                let s = Phaser.Math.RND.pick(spawners.getChildren());
                this.enemyMgr.spawnEnemyAtSpawner(s);
            },
            loop: true
        });
        // Move enemies
        this.physics.add.collider(this.enemyMgr.getEnemiesGroup(), wallLayer);

        
        // Bullets
        this.bltMgr = new BulletManager(this);

        this.physics.add.collider(this.playerChar, this.bltMgr.getEnemyBulletsGroup(), (player, bullet) => {
            bullet.setVelocity(0);
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);

            player.takeDamage();
            if (player.health == 0) {
                this.sound.removeByKey("backgroundMusic");
                this.scene.restart({
                    fromRestart: true,
                    levelsLeft: this.levelsLeft,
                    completedLevels: this.completedLevels,
                    restartLevelName: this.levelThatWasPicked
                });
            }

            this.userInterfaceMgr.setHealthBoxValue(player.health);
        });

        // Player bullets
        this.time.addEvent({
            delay: 0.125 * 1000,
            callback: () => {
                // Only fire when there's an enemy
                if (this.enemyMgr.getEnemiesGroup().getLength() == 0) {
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
        this.time.addEvent({
            delay: 0.5 * 1000,
            callback: () => {
                for (let enemy of this.enemyMgr.getEnemiesGroup().getChildren()) {
                    if (enemy.health <= 0) {
                        return;
                    }
                    let randomTarget = new Phaser.Geom.Point(
                        this.playerChar.body.center.x + Phaser.Math.RND.integerInRange(-64, 64), 
                        this.playerChar.body.center.y + Phaser.Math.RND.integerInRange(-64, 64)
                    );
                    this.bltMgr.addPattern("shootAtTarget", {
                        sourcePt: enemy.body.center,
                        targetPt: randomTarget,
                        bulletType: Phaser.Math.RND.pick(["orangeBullet", "yellowBullet"]),
                        bulletSpd: Phaser.Math.RND.integerInRange(200, 400)
                    });
                }
            },
            loop: true
        });

        this.physics.add.collider(this.bltMgr.getEnemyBulletsGroup(), wallLayer, (bullet, wall) => {
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);
        });

        // End game
        let gameEndCheck = this.time.addEvent({
            delay: 1000/60,
            callback: () => {
                if (this.puzMgr.puzzleCompleted() && this.enemyMgr.getEnemiesGroup().getLength() == 0 && this.bltMgr.getEnemyBulletsGroup().getLength() == 0) {
                    this.time.removeEvent(gameEndCheck);
                    // Put text at center of screen
                    if (this.levelsLeft >= 1) {
                        this.add.text(this.cameras.main.x + this.cameras.main.width/2, this.cameras.main.y + this.cameras.main.height/2, `Room Cleared\n${this.levelsLeft} Remain` + (this.levelsLeft == 1 ? "s ": ""), {align: "center", color: "white", fontFamily: "bulletFont", fontSize: "50px", stroke: "black", strokeThickness: 1}).setOrigin(0.5).setScrollFactor(0);
                    }
                    else {
                        this.add.text(this.cameras.main.x + this.cameras.main.width/2, this.cameras.main.y + this.cameras.main.height/2, "MISSION COMPLETED", {color: "white", fontFamily: "bulletFont", fontSize: "50px", stroke: "black", strokeThickness: 1}).setOrigin(0.5).setScrollFactor(0);
                    }
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
        this.sound.pauseOnBlur = false; // Prevents stacked audio when clicking back in game window
        this.backgroundMusic = this.sound.add("backgroundMusic").play({loop: true});

        // Camera
        this.cameras.main.startFollow(this.playerChar, false, 0.75, 0.75)
        .setBounds(0, 0, testTilemap2.widthInPixels, testTilemap2.heightInPixels);
    }

    update() {
        // Update pointer position
        this.input.activePointer.updateWorldPoint(this.cameras.main);        
    }

    // Return the x and y of the player spawner as defined in Tiled
    getPlayerCharacterCoordsFromObjectLayer(tilemap, layerName, tilesetName) {
        let objLayer = tilemap.getObjectLayer(layerName);
        let tileset = tilemap.getTileset(tilesetName);
        for (const tiledObj of objLayer.objects) {
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj["spawnerType"] == "player") {
                return new Phaser.Geom.Point(tiledObj.x + tiledObj.width/2, tiledObj.y + tiledObj.height/2);
            }
        }
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