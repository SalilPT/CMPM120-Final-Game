class Play extends Phaser.Scene {
    constructor() {
        super("playScene");
    }

    init() {
        
    }

    preload() {
        // Preload player character images and spritesheets
        this.load.spritesheet("jebBottomIdle", "./assets/Jeb Bottom Idle Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebBottomMoving", "./assets/Jeb Bottom Moving Spritesheet.png", {frameWidth: 64});
        this.load.image("jebRingOff", "./assets/Jeb Ring Off.png");
        this.load.spritesheet("jebRings", "./assets/Jeb Rings Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopAttacking", "./assets/Jeb Top Attcking Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopCharging", "./assets/Jeb Top Charging Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopDeath", "./assets/Jeb Top Death Spritesheet.png", {frameWidth: 64});
        this.load.image("jebTopStart", "./assets/Jeb Top Start.png");

        // Testing tilemap
        this.load.tilemapTiledJSON("testTilemap2", "./assets/Template Level Example 2.json");
        this.load.atlas("gameAtlas", "./assets/gameAtlas.png", "./assets/gameAtlas.json");

        // Preload bullets
        this.load.image("orangeBullet", "./assets/orangeBullet.png");
        this.load.image("purpleBullet", "./assets/purpleBullet.png");
        this.load.image("yellowBullet", "./assets/yellowBullet.png");

        // Load background music
        this.load.audio("backgroundMusic", "./assets/audio/finalGameMusic.mp3");
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
    }

    create() {
        // Player character
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: globalGame.config.width/2,
            y: globalGame.config.height/2,
            texture: "gameAtlas",
            frame: "JebBottomIdle1.png"
        });
        this.playerChar.body.setCircle(this.playerChar.width/2);
        this.plrMovManager = this.playerChar.getMovManager();
        this.plrMovManager.setMovSpd(400);

        // Tilemap
        let testTilemap2 = this.add.tilemap("testTilemap2");
        const testTilemap2Tileset = testTilemap2.addTilesetImage("gameAtlasTileset", "gameAtlas");
        const floorLayer = testTilemap2.createLayer("Floor", testTilemap2Tileset, 0, 0).setDepth(-100);
        const wallLayer = testTilemap2.createLayer("Walls", testTilemap2Tileset, 0, 0).setDepth(-99);
        wallLayer.setCollisionByProperty({
            collides: true
        });
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
        this.time.addEvent({
            delay: 1 * 1000,
            callback: () => {
                if (this.enemyMgr.getEnemiesGroup().getLength() > 0) {
                    for (let enemy of this.enemyMgr.getEnemiesGroup().getChildren()) {
                        enemy.moveTowardsPlayer();
                    }
                }
            },
            loop: true
        });
        
        // Bullets
        this.bltMgr = new BulletManager(this);

        this.physics.add.collider(this.playerChar, this.bltMgr.getEnemyBulletsGroup(), (player, bullet) => {
            this.bltMgr.getEnemyBulletsGroup().remove(bullet);

            player.takeDamage();
            if (player.health == 0) {
                this.sound.removeByKey("backgroundMusic");
                this.scene.restart();
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
                this.bltMgr.addPattern("shootAtTarget", {
                    sourcePt: this.playerChar.body.center,
                    targetPt: new Phaser.Geom.Point(this.input.activePointer.worldX, this.input.activePointer.worldY),
                    bulletType: "purpleBullet",
                    bulletSpd: 1000,
                    enemyBullet: false
                });
                this.sound.play("shootingSFX");
                this.playerChar.playAttackAnim();
            },
            loop: true
        });

        this.physics.add.collider(this.bltMgr.getPlayerBulletsGroup(), this.enemyMgr.getEnemiesGroup(), (bullet, enemy) => {
            this.bltMgr.getPlayerBulletsGroup().remove(bullet);
            
            enemy.takeDamage();
        });

        // Enemy bullets
        this.time.addEvent({
            delay: 0.5 * 1000,
            callback: () => {
                for (let enemy of this.enemyMgr.getEnemiesGroup().getChildren()) {
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
                    this.add.text(globalGame.config.width/2, globalGame.config.height/2, "Level Complete", {color: "white", fontFamily: "bulletFont", fontSize: "50px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
                    
                    this.time.delayedCall(2000, () => {
                        this.scene.start("menuScene");
                        this.sound.removeByKey("backgroundMusic");
                    });
                }
            },
            loop: true
        })

        // User Interface

        // Audio
        this.sound.pauseOnBlur = false; // Prevents stacked audio when clicking back in game window
        this.backgroundMusic = this.sound.add("backgroundMusic").play({loop: true});
    }

    update() {
        let movVector = this.plrMovManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);
        this.playerChar.updateGraphics();
    }

}