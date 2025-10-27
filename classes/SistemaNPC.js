class SistemaNPC {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];
    this.npcsPorDia = 0;
    this.npcsSpawned = 0;
    this.timers = [];
    this.activo = false;
  }

  iniciarDia() {
    this.npcsPorDia = Phaser.Math.Between(1, 4);
    this.npcsSpawned = 0;
    this.npcs = [];
    
    console.log(`Hoy llegarán ${this.npcsPorDia} NPCs`);
    
    this.activo = true;
    this.programarSpawn();
  }

  programarSpawn() {
    if (this.npcsSpawned >= this.npcsPorDia || !this.activo) return;
    
    const tiempoSpawn = Phaser.Math.Between(10000, 20000); // 10-20 seg para testing
    
    const timer = this.scene.time.delayedCall(tiempoSpawn, () => {
      this.spawnNPC();
    });
    
    this.timers.push(timer);
  }

  spawnNPC() {
    if (!this.activo) return;
    
    const spawnX = 2400;
    const spawnY = 100;
    
    const color = this.generarColorUnico();
    const esAlien = Math.random() < 0.3;
    
    const npc = new NPC(this.scene, spawnX, spawnY, color, esAlien);
    this.npcs.push(npc);
    this.npcsSpawned++;
    
    this.mostrarAnuncioLlegada();
    
    if (this.npcsSpawned < this.npcsPorDia) {
      this.programarSpawn();
    }
  }

  mostrarAnuncioLlegada() {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;
    
    const anuncio = this.scene.add.text(centerX, 50, "¡Ha llegado un superviviente!", {
      fontSize: '18px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: anuncio,
      y: 80,
      alpha: 0,
      duration: 4000,
      onComplete: () => anuncio.destroy()
    });
  }

  generarColorUnico() {
    const colores = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
    return Phaser.Utils.Array.GetRandom(colores);
  }

  obtenerPuntosCaminoCampamento() {
    return [
      { x: 2000, y: 300 },
      { x: 1600, y: 600 },  
      { x: 1200, y: 900 },
      { x: 800, y: 1200 },
      { x: 400, y: 1500 }
    ];
  }

  npcAceptado(npc, tipo) {
    console.log(`NPC aceptado con respuesta ${tipo}. ¿Es alien?: ${npc.esAlien}`);
    
    // 🔥 CORREGIDO: Solo verificar si el contador ya fue incrementado para ESTE NPC
    if (npc.contadorIncrementado) {
      console.log("⚠️ Contador ya fue incrementado para este NPC");
      return;
    }
    
    // 🔥 INCREMENTAR CONTADOR
    this.scene.supervivientes++;
    this.scene.actualizarHUD();
    npc.contadorIncrementado = true; // 🔥 Marcar como incrementado
    
    // Mostrar mensaje según tipo
    switch(tipo) {
      case 'amistosa':
        this.scene.mostrarMensaje("+1 Superviviente (Amistoso)", 0x00ff00);
        break;
      case 'neutral':
        this.scene.mostrarMensaje("+1 Superviviente (Neutral)", 0xffff00);
        break;
    }
    
    console.log(`✅ Contador incrementado. Supervivientes totales: ${this.scene.supervivientes}`);
  }

  // 🔥 NUEVO: Manejar NPCs rechazados
  npcRechazado(npc) {
    console.log(`NPC rechazado. ¿Era alien?: ${npc.esAlien}`);
    // 🔥 NO aumentar el contador de supervivientes
    this.scene.mostrarMensaje("Superviviente se fue", 0xff6666);
  }

  // 🔥 NUEVO: Remover NPC de la lista cuando es destruido
  npcDestruido(npc) {
    const index = this.npcs.indexOf(npc);
    if (index > -1) {
      this.npcs.splice(index, 1);
    }
  }

  limpiar() {
    this.activo = false;
    
    this.timers.forEach(timer => {
      if (timer) timer.destroy();
    });
    this.timers = [];
    
    this.npcs.forEach(npc => {
      if (npc) npc.destroy();
    });
    this.npcs = [];
  }

  update() {
    this.npcs.forEach(npc => {
      if (npc && npc.update) npc.update();
    });
  }
}