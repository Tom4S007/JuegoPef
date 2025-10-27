class SistemaExamenAlien {
  constructor(scene) {
    this.scene = scene;
    this.examenActivo = false;
    this.npcExaminando = null;
    this.aliensVigilados = []; // 🔥 NUEVO: Lista de aliens bajo vigilancia
    this.aliensIgnorados = [];
  }

  iniciarExamen(npc) {
    if (this.examenActivo) return false;
    
    const player = this.scene.player;
    
    // Verificar si el jugador puede realizar el examen
    if (!player.puedeRealizarExamen()) {
      this.scene.mostrarMensaje("¡Estás demasiado cansado!", 0xff0000);
      return false;
    }

    // Verificar si hay suficiente energía en el campamento
    if (this.scene.energia < 20) {
      this.scene.mostrarMensaje("No hay suficiente energía", 0xff0000);
      return false;
    }

    this.examenActivo = true;
    this.npcExaminando = npc;

    // Mostrar interfaz de examen
    this.mostrarInterfazExamen();
    return true;
  }

  mostrarInterfazExamen() {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;
    const centerY = cam.scrollY + 300;

    // Fondo del examen
    this.examenBg = this.scene.add.rectangle(centerX, centerY, 400, 250, 0x1a1a1a, 0.95)
      .setDepth(200)
      .setStrokeStyle(2, 0x00ff00);

    // Título
    this.examenTitle = this.scene.add.text(centerX, centerY - 80, "EXAMEN DE DETECCIÓN ALIEN", {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(201);

    // Información de costos
    const multiplicador = this.scene.player.getMultiplicadorConsumo();
    const consumoEnergia = Math.floor(20 * multiplicador);
    
    this.examenInfo = this.scene.add.text(centerX, centerY - 40, 
      `Costo: 25% Stamina + ${consumoEnergia}% Energía\nStamina actual: ${this.scene.player.stamina.toFixed(0)}%`, {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(201);

    // Botones
    this.crearBotonExamen(centerY + 10, "🔬 Realizar Examen", 0x00aa00, () => this.realizarExamen());
    this.crearBotonExamen(centerY + 60, "❌ Cancelar", 0xaa0000, () => this.cancelarExamen());
  }

  crearBotonExamen(y, texto, color, callback) {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;

    const btn = this.scene.add.rectangle(centerX, y, 250, 40, color)
      .setDepth(201)
      .setInteractive();

    const btnText = this.scene.add.text(centerX, y, texto, {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(202);

    btn.on('pointerdown', () => {
      callback();
    });

    // Efectos hover
    btn.on('pointerover', () => {
      btn.setFillStyle(color, 0.8);
    });
    
    btn.on('pointerout', () => {
      btn.setFillStyle(color, 1);
    });
  }

  realizarExamen() {
    const player = this.scene.player;
    const multiplicador = player.getMultiplicadorConsumo();
    const consumoEnergia = 20 * multiplicador;

    // Consumir recursos
    const staminaSuficiente = player.consumirStamina(25);
    this.scene.energia = Math.max(0, this.scene.energia - consumoEnergia);

    // Mostrar resultados
    this.mostrarResultadoExamen();

    // Actualizar HUD
    this.scene.actualizarHUD();
    this.limpiarInterfazExamen();
    this.examenActivo = false;
  }

  mostrarResultadoExamen() {
    const esAlien = this.npcExaminando.esAlien;
    
    if (esAlien) {
      this.mostrarOpcionesAlien();
    } else {
      this.mostrarResultadoHumano();
    }
  }

  mostrarResultadoHumano() {
    this.scene.mostrarMensaje("✅ Resultado: Es humano", 0x00ff00);
    
    // Efecto visual en el NPC
    this.npcExaminando.graphic.setFillStyle(0x00ff00);
    this.npcExaminando.texto.setText("👤");
  }

  mostrarOpcionesAlien() {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;
    const centerY = cam.scrollY + 300;

    // Limpiar interfaz anterior
    this.limpiarInterfazExamen();

    // Nueva interfaz para alien detectado
    this.alienBg = this.scene.add.rectangle(centerX, centerY, 450, 300, 0x1a1a1a, 0.95)
      .setDepth(200)
      .setStrokeStyle(2, 0xff0000);

    // Título de alerta
    this.alienTitle = this.scene.add.text(centerX, centerY - 100, "🚨 ¡ALIEN DETECTADO! 🚨", {
      fontSize: '20px',
      color: '#ff0000',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(201);

    // Información
    this.alienInfo = this.scene.add.text(centerX, centerY - 50, 
      "Se ha detectado una entidad alienígena\ninfiltrada en el campamento.\n\n¿Qué deseas hacer?", {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(201);

    // Botones de acción
    this.crearBotonAlien(centerY + 20, "🔴 Expulsar del campamento", 0xff0000, () => this.expulsarAlien());
    this.crearBotonAlien(centerY + 70, "⚠️  Mantener bajo vigilancia", 0xffff00, () => this.vigilarAlien());
    this.crearBotonAlien(centerY + 120, "❌ Ignorar por ahora", 0x666666, () => this.ignorarAlien());

    // Efecto visual en el NPC alien
    this.npcExaminando.graphic.setFillStyle(0xff0000);
    this.npcExaminando.texto.setText("👽");
  }

  crearBotonAlien(y, texto, color, callback) {
    const cam = this.scene.cameras.main;
    const centerX = cam.scrollX + 400;

    const btn = this.scene.add.rectangle(centerX, y, 300, 40, color)
      .setDepth(201)
      .setInteractive();

    const btnText = this.scene.add.text(centerX, y, texto, {
      fontSize: '14px',
      color: '#000000',
      fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(202);

    btn.on('pointerdown', () => {
      callback();
    });

    btn.on('pointerover', () => {
      btn.setFillStyle(color, 0.8);
    });
    
    btn.on('pointerout', () => {
      btn.setFillStyle(color, 1);
    });
  }

  // 🔥 NUEVO: Expulsar alien del campamento
  expulsarAlien() {
    this.scene.mostrarMensaje("🚨 ¡Alien expulsado del campamento!", 0xff0000);
    
    // Quitar del contador de supervivientes si estaba contado
    if (this.npcExaminando.contadorIncrementado) {
      this.scene.supervivientes = Math.max(0, this.scene.supervivientes - 1);
      this.scene.actualizarHUD();
    }
    
    // Hacer que el alien se vaya
    this.npcExaminando.rechazado = true;
    this.npcExaminando.texto.setText("🚫");
    this.npcExaminando.iniciarCaminoSalida();
    
    this.limpiarInterfazAlien();
    this.examenActivo = false;
  }

  // 🔥 NUEVO: Vigilar alien (consecuencias futuras)
  vigilarAlien() {
    this.scene.mostrarMensaje("Alien puesto bajo vigilancia...", 0xffff00);
    
    // Aquí puedes añadir efectos futuros como:
    // - Reducción de recursos
    // - Eventos aleatorios negativos
    // - Posible ataque del alien
    
    this.npcExaminando.texto.setText("👁️");
    this.limpiarInterfazAlien();
    this.examenActivo = false;
  }

  // 🔥 NUEVO: Ignorar alien (riesgo alto)
  ignorarAlien() {
    this.scene.mostrarMensaje("Alien ignorado - ¡Peligro inminente!", 0xff6600);
    
    // Alto riesgo - el alien puede causar problemas
    // Posibles efectos:
    // - Desaparición de recursos
    // - Ataque a otros supervivientes
    // - Sabotaje del campamento
    
    this.npcExaminando.texto.setText("⚠️");
    this.limpiarInterfazAlien();
    this.examenActivo = false;
  }

  cancelarExamen() {
    this.limpiarInterfazExamen();
    this.examenActivo = false;
    this.npcExaminando = null;
  }

  limpiarInterfazExamen() {
    if (this.examenBg) this.examenBg.destroy();
    if (this.examenTitle) this.examenTitle.destroy();
    if (this.examenInfo) this.examenInfo.destroy();
    
    // Limpiar elementos de profundidad 201-202 (botones)
    this.scene.children.each(child => {
      if (child.depth >= 201 && child.depth <= 202) {
        child.destroy();
      }
    });
  }

  limpiarInterfazAlien() {
    if (this.alienBg) this.alienBg.destroy();
    if (this.alienTitle) this.alienTitle.destroy();
    if (this.alienInfo) this.alienInfo.destroy();
    
    // Limpiar elementos de profundidad 201-202
    this.scene.children.each(child => {
      if (child.depth >= 201 && child.depth <= 202) {
        child.destroy();
      }
    });
  }

  procesarConsecuenciasDia() {
    this.procesarAliensVigilados();
    this.procesarAliensIgnorados();
  }

  // 🔥 NUEVO: Consecuencias para aliens vigilados
  procesarAliensVigilados() {
    if (this.aliensVigilados.length === 0) return;

    let mensaje = "";
    let color = 0xffff00;

    // 25% de probabilidad de que un alien vigilado cause problemas
    this.aliensVigilados.forEach((alien, index) => {
      if (Phaser.Math.Between(1, 100) <= 25) {
        // Pérdida aleatoria de recursos
        const recursoPerdido = Phaser.Math.Between(1, 3);
        switch(recursoPerdido) {
          case 1:
            this.scene.comida = Math.max(0, this.scene.comida - 1);
            mensaje = "Alien vigilado robó comida";
            break;
          case 2:
            this.scene.energia = Math.max(0, this.scene.energia - 5);
            mensaje = "Alien vigilado consumió energía extra";
            break;
          case 3:
            // Pequeña probabilidad de perder un superviviente
            if (Phaser.Math.Between(1, 100) <= 10) {
              this.scene.supervivientes = Math.max(0, this.scene.supervivientes - 1);
              mensaje = "¡Alien vigilado atacó a un superviviente!";
              color = 0xff0000;
            }
            break;
        }
        
        if (mensaje) {
          this.scene.mostrarMensaje(mensaje, color);
        }
      }
    });

    this.scene.actualizarHUD();
  }

  // 🔥 NUEVO: Consecuencias para aliens ignorados (ALTO RIESGO)
  procesarAliensIgnorados() {
    if (this.aliensIgnorados.length === 0) return;

    let mensaje = "";
    let color = 0xff6600;
    let gasolinaRobada = 0;

    // 🔥 33% de probabilidad por cada alien ignorado de perder 2 de gasolina
    this.aliensIgnorados.forEach((alien, index) => {
      if (Phaser.Math.Between(1, 100) <= 33) {
        gasolinaRobada += 2;
        
        // Mensaje adicional para el primer alien que cause problemas
        if (mensaje === "") {
          mensaje = "Aliens ignorados sabotearon los suministros!";
        }
      }
    });

    // Aplicar pérdida de gasolina
    if (gasolinaRobada > 0) {
      const gasolinaAnterior = this.scene.gasolina;
      this.scene.gasolina = Math.max(0, this.scene.gasolina - gasolinaRobada);
      
      if (mensaje) {
        mensaje += ` -${gasolinaRobada} gasolina`;
        this.scene.mostrarMensaje(mensaje, color);
      }
      
      // Efecto visual si la gasolina llegó a 0
      if (this.scene.gasolina === 0 && gasolinaAnterior > 0) {
        this.scene.mostrarMensaje("¡Depósito de gasolina vacío!", 0xff0000);
      }
    }

    // 🔥 Riesgo adicional: 15% de probabilidad de evento catastrófico
    if (this.aliensIgnorados.length >= 2 && Phaser.Math.Between(1, 100) <= 15) {
      this.eventoCatastrofico();
    }

    this.scene.actualizarHUD();
  }

  // 🔥 NUEVO: Evento catastrófico por múltiples aliens ignorados
  eventoCatastrofico() {
    const eventos = [
      {
        mensaje: "¡SABOTAJE ALIEN! Los aliens ignorados destruyeron recursos",
        efecto: () => {
          this.scene.comida = Math.max(0, this.scene.comida - 3);
          this.scene.energia = Math.max(0, this.scene.energia - 15);
        },
        color: 0xff0000
      },
      {
        mensaje: "¡INFILTRACIÓN! Los aliens ignorados convencieron a supervivientes",
        efecto: () => {
          const perdida = Phaser.Math.Between(1, 2);
          this.scene.supervivientes = Math.max(0, this.scene.supervivientes - perdida);
        },
        color: 0xff0000
      },
      {
        mensaje: "¡ATAQUE COORDINADO! Múltiples aliens atacaron el campamento",
        efecto: () => {
          this.scene.gasolina = Math.max(0, this.scene.gasolina - 5);
          this.scene.energia = Math.max(0, this.scene.energia - 20);
        },
        color: 0xff0000
      }
    ];

    const evento = Phaser.Utils.Array.GetRandom(eventos);
    evento.efecto();
    this.scene.mostrarMensaje(evento.mensaje, evento.color);
    this.scene.actualizarHUD();
  }

  // 🔥 MODIFICADO: Métodos de decisión para registrar aliens
  vigilarAlien() {
    this.scene.mostrarMensaje("Alien puesto bajo vigilancia...", 0xffff00);
    
    // Registrar alien en la lista de vigilados
    this.aliensVigilados.push(this.npcExaminando);
    this.npcExaminando.texto.setText("👁️");
    this.npcExaminando.bajoVigilancia = true; // 🔥 Nueva propiedad
    
    this.limpiarInterfazAlien();
    this.examenActivo = false;
  }

  ignorarAlien() {
    this.scene.mostrarMensaje("Alien ignorado - ¡Peligro inminente!", 0xff6600);
    
    // Registrar alien en la lista de ignorados (ALTO RIESGO)
    this.aliensIgnorados.push(this.npcExaminando);
    this.npcExaminando.texto.setText("⚠️");
    this.npcExaminando.ignorado = true; // 🔥 Nueva propiedad
    
    this.limpiarInterfazAlien();
    this.examenActivo = false;
  }

  // 🔥 MODIFICADO: Al expulsar, remover de las listas
  expulsarAlien() {
    this.scene.mostrarMensaje("🚨 ¡Alien expulsado del campamento!", 0xff0000);
    
    // Quitar del contador de supervivientes si estaba contado
    if (this.npcExaminando.contadorIncrementado) {
      this.scene.supervivientes = Math.max(0, this.scene.supervivientes - 1);
    }
    
    // Remover de las listas de consecuencias
    this.removerAlienDeListas(this.npcExaminando);
    
    // Hacer que el alien se vaya
    this.npcExaminando.rechazado = true;
    this.npcExaminando.texto.setText("🚫");
    this.npcExaminando.iniciarCaminoSalida();
    
    this.limpiarInterfazAlien();
    this.examenActivo = false;
    this.scene.actualizarHUD();
  }

  // 🔥 NUEVO: Remover alien de todas las listas
  removerAlienDeListas(npc) {
    this.aliensVigilados = this.aliensVigilados.filter(alien => alien !== npc);
    this.aliensIgnorados = this.aliensIgnorados.filter(alien => alien !== npc);
  }

  // 🔥 NUEVO: Limpiar aliens cuando son destruidos (NPC se va)
  alienDestruido(npc) {
    this.removerAlienDeListas(npc);
  }

  // 🔥 NUEVO: Obtener estadísticas para debug o HUD
  getEstadisticasAliens() {
    return {
      vigilados: this.aliensVigilados.length,
      ignorados: this.aliensIgnorados.length,
      total: this.aliensVigilados.length + this.aliensIgnorados.length
    };
  }
}