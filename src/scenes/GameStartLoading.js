class GameStartLoading extends Phaser.Scene {
    constructor() {
        super("gameStartLoadingScene");
    }

    preload() {
        // Preload player character images and spritesheets
        this.load.spritesheet("jebBottomIdle", "./assets/Jeb Bottom Idle Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebBottomMoving", "./assets/Jeb Bottom Moving Spritesheet.png", {frameWidth: 64});
        this.load.image("jebRingOff", "./assets/Jeb Ring Off.png");
        this.load.spritesheet("jebRings", "./assets/Jeb Rings Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopAttacking", "./assets/Jeb Top Attcking Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopCharging", "./assets/Jeb Top Charging Spritesheet.png", {frameWidth: 64});
        this.load.spritesheet("jebTopDeath", "./assets/Jeb Top Death Spritesheet.png", {frameWidth: 64});
        this.load.image("jebTopStart", "./assets/Jeb Top Start.png");

        // Load Puzzle-Related Graphics
        this.load.image("hole1Sprite", "./assets/Circuit Boards Slot 1.png");
        this.load.image("hole2Sprite", "./assets/Circuit Boards Slot 2.png");
        this.load.image("hole3Sprite", "./assets/Circuit Boards Slot 3.png");
        this.load.image("hole4Sprite", "./assets/Circuit Boards Slot 4.png");
        this.load.image("hole5Sprite", "./assets/Circuit Boards Slot 5.png");
        this.load.image("hole6Sprite", "./assets/Circuit Boards Slot 6.png");

        // Testing tilemap
        this.load.tilemapTiledJSON("testTilemap2", "./assets/Template Level Example 2.json");
        this.load.atlas("gameAtlas", "./assets/gameAtlas.png", "./assets/gameAtlas.json");

        // Preload bullets
        this.load.image("orangeBullet", "./assets/orangeBullet.png");
        this.load.image("purpleBullet", "./assets/purpleBullet.png");
        this.load.image("yellowBullet", "./assets/yellowBullet.png");

        // Preload health icon
        this.load.image("lifeSymbol", "./assets/Life Symbol.png");

        // Load All Audio
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
        this.scene.start("menuScene");
    }
}