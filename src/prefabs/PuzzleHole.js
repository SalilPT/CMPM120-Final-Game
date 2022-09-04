class PuzzleHole extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);
        
        this.parentScene = params.scene;

        /*
        Properties
        */
        this.sequenceName = params.sequenceName;
        // The number in the sequence that this piece will represent, NOT the index of its sequence
        this.numInSequence = params.numInSequence;

        // Use the frame names from the JSON data for gameAtlas to set the texture for this object
        this.setTexture("gameAtlas", `Circuit Boards Slot ${this.numInSequence}.png`);
        
        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);
    }
}