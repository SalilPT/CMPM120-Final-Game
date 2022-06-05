class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    preload() {
        // Preload bullets
        this.load.image("orangeBullet", "./assets/orangeBullet.png");
        this.load.image("purpleBullet", "./assets/purpleBullet.png");
        this.load.image("yellowBullet", "./assets/yellowBullet.png");

        // Preload player character images and spritesheets
        this.load.spritesheet("jebBottomIdle", "./assets/Jeb Bottom Idle Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebBottomMoving", "./assets/Jeb Bottom Moving Spritesheet.png", {frameWidth: 64});
        this.load.image("jebRingOff", "./assets/Jeb Ring Off.png");
        this.load.spritesheet("jebRings", "./assets/Jeb Rings Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopAttacking", "./assets/Jeb Top Attcking Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopCharging", "./assets/Jeb Top Charging Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopDeath", "./assets/Jeb Top Death Spritesheet.png", {frameWidth: 64});
        this.load.image("jebTopStart", "./assets/Jeb Top Start.png");
    }

    create() {
        this.scene.bringToTop();
        // text configuration
        let menuTextConfig = {
            fontFamily: "bulletFont",
            fontSize: "60px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }
        // Make buttons or keybinds to go to demo scenes

        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/6, globalGameConfig.height/8, 0x00BFB2)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("tutorialScene"));
        
        this.add.rectangle(globalGameConfig.width/3, globalGameConfig.height/1.3, globalGameConfig.width/7, globalGameConfig.height/9, 0x9ADFEA)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("movementAndAimingDemoScene"));
        
        this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/1.3, globalGameConfig.width/7, globalGameConfig.height/9, 0x9ADFEA)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.scene.start("puzzleDemoScene"));

        this.add.rectangle(globalGameConfig.width*(2/3), globalGameConfig.height/1.3, globalGameConfig.width/7, globalGameConfig.height/9, 0x9ADFEA)
        .setInteractive({useHandCursor: true})
        .on("pointerdown", () => this.scene.start("bulletsDemoScene"));
                    
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, "Tutorial", menuTextConfig).setOrigin(0.5);
        menuTextConfig.fontSize = '30px';
        menuTextConfig.strokeThickness = 4;
        this.add.text(globalGameConfig.width/3, globalGameConfig.height/1.3, "Movement/\nAiming Demo", menuTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width/2, globalGameConfig.height/1.3, "Puzzle Demo", menuTextConfig).setOrigin(0.5);
        this.add.text(globalGameConfig.width*(2/3), globalGameConfig.height/1.3, "Bullets Demo", menuTextConfig).setOrigin(0.5);
    }
}