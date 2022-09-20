class PuzzleManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "PuzzleManager");
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
        };

        // This puzzle manager can generate an entire puzzle using a tilemap exported from Tiled.
        // But it needs to know the names of the properties to look for in the tilemap data.
        // Note that all pieces and holes in Tiled need to also have a "sequenceName" and a "numInSequence" property set in their tileset.
        this.TILEMAP_DATA_NAMES = {
            // This is the name of the tileset that holds the tiles to use for puzzles
            tilesetName: "gameTileset",
            // This is the key of the image that the tileset uses.
            // The image must already be in the Phaser cache for puzzle generation from a tilemap to work properly.
            tilesetImageKey: "gameTilesetAtlas",
            // This is the name of the object layer (in Tiled) with the pieces and holes that will be used
            objectLayerName: "puzzleLayer",
            // In Tiled, the tiles for pieces or holes have a custom property with the following name.
            // This is the name of the custom property, NOT its corresponding value.
            puzzleObjIdentifier: "puzzleObjectType",
            // The corresponding value for puzzleObjIdentifier if the tile represents a piece
            puzPieceObjValue: "piece",
            // The corresponding value for puzzleObjIdentifier if the tile represents a hole
            puzHoleObjValue: "hole"
        };

        this.PUZZLE_PIECE_Z_INDEX = this.playerChar.depth - 1;
        this.PUZZLE_HOLE_Z_INDEX = this.PUZZLE_PIECE_Z_INDEX - 1;

        this.INTERACT_KEY_DOWN_CALLBACK = () => {
            // Player character is dead
            if (this.playerChar.isDead()) {
                return;
            }
            // Not currently holding a puzzle piece
            if (this.currHeldPuzPiece == null) {
                let closestPuzPiece = this.#getClosestPuzzlePiece();
                // No pieces that can be picked up
                if (closestPuzPiece == null) {
                    return;
                }
                // Don't pick up puzzle piece if it's not close enough
                if (Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, closestPuzPiece.getCenter()) > this.maxPickUpDist) {
                    return;
                }

                this.#pickUpPuzzlePiece(closestPuzPiece);
            }
            // Checking that the ghost puzzle piece is nullish here is to prevent the game from throwing an error from the player focusing elsewhere during the process of picking up and placing a puzzle piece.
            // For example: pressing the placement button, then focusing elsewhere with the button held, then releasing the button, and then trying to place the held piece while focused on the game would be problematic without this check.
            else if (this.ghostPuzzlePiece == null) {
                // Create ghost piece
                const tempGhostPiecePos = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                this.ghostPuzzlePiece = this.parentScene.add.sprite(tempGhostPiecePos.x, tempGhostPiecePos.y, this.currHeldPuzPiece.texture, this.currHeldPuzPiece.frame.name).setOrigin(0); // Pass in the frame name here, NOT the frame itself
                this.ghostPuzzlePiece.setAlpha(0.5);
                this.ghostPuzzlePieceUpdateTimer = this.parentScene.time.addEvent({
                    delay: 1000/globalGame.loop.targetFps,
                    callback: () => {
                        // If near corresponding hole, make ghost puzzle piece automatically be at hole
                        let correspondingHole = this.#getCorrespondingHole(this.currHeldPuzPiece);
                        let placementPoint;
                        if (this.currHeldPuzPiece.numInSequence - 1 == this.sequences[this.currHeldPuzPiece.sequenceName].nextPieceIndex
                            && Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, correspondingHole.getCenter()) <= this.maxHolePlacementDist) {
                            placementPoint = new Phaser.Geom.Point(correspondingHole.x, correspondingHole.y);
                        }
                        else {
                            placementPoint = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                        }
                        this.ghostPuzzlePiece.setPosition(placementPoint.x, placementPoint.y);
                    },
                    loop: true
                });
            }
        };

        this.INTERACT_KEY_UP_CALLBACK = () => {
            // Player character is dead
            if (this.playerChar.isDead()) {
                return;
            }
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
            // Remove reference to the ghost puzzle piece so that it's actually destroyed
            this.ghostPuzzlePiece = null;
            // Place the currently held piece
            // If near corresponding hole and the currently held piece is the next piece in its sequence, place it in the hole
            let correspondingHole = this.#getCorrespondingHole(this.currHeldPuzPiece);
            if (this.currHeldPuzPiece.numInSequence - 1 == this.sequences[this.currHeldPuzPiece.sequenceName].nextPieceIndex
                && Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, correspondingHole.getCenter()) <= this.maxHolePlacementDist) {
                this.#placePuzzlePiece(this.currHeldPuzPiece, correspondingHole);
            }
            else {
                this.#placePuzzlePiece(this.currHeldPuzPiece);
            }
        };

        /*
        Mutable Properties
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
        };

        // An array that will hold sequence objects.
        this.sequences = {};

        // The maximum distance in pixels that the player can pick up a puzzle piece
        this.maxPickUpDist = 128;

        this.maxHolePlacementDist = 160;
    }

    /*
    Public Methods
    */
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

    // Reads in tilemap data to generate its puzzle
    createPuzzleFromTilemap(tilemap) {
        // From the tilemap, get the object layer named "puzzleLayer".
        // This means that all the puzzle-related objects need to be on that layer.
        let objLayer = tilemap.getObjectLayer(this.TILEMAP_DATA_NAMES.objectLayerName);
        // The tileset data will be used to get the custom properties of tiles
        let tileset = tilemap.addTilesetImage(this.TILEMAP_DATA_NAMES.tilesetName, this.TILEMAP_DATA_NAMES.tilesetImageKey);
        for (const tiledObj of objLayer.objects) {
            // Get the custom properties of the current object that are stored in the tileset
            // The properties will be returned as an object by the getTileProperties() method.
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj == null) {
                console.warn(`A puzzle piece or hole was found on the tilemap's object layer named "${this.TILEMAP_DATA_NAMES.objectLayerName}"
                that didn't have the correct custom properties set!`);
                continue;
            }

            // Anonymous function to automatically assign properties to puzzle pieces or holes
            // Based off Phaser 3 code found here: https://github.com/photonstorm/phaser/blob/v3.55.2/src/tilemaps/Tilemap.js#L634
            let assignProperties = (targetObj) => {
                targetObj.setPosition(tiledObj.x, tiledObj.y);
                // Account for Tiled's origin convention of (0, 1)
                targetObj.x += targetObj.originX * tiledObj.width;
                targetObj.y += (targetObj.originY - 1) * tiledObj.height;

                targetObj.setVisible(tiledObj.visible);

                // Note: origin convention for puzzle pieces and holes is (0, 0)
                targetObj.setOrigin(0);
                // Change the x and y positions to account for the change in origin
                targetObj.x -= targetObj.width/2;
                targetObj.y -= targetObj.height/2;
            };

            // Custom properties
            let seqName = Phaser.Utils.Objects.GetValue(propsObj, "sequenceName", undefined);
            let numInSequence = Phaser.Utils.Objects.GetValue(propsObj, "numInSequence", undefined);
            // If a sequence with the object's sequence name doesn't yet exist, create it
            if (!Phaser.Utils.Objects.HasValue(this.sequences, seqName)) {
                this.#addSequence(seqName);
            }
            // Check whether the current object is a puzzle piece or a puzzle hole
            if (propsObj[this.TILEMAP_DATA_NAMES.puzzleObjIdentifier] === this.TILEMAP_DATA_NAMES.puzPieceObjValue) {
                let newPiece = new PuzzlePiece({scene: this.parentScene, sequenceName: seqName, numInSequence: numInSequence});
                assignProperties(newPiece);
                this.#addPuzzlePieceToSeq(newPiece, newPiece.sequenceName);
            }
            else if (propsObj[this.TILEMAP_DATA_NAMES.puzzleObjIdentifier] === this.TILEMAP_DATA_NAMES.puzHoleObjValue) {
                let newHole = new PuzzleHole({scene: this.parentScene, sequenceName: seqName, numInSequence: numInSequence});
                assignProperties(newHole);
                this.#addPuzzleHoleToSeq(newHole, newHole.sequenceName);
            }
        }
    }

    // Returns an array containing references all of the puzzle holes in this object's puzzle
    getAllHoles() {
        // Create array to hold puzzle holes
        let holesArray = [];
        // Loop through all sequences and append the holes in each sequence to holesArray
        for (const seq of Object.values(this.sequences)) {
            Phaser.Utils.Array.Add(holesArray, seq.holes);
        }
        return holesArray;
    }

    // Returns an array containing references all of the puzzle pieces in this object's puzzle
    getAllPieces() {
        // Create array to hold puzzle pieces
        let piecesArray = [];
        // Loop through all sequences and append the pieces in each sequence to piecesArray
        for (const seq of Object.values(this.sequences)) {
            Phaser.Utils.Array.Add(piecesArray, seq.pieces);
        }
        return piecesArray;
    }

    // Returns true if this puzzle is completed. Else, it returns false.
    puzzleCompleted() {
        for (const sequence of Object.values(this.sequences)) {
            if (sequence.isCompleted == false) {
                return false;
            }
        }
        return true;
    }

    /*
    Private Methods
    */
    #addPuzzleHoleToSeq(holeToAdd, seqName) {
        let holesOfSequence = this.sequences[seqName].holes;
        for (const hole of holesOfSequence) {
            if (hole.numInSequence == holeToAdd.numInSequence) {
                console.warn(`Puzzle hole was not added to sequence with name "${seqName}" because of conflicting numbers in sequence!`,
                "Puzzle hole: " + pieceToAdd);
                return;
            }
        }

        Phaser.Utils.Array.Add(holesOfSequence, holeToAdd);
        // Sort the holes array of the sequence in ascending order of each hole's number in the sequence
        holesOfSequence.sort((hole1, hole2) => {return hole1.numInSequence - hole2.numInSequence});

        holeToAdd.sequenceName = seqName;
        holeToAdd.body.checkCollision.none = true;
        holeToAdd.setDepth(this.PUZZLE_HOLE_Z_INDEX);
    }

    #addPuzzlePieceToSeq(pieceToAdd, seqName) {
        let groupOfSequence = this.sequences[seqName].group;
        let piecesOfSequence = this.sequences[seqName].pieces;
        // Check whether or not a piece with the same sequence number already exists in the group
        for (const piece of piecesOfSequence) {
            if (piece.numInSequence == pieceToAdd.numInSequence) {
                console.warn(`Puzzle piece was not added to sequence group with name ${seqName} because of conflicting sequence numbers!`,
                "Puzzle piece: " + pieceToAdd);
                return;
            }
        }

        groupOfSequence.add(pieceToAdd);
        Phaser.Utils.Array.Add(piecesOfSequence, pieceToAdd);
        // Sort the pieces array of the sequence in ascending order of each piece's number in the sequence
        piecesOfSequence.sort((piece1, piece2) => {return piece1.numInSequence - piece2.numInSequence});

        pieceToAdd.sequenceName = seqName;
        pieceToAdd.body.checkCollision.none = true;
        pieceToAdd.setDepth(this.PUZZLE_PIECE_Z_INDEX);
    }

    // Adds a sequence to be kept track of by this object
    #addSequence(newSeqName) {
        // Check whether or not the sequence already exists
        if (Phaser.Utils.Objects.HasValue(this.sequences, newSeqName)) {
            console.warn(`A sequence with the name "${newSeqName}" already exists!`);
            return;
        }

        let newSeqGroup = this.parentScene.add.group();
        // Create a new object that's a copy of the base object
        let newSeqObj = Phaser.Utils.Objects.DeepCopy(this.SEQUENCE_BASE_OBJECT);
        newSeqObj.group = newSeqGroup;
        this.sequences[newSeqName] = newSeqObj;
        return newSeqObj;
    }

    // Returns a Phaser.Geom.Point object for the top left point of the grid cell that contains the point.
    #containingGridCellTopLeft(x, y) {
        let pointX = Phaser.Math.Snap.Floor(x, this.gridProperties.intervalGap, this.gridProperties.topLeftX);
        let pointY = Phaser.Math.Snap.Floor(y, this.gridProperties.intervalGap, this.gridProperties.topLeftY);
        return new Phaser.Geom.Point(pointX, pointY);
    }

    // Return the closest puzzle piece to the player
    #getClosestPuzzlePiece(excludePiecesInHoles = true) {
        let piecesList = [];
        for (const seq of Object.values(this.sequences)) {
            Phaser.Utils.Array.Add(piecesList, seq.pieces);
        }

        if (excludePiecesInHoles) {
            piecesList = piecesList.filter((p) => {return !p.placedInHole});
        }

        let closestPiece = this.parentScene.physics.closest(this.playerChar.body.center, piecesList);
        return closestPiece;
    }

    #getCorrespondingHole(puzPiece) {
        const result = this.sequences[puzPiece.sequenceName].holes[puzPiece.numInSequence - 1];
        if (result == undefined) {
            console.warn("The corresponding hole for that piece doesn't exist!");
            return;
        }
        if (result.numInSequence != puzPiece.numInSequence) {
            console.warn(`The current structure of sequence with name ${puzPiece.sequenceName} is invalid for getting the corresponding hole!`);
            return;
        }
        return result;
    }

    #pickUpPuzzlePiece(puzPiece) {
        puzPiece.setVisible(false);
        this.currHeldPuzPiece = puzPiece;
        this.parentScene.sound.play("collectSFX");
    }

    #placePuzzlePiece(puzPiece, targetHole = null) {
        if (targetHole != null) {
            puzPiece.setPosition(targetHole.getTopLeft().x, targetHole.getTopLeft().y);
            puzPiece.changeToInHoleAnim();
            puzPiece.placedInHole = true;

            let parentSeq = this.sequences[puzPiece.sequenceName];
            parentSeq.nextPieceIndex += 1;
            // If this piece was the last in the sequence, update the isCompleted property of the sequence
            if (parentSeq.nextPieceIndex == parentSeq.pieces.length) {
                parentSeq.isCompleted = true;
            }
        }
        else {
            const placementPoint = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
            this.currHeldPuzPiece.setPosition(placementPoint.x, placementPoint.y);
        }

        puzPiece.setVisible(true);
        this.currHeldPuzPiece = null;
        this.canPlaceCurrHeldPiece = false;
    }
}