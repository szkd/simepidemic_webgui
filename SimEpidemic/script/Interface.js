/********************************************
 * onchange
 ***************************************** */
function loadFile(file) {
    tool.displayFilename(file);
}
function loadAll(file_input) {
    param.loadAll(file_input);
}
function loadForm(file_input, formname) {
    param.loadFromFile(file_input, formname);
}
function changeFilter(world, index, checkbox) {
    MONITORS[world].changeFilter(index, checkbox.checked);
}
/********************************************
 * onclick
 ***************************************** */
function showElement(id) {
    tool.switchVisible(id, true);
}
function hideElement(id) {
    tool.switchVisible(id, false);
}

function showCharts(world) {
    const title = document.createElement('title');
    title.innerText = "Charts:: " + world;

    const css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet')
    css.setAttribute('href', SERVERNAME + 'css/common.css');

    const popup_script = document.createElement('script');
    popup_script.setAttribute('src', SERVERNAME + 'script/GraphPopup.js');

    const common_script = document.createElement('script');
    common_script.setAttribute('src', SERVERNAME + 'script/common.js');

    const lang = document.createElement('div');
    lang.id = 'lang';
    lang.style = 'display:none;';
    lang.innerText = LANGUAGE;

    const w_id = document.createElement('div');
    w_id.id = 'w_id';
    w_id.style = 'display:none;';
    w_id.innerText = world;

    const d3_script = document.createElement('script');
    d3_script.setAttribute('src', "https://d3js.org/d3.v6.min.js");

    const enc = document.createElement('meta');
    enc.setAttribute('charset', 'utf-8');

    const w  = window.open('', 'viewchart-' + world, 'width=580, height=700');
    w.document.body.appendChild(lang);
    w.document.body.appendChild(w_id);

    w.document.head.appendChild(common_script);
    w.document.head.appendChild(css);
    w.document.head.appendChild(enc);
    w.document.head.appendChild(title);
    w.document.head.appendChild(popup_script);
    w.document.head.appendChild(d3_script);
}

function takeSnap(w_id) {
    sim.takeSnap(w_id);
}

function shareDefaultId() {
    sim.shareDefaultId();
}

function applySettings(formname, world) {
    sim.applySettings(formname, world);
}

function addNewWorld() {
    gui.addNewWorld();
}
function sharedWorld() {
    gui.addSharedWorld();
}

function saveAll() {
    param.saveAll();
}

function resetAll() {
    param.resetAll();
}
function saveForm(formname) {
    param.download(formname);
}
function resetForm(formname) {
    param.resetForm(formname);
}
//loadScenario()
//saveScenario()
function getJobQueueStatus(target) {
    server.jobQueStatus(target);
}

function getServerVersion(target) {
    server.version(target);
}

function pauseOrResume(world, button) {
    if(button.innerText == "▶︎") {
        button.innerText = "Ⅱ";
        startSim(world);
    } else {
        button.innerText = "▶︎";
        stopSim(world);
    }
    return;
}

function startSim(world) {
    const filtername = world + '-draw-filter';
    sim.worldControl('start', world, function () {
        MONITORS[world].start(tool.getBrowserId(), world);
    });
}

function stopSim(world) {
    sim.worldControl('stop', world);
    MONITORS[world].stop();
}

function stepSim(world) {
    MONITORS[world].start(tool.getBrowserId(), world);
    let space_id = world;
    if(world == 'default') {
        space_id = 'world-template';
    }
    const button = document.getElementById(space_id).querySelector("button[name='simswitch']");
    sim.worldControl('step', world);
    button.innerText = "▶︎";
}

function resetSim(world) {
    const result = confirm(msg.confirmResetWorld[LANGUAGE]);
    if(!result) return;
    sim.worldControl('reset', world);
    MONITORS[world].start(tool.getBrowserId(), world);
    let space_id = world;
    if(world == 'default') {
        space_id = 'world-template';
    }
    const button = document.getElementById(space_id).querySelector("button[name='simswitch']");
    button.innerText = "▶︎";
}

function addMonitor(w_id) {
    const p_node = document.getElementById(w_id + '-result');
    p_node.innerHTML='';
    MONITORS[w_id] = new MonitorPIXI(p_node, w_id);
}

function closeWorld(world_id, shared = false){
    MONITORS[world_id].stop();
    if(!shared) {
        const DO = confirm(msg.confirmCloseWorld[LANGUAGE]);
        if(!DO) return;
        sim.worldControl('closeWorld', world_id);
    }
    document.getElementById(world_id).remove();
    delete MONITORS[world_id];
}

/********************************************
 * oninput
 ***************************************** */
function sliderValueChanged(slider, outputid){
    let element = document.getElementById(outputid);
    element.value = slider.value;
}
