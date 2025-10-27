class RefugioScene extends Phaser.Scene {
  constructor() {
    super({ key: "RefugioScene" });
  }

  preload() {
    this.load.image("mapa", "../assets/map.png");
    Player.preload(this);
    Fogata.preload(this);
  }

  init() {
    this.dia = 1;
    this.gasolina = 5;
    this.comida = 10;
    this.energia = 100;
    this.supervivientes = 3;
    this.avanzando = false;
    this.gasolinaMaxima = 30;
    
    // 🔥 MÁS LIMPIO: Usar clase Temporizador
    this.temporizador = new TemporizadorDia(this);
    this.sistemaNPC = new SistemaNPC(this);
    // 🔥 NUEVO: Sistema de examen alien
    this.sistemaExamen = new SistemaExamenAlien(this);
  }

  create() {
    // === MAPA ===
    const fondo = this.add.image(0, 0, "mapa").setOrigin(0, 0);
    const scale = 2;
    fondo.setScale(scale);
    const worldWidth = fondo.width * scale;
    const worldHeight = fondo.height * scale;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // === POSICIÓN DE SPAWN ===
    const spawnX = worldWidth / 2;
    const spawnY = 100;

    // === JUGADOR ===
    this.player = new Player(this, spawnX, spawnY);
    this.player.createAnimations(this);
    this.player.setCollideWorldBounds(true);

    // === CÁMARA ===
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    this.sistemaNPC.iniciarDia();

    this.events.on('nuevoDia', () => {
      this.sistemaNPC.limpiar();
      this.sistemaNPC.iniciarDia();
    });

    // === BOTÓN HTML ===
    const avanzarBtn = document.getElementById("avanzarBtn");
    avanzarBtn.addEventListener("click", () => this.avanzarDia(avanzarBtn));

    // === HUD INICIAL ===
    this.actualizarHUD();

    Fogata.createAnimation(this);

    // === FOGATA ===
    const fogataX = 2398;
    const fogataY = 1845;
    this.fogata = new Fogata(this, fogataX, fogataY);
    this.fogata.setScale(3);
    this.physics.add.collider(this.player, this.fogata);

    // 🔥 INICIAR TEMPORIZADOR
    this.temporizador.iniciar();
    
    // 🔥 ESCUCHAR EVENTOS DEL TEMPORIZADOR
    this.events.on('tiempoActualizado', this.actualizarBotonAvanzar, this);
    this.events.on('diaForzado', this.forzarAvanceDia, this);

    // 🔥 NUEVO: Tecla para examinar NPCs (tecla E)
    this.input.keyboard.on('keydown-E', () => {
      this.intentarExaminarNPC();
    });

    // === TEXTO DEBUG ===
    this.coordText = this.add.text(20, 20, "", {
      fontSize: "16px",
      color: "#00ffcc",
      fontFamily: "monospace",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(20);
  }

  actualizarHUD() {
    document.getElementById("dia").textContent = this.dia;
    document.getElementById("gasolina").textContent = `${this.gasolina}/${this.gasolinaMaxima}`;
    document.getElementById("comida").textContent = this.comida;
    document.getElementById("energia").textContent = this.energia + "%";
    document.getElementById("supervivientes").textContent = this.supervivientes;
    
    // 🔥 NUEVO: Actualizar stamina
    if (this.player) {
      document.getElementById("stamina").textContent = Math.floor(this.player.stamina) + "%";
    }
  }

  // 🔥 MÁS SIMPLE: Solo maneja UI basada en eventos
  actualizarBotonAvanzar(datosTiempo) {
    const avanzarBtn = document.getElementById("avanzarBtn");
    
    if (datosTiempo.transcurrido < datosTiempo.minimo) {
      // Bloqueado - primeros 10 minutos
      avanzarBtn.disabled = true;
      avanzarBtn.textContent = this.temporizador.formatearTiempo(datosTiempo.minimo - datosTiempo.transcurrido);
    } else if (datosTiempo.transcurrido < datosTiempo.maximo) {
      // Opcional - de 10 a 20 minutos
      avanzarBtn.disabled = false;
      avanzarBtn.textContent = `[ Avanzar Día → ] (${this.temporizador.formatearTiempo(datosTiempo.tiempoRestante)})`;
    } else {
      // Forzado - después de 20 minutos
      avanzarBtn.disabled = true;
      avanzarBtn.textContent = "AVANZANDO...";
    }
  }

  avanzarDia(avanzarBtn) {
    if (this.avanzando || !this.temporizador.puedeAvanzar()) return;
    
    this.avanzando = true;
    avanzarBtn.disabled = true;
    this.procesarCambioDia();
  }

  forzarAvanceDia() {
    if (this.avanzando) return;
    
    this.avanzando = true;
    this.mostrarMensaje("¡El día ha terminado! Avanzando automáticamente...", 0xff9900);
    this.procesarCambioDia();
  }

  procesarCambioDia() {
    const cam = this.cameras.main;
    const duracionFade = 1500;
    const pausaOscura = 800;

    cam.fadeOut(duracionFade, 0, 0, 0);
    
    cam.once("camerafadeoutcomplete", () => {
      this.time.delayedCall(pausaOscura, () => {
        // Lógica de fin de día
        this.dia++;
        this.gasolina = Math.max(0, this.gasolina - Phaser.Math.Between(1, 2));
        this.comida = Math.max(0, this.comida - this.supervivientes);
        this.energia = Math.max(0, this.energia - Phaser.Math.Between(3, 7));
        
        // 🔥 NUEVO: Procesar consecuencias de aliens
        if (this.sistemaExamen) {
          this.sistemaExamen.procesarConsecuenciasDia();
        }
        
        this.actualizarHUD();
        
        // Evento de nuevo día para sistemas
        this.events.emit('nuevoDia');
        
        cam.fadeIn(duracionFade, 0, 0, 0);
        cam.once("camerafadeincomplete", () => {
          this.avanzando = false;
          this.temporizador.reiniciar();
        });
      });
    });
  }

  npcDestruido(npc) {
    if (this.sistemaExamen && (npc.bajoVigilancia || npc.ignorado)) {
      this.sistemaExamen.alienDestruido(npc);
    }
  }

  agregarGasolina(cantidad) {
    this.gasolina = Phaser.Math.Clamp(
      this.gasolina + cantidad, 
      0, 
      this.gasolinaMaxima
    );
    this.actualizarHUD();
  
    if (this.gasolina >= this.gasolinaMaxima) {
      this.mostrarMensaje("¡Depósito de gasolina lleno!", 0x00ff00);
    }
  }

  // 🔥 MÉTODO AUXILIAR PARA MENSAJES
  mostrarMensaje(texto, color = 0xffffff) {
    // Implementación básica - puedes mejorarla después
    console.log(`Mensaje: ${texto}`);
    
    // Opcional: texto flotante en el juego
    const mensaje = this.add.text(this.player.x, this.player.y - 50, texto, {
      fontSize: '16px',
      color: color.toString(16),
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(30);
    
    this.tweens.add({
      targets: mensaje,
      y: mensaje.y - 30,
      alpha: 0,
      duration: 3000,
      onComplete: () => mensaje.destroy()
    });
  }

  obtenerPuntosCaminoCampamento() {
    return this.sistemaNPC.obtenerPuntosCaminoCampamento();
  }

  // 🔥 NUEVO: Método llamado cuando se acepta un NPC
  npcAceptado(npc, tipo) {
    console.log(`RefugioScene: NPC aceptado - Tipo: ${tipo}`);
    this.sistemaNPC.npcAceptado(npc, tipo);
  }

  npcRechazado(npc) {
    this.sistemaNPC.npcRechazado(npc);
  }

  // 🔥 NUEVO: Método para examinar NPCs cercanos
  intentarExaminarNPC() {
    const npcs = this.sistemaNPC.npcs;
    const player = this.player;

    // Buscar NPC más cercano
    let npcCercano = null;
    let distanciaMinima = 100; // Radio de interacción

    npcs.forEach(npc => {
      if (npc.aceptado && !npc.rechazado) {
        const distancia = Phaser.Math.Distance.Between(
          player.x, player.y, npc.x, npc.y
        );
        
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          npcCercano = npc;
        }
      }
    });

    if (npcCercano) {
      this.sistemaExamen.iniciarExamen(npcCercano);
    } else {
      this.mostrarMensaje("No hay NPCs cercanos para examinar", 0xffff00);
    }
  }

  update(time, delta) {
    if (this.player) this.player.update(time, delta);
    if (this.player && this.coordText) {
      const { x, y } = this.player;
      this.coordText.setText(`Jugador: x=${x.toFixed(0)}, y=${y.toFixed(0)}`);
    }

    if (this.sistemaNPC) {
      this.sistemaNPC.update();
    }
  }

  // 🔥 LIMPIAR RECURSOS AL SALIR
  shutdown() {
    if (this.temporizador) {
      this.temporizador.destruir();
    }
    
    // 🔥 NUEVO: Limpiar evento de teclado
    this.input.keyboard.off('keydown-E');
  }
}