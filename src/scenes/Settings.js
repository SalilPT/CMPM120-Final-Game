class Settings extends Phaser.Scene {
    constructor() {
        super("settingsScene");
    }

    preload() {

    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2
        this.userInterfaceMgr.createMenuButton(128, globalGameConfig.height - 128, 256, 96, "Back", "menuScene")
        .once("pointerdown", ()=>this.sound.removeByKey("menuBeat"));
    }

    update() {

    }
}