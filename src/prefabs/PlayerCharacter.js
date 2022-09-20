class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);

        /*
        Constants
        */
        this.EVENT_EMITTER_KEYS = {
            deathAnimCompleted: "deathAnimCompleted"
        };

        /*
        Properties
        */
        // The health points of the player
        this.health = 5;

        // Movement manager
        this.movManager = new PlayerMovementManager(params.scene);

        /*
        Things to do when the scene when the parent scene calls update()
        */
        let updateListenerFunction = () => {
            // Update pointer position
            this.scene.input.activePointer.updateWorldPoint(this.scene.cameras.main);

            // Update movement
            let movVector = this.movManager.getMovementVector();
            this.body.setVelocity(movVector.x, movVector.y);
        }
        this.scene.events.on("update", updateListenerFunction, this);
        let postUpdateListenerFunction = () => {this.#updateGraphics();}
        this.scene.events.on("postupdate", postUpdateListenerFunction, this);
        this.once("destroy", () => {
            this.scene.events.removeListener("update", updateListenerFunction, this);
            this.scene.events.removeListener("postupdate", postUpdateListenerFunction, this);
        });

        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);

        // Set up phyics body
        this.body.setCircle(this.width/2);
        this.body.setImmovable(true);

        /*
        Set up animations
        */
        this.scene.anims.create({
            key: "jebBottomIdleAnim",
            frames: this.anims.generateFrameNumbers("jebBottomIdleSpritesheet", {}),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: "jebBottomMovingAnim",
            frames: this.anims.generateFrameNumbers("jebBottomMovingSpritesheet", {}),
            frameRate: 12,
            repeat: -1
        });
        this.scene.anims.create({
            key: "jebRingAnim",
            frames: this.anims.generateFrameNumbers("jebRingsSpritesheet", {}),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: "jebTopAttackingAnim",
            frames: this.anims.generateFrameNumbers("jebTopAttackingSpritesheet", {}),
            frameRate: 30,
            repeat: 0
        });
        this.scene.anims.create({
            key: "jebTopChargingAnim",
            frames: this.anims.generateFrameNumbers("jebTopChargingSpritesheet", {}),
            frameRate: 8,
            repeat: 0
        });
        this.scene.anims.create({
            key: "jebTopDeathAnim",
            frames: this.anims.generateFrameNumbers("jebTopDeathSpritesheet", {}),
            frameRate: 8,
            repeat: 0
        });
        /*
        */

        // This object actually controls the bottom part of Jeb's body
        this.play("jebBottomIdleAnim");
        this.bottomInitAngle = -90;
        // The angle to tween the bottom of the body to
        this.targetMovVector = Phaser.Math.Vector2.ZERO;
        // This variable name will be used later to control rotations when movement input is present
        this.bottomRotationTween = this.scene.add.tween({targets: this});

        // Add sprites to use for render texture
        this.bodyMiddle = this.scene.physics.add.sprite(0, 0, "gameAtlas", "Jeb Ring Off.png")
            .setOrigin(0.5)
            .setAngularVelocity(24) // Give the sprite texture of this a small amount of rotation
            ;
        this.#hideBodyPart(this.bodyMiddle);
        this.bodyMiddle.play("jebRingAnim");

        this.bodyTop = this.scene.physics.add.sprite(0, 0, "gameAtlas", "Jeb Top Start.png")
            .setOrigin(0.5)
            .setData("initialAngle", -90)
            ;
        this.#hideBodyPart(this.bodyTop);
        this.bodyTop.play("jebTopChargingAnim");
        // Listen for event that's emitted when an attacking animation finishes
        this.bodyTop.on("animationcomplete-jebTopAttackingAnim", () => {
            if (this.isDead()) {
                return;
            }
            // Switch to last frame of charging animation
            this.bodyTop.play({
                key: "jebTopChargingAnim",
                startFrame: this.scene.anims.get("jebTopChargingAnim").getTotalFrames() - 1
            });
        });

        // Draw body parts to a render texture
        this.bodyRenderTexture = this.scene.add.renderTexture(this.x, this.y, this.width, this.height);
        this.bodyRenderTexture.setOrigin(0.5)
            .draw(this.bodyMiddle, this.width/2, this.height/2)
            .draw(this.bodyTop, this.width/2, this.height/2)
            ;
    }

    /*
    Public Methods
    */
    isDead() {
        return this.health <= 0;
    }

    // Returns a reference to this object's corresponding movement manager
    getMovManager() {
        return this.movManager;
    }

    playAttackAnim() {
        this.bodyTop.play("jebTopAttackingAnim");
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.scene.sound.play("jebDeath");
            this.body.checkCollision.none = true;
            this.movManager.setMovSpd(0);
            this.#playDeathAnim();
            return;
        }

        // Play regular damage sound instead
        this.scene.sound.play("jebHurt");
    }

    /*
    Private Methods
    */
    #hideBodyPart(part) {
        part.setVisible(false); // Don't show this in the world
        part.body.checkCollision = {
            none: true,
            up: false,
            right: false,
            down: false,
            left: false
        };
    }

    #playDeathAnim() {
        this.bodyTop.play("jebTopDeathAnim");
        this.bodyTop.once("animationcomplete-jebTopDeathAnim", () => {
            this.emit(this.EVENT_EMITTER_KEYS.deathAnimCompleted);
        });
    }

    #updateGraphics() {
        if (this.health <= 0) {
            this.bodyRenderTexture.clear().draw(this.bodyTop, this.width/2, this.height/2);
            return;
        }

        // Update the bottom
        let movVector = this.movManager.getMovementVector();
        if (this.bottomRotationTween.paused) {
            this.bottomRotationTween.resume();
        }

        // If the player character isn't moving, pause the rotation tween and set the bottom to use its idle animation
        let movVecIsZero = movVector.equals(Phaser.Math.Vector2.ZERO);
        if (movVecIsZero) {
            this.bottomRotationTween.pause();
            if (this.anims.currentAnim.key != "jebBottomIdleAnim") {
                this.play("jebBottomIdleAnim");
            }
        }
        else if (!movVector.equals(this.targetMovVector)) {
            this.targetMovVector = movVector;
            let newBaseAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.BetweenPoints(Phaser.Math.Vector2.ZERO, movVector));
            let targetBottomAngle = Phaser.Math.Angle.WrapDegrees(-this.bottomInitAngle + newBaseAngle);
            let startAngle = this.angle;
            let targetAngleOffset = Phaser.Math.Angle.ShortestBetween(startAngle, targetBottomAngle);
            // Re-make the rotation tween
            this.bottomRotationTween.stop();
            this.bottomRotationTween.remove();
            this.bottomRotationTween = this.scene.add.tween({
                targets: this,
                angle: {from: startAngle, to: startAngle + targetAngleOffset},
                duration: 250,
                ease: Phaser.Math.Easing.Linear
            });
        }

        // Set to moving animation if movement input is present
        if (!movVecIsZero && this.anims.currentAnim.key != "jebBottomMovingAnim") {
            this.play("jebBottomMovingAnim");
        }

        // Update the direction that the gun is facing
        let fireAngle = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
        fireAngle = Phaser.Math.RadToDeg(fireAngle);
        this.bodyTop.setAngle(-this.bodyTop.getData("initialAngle") + fireAngle);

        // Update the render texture for the body pieces
        this.bodyRenderTexture.clear()
            .setPosition(this.x, this.y)
            .draw(this.bodyMiddle, this.width/2, this.height/2)
            .draw(this.bodyTop, this.width/2, this.height/2)
            ;
    }
}