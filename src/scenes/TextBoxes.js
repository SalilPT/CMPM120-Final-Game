class TextBoxes extends Phaser.Scene {
    constructor() {
        super("textBoxesScene");
    }
    init(data){
        // assign to empty arrays if nothing was given for each, this prevents errors for parsing undefined varibles later in the code
        this.textChain = data.textChain == null ? [] : data.textChain;
        this.scenesToPauseAtStart = data.scenesToPauseAtStart == null ? [] : data.scenesToPauseAtStart;
        this.scenesToStopAtStart = data.scenesToStopAtStart == null ? [] : data.scenesToStopAtStart;
        this.scenesToPauseAtEnd = data.scenesToPauseAtEnd == null ? [] : data.scenesToPauseAtEnd;
        this.scenesToStopAtEnd = data.scenesToStopAtEnd == null ? [] : data.scenesToStopAtEnd;
        this.scenesToLaunchAtEnd = data.scenesToLaunchAtEnd == null ? [] : data.scenesToLaunchAtEnd;
        this.scenesToStartAtEnd = data.scenesToStartAtEnd == null ? [] : data.scenesToStartAtEnd;
        this.scenesToResumeAtEnd = data.scenesToResumeAtEnd ==  null ? [] : data.scenesToResumeAtEnd;
    }
    preload(){
        this.load.json("text", "./assets/textData.json");
        this.load.image("textBox", "./assets/textBox.png");
    }
    create(){
        this.parsedText = this.cache.json.get("text"); // contains the parsed json file
        this.currentMessage = 0; // keeps track of which index of this.textChain is being displayed
        this.nextMessage = 1; // keeps track of which index of this.textChain will be displayed next
        this.scene.bringToTop();
        // text configuration
        this.messageConfig = {
            fontFamily: "bulletFont",
            fontSize: "60px",
            color: "#F7F6F3",
            stroke: "#160F29",
            strokeThickness: 4
        }
        this.exitTextConfig = {fontFamily: "bulletFont",
        fontSize: "40px",
        color: "#F7F6F3",
        stroke: "#160F29",
        strokeThickness: 3};
        // create a small text box
        this.textBoxSprite = this.add.sprite(globalGameConfig.width/2, globalGameConfig.height/2, "textBox");
        this.textBoxSprite.setScale(0.05); // initially shrink the text box
        // tween to scale up the text box
        this.tweens.add({
            targets: this.textBoxSprite,
            duration: 100,
            scaleX: 0.90,
            scaleY: 0.90,
        });
        // pause the given scenes
        for (let pauseSceneName of this.scenesToPauseAtStart) {
            this.scene.pause(pauseSceneName);
        }
        for (let stopSceneName of this.scenesToStopAtStart) {
            this.scene.stop(stopSceneName);
        } 
        // stop the given scenes
        // Display the first message
        this.time.delayedCall(100, ()=>{
            this.displayMessage(this.parsedText[this.textChain[this.currentMessage]].message); // display the first message
        });
    }

    displayMessage(message){
        if (this.currentMessage < 1) { //if first time calling then created the text
            this.message = this.add.text(globalGameConfig.width/2, globalGameConfig.height/2, message, this.messageConfig).setOrigin(0.5);
        } else { //subsequent calls will update the message in the text box
            this.message.setText(this.parsedText[this.textChain[this.currentMessage]].message);
        }
        // update position on the text chain
        this.currentMessage++;
        this.nextMessage++;
        // wait to show the exit text
        this.time.delayedCall (1000, ()=> {
            // display message to let the player continue the text sequence
            this.displayContinueMessage();
            this.input.once("pointerdown" , () => {
                this.exitMessage.destroy();
                // if there is still more messages to display then call the function again
                if (this.currentMessage < this.textChain.length) {
                    this.displayMessage(this.parsedText[this.textChain[this.currentMessage]].message);
                // if no then start the exit/destroy sequence of this textbox scene
                } else {
                    this.sceneExitSequence();
                }
            });
        });
    }

    displayContinueMessage() { 
        this.exitMessage = this.add.text(this.textBoxSprite.x + this.textBoxSprite.displayWidth/2.3, this.textBoxSprite.y + this.textBoxSprite.displayHeight/3, "Click Mouse", this.exitTextConfig).setOrigin(1, 0.5);
        this.exitMessage.setAlpha(0.25);
        this.tweens.add({
            targets: this.exitMessage,
            duration: 1000,
            alpha: { from: 0.30, to: 0.70 },
            repeat: -1,
            yoyo: true
        });
    }

    sceneExitSequence(){
        // pause the given scenes
        for (let pauseSceneName of this.scenesToPauseAtEnd) {
            this.scene.pause(pauseSceneName);
        }
        // stop the given scenes
        for (let stopSceneName of this.scenesToStopAtEnd) {
            this.scene.stop(stopSceneName);
        }
        //resume the given scenes
        for (let resumeSceneName of this.scenesToResumeAtEnd) {
            this.scene.resume(resumeSceneName);
        }
        // launch the given scenes
        for (let launchSceneName of this.scenesToLaunchAtEnd) {
            this.scene.launch(launchSceneName);
        }
        //start the given scenes
        for (let startSceneName of this.scenesToStartAtEnd) {
            this.scene.start(startSceneName);
        }
        // zoom out tween for text box 
        this.message.destroy();
        this.tweens.add({
            targets: this.textBoxSprite,
            duration: 100,
            scaleX: 0.05,
            scaleY: 0.05,
        });
        // wait for tween to end
        this.time.delayedCall(100, ()=> {
            this.scene.stop();
        });
    }
}