class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    create() {
        let demoSceneTransitionTextConfig = {color: "black", fontSize: "40px", stroke: "white", strokeThickness: 0};
        // Make buttons or keybinds to go to demo scenes

        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("tutorialScene"));
        
        this.add.rectangle(globalGameConfig.width/3, globalGameConfig.height/1.3, globalGameConfig.width/11, globalGameConfig.height/16, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("movementAndAimingDemoScene"));
        
        this.add.rectangle(globalGameConfig.width/1.5, globalGameConfig.height/1.3, globalGameConfig.width/11, globalGameConfig.height/16, 0x6666ff)
            .setInteractive({cursor: "pointer"})
            .on("pointerdown", () => this.scene.start("puzzleDemoScene")); 
                    
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, "tutorial", demoSceneTransitionTextConfig).setOrigin(0.5);
        demoSceneTransitionTextConfig.fontSize = '20px'
        this.add.text(globalGameConfig.width/3, globalGameConfig.height/1.3, "Movement/\nAiming Demo", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/1.5, globalGameConfig.height/1.3, "Puzzle Demo", demoSceneTransitionTextConfig).setOrigin(0.5);   
    }
}