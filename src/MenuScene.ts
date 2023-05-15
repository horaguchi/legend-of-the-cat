import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }

    create() {
        const startButton = this.add.text(this.cameras.main.centerX, 300, 'Start Game').setFontSize(32).setFill('#fff').setOrigin(0.5);

        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            this.scene.start('game');
        });

        const settingsButton = this.add.text(this.cameras.main.centerX, 350, 'Settings').setFontSize(32).setFill('#fff').setOrigin(0.5);

        settingsButton.setInteractive();
        settingsButton.on('pointerdown', () => {
            this.scene.start('settings');
        });
    }
}
