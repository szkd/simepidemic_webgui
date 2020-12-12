/**
 * GUI・JS間のインターフェース
 */
/**
 * onchange
 * @namespace
 */
const onchange = {
    /**
     * スライダーの値を表示する
     * @param {Object} slider - スライダーinput
     * @param {string} outputid - 値を表示するノードのID
     */
    sliderValueChanged: function(slider, outputid){
        const element = document.getElementById(outputid);
        element.value = slider.value;
    },
    /**
     * 指定したIDの要素をdisplay:block;する
     * @param {string} id
     */
    showElement: function(id) {
        document.getElementById(id).style.display = "block";
    },

    /**
     * 指定したIDの要素をdisplay:none;する
     * @param {string} id
     */
    hideElement: function(id) {
        document.getElementById(id).style.display = 'none';
    }
}
