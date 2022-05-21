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
            // An array of PuzzlePiece game objects
            pieces: [],
            // An array of points that each correspond to the top left of a hole that's aligned to the grid.
            holes: [],
            // A reference to a group of PuzzlePiece game objects would be the value here
            group: null,
            // The index of the next piece to be placed in this sequence.
            nextPieceIndex: 0,
            // Is this sequence completed?
            isCompleted: false
        }

        this.PUZZLE_PIECE_Z_INDEX = this.playerChar.depth - 1;
        this.PUZZLE_HOLE_Z_INDEX = this.PUZZLE_PIECE_Z_INDEX - 1;

        this.INTERACT_KEY_DOWN_CALLBACK = () => {
            console.log("Interact key pressed");
            // Not currently holding a puzzle piece
            if (this.currHeldPuzPiece == null) {
                let closestPuzPiece = this.getClosestPuzzlePiece();
                if (Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, closestPuzPiece.getCenter()) > this.maxPickUpDist) {
                    return;
                }
                if (closestPuzPiece.placedInHole) {
                    return;
                }

                this.#pickUpPuzzlePiece(closestPuzPiece);
            }
            else {
                // Create ghost piece
                const tempGhostPiecePos = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                this.ghostPuzzlePiece = this.parentScene.add.sprite(tempGhostPiecePos.x, tempGhostPiecePos.y, this.currHeldPuzPiece.texture).setOrigin(0);
                this.ghostPuzzlePiece.setAlpha(0.5);
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
            // Not currently holding a puzzle piece
            if (this.currHeldPuzPiece == null) {
                return;
            }
            // Releasing key from picking up a puzzle piece
            if (!this.canPlaceCurrHeldPiece) {
                this.canPlaceCurrHeldPiece = true;
                return;
            }
        
            // Remove ghost piece
            this.parentScene.time.removeEvent(this.ghostPuzzlePieceUpdateTimer);
            this.ghostPuzzlePieceUpdateTimer.destroy();
            this.ghostPuzzlePiece.destroy();
            // Place the currently held piece
            // If near corresponding hole, place puzzle piece in it
            let correspondingHole = this.getCorrespondingHole(this.currHeldPuzPiece);
            if (this.currHeldPuzPiece.numInSequence - 1 == this.sequences[this.currHeldPuzPiece.sequenceIndex].nextPieceIndex
                && Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, correspondingHole.getCenter()) <= this.maxHolePlacementDist) {
                this.#placePuzzlePiece(this.currHeldPuzPiece, correspondingHole);
            }
            else {
                this.#placePuzzlePiece(this.currHeldPuzPiece);
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

        // An array that will hold sequence objects.
        this.sequences = [];

        // The maximum distance in pixels that the player can pick up a puzzle piece
        this.maxPickUpDist = 128;

        this.maxHolePlacementDist = 128;

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

    addHoleToSeq(holeToAdd, seqIndex = 0) {
        let holesOfSequence = this.sequences[seqIndex].holes;
        for (const hole of holesOfSequence) {
            if (hole.numInSequence == holeToAdd.numInSequence) {
                console.warn(`Puzzle hole was not added to sequence with index ${seqIndex} because of conflicting sequence numbers!`,
                "Puzzle hole: " + pieceToAdd);
                return;
            }
        }

        Phaser.Utils.Array.Add(holesOfSequence, holeToAdd);
        // Sort the holes array of the sequence in ascending order of each hole's number in the sequence
        holesOfSequence.sort((hole1, hole2) => {return hole1.numInSequence - hole2.numInSequence});

        holeToAdd.sequenceIndex = seqIndex;
        holeToAdd.body.checkCollision.none = true;
        holeToAdd.setDepth(this.PUZZLE_HOLE_Z_INDEX);
    }

    addPuzzlePieceToSeq(pieceToAdd, seqIndex = 0) {
        let groupOfSequence = this.sequences[seqIndex].group;
        let piecesOfSequence = this.sequences[seqIndex].pieces;
        // Check whether or not a piece with the same sequence number already exists in the group
        for (const piece of piecesOfSequence) {
            if (piece.numInSequence == pieceToAdd.numInSequence) {
                console.warn(`Puzzle piece was not added to sequence group with index ${seqIndex} because of conflicting sequence numbers!`,
                "Puzzle piece: " + pieceToAdd);
                return;
            }
        }

        groupOfSequence.add(pieceToAdd);
        Phaser.Utils.Array.Add(piecesOfSequence, pieceToAdd);
        // Sort the pieces array of the sequence in ascending order of each piece's number in the sequence
        piecesOfSequence.sort((piece1, piece2) => {return piece1.numInSequence - piece2.numInSequence});

        pieceToAdd.sequenceIndex = seqIndex;
        pieceToAdd.body.checkCollision.none = true;
        pieceToAdd.setDepth(this.PUZZLE_PIECE_Z_INDEX);
    }
    
    attachDebugTextToSeqObjs(seqIndex) {
        let pieceDebugTextObjs = [];
        let holeDebugTextObjs = [];
        const piecesList = this.sequences[seqIndex].pieces;
        for (const piece of piecesList) {
            const newTextObj = this.parentScene.add.text(piece.getCenter().x, piece.getCenter().y, `[PIECE]\nseqIndex: ${piece.sequenceIndex}\nnumInSequence: ${piece.numInSequence}`, {color: "white", fontFamily: "Verdana", fontSize: "24px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
            pieceDebugTextObjs.push(newTextObj);
        }
        const holesList = this.sequences[seqIndex].holes;
        for (const hole of holesList) {
            const newTextObj = this.parentScene.add.text(hole.getCenter().x, hole.getCenter().y, `[HOLE]\nseqIndex: ${hole.sequenceIndex}\nnumInSequence: ${hole.numInSequence}`, {color: "white", fontFamily: "Verdana", fontSize: "24px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
            holeDebugTextObjs.push(newTextObj);
        }
        this.parentScene.time.addEvent({
            delay: 1000/60,
            callback: () => {
                for (let i in pieceDebugTextObjs) {
                    pieceDebugTextObjs[i].setPosition(piecesList[i].getCenter().x, piecesList[i].getCenter().y);
                }
                for (let i in holeDebugTextObjs) {
                    holeDebugTextObjs[i].setPosition(holesList[i].getCenter().x, holesList[i].getCenter().y);
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
    }

    getCurrentlyHeldPiece() {
        return this.currHeldPuzPiece;
    }

    // Return the closest puzzle piece to the player
    getClosestPuzzlePiece() {
        let piecesList = [];
        for (const seq of this.sequences) {
            Phaser.Utils.Array.Add(piecesList, seq.pieces);
        }
        
        let closestPiece = this.parentScene.physics.closest(this.playerChar.body.center, piecesList);
        return closestPiece;
    }

    getCorrespondingHole(puzPiece) {
        const result = this.sequences[puzPiece.sequenceIndex].holes[puzPiece.numInSequence - 1];
        if (result == undefined) {
            console.warn("The corresponding hole for that piece doesn't exist!");
            return;
        }
        if (result.numInSequence != puzPiece.numInSequence) {
            console.warn(`The current structure of sequence with index ${puzPiece.sequenceIndex} is invalid for get the corresponding hole!`);
            return;
        }
        return result;
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
        // TODO: maybe want to emit event that piece was picked up to alert the UI and sound manager
    }

    #placePuzzlePiece(puzPiece, targetHole = null) {
        if (targetHole != null) {
            console.log(targetHole)
            puzPiece.setPosition(targetHole.getTopLeft().x, targetHole.getTopLeft().y);
            puzPiece.changeToInHoleSprite();
            puzPiece.placedInHole = true;
            
            let parentSeq = this.sequences[puzPiece.sequenceIndex]
            parentSeq.nextPieceIndex += 1;
            if (parentSeq.nextPieceIndex == parentSeq.pieces.length) {
                parentSeq.completed = true;
            }
        }
        else {
            const placementPoint = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
            this.currHeldPuzPiece.setPosition(placementPoint.x, placementPoint.y);
        }

        puzPiece.setVisible(true);
        this.currHeldPuzPiece = null;
        this.canPlaceCurrHeldPiece = false;
        // TODO: maybe want to emit event that piece was placed to alert the UI and sound manager
    }
}