class PuzzlePiece extends Phaser.GameObjects.Sprite {
    constructor(params) {
        super(params.scene, params.x, params.y, params.texture, params.frame);

        this.parentScene = params.scene;
        
        /*
        Constants
        */
        this.ANIMS_KEYS_ARRAY = ["piece1Anim", "piece2Anim", "piece3Anim", "piece4Anim","piece5Anim", "piece6Anim"];
        this.IN_HOLE_ANIMS_KEYS_ARRAY = ["piece1PlacedAnim", "piece2PlacedAnim", "piece3PlacedAnim", "piece4PlacedAnim", "piece5PlacedAnim", "piece6PlacedAnim"];
        /*
        Properties
        */
        for (let i = 0; i < this.ANIMS_KEYS_ARRAY.length; i++) {
            this.parentScene.anims.create({
                key: this.ANIMS_KEYS_ARRAY[i],
                frameRate: 8,
                frames: this.parentScene.anims.generateFrameNames("gameAtlas", {
                    prefix: "CircuitBoards" + (i + 1) + "Frame",
                    suffix: ".png",
                    start: 1,
                    end: 4,
                }),
                repeat: -1
            });
        }

        for (let i = 0; i < this.ANIMS_KEYS_ARRAY.length; i++) {
            this.parentScene.anims.create({
                key: this.IN_HOLE_ANIMS_KEYS_ARRAY[i],
                frameRate: 8,
                frames: this.parentScene.anims.generateFrameNames("gameAtlas", {
                    prefix: "CircuitPlaced" + (i + 1) + "Frame",
                    suffix: ".png",
                    start: 1,
                    end: 4,
                }),
                repeat: -1
            });
        }

        this.sequenceName = params.sequenceName;
        // The number in the sequence that this piece will represent, NOT the index of its sequence
        this.numInSequence = params.numInSequence;
        this.play(this.ANIMS_KEYS_ARRAY[this.numInSequence - 1]);
        // Has this piece been placed in its corresponding hole?
        this.placedInHole = false;
        
        // Add graphics that's displayed and the physics body
        params.scene.add.existing(this);
        params.scene.physics.add.existing(this);
    }

    /*
    Public Methods
    */
    changeToInHoleAnim() {
        this.play(this.IN_HOLE_ANIMS_KEYS_ARRAY[this.numInSequence - 1]);
    }
}