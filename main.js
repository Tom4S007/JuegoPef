const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true, 
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MenuScene,RefugioScene]
};

const game = new Phaser.Game(config);
