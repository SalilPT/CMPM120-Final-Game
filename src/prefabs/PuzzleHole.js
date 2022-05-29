class PuzzleHole extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        
        // Properties
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