class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        /*
        Properties
        */

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
    }

    /*
    Public Methods
    */
   
    // Returns a reference to this object's corresponding movement manager
    getMovManager() {
        return this.movManager;
    }
}