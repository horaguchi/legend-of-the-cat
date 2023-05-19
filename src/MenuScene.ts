import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }

    create() {
        const title =  this.add.text(this.cameras.main.centerX, 200, 'Legend of the Cat').setFontSize(80).setFill('#fff').setOrigin(0.5);
        
        const startButton = this.add.text(this.cameras.main.centerX, 350, 'Start Game').setFontSize(32).setFill('#fff').setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerdown', () => {
            this.scene.start('game');
        });

        const settingsButton = this.add.text(this.cameras.main.centerX, 450, 'Settings').setFontSize(32).setFill('#fff').setOrigin(0.5);
        settingsButton.setInteractive({ useHandCursor: true });
        settingsButton.on('pointerdown', () => {
            this.scene.start('settings');
        });
    }

    update() {
        this.tweens.update();
    }
}
