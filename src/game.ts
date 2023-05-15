import * as Phaser from 'phaser';
import { MenuScene } from './MenuScene';
import { SettingsScene } from './SettingsScene';
import { GameScene } from './GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  scene: [MenuScene, SettingsScene, GameScene],
};

const game = new Phaser.Game(config);
