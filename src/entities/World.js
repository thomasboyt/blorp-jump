/* @flow */

var _ = require('lodash');
var Entity = require('./Entity');
var Player = require('./Player');
var Bullet = require('./Bullet');
var Block = require('./tiles/Block');
var Platform = require('./tiles/Platform');
var math = require('../lib/math');

type Coordinates = {x: number; y: number};

// Get the indicies of every item in array for which cb(item) returns true
function filterIndex(array: Array<any>, cb: (item: any) => boolean): Array<number> {
  var res = [];
  for (var i = 0; i < array.length; i++) {
    if (cb(array[i]) === true) {
      res.push(i);
    }
  }
  return res;
}

class World extends Entity {
  width: number;
  height: number;
  objects: Array<Entity>;

  currentScrollY: number;

  pickupSafeTileLocations: Array<Coordinates>;

  _pfGrid: any;  // TODO: a Grid declaration would be nice
  _lastPtx: number;
  _lastPty: number;

  init(settings: any) {
    this.widthInTiles = this.game.width / this.game.tileWidth;
    this.heightInTiles = this.game.height / this.game.tileHeight;
    this.objects = [];

    this._createInitialPlatforms();
    this._createPlayer();

    this.currentScrollY = 0;
    this.lastSpawnY = -this.game.tileHeight;
    this.spawnGap = 3 * this.game.tileHeight;
  }

  destroy() {
    this.game.c.entities.destroy(this);

    this.objects.forEach((obj) => {
      this.game.c.entities.destroy(obj);
    });
  }

  _createPlayer() {
    var player = this.game.createEntity(Player, {
      center: {
        x: this.game.width / 2,
        y: this.game.height - 100
      }
    });

    this.objects.push(player);
  }

  _createInitialPlatforms() {
    // Let's make some boxes!
    var starting = this.heightInTiles - 3;
    var gap = 3;

    this._createBlockRectangle({x: 0, y: starting, w: this.widthInTiles, h: 1});

    this._createBlockRectangle({x: 0, y: starting - gap, w: 4, h: 1});
    this._createBlockRectangle({x: 8, y: starting - gap, w: 4, h: 1});

    this._createBlockRectangle({x: 3, y: starting - gap*2, w: 6, h: 1});

    this._createBlockRectangle({x: 0, y: starting - gap*3, w: 4, h: 1});
    this._createBlockRectangle({x: 8, y: starting - gap*3, w: 4, h: 1});

    this._lastSections = [{
      x: 0,
      w: 4
    }, {
      x: 8,
      w: 4
    }];
  }

  _createBlockRectangle(settings: any) {
    var {x, y, w, h} = settings;

    for (var i = 0; i < w; i++) {
      for (var j = 0; j < h; j++) {
        // TODO: This will break if regions are created adjacent to each other...
        var isEdgeCollidable = {
          top: j === 0,
          bottom: j === h - 1,
          left: i === 0,
          right: i === w - 1
        };

        var block = this.game.createEntity(Block, {
          tileX: x + i,
          tileY: y + j,
          layerNum: 0,
          isEdgeCollidable: isEdgeCollidable
        });

        this.objects.push(block);
      }
    }
  }

  _spawnNext(tries) {
    tries = tries || 0;

    if (tries > 20) {
      throw new Error('Could not create a reachable row after 20 tries!');
    }

    var types = {HOLE: 0, LEFT_EDGE: 1, RIGHT_EDGE: 2, CENTER: 3};

    var type = math.randInt(0, 3);

    var sections;

    if (type === types.HOLE) {
      // Get hole width
      var hWidth = math.randInt(1, 4) * 2;
      // Get center of hole
      var hCenter = math.randInt(hWidth, 12 - hWidth);

      // Generate two platforms, one on each side of center
      var x1 = 0;
      var w1 = hCenter - hWidth / 2;
      var x2 = hCenter + hWidth / 2;
      var w2 = 12 - x2;

      sections = [{x: x1, w: w1}, {x: x2, w: w2}];

    } else if (type === types.LEFT_EDGE) {
      var w = math.randInt(2, 10);
      sections = [{
        x: 0,
        w: w
      }];

    } else if (type === types.RIGHT_EDGE) {
      var w = math.randInt(2, 10);
      sections = [{
        x: this.widthInTiles - w,
        w: w
      }];

    } else if (type === types.CENTER) {
      var w = math.randInt(1, 5) * 2;
      sections = [{
        x: this.widthInTiles / 2 - w/2,
        w: w
      }];
    }

    if (!this._canReachNext(sections)) {
      this._spawnNext(tries++);
      return;
    }

    sections.forEach((section) => {
      this._createBlockRectangle({x: section.x, w: section.w, y: -1, h: 1});
    });

    this._lastSections = sections;
  }

  _canReachNext(sections) {
    var lastSections = this._lastSections;

    return _.every(sections, (section) => {
      if (section.x > 0) {

        // Test to see if there's a platform below on the left side within 2 tiles
        var reachableOnLeft = _.some(lastSections, (belowSection) => {
          var lEdgeBelow = belowSection.x;
          var rEdgeBelow = belowSection.x + belowSection.w;

          if (lEdgeBelow < section.x && rEdgeBelow > section.x - 2) {
            return true;
          }
        });

        if (reachableOnLeft) {
          return true;
        }
      }

      if (section.x + section.w < this.widthInTiles) {
        // Test to see if there's a platform below on the right side within 2 tiles
        var reachableOnRight = _.some(lastSections, (belowSection) => {
          var lEdgeBelow = belowSection.x;
          var rEdgeBelow = belowSection.x + belowSection.w;

          if (rEdgeBelow > section.x + section.w && lEdgeBelow < section.x + section.w + 2) {
            return true;
          }
        });

        if (reachableOnRight) {
          return true;
        }
      }

      return false;
    });
  }

  _moveAllOfTypes(types) {
    types.forEach((Type) => {
      this.game.c.entities.all(Type, (obj) => {
        obj.center.y += step;
      });
    });
  }

  update(dt: number) {
    var step = dt/100 * 3;
    this.currentScrollY += step;

    this.objects.forEach((obj, idx) => {
      obj.center.y += step;
    });

    this._moveAllOfTypes([Bullet]);

    if (this.currentScrollY > this.lastSpawnY + this.spawnGap) {
      var spawnY = -1 * this.game.tileHeight;
      this._spawnNext();
      this.lastSpawnY = Math.floor(this.currentScrollY);
    }
  }

}

module.exports = World;
