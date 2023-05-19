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
    private readonly CHOICE_SPACE = 15;
    private readonly UNIT_SPEC: Record<string, {
        tier: number,
        name: string,
        cost: Record<string, number>,
        type: string,
        meta1: Record<string, number>,
        meta2?: Record<string, number>,
        tick: number
    }> = {
            "😺": { tier: 1, name: "T1 Cat", cost: { "💰": 10 }, type: "GAIN", meta1: { "💰": 10, "🌹": 1 }, tick: 10 },
            "😹": { tier: 2, name: "T2 Cat", cost: { "💰": 200 }, type: "GAIN", meta1: { "💰": 100 }, tick: 10 },
            "😼": { tier: 3, name: "T3 Cat", cost: { "💰": 4000 }, type: "GAIN", meta1: { "💰": 1000 }, tick: 10 },
            "👌": { tier: 1, name: "T1 Finger", cost: { "💰": 10, "🌹": 1 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 200 }, tick: 10 },
            "🤞": { tier: 2, name: "T2 Finger", cost: { "💰": 20, "🌹": 2 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 2000 }, tick: 20 },
            "🤟": { tier: 3, name: "T3 Finger", cost: { "💰": 30, "🌹": 3 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 20000 }, tick: 30 },
        };
    private readonly ITEM_SPEC: Record<string, {
        name: string,
        desc: string
    }> = {
        '👓': { name: 'Glasses', desc: 'gggg' },
        '🦺': { name: 'Safety Vest', desc: 'aaa' },
        '👔': { name: 'Necktie', desc: 'aaa' },
        '🧤': { name: 'Gloves', desc: 'aaaaaaaa' },
        '👗': { name: 'Dress', desc: 'aaaaaaa' },
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
    private items: {
        symbol: string,
        addTick: number,
    }[] = [];
    private textMap: Phaser.GameObjects.Text[][]; // 表示用テキストマップデータ
    private textTweenMap: Phaser.Tweens.Tween[][]; // 表示用テキストアニメマップデータ
    private mapGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private choiceTexts: Phaser.GameObjects.Text[];
    private selectionGroup: Phaser.GameObjects.Group; // 描画用オブジェクト
    private selectionGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private selectionTexts: Phaser.GameObjects.Text[];
    private selectionConfirmText: Phaser.GameObjects.Text;
    private selectionType: string = 'ITEM';
    private selectionContainers: Phaser.GameObjects.Container[];
    private viewGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private viewText: Phaser.GameObjects.Text;
    private viewItem: number = -1; // 説明選択用
    private tick: number = 0;
    private statusText: Phaser.GameObjects.Text;
    private pauseText: Phaser.GameObjects.Text;
    private pauseTween: Phaser.Tweens.Tween;
    private itemTexts: Phaser.GameObjects.Text[];
    private confirmText: Phaser.GameObjects.Text;
    private confirmOK: boolean = false;
    private inventory: Record<string, number> = { "💰": 100 };
    private mapX: number = -1;
    private mapY: number = -1;
    private choice: number = -1;
    private choices: string[] = [
        "😺",
        "😼",
        "👌",
    ];
    private selection: number = -1;
    private selections: string[] = [
        "🦺",
        "🧤",
        "👗",
        '👔',
    ];
    private timerState: string = '▶️';

    constructor() {
        super("game");
    }

    preload() {
        // 画像の読み込み
        this.load.image('noimage', 'assets/noimage.gif'); // 透明
    }

    create() {
        // ステータス表示用テキストの初期化
        this.statusText = this.add.text(10, 10, "  ").setFontSize(20).setFill('#fff');

        // ポーズボタン用テキスト・クリッカブル要素の初期化
        this.pauseText = this.add.text(this.SCREEN_WIDTH - 25, 25, this.timerState).setFontSize(20).setFill('#fff').setOrigin(0.5);
        this.pauseTween = this.tweens.add({
            targets: this.pauseText,
            duration: 150,
            scaleX: 1.8,
            scaleY: 1.8,
            ease: 'Power1',
            yoyo: true,
            repeat: -1,
            onRepeat: () => {
                if (this.timerState == '⏸️') {
                    this.pauseTween.pause();
                }
            }
        });
        let pauseGraphics = this.add.graphics();
        pauseGraphics.lineStyle(1, 0xffffff);
        pauseGraphics.strokeRect(this.SCREEN_WIDTH - 40, 10, 30, 30);
        let pauseContainer = this.add.container(this.SCREEN_WIDTH - 25, 25);
        pauseContainer.setSize(30, 30);
        pauseContainer.setInteractive({ useHandCursor: true });
        pauseContainer.on('pointerdown', () => {
            this.clickPause();
        });

        // アイテム表示用テキストの初期化
        this.itemTexts = [];
        for (let i = 0; i < 30; ++i) {
            this.itemTexts.push(this.add.text(10 + 25 * i, 60, " ").setFontSize(20).setFill('#fff'));
        }

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
        this.viewGraphics = this.add.graphics();
        this.viewText = this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5);

        this.drawStatus();
        this.drawPause();

        this.createMap();
        this.drawMap();

        this.createChoice();
        this.drawChoice(-1);

        this.createSelection();
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
        this.choiceTexts = [];
        for (let i = 0; i < 3; ++i) {
            this.choiceTexts.push(this.add.text(10, 10, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5));
        }
        // クリッカブル要素を追加
        let choiceContainer1 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY - this.CHOICE_HEIGHT - this.CHOICE_SPACE);
        choiceContainer1.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer1.setInteractive({ useHandCursor: true });
        choiceContainer1.on("pointerdown", () => {
            this.clickChoice(0);
        });
        let choiceContainer2 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY);
        choiceContainer2.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer2.setInteractive({ useHandCursor: true });
        choiceContainer2.on("pointerdown", () => {
            this.clickChoice(1);
        });
        let choiceContainer3 = this.add.container(this.MAP_OFFSET_X / 2, this.cameras.main.centerY + this.CHOICE_HEIGHT + this.CHOICE_SPACE);
        choiceContainer3.setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        choiceContainer3.setInteractive({ useHandCursor: true });
        choiceContainer3.on("pointerdown", () => {
            this.clickChoice(2);
        });
    }
    private createSelection() {
        this.selectionGroup = this.add.group();
        this.selectionGraphics = this.add.graphics();
        this.selectionTexts = [];
        this.selectionContainers = [];
        for (let i = 0; i < 9; ++i) {
            this.selectionTexts.push(this.add.text(1000, 1000, " ").setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(5));
            
            // クリッカブル要素を追加
            this.selectionContainers.push(this.add.container(1000, 1000));
            this.selectionContainers[i].setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
            this.selectionContainers[i].setInteractive({ useHandCursor: true });
            this.selectionContainers[i].on("pointerdown", () => {
                this.clickSelection(i);
            });
        }
        for (let text of this.selectionTexts) {
            this.selectionGroup.add(text);
        }
        this.selectionConfirmText = this.add.text(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2, "Choose 1 item").setFontSize(20).setFill('#fff').setOrigin(0.5).setAlign('center');
        this.selectionConfirmText.setInteractive({ useHandCursor: true });
        this.selectionConfirmText.on("pointerdown", () => {
            this.clickSelectionConfirm();
        });
        this.selectionGroup.add(this.selectionConfirmText);
        this.selectionGroup.add(this.selectionGraphics);
        this.selectionGroup.setAlpha(0);
    }
    private startSelection() {
        this.drawSelection(-1);
        this.tweens.add({
            targets: this.selectionGroup.getChildren(),
            duration: 250,
            ease: 'Power1',
            alpha: 1
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
        this.drawView();

        if (this.tick == 3) {
            this.timerState = '▶️';
            this.drawStatus();
            this.drawPause();
            this.startSelection();
        }
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

    // 右上のポーズクリック
    private clickPause() {
        this.timerState = (this.timerState == '▶️' ? '⏸️' : '▶️');
        this.drawPause();
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
            this.viewItem = -1; // マップをクリックしたらアイテムも未選択にする
            this.checkAndEnableConfirmButton();
        }
        this.drawMap(this.mapX, this.mapY);
    }

    // 左側選択肢をクリック
    private clickChoice(choice: number) {
        if (this.choice == choice) {
            this.choice = -1;
        } else {
            this.choice = choice;
        }
        this.checkAndEnableConfirmButton();
        this.drawChoice(this.choice);
    }

    // 全体選択画面の選択肢をクリック
    private clickSelection(selection: number) {
        if (this.selection == selection) {
            this.selection = -1;
        } else {
            this.selection = selection;
        }
        this.drawSelection(this.selection);
    }

    // 配置ボタンの有効無効を判定
    private checkAndEnableConfirmButton() {
        if (this.choice != -1 && 0 <= this.mapX && 0 <= this.mapY && !this.unitMap[this.mapY][this.mapX] && this.checkPurchasable()) {
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

    // アイテム選択画面を完了→アイテム追加処理
    private clickSelectionConfirm() {
        if (this.selection == -1) {
            return;
        }
        // アイテム追加
        this.items.push({ symbol: this.selections[this.selection], addTick: this.tick });
        let i = this.items.length - 1;
        this.itemTexts[i].setText(this.items[i].symbol);
        this.itemTexts[i].setInteractive({ useHandCursor: true });
        this.itemTexts[i].on("pointerdown", () => {
            this.clickItem(i);
        });

        // 画面隠し
        for (let i = 0; i < 9; ++i) {
            this.selectionTexts[i].setPosition(1000, 1000).setText(' ');
            this.selectionContainers[i].setPosition(1000, 1000);
        }
        this.tweens.add({
            targets: this.selectionGroup.getChildren(),
            duration: 250,
            ease: 'Power1',
            alpha: 0
        });
    }

    // ステータス下の、既に取得したアイテムを選択(内容確認)
    private clickItem(item: number) {
        this.viewItem = (this.viewItem == item ? -1 : item);
        this.drawView();
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
        this.statusText.setText("Time: " + this.tick + ', Inventory: ' + this.getSimpleTextFromObject(this.inventory));
    }

    // 右上のポーズボタンを更新する
    private drawPause() {
        this.pauseText.setText(this.timerState);
        if (this.timerState == '▶️') {
            this.pauseTween.resume();
        }
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

        this.drawView();
    }

    // シンボルからスペックテキストを取得
    private getSimpleTextFromObject(obj) {
        return JSON.stringify(obj).replace(/"/g, '').replace(/([^{,]+):(\d+)/g, '$2$1').replace(/{([^,]+)}/, '$1');
    }
    private getTextFromUnitSpec(symbol: string, noCost: boolean = false) {
        let spec = this.UNIT_SPEC[symbol];
        let meta = '';
        if (spec.type == "GAIN") {
            meta = '+' + this.getSimpleTextFromObject(spec.meta1);
        } else if (spec.type == "CONVERT") {
            meta = '-' + this.getSimpleTextFromObject(spec.meta1) + '->+' + this.getSimpleTextFromObject(spec.meta2);
        }
        return symbol + ': ' + spec.name + '\n' + meta + ' / ' + spec.tick +
            (noCost ? '' : '\n' + 'Cost: -' + this.getSimpleTextFromObject(spec.cost));
    }
    private getTextSpecFromMap() {
        let unit = this.unitMap[this.mapY][this.mapX];
        let symbol = unit.symbol;
        let spec = this.UNIT_SPEC[symbol];

        return this.getTextFromUnitSpec(symbol, true) + '\n' + (spec.tick - (this.tick - unit.addTick) % spec.tick);
    }
    private getTextFromItemSpec(symbol: string) {
        let spec = this.ITEM_SPEC[symbol];
        return symbol + ': ' + spec.name + '\n' + spec.desc;
    }

    // 左側の選択肢を描画
    private drawChoice(choice: number) {
        let textStartX = this.MAP_OFFSET_X / 2;

        this.choiceTexts[0].setText(this.getTextFromUnitSpec(this.choices[0]));
        this.choiceTexts[0].setPosition(textStartX, this.cameras.main.centerY - this.CHOICE_HEIGHT - this.CHOICE_SPACE);
        this.choiceTexts[1].setText(this.getTextFromUnitSpec(this.choices[1]));
        this.choiceTexts[1].setPosition(textStartX, this.cameras.main.centerY);
        this.choiceTexts[2].setText(this.getTextFromUnitSpec(this.choices[2]));
        this.choiceTexts[2].setPosition(textStartX, this.cameras.main.centerY + this.CHOICE_HEIGHT + this.CHOICE_SPACE);

        // 枠線のスタイルを設定
        let startX = (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2;

        // 枠線の矩形を描画
        this.choiceGraphics.lineStyle(1, (choice == 0 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2 - this.CHOICE_HEIGHT - this.CHOICE_SPACE, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        this.choiceGraphics.lineStyle(1, (choice == 1 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        this.choiceGraphics.lineStyle(1, (choice == 2 ? 0xffff00 : this.LINE_COLOR));
        this.choiceGraphics.strokeRect(startX, this.cameras.main.centerY - this.CHOICE_HEIGHT / 2 + this.CHOICE_HEIGHT + this.CHOICE_SPACE, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
    }

    // 全画面アイテム選択画面 (別関数でアルファを更新)
    private drawSelection(selection: number) {
        let space = 30;
        // 外枠・背景
        this.selectionGraphics.fillStyle(0x000000, 1);
        this.selectionGraphics.fillRect(0, this.MAP_OFFSET_Y - space, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.selectionGraphics.lineStyle(1, 0xffffff);
        this.selectionGraphics.strokeRect(0, this.MAP_OFFSET_Y - space, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        for (let i = 0; i < 9; ++i) {
            if (this.selections.length <= i) {
                this.selectionTexts[i].setPosition(1000, 1000).setText(' ');
                this.selectionContainers[i].setPosition(1000, 1000);
                continue;
            }
            let x = this.cameras.main.centerX;
            if (4 <= this.selections.length && this.selections.length <= 6) {
                x = (i <= 2 ? x - (this.CHOICE_WIDTH + this.CHOICE_SPACE) / 2 : x + (this.CHOICE_WIDTH + this.CHOICE_SPACE) / 2);
            } else if (7 <= this.selections.length && this.selections.length <= 9) {
                x = (i <= 2
                    ? x - this.CHOICE_WIDTH - this.CHOICE_SPACE
                    : 6 <= i
                        ? x + this.CHOICE_WIDTH + this.CHOICE_SPACE
                        : x);
            }
            let y = this.cameras.main.centerY;

            y = (i % 3 == 0
                ? y - this.CHOICE_HEIGHT - this.CHOICE_SPACE
                : i % 3 == 2
                    ? y + this.CHOICE_HEIGHT + this.CHOICE_SPACE
                    : y);

            // 矩形を描画
            this.selectionGraphics.lineStyle(1, i == selection ? 0xffff00 : 0xffffff);
            this.selectionGraphics.strokeRect(x - this.CHOICE_WIDTH / 2, y - this.CHOICE_HEIGHT / 2, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
            // テキストを描画
            this.selectionTexts[i].setPosition(x, y).setText(this.getTextFromItemSpec(this.selections[i]));
            this.selectionConfirmText.setFill(selection == -1 ? '#999' : '#ff0');
            // クリッカブルを配置
            this.selectionContainers[i].setPosition(x, y);
        }

    }
    // 右側の説明を描画(選択中はtickごとに更新)
    private drawView() {
        if ((this.mapX < 0 || this.mapY < 0 || !this.unitMap[this.mapY][this.mapX]) && this.viewItem < 0) {
            this.viewGraphics.clear();
            this.viewText.setText(" ");
            return;
        }

        // 枠線の矩形を描画
        let startX = this.SCREEN_WIDTH - (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2 - this.CHOICE_WIDTH;
        let startY = this.cameras.main.centerY - this.CHOICE_HEIGHT / 2;
        this.viewGraphics.lineStyle(1, 0x00ffff);
        this.viewGraphics.strokeRect(startX, startY, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);

        this.viewText.setText(0 <= this.viewItem ? this.getTextFromItemSpec(this.items[this.viewItem].symbol) : this.getTextSpecFromMap());
        this.viewText.setPosition(this.SCREEN_WIDTH - this.MAP_OFFSET_X / 2, this.cameras.main.centerY);
    }
}
