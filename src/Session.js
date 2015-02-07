/* @flow */

var Game = require('./Game');
var World = require('./entities/World');
var EnemySpawner = require('./spawners/EnemySpawner');

class Session {
  game: Game;
  currentWorld: World;
  enemySpawner: EnemySpawner;

  currentPoints: number;

  constructor(game: Game) {
    this.game = game;
    this.currentPoints = 0;
  }

  addPoints(points: number) {
    this.currentPoints += points;
  }

  start() {
    this.enterLevel();
  }

  died() {
    this.game.setTimeout(() => {
      this.game.gameOver();
    }, 2000);
  }

  enterLevel() {
    this.currentWorld = this.game.createEntity(World, {});
    this.enemySpawner = new EnemySpawner(this.game);
  }
}

module.exports = Session;
