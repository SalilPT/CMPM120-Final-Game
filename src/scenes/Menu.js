class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    create() {
        let demoSceneTransitionTextConfig = {color: "black", fontSize: "36px", stroke: "white", strokeThickness: 0};
        // Make buttons or keybinds to go to demo scenes
        this.MovementDemButton = this.add.rectangle(globalGameConfig.width/4, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff);
        this.PuzzleDemoButton = this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff);
        this.WallsDemoButton = this.add.rectangle(globalGameConfig.width/1.33, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff);
        
        this.add.text(globalGameConfig.width/4, globalGameConfig.height/2, "Movement/\nAiming Demo\n(working)", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, "Puzzle Demo\n(in progress)", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/1.33, globalGameConfig.height/2, "Walls Demo\n(in progress)", demoSceneTransitionTextConfig).setOrigin(0.5);

        this.MovementDemButton.setInteractive();
        this.PuzzleDemoButton.setInteractive();
        this.WallsDemoButton.setInteractive();

        this.MovementDemButton.on("pointerdown", () =>{
            this.scene.start("movementAndAimingDemoScene");
        })

        this.PuzzleDemoButton.on("pointerdown", () =>{
            this.scene.start("puzzleDemoScene");
        })

        this.WallsDemoButton.on("pointerdown", () =>{
            this.scene.start("wallsDemoScene");
        })

        this.input.keyboard.on("keydown", (event) => {
            let keyCodeStr = event.keyCode.toString();
            console.log(Phaser.Input.Keyboard.KeyCodes.TWO.toString())
            switch(keyCodeStr) {
                case Phaser.Input.Keyboard.KeyCodes.TWO.toString():
                    this.scene.start("movementAndAimingDemoScene");
                    break;
            }
        }, this);
    }
}