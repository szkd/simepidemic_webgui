const FILTER=["susceptible","asymptomatic","symptomatic","recovered","died"];
const FILTERCOLOR = ['#27559A','#F6D600', '#FA302E', '#207864', '#B6B6B6'];
const BGClr = "#000000";
const HsClr = "#400000";
const CmClr = "#333333";

function myFill(ctx, data, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    data.forEach(function (v)
        { ctx.rect(v[0], v[1], 20, 20); });
    ctx.fill();
}

function drawWorld(e, canvas_id, height, filtername) {
    console.log("drawWorld");
    const canvas = document.getElementById(canvas_id);
    const filter = document.forms[filtername].children;
    const ctx = canvas.getContext("2d");
    const h = height;
    ctx.fillStyle = BGClr;//背景
    ctx.fillRect(0, 0, h, h);
    ctx.fillStyle = HsClr;//病院
    ctx.fillRect(h, 0, h*.2, h*.5);
    ctx.fillStyle = CmClr;//墓地
    ctx.fillRect(h, h*.5, h*.2, h*.5);
    if (e == null) return;
    ctx.save();
    const scl = canvas.height * 1e-4;
    ctx.translate(0, canvas.height);
    ctx.scale(scl, -scl);
    const data = JSON.parse(e.data);
    for (let i = 0; i < FILTER.length; i ++) {
        if(filter.namedItem(FILTER[i]).checked) {
            myFill(ctx, data[i], FILTERCOLOR[i]);
        }
    }
    ctx.restore();
}


class Monitor {
    constructor(w_id, browser_id, interval_btn, step_per_sec_btn, canvas, width, filter_formname) {
        const height = width*5/6;
        canvas.width = width;
        canvas.height = height;

        this.drawfunc = this.drawFunction(drawWorld, canvas.id, height, filter_formname);

        this.w_id = w_id;
        this.browserID = browser_id;
        this.evntSrc = null;
        this.interval = interval_btn;
        this.steps_per_sec = step_per_sec_btn;

        this.drawfunc(null);
    }

    finalize() {
        if (this.evntSrc != null) evntSrc.close();
    }

    startMonitor() {
        let report_cmd = '/periodicReport?report=['
        for (let i = 0; i < FILTER.length; i++) {
            if(i != 0) {
                report_cmd += ',"';
            } else {
                report_cmd += '"';
            }
            report_cmd += FILTER[i] + '"';
        }
        report_cmd += ']';

        if (this.evntSrc != null) this.evntSrc.close();
        this.evntSrc = new EventSource(report_cmd + "&me=" + this.browserID + "&popFormat=2");
        this.evntSrc.addEventListener("process", function(e) {
            this.processID = e.data;
        }, false);
        this.evntSrc.addEventListener("population", this.drawfunc, false);
    }

    stopMonitor() {
        this.evntSrc.close();
        this.evntSrc = null;
    }

    drawFunction(func, canvas_id, height, filtername) {
        return function (e) {
            drawWorld(e, canvas_id, height, filtername);
        }
    }
}
