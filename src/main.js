// Naming convention: camel case for normal variables, upper snake case for constants
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
    scene: [Menu, Tutorial, TextBoxes, MovementAndAimingDemo, LevelGenDemo, PuzzleDemo, BulletsDemo]
}

let globalGame = new Phaser.Game(globalGameConfig);
