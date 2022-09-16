class Credits extends Phaser.Scene {
    constructor() {
        super("creditsScene");
    }

    preload() {

    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        this.userInterfaceMgr.createMenuButton(128, globalGameConfig.height - 128, 256, 96, "Back", "menuScene")
        .once("pointerdown", ()=> this.sound.removeByKey("menuBeat"));

        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2;
        this.add.text(halfGameWidth, halfGameHeight,
            // Template literals exist, but using them here wouldn't look much better in my opinion.
            "ART BY:\n" +
            "Miles Katlin\n" +
            "Gustavo Cruz\n" +
            "\n" +
            "PROGRAMMING BY:\n" +
            "Salil Tantamjarik\n" +
            "Gustavo Cruz\n" +
            "\n" +
            "SOUND AND MUSIC BY:\n" +
            "Gustavo Cruz\n"
        ,
        {
            fontFamily: "bulletFont",
            fontSize: "48px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4,
            resolution: 8
        }).setOrigin(0.5);
    }

    update() {

    }
}