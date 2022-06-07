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
        
        this.health = params.health ?? 3;

        this.scene.anims.create({
            key: "enemyAnim",
            frameRate: 8,
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
            frameRate: 8,
            frames: this.scene.anims.generateFrameNames("gameAtlas", {
                prefix: "Enemy1deathFrame",
                suffix: ".png",
                start: 1,
                end: 9,
            }),
            repeat: -1
        });
        
        this.play("enemyAnim");

        /*

        this.shootingTimer = this.parentScene.time.addEvent({
            delay: 1*1000,
            callback: () {

            },
            loop: true
        })
        */

        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);

        this.body.setCircle(this.width/2);

    }

    /*
    Public Methods
    */
    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.scene.time.removeEvent(this.shootingTimer);
            this.destroy();
        }
    }

    moveTowardsPlayer() {
        let angleToPlayer = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, this.playerChar.body.center.x, this.playerChar.body.center.y);
        angleToPlayer = Phaser.Math.RadToDeg(angleToPlayer);
        let vec = this.scene.physics.velocityFromAngle(angleToPlayer, 200);
        this.body.setVelocity(vec.x, vec.y);
        this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.body != undefined) {
                    this.body.setVelocity(0, 0);
                }
            }
        })
    }
    
    /*
    Private Methods
    */
    // Returns true if an uninterrupted line can be formed from this object's center tothe center of the player character.
    // Gets all tiles within a rectangular bounding box that has the player character and this object.
    #canSeePlayerChar() {
       // getTilesWithin
    }
}