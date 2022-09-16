class UserInterfaceManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "UserInterfaceManager");

        this.parentScene = parentScene;

        /*
        Constants
        */
        this.USER_INTERFACE_Z_INDEX = 1000;
        this.HEALTH_TEXT_CONFIG = {
            fontFamily: "bulletFont",
            fontSize: "36px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }
        this.MENU_TEXT_CONFIG = {
            fontFamily: "bulletFont",
            fontSize: "55px",
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
    createExtremeModeSetting(centerX, centerY) {
        // Top text
        let topText = this.parentScene.add.text(centerX, centerY, "EXTREME MODE", this.MENU_TEXT_CONFIG).setOrigin(0.5);

        // Button
        let newButton = this.parentScene.add.sprite(centerX, centerY, "gameAtlas", "tealButton.png").setOrigin(0.5);
        let onOrOffText = globalGame.registry.values.extremeModeOn ? "OFF" : "ON"; // Put after "Turn" on the button
        let toggleText = this.scene.add.text(newButton.getCenter().x, centerY, "Turn " + onOrOffText, this.MENU_TEXT_CONFIG)
            .setOrigin(0.5)
            .setFontSize(48)
            ;

        newButton.setInteractive({useHandCursor: true})
            .on("pointerdown", () => {
                globalGame.registry.values.extremeModeOn = !globalGame.registry.values.extremeModeOn;
                onOrOffText = globalGame.registry.values.extremeModeOn ? "OFF" : "ON";
                toggleText.setText("Turn " + onOrOffText);
            });

        // Bottom text
        let descriptionText = this.parentScene.add.text(centerX, centerY, "In extreme mode, you have less health, your mission lasts 10 rooms, and it's game over if you die.", this.MENU_TEXT_CONFIG)
            .setOrigin(0.5)    
            .setWordWrapWidth(topText.width*2)
            ;

        // Put the parts in a row and horizontally align them
        const marginInPx = 8;
        topText.setPosition(centerX, 256);
        Phaser.Display.Align.To.BottomCenter(newButton, topText, 0, marginInPx);
        Phaser.Display.Align.To.BottomCenter(descriptionText, newButton, 0, marginInPx);
        descriptionText.setX(topText.getCenter().x + 16); // Added a bit of offset here because it looks better

        const centerBeforeCorrection = topText.getTopCenter().y + (descriptionText.getBottomCenter().y - topText.getTopCenter().y)/2;
        const centerOffset = centerY - centerBeforeCorrection;

        this.scene.add.group([topText, newButton, descriptionText]).incY(centerOffset);

        // Put toggleText back on button
        toggleText.setPosition(newButton.getCenter().x, newButton.getCenter().y);
    }

    createHealthBox(x, y, startingHealth) {
        // Make surroounding box
        //let boundingRect = this.parentScene.add.rectangle(x, y, undefined, undefined, 0xAAAAAA, 0.25).setOrigin(0);
        // Make the health text (with padding)
        let padAmount = 4;
        this.healthText = this.parentScene.add.text(x + padAmount, y + padAmount, "HEALTH ", this.HEALTH_TEXT_CONFIG);
        this.healthText.setScrollFactor(0);
        // Get the first frame of the health icon's texture
        this.healthIconFrame = this.parentScene.textures.getFrame("gameAtlas", "Life Symbol.png");
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
    createNewMenuButton(x, y, scale, text, targetSceneKey, data = null) {
        let Button = this.parentScene.add.sprite(x, y, "gameAtlas", "tealButton.png")
        .setInteractive({useHandCursor: true})
        .on("pointerdown", () => this.parentScene.scene.start(targetSceneKey, data))
        .setScale(scale);
        this.parentScene.add.text(x, y, text, this.MENU_TEXT_CONFIG).setOrigin(0.5);
        return Button;
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
        let volIncreaseArrow = this.parentScene.add.sprite(this.volumeText.getCenter().x, this.volumeText.getTopCenter().y - arrowToValuePadding, "gameAtlas", "pointing arrow.png").setOrigin(0.5);
        volIncreaseArrow.setAngle(-initArrowAngle - 90);
        volIncreaseArrow.y -= volIncreaseArrow.height/2;
        let volDecreaseArrow = this.parentScene.add.sprite(this.volumeText.getCenter().x, this.volumeText.getBottomCenter().y + arrowToValuePadding, "gameAtlas", "pointing arrow.png").setOrigin(0.5);
        volDecreaseArrow.setAngle(-initArrowAngle + 90);
        volDecreaseArrow.y += volDecreaseArrow.height/2;
        
        this.volumeText.text = Math.round(this.parentScene.sound.volume * 100);
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

        volDecreaseArrow
            .setInteractive({useHandCursor: true})
            .on("pointerdown", () => {
                const newVol = Math.max(globalGame.sound.volume - 0.1, 0);
                globalGame.sound.setVolume(newVol.toFixed(2));

                // For whatever reason, the voolume value doesn't update immediately.
                // So, it needs to be stored in a variable for the volume text here.
                this.volumeText.text = Math.round(newVol * 100);
                volChangeFlag = true;
            });

        this.parentScene.input.on("pointerup", () => {
            if (volChangeFlag) {
                this.parentScene.sound.play("jebShoot");
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