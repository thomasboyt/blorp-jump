/* @flow */

var _ = require('lodash');
var Maths = require('coquette').Collider.Maths;
var Timer = require('../lib/Timer');

var Entity = require('./Entity');
var Spikes = require('./tiles/Spikes');

var Blorp = require('./enemies/Blorp');
var Blat = require('./enemies/Blat');
var Bullet = require('./Bullet');

var SpriteSheet = require('../lib/SpriteSheet');
var AnimationManager = require('../lib/AnimationManager');
var PlatformerPhysicsEntity = require('./PlatformerPhysicsEntity');

var WALK_STATE = 'walk';
var DEAD_STATE = 'dead';

class Player extends PlatformerPhysicsEntity {
  img: Image;
  anim: AnimationManager;
  shotThrottleTimer: Timer;

  facingLeft: boolean;

  state: string;

  init(settings: any) {
    this.center = settings.center;
    this.size = {x: 11, y: 20};

    this.vec = {x: 0, y: 0};
    this.zindex = this.game.config.zIndexes.player;

    this.state = WALK_STATE;

    this.facingLeft = false;

    this.shotThrottleTimer = new Timer(this.game.config.fireThrottleMs);
    var sheet = new SpriteSheet(this.game.assets.images.playerSheet, this.game.tileWidth, this.game.tileHeight);

    this.anim = new AnimationManager('stand', {
      stand: {
        sheet: sheet,
        frames: [0],
        frameLengthMs: null
      },

      walk: {
        sheet: sheet,
        frames: [1, 0],
        frameLengthMs: this.game.config.playerWalkAnimMs
      },

      dead: {
        sheet: sheet,
        frames: [null, 2],
        frameLengthMs: 200
      }
    });
  }

  getFootBox(): any  { // BoundingBox, see lib/math.js
    return {
      center: {
        x: this.center.x,
        y: this.center.y + 8
      },
      size: {
        x: this.size.x,
        y: 4
      }
    };
  }

  jump() {
    this.vec.y = -this.game.config.jumpSpeed;
    this.currentElevator = null;
  }

  _shoot() {
    if (this.shotThrottleTimer.expired()) {
      this.shotThrottleTimer.reset();

      var direction = this.facingLeft ? 'left' : 'right';

      if (this.game.c.inputter.isDown(this.game.c.inputter.UP_ARROW)) {
        direction = 'up';
      }

      this.game.createEntity(Bullet, {
        creator: this,
        direction: direction,
        speed: 15
      });
    }
  }

  update(dt: number) {
    if (this.state === WALK_STATE) {
      this._updateWalking(dt);
    } else if (this.state === DEAD_STATE) {
      this._updateDead(dt);
    }

    this.anim.update(dt);
  }

  _updateWalking(dt: number) {
    this.shotThrottleTimer.update(dt);

    var step = dt/100;

    if (this.vec.y !== 0 && !this.currentElevator) {
      this.grounded = false;
    }

    if (this.center.y + this.size.y / 2 > this.game.session.currentWorld.height) {
      this._enterDead();
    }

    // Zero out x velocity, since it doesn't have any form of (de)acceleration
    this.vec.x = 0;

    if (this.game.c.inputter.isPressed(this.game.c.inputter.Z)) {
      if (this.grounded) {
        this.jump();
      }
    }

    if (this.game.c.inputter.isPressed(this.game.c.inputter.X)) {
      this._shoot();
    }

    // Handle left/right movement
    var spd = this.game.config.playerSpeed ;

    if (this.game.c.inputter.isDown(this.game.c.inputter.LEFT_ARROW)) {
      this.vec.x = -spd;
      this.facingLeft = true;
    } else if (this.game.c.inputter.isDown(this.game.c.inputter.RIGHT_ARROW)) {
      this.vec.x = spd;
      this.facingLeft = false;
    }

    this.vec.y += this.game.config.gravityAccel;

    this.center.x += this.vec.x * step;
    this.center.y += this.vec.y * step;

    if (this.vec.x && this.grounded) {
      this.anim.set('walk');
    } else {
      this.anim.set('stand');
    }
  }

  _updateDead(dt: number) {
    this.anim.set('dead');
  }

  _enterDead() {
    this.state = DEAD_STATE;
    this.vec.x = 0;
    this.vec.y = 0;
    this.game.session.died();
  }

  draw(ctx: any) {
    var sprite = this.anim.getSprite();

    var destX = this.center.x - sprite.width / 2;
    var destY = this.center.y - sprite.height / 2;

    if (this.facingLeft) {
      ctx.scale(-1, 1);
      destX = (destX * -1) - sprite.width;
    }

    sprite.draw(ctx, destX, destY);
  }

  collision(other: Entity) {
    if (this.state === WALK_STATE) {
      this.handlePlatformerCollision(other);
    }

    if (other instanceof Blorp || other instanceof Spikes || other instanceof Blat) {
      if (this.game.godMode) {
        return;
      }

      if (this.state !== DEAD_STATE) {
        this._enterDead();
      }
    }
  }
}

module.exports = Player;
