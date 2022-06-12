class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);

        this.playerChar = params.playerChar;

        /*
        Constants
        */
        // A reference to the tilemap used by the scene this is in.
        //this.PARENT_SCENE_TILEMAP = params.parentSceneTilemap;

        // The amount of time in milliseconds it takes for this enemy to walk into the room.
        // After it has entered the room, it will have collisions with the player character's bullets.
        this.SPAWN_IN_TIME = 0.5 * 1000;

        /*
        Properties
        */
        //this.setTexture("gameAtlas", "Enemy1IdleFrame1.png")
        
        this.health = params.health ?? 5;

        // The initial angle of this object's graphics
        this.initAngle = -90;

        this.scene.anims.create({
            key: "enemyAnim",
            frameRate: 15,
            frames: this.scene.anims.generateFrameNames("gameAtlas", {
                prefix: "Enemy1IdleFrame",
                suffix: ".png",
                start: 1,
                end: 8,
            }),
            repeat: -1
        });

        this.scene.anims.create({
            key: "enemyDeathAnim",
            frameRate: 15,
            frames: this.scene.anims.generateFrameNames("gameAtlas", {
                prefix: "Enemy1deathFrame",
                suffix: ".png",
                start: 1,
                end: 9,
            }),
            repeat: 0
        });
        
        this.play("enemyAnim");

        this.movementTimer = this.scene.time.addEvent({
            delay: 0.75 *1000,
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
    }

    /*
    Public Methods
    */

    facePlayerChar() {
        if (!this.#canSeePlayerChar()) {
            return;
        }
        let angleToPlayer = this.#getAngleToPlayerChar();
        this.setAngle(-this.initAngle + angleToPlayer);
    }

    moveTowardsPlayer() {
        let angleToPlayer = this.#getAngleToPlayerChar();
        let vec = this.scene.physics.velocityFromAngle(angleToPlayer, 200);
        this.body.setVelocity(vec.x, vec.y);
        this.facePlayerChar();
        this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.body != undefined) {
                    this.body.setVelocity(0, 0);
                }
            }
        })
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
            onComplete: () => {this.body.checkCollision.none = false}
        });
    }
    
    /*
    Private Methods
    */
    // Returns true if an uninterrupted line can be formed from this object's center tothe center of the player character.
    // Gets all tiles within a rectangular bounding box that has the player character and this object.
    #canSeePlayerChar() {
        return true; // Placeholder
       // getTilesWithin
    }

    #getAngleToPlayerChar() {
        let angleToPlayer = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, this.playerChar.body.center.x, this.playerChar.body.center.y);
        angleToPlayer = Phaser.Math.RadToDeg(angleToPlayer);
        return angleToPlayer;
    }
}