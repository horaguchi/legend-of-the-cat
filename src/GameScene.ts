import * as Phaser from 'phaser';

type UnitType = "GAIN" | "CONVERT" | "TERRAIN";
type ItemType = "INSTANT" | "VICTORY";
type TerrainType = "💪" | "⏱";
type SelectionType = "ITEM" | "UNIT";
type TimerState = "⏸️" | "▶️";

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
    private readonly TEXT_STYLE = { testString: "😀|MÃ‰qgy" };
    private readonly UNIT_SPEC: Record<string, {
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
            "😺": { tier: 1, name: "Cat", cost: { "💰": 50 }, type: "CONVERT", meta1: { "💧": 1 }, meta2: { "💰": 12 }, tick: 8 },
            "😹": { tier: 2, name: "Cat", cost: { "💰": 125 }, type: "CONVERT", meta1: { "💧": 3 }, meta2: { "💰": 36 }, tick: 15 },
            "😼": { tier: 3, name: "Cat", cost: { "💰": 400 }, type: "CONVERT", meta1: { "💧": 2 }, meta2: { "💰": 24 }, tick: 6 },
            "🍼": { tier: 1, name: "Water", cost: { "💰": 50 }, type: "GAIN", meta1: { "💧": 1 }, tick: 10 },
            "🫗": { tier: 2, name: "Water", cost: { "💰": 200 }, type: "GAIN", meta1: { "💧": 5 }, tick: 25 },
            "🫖": { tier: 3, name: "Water", cost: { "💰": 1250 }, type: "GAIN", meta1: { "💧": 20 }, tick: 40 },
            "🛖": { tier: 1, name: "Factory", cost: { "💰": 100 }, type: "GAIN", meta1: { "🛢️": 1 }, tick: 50 },
            "🏢": { tier: 2, name: "Factory", cost: { "💰": 300 }, require: { "Factory": 2 }, type: "GAIN", meta1: { "⚙️": 1 }, tick: 50 },
            "🏭": { tier: 3, name: "Factory", cost: { "💰": 900 }, require: { "Factory": 5 }, type: "GAIN", meta1: { "🧰": 1 }, tick: 50 },
            "👌": { tier: 1, name: "Finger", cost: { "💰": 10, "🌹": 1 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 200 }, tick: 10 },
            "🤞": { tier: 2, name: "Finger", cost: { "💰": 20, "🌹": 2 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 2000 }, tick: 20 },
            "🤟": { tier: 3, name: "Finger", cost: { "💰": 30, "🌹": 3 }, type: "CONVERT", meta1: { "🌹": 1 }, meta2: { "💰": 20000 }, tick: 30 },
            '🦵': { tier: 1, name: "Speed Tower", cost: { '💰': 50 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '⏱': 5 } },
            '🔋': { tier: 1, name: "Power Tower", cost: { '💰': 50 }, type: 'TERRAIN', meta1: { '⟳': 1 }, meta2: { '💪': 5 } },
        };
    // UNIT アイデア
    // リソースアイデア
    // お金 - お金を生み出す
    // 宝石 - あまり生まれないが、特定のリソースに必要
    // 歯車 - まり生まれないが、特定のリソースに必要
    // 石 - 単純にお金よりたくさん生まれる
    // ユニットをおけるかず
    private readonly ITEM_SPEC: Record<string, {
        name: string,
        desc: string,
        type: ItemType,
        meta1: Record<string, number>,
        meta2?: Record<string, number>,
    }> = {
            '👓': { name: 'Glasses', desc: 'gggg', type: "INSTANT", meta1: {} },
            '🦺': { name: 'Safety Vest', desc: 'aaa', type: "INSTANT", meta1: {} },
            '👔': { name: 'Necktie', desc: 'aaa', type: "INSTANT", meta1: {} },
            '🧤': { name: 'Gloves', desc: 'aaaaaaaa', type: "INSTANT", meta1: {} },
            '👗': { name: 'Dress', desc: 'aaaaaaa', type: "INSTANT", meta1: { "💎": 1 } },
            '🤑': { name: 'Feeling rich', desc: 'After saving 200💰, you win!', type: "VICTORY", meta1: { '💰': 200 } },
            '🎫': { name: 'Ticket', desc: '10% Off', type: "INSTANT", meta1: { '🎫': 1 } },
        };

    // TODO:
    // 全体のスピードアップ
    //全体の量アップ
    //クリティカルが出て量が２倍に

    // ユニットマップデータ
    private unitMap: {
        symbol: string,
        baseTick: number,
        x: number,
        y: number
    }[][];
    private units: {
        symbol: string,
        baseTick: number,
        x: number,
        y: number
    }[] = [];
    private textMap: Phaser.GameObjects.Text[][]; // 表示用テキストマップデータ
    private textTweenMap: Phaser.Tweens.Tween[][]; // 表示用テキストアニメマップデータ
    private terrainMap: Record<TerrainType, number>[][];
    private adjacentMap: Record<string, number>[][];
    private mapGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private mapX: number = -1;
    private mapY: number = -1;
    private itemTexts: Phaser.GameObjects.Text[]; // アイテム表示用テキストデータ
    private items: {
        symbol: string,
        addTick: number,
    }[] = [];
    private choiceGraphics: Phaser.GameObjects.Graphics; // 配置ユニット描画用オブジェクト
    private choiceTexts: Phaser.GameObjects.Text[];
    private choice: number = -1;
    private choices: string[] = [
        "🛖",
        "🏢",
        "🏭",
    ];
    private selectionGroup: Phaser.GameObjects.Group; // 描画用オブジェクト
    private selectionGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private selectionTexts: Phaser.GameObjects.Text[];
    private selectionConfirmText: Phaser.GameObjects.Text;
    private selectionContainers: Phaser.GameObjects.Container[];
    private selectionConfirmContainer: Phaser.GameObjects.Container;
    private selectionType: SelectionType = 'ITEM';
    private selection: number = -1;
    private multiSelection: Record<number, boolean>;
    private selections: string[] = [
        "🦺",
        "🧤",
        "👗",
    ];
    private viewGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private viewText: Phaser.GameObjects.Text;
    private viewItem: number = -1; // 説明選択用
    private victoryGroup: Phaser.GameObjects.Group;
    private statusText: Phaser.GameObjects.Text;
    private pauseText: Phaser.GameObjects.Text;
    private pauseTween: Phaser.Tweens.Tween;
    private confirmText: Phaser.GameObjects.Text;
    private confirmGraphics: Phaser.GameObjects.Graphics; // 描画用オブジェクト
    private confirmOK: boolean = false;
    private tick: number = 0;
    private inventory: Record<string, number> = { "💰": 1000 };
    private timerState: TimerState = '▶️';
    private victory: boolean = false;

    constructor() {
        super("game");
    }

    preload(): void {
        // 画像の読み込み
        this.load.image('noimage', 'assets/noimage.gif'); // 透明
    }

    create(): void {
        // ステータス表示用テキストの初期化
        this.statusText = this.add.text(10, 10, "  ", this.TEXT_STYLE).setFontSize(20).setFill('#fff');

        // ポーズボタン用テキスト・クリッカブル要素の初期化
        this.pauseText = this.add.text(this.SCREEN_WIDTH - 25, 25, this.timerState, this.TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5);
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
            this.itemTexts.push(this.add.text(20 + 25 * i, 70, " ", this.TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5));
        }

        // 配置ボタンの初期化
        this.confirmText = this.add.text(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2, "Purchase and place it there").setFontSize(20).setFill('#999').setOrigin(0.5);
        this.confirmGraphics = this.add.graphics();
        this.confirmGraphics.lineStyle(1, 0x909090);
        this.confirmGraphics.strokeRect(this.cameras.main.centerX - 200, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2 - 20, 400, 40);
        let confirmContainer = this.add.container(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2);
        confirmContainer.setSize(400, 40);
        confirmContainer.setInteractive({ useHandCursor: true });
        confirmContainer.on('pointerdown', () => {
            this.clickConfirm();
        });

        // 右側、説明表示用オブジェクトを作成する
        this.viewGraphics = this.add.graphics();
        this.viewText = this.add.text(10, 10, " ", this.TEXT_STYLE).setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3);

        // タイマーイベントを設定する
        const timer = this.time.addEvent({
            delay: 500, // 1秒ごとに更新
            callback: this.updateTimer, // タイマーを更新するコールバック関数
            callbackScope: this,
            loop: true // 繰り返し実行
        });

        this.drawStatus();
        this.drawPause();

        this.createMap();
        this.drawMap();

        this.createChoice();
        this.drawChoice(-1);

        this.createSelection();
    }
    private createMap(): void {
        // ユニットマップを初期化する
        this.unitMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.unitMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.unitMap[y][x] = null;
            }
        }

        // 近隣情報マップを初期化する
        this.adjacentMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.adjacentMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.adjacentMap[y][x] = null;
            }
        }

        // 地形マップを初期化する
        this.terrainMap = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.terrainMap.push([]);
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                // 初期地形ランダム
                if (Math.random() < 0.05) {
                    let obj = {};
                    let value: number;
                    if (Math.random() < 0.05) { // 5%
                        value = 50;
                    } else if (Math.random() < 0.2) { // 15%
                        value = 30;
                    } else if (Math.random() < 0.5) { // 30%
                        value = 20;
                    } else if (Math.random() < 0.8) { // 30%
                        value = 10;
                    } else if (Math.random() < 0.95) { // 15%
                        value = -30;
                    } else if (Math.random() < 1.0) { // 5%
                        value = -50;
                    }
                    let key: TerrainType = (Math.random() < 0.5 ? "💪" : "⏱");
                    this.terrainMap[y][x] = {
                        "💪": key == "💪" ? value : 0,
                        "⏱": key == "⏱" ? value : 0,
                    };
                } else {
                    this.terrainMap[y][x] = null;
                }
            }
        }

        // 地形・枠線描画用オブジェクトを作成する(背景のため、テキストマップより先に描画)
        this.mapGraphics = this.add.graphics();
        let mapContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);
        mapContainer.setSize(this.MAP_WIDTH * this.CELL_SIZE, this.MAP_HEIGHT * this.CELL_SIZE);
        mapContainer.setInteractive({ useHandCursor: true });
        mapContainer.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            this.clickMap(pointer);
        });

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
                    " ", this.TEXT_STYLE).setFontSize(20).setFill('#fff').setOrigin(0.5);
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
    private createChoice(): void {
        this.choiceGraphics = this.add.graphics();
        this.choiceTexts = [];
        let ys = [
            this.cameras.main.centerY - this.CHOICE_HEIGHT - this.CHOICE_SPACE,
            this.cameras.main.centerY,
            this.cameras.main.centerY + this.CHOICE_HEIGHT + this.CHOICE_SPACE,
        ];
        for (let i = 0; i < 3; ++i) {
            // テキストの追加
            this.choiceTexts.push(this.add.text(10, 10, " ", this.TEXT_STYLE).setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3));

            // クリッカブル要素を追加
            let choiceContainer = this.add.container(this.MAP_OFFSET_X / 2, ys[i]).setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
            choiceContainer.setInteractive({ useHandCursor: true });
            choiceContainer.on("pointerdown", () => {
                this.clickChoice(i);
            });
        }
    }
    private createSelection(): void {
        this.selectionGroup = this.add.group();
        this.selectionGraphics = this.add.graphics();
        this.selectionTexts = [];
        this.selectionContainers = [];
        for (let i = 0; i < 9; ++i) {
            // テキストの追加
            this.selectionTexts.push(this.add.text(1000, 1000, " ", this.TEXT_STYLE).setFontSize(16).setFill('#fff').setOrigin(0.5).setAlign('center').setLineSpacing(3));

            // クリッカブル要素を追加
            this.selectionContainers.push(this.add.container(1000, 1000).setSize(this.CHOICE_WIDTH, this.CHOICE_HEIGHT));
            this.selectionContainers[i].setInteractive({ useHandCursor: true });
            this.selectionContainers[i].on("pointerdown", () => {
                this.clickSelection(i);
            });
        }
        for (let text of this.selectionTexts) {
            this.selectionGroup.add(text);
        }
        this.selectionConfirmText = this.add.text(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2, "Choose 1 item").setFontSize(20).setFill('#fff').setOrigin(0.5).setAlign('center');
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
            this.selections = Object.keys(this.ITEM_SPEC).sort((a, b) => 0.5 - Math.random()).slice(0, 3);
            this.selection = -1;
            this.selectionConfirmText.setText('Choose 1 item');
        } else if (type == 'UNIT') {
            this.selections = Object.keys(this.UNIT_SPEC).sort((a, b) => 0.5 - Math.random()).slice(0, 4);
            this.selectionConfirmText.setText('Choose 3 units');
            this.multiSelection = {};
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
        if (!this.victoryGroup) {
            this.createAndDrawVictory();
        }
        this.tweens.add({
            targets: this.victoryGroup.getChildren(),
            duration: 250,
            ease: 'Power1',
            alpha: 1
        });
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
        this.checkAndEnableConfirmButton(); // 資源の増減で購入可能が変化するので描画
        this.drawView(); // tick の変更を更新するので描画
        if (this.victory) {
            this.timerState = '▶️';
            this.drawPause();
            this.startVictory();
        } else if (this.tick == 3) {
            this.timerState = '▶️';
            this.drawPause();
            this.startSelection('ITEM');
        } else if (this.tick == 20) {
            this.timerState = '▶️';
            this.drawPause();
            this.startSelection('UNIT');
        }
    }

    // 量計算処理
    private getMetaByCalc(meta: Record<string, number>, terrain: Record<TerrainType, number> = null): Record<string, number> {
        return terrain ? Object.fromEntries(
            Object.entries(meta).map(([key, value]) => {
                let newValue = Math.round(value * (100 + terrain['💪']) / 100);
                return [key, newValue];
            })
        ) : meta;
    }
    // スピード計算処理(1より小さくはならない)
    private getTickByCalc(tick: number, terrain: Record<TerrainType, number> = null): number {
        return Math.max(1, (terrain ? Math.round(tick * 100 / (100 + terrain['⏱'])) : tick));
    }
    // ユニットの毎ターン解決処理
    private resolveUnits(): void {
        for (let unit of this.units) {
            let spec = this.UNIT_SPEC[unit.symbol];
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
        let spec = this.UNIT_SPEC[unit.symbol];
        let x = unit.x, y = unit.y;
        let target = [
            [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
            [x - 1, y], [x + 1, y],
            [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
        ];
        let newMeta2 = {};
        if (spec.type == "TERRAIN") {
            newMeta2 = this.getMetaByCalc(spec.meta2, this.terrainMap[y][x]);
        }
        for (let [targetX, targetY] of target) {
            if (targetX < 0 || this.MAP_WIDTH <= targetX || targetY < 0 || this.MAP_HEIGHT <= targetY) {
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
            let spec = this.ITEM_SPEC[item.symbol];
            if (spec.type == 'VICTORY') {
                let victoryOK = true;
                for (let [key, value] of Object.entries(spec.meta1)) {
                    if ((this.inventory[key] ?? 0) < value) {
                        victoryOK = false;
                    }
                }
                if (victoryOK) {
                    this.victory = true;
                }
            }
        }
    }

    // アイテム追加時の処理(各アイテム毎1回のみ)
    private resolveAcquiredItem(item: { symbol: string }): void {
        let spec = this.ITEM_SPEC[item.symbol];
        if (spec.type == "INSTANT") {
            for (let [key, value] of Object.entries(spec.meta1)) {
                this.inventory[key] = (this.inventory[key] ?? 0) + value;
            }
            this.drawStatus();
            this.drawChoice(this.choice);
        }
    }

    // 右上のポーズクリック
    private clickPause(): void {
        this.timerState = (this.timerState == '▶️' ? '⏸️' : '▶️');
        this.drawPause();
    }

    // マップをクリック
    private clickMap(pointer: Phaser.Input.Pointer): void {
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
        this.drawMap();
    }

    // 左側選択肢をクリック
    private clickChoice(choice: number): void {
        if (this.choice == choice) {
            this.choice = -1;
        } else {
            this.choice = choice;
        }
        this.checkAndEnableConfirmButton();
        this.drawChoice(this.choice);
    }

    // 配置ボタンの有効無効を判定
    private checkAndEnableConfirmButton(): void {
        if (this.choice != -1 && 0 <= this.mapX && 0 <= this.mapY && !this.unitMap[this.mapY][this.mapX] && this.checkPurchasable()) {
            this.confirmText.setFill('#ff0');
            this.confirmGraphics.lineStyle(1, 0xffff00);
            this.confirmGraphics.strokeRect(this.cameras.main.centerX - 200, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2 - 20, 400, 40);
            this.confirmOK = true;
        } else {
            this.confirmText.setFill('#999');
            this.confirmGraphics.lineStyle(1, 0x909090);
            this.confirmGraphics.strokeRect(this.cameras.main.centerX - 200, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2 - 20, 400, 40);
            this.confirmOK = false;
        }
    }

    // 配置ボタン押下→ユニットの作成処理
    private clickConfirm(): void {
        //console.log('clickConfirm');
        if (!this.confirmOK) {
            return;
        }

        let symbol = this.choices[this.choice];
        let spec = this.UNIT_SPEC[symbol];
        for (let [key, value] of Object.entries(this.getCostByCalc(spec.cost))) {
            this.inventory[key] -= value;
        }

        this.unitMap[this.mapY][this.mapX] = { symbol: symbol, baseTick: this.tick, x: this.mapX, y: this.mapY };
        this.textMap[this.mapY][this.mapX].setText(symbol);
        this.units.push(this.unitMap[this.mapY][this.mapX]);
        this.resolveAcquiredUnit(this.unitMap[this.mapY][this.mapX]);
        this.checkAndEnableConfirmButton();
        this.drawStatus();
        this.drawMap();
    }

    // 全体選択画面の選択肢をクリック
    private clickSelection(selection: number): void {
        if (this.selectionType == 'ITEM') {
            if (this.selection == selection) {
                this.selection = -1;
            } else {
                this.selection = selection;
            }
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
        //console.log('clickSelectionConfirm');
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
            this.drawChoice(-1);
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
    // 購入可能か判定
    private checkPurchasable(): boolean {
        let symbol = this.choices[this.choice];
        let spec = this.UNIT_SPEC[symbol];

        // インベントリに必要コストがあるか確認
        for (let [key, value] of Object.entries(this.getCostByCalc(spec.cost))) {
            if ((this.inventory[key] ?? 0) < value) {
                return false;
            }
        }

        // 前提ユニットが不要であればもう購入可能
        if (!spec.require) {
            return true;
        }

        // 前提ユニットがあるか確認
        let adjacent = this.adjacentMap[this.mapY][this.mapX];
        for (let [key, value] of Object.entries(spec.require)) {
            if (((adjacent && adjacent[key]) ?? 0) < value) {
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

    // マップを描画する
    private drawMap() {
        this.mapGraphics.clear();
        let mapX = this.mapX, mapY = this.mapY;
        // 地形マップを描画する
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (this.terrainMap[y][x]) {
                    let value = this.terrainMap[y][x]['💪'] + this.terrainMap[y][x]['⏱'];
                    let color = 0x000000;
                    if (value < 0) {
                        color = Math.min(0x010000 * Math.abs(value) * 3, 0xff0000);
                    } else if (0 < value) {
                        color = Math.min(0x000100 * value * 3, 0x00ff00);
                    }
                    this.mapGraphics.fillStyle(color);
                    this.mapGraphics.fillRect(this.MAP_OFFSET_X + x * this.CELL_SIZE, this.MAP_OFFSET_Y + y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
                }
            }
        }

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
    private getSimpleTextFromObject(obj, suffix: string = ''): string {
        return JSON.stringify(obj).replace(/"/g, '').replace(/([^{,]+):(\d+)/g, '$2' + suffix + '$1').replace(/{([^,]+)}/, '$1');
    }
    private getTextFromUnitSpec(symbol: string, noCost: boolean = false, terrain: Record<TerrainType, number> = null): string {
        let spec = this.UNIT_SPEC[symbol];
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
                    ? '\nRequire: ' + this.getSimpleTextFromObject(spec.require, ' ')
                    : ''));
    }
    private getTextFromUnitMap(): string {
        let unit = this.unitMap[this.mapY][this.mapX];
        let terrain = this.terrainMap[this.mapY][this.mapX];
        let symbol = unit.symbol;
        let spec = this.UNIT_SPEC[symbol];
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
    private drawSelection() {
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

            if (this.selectionType == 'ITEM') {
                let selection = this.selection;
                // 矩形を描画
                this.selectionGraphics.lineStyle(1, i == selection ? 0xffff00 : 0xffffff);
                this.selectionGraphics.strokeRect(x - this.CHOICE_WIDTH / 2, y - this.CHOICE_HEIGHT / 2, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
                // テキストを描画
                this.selectionTexts[i].setPosition(x, y).setText(this.getTextFromItemSpec(this.selections[i]));
            } else if (this.selectionType == 'UNIT') {
                let multiSelection = this.multiSelection;
                // 矩形を描画
                this.selectionGraphics.lineStyle(1, multiSelection[i] ? 0xffff00 : 0xffffff);
                this.selectionGraphics.strokeRect(x - this.CHOICE_WIDTH / 2, y - this.CHOICE_HEIGHT / 2, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
                // テキストを描画
                this.selectionTexts[i].setPosition(x, y).setText(this.getTextFromUnitSpec(this.selections[i]));
            }
            // クリッカブルを配置
            this.selectionContainers[i].setPosition(x, y);
        }
        // 確定ボタンの活性
        if (this.selectionType == 'ITEM') {
            this.selectionConfirmText.setFill(this.selection == -1 ? '#999' : '#ff0');
            this.selectionConfirmContainer.setPosition(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2);
            this.selectionGraphics.lineStyle(1, this.selection == -1 ? 0x909090 : 0xffff00);
            this.selectionGraphics.strokeRect(this.cameras.main.centerX - 200, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2 - 20, 400, 40);
        } else if (this.selectionType == 'UNIT') {
            this.selectionConfirmText.setFill(Object.keys(this.multiSelection).length != 3 ? '#999' : '#ff0');
            this.selectionConfirmContainer.setPosition(this.cameras.main.centerX, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2);
            this.selectionGraphics.lineStyle(1, Object.keys(this.multiSelection).length != 3 ? 0x909090 : 0xffff00);
            this.selectionGraphics.strokeRect(this.cameras.main.centerX - 200, this.SCREEN_HEIGHT - this.MAP_OFFSET_Y / 2 - 20, 400, 40);
        }
    }
    // 勝利画面描画
    private createAndDrawVictory() {
        this.victoryGroup = this.add.group();
        let vicotryGraphics = this.add.graphics();
        let space = 30;
        // 外枠・背景
        vicotryGraphics.fillStyle(0xffffff, 1);
        vicotryGraphics.fillRect(0, this.MAP_OFFSET_Y - space, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        vicotryGraphics.lineStyle(1, 0xffffff);
        vicotryGraphics.strokeRect(0, this.MAP_OFFSET_Y - space, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        let victoryText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + space, "VICTORY").setFontSize(80).setFill('#000').setOrigin(0.5).setAlign('center').setLineSpacing(3)

        this.victoryGroup.add(vicotryGraphics);
        this.victoryGroup.add(victoryText);
        this.victoryGroup.setAlpha(0);
    }
    // 右側の説明を描画(選択中はtickごとに更新)
    private drawView() {
        if ((this.mapX < 0 || this.mapY < 0) ||
            (!this.unitMap[this.mapY][this.mapX] && !this.terrainMap[this.mapY][this.mapX] && !this.adjacentMap[this.mapY][this.mapX] && this.viewItem < 0)) {
            this.viewGraphics.clear();
            this.viewText.setText(" ");
            return;
        }

        // 枠線の矩形を描画
        let startX = this.SCREEN_WIDTH - (this.MAP_OFFSET_X - this.CHOICE_WIDTH) / 2 - this.CHOICE_WIDTH;
        let startY = this.cameras.main.centerY - this.CHOICE_HEIGHT / 2;
        this.viewGraphics.lineStyle(1, this.unitMap[this.mapY][this.mapX] ? 0x00ffff : 0xffffff);
        this.viewGraphics.strokeRect(startX, startY, this.CHOICE_WIDTH, this.CHOICE_HEIGHT);
        if (0 <= this.viewItem) {
            this.viewText.setText(this.getTextFromItemSpec(this.items[this.viewItem].symbol));
        } else if (this.unitMap[this.mapY][this.mapX]) {
            this.viewText.setText(this.getTextFromUnitMap());
        } else {
            let terrainText = this.terrainMap[this.mapY][this.mapX] ? this.getTextFromTerrainMap() : '';
            let adjacentText = this.adjacentMap[this.mapY][this.mapX] ? this.getTextFromAdjacentMap() : '';
            this.viewText.setText(terrainText + (terrainText && adjacentText ? '\n' : '') + adjacentText);
        }
        this.viewText.setPosition(this.SCREEN_WIDTH - this.MAP_OFFSET_X / 2, this.cameras.main.centerY);
    }
}
