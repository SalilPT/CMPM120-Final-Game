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
        console.log(this.whichText);
        this.scene.bringToTop();
        this.text = this.cache.json.get("text")
        let tempTextConfig = {color: "white", fontSize: "50px", stroke: "black", strokeThickness: 1};
        this.add.text(globalGameConfig.width/2, globalGameConfig.width/2, this.text[this.textToDisplay].line1, tempTextConfig).setOrigin(0.5);
    }
}