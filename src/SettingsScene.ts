import * as Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('settings');
    }

    create() {
        const backButton = this.add.text(this.cameras.main.centerX, 300, 'Back').setFontSize(32).setFill('#fff').setOrigin(0.5);

        backButton.setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.start('menu');
        });
    }
}
