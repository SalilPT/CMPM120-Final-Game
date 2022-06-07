class UserInterfaceManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "UserInterfaceManager");

        this.parentScene = parentScene;

        /*
        Constants
        */
        this.USER_INTERFACE_Z_INDEX = 1000;
        this.HEALTH_ICON_TEXTURE_KEY = "lifeSymbol";
        this.HEALTH_TEXT_CONFIG = {
            fontFamily: "bulletFont",
            fontSize: "36px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }
        this.MENU_TEXT_CONFIG = {
            fontFamily: "bulletFont",
            fontSize: "60px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }

        /*
        Mutable Properties
        */
        this.healthText;
        this.healthBoxRenderTexture;
        this.healthIconFrame;
    }

    /*
    Public Methods
    */

    createHealthBox(x, y, startingHealth) {
        // Make surroounding box
        //let boundingRect = this.parentScene.add.rectangle(x, y, undefined, undefined, 0xAAAAAA, 0.25).setOrigin(0);
        // Make the health text (with padding)
        let padAmount = 4;
        this.healthText = this.parentScene.add.text(x + padAmount, y + padAmount, "HEALTH ", this.HEALTH_TEXT_CONFIG);
        // Get the first frame of the health icon's texture
        this.healthIconFrame = this.parentScene.textures.get(this.HEALTH_ICON_TEXTURE_KEY).get(0);
        const targetPt = this.healthText.getRightCenter();
        this.healthBoxRenderTexture = this.parentScene.add.renderTexture(targetPt.x, targetPt.y, this.healthIconFrame.width * startingHealth, this.healthIconFrame.height)
            .setOrigin(0, 0.5)
            .setScrollFactor(0);
        this.setHealthBoxValue(startingHealth);

        //boundingRect.setSize(this.healthText.width + this.healthBoxRenderTexture.displayWidth + padAmount * 2, this.healthText.height + padAmount * 2);
        let graphicsObj = this.parentScene.add.graphics();
        graphicsObj.fillStyle(0xAAAAAA, 0.25)
            .fillRoundedRect(x, y, this.healthText.width + this.healthBoxRenderTexture.displayWidth + padAmount * 2, this.healthText.height + padAmount * 2, 10)
            .setScrollFactor(0);

        this.healthText.setDepth(this.USER_INTERFACE_Z_INDEX);
        this.healthBoxRenderTexture.setDepth(this.USER_INTERFACE_Z_INDEX);
        
    }

    createMenuButton(x, y, width, height, text, targetSceneKey, rectFillColor = 0x00BFB2) {

        let newButton = this.parentScene.add.rectangle(x, y, width, height, rectFillColor)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.parentScene.scene.start(targetSceneKey));

        
        // Tween button on hover
        /*
        const scaleTarget = 1.05;
        let growTween = this.parentScene.add.tween({
            duration: 1250,
            targets: newButton,
            scale: {from: 1, to: scaleTarget},
            paused: true
        });
        let shrinkTween = this.parentScene.add.tween({
            duration: 1250,
            targets: newButton,
            scale: {to: 1},
            paused: true
        });
        
        newButton.on("pointerover", () => {

        });

        newButton.on("pointerout", () => {

        });
        */

        this.parentScene.add.text(x, y, text, this.MENU_TEXT_CONFIG).setOrigin(0.5);
        
        return newButton;
    }

    createVolumeSlider() {
        // The global volume value will be in this.parentScene.volume
    }

    setHealthBoxValue(value) {
        if (value < 0 || !Number.isInteger(value)) {
            console.warn("Value for health must be a whole number!");
            return;
        }

        this.healthBoxRenderTexture.clear();
        this.healthBoxRenderTexture.setSize(this.healthIconFrame.width * value, this.healthIconFrame.height);
        for (let i = 0; i < value; i++) {
            this.healthBoxRenderTexture.draw(this.healthIconFrame, this.healthIconFrame.width * i);
        }
        
    }
}