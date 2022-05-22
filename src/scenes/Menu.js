class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    create() {
        let demoSceneTransitionTextConfig = {color: "black", fontSize: "36px", stroke: "white", strokeThickness: 0};
        // Make buttons or keybinds to go to demo scenes

        this.add.rectangle(globalGameConfig.width/4, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("movementAndAimingDemoScene"));
        
        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("puzzleDemoScene"));

        this.add.rectangle(globalGameConfig.width/1.33, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("tutorialScene"));
        
        this.add.text(globalGameConfig.width/4, globalGameConfig.height/2, "Movement/\nAiming Demo\n(working)", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, "Puzzle Demo\n(in progress)", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/1.33, globalGameConfig.height/2, "tutorial\n(working)", demoSceneTransitionTextConfig).setOrigin(0.5);            

    }
}