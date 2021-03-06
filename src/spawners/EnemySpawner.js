/* @flow */

var Spawner = require('./Spawner');
var math = require('../lib/math');

class EnemySpawner extends Spawner {
  spawnNext() {
  }

  getSpawnDelay(): number {
    // The difficulty curve is defined by a few points:
    // 1. The starting spawn delay
    // 2. The final spawn delay
    // 3. The time it takes to drop from the starting delay to the final delay

    var elapsed = this.totalTimer.elapsed();
    var amntToDrop = this.game.config.initialSpawnDelay - this.game.config.minSpawnDelay;
    var amntDropped = elapsed * (amntToDrop / this.game.config.timeToFinalSpawnDelayMs);
    var delay = this.game.config.initialSpawnDelay - amntDropped;

    delay = math.max(delay, this.game.config.minSpawnDelay);

    return delay;
  }
}

module.exports = EnemySpawner;
