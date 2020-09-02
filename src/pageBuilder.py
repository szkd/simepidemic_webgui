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
""" OUTPUT """


""" ******************************
content
********************************* """
""" ****************************** 
partial
********************************* """
def head(title, stylesheets=[], scripts=[]):
    html = "<head><title>" + title + "</title>"\
            + "<meta charset='utf-8'>"
    for stylesheet in stylesheets:
        html +="<link rel='stylesheet' href='"\
               + stylesheet + "'>"
    for script in scripts:
        html+="<script href='"\
                + script + "'></script>"
    html+="</head>"
    return html

def header(jsonfile):
    html = "<header class='suns-serif'>"
    """ NAVIもここで """
    data = json2dict(jsonfile)
    data["SIGNATURE"] = \
            a(data["SIGNATURE"]["link"],\
            data["SIGNATURE"]["name"])
    data["DESCRIPTION"] = \
            data["DESCRIPTION"]["description"]\
            + a(data["DESCRIPTION"]["project-link"],\
            data["DESCRIPTION"]["project"],\
            target='_blank')

    html += h1(data["TITLE"])\
            + input('checkbox', id='info-checkbox')\
            + label('', 'info-checkbox', myclass= 'info', title="これは何?")\
            + p(data["DESCRIPTION"], myclass='panel suns-serif', id='info-panel')
    html += div(\
            span("ver." + data["VERSION"], myclass="info-item")\
            + span("更新日: " + data["UPDATE"], myclass="info-item")\
            + span(data["SIGNATURE"], myclass="info-item"),\
            )
    html+= "</header>"
    return html;

def tabContainer(jsonfile):
    tabs = json2dict(jsonfile, ordered=True)
    # tab_item { "tabname": {page-function: "functionname", jsons: ['json1', 'json2']}}
    tabhtml = ""
    for tab in tabs:
        tabhtml += addTab(tab, tabs[tab])
    return div(\
            div(tabhtml, myclass="tab_item"),\
            myclass="tabs"\
           )


def rephrase(template_file, data_dict):
    template_str = ""
    with open(template_file) as f:
        template_str = f.read()

    for key in data_dict:
        template_str = template_str.replace(key, data_dict[key], 1)
    return template_str

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
def h1(content, myclass='', id=''):
    return "<h1" + attribute(myclass, id) + ">" + content + "</h1>"

def input (type, myclass='', id='', title=''):
    html_str = "<input type='" + type + "'"
    html_str += attribute(myclass, id)
    html_str += ">"
    return html_str

def label(label_str, for_id, myclass='', id='', title=''):
    html =  "<label for=" + for_id + attribute(myclass, id, title) + ">"
    html += label_str + "</label>"
    return html

def attribute(myclass, id, title='', target=''):
    html_str = ""
    if id != '':
        html_str += " id='" + id + "'"
    if myclass != '':
        html_str += " class='" + myclass+ "'"
    if title != '':
        html_str += " title='" + title+ "'"
    if target != '':
        html_str += " target=" + target+ "'"

    return html_str

def div(content, myclass='', id=''):
    html_str = "<div"
    html_str += attribute(myclass, id)
    html_str += ">" + content  + "</div>"
    return html_str

def a(url, description, myclass='', id='', target=''):
    html_str = "<a href='" + url + "'"
    html_str += attribute(myclass, id, target)
    html_str += ">" + description + "</a>"
    return html_str

def button(title, myclass='', id =''):
    html_str = "<button"
    html_str += attribute(myclass, id);
    return html_str + ">" + title + "</button>"

def span(content, myclass="", id=""):
    html_str = "<span"
    html_str += attribute(myclass, id);
    return html_str + ">" + content + "</span>"

def p(content, myclass='', id=''):
    html_str = "<p" + attribute(myclass, id) + ">"
    html_str += content;
    html_str += "</p>"
    return html_str
""" ******************************
build
******************************** """
makedirs(OUTPUT_DIR, fource=True);
data = {}
data["HEAD"] = head("SimEpidemic", stylesheets=["../css/common.css"])
data["HEADER"] = header(JSON_DIR + "info.json")
with open(OUTPUT_DIR + "index.html", mode="w") as f:
    f.write(rephrase(TEMPLATE_DIR + "base.html", data))
