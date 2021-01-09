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

/*
pauseOrResume('default', this)
stepSim('default')
resetSim('default')
takeSnap('default')
*/
function shareDefaultId() {
    sim.shareDefaultId();
}

function applySettings(formname, world) {
    sim.applySettings(formname, world);
}

//addNewWorld();
//sharedWorld()
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

function stepSim(world){
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
    const width = document.querySelector("#world-template .cmd-btn-list").offsetWidth;
    MONITORS[w_id] = new MonitorPIXI(p_node, width, w_id);
}

function deleteMonitor(w_id) {
    delete MONITORS[w_id];
}
/********************************************
 * oninput
 ***************************************** */
function sliderValueChanged(slider, outputid){
    let element = document.getElementById(outputid);
    element.value = slider.value;
}
