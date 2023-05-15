import * as Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private readonly SCREEN_WIDTH = 960; // スクリーンの横幅
    private readonly SCREEN_HEIGHT = 540; // スクリーンの縦幅
    private readonly MAP_WIDTH = 9; // マップの横幅（マス数）
    private readonly MAP_HEIGHT = 9; // マップの縦幅（マス数）
    private readonly CELL_SIZE = 32; // 1マスのサイズ（ピクセル数）
    private readonly ROAD_WIDTH = 1; // 道の太さ（ピクセル数）
    private readonly LINE_COLOR = 0xffffff; // 線の色
    private readonly MAP_OFFSET_X = (this.SCREEN_WIDTH - this.CELL_SIZE * this.MAP_WIDTH) / 2; // マップの横幅（マス数）
    private readonly MAP_OFFSET_Y = (this.SCREEN_HEIGHT - this.CELL_SIZE * this.MAP_HEIGHT) / 2; // マップの横幅（マス数）

    private readonly CHOICE_WIDTH = 300;
    private readonly CHOICE_HEIGHT = 80;
    private readonly CHOICE_SPACE = 20;

    private readonly UNIT_SPEC = {
        "😺" : { tier: 1, desc: "Tier1 Cat", cost: { "💰": 10 }, type: "GAIN", meta1: {"💰": 10 }, tick: 20 },
        "😹" : { tier: 2, desc: "Tier2 Cat", cost: { "💰": 200 }, type: "GAIN", meta1: {"💰": 100 }, tick: 20 },
        "😼" : { tier: 3, desc: "Tier3 Cat", cost: { "💰": 4000 }, type: "GAIN", meta1: {"💰": 1000 }, tick: 20 },
        "👌" : { tier: 1, desc: "Tier1 Finger", cost: { "💰": 10, "🌹": 1 }, type: "CONVERT", meta1: {"💰": 50 }, meta2: {"💰": 200 }, tick: 100 },
        "🤞" : { tier: 2, desc: "Tier2 Finger", cost: { "💰": 20, "🌹": 2 }, type: "CONVERT", meta1: {"💰": 500 }, meta2: {"💰": 2000 }, tick: 200 },
        "🤟" : { tier: 3, desc: "Tier3 Finger", cost: { "💰": 30, "🌹": 3 }, type: "CONVERT", meta1: {"💰": 5000 }, meta2: {"💰": 20000 }, tick: 300 },
    };

    private map: string[][]; // マップデータ（0: 空白、1: 道）
    private textMap: Phaser.GameObjects.Text[][]; // 表示用テキストマップデータ
    private mapGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceTexts: Phaser.GameObjects.Text[];
    private selectedGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private selectedText: Phaser.GameObjects.Text;
    private tick: number = 0;
    private statusText: Phaser.GameObjects.Text;
    private confirmText: Phaser.GameObjects.Text;
    private confirmOK: boolean = false;

    private inventory = { "💰": 100 };
    private mapX = -1;
    private mapY = -1;
    private choice = 0;
    private choices = {
        1: "😺",
        2: "😼",
        3: "👌"
    };

    constructor() {
        super("game");
    }

    preload() {
        // 画像の読み込み
        this.load.image('noimage', 'assets/noimage.gif'); // 透明
    }

    create() {
        // 全体クリックイベントを設定する
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            //this.click(pointer);
        });

        // ステータス表示用テキストの初期化
        this.statusText = this.add.text(10, 10, "Time: " + this.tick).setFontSize(20).setFill('#fff');

        // 配置ボタンの初期化
        this.confirmText = this.add.text(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2, "Purchase and place it there").setFontSize(20).setFill('#999');
        this.confirmText.setInteractive({ useHandCursor: true });
        this.confirmText.setOrigin(0.5);
        this.confirmText.on('pointerdown', () => {
            console.log("test");
            this.clickConfirm();
        });

        // タイマーイベントを設定する
        const timer = this.time.addEvent({
            delay: 500, // 1秒ごとに更新
            callback: this.updateTimer, // タイマーを更新するコールバック関数
            callbackScope: this,
            loop: true // 繰り返し実行
        });

        // 右側、説明表示用オブジェクトを作成する
        this.selectedGraphics = this.add.graphics();
        this.selectedText = this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center');

        this.createMap();
        this.drawMap();

        this.createChoice();
        this.drawChoice(0);
    }

    private createMap() {
        // マップを初期化する
        this.map = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.map.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.map[y][x] = '';
            }
        }

        // テキストマップを初期化する
        this.textMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.textMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.textMap[y][x] = this.add.text(
                    x * this.CELL_SIZE + this.MAP_OFFSET_X + this.CELL_SIZE / 2,
                    y * this.CELL_SIZE + this.MAP_OFFSET_Y + this.CELL_SIZE / 2,
                    " ").setFontSize(20).setFill('#fff').setOrigin(0.5);
            }
        }

        // 描画用オブジェクトを作成する
        this.mapGraphics = this.add.graphics();
        let mapContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);
        mapContainer.setSize(this.MAP_WIDTH * this.CELL_SIZE, this.MAP_HEIGHT * this.CELL_SIZE);
        mapContainer.setInteractive({ useHandCursor: true });
        mapContainer.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickMap(pointer);
        });
    }

    private createChoice() {
        // 枠線のスタイルを設定
        this.choiceGraphics = this.add.graphics();

        this.choiceTexts = [
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center'),
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center'),
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center'),
        ];

        // クリッカブル要素を追加
        let choiceContainer1 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY - this.CHOICE_HEIGHT - this.CHOICE_SPACE);
        choiceContainer1.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer1.setInteractive({ useHandCursor: true });
        choiceContainer1.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickChoice(pointer, 1);
        });
        let choiceContainer2 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY);
        choiceContainer2.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer2.setInteractive({ useHandCursor: true });
        choiceContainer2.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickChoice(pointer, 2);
        });
        let choiceContainer3 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY + this.CHOICE_HEIGHT + this.CHOICE_SPACE);
        choiceContainer3.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer3.setInteractive({ useHandCursor: true });
        choiceContainer3.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickChoice(pointer, 3);
        });
    }

    update() {
    }

    private updateTimer() {
        this.tick++;
        this.statusText.setText("Time: " + this.tick + ', Inventory: ' + this.getSimpleTextFromObject(this.inventory));
    }

    // マップをクリック
    private clickMap(pointer: Phaser.Input.Pointer) {
        // 現在のマウス位置から、クリックしたマスを計算
        const currentPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
        const mapX = Math.floor((currentPosition.x - this.MAP_OFFSET_X) / this.CELL_SIZE);
        const mapY = Math.floor((currentPosition.y - this.MAP_OFFSET_Y) / this.CELL_SIZE);

        // ユニットの選択
        if (0 <= mapX && mapX < this.MAP_WIDTH && 0 <= mapY && mapY < this.MAP_HEIGHT) {
            if (mapX == this.mapX && mapY == this.mapY) {
                this.mapX = -1;
                this.mapY = -1;
            } else {
                this.mapX = mapX;
                this.mapY = mapY;
            }
            this.checkAndEnableConfirmButton();
        }
        this.drawMap(this.mapX, this.mapY);
    }

    // 画面をクリック
    private clickChoice(pointer: Phaser.Input.Pointer, choice: number) {
        if (this.choice == choice) {
            this.choice = 0;
        } else {
            this.choice = choice;
        }
        this.checkAndEnableConfirmButton();
        this.drawChoice(this.choice);
    }

    // 配置ボタンの有効無効を判定
    private checkAndEnableConfirmButton() {
        if (this.choice != 0 && 0 <= this.mapX && 0 <= this.mapY && this.map[this.mapY][this.mapX] == '') {
            this.confirmText.setFill('#ff0');
            this.confirmOK = true;
        } else {
            this.confirmText.setFill('#999');
            this.confirmOK = false;
        }
    }

    private clickConfirm() {
        if (!this.confirmOK) {
            return;
        }
        this.map[this.mapY][this.mapX] = this.choices[this.choice];
        this.textMap[this.mapY][this.mapX].setText(this.choices[this.choice]);
        this.checkAndEnableConfirmButton();
        this.drawMap(this.mapX, this.mapY);
    }

    private drawMap(mapX: number = -1, mapY: number = -1) {
        // マップを描画する
        this.mapGraphics.clear();

        // 縦の線を描画する
        this.mapGraphics.lineStyle(this.ROAD_WIDTH, this.LINE_COLOR);
        for (let x = 0; x < this.MAP_WIDTH + 1; x++) {
            this.mapGraphics.beginPath();
            this.mapGraphics.moveTo(x * this.CELL_SIZE + this.MAP_OFFSET_X, this.MAP_OFFSET_Y);
            this.mapGraphics.lineTo(x * this.CELL_SIZE + this.MAP_OFFSET_X, this.MAP_HEIGHT * this.CELL_SIZE + this.MAP_OFFSET_Y);
            this.mapGraphics.strokePath();
        }

        // 横の線を描画する
        for (let y = 0; y < this.MAP_HEIGHT + 1; y++) {
            this.mapGraphics.beginPath();
            this.mapGraphics.moveTo(this.MAP_OFFSET_X, y * this.CELL_SIZE + this.MAP_OFFSET_Y);
            this.mapGraphics.lineTo(this.MAP_WIDTH * this.CELL_SIZE + this.MAP_OFFSET_X, y * this.CELL_SIZE + this.MAP_OFFSET_Y);
            this.mapGraphics.strokePath();
        }

        if (0 <= mapX && 0 <= mapY) {
            this.mapGraphics.lineStyle(this.ROAD_WIDTH, (this.map[mapY][mapX] == '' ? 0xffff00 : 0x00ffff));
            this.mapGraphics.strokeRect(this.MAP_OFFSET_X + mapX * this.CELL_SIZE, this.MAP_OFFSET_Y + mapY * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        }

        this.drawSelected();
    }

    // シンボルからスペックテキストを取得
    private getTextFromSpec(symbol: string) {
        let spec = this.UNIT_SPEC[symbol];
        let meta = '';
        if (spec.type == "GAIN") {
            meta = '+' + this.getSimpleTextFromObject(spec.meta1);
        } else if (spec.type == "CONVERT") {
            meta = '-' + this.getSimpleTextFromObject(spec.meta1) + '->+' + this.getSimpleTextFromObject(spec.meta2);
        }
        return symbol + ': ' +  spec.desc + '\n' + meta + ' / ' + spec.tick + '\n' +
            'Cost: -' + this.getSimpleTextFromObject(spec.cost);
    }
    private getSimpleTextFromObject(obj) {
        return JSON.stringify(obj).replace(/"/g, '').replace(/([^{,]+):(\d+)/g, '$2$1').replace(/{([^,]+)}/, '$1');
    }

    // 画面をクリック
    private drawChoice(choice: number) {
        let textStartX = this.MAP_OFFSET_X / 2;

        this.choiceTexts[0].setText(this.getTextFromSpec(this.choices[1]));
        this.choiceTexts[0].setPosition(textStartX, this.cameras.main.centerY - this.CHOICE_HEIGHT - this.CHOICE_SPACE);
        this.choiceTexts[1].setText(this.getTextFromSpec(this.choices[2]));
        this.choiceTexts[1].setPosition(textStartX, this.cameras.main.centerY);
        this.choiceTexts[2].setText(this.getTextFromSpec(this.choices[3]));
        this.choiceTexts[2].setPosition(textStartX, this.cameras.main.centerY + this.CHOICE_HEIGHT + this.CHOICE_SPACE);

        // 枠線のスタイルを設定
        let startX = (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2;

        // 枠線の矩形を描画
        this.choiceGraphics.lineStyle(1, (choice == 1 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2 - this.CHOICE_HEIGHT - this.CHOICE_SPACE, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        this.choiceGraphics.lineStyle(1, (choice == 2 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        this.choiceGraphics.lineStyle(1, (choice == 3 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2 + this.CHOICE_HEIGHT + this.CHOICE_SPACE, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
    }

    // 画面をクリック
    private drawSelected() {
        if (this.mapX < 0 || this.mapY < 0 || this.map[this.mapY][this.mapX] == '') {
            this.selectedGraphics.clear();
            this.selectedText.setText(" ");
            return;
        }
        this.selectedText.setText(this.getTextFromSpec(this.map[this.mapY][this.mapX]));
        this.selectedText.setPosition(this.SCREEN_WIDTH - this.MAP_OFFSET_X / 2, this.cameras.main.centerY);

        // 枠線の矩形を描画
        let startX = this.SCREEN_WIDTH - (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2 - this.CHOICE_WIDTH;
        let startY = this.cameras.main.centerY - this.CHOICE_HEIGHT / 2;
        this.selectedGraphics.lineStyle(1, 0x00ffff);
        this.selectedGraphics.strokeRect(startX, startY, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
    }
}
