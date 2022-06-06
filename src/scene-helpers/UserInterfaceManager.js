class UserInterfaceManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "UserInterfaceManager");

        this.parentScene = parentScene;
    }

    createMenuButton(x, y, width, height, text, targetSceneKey, rectFillColor = 0x00BFB2) {
        let menuTextConfig = {
            fontFamily: "bulletFont",
            fontSize: "60px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }

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

        this.parentScene.add.text(x, y, text, menuTextConfig).setOrigin(0.5);
        
        return newButton;
    }
}