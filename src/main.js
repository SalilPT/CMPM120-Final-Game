// Naming convention: camel case for normal variables, upper snake case for constants made in constructors or create() methods
// Line endings: LF

"use strict";

let globalGameConfig = {
    type: Phaser.WEBGL,
    width: 1600,
    height: 1024,
    backgroundColor: 0xAAAAAA,
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scale: {mode: Phaser.Scale.FIT},
    scene: [Menu, Credits, Settings, Tutorial, TextBoxes, MovementAndAimingDemo, LevelGenDemo, PuzzleDemo, BulletsDemo]
}

let globalGame = new Phaser.Game(globalGameConfig);
