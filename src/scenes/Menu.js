class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    preload() {
    }

    create() {
        this.anims.create({
            key: "jebTitleAnim",
            frames: this.anims.generateFrameNumbers("jebTitleSpritesheet", {}),
            frameRate: 23,
            yoyo: true,
            repeat: -1
        });

        this.userInterfaceMgr = new UserInterfaceManager(this, {});
        const halfGameWidth = globalGameConfig.width/2;
        const halfGameHeight = globalGameConfig.height/2;

        let timesMenuBeatLooped = 0;
        let menuBeat = this.sound.add("menuBeat");
        menuBeat.play({loop: true});
        menuBeat.on("looped", () => {
            timesMenuBeatLooped++;
            if (timesMenuBeatLooped == 3) {
                menuBeat.setLoop(false);
            }
        });

        this.userInterfaceMgr.createNewMenuButton(halfGameWidth, halfGameHeight, 1, "Play", "playScene", {}) // An empty object is passed as data here to the Play scene's init() method to make level progression work properly.
        .once("pointerdown", () => this.sound.removeByKey("menuBeat"));
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth, halfGameHeight + 1*160, 1, "Tutorial", "tutorialScene");
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth - 160, halfGameHeight + 2*160, 1, "Settings", "settingsScene");
        this.userInterfaceMgr.createNewMenuButton(halfGameWidth + 160, halfGameHeight + 2*160, 1, "Credits", "creditsScene");

        // Title Text
        this.jebTitle = this.add.sprite(halfGameWidth/1.25, halfGameHeight - 320, "gameAtlas", "jebNameTitleAnim.png");
        this.jebTitle.anims.play("jebTitleAnim")
        this.add.text(this.jebTitle.x + this.jebTitle.width/2 + (64 * 2.5), halfGameHeight - 300, "Puzzling\n     Mission", 
        {
            fontFamily: "bulletFont",
            fontSize: "96px",
            color: "#76c2e8",
            stroke: "#160F29",
            strokeThickness: 10
        }).setOrigin(0.5);

        // Audio

        // Prevent stacked audio when clicking back in game window
        // This sound manager is global, so this property will persist across scenes and scene changes
        this.sound.pauseOnBlur = false;

        // Game registry variables
        globalGame.registry.values.extremeModeOn ??= false;
    }

    update() {

    }

}