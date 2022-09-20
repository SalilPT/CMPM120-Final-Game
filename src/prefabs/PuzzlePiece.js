class PuzzlePiece extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);

        this.parentScene = params.scene;

        /*
        Constants
        */
        this.HIGHEST_PIECE_NUMBER = 9;

        /*
        Properties
        */
        for (let i = 1; i <= this.HIGHEST_PIECE_NUMBER; i++) {
            this.parentScene.anims.create({
                key: `piece${i}Anim`,
                frameRate: 8,
                frames: this.parentScene.anims.generateFrameNumbers(`piece${i}Spritesheet`, {}),
                repeat: -1
            });
        }

        for (let i = 1; i <= this.HIGHEST_PIECE_NUMBER; i++) {
            this.parentScene.anims.create({
                key: `piece${i}PlacedAnim`,
                frameRate: 8,
                frames: this.parentScene.anims.generateFrameNumbers(`piece${i}PlacedSpritesheet`, {}),
                repeat: -1
            });
        }

        this.sequenceName = params.sequenceName;
        // The number in the sequence that this piece will represent, NOT the index of its sequence
        this.numInSequence = params.numInSequence;

        // Has this piece been placed in its corresponding hole?
        this.placedInHole = false;

        this.play(`piece${this.numInSequence}Anim`);

        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);
    }

    /*
    Public Methods
    */
    changeToInHoleAnim() {
        this.play(`piece${this.numInSequence}PlacedAnim`);
    }
}