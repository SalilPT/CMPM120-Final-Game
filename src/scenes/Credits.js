class Credits extends Phaser.Scene {
    constructor() {
        super("creditsScene");
    }

    preload() {

    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2
        this.userInterfaceMgr.createMenuButton(128, globalGameConfig.height - 128, 256, 96, "Back", "menuScene");

        this.add.text(halfGameWidth, halfGameHeight, 
        `
            ART BY:\n
            [NAME]\n
            \n
            PROGRAMMING BY:\n
            [NAME]\n
            \n
            SOUND AND MUSIC BY:\n
            [NAME]
        `,
        {
            fontFamily: "bulletFont",
            fontSize: "36px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    update() {

    }
}