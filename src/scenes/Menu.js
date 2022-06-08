class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    preload() {
        
    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2
        this.userInterfaceMgr.createMenuButton(halfGameWidth, halfGameHeight, 288, 108, "Play", "playScene");
        this.userInterfaceMgr.createMenuButton(halfGameWidth, halfGameHeight + 1*128, 256, 96, "Tutorial", "tutorialScene");
        this.userInterfaceMgr.createMenuButton(halfGameWidth - 160, halfGameHeight + 2*128, 256, 96, "Settings", "settingsScene");
        this.userInterfaceMgr.createMenuButton(halfGameWidth + 160, halfGameHeight + 2*128, 256, 96, "Credits", "creditsScene");

        // Title Text
        this.add.text(halfGameWidth, halfGameHeight - 320, "Jeb's Puzzling Mission", 
        {
            fontFamily: "bulletFont",
            fontSize: "96px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    update() {

    }

}