import json
import os
import shutil
from collections import OrderedDict
""" ********************************
const
******************************** """
TEMPLATE_DIR = "templates/"
JSON_DIR = "json/"
OUTPUT_DIR = "../SimEpidemic/"

""" ******************************
content
********************************* """
""" ****************************** 
partial
********************************* """
def paramPanels(jsonfile):
    params = json2dict(jsonfile)

def head(title, stylesheets=[], scripts=[]):
    html = tagWithEnd("title", title)\
            + tagWithoutEnd("meta", {'charset': 'utf-8'})
    for stylesheet in stylesheets:
        html += tagWithoutEnd("link", {'rel': 'stylesheet', 'href': stylesheet})
    for script in scripts:
        html+= tagWithEnd("script", '', {'href':script})
    return tagWithEnd("head", html)

def header(jsonfile):
    data = json2dict(jsonfile)
    data["SIGNATURE"] = \
            tagWithEnd("a", data["SIGNATURE"]["name"],\
            {'href' : data["SIGNATURE"]["link"]})

    data["DESCRIPTION"] = \
            data["DESCRIPTION"]["description"]\
            + tagWithEnd("a",\
            data["DESCRIPTION"]["project"],\
            {'href' : data["DESCRIPTION"]["project-link"],\
            'target' : '_blank'})

    html  = tagWithEnd("h1", data["TITLE"])
    html += tagWithoutEnd('input', { 'type': 'checkbox', 'id':'info-checkbox'})
    html += tagWithEnd("label", '', {'for': 'info-checkbox', 'class': 'info', 'title' : "これは何?"})
    html +=  tagWithEnd("p", data["DESCRIPTION"],{'class': 'panel', 'id':'info-panel'})
    html = tagWithEnd("div", html)
    subinfo = tagWithEnd("span", "ver." + data["VERSION"],{'class': 'info-item'})
    subinfo += tagWithEnd("span", "更新日: " + data["UPDATE"], {'class': 'info-item'})
    subinfo += tagWithEnd("span", data["SIGNATURE"], {'class':'info-item'})
    html += tagWithEnd("div", subinfo)
    return tagWithEnd("header", html)

""" ****************************** 
tab
********************************* """
def tabItemContainer(tab_items, container_id):
    return tagWithEnd("div", tab_items, {'class' : 'tab_container', 'id' : container_id})

def addTab(tabname, id, name, tab_container_id, content, checked=''):
    suffix = '_content'
    style = "<style>"\
        + "#" + id + suffix +"{display: none;}"\
        + "#" + id + ":checked ~ #" + id + suffix\
        + "{display: block;}"
    style += "#" + id + ":checked + ." + "tab_item" + "{"\
        + "background-color: white;"\
        + "color: var(--my-black);"\
        + "border: none;"\
        + "}"
    style += "</style>"
    tab = tagWithoutEnd("input", {'type':'radio', 'class' : 'tab_checkbox', 'id': id, 'name': name, 'checked': 'checked'})
    tab += tagWithEnd("label", tabname, {'for':id, 'class': 'tab_item'})
    tabcontent = tagWithEnd("div",content, {'class': 'tab_content', 'id' : id+suffix})
    return {'tab_item': style + tab, 'tab_content': tabcontent}

""" ******************************
json
********************************* """
def json2dict(filename, ordered=False):
    json_str = ""
    with open(filename) as f:
        json_str = f.read()
    if ordered:
        return json.loads(json_str, object_pairs_hook=OrderedDict)
    return json.loads(json_str)

""" ******************************
tools
********************************* """
def rephrase(template_file, data_dict):
    template_str = ""
    with open(template_file) as f:
        template_str = f.read()

    for key in data_dict:
        template_str = template_str.replace(key, data_dict[key], 1)
    return template_str

def makedirs(path, fource = False):
    if not os.path.isdir(path):
        os.makedirs(path)
    elif fource:
        shutil.rmtree(path)
        os.makedirs(path)
    else:
        return

""" ******************************
html parts
********************************* """
def slider( name, attr, unit=''):
    attr['type'] = 'range'
    if 'id' not in attr:
        return 'error'
    if 'value' not in attr:
        return 'error'

    html = tagWithEnd("label", name, {\
            'for': attr['id'],
            'class': 'slider_label'\
            });
    html += tagWithoutEnd("input", attr)
    html += tagWithEnd("span",\
            attr['value'],\
            {'class': 'slider_value'});
    if unit != '':
        html += tagWithEnd("span", unit, {'class': 'slider_unit'})
    html = tagWithEnd("div", html, {'class': 'slider_wrapper'})
    return html

def tagWithoutEnd(tagname, attr_dict={}) :
    html_str = "<" + tagname + attributes(attr_dict) + ">"
    return html_str

def tagWithEnd(tagname, content, attr_dict={}):
    html_str = tagWithoutEnd(tagname, attr_dict)
    html_str += content
    html_str += "</" + tagname +">"
    return html_str;

# ex {'class' : 'float', 'id': 'myid'}
def attributes(attr_dict):
    html_str = ""
    for key in attr_dict:
        if attr_dict[key] != '':
            html_str += " " + key + " = '" + attr_dict[key] + "'"
    return html_str

""" ******************************
build
******************************** """
makedirs(OUTPUT_DIR, fource=True);
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["../css/common.css"])
data["HEADER"] = header(JSON_DIR + "info.json")
tab1 = addTab('tabname', 'id', 'page_tabs', 'tabs', 'content')
tab2 = addTab('tabname2', 'id2', 'page_tabs', 'tabs', 'content2', 'checked')
tabitems = tab1['tab_item'] + tab2["tab_item"]
tab_contents = tab1["tab_content"] + tab2["tab_content"]
data["MAIN"] = tabItemContainer(tabitems + tab_contents, 'tabs')
data["MAIN"] += tab1["tab_content"] + tab2["tab_content"]
data["MAIN"] += tagWithEnd("div",\
        slider('さんぷる', {'id': 'slider', 'value': '50'}, unit='サンプル')\
        );
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(TEMPLATE_DIR + "base.html", data))
