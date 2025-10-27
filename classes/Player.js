class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");

    // Añadir a escena y activar físicas
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2);

    this.speed = 150;
    this.setCollideWorldBounds(true);

    this.staminaMaxima = 100;
    this.stamina = this.staminaMaxima;
    this.ultimaActualizacionStamina = 0;
    this.regeneracionStamina = 0.5; // por segundo

    // Controles
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  static preload(scene) {
    scene.load.spritesheet("player", "../assets/player.png", {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  createAnimations(scene) {
    scene.anims.create({
      key: "walk-down",
      frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: "walk-left",
      frames: scene.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: "walk-right",
      frames: scene.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: "walk-up",
      frames: scene.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
  }

  // 🔥 NUEVO: Consumir stamina por acciones
  consumirStamina(cantidad) {
    this.stamina = Phaser.Math.Clamp(this.stamina - cantidad, 0, this.staminaMaxima);
    return this.stamina > 0;
  }

  // 🔥 NUEVO: Regenerar stamina con el tiempo
  actualizarStamina(time) {
    if (time - this.ultimaActualizacionStamina > 1000) { // Cada segundo
      if (this.stamina < this.staminaMaxima) {
        this.stamina = Phaser.Math.Clamp(
          this.stamina + this.regeneracionStamina, 
          0, 
          this.staminaMaxima
        );
      }
      this.ultimaActualizacionStamina = time;
    }
  }

  // 🔥 NUEVO: Obtener multiplicador de consumo por stamina baja
  getMultiplicadorConsumo() {
    if (this.stamina >= 45) {
      return 1.0; // Consumo normal (100%)
    } else if (this.stamina >= 25) {
      return 1.75; // 75% extra
    } else if (this.stamina >= 1) {
      return 2.25; // 125% extra
    } else {
      return 0; // No permite más exámenes
    }
  }

  // 🔥 NUEVO: Verificar si puede realizar examen
  puedeRealizarExamen() {
    return this.stamina >= 25; // Necesita al menos 25% de stamina
  }

  update() {
    const { left, right, up, down } = this.cursors;
    const speed = this.speed;

    this.setVelocity(0);

    if (left.isDown) {
      this.setVelocityX(-speed);
      this.anims.play("walk-left", true);
    } else if (right.isDown) {
      this.setVelocityX(speed);
      this.anims.play("walk-right", true);
    } else if (up.isDown) {
      this.setVelocityY(-speed);
      this.anims.play("walk-up", true);
    } else if (down.isDown) {
      this.setVelocityY(speed);
      this.anims.play("walk-down", true);
    } else {
      this.anims.stop();
    }
  }
}
