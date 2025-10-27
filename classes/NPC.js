class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, color, esAlien = false) {
    super(scene, x, y, null);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.esAlien = esAlien;
    this.aceptado = false;
    this.rechazado = false;
    this.enCamino = false;
    this.contadorIncrementado = false; // 🔥 PARA CONTROLAR DUPLICADOS
    this.puntosCamino = [];
    this.indiceCamino = 0;
    this.velocidad = 80;
    
    // Gráfico del NPC
    this.graphic = scene.add.rectangle(x, y, 20, 30, color);
    this.graphic.setDepth(2);
    
    this.setScale(1.5);
    this.setDepth(2);
    
    // Texto flotante
    this.texto = scene.add.text(x, y - 40, "?", {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setDepth(10);
    
    // Hacer interactuable
    this.setInteractive();
    this.on('pointerdown', () => {
      if (!this.aceptado && !this.rechazado && !this.enCamino) {
        this.interactuar();
      }
    });
  }

  interactuar() {
    if (this.aceptado || this.rechazado) return;
    
    // Pausar el juego momentáneamente para el diálogo
    this.scene.physics.pause();
    this.scene.player.setVelocity(0);
    
    this.mostrarDialogo();
  }

  mostrarDialogo() {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;
    const centerY = cam.scrollY + 300;
    
    // Crear cuadro de diálogo
    this.dialogoBg = this.scene.add.rectangle(centerX, centerY, 350, 200, 0x000000, 0.9)
      .setDepth(100);
    
    this.dialogoText = this.scene.add.text(centerX, centerY - 40, "Un superviviente te pide refugio.\n¿Qué decides?", {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(101);
    
    // Botones de respuesta
    this.crearBoton(centerY + 10, "🔵 Aceptar amablemente", 0x00ff00, () => this.aceptar('amistosa'));
    this.crearBoton(centerY + 50, "🟡 Aceptar con condiciones", 0xffff00, () => this.aceptar('neutral'));
    this.crearBoton(centerY + 90, "🔴 Rechazar", 0xff0000, () => this.rechazar());
  }

  crearBoton(y, texto, color, callback) {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;
    
    const btn = this.scene.add.rectangle(centerX, y, 200, 40, color)
      .setDepth(101)
      .setInteractive();
    
    const btnText = this.scene.add.text(centerX, y, texto, {
      fontSize: '14px',
      color: '#000000'
    }).setOrigin(0.5).setDepth(102);
    
    btn.on('pointerdown', () => {
      this.limpiarDialogo();
      this.scene.physics.resume();
      callback();
    });
    
    // Efecto hover
    btn.on('pointerover', () => {
      btn.setFillStyle(color, 0.8);
    });
    
    btn.on('pointerout', () => {
      btn.setFillStyle(color, 1);
    });
    
    if (!this.botones) this.botones = [];
    this.botones.push({ btn, btnText });
  }

  limpiarDialogo() {
    if (this.dialogoBg) this.dialogoBg.destroy();
    if (this.dialogoText) this.dialogoText.destroy();
    
    if (this.botones) {
      this.botones.forEach(boton => {
        boton.btn.destroy();
        boton.btnText.destroy();
      });
      this.botones = [];
    }
  }

  aceptar(tipo) {
    // 🔥 CORREGIDO: Solo verificar si ya fue aceptado, no si el contador fue incrementado
    if (this.aceptado) {
      console.log("⚠️ NPC ya fue aceptado anteriormente");
      return;
    }
    
    this.aceptado = true;
    this.texto.setText("✓");
    
    // Efecto visual según respuesta
    let color = 0x00ff00;
    if (tipo === 'neutral') color = 0xffff00;
    
    this.scene.tweens.add({
      targets: this.graphic,
      fillColor: { from: this.graphic.fillColor, to: color },
      duration: 500
    });
    
    // 🔥 NOTIFICAR PRIMERO AL SISTEMA PARA INCREMENTAR CONTADOR
    this.scene.npcAceptado(this, tipo);
    
    // 🔥 LUEGO iniciar camino al campamento
    this.iniciarCamino(this.scene.obtenerPuntosCaminoCampamento());
  }

  // 🔥 NUEVO: Método para rechazar NPC
  rechazar() {
    this.rechazado = true;
    this.texto.setText("✗");
    
    // Efecto visual de rechazo
    this.scene.tweens.add({
      targets: this.graphic,
      fillColor: { from: this.graphic.fillColor, to: 0xff0000 },
      duration: 500
    });
    
    // Mostrar mensaje de rechazo
    this.scene.mostrarMensaje("Superviviente rechazado", 0xff0000);
    
    // 🔥 Hacer que el NPC se vaya (camino de salida)
    this.iniciarCaminoSalida();
    
    this.scene.npcRechazado(this);
  }

  // 🔥 NUEVO: Camino para que los rechazados se vayan
  iniciarCaminoSalida() {
    const puntosSalida = [
      { x: this.x + 200, y: this.y - 100 },  // Se aleja hacia arriba-derecha
      { x: this.x + 400, y: this.y - 200 },  // Sigue alejándose
      { x: this.x + 600, y: this.y - 300 }   // Punto final (fuera de pantalla)
    ];
    
    this.puntosCamino = puntosSalida;
    this.indiceCamino = 0;
    this.enCamino = true;
    this.moverAlSiguientePuntoSalida();
  }

  moverAlSiguientePuntoSalida() {
    if (this.indiceCamino >= this.puntosCamino.length) {
      // 🔥 Cuando llega al final, destruir el NPC
      this.destroy();
      return;
    }

    const punto = this.puntosCamino[this.indiceCamino];
    this.scene.physics.moveToObject(this, punto, this.velocidad);
    
    this.scene.time.delayedCall(100, () => {
      const distancia = Phaser.Math.Distance.Between(this.x, this.y, punto.x, punto.y);
      const tiempo = (distancia / this.velocidad) * 1000;
      
      this.scene.time.delayedCall(tiempo, () => {
        this.indiceCamino++;
        this.moverAlSiguientePuntoSalida();
      });
    });
  }

  iniciarCamino(puntos) {
    this.puntosCamino = puntos;
    this.indiceCamino = 0;
    this.enCamino = true;
    this.moverAlSiguientePunto();
  }

  moverAlSiguientePunto() {
    if (this.indiceCamino >= this.puntosCamino.length) {
      this.enCamino = false;
      this.iniciarBucle();
      return;
    }

    const punto = this.puntosCamino[this.indiceCamino];
    this.scene.physics.moveToObject(this, punto, this.velocidad);
    
    this.scene.time.delayedCall(100, () => {
      const distancia = Phaser.Math.Distance.Between(this.x, this.y, punto.x, punto.y);
      const tiempo = (distancia / this.velocidad) * 1000;
      
      this.scene.time.delayedCall(tiempo, () => {
        this.indiceCamino++;
        this.moverAlSiguientePunto();
      });
    });
  }

  // En NPC.js - agregar este método si no existe
iniciarCaminoSalida() {
  const puntosSalida = [
    { x: this.x + 200, y: this.y - 100 },
    { x: this.x + 400, y: this.y - 200 },
    { x: this.x + 600, y: this.y - 300 }
  ];
  
  this.puntosCamino = puntosSalida;
  this.indiceCamino = 0;
  this.enCamino = true;
  this.moverAlSiguientePuntoSalida();
}

moverAlSiguientePuntoSalida() {
  if (this.indiceCamino >= this.puntosCamino.length) {
    // Cuando llega al final, destruir el NPC
    this.destroy();
    return;
  }

  const punto = this.puntosCamino[this.indiceCamino];
  this.scene.physics.moveToObject(this, punto, this.velocidad);
  
  this.scene.time.delayedCall(100, () => {
    const distancia = Phaser.Math.Distance.Between(this.x, this.y, punto.x, punto.y);
    const tiempo = (distancia / this.velocidad) * 1000;
    
    this.scene.time.delayedCall(tiempo, () => {
      this.indiceCamino++;
      this.moverAlSiguientePuntoSalida();
    });
  });
}

  iniciarBucle() {
    // Bucle simple alrededor de la posición final
    const puntosBucle = [
      { x: this.x + 100, y: this.y },
      { x: this.x, y: this.y + 100 },
      { x: this.x - 100, y: this.y },
      { x: this.x, y: this.y - 100 }
    ];
    
    this.puntosCamino = puntosBucle;
    this.indiceCamino = 0;
    this.moverAlSiguientePunto();
  }

  update() {
    // Actualizar posición del gráfico y texto
    if (this.graphic) {
      this.graphic.setPosition(this.x, this.y);
    }
    if (this.texto) {
      this.texto.setPosition(this.x, this.y - 40);
    }
  }

  destroy() {
    this.limpiarDialogo();
    if (this.graphic) this.graphic.destroy();
    if (this.texto) this.texto.destroy();
    
    // 🔥 NOTIFICAR AL SCENE QUE EL NPC FUE DESTRUIDO
    if (this.scene.npcDestruido) {
      this.scene.npcDestruido(this);
    }
    
    super.destroy();
  }
}