/* @flow */

var Entity = require('./Entity');

var palette = {
  lighter: '#CEE682',
  light: '#9FBB32',
  dark: '#426E2B',
  darker: '#193725'
};

class TitleScreen extends Entity {
  draw(ctx: any) {
    ctx.fillStyle = palette.darker;

    ctx.fillRect(0, 0, this.game.width, this.game.height);
    ctx.fillStyle = palette.lighter;

    ctx.textAlign = 'center';

    ctx.font = '40px "Press Start 2P"';
    ctx.fillText('BLORP', 125, 80);

    ctx.font = '16px "Press Start 2P"';
    ctx.fillText('jump', 120, 120);

    var offset = 150;

    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('arrows move', 120, offset);
    ctx.fillText('z jumps / x shoots', 120, offset + 20);
    ctx.fillText("press space to start", 120, offset + 40);
  }
}

module.exports = TitleScreen;
