class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(params) {

        /*
        Constants
        */
        // A reference to the tilemap used by the scene this is in.
        this.PARENT_SCENE_TILEMAP = config.parentSceneTilemap;

        // The amount of time in milliseconds it takes for this enemy to walk into the room.
        // After it has entered the room, it will have collisions with the player character's bullets.
        this.SPAWN_IN_TIME = 1 * 1000;

    }
    
    /*
    Private Methods
    */
    // Returns true if an uninterrupted line can be formed from this object's center tothe center of the player character.
    // Gets all tiles within a rectangular bounding box that has the player character and this object.
    #canSeePlayerChar() {
       // getTilesWithin
    }
}