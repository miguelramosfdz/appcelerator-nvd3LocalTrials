function Controller() {
    function loadVisualization() {
        console.log("~~~ loading ~~~");
        var newFile = Titanium.Filesystem.getFile("d3_Resources/ex_line_chart.html");
        var visualizationPath = newFile.nativePath;
        $.visualizerWebView.url = visualizationPath;
    }
    function sinAndCos() {
        var sin = [], sin2 = [], cos = [];
        for (var i = 0; 100 > i; i++) {
            sin.push({
                x: i,
                y: Math.sin(i / 10)
            });
            sin2.push({
                x: i,
                y: .25 * Math.sin(i / 10) + .5
            });
            cos.push({
                x: i,
                y: .5 * Math.cos(i / 10)
            });
        }
        return [ {
            values: sin,
            key: "Sine Wave",
            color: "#D2D9BA"
        }, {
            values: sin2,
            key: "Another sine wave",
            color: "#95BDA6"
        }, {
            values: cos,
            key: "Cosine wave",
            color: "#F5E687"
        } ];
    }
    function windowPostlayout() {
        loadVisualization();
        Titanium.App.fireEvent("chartItUp", {});
        console.log("titanium event fired in window postlayout");
    }
    function webviewLoaded() {
        var myData = sinAndCos();
        Ti.App.fireEvent("fromIndex", {
            myData: myData
        });
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "index";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.index = Ti.UI.createWindow({
        backgroundColor: "white",
        layout: "vertical",
        id: "index"
    });
    $.__views.index && $.addTopLevelView($.__views.index);
    windowPostlayout ? $.__views.index.addEventListener("postlayout", windowPostlayout) : __defers["$.__views.index!postlayout!windowPostlayout"] = true;
    $.__views.visualizerWebView = Ti.UI.createWebView({
        id: "visualizerWebView",
        height: "50%"
    });
    $.__views.index.add($.__views.visualizerWebView);
    webviewLoaded ? $.__views.visualizerWebView.addEventListener("load", webviewLoaded) : __defers["$.__views.visualizerWebView!load!webviewLoaded"] = true;
    $.__views.stepsVisualization = Alloy.createWidget("ProteusVisualization", "widget", {
        id: "stepsVisualization",
        height: "50%",
        __parentSymbol: $.__views.index
    });
    $.__views.stepsVisualization.setParent($.__views.index);
    exports.destroy = function() {};
    _.extend($, $.__views);
    Ti.App.addEventListener("chartItUp", function() {
        console.log("listening for charting on nvd3localtrieals index");
    });
    Ti.App.addEventListener("fromWebview", function() {
        console.log("just received word of webivew event");
    });
    $.index.open();
    __defers["$.__views.index!postlayout!windowPostlayout"] && $.__views.index.addEventListener("postlayout", windowPostlayout);
    __defers["$.__views.visualizerWebView!load!webviewLoaded"] && $.__views.visualizerWebView.addEventListener("load", webviewLoaded);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;