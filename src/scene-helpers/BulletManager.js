class BulletManager {
    constructor(parentScene, config) {
        this.parentScene = parentScene;

        /*
        Constants
        */


        /*
        Mutable Properties
        */
        // Used to keep track of bullets and pool them
        this.playerActiveBullets = this.parentScene.add.group({
            removeCallback: (bullet) => {
                bullet.setVelocity(0, 0);
                this.playerBulletsPool.add(bullet);
            }
        });
        this.playerBulletsPool = this.parentScene.add.group({
            removeCallback: (bullet) => {
                this.playerActiveBullets.add(bullet);
            }
        });
        this.enemyActiveBullets = this.parentScene.add.group({
            removeCallback: (bullet) => {
                bullet.setVelocity(0, 0);
                this.enemyBulletsPool.add(bullet);
            }
        });
        this.enemyBulletsPool = this.parentScene.add.group({
            removeCallback: (bullet) => {
                this.enemyActiveBullets.add(bullet);
            }
        });
       
    }

    /*
    Public Methods
    */
    

    /*
    Private Methods
    */
}