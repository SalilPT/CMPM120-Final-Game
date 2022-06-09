class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    preload() {
        this.load.image('tealButton', './assets/tealButton.png')
    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth, halfGameHeight, 1, "Play", "playScene", {
            levelsLeft: 1,
            completedLevels: []
        });

        this.userInterfaceMgr.createNewMenuButton(halfGameWidth, halfGameHeight + 1*160, 1, "Tutorial", "tutorialScene");
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth - 160, halfGameHeight + 2*160, 1, "Settings", "settingsScene");
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth + 160, halfGameHeight + 2*160, 1, "Credits", "creditsScene");

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