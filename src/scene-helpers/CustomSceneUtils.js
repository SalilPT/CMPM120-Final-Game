class CustomSceneUtils {
    constructor(parentScene) {
        this.parentScene = parentScene;
    }

    // Function to create timer to animate tileSprite Game Objects
    // Returns a reference to the newly added timer
    createTileSpriteAnimTimer(obj, numTotalAnimFrames, fps = 4) {
        obj.setData("currAnimFrame", 0);
        let newTimer = this.parentScene.time.addEvent(
            {
                delay: 1000 / fps,
                callback: () => {
                    obj.setData("currAnimFrame", (obj.getData("currAnimFrame") + 1) % numTotalAnimFrames);
                    obj.setFrame(obj.getData("currAnimFrame"));
                },
                loop: true
            }
        );
        return newTimer;
    }
}