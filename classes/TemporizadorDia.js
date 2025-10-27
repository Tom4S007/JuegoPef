class TemporizadorDia {
  constructor(scene, tiempoMinimo = 600000, tiempoMaximo = 1200000) {
    this.scene = scene;
    this.tiempoMinimo = tiempoMinimo;  // 10 min
    this.tiempoMaximo = tiempoMaximo;  // 20 min
    this.tiempoInicio = 0;
    this.tiempoTranscurrido = 0;
    this.diaForzado = false;
    this.activo = false;
    
    this.eventoTiempo = null;
  }

  iniciar() {
    this.tiempoInicio = this.scene.time.now;
    this.tiempoTranscurrido = 0;
    this.diaForzado = false;
    this.activo = true;
    
    this.eventoTiempo = this.scene.time.addEvent({
      delay: 1000,
      callback: this.actualizar,
      callbackScope: this,
      loop: true
    });
  }

  actualizar() {
    if (!this.activo) return;
    
    this.tiempoTranscurrido = this.scene.time.now - this.tiempoInicio;
    
    if (this.tiempoTranscurrido >= this.tiempoMaximo && !this.diaForzado) {
      this.diaForzado = true;
      this.scene.events.emit('diaForzado');
    }
    
    this.scene.events.emit('tiempoActualizado', {
      transcurrido: this.tiempoTranscurrido,
      minimo: this.tiempoMinimo,
      maximo: this.tiempoMaximo,
      puedeAvanzar: this.puedeAvanzar(),
      tiempoRestante: this.getTiempoRestante()
    });
  }

  puedeAvanzar() {
    return this.tiempoTranscurrido >= this.tiempoMinimo;
  }

  getTiempoRestante() {
    return this.tiempoMaximo - this.tiempoTranscurrido;
  }

  formatearTiempo(milisegundos) {
    const segundos = Math.ceil(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  }

  reiniciar() {
    this.destruir();
    this.iniciar();
  }

  destruir() {
    if (this.eventoTiempo) {
      this.eventoTiempo.destroy();
    }
    this.activo = false;
  }
}