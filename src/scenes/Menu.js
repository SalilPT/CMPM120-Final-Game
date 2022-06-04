class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    preload() {
        // Preload bullets
        this.load.image("orangeBullet", "./assets/orangeBullet.png");
        this.load.image("purpleBullet", "./assets/purpleBullet.png");
        this.load.image("yellowBullet", "./assets/yellowBullet.png");
    }

    create() {
        this.scene.bringToTop();
        let demoSceneTransitionTextConfig = {color: "black", fontSize: "40px", stroke: "white", strokeThickness: 0};
        // Make buttons or keybinds to go to demo scenes

        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x6666ff)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("tutorialScene"));
        
        this.add.rectangle(globalGameConfig.width/3, globalGameConfig.height/1.3, globalGameConfig.width/11, globalGameConfig.height/16, 0x6666ff)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("movementAndAimingDemoScene"));
        
        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/1.3, globalGameConfig.width/11, globalGameConfig.height/16, 0x6666ff)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("puzzleDemoScene"));

        this.add.rectangle(globalGameConfig.width*(2/3), globalGameConfig.height/1.3, globalGameConfig.width/11, globalGameConfig.height/16, 0x6666ff)
        .setInteractive({useHandCursor: true})
        .on("pointerdown", () => this.scene.start("bulletsDemoScene"));
                    
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, "tutorial", demoSceneTransitionTextConfig).setOrigin(0.5);
        demoSceneTransitionTextConfig.fontSize = '20px';
        this.add.text(globalGameConfig.width/3, globalGameConfig.height/1.3, "Movement/\nAiming Demo", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/1.3, "Puzzle Demo", demoSceneTransitionTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width*(2/3), globalGameConfig.height/1.3, "Bullets Demo", demoSceneTransitionTextConfig).setOrigin(0.5);
    }
}