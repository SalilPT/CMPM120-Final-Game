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
        }

        // This puzzle manager can generate an entire puzzle using a tilemap exported from Tiled. 
        // But it needs to know the names of the properties to look for in the tilemap data.
        this.TILEMAP_DATA_NAMES = {
            // This is the name of the tileset that holds the tiles to use for puzzles
            tilesetName: "bulletHellTileSet",
            // This is the key of the image that the tileset uses.
            // The image must already be in the Phaser cache for puzzle generation from a tilemap to work properly.
            tilesetImageKey: "gameAtlas",
            // This is the name of the object layer (in Tiled) with the pieces and holes that will be used
            objectLayerName: "puzzleLayer",
            // In Tiled, the tiles for pieces or holes have a custom property with the following name.
            // This is the name of the custom property, NOT its corresponding value.
            puzzleObjIdentifier: "puzzleObjectType",
            // The corresponding value for puzzleObjIdentifier if the tile represents a piece
            puzPieceObjValue: "piece",
            // The corresponding value for puzzleObjIdentifier if the tile represents a hole
            puzHolePieceObjValue: "hole"
        }

        this.PUZZLE_PIECE_Z_INDEX = this.playerChar.depth - 1;
        this.PUZZLE_HOLE_Z_INDEX = this.PUZZLE_PIECE_Z_INDEX - 1;

        this.INTERACT_KEY_DOWN_CALLBACK = () => {
            console.log("Interact key pressed");
            // Not currently holding a puzzle piece
            if (this.currHeldPuzPiece == null) {
                let closestPuzPiece = this.getClosestPuzzlePiece();
                // No pieces that can be picked up
                if (closestPuzPiece == null) {
                    return;
                }

                if (Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, closestPuzPiece.getCenter()) > this.maxPickUpDist) {
                    return;
                }

                

                this.#pickUpPuzzlePiece(closestPuzPiece);
            }
            else {
                // Create ghost piece
                const tempGhostPiecePos = this.#containingGridCellTopLeft(this.playerChar.body.center.x, this.playerChar.body.center.y);
                this.ghostPuzzlePiece = this.parentScene.add.sprite(tempGhostPiecePos.x, tempGhostPiecePos.y, this.currHeldPuzPiece.texture).setOrigin(0); // Might need to get the frame of the currently held piece as well
                this.ghostPuzzlePiece.setAlpha(0.5);
                this.ghostPuzzlePieceUpdateTimer = this.parentScene.time.addEvent({
                    delay: 1000/60,
                    callback: () => {
                        // If near corresponding hole, make ghost puzzle piece automatically be at hole
                        let correspondingHole = this.getCorrespondingHole(this.currHeldPuzPiece);
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
            if (this.currHeldPuzPiece.numInSequence - 1 == this.sequences[this.currHeldPuzPiece.sequenceName].nextPieceIndex
                && Phaser.Math.Distance.BetweenPoints(this.playerChar.body.center, correspondingHole.getCenter()) <= this.maxHolePlacementDist) {
                this.#placePuzzlePiece(this.currHeldPuzPiece, correspondingHole);
            }
            else {
                this.#placePuzzlePiece(this.currHeldPuzPiece);
            }
        
        }
       
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
        }

        // An array that will hold sequence objects.
        this.sequences = {};

        // The maximum distance in pixels that the player can pick up a puzzle piece
        this.maxPickUpDist = 128;

        this.maxHolePlacementDist = 160;
    }

    /*
    Public Methods
    */

    // Adds a group for puzzle pieces to the scene and returns the new object containing the new group
    addSequence(newSeqName) {
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

    addPuzzleHoleToSeq(holeToAdd, seqName) {
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

    addPuzzlePieceToSeq(pieceToAdd, seqName) {
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
    
    attachDebugTextToSeq(seqName) {
        let pieceDebugTextObjs = [];
        let holeDebugTextObjs = [];
        const piecesList = this.sequences[seqName].pieces;
        for (const piece of piecesList) {
            const newTextObj = this.parentScene.add.text(piece.getCenter().x, piece.getCenter().y, `[PIECE]\nseqName: ${piece.sequenceName}\nnumInSequence: ${piece.numInSequence}`, {color: "white", fontFamily: "Verdana", fontSize: "24px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
            pieceDebugTextObjs.push(newTextObj);
        }
        const holesList = this.sequences[seqName].holes;
        for (const hole of holesList) {
            const newTextObj = this.parentScene.add.text(hole.getCenter().x, hole.getCenter().y, `[HOLE]\nseqName: ${hole.sequenceName}\nnumInSequence: ${hole.numInSequence}`, {color: "white", fontFamily: "Verdana", fontSize: "24px", stroke: "black", strokeThickness: 1}).setOrigin(0.5);
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

    // Reads in tilemap data to generate its puzzle
    createPuzzleFromTilemap(tilemap) {
        // From the tilemap, get the object layer named "puzzleLayer".
        // This means that all the puzzle-related objects need to be on that layer.
        let objLayer = tilemap.getObjectLayer(this.TILEMAP_DATA_NAMES.objectLayerName);
        // The tileset data will be used to get the custom properties of tiles
        let tileset = tilemap.addTilesetImage(this.TILEMAP_DATA_NAMES.tilesetName, this.TILEMAP_DATA_NAMES.tilesetImageKey);
        for (const tiledObj of objLayer.objects) {
            // Get the custom properties of the current object that are stored in the tileset
            // The properties will be stored as an array of objects, where each object represents a custom property.
            let properties = tileset.getTileProperties(tiledObj.gid);
            // Find the first object in the properties array that indicates that the tile is a puzzle object
            let propsObj = Phaser.Utils.Array.GetFirst(properties, "name", this.TILEMAP_DATA_NAMES.puzzleObjIdentifier);

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

                targetObj.setDisplaySize(tiledObj.width, tiledObj.height);
                targetObj.setVisible(tiledObj.visible);
                // Apply the correct texture to this object using its tileset image
                textureUVCoords = tileset.getTileTextureCoordinates(targetObj.gid);
                // Get an object with all the frames of the tileset
                let tilesetFrames = tileset.image.frames;
                // Get the frame object that corresponds to this TiledObject
                let correspondingFrame = Object.values(tilesetFrames).find((f) => {
                    return f.cutX == textureUVCoords.x && f.cutY == textureUVCoords.y;
                });

                // Set the correct texture on this object
                targetObj.setTexture(tileset.image);
                targetObj.setFrame(correspondingFrame, false, false); // Don't update the size or origin

                // Custom properties
                let seqName = Phaser.Utils.Array.GetFirst(properties, "name", "sequenceName")[value];
                targetObj.sequenceName = seqName;
                targetObj.numInSequence = Phaser.Utils.Array.GetFirst(properties, "name", "numInSequence")[value];

                // If a sequence with the object's sequence name doesn't yet exist, create it
                if (!Phaser.Utils.Objects.HasValue(this.sequences, seqName)) {
                    this.addSequence(seqName);
                }
            }

            // Check whether the current object is a puzzle piece or a puzzle hole
            if (propsObj["value"] === this.TILEMAP_DATA_NAMES.puzPieceObjValue) {
                let newPiece = new PuzzlePiece({scene: this.parentScene});
                assignProperties(newPiece);
                this.addPuzzlePieceToSeq(newPiece, newPiece.sequenceName);
            }
            else if (propsObj["value"] === this.TILEMAP_DATA_NAMES.puzHoleObjValue) {
                let newHole = new PuzzleHole({scene: this.parentScene});
                assignProperties(newHole);
                this.addPuzzleHoleToSeq(newPiece, newPiece.sequenceName);
            }
        }
    }

    // Returns an array containing references all of the puzzle pieces in this object's puzzle
    getAllPieces() {
        console.error("The getAllPieces() method currently isn't implemented!");
        // Create array to hold puzzle pieces
        
        // Loop through all sequences
    }

    // Return the closest puzzle piece to the player
    getClosestPuzzlePiece(excludePiecesInHoles = true) {
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

    getCorrespondingHole(puzPiece) {
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

    getCurrentlyHeldPiece() {
        return this.currHeldPuzPiece;
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
    // Returns a Phaser.Geom.Point object for the top left point of the grid cell that contains the point.
    #containingGridCellTopLeft(x, y) {
        let pointX = Phaser.Math.Snap.Floor(x, this.gridProperties.intervalGap, this.gridProperties.topLeftX);
        let pointY = Phaser.Math.Snap.Floor(y, this.gridProperties.intervalGap, this.gridProperties.topLeftY);
        return new Phaser.Geom.Point(pointX, pointY);
    }

    #pickUpPuzzlePiece(puzPiece) {
        puzPiece.setVisible(false);
        this.currHeldPuzPiece = puzPiece;
        // TODO: maybe want to emit event that piece was picked up to alert the UI and sound managers
    }

    #placePuzzlePiece(puzPiece, targetHole = null) {
        if (targetHole != null) {
            puzPiece.setPosition(targetHole.getTopLeft().x, targetHole.getTopLeft().y);
            puzPiece.changeToInHoleSprite();
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
        // TODO: maybe want to emit event that piece was placed to alert the UI and sound managers
    }
}