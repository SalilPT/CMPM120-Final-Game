class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        /*
        Properties
        */

        // The health points of the player
        this.health = 5;
        // Movement manager
        this.movManager = new PlayerMovementManager(params.scene);

        /*
        Things to do when the scene with this object calls update()
        */
        /*
        let listenerFunction = () => {
                // Update movement
                //console.log("?????", this.body);
                let movVector = this.movManager.getMovementVector();
                if (movVector == null) {
                    console.log("\n\n\nAAA");
                }
                try {
                    
                    this.body.setVelocity(movVector.x, movVector.y);
                    //console.log("HUH")
                }
                catch {console.log("OK???", this.body);}
            }
            let updListener = this.scene.events.on("update", listenerFunction, this);
            this.scene.events.on("shutdown", () => {console.log("shutdown");});
            */
        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);

        /*
        Set up animations
        */
       
        this.scene.anims.create({
            key: "jebBottomIdleAnim",
            frames: this.anims.generateFrameNumbers("jebBottomIdle", {start: 0}),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "jebBottomMovingAnim",
            frames: this.anims.generateFrameNumbers("jebBottomMoving", {start: 0}),
            frameRate: 12,
            repeat: -1
            });

        this.scene.anims.create({
            key: "jebRingAnim",
            frames: this.anims.generateFrameNumbers("jebRings", {start: 0}),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "jebTopAttackingAnim",
            frames: this.anims.generateFrameNumbers("jebTopAttacking", {start: 0}),
            frameRate: 30,
            repeat: 0
        });

        this.scene.anims.create({
            key: "jebTopChargingAnim",
            frames: this.anims.generateFrameNumbers("jebTopCharging", {start: 0}),
            frameRate: 8,
            repeat: 0
        });

        this.scene.anims.create({
            key: "jebTopDeathAnim",
            frames: this.anims.generateFrameNumbers("jebTopDeath", {start: 0}),
            frameRate: 8,
            repeat: -1
        });

        // This object actually controls the bottom part of Jeb's body
        this.play("jebBottomIdleAnim");
        this.bottomInitAngle = -90;
        // The angle to tween the bottom of the body to
        this.targetMovVector = Phaser.Math.Vector2.ZERO;
        // This variable name will be used later to control rotations when movement input is present
        this.bottomRotationTween = this.scene.add.tween({targets: this});

        // Add sprites to use for render texture
        this.bodyMiddle = this.scene.physics.add.sprite(0, 0, "jebRingOff", 0)
            .setOrigin(0.5)
            .setAngularVelocity(24) // Give the sprite texture of this a small amount of rotation
        this.#hideBodyPart(this.bodyMiddle);
        this.bodyMiddle.play("jebRingAnim");

        this.bodyTop = this.scene.physics.add.sprite(0, 0, "jebTopStart", 0)
            .setOrigin(0.5)
            .setData("initialAngle", -90);
        this.#hideBodyPart(this.bodyTop);
        this.bodyTop.play("jebTopChargingAnim");
        // Listen for event that's emitted when an attacking animation finishes
        this.bodyTop.on("animationcomplete-jebTopAttackingAnim", () => {
            if (this.health <= 0) {
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
   
    // Returns a reference to this object's corresponding movement manager
    getMovManager() {
        return this.movManager;
    }

    updateGraphics() {
        // Update the bottom
        let movVector = this.movManager.getMovementVector();
        //console.log("movVector:", movVector.length() == 0);
        if (this.bottomRotationTween.paused) {
            this.bottomRotationTween.resume()
        };
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
            .draw(this.bodyTop, this.width/2, this.height/2);
            ;
    }

    playAttackAnim() {
        this.bodyTop.play("jebTopAttackingAnim");
    }

    playDeathAnim() {
        this.bodyTop.play("jebTopDeathAnim");
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
}