class EnemyManager extends Phaser.GameObjects.GameObject {
    constructor(parentScene, config) {
        super(parentScene, "EnemyManager");

        this.parentScene = parentScene;
        this.playerChar = config.playerChar;

        /*
        Constants
        */
        this.TILEMAP_DATA_NAMES = {
            // This is the name of the tileset that holds the tiles to use for enemy spawners
            tilesetName: "gameAtlasTileset",
            // This is the key of the image that the tileset uses.
            // The image must already be in the Phaser cache for enemy spawner generation from a tilemap to work properly.
            tilesetImageKey: "gameAtlas",
            // This is the name of the object layer (in Tiled) with the enemy spawners that will be used
            objectLayerName: "spawnerLayer",
            // The key of the custom property in Tiled that's used to get a spawner object's type (either "enemy" or "player")
            keyOfSpawnerType: "spawnerType",
            // The key of the custom property in Tiled that's used to get a spawner's enemy types array
            // Going unused for now since there's only one enemy type
            keyOfEnemyTypes: "enemyTypes",
            // The key of the custom property in Tiled that's used to get a spawner's enemy spawning direction. 
            keyOfSpawnDirection: "spawnDirection"
        }

        this.DIRECTIONS_TO_VECTORS = {
            "up": Phaser.Math.Vector2.UP,
            "right": Phaser.Math.Vector2.RIGHT,
            "down": Phaser.Math.Vector2.DOWN,
            "left": Phaser.Math.Vector2.LEFT
        }
        
        this.GRID_SQUARE_LENGTH = 64;

        // The initial rotation angle of the enemy spawner graphic
        this.INIT_SPAWNER_ANGLE = 90;

        /*
        Properties
        */
        // Group of enemy spawners
        this.enemySpawners = this.parentScene.add.group({});

        // Group holding all enemies
        this.allEnemies = this.parentScene.add.group({});
        this.parentScene.physics.add.collider(this.playerChar, this.allEnemies, () => {});

    }

    createEnemySpawnersFromTilemap(tilemap) {
        let objLayer = tilemap.getObjectLayer(this.TILEMAP_DATA_NAMES.objectLayerName);
        // The tileset data will be used to get the custom properties of tiles
        let tileset = tilemap.addTilesetImage(this.TILEMAP_DATA_NAMES.tilesetName, this.TILEMAP_DATA_NAMES.tilesetImageKey);
        for (const tiledObj of objLayer.objects) {
            // Get the custom properties of the current object that are stored in the tileset
            // The properties will be returned as an object by the getTileProperties() method.
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj == null) {
                console.warn(`A spawner was found on the tilemap's object layer named "${this.TILEMAP_DATA_NAMES.objectLayerName}"
                that didn't have the correct custom properties set!`);
                continue;
            }

            // Anonymous function to automatically assign properties to puzzle pieces or holes
            // Based off Phaser 3 code found here: https://github.com/photonstorm/phaser/blob/v3.55.2/src/tilemaps/Tilemap.js#L634
            let assignProperties = (targetObj) => {
                targetObj.setPosition(tiledObj.x, tiledObj.y);
                // Account for Tiled's origin convention of (0, 1)
                targetObj.x += targetObj.originX * tiledObj.width;
                targetObj.y += (targetObj.originY - 1) * tiledObj.height;

                targetObj.setVisible(tiledObj.visible);
                let spawnDirectionAngles = {"up": -90, "right": 0, "left": 180, "down": 90};
                let spawnDirection = propsObj[this.TILEMAP_DATA_NAMES.keyOfSpawnDirection];
                let angleToOffsetBy = spawnDirectionAngles[spawnDirection];
                targetObj.setAngle(-this.INIT_SPAWNER_ANGLE + angleToOffsetBy);
                targetObj.spawnDirection = spawnDirection;
            }
            // Ignore anything on the object layer that isn't an enemy spawner
            if (propsObj[this.TILEMAP_DATA_NAMES.keyOfSpawnerType] != "enemy") {
                continue;
            }
            
            let newEnemySpawner = this.parentScene.add.sprite(undefined, undefined, "gameAtlas", "metal door 1.png");
            assignProperties(newEnemySpawner);
            this.enemySpawners.add(newEnemySpawner);
        }
    }

    getEnemiesGroup() {
        return this.allEnemies;
    }

    getEnemySpawnerGroup() {
        return this.enemySpawners;
    }

    spawnEnemyAtSpawner(spawner) {
        let newEnemy = new Enemy({
            scene: this.parentScene,
            x: spawner.getCenter().x,
            y: spawner.getCenter().y,
            texture: "gameAtlas",
            frame: "Enemy1IdleFrame1.png",
            playerChar: this.playerChar
        });
        this.allEnemies.add(newEnemy);
        let vecCopy = new Phaser.Math.Vector2(0, 0).copy(this.DIRECTIONS_TO_VECTORS[spawner.spawnDirection]);
        let displacementVec = vecCopy.scale(this.GRID_SQUARE_LENGTH);
        newEnemy.x += displacementVec.x;
        newEnemy.y += displacementVec.y;
        newEnemy.setImmovable(true);
    }
}