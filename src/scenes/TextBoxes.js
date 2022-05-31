class TextBoxes extends Phaser.Scene {
    constructor() {
        super("textBoxesScene");
    }
    init(data){
        this.textToDisplay = data.textToDisplay;
    }
    preload(){
        this.load.json("text", "./assets/textData.json")
    }
    create(){
        this.text = this.cache.json.get("text") // contains the parsed json file
        this.currentTextObject = this.text[this.textToDisplay] // get the specific text object of the json file
        this.scene.bringToTop();
        // create a small rectangle
        this.textBox = this.add.rectangle(globalGameConfig.width/2, globalGameConfig.height/2, globalGameConfig.width/16, globalGameConfig.height/32, 0x000000);
        // tween to scale up the rectangle
        this.tweens.add({
            targets: this.textBox,
            duration: 100,
            scaleX: 10,
            scaleY:10,
        });
        this.text = this.cache.json.get("text")
        this.time.delayedCall(100, ()=>{
            let tempTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
            this.message = this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, this.currentTextObject.text, tempTextConfig).setOrigin(0.5);
        });
        this.time.delayedCall(2000, ()=>{
            let tempExitTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
            this.exitMessage = this.add.text(this.textBox.x + this.textBox.displayWidth/2.5, this.textBox.y + this.textBox.displayHeight/3, this.currentTextObject.keyboardInput, tempExitTextConfig).setOrigin(0.5);
            this.exitMessage.setAlpha(0.2);
            this.tweens.add({
                targets: this.exitMessage,
                duration: 1000,
                alpha: { from: 0.20, to: 0.50 },
                repeat: -1,
                yoyo: true
            });
            this.input.keyboard.on('keydown-' + this.currentTextObject.keyboardInput, () => {
                this.scene.stop();
                if(this.currentTextObject.SwitchScene.shouldSwitch == true){
                    this.scene.start(this.currentTextObject.SwitchScene.sceneToSwitchTo);
                    if (this.currentTextObject.SwitchScene.shouldStopScenes == true) {
                        for (let scn of Object.values(this.currentTextObject.SwitchScene.scenesToStop)) {
                            this.scene.stop(scn);
                        }
                    }
                }
            });
        });
    }
}