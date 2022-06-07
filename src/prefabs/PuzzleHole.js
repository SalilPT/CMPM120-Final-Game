class PuzzleHole extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        
        this.parentScene = params.scene;
        
        /*
        Constants
        */
        this.TEXTURE_KEYS_ARRAY = ["hole1Sprite", "hole2Sprite", "hole3Sprite", "hole4Sprite", "hole5Sprite", "hole6Sprite"];
        /*
        Properties
        */

        this.sequenceName = params.sequenceName;
        // The number in the sequence that this piece will represent, NOT the index of its sequence
        this.numInSequence = params.numInSequence;
        this.setSprite();
        
        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);
    }

    /*
    Public methods
    */
    setSprite() {
        this.setTexture(this.TEXTURE_KEYS_ARRAY[this.numInSequence - 1]);
    }
}