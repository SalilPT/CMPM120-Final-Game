class Menu extends Phaser.Scene {
    constructor() {
        super("menuScene");
    }

    create() {
        // Make buttons or keybinds to go to demo scenes
        let demoSceneTransitionTextConfig = {color: "black", fontSize: "36px", stroke: "white", strokeThickness: 1};
        this.add.text(32, 64, "Press 2 (non-numpad) to go to Movement and Aiming Demo", demoSceneTransitionTextConfig);
        this.add.text(32, 64 * 2, "Press 4 (non-numpad) to go to Puzzle Demo", demoSceneTransitionTextConfig);
        this.input.keyboard.on("keydown", (event) => {
            let keyCodeStr = event.keyCode.toString();
            switch(keyCodeStr) {
                case Phaser.Input.Keyboard.KeyCodes.TWO.toString():
                    this.scene.start("movementAndAimingDemoScene");
                    break;
                case Phaser.Input.Keyboard.KeyCodes.FOUR.toString():
                    this.scene.start("puzzleDemoScene");
                    break;
            }
        }, this);
    }
}