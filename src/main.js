// Naming convention: camel case for normal variables, upper snake case for constants
// Line endings: LF

"use strict";

let globalGameConfig = {
    type: Phaser.WEBGL,
    width: 1600,
    height: 1024,
    backgroundColor: 0xCCCCCC,
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [Menu, WallsDemo, MovementAndAimingDemo, LevelGenDemo, PuzzleDemo]
}

let globalGame = new Phaser.Game(globalGameConfig);
