class BulletPattern {
    /**
     * @param {Phaser.Scene} scene - the scene this bullet pattern belongs to
     * @param {BulletManager} bulletManager - the bullet manager that this bullet pattern belongs to
     * @param {String} patternKey - the key for the bullet pattern
     * @param {Object} patternConfig - object containing parameters for the bullet pattern specified by patternKey
    */
    constructor(bulletManager, patternKey, patternConfig) {

        /*
        Constants
        */
        // A mapping of pattern keys to the corresponding function that executes the pattern
        // This allows for arbitrary (and potentially insane) patterns and easy addition/removal of them.
        this.PATTERNS = {
            "shootAtTarget": this.#shootAtTarget,
        }

        /**
         * PATTERN CONFIGURATION PROPERTIES EXPLANATION
         * 
         * @property {String | Array.<String>} bulletType - a string or array of strings representing what bullet type(s) to use in the pattern.
         * The bullet type's predefined properties will be applied to a copy of the pattern's config object.
         * @property {Number | Array.<Number>} bulletScale - Used a parameter to setScale() on every bullet if only one bullet type was specified. 
         * If multiple bullet types were specified, then this needs to be an array which holds the intended scale values for every bullet instance of the bullet type at the corresponding index in the bullet types array.
         * @property {Number | Array.<Number>} initTexAngleDeg - the initial angle in degrees of the texture of the bullet type. 
         * If this is an array, it holds the angle for each bullet type with the corresponding index in the bullet types array.
         * Note that Arcade physics doesn't allow for rotated rectangular bodies.
         * @property {String | Array.<String>} texture - A cache key for the texture to use for the bullet. Can also be an array of cache keys. Overrides the texture property of a bullet type.
         * @property {String | Number | Array.<String> | Array.<Number>} frame - the frame to use or an array of frames to use where each frame corresponds to the texture with the same index in the texture array.
         * Overrides the frame property of a bullet type.
        */

        // Default properties to be applied to bullets when not specfied in a pattern's config object
        this.BULLET_DEFAULTS = {
            bulletSpd: 100,
        }

        // Put predefined bullet type properties here
        // Intended for getting the texture, frame, properties relating to physics body, and initial angle of the texture relative to 0 degrees (right)
        // The body config holds info. about the intended body properties for the bullet type.
        /**
         * BODY CONFIG EXPLANATION
         * @property {Number} width - Used as a parameter to setSize() to set the width of the body in pixels. If left undefined, the bullet's texture is used for its body width.
         * @property {Number} height - Used as a parameter to setSize() to set the height of the body in pixels. If left undefined, the bullet's texture is used for its body height.
         * @property {Boolean} isRectangle - If this is true, then the body will be a rectangle. If false or undefined, the body will be a circle.
         * @property {Number} radius - The radius of the body if it's a circle. If not defined, it will be equal to half the width of the arcade sprite instead.
         */
        this.BULLET_TYPES = {
            "default": {
                texture: "enemySprite",
                frame: 0,
                bulletScale: 0.5,
                bodyConfig: {
                    isRectangle: true
                }
            },
            "orangeBullet": {
                texture: "orangeBullet",
                frame: 0,
                bulletScale: 3
            },
            "purpleBullet": {
                texture: "purpleBullet",
                frame: 0,
                bulletScale: 3,
                bodyConfig: {
                    radius: 2
                },
                initTexAngleDeg: -90
            },
            "yellowBullet": {
                texture: "yellowBullet",
                frame: 0,
                bulletScale: 3,
                bodyConfig: {
                    radius: 4
                },
                initTexAngleDeg: -90,
            }
        }

        /*
        */
       this.parentScene = bulletManager.scene;

        // Store a reference to the bullet manager this belongs to
        this.bltMgr = bulletManager;

        let patternToMake = this.PATTERNS[patternKey];
        if (patternToMake == undefined) {
            console.error("Invalid bullet pattern key!");
            return;
        }

        // Apply the properties of the bullet type to the config object
        const resolvedPatternConfig = this.#resolveBulletTypeProperties(patternConfig);
        // Immediately make the bullet pattern when this object is created
        patternToMake.call(this, resolvedPatternConfig);
    }

    /*
    Helper Methods for Bullet Patterns
    */
    // Returns the angle from a source game object to a target game object
    // Returns in degrees by default
    #angleFromSrcObjToTgtObj(srcObj, tgtObj, useDegrees = true) {
        let srcX = srcObj?.body.center.x ?? srcObj.getCenter().x;
        let srcY = srcObj?.body.center.y ?? srcObj.getCenter().y;
        let tgtX = tgtObj?.body.center.x ?? tgtObj.getCenter().x;
        let tgtY = tgtObj?.body.center.y ?? tgtObj.getCenter().y;

        let resultAngle = Phaser.Math.Angle.Between(srcX, srcY, tgtX, tgtY);

        if (useDegrees) {
            resultAngle = Phaser.Math.RadToDeg(resultAngle);
        }

        return resultAngle;
    }
    
    // Returns the angle from a source point to a target point
    // Returns in degrees by default
    #angleFromSrcPtToTgtPt(srcPt, tgtPt, useDegrees = true) {
        let resultAngle = Phaser.Math.Angle.BetweenPoints(srcPt, tgtPt);

        if (useDegrees) {
            resultAngle = Phaser.Math.RadToDeg(resultAngle);
        }

        return resultAngle;
    }

    // Resolves the bullet type's properties of this bullet pattern's config and returns a new config object with the bullet type's properties.
    #resolveBulletTypeProperties(config) {
        let bltType = config.bulletType ?? "default";

        // Only one bullet type
        if (typeof(bltType) === "string") {
            return Phaser.Utils.Objects.Merge(config, this.BULLET_TYPES[bltType]);
        }
        // Array of bullet types
        else if (Array.isArray(bltType)) {
            return Phaser.Utils.Objects.Clone(config);
        }
        else {
            throw new Error("Invalid bullet type field for bullet pattern!");
        }
    }

    // Attempts to take a pattern config and spawn a bullet using this pattern's bullet manager.
    // Only works for pattern configs with only 1 bullet type.
    // Might want to change this way of doing things in the future since this method feels redundant.
    #addBulletUsingPatternConfig(ptrnCfg) {
        let newBullet = this.bltMgr.addBullet(
            ptrnCfg.sourceObj?.body.center.x ?? ptrnCfg.sourcePt.x,
            ptrnCfg.sourceObj?.body.center.y ?? ptrnCfg.sourcePt.y,
            ptrnCfg.texture,
            ptrnCfg.frame,
            ptrnCfg.enemyBullet,
            ptrnCfg.bodyConfig,
            ptrnCfg.initTexAngleDeg,
            ptrnCfg.bulletScale
        );

        return newBullet;
    }

    /*
    Methods for Bullet Patterns
    */
    // Shoot a bullet from a source object to a target object or from a source point to a target point.
    // Return a reference to the bullet.
    // Possible config parameters: sourceObj, targetObj, sourcePt, targetPt, bulletSpd
    #shootAtTarget(config) {
        let sourceObj = config.sourceObj;
        let targetObj = config.targetObj;
        let sourcePt = config.sourcePt;
        let targetPt = config.targetPt;
        let bulletSpd = config.bulletSpd ?? this.BULLET_DEFAULTS.bulletSpd;

        let fireAngle;
        // Use source and target object for calculations
        if (sourceObj && targetObj) {
            fireAngle = this.#angleFromSrcObjToTgtObj(sourceObj, targetObj);
        }
        else if (config.sourcePt && config.targetPt) {
            fireAngle = this.#angleFromSrcPtToTgtPt(sourcePt, targetPt);
        }
        let fireVector = this.parentScene.physics.velocityFromAngle(fireAngle, bulletSpd);
        let newBullet = this.#addBulletUsingPatternConfig(config);
        newBullet.body.setVelocity(fireVector.x, fireVector.y);
        // Set the angle of the new bullet
        newBullet.angle += fireAngle;
        return newBullet;
    };
}