import * as Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private readonly SCREEN_WIDTH = 960; // スクリーンの横幅
    private readonly SCREEN_HEIGHT = 540; // スクリーンの縦幅
    private readonly MAP_WIDTH = 9; // マップの横幅（マス数）
    private readonly MAP_HEIGHT = 9; // マップの縦幅（マス数）
    private readonly CELL_SIZE = 32; // 1マスのサイズ（ピクセル数）
    private readonly LINE_COLOR = 0xffffff; // 線の色
    private readonly MAP_OFFSET_X = (this.SCREEN_WIDTH - this.CELL_SIZE * this.MAP_WIDTH) / 2; // マップの横幅（マス数）
    private readonly MAP_OFFSET_Y = (this.SCREEN_HEIGHT - this.CELL_SIZE * this.MAP_HEIGHT) / 2; // マップの横幅（マス数）
    private readonly CHOICE_WIDTH = 300;
    private readonly CHOICE_HEIGHT = 80;
    private readonly CHOICE_SPACE = 20;
    private readonly UNIT_SPEC: Record<string, {
        tier: number,
        desc: string,
        cost: Record<string, number>,
        type: string,
        meta1: Record<string, number>,
        meta2?: Record<string, number>,
        tick: number
    }> = {
            "😺": { tier: 1, desc: "T1 Cat", cost: { "💰": 10 }, type: "GAIN", meta1: { "💰": 10, "🌹": 1 }, tick: 10 },
            "😹": { tier: 2, desc: "T2 Cat", cost: { "💰": 200 }, type: "GAIN", meta1: { "💰": 100 }, tick: 10 },
            "😼": { tier: 3, desc: "T3 Cat", cost: { "💰": 4000 }, type: "GAIN", meta1: { "💰": 1000 }, tick: 10 },
            "👌": { tier: 1, desc: "T1 Finger", cost: { "💰": 10, "🌹": 1 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 200 }, tick: 10 },
            "🤞": { tier: 2, desc: "T2 Finger", cost: { "💰": 20, "🌹": 2 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 2000 }, tick: 20 },
            "🤟": { tier: 3, desc: "T3 Finger", cost: { "💰": 30, "🌹": 3 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 20000 }, tick: 30 },
        };

    // TODO:
    // GAIN 
    // CONVERT
    // BUFF_SPEED
    // BUFF_AMOUNT

    // ユニットマップデータ
    private unitMap: {
        symbol: string,
        addTick: number,
        x: number,
        y: number
    }[][];
    private units: Record<string, {
        symbol: string,
        addTick: number,
        x: number,
        y: number
    }[]> = {
            "GAIN": [],
            "CONVERT": [],
        };
    private textMap: Phaser.GameObjects.Text[][]; // 表示用テキストマップデータ
    private textTweenMap: Phaser.Tweens.Tween[][]; // 表示用テキストアニメマップデータ
    private mapGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceTexts: Phaser.GameObjects.Text[];
    private selectedGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private selectedText: Phaser.GameObjects.Text;
    private tick: number = 0;
    private statusText: Phaser.GameObjects.Text;
    private confirmText: Phaser.GameObjects.Text;
    private confirmOK: boolean = false;
    private inventory: Record<string, number> = { "💰": 100 };
    private mapX: number = -1;
    private mapY: number = -1;
    private choice: number = 0;
    private choices: Record<number, string> = {
        1: "😺",
        2: "😼",
        3: "👌"
    };
    private timerState: string = '▶️';

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
        this.statusText = this.add.text(10, 10, "  ").setFontSize(20).setFill('#fff');
        this.statusText.setInteractive({ useHandCursor: true });
        this.statusText.on('pointerdown', () => {
            this.clickStatus();
        });

        // 配置ボタンの初期化
        this.confirmText = this.add.text(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2, "Purchase and place it there").setFontSize(20).setFill('#999');
        this.confirmText.setInteractive({ useHandCursor: true });
        this.confirmText.setOrigin(0.5);
        this.confirmText.on('pointerdown', () => {
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
        this.selectedText = this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5);

        this.drawStatus();

        this.createMap();
        this.drawMap();

        this.createChoice();
        this.drawChoice(0);
    }
    private createMap() {
        // ユニットマップを初期化する
        this.unitMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.unitMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.unitMap[y][x] = null;
            }
        }

        // テキストマップ、アニメマップを初期化する
        this.textMap = [];
        this.textTweenMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.textMap.push([]);
            this.textTweenMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.textMap[y][x] = this.add.text(
                    x * this.CELL_SIZE + this.MAP_OFFSET_X + this.CELL_SIZE / 2,
                    y * this.CELL_SIZE + this.MAP_OFFSET_Y + this.CELL_SIZE / 2,
                    " ").setFontSize(20).setFill('#fff').setOrigin(0.5);
                let tween = this.tweens.add({
                    targets: this.textMap[y][x],
                    duration: 250,
                    scaleX: 1.8,
                    scaleY: 1.8,
                    ease: 'Power1',
                    yoyo: true,
                    paused: true,
                    repeat: -1,
                    onRepeat: () => {
                        tween.pause();
                    },
                });
                this.textTweenMap[y][x] = tween;
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
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5),
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5),
            this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5),
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
        this.tweens.update();
    }

    // 時間経過ごとの処理
    private updateTimer() {
        if (this.timerState == '▶️') {
            return;
        }
        this.tick++;
        this.resolveUnits();
        this.drawStatus();
        this.checkAndEnableConfirmButton();
        this.drawSelected();
    }

    // ユニットの資源生成解決処理
    private resolveUnits() {
        for (let unit of this.units.GAIN) {
            let spec = this.UNIT_SPEC[unit.symbol];
            if ((this.tick - unit.addTick) % spec.tick == 0) {
                for (let [key, value] of Object.entries(spec.meta1)) {
                    this.inventory[key] = (this.inventory[key] ?? 0) + Number(value);
                }
                // アニメ
                this.textTweenMap[unit.y][unit.x].resume();
            }
        }

        for (let unit of this.units.CONVERT) {
            let spec = this.UNIT_SPEC[unit.symbol];
            if ((this.tick - unit.addTick) % spec.tick == 0) {
                let convertOK = true;
                for (let [key, value] of Object.entries(spec.meta1)) {
                    if ((this.inventory[key] ?? 0) < Number(value)) {
                        convertOK = false;
                    }
                }
                if (convertOK) {
                    for (let [key, value] of Object.entries(spec.meta1)) {
                        this.inventory[key] -= Number(value);
                    }
                    for (let [key, value] of Object.entries(spec.meta2)) {
                        this.inventory[key] = (this.inventory[key] ?? 0) + Number(value);
                    }
                    // アニメ
                    this.textTweenMap[unit.y][unit.x].resume();
                }
            }
        }
    }

    // ステータスをクリック
    private clickStatus() {
        this.timerState = (this.timerState == '▶️' ? '⏸️' : '▶️');
        this.drawStatus();
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

    // 左側選択肢をクリック
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
        if (this.choice != 0 && 0 <= this.mapX && 0 <= this.mapY && !this.unitMap[this.mapY][this.mapX] && this.checkPurchasable()) {
            this.confirmText.setFill('#ff0');
            this.confirmOK = true;
        } else {
            this.confirmText.setFill('#999');
            this.confirmOK = false;
        }
    }

    // 配置ボタン押下→ユニットの作成処理
    private clickConfirm() {
        if (!this.confirmOK) {
            return;
        }
        if (!this.checkPurchasable()) { // 買えない限り押せるようにはなってないはずだが…
            return;
        }

        let symbol = this.choices[this.choice];
        let spec = this.UNIT_SPEC[symbol];
        for (let [key, value] of Object.entries(spec.cost)) {
            this.inventory[key] -= Number(value);
        }

        this.unitMap[this.mapY][this.mapX] = { symbol: symbol, addTick: this.tick, x: this.mapX, y: this.mapY };
        this.textMap[this.mapY][this.mapX].setText(symbol);
        this.units[spec.type].push(this.unitMap[this.mapY][this.mapX]);
        this.checkAndEnableConfirmButton();
        this.drawStatus();
        this.drawMap(this.mapX, this.mapY);
    }

    // 購入可能か判定
    private checkPurchasable() {
        let symbol = this.choices[this.choice];
        let spec = this.UNIT_SPEC[symbol];

        let purchaseOK = true;
        for (let [key, value] of Object.entries(spec.cost)) {
            if ((this.inventory[key] ?? 0) < Number(value)) {
                purchaseOK = false;
            }
        }
        return purchaseOK;
    }

    // ステータスを更新する
    private drawStatus() {
        this.statusText.setText(this.timerState + " Time: " + this.tick + ', Inventory: ' + this.getSimpleTextFromObject(this.inventory));
    }

    // マップを描画する
    private drawMap(mapX: number = -1, mapY: number = -1) {
        this.mapGraphics.clear();

        // 縦の線を描画する
        this.mapGraphics.lineStyle(1, this.LINE_COLOR);
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
            this.mapGraphics.lineStyle(1, (!this.unitMap[mapY][mapX] ? 0xffff00 : 0x00ffff));
            this.mapGraphics.strokeRect(this.MAP_OFFSET_X + mapX * this.CELL_SIZE, this.MAP_OFFSET_Y + mapY * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        }

        this.drawSelected();
    }

    // シンボルからスペックテキストを取得
    private getSimpleTextFromObject(obj) {
        return JSON.stringify(obj).replace(/"/g, '').replace(/([^{,]+):(\d+)/g, '$2$1').replace(/{([^,]+)}/, '$1');
    }
    private getTextFromSpec(symbol: string, noCost: boolean = false) {
        let spec = this.UNIT_SPEC[symbol];
        let meta = '';
        if (spec.type == "GAIN") {
            meta = '+' + this.getSimpleTextFromObject(spec.meta1);
        } else if (spec.type == "CONVERT") {
            meta = '-' + this.getSimpleTextFromObject(spec.meta1) + '->+' + this.getSimpleTextFromObject(spec.meta2);
        }
        return symbol + ': ' + spec.desc + '\n' + meta + ' / ' + spec.tick +
            (noCost ? '' : '\n' + 'Cost: -' + this.getSimpleTextFromObject(spec.cost));
    }
    private getTextFromSpecWithSelected() {
        let unit = this.unitMap[this.mapY][this.mapX];
        let symbol = unit.symbol;
        let spec = this.UNIT_SPEC[symbol];

        return this.getTextFromSpec(symbol, true) + '\n' + (spec.tick - (this.tick - unit.addTick) % spec.tick);
    }

    // 左側の選択肢を描画
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

    // 右側の説明を描画(選択中はtickごとに更新)
    private drawSelected() {
        if (this.mapX < 0 || this.mapY < 0 || !this.unitMap[this.mapY][this.mapX]) {
            this.selectedGraphics.clear();
            this.selectedText.setText(" ");
            return;
        }
        this.selectedText.setText(this.getTextFromSpecWithSelected());
        this.selectedText.setPosition(this.SCREEN_WIDTH - this.MAP_OFFSET_X / 2, this.cameras.main.centerY);

        // 枠線の矩形を描画
        let startX = this.SCREEN_WIDTH - (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2 - this.CHOICE_WIDTH;
        let startY = this.cameras.main.centerY - this.CHOICE_HEIGHT / 2;
        this.selectedGraphics.lineStyle(1, 0x00ffff);
        this.selectedGraphics.strokeRect(startX, startY, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
    }
}
