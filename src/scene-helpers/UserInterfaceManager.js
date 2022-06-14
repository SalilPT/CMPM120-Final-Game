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

        this.volumeLabelText;
        this.volumeText;
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
        this.healthText.setScrollFactor(0);
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

    createMenuButton(x, y, width, height, text, targetSceneKey, rectFillColor = 0x00BFB2, data = null) {

        let newButton = this.parentScene.add.rectangle(x, y, width, height, rectFillColor)
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => this.parentScene.scene.start(targetSceneKey, data));

        
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

    createVolumeSetter(x, centerY) {
        // The distance from the right side of the volume text to the left sides of the volume arrows
        const textToArrowPadding = 4;
        // The distance from the bottom of the up arrow to the top of the number representing the current global volume value
        const arrowToValuePadding = 8;
        // The initial angle of the arrow graphic
        const initArrowAngle = -90;

        this.volumeLabelText = this.parentScene.add.text(x, centerY, "Volume: ", this.MENU_TEXT_CONFIG).setOrigin(0, 0.5);
        // Give the volume text placeholder text for positioning purposes
        this.volumeText = this.parentScene.add.text(this.volumeLabelText.getRightCenter().x, centerY, "100", this.MENU_TEXT_CONFIG).setOrigin(0, 0.5);
        let volIncreaseArrow = this.parentScene.add.sprite(this.volumeText.getCenter().x, this.volumeText.getTopCenter().y - arrowToValuePadding, "pointing arrow").setOrigin(0.5);
        volIncreaseArrow.setAngle(-initArrowAngle - 90);
        volIncreaseArrow.y -= volIncreaseArrow.height/2;
        let volDecreaseArrow = this.parentScene.add.sprite(this.volumeText.getCenter().x, this.volumeText.getBottomCenter().y + arrowToValuePadding, "pointing arrow").setOrigin(0.5);
        volDecreaseArrow.setAngle(-initArrowAngle + 90);
        volDecreaseArrow.y += volDecreaseArrow.height/2;
        
        this.volumeText.text = Math.round(this.parentScene.sound.volume * 100);
        //this.parentScene.sound.volume = this.parentScene.sound.volume;
        let volChangeFlag = false;
        // Assign click events
        volIncreaseArrow
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => {
                const newVol = Math.min(globalGame.sound.volume + 0.1, 2);
                globalGame.sound.setVolume(newVol.toFixed(2));

                // For whatever reason, the voolume value doesn't update immediately.
                // So, it needs to be stored in a variable for the volume text here.
                this.volumeText.text = Math.round(newVol * 100);
                volChangeFlag = true;
            })
            //.on("pointerup", () => {this.parentScene.sound.play("jebShoot");console.log("POINTER UP???")});

        volDecreaseArrow
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => {
                console.log(this.parentScene.sound.volume, Math.max(this.parentScene.sound.volume - 0.05, 0));
                const newVol = Math.max(globalGame.sound.volume - 0.1, 0);
                globalGame.sound.setVolume(newVol.toFixed(2));

                // For whatever reason, the voolume value doesn't update immediately.
                // So, it needs to be stored in a variable for the volume text here.
                this.volumeText.text = Math.round(newVol * 100);
                volChangeFlag = true;
            });

        this.parentScene.input.on("pointerup", () => {
            if (volChangeFlag) {
                this.parentScene.sound.play("jebShoot");console.log("POINTER UP???")
                volChangeFlag = false;
            }
            });
        this.parentScene.input.on("gameout", () => {volChangeFlag = false;})

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