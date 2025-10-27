class Fogata extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, scale = 2) {
    super(scene, x, y, "fogata");

    // === AÑADIR A LA ESCENA ===
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // === CONFIGURAR FÍSICAS ===
    this.body.setImmovable(true);
    this.body.setCollideWorldBounds(true);
    this.setDepth(1);
    this.setScale(scale);
    this.play("fogata_anim");

    // === LUZ SUAVE  ===
    this.luz = scene.add.circle(x, y, 60 * scale, 0xffcc55, 0.25).setDepth(0);

    // Efecto de parpadeo de la luz
    scene.tweens.add({
      targets: this.luz,
      alpha: { from: 0.15, to: 0.35 },
      scale: { from: 0.9, to: 1.1 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // Efecto de parpadeo del sprite (pequeño “temblor” de fuego)
    scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const randomScale = scale + Math.random() * 0.05;
        this.setScale(randomScale);
      },
    });

    // Ajustar caja de colisión (base de la fogata)
    this.body.setSize(20 * scale, 10 * scale).setOffset(6 * scale, 20 * scale);
  }

  // === CARGA DE SPRITESHEET ===
  static preload(scene) {
    scene.load.spritesheet("fogata", "../assets/fogata.png", {
      frameWidth: 32, // ajusta si tu sprite tiene otro tamaño
      frameHeight: 32,
    });
  }

  // === CREAR ANIMACIÓN ===
  static createAnimation(scene) {
    if (scene.anims.exists("fogata_anim")) return;

    scene.anims.create({
      key: "fogata_anim",
      frames: scene.anims.generateFrameNumbers("fogata", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  // === ACTUALIZAR POSICIÓN DE LA LUZ ===
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.luz) {
      this.luz.x = this.x;
      this.luz.y = this.y + 10;
    }
  }

  // === DESTRUIR CORRECTAMENTE ===
  destroy(fromScene) {
    if (this.luz) this.luz.destroy();
    super.destroy(fromScene);
  }
}
