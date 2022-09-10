class GameStartLoading extends Phaser.Scene {
    constructor() {
        super("gameStartLoadingScene");
    }

    preload() {
        /*
        Loading Atlases
        */
        // Load game atlas
        this.load.atlas("gameAtlas", "./assets/gameAtlas v2.png", "./assets/gameAtlas v2.json");

        // Load atlas for tilemap textures
        this.load.atlas("gameTilesetAtlas", "./assets/gameTilesetAtlas.png", "./assets/gameTilesetAtlas.json");

        /*
        Loading Tilemaps
        */
        // Testing tilemap TODO: remove this
        this.load.tilemapTiledJSON("testTilemap3", "./assets/Template Level Example 3.json");        

        // Load tutorial tilemap
        this.load.tilemapTiledJSON("tutorialMap", "./assets/Tutorial Map v2.json");

        // Load the rest of the levels
        this.registry.set("levels", {
            easy: [],
            medium: [],
            hard: []
        });
        
        const NUM_EASY_LEVELS = 4;
        const NUM_MEDIUM_LEVELS = 3;
        const NUM_HARD_LEVELS = 3;

        // Note: A simple try {...} catch {...} doesn't catch HTTP 404 responses.
        // Load easy levels
        for (let i = 1; i <= NUM_EASY_LEVELS; i++) {
            this.load.tilemapTiledJSON(`easy${i}`, `./assets/levels/easy/easy${i}.json`);
            this.registry.values.levels.easy.push(`easy${i}`);
        }
        
        // Load medium levels
        for (let i = 1; i <= NUM_MEDIUM_LEVELS; i++) {
            this.load.tilemapTiledJSON(`medium${i}`, `./assets/levels/medium/medium${i}.json`);
            this.registry.values.levels.medium.push(`medium${i}`);
        }

        // Load hard levels
        for (let i = 1; i <= NUM_HARD_LEVELS; i++) {
            this.load.tilemapTiledJSON(`hard${i}`, `./assets/levels/hard/hard${i}.json`);
            this.registry.values.levels.hard.push(`hard${i}`);
        }

        /*
        Loading Audio
        */
        this.load.audio("backgroundMusic", "./assets/audio/finalGameMusic.mp3");
        this.load.audio("shooting_sfx", "./assets/audio/shooting_sfx.wav");

        this.load.audio("collectSFX", "./assets/audio/collect_sfx.wav");
        this.load.audio("enemyDeath", "./assets/audio/enemyDeath.wav");
        this.load.audio("enemyGetsHit", "./assets/audio/enemyGetsHit.wav");
        this.load.audio("jebDeath", "./assets/audio/jebDeath.wav");
        this.load.audio("jebHurt", "./assets/audio/jebHurt.wav");
        this.load.audio("jebShoot", "./assets/audio/jebShoot.wav");
        this.load.audio("menuBeat", "./assets/audio/menuBeat.mp3");
    }

    create() {
        /*
        Loading spritesheets from gameAtlas
        */
        // The addSpriteSheetFromAtlas method calls here need to be in create() or else they won't work as expected

        // Load title animation spritesheet
        this.textures.addSpriteSheetFromAtlas("jebTitleSpritesheet", {
            atlas: "gameAtlas",
            frame: "jebNameTitleAnim.png",
            frameWidth: 383.9,
            frameHeight: 256
        });

        // Load player character spritesheets
        this.textures.addSpriteSheetFromAtlas("jebBottomIdleSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Bottom Idle Spritesheet.png",
            frameWidth: 64
        });
        this.textures.addSpriteSheetFromAtlas("jebBottomMovingSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Bottom Moving Spritesheet.png",
            frameWidth: 64
        });
        this.textures.addSpriteSheetFromAtlas("jebRingsSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Rings Spritesheet.png",
            frameWidth: 64
        });
        this.textures.addSpriteSheetFromAtlas("jebTopAttackingSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Top Attcking Spritesheet.png",
            frameWidth: 64
        });
        this.textures.addSpriteSheetFromAtlas("jebTopChargingSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Top Charging Spritesheet.png",
            frameWidth: 64
        });
        this.textures.addSpriteSheetFromAtlas("jebTopDeathSpritesheet", {
            atlas: "gameAtlas",
            frame: "Jeb Top Death Spritesheet.png",
            frameWidth: 64,
        });

        // Load enemy spritesheets
        this.textures.addSpriteSheetFromAtlas("enemyIdleAnimSpritesheet", {
            atlas: "gameAtlas",
            frame: "Enemy 1 Idle Spritesheet.png",
            frameWidth: 64,
        });
        this.textures.addSpriteSheetFromAtlas("enemyDeathAnimSpritesheet", {
            atlas: "gameAtlas",
            frame: "Enemy 1 Death Spritesheet.png",
            frameWidth: 64,
        });

        // Load Puzzle-Related Graphics
        // Puzzle piece numbers range from 1 to 9 (inclusive)
        for (let i = 1; i <= 9; i++) {
            this.textures.addSpriteSheetFromAtlas(`piece${i}Spritesheet`, {
                atlas: "gameAtlas",
                frame: `Circuit Boards Spritesheet ${i}.png`, // The value of filename in the atlas's JSON data corresponding to the current spritesheet
                frameWidth: 64
            });
        }
        for (let i = 1; i <= 9; i++) {
            this.textures.addSpriteSheetFromAtlas(`piece${i}PlacedSpritesheet`, {
                atlas: "gameAtlas",
                frame: `Circuit Boards Spritesheet placed ${i}.png`, // The value of filename in the atlas's JSON data corresponding to the current spritesheet
                frameWidth: 64
            });
        }
        this.scene.start("menuScene");
    }
}