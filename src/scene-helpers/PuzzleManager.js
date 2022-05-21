class PuzzleManager {
    constructor(parentScene, config) {
        this.parentScene = parentScene;
        this.playerChar = config.playerChar;

        /*
        Constants
        */
        this.DEFAULT_INTERACT_KEYCODE = Phaser.Input.Keyboard.KeyCodes.SPACE;

        // A base object that will be copied and added to the list of sequences that this puzzle manager will keep track of.
        this.SEQUENCE_BASE_OBJECT = {
            // A reference to a group of PuzzlePiece game objects would be the value here
            group: null,
            // An array of points that each correspond to the top left of a hole that's aligned to the grid.
            holes: [],
            // The index of the next piece to be placed in this sequence. When the sequence is completed, the value becomes -1.
            nextPieceIndex: 0
        }

        this.INTERACT_KEY_DOWN_CALLBACK = () => {
            console.log("Interact key pressed");
            // Not currently holding a puzzle piece
            if (this.currHeldPuzPiece == null) {
                let closestPuzPiece = this.getClosestPuzzlePiece();
                if (Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, closestPuzPiece.getCenter()) > this.maxPickUpDist) {
                    return;
                }

                this.#pickUpPuzzlePiece(closestPuzPiece);
            }
            else {
                // Create ghost piece
                const tempGhostPiecePos = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                this.ghostPuzzlePiece = this.parentScene.add.sprite(tempGhostPiecePos.x, tempGhostPiecePos.y, this.currHeldPuzPiece.texture).setOrigin(0);
                this.ghostPuzzlePiece.alpha = 0.5;
                this.ghostPuzzlePieceUpdateTimer = this.parentScene.time.addEvent({
                    delay: 1000/60,
                    callback: () => {
                        // TODO: If near corresponding hole, make ghost puzzle piece automatically be at hole
                        const placementPoint = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                        this.ghostPuzzlePiece.setPosition(placementPoint.x, placementPoint.y);
                    },
                    loop: true
                });
            }
        }

        this.INTERACT_KEY_UP_CALLBACK = () => {
            if (this.currHeldPuzPiece == null) {
                return;
            }
            if (!this.canPlaceCurrHeldPiece) {
                this.canPlaceCurrHeldPiece = true;
            }
            else {
                // Remove ghost piece
                this.parentScene.time.removeEvent(this.ghostPuzzlePieceUpdateTimer);
                this.ghostPuzzlePieceUpdateTimer.destroy();
                this.ghostPuzzlePiece.destroy();
                // Place the currently held piece
                // TODO: If near corresponding hole, place puzzle piece in it
                const placementPoint = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                this.currHeldPuzPiece.setPosition(placementPoint.x, placementPoint.y);
                this.currHeldPuzPiece.setDepth(this.playerChar.depth - 1);
                this.currHeldPuzPiece.setVisible(true);
                this.currHeldPuzPiece = null;
                this.canPlaceCurrHeldPiece = false;
            }
        }
       
        /*
        Mutable properties
        */
        this.interactKeycode = this.DEFAULT_INTERACT_KEYCODE;
        // The key object for the interaction
        this.interactKeyObj;
        this.bindAndListenForInteractKey(this.interactKeycode, false);

        this.currHeldPuzPiece = null;
        this.canPlaceCurrHeldPiece = false;
        this.ghostPuzzlePiece = null;
        this.ghostPuzzlePieceUpdateTimer;
        // The properties of the grid of squares that the parent scene is using (set to defaults here).
        // Used to snap pieces to the nearest grid cell.
        this.gridProperties = {
            intervalGap: 64,
            topLeftX: 0,
            topLeftY: 0,
        }

        // An array that will hold one or more references to a group of puzzle pieces.
        this.sequences = [];

        // The maximum distance in pixels that the player can pick up a puzzle piece
        this.maxPickUpDist = 128;

    }

    /*
    Public Methods
    */

    // Adds a group for puzzle pieces to the scene and returns the index of the new sequence object containing the new group
    addSequence() {
        let newSeqGroup = this.parentScene.add.group();
        // Create a new object that's a copy of the base object
        let newSeqObj = Phaser.Utils.Objects.DeepCopy(this.SEQUENCE_BASE_OBJECT);
        newSeqObj.group = newSeqGroup;
        Phaser.Utils.Array.Add(this.sequences, newSeqObj);
        return this.sequences.length - 1;
    }

    addPuzzlePieceToSeq(pieceToAdd, seqIndex = 0) {
        let groupOfSequence = this.sequences[seqIndex].group;
        // Check whether or not a piece with the same sequence number already exists in the group
        for (const piece of groupOfSequence.getChildren()) {
            if (piece.seqNumber == pieceToAdd.seqNumber) {
                console.warn(`Puzzle piece was not added to sequence group with index ${seqIndex} because of conflicting sequence numbers!`,
                "puzzle piece: " + pieceToAdd);
                return;
            }
        }

        groupOfSequence.add(pieceToAdd);
        pieceToAdd.sequenceIndex = seqIndex;
        pieceToAdd.body.checkCollision.none = true;
    }
    
    attachDebugTextToSequenceGroup(groupIndex) {
        let debugTextObjs = [];
        const piecesList = this.sequences[groupIndex].group.getChildren();
        for (const piece of piecesList) {
            const newTextObj = this.parentScene.add.text(piece.getCenter().x, piece.getCenter().y, `seqIndex: ${piece.sequenceIndex}\nseqNumber: ${piece.sequenceNumber}`, {color: "white", fontFamily: "Verdana", fontSize: "36px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
            debugTextObjs.push(newTextObj);
        }
        this.parentScene.time.addEvent({
            delay: 1000/60,
            callback: () => {
                for (let i in debugTextObjs) {
                    debugTextObjs[i].setPosition(piecesList[i].getCenter().x, piecesList[i].getCenter().y);
                }
            },
            loop: true
        });
    }

    bindAndListenForInteractKey(newKeycode, removeOldKeyObj = true) {
        // Remove the old event listeners that had a context of "this"
        if (this.interactKeyObj != undefined) {
            this.interactKeyObj.removeListener("down", this.INTERACT_KEY_DOWN_CALLBACK, this);
            this.interactKeyObj.removeListener("up", this.INTERACT_KEY_UP_CALLBACK, this);
        }

        if (removeOldKeyObj) {
            this.parentScene.input.keyboard.removeKey(this.interactKeyObj);
        }

        this.interactKeyObj = this.parentScene.input.keyboard.addKey(newKeycode);
        this.interactKeyObj.on("down", this.INTERACT_KEY_DOWN_CALLBACK, this);
        this.interactKeyObj.on("up", this.INTERACT_KEY_UP_CALLBACK, this);
        this.parentScene.input.keyboard.addCapture(newKeycode);
        console.log("hmm");
        
    }

    getCurrentlyHeldPiece() {
        return this.currHeldPuzPiece;
    }

    // Return the closest puzzle piece to the player
    getClosestPuzzlePiece() {
        let piecesList = [];
        for (const seq of this.sequences) {
            Phaser.Utils.Array.Add(piecesList, seq.group.getChildren());
        }
        
        let closestPiece = this.parentScene.physics.closest(this.playerChar.body.center, piecesList);
        return closestPiece;
    }    

    /*
    Private methods
    */
    // Returns a Phaser.Geom.Point object for the top left point of the grid cell that contains the point.
    #containingGridCellTopLeft(x, y) {
        let pointX = Phaser.Math.Snap.Floor(x, this.gridProperties.intervalGap, this.gridProperties.topLeftX);
        let pointY = Phaser.Math.Snap.Floor(y, this.gridProperties.intervalGap, this.gridProperties.topLeftY);
        return new Phaser.Geom.Point(pointX, pointY);
    }

    #pickUpPuzzlePiece(puzPiece) {
        puzPiece.setVisible(false);
        this.currHeldPuzPiece = puzPiece;
        // TODO: maybe want to emit event that piece was picked up
    }
}