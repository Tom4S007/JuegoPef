class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 100, "ODYSSEY PROJECT", {
      fontSize: "40px",
      color: "#ffffff",
      fontFamily: "monospace"
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height / 2 + 50, "Presiona ENTER para comenzar", {
      fontSize: "20px",
      color: "#aaaaaa",
      fontFamily: "monospace"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-ENTER", () => {
      this.scene.start("RefugioScene");
    });

  }
}
