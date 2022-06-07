class PuzzleHole extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        
        this.parentScene = params.scene;
        
        /*
        Constants
        */
        this.ANIMS_KEYS_ARRAY = ["hole1Anim", "hole2Anim", "hole3Anim", "hole4Anim", "hole5Anim", "hole6Anim"];
        /*
        Properties
        */
        for (let i = 0; i < this.ANIMS_KEYS_ARRAY.length; i++) {
            this.parentScene.anims.create({
                key: this.ANIMS_KEYS_ARRAY[i],
                frameRate: 8,
                frames: this.parentScene.anims.generateFrameNames("gameAtlas", {
                    prefix: "CircuitPlaced" + (i + 1) + "Frame",
                    suffix: ".png",
                    start: 1,
                    end: 1,
                }),
                repeat: -1
            });
        }

        this.sequenceName;
        // The number in the sequence that this piece will represent, NOT the index of its sequence
        this.numInSequence;
        
        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);
    }

    /*
    Public methods
    */
}