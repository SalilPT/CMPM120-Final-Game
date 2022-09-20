class Settings extends Phaser.Scene {
    constructor() {
        super("settingsScene");
    }

    create() {
        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameHeight = globalGameConfig.height/2;

        this.userInterfaceMgr.createMenuButton(128, globalGameConfig.height - 128, 256, 96, "Back", "menuScene")
            .once("pointerdown", () => this.sound.removeByKey("menuBeat"))
            ;
        this.userInterfaceMgr.createVolumeSetter(128, halfGameHeight - 64);
        this.userInterfaceMgr.createExtremeModeSetting(1104, halfGameHeight + 32);
    }
}