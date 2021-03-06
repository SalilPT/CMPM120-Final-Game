class Tutorial extends Phaser.Scene {
    constructor() {
        super("tutorialScene");
    }
    
    preload(){
        //visual assets
        this.load.atlas("bulletHellAtlas", "./assets/bulletHellTileSet.png", "./assets/bulletHellTileSet.json");
        this.load.tilemapTiledJSON("tileMap", "./assets/bulletHellMap.json"); // tile map JSON file (from tiled software)
        //audio assets
        this.load.audio("shootingSFX", "./assets/audio/shooting_sfx.wav");
    }

    create() {
        this.fullTutorialComplete = false;
        this.movementTutorialComplete = false;
        this.aimingTutorialComplete = false;
        this.InteractingTutorialComplete = false;
        // mainly followed Nathan Altice's mappy example for collisions using tile maps
        const map = this.add.tilemap("tileMap");
        // set a tileset for the map and its corresponding layers
        const tileset = map.addTilesetImage("bulletHellTileSet", "bulletHellAtlas");
        const floorLayer = map.createLayer("Floor", tileset, 0, 0);
        const wallLayer = map.createLayer("Walls", tileset, 0, 0);
        floorLayer.setDepth(-2); // change as needed, note:puzzle piece sprite is 1 less than player depth, and keyhole is 2 less
        // set collision based on the "collision" property that is set in the Tiled software
        wallLayer.setCollisionByProperty({
            collides: true
        });
        //groups
        this.anythingAndWalls = this.physics.add.group(); // group to keep things inside the walls
        this.puzPieceGroup = this.physics.add.group(); // group to house the puzzle pieces
        this.puzSlotGroup = this.physics.add.group(); // group to house the puzzle pieces
        // create a player
        this.playerChar = new PlayerCharacter({
            scene: this,
            x: globalGame.config.width/2,
            y: globalGame.config.height/2,
            texture: "gameAtlas",
            frame: "JebBottomIdle1.png"
        });
        this.plrMovManager = this.playerChar.getMovManager();
        this.plrMovManager.setMovSpd(400);
        this.playerChar.body.setCollideWorldBounds(true);
        this.anythingAndWalls.add(this.playerChar);
        //create the colliders
        this.physics.add.collider(this.anythingAndWalls, wallLayer, (object1) => {
            if(object1 != this.playerChar){ // check it is not player sprite
                object1.destroy();
            }
        });
        // create instance of the movement manager
        this.movManager = new PlayerMovementManager(this);
        this.movManager.setMovSpd(400);
        /*
        //code based off the shooting demo
        this.input.on("pointerdown", () => {
            let newPlayerBullet = this.physics.add.sprite(this.playerChar.x, this.playerChar.y, "gameAtlas", "Key Temp.png").setOrigin(0.5);
            this.anythingAndWalls.add(newPlayerBullet);
            let fireAngle = Phaser.Math.Angle.Between(this.playerChar.body.center.x, this.playerChar.body.center.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
            fireAngle = Phaser.Math.RadToDeg(fireAngle);
            let fireVector = this.physics.velocityFromAngle(fireAngle, 250);
            newPlayerBullet.body.setVelocity(fireVector.x, fireVector.y);
            newPlayerBullet.setScale(0.5);
            this.sound.play("shootingSFX");
        });
        */
        //code based on the puzzle demo
        this.puzManager = new PuzzleManager(this, {playerChar: this.playerChar});
        this.puzManager.bindAndListenForInteractKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
        // Make a sequence
        let seqName = "sequence1";
        this.puzManager.addSequence(seqName);
        for (let i = 1; i < 4 + 1; i++) {
            let newPiece = new PuzzlePiece({
                scene: this,
                x: 320*i,
                y: 768 + 64 * Math.pow(-1, i),
                numInSequence: i,
                sequenceName: seqName
            }).setOrigin(0);
            this.puzPieceGroup.add(newPiece);
            this.puzManager.addPuzzlePieceToSeq(newPiece, seqName);
            let newPuzHole = new PuzzleHole({
                scene: this,
                x: 320*i,
                y: 192 + 64 * Math.pow(-1, i),
                numInSequence: i,
                sequenceName: seqName
            }).setOrigin(0);
            
            this.puzSlotGroup.add(newPuzHole); 
            newPuzHole.numInSequence = i;
            this.puzManager.addPuzzleHoleToSeq(newPuzHole, seqName);
            
        }        
        // glowing slots tween
        this.tweens.add({
            targets: this.puzSlotGroup.getChildren(),
            alpha: { from: 0.5, to: 1 },
            //ease: 'Sine.easeInOut',
            duration: 500,
            repeat: -1,
            yoyo: true,
        });
        // Make a textBox that explains movement and interaction controls
        this.time.delayedCall(500, ()=> {
            this.scene.launch("textBoxesScene", {
                textChain: ["Wasd"],
                scenesToPauseAtStart: ["tutorialScene"],
                scenesToResumeAtEnd: ["tutorialScene"],             
            });
            this.movementTutorialComplete = true;
        });
        // check if the puzzle is complete
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.fullTutorialComplete == false){
                this.checkForCompletion();
            }
        });
    }

    update(){
        let movVector = this.plrMovManager.getMovementVector();
        this.playerChar.body.setVelocity(movVector.x, movVector.y);
        this.playerChar.updateGraphics();
        //simple over lap logic to call the textbox for puzzle piece interaction
        if (this.movementTutorialComplete == true && this.InteractingTutorialComplete == false){
            for ( let puzPiece of this.puzPieceGroup.getChildren()){
                if (puzPiece.x - puzPiece.width < this.playerChar.x && this.playerChar.x < puzPiece.x + puzPiece.width*2) {
                    if (puzPiece.y - puzPiece.height < this.playerChar.y && this.playerChar.y < puzPiece.y + puzPiece.height*2) {
                        if (this.movementTutorialComplete == true && this.InteractingTutorialComplete == false){
                            this.scene.launch("textBoxesScene", {
                                textChain:["SpaceToInteract"],
                                scenesToPauseAtStart: ["tutorialScene"],
                                scenesToResumeAtEnd: ["tutorialScene"]
                            });
                            this.InteractingTutorialComplete = true;
                        }
                    }
                }
            }
        }
    }

    checkForCompletion(){
        this.time.delayedCall(500, () => {// gives time to iterate over all of the sequences
            let sequencesCompleted = 0; // counter, keeps track of how many sequences are completed so far
            for (let seq of Object.values(this.puzManager.sequences)){
                if (seq.isCompleted == false){ 
                    break;
                }
                sequencesCompleted ++; // one sequence was complete it, add to counter
            }
            if(sequencesCompleted == (Object.keys(this.puzManager.sequences).length)){
                this.fullTutorialComplete = true;
                this.scene.launch("textBoxesScene", {
                    textChain:["tutorialEnd"],
                    scenesToPauseAtStart: ["tutorialScene"],
                    scenesToStopAtEnd: ["tutorialScene"],
                    scenesToStartAtEnd: ["menuScene"]
                });
                this.sound.removeByKey("menuBeat");
            }
        });
    }
}