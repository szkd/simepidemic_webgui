/**
 * @namespace
 */
const draw = {}
/**
 * 表示する個体タイプ
 */
draw.FILTER = ["susceptible","asymptomatic","symptomatic","recovered", "vaccinated","died"];
/**
 * 各個体の色
 */
draw.FILTERCOLOR = ['0x27559A','0xF6D600', '0xFA302E', '0x207864', 'skyblue', '0xB6B6B6'];
/**
 * タイプごとの色を取得
 * @param {string} name - タイプname(FILTERより)
 * @return {string} - 0x始まりの色
 */
draw.typeColor = function(name) {
    const idx = draw.FILTER.findIndex((elem) => elem == name)
    return draw.FILTERCOLOR[idx].replace('0x', '#');
}
/**
 * 背景色
 */
draw.BGClr = "0x000000";
/**
 * 病院領域の色
 */
draw.HsClr = "0x400000";
/**
 * 墓地領域の色
 */
draw.CmClr = "0x333333";

/**
 * 個体のテキスチャを用意する（レンダリング負荷を減らせるらしい?）
 * @param {PIXI.renderer} renderer
 * @param {number} size - 個体（球）の直径
 * @return {object:dict} 個体タイプ名（FILTERから）: テキスチャ
 */
draw.agentTextures = function(renderer, size) {
    const texture_dict = {};
    for(let i = 0; i < draw.FILTER.length; i++) {
        const g = new PIXI.Graphics();
        g.beginFill(draw.FILTERCOLOR[i]);
        g.drawCircle(0, 0, size);
        g.endFill();
        texture_dict[draw.FILTER[i]] = renderer.generateTexture(g);
    }
    return texture_dict;
}

/**
 * 背景画像を作成，反転する場合はflip_x/yを指定
 * @param {boolean} [flip_x=false] - scaleとは違うので注意
 * @param {boolean} [flip_y=false] - scaleとは違うので注意
 * @return {PIXI.Graphics}
 */
draw.backgroundGraphic = function(flip_x = false, flip_y = false) {
    let x_flip = 1;
    let y_flip = 1;
    if(flip_x) x_flip = -1;
    if(flip_y) y_flip = -1;
    const background = new PIXI.Graphics();
    background.beginFill(draw.BGClr);
    background.drawRect(x_flip * 0, y_flip * 0, x_flip * 10000, y_flip * 10000);
    background.beginFill(draw.CmClr);
    background.drawRect(x_flip * 10000, y_flip * 0, x_flip * 2000, y_flip * 5000);
    background.beginFill(draw.HsClr);
    background.drawRect(x_flip * 10000, y_flip * 5000, x_flip * 2000, y_flip * 5000);
    return background;
}

/**
 * 個体のタイプを可視化するかどうか保持するfilterを初期化,提供
 * @return {object:dict}
 */
draw.filter = function() {
    const filter = {};
    draw.FILTER.forEach(s => {
        filter[s] = true;
    });
    return filter;
}

/**
 * 個体のタイプごとにコンテナを用意
 * @return {object:dict} フィルタID:PIXI.Container
 */
draw.initAgents = function() {
    const d = {};
    draw.FILTER.forEach(s => {
        d[s] = new PIXI.ParticleContainer();
        d[s].autoResize = true;
    });
    return d;
}
/**
 * エージェントの描画
 * @param {object} d_array
 * @param {string} w_id - monitorオブジェクトを特定する世界ID
 */
draw.agents = function(d_array, w_id) {
    const monitor = MONITORS[w_id];
    for (let i = 0; i < draw.FILTER.length; i++) {
        const name = draw.FILTER[i];
        if(!monitor.filter[name]) {
            monitor.agents[name].removeChildren();
            continue;
        }
        const d_len = d_array[i].length;
        const agents_len = monitor.agents[name].children.length;
        const sub_len = d_len - agents_len;
        if (sub_len < 0) {
            monitor.agents[name].removeChildren(endIndex = agents_len + sub_len);
        }
        if (sub_len > 0) {
            for(let i = sub_len; i > 0; i--) {
                const sprite = new PIXI.Sprite(monitor.agent_textures[name]);
                monitor.agents[name].addChild(sprite);
            }
        }
        if (monitor.filter[name] && monitor.agents[name].children.length > 0) {
            for(let j = 0; j < d_len; j++) {
                const child = monitor.agents[name].getChildAt(j);
                child.x =  d_array[i][j][0];
                child.y = -1 * d_array[i][j][1];
            }
        }
    }
        monitor.update();
}

/**
 * PIXIアプリケーションの描画領域の幅に設定するべき値を取得
 */
draw.getCanvasParentWidth = function() {
    return document.querySelector("#world-template .offset").offsetWidth;
}

/**
 * SimEpiのキャンバスの比率に合わせて高さを算出
 * @param w - 幅
 * @return 高さ
 */
draw.height = function(w) {
    return w * 0.83;
}
/**
 * @classdesc シミュレーションのエージェントをリアルタイムに監視，アニメーション表示する
 * アニメーションについてはPIXIライブラリを通してWebGLで描画
 */
class MonitorPIXI {
    /**
     * @constructor
     * @param {object:node} p_node - PIXI.Application.renerer.viewを持たせる親要素
     * @param {number} w - 表示する画面の幅（高さは幅から自動的に生成）
     */
    constructor(p_node, w_id) {
        this.pixi = new PIXI.Application({
            width: draw.getCanvasParentWidth(),
            height: draw.height(draw.getCanvasParentWidth()),
            backgroundColor: 0xFFFFFF,
            autoResize: true
        });
        this.agent_textures = draw.agentTextures(this.pixi.renderer, 15);
        this.agents = draw.initAgents();
        this.filter = draw.filter();
        this.ratio = draw.getCanvasParentWidth()/12000;
        this.pixi.stage.addChild(draw.backgroundGraphic(false, true));//y軸反転
        for(let key in this.agents) {
            this.pixi.stage.addChild(this.agents[key]);
            const q = "form[name=\"" + w_id + "-draw-filter\"] div[name=\"" + key + "\"]";
            const fill = document.querySelector(q);
            fill.style.color = draw.typeColor(key);
        }
        p_node.appendChild(this.pixi.renderer.view);
        this.pixi.stage.scale.x = this.ratio;
        this.pixi.stage.scale.y = this.ratio;
        this.pixi.stage.scale.y *= -1;
        this.event_src = null;
    }

    /**
     * @param {string} b_id - ブラウザID
     * @param {string} w_id - ワールドID
     * @param {float} [interval = 0.1] - レポート間隔（秒）
     */
    start(b_id, w_id, interval = 0.1) {
        console.log("monitor.start");
        if(this.event_src == null) {
            this.event_src = new Worker("../script/EventWork.js");
            this.event_src.onmessage = this.workerwork;
        }
        this.event_src.postMessage(['start', b_id, w_id, interval]);
    }

    stop() {
        console.log('monitor.stop');
        if(this.event_src == null) {
            return;
        }
        this.event_src.postMessage(['stop']);
    }

    changeFilter(name, on_off) {
        this.filter[name] = on_off;
    }

    changeInterval(val) {
        this.event_src.postMessage(['change', 'interval', val]);
    }

    update() {
        this.pixi.renderer.render(this.pixi.stage);
    }

    resize(w, h) {
        this.ratio = draw.getCanvasParentWidth()/12000;
        this.pixi.renderer.view.style.width = w + 'px';
        this.pixi.renderer.view.style.height = h + 'px';
    }

    /**
     * イベントソースからのメッセージをハンドリング
     */
    workerwork(e) {
        const cmd = e.data[0];
        switch(cmd) {
            case 'draw':
                const w_id = e.data[2];
                draw.agents(e.data[1], w_id);
                break;
            case 'stop':
                server.get((v) => {
                    console.log('Worker report: quit ' + v);
                }, e.data[1]);
                break;
            case 'change':
                server.get((v) => {
                    console.log('Worker report: change' + v);
                }, e.data[1]);
                break;
            case 'error':
                console.log('Worker sent error msg: ' + e.data[1]);
                break;
            case 'report':
                console.log('Worker report: ' + e.data[1]);
                break;
            default:
                console.log('Worker sent unknown cmd: ' + cmd);
        }
    }
}
