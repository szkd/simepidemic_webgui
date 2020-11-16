import json
import os
import shutil
from collections import OrderedDict

""" ********************************
const
******************************** """
TEMPLATE_DIR = "templates/"
OUTPUT_DIR = "SimEpidemic/"
STYLES = "../css/"
SCRIPTS = "../script/"
OUTPUT_FILE = {
        "JA": OUTPUT_DIR + "ja/index.html",
        "EN": OUTPUT_DIR + "en/index.html"
}
CONTENTS_DIR = OUTPUT_DIR + "contents/"
SIM_DIR = TEMPLATE_DIR + "sim/"
PARAM_DIR = TEMPLATE_DIR + "param/"
COMMON_DIR = TEMPLATE_DIR + "common/"
SCENARIO_DIR = TEMPLATE_DIR + "scenario/"
DEVELOP_DIR = TEMPLATE_DIR + "dev/"

""" ********************************
common
******************************** """
my_property = {}
def addProperty(name, value):
    if name in my_property:
        my_property[name] += ',' + str(value)
        return
    my_property[name] = str(value)

def convertMyProperty():
    html_str = ""
    for name in my_property:
        html_str += tag("input", attr={"type" : "hidden", "name": name, "value": my_property[name]}, end=False)
    return html_str

def checkboxGroup(formname, d, lang):
    info = d['info']
    listener = d['listener']
    boxes = d['boxes']
    html_str = ""

    for b in boxes:
        box = boxes[b]
        label = tag("label", box['label'][lang]);
        attr = {
                'name': box['name'],
                'type': 'checkbox',
                'checked': 'checked' if box['checked'] else ''
        }
        html_str += tag("input", attr=attr, end=False) + label
    if formname != '':
        return tag("form",html_str, {'name': formname})
    return tag("div", html_str, {'class':info['cmd_list_cls']})

def buttonGroup(d, lang):
    info = d['info']
    listener = d['listener']
    buttons = d['buttons']
    other = d['other'] if 'other' in d else {}
    html_str = ""

    for cmd in buttons:
        button_name = buttons[cmd]
        if type(buttons[cmd]) != type(''):
            button_name = buttons[cmd][lang]
        attr = {
            "type": "button",\
            "class": info['cmd_cls']\
        }
        attr['onclick'] = listener[cmd]
        html_str += tag("button", button_name, attr)

    for key in other:
        cmd = other[key]
        content = cmd['content'] if 'content' in cmd else ''
        if type(content) != type(''):
            content = content[lang]
        attr = cmd['attr']
        html_str += tag(cmd['tag'], content, cmd['attr'], cmd['end'])

    html_str = tag("div", html_str, {\
            'class': info['cmd_list_cls']\
            })
    return html_str

def numberGroup(d, lang):
    numbers = d['numbers']
    info = d['info']
    html_str = ""
    for n in numbers:
        number = numbers[n];
        html_str += tag("span",\
            tag("label", number['label'][lang])\
            + tag("input",\
            attr = {\
                'type': "number",\
                'value': number['default-value'],\
                'step': "0.1"\
                }, end = False)\
            + tag("span", number['unit'][lang]) if 'unit' in number else '',\
            {\
                "style": "display: inline-block;margin-right: 25px;",\
                "name": n\
            }
        )
    html_str = tag("div", html_str, {\
            'class': info['cmd_list_cls']\
            })
    return html_str


def inputGroupFromJson(jsonfile, lang, i_type = "button", formname = ''):
    j = json2dict(jsonfile, True)
    if i_type == "button":
        return buttonGroup(j, lang)
    if i_type == "checkbox":
        return checkboxGroup(formname, j, lang)
    if i_type == "number":
        return numberGroup(j, lang)

""" ********************************
pages
******************************** """
def settingSection(lang, section, key, label_cl, opt_cl, opt_style, file_attr):
    options = section['options']
    result = ""
    result +=  tag("div", section['label'][lang], {"class": label_cl})
    idx = -1
    for opt in options:
        idx += 1
        opt_id = key + str(idx)
        opt_html = ""

        attr = {\
            "type": section['type'],\
            "name": section['name'],\
            "id": opt_id,\
            "class": opt_cl,\
            "style": opt_style,\
            "value": opt['value']
           }
        if 'onchange' in opt:
            attr['onchange'] = opt['onchange']
        if 'checked' in opt:
            attr['checked'] = "checked"
        opt_html += tag("input", attr=attr,end = False)
        opt_html += tag("label", opt['label'][lang], {"for": opt_id, "style": "margin-right:  8px;"})
        if 'file' in opt:
            file_attr['id'] = section['file-id']
            file_attr['onchange'] = opt['file-onchange']
            opt_html += tag("label", '', {"for": section['file-id'], "class": "file-plus"})
            opt_html += tag("input", attr=file_attr, end=False)
        result += tag("div", opt_html)
    return result

def simSettings(id, lang):
    template  = json2dict(SIM_DIR + "sim_settings.json")
    sections = template['sections']
    info = template['info']
    html_str = tag("button", "×",\
            {
                "type": "button",
                "class": "close-btn",
                "onclick": "hideElement('sim-"+id+"');"
                })
    html_str += tag("div", info['description'][lang], {"style": "margin-top: 15px; margin-bottom:20px;"});
    html_str += tag("button", info['button'][lang],\
            {
                "type": "button",
                "class": "apply-btn",
                "name": "apply-settings",
                "onclick": "applySettings('sim-" + id +'-form' + "', '" + id + "');"
            });
    for sec in sections:
        html_str += settingSection(\
                lang,
                sections[sec],\
                sec,\
                info['title_cls'],\
                info['option-cls'],\
                info['option-style'],\
                info['file-attr']\
                )

    html_str = tag("form",\
        tag("div", html_str,\
        {"class": info['option-container']}),\
        {'name': 'sim-'+id+'-form'})
    return html_str

def animSettings(jsonfile, lang):
    d = json2dict(jsonfile, True)
    settings = d['settings']
    html_str = ""
    for s in settings:
        html_str += tag("span",\
            tag("label", settings[s]['name'][lang])\
            + tag("input",\
            attr = {\
                "type": "number",\
                "id": s + 'anim-settings',\
                "value": "1",\
                "step": "0.1"\
                }, end = False)\
            + tag("span", settings[s]['unit'][lang]) if 'unit' in settings[s] else '',\
            {\
                "style": "display: inline-block;margin-right: 25px;",\
                "name": s\
            }
        )
    result = {}
    result['settings'] = html_str
    result['apply'] = ""
    return result

def sim(lang):
    title = {
        "sim-title": {
            "JA": "シミュレーション制御",
            "EN": "Simulation Control"
            },
        "anim-filter-title": {
            "JA": "アニメーションに表示",
            "EN": "Watch on ..."
            },
        "anim-stg-title": {
            "JA": "アニメーション設定",
            "EN": "Animation Settings"
            }
    }
    cmd = inputGroupFromJson(SIM_DIR + "world_commands.json", lang, 'button')
    w_cmd = inputGroupFromJson(SIM_DIR + "commands.json", lang, 'button')
    anim_settings = inputGroupFromJson(SIM_DIR + "animation_settings.json", lang, 'number')

    anim_filters = inputGroupFromJson(SIM_DIR + "animation_filters.json", lang, 'checkbox', 'default-draw-filter');
    indicator_type = json2dict(COMMON_DIR + "indicator_type.json")
    dist_type = json2dict(COMMON_DIR + "distribution_type.json")
    for name in indicator_type:
        if indicator_type[name]['now']:
            addProperty('current_step_indicator', name)
        elif indicator_type[name]['accumulation']:
            addProperty('accumulation_indicator', name)
    for name in dist_type:
        addProperty('distribution_indicators', name)

    world_template = rephrase(SIM_DIR + "world.html",\
            {\
                "SIM-TITLE": title['sim-title'][lang],\
                "ANIM-FILTER-TITLE": title['anim-filter-title'][lang],\
                "ANIM-STG-TITLE": title['anim-stg-title'][lang],\
                "WORLDCMD": w_cmd,\
                "ANIMATION-FILTER": anim_filters,\
                "ANIMATION-STG": anim_settings,\
                "ID": "default",\
                "SETTINGS": simSettings('default', lang)\
            }, 1000)
    return tag("div", world_template, {"id": "world-list"}) + cmd

""" ********************************* """
""" ********************************* """
def param(lang):
    commands = inputGroupFromJson(PARAM_DIR + "commands.json", lang);
    paramtype = json2dict(CONTENTS_DIR + "paramtype.json")
    params = ""
    params += paramPanels(lang, paramtype, PARAM_DIR + 'param.json', COMMON_DIR + 'panel.html')
    return commands + params

""" ********************************* """
""" ********************************* """
def scenario(lang):
    commands = inputGroupFromJson(SCENARIO_DIR + "commands.json", lang);
    return rephrase(SCENARIO_DIR + "scenario.html", {"COMMANDS": commands});
""" ********************************* """
""" ********************************* """
def statistics(lang):
    return 'statistics'

""" ********************************* """
""" ********************************* """
def development(lang):
    protocol = json2dict(DEVELOP_DIR + "protocol.json")
    html_str = ""
    html_str += job();
    html_str += serverVersion();
    th_style = "background-color: grey; color: white;"
    th_row = ""
    for elem in ["method", "action", "option", "stage", "hint"]:
        th_row += tag("td", elem, {"style": th_style})
    th_row = tag("tr", th_row);
    for section in protocol:
        rows = ""
        for p in protocol[section]['protocol']:
            description = p['description'] if 'description' in p else ""
            rows += tag("tr",\
                    tag("td", p['method']\
                    + " [" + p['action']\
                    + "] " + description,\
                    {"style": "background-color: var(--hover-color); color: white;", "colspan": "5"})\
                    )
            rows += th_row
            if 'names' in p:
                for opt in p['names']:
                    row = tag("td", "") + tag("td", "")
                    row += tag("td", opt['opt'])
                    row += tag("td", opt['dev'] if 'dev' in opt else '')
                    row += tag("td", opt['hint'] if 'hint' in opt else '')
                    rows += tag("tr", row)
        html_str += rephrase(DEVELOP_DIR + "table.html", {"CATEGORY": protocol[section]['category'], "TABLEROW": rows})
    return html_str
""" ********************************* """
""" ********************************* """
def serverVersion():
    html_str = ""
    html_str += tag("button", "SV version",{\
            "type": "button",\
            "onclick": "getServerVersion('SVversion');"
            })
    html_str += tag("span", '', {"id": "SVversion"})
    return html_str

def job():
    html_str = ""
    html_str += tag("button", "ジョブの待ち行列の監視",{\
            "type": "button",\
            "onclick": "getJobQueueStatus('job_queue');"
            })
    html_str += tag("span", '', {"id": "job_queue"})
    return html_str
""" ****************************** 
page function
********************************* """
PAGE_FUNC = {}
PAGE_FUNC["sim"] = sim
PAGE_FUNC["param"] = param
PAGE_FUNC["scenario"] = scenario
PAGE_FUNC["statistics"] = statistics
PAGE_FUNC["development"] = development
""" ****************************** 
partial
********************************* """
def paramSlider(lang, param):
    param['min'] = param['min'] if 'min' in param else '0'
    param['max'] = param['max'] if 'max' in param else '100'
    param['value'] = param['value'] if 'value' in param else '50'
    unit = param['unit'][lang] if 'unit' in param else ''
    description = param['description'][lang] if 'description' in param else '謎のパラメータ'
    description = tag("div", description, {"class": 'param-title'})
    del param['unit'],  param['description']
    return slider(description, param, unit = unit)

def paramNumber(lang, param):
    for_id = param['id']
    label = tag("label", param['description'][lang], {'for': for_id, 'class': 'num-label'})
    unit = tag("span", param['unit'][lang] if 'unit' in param else '')
    del param['description'], param['unit']
    param['class'] = "param-input"
    numbox = tag("input", attr=param, end=False)
    return tag("div", label + numbox + unit, {'class': 'param-num'})

def paramDistribution(lang, param):
    rep_dict = {
            'ID': param["id"],
            'TITLE': param["description"][lang],
            'VALUE-MIN': param['value'][0],
            'VALUE-MAX': param['value'][1],
            'VALUE-MODE': param['value'][2],
            'UNIT': tag("span", param['unit'][lang]) if 'unit' in param else "",
            'MINIMUM': 'Minimum' if lang == 'EN' else '最小値',
            'MAXIMUM': 'Maximum' if lang == 'EN' else '最大値',
            'MODE': 'Mode' if lang == 'EN' else '最頻値'
            }
    return rephrase(PARAM_DIR + "distribution.html", rep_dict, 1000)

def panel(lang, _id, str_list, title, content, template_file, icon_normal = '"▶︎"', icon_checked = '"▼"', add_property = True):
    if add_property:
        addProperty('param_formnames', _id + '-form')
    attr = {}
    attr['PANEL-CMD'] = buttonGroup(\
            jsonStr2dict(\
                rephrase(\
                    COMMON_DIR + "panel.json",\
                    {"ID": _id}, 1000),\
                True),\
            lang)
    attr['ID'] = _id
    attr['FORMNAME'] = _id + "-form"
    attr['VAL'] = str_list
    attr['PANEL-TITLE'] = title
    attr['PANEL-CONTENT'] = content
    attr['ICON-NORMAL'] = icon_normal
    attr['ICON-CHECKED'] = icon_checked
    return rephrase(template_file, attr, 1000)

def paramPanels(lang, p_types, paramjsonfile, template_file, add_property = True):
    categories = json2dict(paramjsonfile)
    panels =""
    for category in categories:
        c = categories[category]
        p_list = c['param-list'].split(',')
        panel_title = c['name'][lang] if 'name' in c else 'カテゴリ名前がない!'
        params = ""
        for id in p_list:
            param = p_types[id]
            param['id'] = id
            if param['type'] == 'range':
                params += paramSlider(lang, param)
            elif param['type'] == 'number':
                params += paramNumber(lang, param)
            elif param['type'] == 'distribution':
                params += paramDistribution(lang, param)
            else:
                params += '謎のふぉーむ: ' + param['type']
        panels += panel(lang, category, c['param-list'], panel_title, params, template_file)
    return panels

def head(title, stylesheets=[], scripts=[]):
    html = tag("title", title)\
            + tag("meta", attr={'charset': 'utf-8'}, end = False)\
            + tag("link", attr = {'rel': 'icon', 'href': '../favicon.png'}, end = False)
    for stylesheet in stylesheets:
        html += tag("link", attr={'rel': 'stylesheet', 'href': stylesheet}, end=False)
    for script in scripts:
        html+= tag("script", '', {'src':script})
    return html;

def header(jsonfile, lang):
    data = json2dict(jsonfile)
    data['TITLE'] = data['TITLE'][lang]

    data["SIGNATURE"] = tag("a", data['SIGNATURE']['name'][lang],\
            {'href' : data['SIGNATURE']['link']})

    data["DESCRIPTION"] = \
            data["DESCRIPTION"]["description"][lang]\
            + tag("a",\
            data["DESCRIPTION"]["project"][lang],\
            {'href' : data["DESCRIPTION"]["project-link"],\
            'target' : '_blank'})
    data["HINT"] = data["HINT"][lang]
    data["LINK"] = data["LINK"][lang]
    data["LINKNAME"] = data["LINKNAME"][lang]

    return rephrase(COMMON_DIR + "header.html", data)
""" ******************************
json
********************************* """
def jsonStr2dict(json_str, ordered=False):
    if ordered:
        return json.loads(json_str, object_pairs_hook=OrderedDict)
    return json.loads(json_str)

def json2dict(filename, ordered=False):
    json_str = ""
    with open(filename) as f:
        json_str = f.read()
    return jsonStr2dict(json_str, ordered)

""" ******************************
tools
********************************* """
def rephrase(template_file, data_dict, count=1):
    template_str = ""
    with open(template_file) as f:
        template_str = f.read()

    for key in data_dict:
        template_str = template_str.replace(key, data_dict[key], count)
    return template_str

""" ******************************
html parts
********************************* """
def slider( label, attr, unit=''):
    attr['type'] = 'range'
    if 'value' not in attr:
        return 'error'
    if 'id' not in attr:
        return 'error'
    if 'step' not in attr:
        return 'error'
    if 'min' not in attr:
        attr['min'] = '0'
    if 'max' not in attr:
        attr['max'] = '100'
    prefix='view'
    attr['oninput'] = 'sliderValueChanged(this,' + "\'" + prefix + attr['id'] +"\'" + ')'
    html = tag("span", attr['min'])
    html += tag("input", attr=attr, end=False)
    html += tag("span", attr['max'])
    html += tag("input", attr={'type': 'number', 'step': attr['step'],\
            'value': attr['value'], 'class': 'slider_value', 'id': prefix + attr['id'],\
            'oninput': 'sliderValueChanged(this, ' + "\'" + attr['id'] + "\'" + ')'},\
            end= False)
    if unit != '':
        html += tag("span", unit, {'class': 'slider_unit'})
    slider_input = tag("div", html, {'class': 'slider'})
    return tag("div", label + slider_input)

def tag(tagname, content = '', attr={}, end=True):
    html_str = "<" + tagname + attributes(attr) + ">"
    if end:
        html_str += content
        html_str += "</" + tagname +">"
    return html_str

# ex {'class' : 'float', 'id': 'myid'}
def attributes(attr_dict):
    html_str = ""
    for key in attr_dict:
        if attr_dict[key] != '':
            html_str += ' ' + key + ' = "' + attr_dict[key] + '"'
    return html_str
""" ****************************** 
tab
********************************* """
def tabItemContainer(tab_items, container_id, myclass = 'tab_container'):
    return tag("div", tab_items, {'class' : myclass, 'id' : container_id})

def addTab(tabname, id, name, c_func, lang, checked=False):
    attr={
            'type':'radio',
            'id': id,
            'name': name,
            'style': 'display:none;'
            }
    if checked:
        attr['checked'] = 'checked'
    tab = tag("input",attr= attr, end=False)
    tab += tag("label", tabname, {'for':id, 'class': 'tab_item'})
    tabcontent = tag("div", c_func(lang), {'class': 'tab_content', 'id': id + '_content'})
    style = tag("style", rephrase(COMMON_DIR + "tab_style.css", {'ID': id}, 100))
    return {'tab_item': style + tab, 'tab_content': tabcontent}

""" ******************************
build
******************************** """
def buildPage(lang):
    stylesheets=[\
            STYLES + "common.css"\
    ]
    scripts=[\
        #"https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.3.3/pixi.min.js",\
        #SCRIPTS + "windowPanel.js",\
        SCRIPTS + "canvas.js",\
        SCRIPTS + "script.js"\
    ]
    data = {}
    data["HEAD"] = head("SimEpidemic",\
        stylesheets,\
        scripts)
    data["HEADER"] = header(COMMON_DIR + "header.json", lang)
    tablist = json2dict(COMMON_DIR + "tabs.json", ordered = True)
    tab_items = ""
    tab_contents = ""
    for key in tablist:
        checked = False if 'checked' not in tablist[key] else True
        tab = addTab(tablist[key]["tabname"][lang], key, 'page_tab', PAGE_FUNC[key], lang, checked)
        tab_items += tab['tab_item']
        tab_contents += tab['tab_content']

    data["MAIN"] = tabItemContainer(tab_items + tab_contents,'tabs')
    data["PROPERTY"] = tag("form", convertMyProperty(), {"style": "display:none;", "name": "property"})
    with open(OUTPUT_FILE[lang], mode="w") as f:
        f.write(rephrase(COMMON_DIR + "base.html", data))

def langSwitchPage():
    data = {}
    data['PROPERTY'] = ""
    data['HEAD'] = head('SimEpidemic', stylesheets=[STYLES + 'common.css'])
    data['HEADER'] = ''
    with open(COMMON_DIR + 'toppage.html') as f:
        data['MAIN'] = f.read()
    with open(OUTPUT_DIR + 'index.html', mode="w") as f:
        f.write(rephrase(COMMON_DIR + "base.html", data))

""" ******************************
main
******************************** """
buildPage("JA")
buildPage("EN")
langSwitchPage();
