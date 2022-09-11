class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);

        this.playerChar = params.playerChar;
        // A reference to the tilemap used by the scene this is in.
        this.parentSceneTilemap = params.parentSceneTilemap;
        // The name of the layer with tiles that have collision.
        this.parentSceneTilemapCollisionLayer = params.parentSceneTilemapCollisionLayer;
        // The time in milliseconds between bullet patterns
        this.bulletPatternCooldown = params.bulletPatternCooldown;

        /*
        Constants
        */
        this.EVENT_EMITTER_KEYS = {
            addBulletPattern: "addBulletPattern"
        }

        // The amount of time in milliseconds it takes for this enemy to walk into the room.
        // After it has entered the room, it will have collisions with the player character's bullets.
        this.SPAWN_IN_TIME = 0.5 * 1000;

        /*
        Properties
        */
        
        this.health = params.health ?? 5;

        // Variables used for enemy spawners
        // this.hasMoved changes to true once it has lunged toward the player at least once
        this.parentSpawner = params.parentSpawner;
        this.hasMoved = false;

        // The initial angle of this object's graphics
        this.initAngle = -90;

        this.scene.anims.create({
            key: "enemyAnim",
            frameRate: 15,
            frames: this.scene.anims.generateFrameNumbers("enemyIdleAnimSpritesheet", {}),
            repeat: -1
        });
        this.scene.anims.create({
            key: "enemyDeathAnim",
            frameRate: 15,
            frames: this.scene.anims.generateFrameNumbers("enemyDeathAnimSpritesheet", {}),
            repeat: 0
        });

        this.play("enemyAnim");

        this.movementTimer = this.scene.time.addEvent({
            delay: 0.75 * 1000,
            callback: () => {
                this.moveTowardsPlayer();
            },
            loop: true
        })
        

        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);

        this.body.setCircle(this.width/2);

        this.setImmovable(true);

        this.takingDamageEffectTimer;

        this.bulletPatternTimer = this.scene.time.addEvent({
            delay: this.bulletPatternCooldown,
            callback: () => {
                    // Don't spawn bullets from this enemy if it can't see the player character
                    if (!this.#canSeePlayerChar()) {
                        return;
                    }

                    if (this.health <= 0) {
                        return;
                    }

                    let randomTarget = new Phaser.Geom.Point(
                        this.playerChar.body.center.x + Phaser.Math.RND.integerInRange(-64, 64), 
                        this.playerChar.body.center.y + Phaser.Math.RND.integerInRange(-64, 64)
                    );
                    this.scene.events.emit(this.EVENT_EMITTER_KEYS.addBulletPattern, "shootAtTarget", {
                        sourcePt: this.body.center,
                        targetPt: randomTarget,
                        bulletType: Phaser.Math.RND.pick(["orangeBullet", "yellowBullet"]),
                        bulletSpd: Phaser.Math.RND.integerInRange(200, 400)
                    });
            },
            loop: true,
            paused: true
        });
        this.once("destroy", () => {this.scene.time.removeEvent(this.bulletPatternTimer);});
    }

    /*
    Public Methods
    */

    facePlayerChar() {
        let angleToPlayer = this.#getAngleToPlayerChar();
        this.setAngle(-this.initAngle + angleToPlayer);
    }

    moveTowardsPlayer() {
        // Don't move this enemy if it can't see the player character
        if (!this.#canSeePlayerChar()) {
            return;
        }

        let angleToPlayer = this.#getAngleToPlayerChar();
        let vec = this.scene.physics.velocityFromAngle(angleToPlayer, 200);
        this.body.setVelocity(vec.x, vec.y);
        this.facePlayerChar();
        
        // Update variable used for enemy spawners
        this.hasMoved = true;

        // After a short amount of time, stop moving
        this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.body != undefined) {
                    this.body.setVelocity(0, 0);
                }
            }
        });
    }
    
    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.scene.sound.play("enemyDeath");
            this.scene.time.removeEvent(this.movementTimer);

            this.body.checkCollision.none = true;
            this.play("enemyDeathAnim");
            this.on("animationcomplete", () => {
                // Destroy self after death animation is complete
                if (this != null) {
                    this.destroy();
                }
            });
            return;
        }

        // Visual effect
        this.setTintFill(0xFFFFFF);
        // Prevent multiple timers for damage effect
        // Don't actually need to check whether the event is null or not
        this.scene.time.removeEvent(this.takingDamageEffectTimer);
        this.takingDamageEffectTimer = this.scene.time.delayedCall(50, () => {
            if (this != undefined && !this.takingDamageEffectOn) {
                this.clearTint();
                this.takingDamageEffectTimer = null;
            }
        });

        this.scene.sound.play("enemyGetsHit")
    }

    playSpawningAnim(startPos, endPos) {
        // Don't check collision during animation
        this.body.checkCollision.none = true;

        let facingAngle = Phaser.Math.Angle.BetweenPoints(startPos, endPos);
        facingAngle = Math.round(Phaser.Math.RadToDeg(facingAngle));
        this.setAngle(-this.initAngle + facingAngle);
        this.scene.add.tween({
            targets: this,
            x: {from: startPos.x, to: endPos.x},
            y: {from: startPos.y, to: endPos.y},
            duration: this.SPAWN_IN_TIME,
            ease: Phaser.Math.Easing.Quadratic.In,
            onComplete: () => {
                this.body.checkCollision.none = false;
                this.bulletPatternTimer.paused = false;
            }
        });
    }
    
    /*
    Private Methods
    */
    // Returns true if an uninterrupted line can be formed from this object's center to the center of the player character.
    // Gets all tiles within a rectangular bounding box that has the player character and this object.
    #canSeePlayerChar() {       
       let tilemap = this.parentSceneTilemap;

       let myCenter = this.body.center;
       let plrCenter = this.playerChar.body.center;

       // The line that will be used to determine whether or not this enemy can "see" the player character
       let traceLine = new Phaser.Geom.Line(myCenter.x, myCenter.y, plrCenter.x, plrCenter.y);

       let tileRectX = Math.min(myCenter.x, plrCenter.x);
       let tileRectY = Math.min(myCenter.y, plrCenter.y);
       let tileRectWidth = Math.abs(myCenter.x - plrCenter.x);
       let tileRectHeight = Math.abs(myCenter.y - plrCenter.y);

       // Select the correct layer for collisions because doing it in the getTilesWithinWorldXY method doesn't seem to work
       let oldSelectedLayer = tilemap.layer.name;
       tilemap.setLayer(this.parentSceneTilemapCollisionLayer);

       // Get an array of tiles to check
       let tilesToCheck = tilemap.getTilesWithinWorldXY(tileRectX, tileRectY, tileRectWidth, tileRectHeight, {isColliding: true});

       // Set the selected layer of the tilemap to what it was before this method was called
       tilemap.setLayer(oldSelectedLayer);

       for (let tile of tilesToCheck) {
           let intersectionRect = tile.getBounds(this.scene.cameras.main);
           let intersectionPoints = Phaser.Geom.Intersects.GetLineToRectangle(traceLine, intersectionRect);
           if (intersectionPoints.length != 0) {
               return false;
           }
       }

       return true;
    }

    #getAngleToPlayerChar() {
        let angleToPlayer = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, this.playerChar.body.center.x, this.playerChar.body.center.y);
        angleToPlayer = Phaser.Math.RadToDeg(angleToPlayer);
        return angleToPlayer;
    }
}