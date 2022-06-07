/*
This class keeps track of bullets and spawns bullet patterns.
It handles spawning and pooling bullets.
Data specific to bullets and bullet patterns can be found in the BulletPattern class.
*/
class BulletManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "BulletManager");

        /*
        Constants
        */
        this.BULLETS_Z_INDEX = 10;

        /*
        Mutable Properties
        */
        // Used to keep track of bullets and pool them
        this.playerActiveBullets = this.scene.add.group({
            removeCallback: (bullet) => {
                bullet.setVelocity(0, 0)
                    .setActive(false)
                    .setVisible(false)
                    ;
                bullet.body.checkCollision.none = true;

                this.playerBulletsPool.add(bullet);
            }
        });
        this.playerBulletsPool = this.scene.add.group({
            removeCallback: (bullet) => {
                this.playerActiveBullets.add(bullet);
            }
        });
        this.enemyActiveBullets = this.scene.add.group({
            removeCallback: (bullet) => {
                bullet.setVelocity(0, 0)
                    .setActive(false)
                    .setVisible(false)
                    ;
                bullet.body.checkCollision.none = true;

                this.enemyBulletsPool.add(bullet);
            }
        });
        this.enemyBulletsPool = this.scene.add.group({
            removeCallback: (bullet) => {
                this.enemyActiveBullets.add(bullet);
            }
        });
       
    }

    /*
    Public Methods
    */
    // Add a bullet pattern to the scene
    addPattern(patternKey, patternConfig) {
        new BulletPattern(this, patternKey, patternConfig);
    }

    // Add a bullet to the scene and return a reference to it.
    // Makes use of object pooling.
    // Bullets have an origin of (0.5, 0.5).
    addBullet(x, y, texture, frame = 0, enemyBullet = true, bodyConfig, initTexAngleDeg = 0, bulletScale = 1) {
        let bulletToSpawn;
        let targetPool = enemyBullet ? this.enemyBulletsPool : this.playerBulletsPool;
        if (targetPool.getLength() > 0) {
            bulletToSpawn = targetPool.getFirst();

            targetPool.remove(bulletToSpawn);
            
            bulletToSpawn.setActive(true);
            bulletToSpawn.setVisible(true);
        }
        // If pooling can't be used, create a new bullet instead
        else {
            bulletToSpawn = this.scene.physics.add.sprite(x, y, texture, frame);
            bulletToSpawn.setPushable(false);
            bulletToSpawn.body.setAllowDrag(false)
                .setBounce(0, 0)    
                .setFriction(0, 0)
                ;

            let groupToAddTo = enemyBullet ? this.enemyActiveBullets : this.playerActiveBullets;
            groupToAddTo.add(bulletToSpawn);
        }

        // Set properties of bullet
        bulletToSpawn.setTexture(texture)
            .setFrame(frame)
            .setOrigin(0.5)
            .setPosition(x, y)
            .setScale(bulletScale)
            .setAngle(-initTexAngleDeg) // Rotate the bullet to 0 degrees based on its initial rotation
            ;

        // Set properties of bullet's physics body
        let bdy = bulletToSpawn.body;

        bdy.checkCollision = {
            none: false,
            up: true,
            right: true,
            down: true,
            left: true
        }

        // Circle bodies are positioned from the top-left of its square bounding box and automatically placed on top-left of sprite, so you need to offset it.
        // Adapted from samme's solution here: https://phaser.discourse.group/t/circular-collider-using-setcircle-is-not-centred-properly/8263/4
        // Since the radius here is set to be half the width, the width of the circle takes up the entire width of the sprite and no x offset is needed.
        // But the y position needs to be offset by half the height (top-left of circle now at left-middle of sprite) minus the radius (center of circle now at center of sprite)
        bdy.setCircle(bulletToSpawn.width / 2, 0, (bulletToSpawn.height - bulletToSpawn.width) / 2);

        // If a body configuration was specified, apply the specified properties to the body
        if (bodyConfig != undefined) {
            // Set the body to be a circle is specified as such
            if (bodyConfig.isRectangle == true) {
                bdy.setSize(bodyConfig.width ?? bulletToSpawn.width, bodyConfig.height ?? bulletToSpawn.height);
            }
            else {
                const radiusToUse = bodyConfig.radius ?? bulletToSpawn.width / 2
                bdy.setCircle(radiusToUse, bulletToSpawn.width / 2 - radiusToUse, bulletToSpawn.height / 2 - radiusToUse);
            }
        }
        bdy.resetFlags(true);

        bulletToSpawn.setDepth(this.BULLETS_Z_INDEX);

        return bulletToSpawn;
    }

    getPlayerBulletsGroup() {
        return this.playerActiveBullets;
    }

    getEnemyBulletsGroup() {
        return this.enemyActiveBullets;
    }

    /*
    Private Methods
    */
}