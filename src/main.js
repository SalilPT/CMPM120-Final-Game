// Naming convention: camel case for normal variables, upper snake case for constants made in constructors or create() methods
// Line endings: LF

"use strict";

let globalGameConfig = {
    type: Phaser.WEBGL,
    width: 1600,
    height: 900,
    backgroundColor: 0x646E78,
    disableContextMenu: true,
    physics: {
        default: "arcade",
    },
    scale: {
        width: 1600,
        height: 900,
        mode: Phaser.Scale.FIT
    },
    scene: [GameStartLoading, Menu, Play, Credits, Settings, Tutorial, TextBoxes]
};

let globalGame = new Phaser.Game(globalGameConfig);