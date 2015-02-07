/*
 * @flow
 * Displays the current UI for any given game state.
 */

var Entity = require('./Entity');

var palette = {
  lighter: '#CEE682',
  light: '#9FBB32',
  dark: '#426E2B',
  darker: '#193725'
};

class UI extends Entity {
  init(settings: any) {
    this.zindex = 999;
  }

  drawPlaying(ctx: any) {
    // TODO
  }


  drawGameOver(ctx: any) {
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = "center";

    ctx.fillText('game over', 200, 180);
    ctx.fillText('press space', 200, 200);
    ctx.fillText('to play again', 200, 220);
  }

  draw(ctx: any) {
    ctx.strokeStyle = palette.darker;
    ctx.fillStyle = palette.darker;

    var fsm = this.game.fsm;

    if (fsm.is('playing')) {
      this.drawPlaying(ctx);
    } else if (fsm.is('gameOver')) {
      this.drawGameOver(ctx);
    }

  }
}

module.exports = UI;
