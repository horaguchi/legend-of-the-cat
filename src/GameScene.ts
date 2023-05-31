import * as Phaser from 'phaser';
// 型群
type UnitType = "GAIN" | "CONVERT" | "TERRAIN";
type ItemType = "INSTANT" | "VICTORY";
type TerrainType = "💪" | "⏱";
type SelectionType = 'NONE' | "ITEM" | "UNIT" | 'RUIN';
type TimerState = "⏸️" | "▶️";
// 定数群
const SCREEN_WIDTH = 960; // スクリーンの横幅
const SCREEN_HEIGHT = 540; // スクリーンの縦幅
const MAP_WIDTH = 9; // マップの横幅（マス数）
const MAP_HEIGHT = 9; // マップの縦幅（マス数）
const CELL_SIZE = 32; // 1マスのサイズ（ピクセル数）
const LINE_COLOR = 0xffffff; // 線の色
const MAP_OFFSET_X = (SCREEN_WIDTH - CELL_SIZE * MAP_WIDTH) / 2; // マップの横幅（マス数）
const MAP_OFFSET_Y = (SCREEN_HEIGHT - CELL_SIZE * MAP_HEIGHT) / 2; // マップの横幅（マス数）
const CHOICE_WIDTH = 300;
const CHOICE_HEIGHT = 80;
const CHOICE_FONT_SIZE = 16;
const CHOICE_SPACE = 15;
const TEXT_STYLE = { testString: "😀|MÃ‰qgy" } as const;
// ユニットデータ
const UNIT_SPEC: Record<string, {
    tier: number,
    name: string,
    cost: Record<string, number>,
    require?: Record<string, number>,
    type: UnitType,
    meta1: Record<string, number>,
    meta2?: Record<string, number>,
    tick?: number
}> = {
    "😀": { tier: 1, name: "Smily", cost: { "💰": 100 }, type: "GAIN", meta1: { "💰": 10 }, tick: 10 },
    "😄": { tier: 2, name: "Smily", cost: { "💰": 400 }, type: "GAIN", meta1: { "💰": 40 }, tick: 20 },
    "🤣": { tier: 3, name: "Smily", cost: { "💰": 900 }, type: "GAIN", meta1: { "💰": 90 }, tick: 30 },
    "⛏": { tier: 1, name: "Mining", cost: { "💰": 50 }, type: "GAIN", meta1: { "🪨": 10 }, tick: 5 },
    "⚒": { tier: 2, name: "Mining", cost: { "🪨": 500 }, require: { "Mining": 3 }, type: "GAIN", meta1: { "🪨": 30 }, tick: 10 },
    "🗜": { tier: 3, name: "Mining", cost: { "🪨": 1000 }, require: { "Mining": 6 }, type: "CONVERT", meta1: { "🪨": 100 }, meta2: { "💰": 50 }, tick: 20 },
    // Water-Cat
    "💧": { tier: 1, name: "Water", cost: { "💰": 50 }, type: "GAIN", meta1: { "💧": 1 }, tick: 10 },
    "🫗": { tier: 2, name: "Water", cost: { "💰": 200 }, type: "GAIN", meta1: { "💧": 3 }, tick: 12 },
    "⛲": { tier: 3, name: "Water", cost: { "💰": 1250 }, type: "GAIN", meta1: { "💧": 8 }, tick: 16 },
    "😺": { tier: 1, name: "Cat", cost: { "💰": 50 }, type: "CONVERT", meta1: { "💧": 1 }, meta2: { "💰": 12 }, tick: 8 },
    "😹": { tier: 2, name: "Cat", cost: { "💰": 125 }, type: "CONVERT", meta1: { "💧": 3 }, meta2: { "💰": 36 }, tick: 15 },
    "😻": { tier: 3, name: "Cat", cost: { "💰": 400 }, type: "CONVERT", meta1: { "💧": 2 }, meta2: { "💰": 24 }, tick: 6 },
    // Factory-Store
    "🛖": { tier: 1, name: "Factory", cost: { "💰": 100 }, type: "GAIN", meta1: { "🛢️": 1 }, tick: 10 },
    "🏢": { tier: 2, name: "Factory", cost: { "💰": 300 }, require: { "Factory": 2 }, type: "GAIN", meta1: { "⚙️": 1 }, tick: 20 },
    "🏭": { tier: 3, name: "Factory", cost: { "💰": 700 }, require: { "Factory": 5 }, type: "GAIN", meta1: { "🧰": 1 }, tick: 30 },
    "🏠": { tier: 1, name: "Store", cost: { "💰": 100 }, type: "CONVERT", meta1: { "🛢️": 1 }, meta2: { "💰": 25 }, tick: 10 },
    "🏪": { tier: 2, name: "Store", cost: { "💰": 300 }, require: { "Store": 2 }, type: "CONVERT", meta1: { "⚙️": 1 }, meta2: { "💰": 100 }, tick: 20 },
    "🏬": { tier: 3, name: "Store", cost: { "💰": 700 }, require: { "Store": 5 }, type: "CONVERT", meta1: { "🧰": 1 }, meta2: { "💰": 250 }, tick: 30 },
    // TERRAIN
    '🦵': { tier: 1, name: "Speed Tower", cost: { '💰': 50 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '⏱': 5 } },
    '🦿': { tier: 2, name: "Speed Tower", cost: { '💰': 200 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '⏱': 10 } },
    '🦼': { tier: 3, name: "Speed Tower", cost: { '💰': 800 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '⏱': 20 } },
    '🕯️': { tier: 1, name: "Power Tower", cost: { '💰': 50 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '💪': 5 } },
    '💡': { tier: 2, name: "Power Tower", cost: { '💰': 200 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '💪': 10 } },
    '🪩': { tier: 3, name: "Power Tower", cost: { '💰': 800 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '💪': 20 } },
} as const;
// アイテムデータ
const ITEM_SPEC: Record<string, {
    name: string,
    desc: string,
    type: ItemType,
    meta1: Record<string, number>,
    meta2?: Record<string, number>,
}> = {
    '🦺': { name: 'Safety Vest', desc: 'All negative terrain effects will be eliminated.', type: "INSTANT", meta1: { '🦺': 1 } }, // TODO
    '👓': { name: 'Glasses', desc: 'Get 1👨‍💼, each requires one less (Min 1).', type: "INSTANT", meta1: { '👨‍💼': 1 } },
    '👔': { name: 'Necktie', desc: 'Get 1👨‍💼, each requires one less (Min 1).', type: "INSTANT", meta1: { '👨‍💼': 1 } },
    '👷': { name: 'Construction', desc: 'Effects on all tiles.', type: "INSTANT", meta1: {} },
    '📗': { name: 'Green Book', desc: 'Get 1📃, one more initial option for the unit.', type: "INSTANT", meta1: { '📃': 1 } },
    '📘': { name: 'Blue Book', desc: 'Get 1📃, one more initial option for the unit.', type: "INSTANT", meta1: { '📃': 1 } },
    '📙': { name: 'Orange Book', desc: 'Get 1📃, one more initial option for the unit.', type: "INSTANT", meta1: { '📃': 1 } },
    '🖥': { name: 'Desktop Computer', desc: 'Get 1💾, one more option for the item.', type: "INSTANT", meta1: { '💾': 1 } },
    '💻': { name: 'Raptop Computer', desc: 'Get 1💾, one more option for the item.', type: "INSTANT", meta1: { '💾': 1 } },
    '📈': { name: 'Inflation', desc: 'All unit amounts will be increased by 10%.', type: "INSTANT", meta1: { '📈': 1 } },
    '🪄': { name: 'Magic Wand', desc: 'The speed of all units is increased by 10%.', type: "INSTANT", meta1: { '🪄': 1 } },
    '👗': { name: 'Dress', desc: 'Get 1💎', type: "INSTANT", meta1: { "💎": 1 } },
    '🎫': { name: 'Ticket', desc: 'Units can be purchased at 10% off.', type: "INSTANT", meta1: { '🎫': 1 } },
    '🀀': { name: 'Mahjong: East Wind', desc: 'Nothing happens. BUT...?', type: 'INSTANT', meta1: { '🀀': 1 } },
    '🀁': { name: 'Mahjong: East South', desc: 'Nothing happens. BUT...?', type: 'INSTANT', meta1: { '🀁': 1 } },
    '🀂': { name: 'Mahjong: East West', desc: 'Nothing happens. BUT...?', type: 'INSTANT', meta1: { '🀂': 1 } },
    '🀃': { name: 'Mahjong: East North', desc: 'Nothing happens. BUT...?', type: 'INSTANT', meta1: { '🀃': 1 } },
    '🀫': { name: 'Mahjong', desc: 'After get 🀀🀁🀂🀃, you win!', type: 'VICTORY', meta1: { '🀀': 1, '🀁': 1, '🀂': 1, '🀃': 1 } },
    '🤑': { name: 'Feeling rich', desc: 'After saving 10000💰, you win!', type: "VICTORY", meta1: { '💰': 10000 } },
} as const;
// 破滅データ
const RUIN_SPEC: Record<string, {
    name: string,
    meta1: Record<string, number>,
    meta2: Record<string, number>,
}> = {
    '💀': { name: 'Death', meta1: {}, meta2: { '🧡': -3 } },
    '💸': { name: 'Waste', meta1: { '💰': 1000 }, meta2: { '🧡': -2 } },
    '🦹': { name: 'Greed', meta1: { '💎': 1 }, meta2: { '🧡': -1 } },
    '📉': { name: 'Crash', meta1: { '🪄': 1, '📈': 1, }, meta2: { '🧡': -1 } },
} as const;
// もろもろアイデア
// https://keep.google.com/#NOTE/1wl3GLy9D5GX4WOZYGKLN8Hl4MAvv5Ub-iSqynsdDpjRSdg2e5ZpWAB_pHPUtOJXFf-CBhw

export class GameScene extends Phaser.Scene {
    private unitMap: {
        symbol: string,
        baseTick: number,
        x: number,
        y: number
    }[][] = [];
    private units: {
        symbol: string,
        baseTick: number,
        x: number,
        y: number
    }[] = [];
    private textMap: Phaser.GameObjects.Text[][] = []; // 表示用テキストマップデータ
    private textTweenMap: Phaser.Tweens.Tween[][] = []; // 表示用テキストアニメマップデータ
    private terrainMap: Record<TerrainType, number>[][] = [];
    private adjacentMap: Record<string, number>[][] = [];
    private mapGraphics: Phaser.GameObjects.Graphics;
    private mapX: number = -1;
    private mapY: number = -1;
    private itemTexts: Phaser.GameObjects.Text[] = []; // アイテム表示用テキストデータ
    private items: {
        symbol: string,
        addTick: number,
    }[] = [];
    private ruins: {
        symbol: string,
        addTick: number,
    }[] = [];
    private choiceGraphics: Phaser.GameObjects.Graphics;
    private choiceTexts: Phaser.GameObjects.Text[] = [];
    private choice: number = -1; // 今選択している左のユニット
    private choices: string[] = Object.keys(UNIT_SPEC).filter((symbol) => { return UNIT_SPEC[symbol].tier == 1 }).sort((a, b) => 0.5 - Math.random()).slice(0, 3);
    private selectionGroup: Phaser.GameObjects.Group;
    private selectionGraphics: Phaser.GameObjects.Graphics;
    private selectionTexts: Phaser.GameObjects.Text[] = [];
    private selectionContainers: Phaser.GameObjects.Container[] = [];
    private selectionConfirmText: Phaser.GameObjects.Text;
    private selectionConfirmContainer: Phaser.GameObjects.Container;
    private selectionType: SelectionType = 'NONE';
    private selections: string[] = []; // 選択するための選択肢
    private selection: number = -1; // 今選択しているもの
    private multiSelection: Record<number, boolean>; // 今選択しているもの(複数)
    private viewGraphics: Phaser.GameObjects.Graphics;
    private viewTexts: Phaser.GameObjects.Text[] = [];
    private viewItem: number = -1; // 今選択しているアイテム
    private statusText: Phaser.GameObjects.Text;
    private pauseText: Phaser.GameObjects.Text;
    private pauseTween: Phaser.Tweens.Tween;
    private confirmText: Phaser.GameObjects.Text;
    private confirmGraphics: Phaser.GameObjects.Graphics;
    private victoryOK: boolean = false;
    private gameoverOK: boolean = false;
    private tick: number = 0;
    private inventory: Record<string, number> = { "💰": 200, '🧡': 10, '💾': 10 };
    private timerState: TimerState = '▶️';

    constructor() {
        super("game");
    }

    preload(): void {
        // 画像の読み込み
        //this.load.image('noimage', 'assets/noimage.gif'); // 透明
    }

    create(): void {
        // ステータス表示用テキストの初期化
        this.statusText = this.add.text(10, 10, "  ", TEXT_STYLE).setFontSize(20).setFill('#fff');
        // ポーズ要素の初期化
        this.createPause();
        // アイテム表示用テキストの初期化
        for (let i = 0; i < 30; ++i) {
            this.itemTexts.push(this.add.text(20 + 25 * i, 70, " ", TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5));
        }
        // 配置ボタンの初期化
        this.confirmText = this.add.text(this.cameras.main.centerX, SCREEN_HEIGHT - MAP_OFFSET_Y / 2, "Purchase and place it there").setFontSize(20).setFill('#999').setOrigin(0.5);
        this.confirmGraphics = this.add.graphics();
        let confirmContainer = this.add.container(this.cameras.main.centerX, SCREEN_HEIGHT - MAP_OFFSET_Y / 2).setSize(400, 40);
        confirmContainer.setInteractive({ useHandCursor: true });
        confirmContainer.on('pointerdown', () => {
            this.clickConfirm();
        });
        // 右側、説明表示用オブジェクトを作成する
        this.viewGraphics = this.add.graphics();
        let textY = this.cameras.main.centerY - CHOICE_HEIGHT - CHOICE_SPACE;
        for (let i = 0; i < 3; ++i) {
            // テキストの追加
            this.viewTexts.push(this.add.text(10, 10, " ", TEXT_STYLE).setFontSize(CHOICE_FONT_SIZE).setPosition(SCREEN_WIDTH - MAP_OFFSET_X / 2, textY).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3));
            textY += CHOICE_HEIGHT + CHOICE_SPACE;
        }
        // タイマーイベントを設定する
        let timer = this.time.addEvent({
            delay: 500, // 1秒ごとに更新
            callback: this.updateTimer, // タイマーを更新するコールバック関数
            callbackScope: this,
            loop: true // 繰り返し実行
        });
        // 各種初期化
        this.createMap();
        this.createChoice();
        this.createSelection();
        // 各種描画
        this.drawStatus();
        this.drawConfirmButton();
        this.drawPause();
        this.drawMap();
        this.drawChoice();
    }
    private createPause(): void {
        // ポーズボタン用テキスト・クリッカブル要素の初期化
        this.pauseText = this.add.text(SCREEN_WIDTH - 25, 25, this.timerState, TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5);
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
        // 枠線
        this.add.graphics().lineStyle(1, 0xffffff).strokeRect(SCREEN_WIDTH - 40, 10, 30, 30);
        let pauseContainer = this.add.container(SCREEN_WIDTH - 25, 25).setSize(30, 30);
        pauseContainer.setInteractive({ useHandCursor: true });
        pauseContainer.on('pointerdown', () => {
            this.clickPause();
        });
    }
    private createMap(): void {
        // ユニットマップを初期化する
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.unitMap.push([]);
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.unitMap[y][x] = null;
            }
        }
        // 近隣情報マップを初期化する
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.adjacentMap.push([]);
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.adjacentMap[y][x] = null;
            }
        }
        // 地形マップを初期化する
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.terrainMap.push([]);
            for (let x = 0; x < MAP_WIDTH; x++) {
                // 初期地形ランダム
                this.terrainMap[y][x] = Math.random() < 0.05 ? this.getRandomTerrain() : null;
            }
        }
        // 地形・枠線描画用オブジェクトを作成する(背景のため、テキストマップより先に描画)
        this.mapGraphics = this.add.graphics();
        let mapContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setSize(MAP_WIDTH * CELL_SIZE, MAP_HEIGHT * CELL_SIZE);
        mapContainer.setInteractive({ useHandCursor: true });
        mapContainer.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickMap(pointer);
        });
        // テキストマップ、アニメマップを初期化する
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.textMap.push([]);
            this.textTweenMap.push([]);
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.textMap[y][x] = this.add.text(
                    x * CELL_SIZE + MAP_OFFSET_X + CELL_SIZE / 2,
                    y * CELL_SIZE + MAP_OFFSET_Y + CELL_SIZE / 2,
                    " ", TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5);
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
    }
    private getRandomTerrain(): Record<TerrainType, number> {
        let value: number;
        if (Math.random() < 0.05) { // 5%
            value = 50;
        } else if (Math.random() < 0.2) { // 15%
            value = 30;
        } else if (Math.random() < 0.4) { // 20%
            value = 20;
        } else if (Math.random() < 0.6) { // 20%
            value = 10;
        } else if (Math.random() < 0.8) { // 20%
            value = -20;
        } else if (Math.random() < 0.95) { // 15%
            value = -30;
        } else if (Math.random() < 1.0) { // 5%
            value = -50;
        }
        let key: TerrainType = (Math.random() < 0.5 ? "💪" : "⏱");
        return {
            "💪": key == "💪" ? value : 0,
            "⏱": key == "⏱" ? value : 0,
        };
    }
    private createChoice(): void {
        this.choiceGraphics = this.add.graphics();
        let y = this.cameras.main.centerY - CHOICE_HEIGHT - CHOICE_SPACE;
        for (let i = 0; i < 3; ++i) {
            // テキストの追加
            this.choiceTexts.push(this.add.text(10, 10, " ", TEXT_STYLE).setFontSize(CHOICE_FONT_SIZE).setPosition(MAP_OFFSET_X / 2, y).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3));
            // クリッカブル要素を追加
            let choiceContainer = this.add.container(MAP_OFFSET_X / 2, y).setSize(CHOICE_WIDTH, CHOICE_HEIGHT);
            choiceContainer.setInteractive({ useHandCursor: true });
            choiceContainer.on("pointerdown", () => {
                this.clickChoice(i);
            });
            // 下にずらす
            y += CHOICE_HEIGHT + CHOICE_SPACE;
        }
    }
    private createSelection(): void {
        this.selectionGroup = this.add.group();
        this.selectionGraphics = this.add.graphics();
        for (let i = 0; i < 9; ++i) {
            // テキストの追加
            this.selectionTexts.push(this.add.text(1000, 1000, " ", TEXT_STYLE).setFontSize(CHOICE_FONT_SIZE).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3));
            // クリッカブル要素を追加
            this.selectionContainers.push(this.add.container(1000, 1000).setSize(CHOICE_WIDTH, CHOICE_HEIGHT));
            this.selectionContainers[i].setInteractive({ useHandCursor: true });
            this.selectionContainers[i].on("pointerdown", () => {
                this.clickSelection(i);
            });
        }
        for (let text of this.selectionTexts) {
            this.selectionGroup.add(text);
        }
        this.selectionConfirmText = this.add.text(this.cameras.main.centerX, SCREEN_HEIGHT - MAP_OFFSET_Y / 2, "Choose 1 item").setFontSize(20).setFill('#fff').setOrigin(0.5).setAlign('center');
        this.selectionConfirmContainer = this.add.container(1000, 1000).setSize(400, 40);
        this.selectionConfirmContainer.setInteractive({ useHandCursor: true });
        this.selectionConfirmContainer.on("pointerdown", () => {
            this.clickSelectionConfirm();
        });
        this.selectionGroup.add(this.selectionConfirmText);
        this.selectionGroup.add(this.selectionGraphics);
        this.selectionGroup.setAlpha(0);
    }
    private startSelection(type: SelectionType = 'ITEM'): void {
        this.selectionType = type;
        if (type == 'ITEM') {
            let itemNumber = Math.min((this.inventory['💾'] ?? 0) + 3, 9);
            this.selections = Object.keys(ITEM_SPEC).sort((a, b) => 0.5 - Math.random()).slice(0, itemNumber);
            this.selection = -1;
            this.selectionConfirmText.setText('Choose 1 item');
        } else if (type == 'UNIT') {
            let unitNumber = Math.min((this.inventory['📃'] ?? 0) + 4, 9);
            this.selections = Object.keys(UNIT_SPEC).sort((a, b) => 0.5 - Math.random()).slice(0, unitNumber);
            this.selectionConfirmText.setText('Choose 3 units');
            this.multiSelection = {};
        } else if (type == 'RUIN') {
            let ruinNumber = Math.min((this.inventory['未定'] ?? 0) + 2, 9);
            // 冒頭の 💀 Death は必ず含む
            this.selections = ['💀'].concat(Object.keys(RUIN_SPEC).slice(1).sort((a, b) => 0.5 - Math.random()).slice(0, ruinNumber));
            this.selection = -1;
            this.selectionConfirmText.setText('Choose 1 ruin');
        }
        this.drawSelection();
        this.tweens.add({
            targets: this.selectionGroup.getChildren(),
            duration: 250,
            ease: 'Power1',
            alpha: 1
        });
    }
    private startVictory(): void {
        this.createAndDrawScreen("VICTORY", '#000', 0xffffff);
    }
    private startGameover(): void {
        this.createAndDrawScreen("GAME OVER", '#fff', 0x000000);
    }

    update(): void {
        this.tweens.update();
    }

    // 時間経過ごとの処理
    private updateTimer(): void {
        if (this.timerState == '▶️') {
            return;
        }
        this.tick++;
        this.resolveUnits();
        this.resolveItems();
        this.drawStatus(); // 資源の増減があるので描画
        this.drawConfirmButton(); // 資源の増減で購入可能が変化するので描画
        this.drawView(); // tick の変更を更新するので描画
        if (this.victoryOK) {
            this.timerState = '▶️';
            this.drawPause();
            this.startVictory();
        } else if (this.gameoverOK) {
            // ゲームオーバーはポーズ中に処理されるので時間経過に来ない
        } else if (this.tick == 2 || (this.tick % 100 == 0 && this.tick % 500 != 0)) {
            this.timerState = '▶️';
            this.drawPause();
            this.startSelection('ITEM');
        } else if (this.tick == 4 || (this.tick % 50 == 0 && this.tick % 100 != 0)) {
            this.timerState = '▶️';
            this.drawPause();
            this.startSelection('UNIT');
        } else if (this.tick == 6 || this.tick % 500 == 0) {
            this.timerState = '▶️';
            this.drawPause();
            this.startSelection('RUIN');
        }
    }
    // 量計算処理
    private getMetaByCalc(meta: Record<string, number>, terrain: Record<TerrainType, number> = null): Record<string, number> {
        let itemBonus = (this.inventory['📈'] ?? 0) * 10;
        let terrainBonus = ((terrain && terrain['💪']) ?? 0);
        return (itemBonus || terrainBonus) ? Object.fromEntries(
            Object.entries(meta).map(([key, value]) => {
                let newValue = Math.round(value * (100 + terrainBonus + itemBonus) / 100);
                return [key, newValue];
            })
        ) : meta;
    }
    // スピード計算処理(1より小さくはならない)
    private getTickByCalc(tick: number, terrain: Record<TerrainType, number> = null): number {
        let itemBonus = (this.inventory['🪄'] ?? 0) * 10;
        let terrainBonus = ((terrain && terrain['⏱']) ?? 0);
        return Math.max(1, ((itemBonus || terrainBonus) ? Math.round(tick * 100 / (100 + terrainBonus + itemBonus)) : tick));
    }
    // ユニットの毎ターン解決処理
    private resolveUnits(): void {
        for (let unit of this.units) {
            let spec = UNIT_SPEC[unit.symbol];
            let terrain = this.terrainMap[unit.y][unit.x];
            if (spec.type != "GAIN" && spec.type != "CONVERT") {
                continue;
            }
            let calcTick = this.getTickByCalc(spec.tick, terrain);
            let count = (this.tick - unit.baseTick) % calcTick;
            // 各ユニットのアニメーション
            this.textMap[unit.y][unit.x].setScale(1 - 0.5 * (calcTick - count) / calcTick); // 0.5 ~ 1.0 を繰り返す
            if (count != 0) {
                continue;
            }
            unit.baseTick = this.tick; // 基点をリセット
            if (spec.type == "GAIN") {
                for (let [key, value] of Object.entries(this.getMetaByCalc(spec.meta1, terrain))) {
                    this.inventory[key] = (this.inventory[key] ?? 0) + value;
                }
            } else if (spec.type == "CONVERT") {
                let convertOK = true;
                let newMeta1 = this.getMetaByCalc(spec.meta1, terrain);
                for (let [key, value] of Object.entries(newMeta1)) {
                    if ((this.inventory[key] ?? 0) < value) {
                        convertOK = false;
                    }
                }
                if (!convertOK) {
                    continue;
                }
                for (let [key, value] of Object.entries(newMeta1)) {
                    this.inventory[key] -= value;
                }
                for (let [key, value] of Object.entries(this.getMetaByCalc(spec.meta2, terrain))) {
                    this.inventory[key] = (this.inventory[key] ?? 0) + value;
                }
            }
            // アニメ
            this.textTweenMap[unit.y][unit.x].resume();
        }
    }
    // ユニット追加時の処理(各ユニット毎1回のみ)
    private resolveAcquiredUnit(unit: { symbol: string, x: number, y: number }): void {
        let spec = UNIT_SPEC[unit.symbol];
        let x = unit.x, y = unit.y;
        let target = [
            [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
            [x - 1, y], [x + 1, y],
            [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
        ];
        let newMeta2 = (spec.type == "TERRAIN" ? this.getMetaByCalc(spec.meta2, this.terrainMap[y][x]) : {});
        for (let [targetX, targetY] of target) {
            if (targetX < 0 || MAP_WIDTH <= targetX || targetY < 0 || MAP_HEIGHT <= targetY) {
                continue;
            }
            // ユニットのシリーズを近隣情報に追加
            this.adjacentMap[targetY][targetX] = (this.adjacentMap[targetY][targetX] || {});
            this.adjacentMap[targetY][targetX][spec.name] = (this.adjacentMap[targetY][targetX][spec.name] ?? 0) + spec.tier;
            // 地形の場合は地形に追加
            if (spec.type == "TERRAIN") {
                let newTerrain: Record<TerrainType, number> = { '💪': 0, '⏱': 0 };
                this.terrainMap[targetY][targetX] = (this.terrainMap[targetY][targetX] || { '💪': 0, '⏱': 0 });
                this.terrainMap[targetY][targetX]['💪'] += newMeta2['💪'] ?? 0;
                this.terrainMap[targetY][targetX]['⏱'] += newMeta2['⏱'] ?? 0;
            }
        }
    }
    // アイテムの毎ターン解決処理
    private resolveItems(): void {
        for (let item of this.items) {
            let spec = ITEM_SPEC[item.symbol];
            if (spec.type == 'VICTORY') {
                let victoryOK = true;
                for (let [key, value] of Object.entries(spec.meta1)) {
                    if ((this.inventory[key] ?? 0) < value) {
                        victoryOK = false;
                    }
                }
                if (victoryOK) {
                    this.victoryOK = true;
                }
            }
        }
    }
    // アイテム追加時の処理(各アイテム毎1回のみ)
    private resolveAcquiredItem(item: { symbol: string }): void {
        let spec = ITEM_SPEC[item.symbol];
        if (item.symbol == '👷') { // Effects on all tiles.
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    // 地形効果がないところすべて
                    if (!(this.terrainMap[y][x] ?? false)) {
                        this.terrainMap[y][x] = this.getRandomTerrain();
                    }
                }
            }
            this.drawMap();
        }
        if (spec.type == "INSTANT") {
            for (let [key, value] of Object.entries(spec.meta1)) {
                this.inventory[key] = (this.inventory[key] ?? 0) + value;
            }
            this.drawStatus();
            this.drawChoice();
        }
    }
    // 破滅追加時の処理
    private resolveAcquiredRuin(ruin: { symbol: string }): void {
        let spec = RUIN_SPEC[ruin.symbol];
        for (let [key, value] of Object.entries(spec.meta1)) {
            this.inventory[key] = (this.inventory[key] ?? 0) - value;
        }
        for (let [key, value] of Object.entries(spec.meta2)) {
            this.inventory[key] = (this.inventory[key] ?? 0) + value;
        }
        if (this.inventory['🧡'] <= 0) {
            this.gameoverOK = true;
            this.startGameover();
        }
        this.drawStatus();
    }
    // 右上のポーズクリック
    private clickPause(): void {
        if (this.selectionType != 'NONE' || this.victoryOK || this.gameoverOK) {
            return;
        }
        this.timerState = (this.timerState == '▶️' ? '⏸️' : '▶️');
        this.drawPause();
    }
    // マップをクリック
    private clickMap(pointer: Phaser.Input.Pointer): void {
        // 現在のマウス位置から、クリックしたマスを計算
        let currentPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
        let mapX = Math.floor((currentPosition.x - MAP_OFFSET_X) / CELL_SIZE);
        let mapY = Math.floor((currentPosition.y - MAP_OFFSET_Y) / CELL_SIZE);
        if (mapX < 0 || MAP_WIDTH <= mapX || mapY < 0 || MAP_HEIGHT <= mapY) {
            return; // 範囲外クリック
        }
        // マップの選択
        if (mapX == this.mapX && mapY == this.mapY) {
            this.mapX = -1;
            this.mapY = -1;
        } else {
            this.mapX = mapX;
            this.mapY = mapY;
        }
        this.drawConfirmButton();
        this.drawMap();
    }
    // 左側選択肢をクリック
    private clickChoice(choice: number): void {
        this.choice = (this.choice == choice ? -1 : choice);
        this.drawConfirmButton();
        this.drawChoice();
    }
    // 配置ボタン押下→ユニットの作成処理
    private clickConfirm(): void {
        if (!this.checkPurchasable()) {
            return;
        }
        let symbol = this.choices[this.choice];
        let spec = UNIT_SPEC[symbol];
        for (let [key, value] of Object.entries(this.getCostByCalc(spec.cost))) {
            this.inventory[key] -= value;
        }
        this.unitMap[this.mapY][this.mapX] = { symbol: symbol, baseTick: this.tick, x: this.mapX, y: this.mapY };
        this.textMap[this.mapY][this.mapX].setText(symbol);
        this.units.push(this.unitMap[this.mapY][this.mapX]);
        this.resolveAcquiredUnit(this.unitMap[this.mapY][this.mapX]);
        this.drawConfirmButton();
        this.drawStatus();
        this.drawMap();
    }
    // 全体選択画面の選択肢をクリック
    private clickSelection(selection: number): void {
        if (this.selectionType == 'ITEM' || this.selectionType == 'RUIN') {
            this.selection = (this.selection == selection ? -1 : selection);
        } else if (this.selectionType == 'UNIT') {
            if (this.multiSelection[selection]) {
                delete this.multiSelection[selection];
            } else {
                this.multiSelection[selection] = true;
            }
        }
        this.drawSelection();
    }
    // アイテム選択画面を完了→アイテム追加・ユニット交換処理
    private clickSelectionConfirm(): void {
        if (this.selectionType == 'ITEM') {
            if (this.selection == -1) {
                return;
            }
            // アイテム追加
            let item = { symbol: this.selections[this.selection], addTick: this.tick }
            this.items.push(item);
            let i = this.items.length - 1;
            this.itemTexts[i].setText(this.items[i].symbol);
            this.itemTexts[i].setInteractive({ useHandCursor: true });
            this.itemTexts[i].on("pointerdown", () => {
                this.clickItem(i);
            });
            // 追加時のアニメ
            let tween = this.tweens.add({
                targets: this.itemTexts[i],
                duration: 250,
                scaleX: 1.8,
                scaleY: 1.8,
                ease: 'Power1',
                yoyo: true,
            });
            this.resolveAcquiredItem(item);

        } else if (this.selectionType == 'UNIT') {
            if (Object.keys(this.multiSelection).length != 3) {
                return;
            }
            // ユニットを交換
            this.choices = Object.keys(this.multiSelection).map(i => this.selections[i]);
            this.choice = -1;
            this.drawChoice();
        } else if (this.selectionType == 'RUIN') {
            if (this.selection == -1 || !this.checkRuinable()) {
                return;
            }
            let ruin = { symbol: this.selections[this.selection], addTick: this.tick };
            this.ruins.push(ruin);
            this.resolveAcquiredRuin(ruin);
        }
        // 画面隠し
        for (let i = 0; i < 9; ++i) {
            this.selectionTexts[i].setPosition(1000, 1000).setText(' ');
            this.selectionContainers[i].setPosition(1000, 1000);
        }
        this.selectionConfirmContainer.setPosition(1000, 1000);
        this.tweens.add({
            targets: this.selectionGroup.getChildren(),
            duration: 250,
            ease: 'Power1',
            alpha: 0
        });
        this.selectionType = 'NONE';
    }
    // ステータス下の、既に取得したアイテムを選択(内容確認)
    private clickItem(item: number): void {
        this.viewItem = (this.viewItem == item ? -1 : item);
        this.drawView();
    }
    // コスト計算、1は下回らない
    private getCostByCalc(cost: Record<string, number>): Record<string, number> {
        return Object.fromEntries(
            Object.entries(cost).map(([key, value]) => {
                let newValue = Math.max(1, Math.round(value * (10 - (this.inventory['🎫'] ?? 0)) / 10));
                return [key, newValue];
            })
        );
    }
    // 必要ユニット計算、1は下回らない
    private getRequireByCalc(require: Record<string, number>): Record<string, number> {
        let requireBonus = this.inventory['👨‍💼'] ?? 0;
        return requireBonus ? Object.fromEntries(
            Object.entries(require).map(([key, value]) => {
                let newValue = Math.max(1, value - requireBonus);
                return [key, newValue];
            })
        ) : require;
    }
    // 購入可能か判定
    private checkPurchasable(): boolean {
        if (this.choice == -1 || this.mapX < 0 || this.mapY < 0 || this.unitMap[this.mapY][this.mapX]) {
            return false;
        }
        let symbol = this.choices[this.choice];
        let spec = UNIT_SPEC[symbol];
        // インベントリに必要コストがあるか確認
        for (let [key, value] of Object.entries(this.getCostByCalc(spec.cost))) {
            if ((this.inventory[key] ?? 0) < value) {
                return false;
            }
        }
        // 前提ユニットが不要であればもう購入可能ではある
        if (spec.require) {
            // 前提ユニットがあるか確認
            let adjacent = this.adjacentMap[this.mapY][this.mapX];
            for (let [key, value] of Object.entries(this.getRequireByCalc(spec.require))) {
                if (((adjacent && adjacent[key]) ?? 0) < value) {
                    return false;
                }
            }
        }
        return true;
    }
    // 破滅可能か判定
    private checkRuinable(): boolean {
        if (this.selection == -1) {
            return false;
        }
        let symbol = this.selections[this.selection];
        let spec = RUIN_SPEC[symbol];
        // インベントリに必要コストがあるか確認
        for (let [key, value] of Object.entries(spec.meta1)) {
            if ((this.inventory[key] ?? 0) < value) {
                return false;
            }
        }
        return true;
    }
    // ステータスを更新する
    private drawStatus(): void {
        this.statusText.setText("Time: " + this.tick + ', Inventory: ' + this.getSimpleTextFromObject(this.inventory));
    }
    // 右上のポーズボタンを更新する
    private drawPause(): void {
        this.pauseText.setText(this.timerState);
        if (this.timerState == '▶️') {
            this.pauseTween.resume();
        }
    }
    // 配置ボタンの有効無効を判定
    private drawConfirmButton(): void {
        let confirmOK = this.checkPurchasable();
        this.confirmText.setFill(confirmOK ? '#ff0' : '#999');
        this.confirmGraphics.lineStyle(1, confirmOK ? 0xffff00 : 0x909090);
        this.confirmGraphics.strokeRect(this.cameras.main.centerX - 200, SCREEN_HEIGHT - MAP_OFFSET_Y / 2 - 20, 400, 40);
    }
    // マップを描画する
    private drawMap() {
        this.mapGraphics.clear();
        let mapX = this.mapX, mapY = this.mapY;
        // 地形マップを描画する
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.terrainMap[y][x]) {
                    let value = this.terrainMap[y][x]['💪'] + this.terrainMap[y][x]['⏱'];
                    let color = (value < 0
                        ? Math.min(0x010000 * Math.abs(value) * 3, 0xff0000)
                        : 0 < value
                            ? Math.min(0x000100 * value * 3, 0x00ff00)
                            : 0x000000)
                    this.mapGraphics.fillStyle(color);
                    this.mapGraphics.fillRect(MAP_OFFSET_X + x * CELL_SIZE, MAP_OFFSET_Y + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
        // 縦の線を描画する
        this.mapGraphics.lineStyle(1, LINE_COLOR);
        for (let x = 0; x < MAP_WIDTH + 1; x++) {
            this.mapGraphics.beginPath();
            this.mapGraphics.moveTo(x * CELL_SIZE + MAP_OFFSET_X, MAP_OFFSET_Y);
            this.mapGraphics.lineTo(x * CELL_SIZE + MAP_OFFSET_X, MAP_HEIGHT * CELL_SIZE + MAP_OFFSET_Y);
            this.mapGraphics.strokePath();
        }
        // 横の線を描画する
        for (let y = 0; y < MAP_HEIGHT + 1; y++) {
            this.mapGraphics.beginPath();
            this.mapGraphics.moveTo(MAP_OFFSET_X, y * CELL_SIZE + MAP_OFFSET_Y);
            this.mapGraphics.lineTo(MAP_WIDTH * CELL_SIZE + MAP_OFFSET_X, y * CELL_SIZE + MAP_OFFSET_Y);
            this.mapGraphics.strokePath();
        }
        // 選択されているマップ
        if (0 <= mapX && 0 <= mapY) {
            this.mapGraphics.lineStyle(1, (this.unitMap[mapY][mapX] ? 0x00ffff : 0xffff00));
            this.mapGraphics.strokeRect(MAP_OFFSET_X + mapX * CELL_SIZE, MAP_OFFSET_Y + mapY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        this.drawView();
    }
    // シンボルからスペックテキストを取得
    private getSimpleTextFromObject(obj, suffix: string = ''): string {
        return JSON.stringify(obj).replace(/"/g, '').replace(/([^{,]+):(\d+)/g, '$2' + suffix + '$1').replace(/{([^,]+)}/, '$1');
    }
    private getTextFromUnitSpec(symbol: string, noCost: boolean = false, terrain: Record<TerrainType, number> = null): string {
        let spec = UNIT_SPEC[symbol];
        let meta = '';
        if (spec.type == "GAIN") {
            meta = this.getSimpleTextFromObject(this.getMetaByCalc(spec.meta1, terrain)) +
                ' / ' + this.getTickByCalc(spec.tick, terrain);
        } else if (spec.type == "CONVERT") {
            meta = this.getSimpleTextFromObject(this.getMetaByCalc(spec.meta1, terrain)) +
                '-> ' + this.getSimpleTextFromObject(this.getMetaByCalc(spec.meta2, terrain)) +
                ' / ' + this.getTickByCalc(spec.tick, terrain);
        } else if (spec.type == "TERRAIN") {
            meta = Object.keys(spec.meta1).join('') + ': +' + this.getSimpleTextFromObject(this.getMetaByCalc(spec.meta2, terrain), '%');
        }
        return symbol + ': T' + spec.tier + ' ' + spec.name + '\n' + meta +
            (noCost
                ? ''
                : '\n' + 'Cost: ' + this.getSimpleTextFromObject(this.getCostByCalc(spec.cost)) +
                (spec.require
                    ? '\nRequire: ' + this.getSimpleTextFromObject(this.getRequireByCalc(spec.require), ' ')
                    : ''));
    }
    private getTextFromUnitMap(): string {
        let unit = this.unitMap[this.mapY][this.mapX];
        let terrain = this.terrainMap[this.mapY][this.mapX];
        let symbol = unit.symbol;
        let spec = UNIT_SPEC[symbol];
        if (spec.type == "GAIN" || spec.type == "CONVERT") {
            let newTick = this.getTickByCalc(spec.tick, terrain);
            return this.getTextFromUnitSpec(symbol, true, terrain) + '\n' + (newTick - (this.tick - unit.baseTick) % newTick);
        } else if (spec.type == "TERRAIN") {
            return this.getTextFromUnitSpec(symbol, true, terrain);
        }
    }
    private getTextFromTerrainMap(): string {
        let terrain = this.terrainMap[this.mapY][this.mapX];
        return (terrain['💪'] >= 0 ? '+' : '') + terrain['💪'] + '%💪 / ' + (terrain['⏱'] >= 0 ? '+' : '') + terrain['⏱'] + '%⏱';
    }
    private getTextFromAdjacentMap(): string {
        let adjacent = this.adjacentMap[this.mapY][this.mapX];
        return this.getSimpleTextFromObject(adjacent, ' ');
    }
    private getTextFromItemSpec(symbol: string): string {
        let spec = ITEM_SPEC[symbol];
        let textLength = Math.ceil(CHOICE_WIDTH * 1.6 / CHOICE_FONT_SIZE);
        let desc = spec.desc.match(new RegExp(`.{1,${textLength}}`, 'g')).join('\n');
        return symbol + ': ' + spec.name + '\n' + desc;
    }
    private getTextFromRuinSpec(symbol: string): string {
        let spec = RUIN_SPEC[symbol];
        let textLength = Math.ceil(CHOICE_WIDTH * 1.5 / CHOICE_FONT_SIZE);
        return symbol + ': ' + spec.name + '\n' + this.getSimpleTextFromObject(spec.meta1) + ' -> ' + this.getSimpleTextFromObject(spec.meta2);
    }
    // 左側の選択肢を描画
    private drawChoice() {
        // 枠線のスタイルを設定
        let startX = (MAP_OFFSET_X - CHOICE_WIDTH) / 2;
        let startY = this.cameras.main.centerY - CHOICE_HEIGHT / 2 - CHOICE_HEIGHT - CHOICE_SPACE;
        for (let i = 0; i < 3; ++i) {
            this.choiceTexts[i].setText(this.getTextFromUnitSpec(this.choices[i]));
            // 枠線の矩形を描画
            this.choiceGraphics.lineStyle(1, (this.choice == i ? 0xffff00 : LINE_COLOR));
            this.choiceGraphics.strokeRect(startX, startY, CHOICE_WIDTH, CHOICE_HEIGHT);
            startY += CHOICE_HEIGHT + CHOICE_SPACE;
        }
    }
    // 全画面アイテム・ユニット・破滅選択画面 (別関数でアルファを更新)
    private drawSelection() {
        let space = 30;
        // 外枠・背景
        this.selectionGraphics.fillStyle(0x000000, 1);
        this.selectionGraphics.fillRect(0, MAP_OFFSET_Y - space, SCREEN_WIDTH, SCREEN_HEIGHT);
        this.selectionGraphics.lineStyle(1, 0xffffff);
        this.selectionGraphics.strokeRect(0, MAP_OFFSET_Y - space, SCREEN_WIDTH, SCREEN_HEIGHT);
        for (let i = 0; i < 9; ++i) {
            if (this.selections.length <= i) {
                this.selectionTexts[i].setPosition(1000, 1000).setText(' ');
                this.selectionContainers[i].setPosition(1000, 1000);
                continue;
            }
            let x = this.cameras.main.centerX;
            if (4 <= this.selections.length && this.selections.length <= 6) {
                x = (i <= 2
                    ? x - (CHOICE_WIDTH + CHOICE_SPACE) / 2
                    : x + (CHOICE_WIDTH + CHOICE_SPACE) / 2);
            } else if (7 <= this.selections.length && this.selections.length <= 9) {
                x = (i <= 2
                    ? x - CHOICE_WIDTH - CHOICE_SPACE
                    : 6 <= i
                        ? x + CHOICE_WIDTH + CHOICE_SPACE
                        : x);
            }
            let y = this.cameras.main.centerY;
            y = (i % 3 == 0
                ? y - CHOICE_HEIGHT - CHOICE_SPACE
                : i % 3 == 2
                    ? y + CHOICE_HEIGHT + CHOICE_SPACE
                    : y);
            let isColored;
            let text = '';
            if (this.selectionType == 'ITEM') {
                isColored = (i == this.selection);
                text = this.getTextFromItemSpec(this.selections[i]);
            } else if (this.selectionType == 'UNIT') {
                isColored = (this.multiSelection[i]);
                text = this.getTextFromUnitSpec(this.selections[i]);
            } else if (this.selectionType == 'RUIN') {
                isColored = (i == this.selection);
                text = this.getTextFromRuinSpec(this.selections[i]);
            }
            // 矩形を描画
            this.selectionGraphics.lineStyle(1, isColored ? 0xffff00 : 0xffffff);
            this.selectionGraphics.strokeRect(x - CHOICE_WIDTH / 2, y - CHOICE_HEIGHT / 2, CHOICE_WIDTH, CHOICE_HEIGHT);
            // テキストを描画
            this.selectionTexts[i].setPosition(x, y).setText(text);
            // クリッカブルを配置
            this.selectionContainers[i].setPosition(x, y);
        }
        let isColored;
        // 確定ボタンの活性
        if (this.selectionType == 'ITEM') {
            isColored = (this.selection != -1);
        } else if (this.selectionType == 'UNIT') {
            isColored = (Object.keys(this.multiSelection).length == 3);
        } else if (this.selectionType == 'RUIN') {
            isColored = (this.selection != -1) && this.checkRuinable();
        }
        this.selectionConfirmText.setFill(isColored ? '#ff0' : '#999');
        this.selectionConfirmContainer.setPosition(this.cameras.main.centerX, SCREEN_HEIGHT - MAP_OFFSET_Y / 2);
        this.selectionGraphics.lineStyle(1, isColored ? 0xffff00 : 0x909090);
        this.selectionGraphics.strokeRect(this.cameras.main.centerX - 200, SCREEN_HEIGHT - MAP_OFFSET_Y / 2 - 20, 400, 40);
    }
    // デカ文字表示作成・描画・アニメーション
    private createAndDrawScreen(text: string, textColor: string, bgColor: number) {
        let space = 30;
        // 外枠・背景
        let screenGraphics = this.add.graphics();
        screenGraphics.fillStyle(bgColor, 1);
        screenGraphics.fillRect(0, MAP_OFFSET_Y - space, SCREEN_WIDTH, SCREEN_HEIGHT);
        screenGraphics.lineStyle(1, 0xffffff);
        screenGraphics.strokeRect(0, MAP_OFFSET_Y - space, SCREEN_WIDTH, SCREEN_HEIGHT);
        let screenText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + space, text).setFontSize(80).setFill(textColor).setOrigin(0.5).setAlign('center').setLineSpacing(3).setAlpha(0);
        this.tweens.add({
            targets: [screenGraphics, screenText],
            duration: 250,
            ease: 'Power1',
            alpha: 1
        });
    }
    // 右側の説明を描画(選択中はtickごとに更新)
    private drawView() {
        this.viewGraphics.clear();
        this.viewTexts[0].setText(" ");
        this.viewTexts[1].setText(" ");
        this.viewTexts[2].setText(" ");
        // 枠線の矩形描画用
        let startX = SCREEN_WIDTH - (MAP_OFFSET_X - CHOICE_WIDTH) / 2 - CHOICE_WIDTH;
        let startY = this.cameras.main.centerY - CHOICE_HEIGHT / 2 - CHOICE_HEIGHT - CHOICE_SPACE;
        if (0 <= this.viewItem) { // アイテム選択中
            this.viewGraphics.lineStyle(1, 0x00ffff);
            this.viewGraphics.strokeRect(startX, startY, CHOICE_WIDTH, CHOICE_HEIGHT);
            this.viewTexts[0].setText(this.getTextFromItemSpec(this.items[this.viewItem].symbol));
        }
        startY += CHOICE_HEIGHT + CHOICE_SPACE;
        if ((0 <= this.mapX && 0 <= this.mapY) && this.unitMap[this.mapY][this.mapX]) { // マップ選択中
            this.viewGraphics.lineStyle(1, 0x00ffff);
            this.viewGraphics.strokeRect(startX, startY, CHOICE_WIDTH, CHOICE_HEIGHT);
            this.viewTexts[1].setText(this.getTextFromUnitMap());
        }
        startY += CHOICE_HEIGHT + CHOICE_SPACE;
        if ((0 <= this.mapX && 0 <= this.mapY) && (this.terrainMap[this.mapY][this.mapX] || this.adjacentMap[this.mapY][this.mapX])) { // 地形と周辺情報を表示
            this.viewGraphics.lineStyle(1, 0xffffff);
            this.viewGraphics.strokeRect(startX, startY, CHOICE_WIDTH, CHOICE_HEIGHT);
            let terrainText = this.terrainMap[this.mapY][this.mapX] ? this.getTextFromTerrainMap() : '';
            let adjacentText = this.adjacentMap[this.mapY][this.mapX] ? this.getTextFromAdjacentMap() : '';
            this.viewTexts[2].setText(terrainText + (terrainText && adjacentText ? '\n' : '') + adjacentText);
        }
    }
}
