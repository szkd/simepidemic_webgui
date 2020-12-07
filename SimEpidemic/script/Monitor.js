const FILTER=["susceptible","asymptomatic","symptomatic","recovered","died"];
const FILTERCOLOR = ['0x27559A','0xF6D600', '0xFA302E', '0x207864', '0xB6B6B6'];
const BGClr = "0x000000";
const HsClr = "0x400000";
const CmClr = "0x333333";


function agentTextures(renderer, size) {
    const texture_dict = {};
    for(let i = 0; i < FILTER.length; i++) {
        const g = new PIXI.Graphics();
        g.beginFill(FILTERCOLOR[i]);
        g.drawCircle(0, 0, size);
        g.endFill();
        texture_dict[FILTER[i]] = renderer.generateTexture(g);
    }
    return texture_dict;
}

function backgroundGraphic() {
    const background = new PIXI.Graphics();
    background.beginFill(BGClr);
    background.drawRect(0, 0, 10000, 10000);
    background.beginFill(HsClr);
    background.drawRect(10000, 0, 2000, 5000);
    background.beginFill(CmClr);
    background.drawRect(10000, 5000, 2000, 5000);
    return background;
}

function filters() {
    const filters = {};
    FILTER.forEach(s => {
        filters[s] = true;
    });
    return filters;
}

function initContainerDict() {
    const d = {};
    FILTER.forEach(s => {
        d[s] = new PIXI.Container();
    });
    return d;
}

function drawAgents(d_array, monitor) {
    console.log("drawAgents");
    for (let i = 0; i < FILTER.length; i++) {
        if(! monitor.isAnimate) continue;

        const name = FILTER[i];
        if(!monitor.filter[name]) continue;

        const d_len = d_array[i].length;
        const sub_len = d_len - monitor.agents[name].length;
        if (sub_len < 0) {
            for (let j = sub_len; j != 0; j++) monitor.agents[name].pop();
        }
        if (sub_len > 0) {
            for(let i = sub_len; i!=0; i--) monitor.agents[name].push(
                new PIXI.Sprite(monitor.agent_textures[name])
            );
        }
        if (monitor.filter[name]) {
            for(let j = 0; j < d_len; j++) {
                monitor.agents[name][j]['x'] = d_array[i][j]['x'];
                monitor.agents[name][j]['y'] = d_array[i][j]['y'];
            }
        }
   }
}

function workerwork(e) {
    const cmd = e.data[0];
    switch(cmd) {
        case 'draw':
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

class MonitorPIXI {
    constructor(b_id, w_id, p_node, w, filter_formname, interval = 100) {
        console.log(p_node);
        this.pixi = new PIXI.Application({
            width: w,
            height: w * 0.83,
            backgroundColor: 0xFFFFFF
        });
        this.agent_textures = agentTextures(this.pixi.renderer, 2);
        this.agents = initContainerDict();
        this.filter = filters();
        this.ratio = w/12000;
        this.pixi.stage.addChild(backgroundGraphic());
        p_node.appendChild(this.pixi.renderer.view);
        this.pixi.stage.scale.x = this.ratio;
        this.pixi.stage.scale.y = this.ratio;
        for(let key in this.agents) {
            this.pixi.stage.addChild(this.agents[key]);
        }
        //reporter
        this.event_src = new Worker("../script/GetSVEventWork.js");
        this.event_src.postMessage(['init', b_id, w_id, interval]);
        this.event_src.onmessage = workerwork;
    }

    changeFilter(name) {
        this.filter[name] = !this.filter[name];
    }

    changeInterval(val) {
        this.event_src.postMessage(['change', 'interval', val]);
    }
}
