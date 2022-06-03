class BulletsDemo extends Phaser.Scene {
    constructor() {
        super("bulletsDemoScene");
    }
    
    preload() {
        //visual assets
        this.load.atlas("gameAtlas", "./assets/bulletHellTileSet.png", "./assets/bulletHellTileSet.json");
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json"); // tile map JSON file (from tiled software)

        this.load.image("puzPieceSprite", "./assets/Key Temp.png");
        this.load.image("puzHoleSprite", "./assets/Enemy Temp.png");

        this.load.image("enemySprite", "./assets/Enemy Temp.png");
        this.load.image("bulletSprite", "./assets/Jeb Temp.png");

        this.load.image("background", "./assets/Metal Plating 1 64x64.png");
        //audio assets
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
    }

    create() {
        // Background
        this.background = this.add.tileSprite(0, 0, globalGame.config.width, globalGame.config.height, "background").setOrigin(0);
        this.background.setDepth(-1000);

        // Player character and movement
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: globalGame.config.width/2,
            y: globalGame.config.height/2,
            texture: "gameAtlas",
            frame: "jeb legs temp.png"
        });
        this.playerChar.setCircle(this.textures.getFrame("gameAtlas", "jeb legs temp.png").width/2);
        this.playerChar.setPushable(false);
        this.playerChar.setData("health", 5);

        this.plrMovManager = this.playerChar.getMovManager();
        this.plrMovManager.setMovSpd(400);
        this.playerChar.setCollideWorldBounds(true);

        // Player bullets (auto-fire)
        this.time.addEvent({
            delay: 0.125 * 1000,
            callback: () => {
                // Only fire when there's an enemy
                if (this.liveEnemies.getLength() == 0) {
                    return;
                }
                // Get angle between player character and mouse
                let fireAngle = Phaser.Math.Angle.Between(this.playerChar.body.center.x, this.playerChar.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
                fireAngle = Phaser.Math.RadToDeg(fireAngle);

                let newPlayerBullet = this.physics.add.sprite(this.playerChar.x, this.playerChar.y, "bulletSprite").setOrigin(0.5);
                let fireVector = this.physics.velocityFromAngle(fireAngle, 1000);
                newPlayerBullet.body.setVelocity(fireVector.x, fireVector.y);
                newPlayerBullet.setScale(0.5);
                this.plrBullets.add(newPlayerBullet);

                this.sound.play("shootingSFX");
            },
            loop: true
        });

        // Enemies
        this.liveEnemies = this.add.group();
        let enemySpawnTimer = this.time.addEvent({
            delay: 2*1000,
            callback: () => {
                if (this.puzzleIsCompleted) {
                    this.time.removeEvent(enemySpawnTimer);
                    return;
                }
                if (this.liveEnemies.getLength() >= 5) {
                    return;
                }
                const enemySpawnPositions = [
                    new Phaser.Geom.Point(128, 128),
                    new Phaser.Geom.Point(globalGame.config.width - 128, 128),
                    new Phaser.Geom.Point(128, globalGame.config.height - 128),
                    new Phaser.Geom.Point(globalGame.config.width - 128, globalGame.config.height - 128),
                    new Phaser.Geom.Point(192, 192),
                    new Phaser.Geom.Point(globalGame.config.width - 192, 192),
                    new Phaser.Geom.Point(192, globalGame.config.height - 192),
                    new Phaser.Geom.Point(globalGame.config.width - 192, globalGame.config.height - 192)
                ];
                let randomSpawnPoint = Phaser.Math.RND.pick(enemySpawnPositions);
                let newEnemy = this.physics.add.sprite(randomSpawnPoint.x, randomSpawnPoint.y, "enemySprite");
                newEnemy.setData("health", 3);
                newEnemy.setPushable(false);
                this.liveEnemies.add(newEnemy);
            },
            loop: true
        })

        // Bullets
        this.bulletManager = new BulletManager(this);
        this.plrBullets = this.add.group();
        this.enemyBullets = this.add.group();

        this.physics.add.collider(this.plrBullets, this.liveEnemies, (bullet, enemy) => {
            this.plrBullets.remove(bullet);
            bullet.destroy();
            
            enemy.incData("health", -1);
            if (enemy.getData("health") == 0) {
                this.liveEnemies.remove(enemy);
                enemy.destroy();
            }

        });

        this.physics.add.collider(this.playerChar, this.enemyBullets, (player, bullet) => {
            this.enemyBullets.remove(bullet);
            bullet.body.checkCollision.none = true;
            bullet.destroy();

            player.incData("health", -1);
            if (player.getData("health") == 0) {
                this.scene.restart();
            }
        });

        this.time.addEvent({
            delay: 0.5 * 1000,
            callback: () => {
                for (let enemy of this.liveEnemies.getChildren()) {
                    let randomTarget = new Phaser.Geom.Point(
                        this.playerChar.body.center.x + Phaser.Math.RND.integerInRange(-64, 64), 
                        this.playerChar.body.center.y + Phaser.Math.RND.integerInRange(-64, 64)
                    );
                    this.fireEnemyBulletAtTarget(enemy, Phaser.Math.RND.integerInRange(200, 400), randomTarget);
                }
            },
            loop: true
        });
        
        // Puzzle (copied from Tutorial scene)
        this.puzzleSlotgroup = this.physics.add.group();
        // Make a sequence
        let seqName = "sequence1";
        this.puzManager = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzManager.addSequence(seqName);
        for (let i = 1; i < 4 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 320*i,
                y: 768 + 64 * Math.pow(-1, i),
                texture: "gameAtlas",
                frame: "puzzlePiece" + i + ".png"
            }).setOrigin(0);
            newPiece.numInSequence = i;
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqName);
            let newPuzHole = this.physics.add.sprite(320*i, 192 + 64 * Math.pow(-1, i), "gameAtlas", "puzzleSlot" + i + ".png").setOrigin(0);
            this.puzzleSlotgroup.add(newPuzHole); 
            newPuzHole.numInSequence = i;
            this.puzManager.addPuzzleHoleToSeq(newPuzHole, seqName);
            
        }

        this.puzzleIsCompleted = false;
        this.levelComplete = false;

        // Sound-related
        this.sound.pauseOnBlur = false; // Prevents stacked audio when clicking back in game window

        // Other stuff
        let debugTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.healthText = this.playerChar.getData("health").toString();
        this.healthTextbox = this.add.text(globalGame.config.width/2, 64, this.healthText, debugTextConfig).setOrigin(0.5);
        //this.controlsTextObj = this.add.text(this.playerChar.x, this.playerChar.y - 64, "Controls: WASD to move, SPACE to pick up/place down", debugTextConfig).setOrigin(0.5);
        this.add.text(globalGame.config.width - 32, globalGame.config.height - 64, "Press 0 (non-numpad) to go back to Menu", debugTextConfig).setOrigin(1, 0);
        this.input.keyboard.on("keydown-ZERO", () => {this.scene.start("menuScene");});
    }

    update() {
        let movVector = this.plrMovManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);

        // Update player bullets
        for (let bullet of this.plrBullets.getChildren()) {
            if (!Phaser.Geom.Rectangle.Overlaps(this.cameras.main.worldView, bullet.getBounds())) {
                this.plrBullets.remove(bullet);
                bullet.destroy();
            }
        }

        // Update enemy bullets
        for (let bullet of this.enemyBullets.getChildren()) {
            if (!Phaser.Geom.Rectangle.Overlaps(this.cameras.main.worldView, bullet.getBounds())) {
                this.enemyBullets.remove(bullet);
                bullet.destroy();
            }
        }

        // Update health text
        this.healthText = "Health: " + this.playerChar.getData("health").toString();
        this.healthTextbox.text = this.healthText;

        // Puzzle
        this.puzzleIsCompleted = this.puzManager.puzzleCompleted();

        // Level complete?
        if (this.puzzleIsCompleted && this.liveEnemies.getLength() == 0 && this.enemyBullets.getLength() == 0 && !this.levelComplete) {
            this.levelComplete = true;
            this.add.text(globalGame.config.width/2, globalGame.config.height/2, "Level Complete", {color: "white", fontFamily: "Impact", fontSize: "50px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
        }
    }

    fireEnemyBulletAtTarget(enemy, bulletSpd, target) {
        let newBullet = this.physics.add.sprite(enemy.getCenter().x, enemy.getCenter().y, "enemySprite");
        newBullet.setScale(0.5);

        let fireAngle = Phaser.Math.Angle.Between(newBullet.getCenter().x, newBullet.getCenter().y, target.x, target.y);
        fireAngle = Phaser.Math.RadToDeg(fireAngle);
        let fireVector = this.physics.velocityFromAngle(fireAngle, bulletSpd);
        newBullet.body.setVelocity(fireVector.x, fireVector.y);
        
        this.enemyBullets.add(newBullet);
    }
}