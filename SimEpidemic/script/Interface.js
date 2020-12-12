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
/********************************************
 * oninput
 ***************************************** */
function sliderValueChanged(slider, outputid){
    let element = document.getElementById(outputid);
    element.value = slider.value;
}
