class CustomSceneUtils {
    constructor(parentScene) {
        this.parentScene = parentScene;
    }

    // Return the x and y of the player spawner as defined in Tiled
    static getPlayerCharacterCoordsFromObjectLayer(tilemap, layerName, tilesetName) {
        let objLayer = tilemap.getObjectLayer(layerName);
        let tileset = tilemap.getTileset(tilesetName);
        for (const tiledObj of objLayer.objects) {
            let propsObj = tileset.getTileProperties(tiledObj.gid);
            if (propsObj["spawnerType"] == "player") {
                return new Phaser.Geom.Point(tiledObj.x + tiledObj.width/2, tiledObj.y - tileset.tileHeight + tiledObj.height/2); // Subtract tileHeight here because of Tiled's origin convention of (0, 1)
            }
        }
    }
}