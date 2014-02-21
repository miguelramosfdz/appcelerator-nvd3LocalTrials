function Controller() {
    function loadVisualization() {
        console.log("~~~ loading ~~~");
        var newFile = Titanium.Filesystem.getFile("d3_Resources/ex_line_chart.html");
        var visualizationPath = newFile.nativePath;
        $.visualizerWebView.url = visualizationPath;
    }
    function windowPostlayout() {
        loadVisualization();
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
        id: "index"
    });
    $.__views.index && $.addTopLevelView($.__views.index);
    windowPostlayout ? $.__views.index.addEventListener("postlayout", windowPostlayout) : __defers["$.__views.index!postlayout!windowPostlayout"] = true;
    $.__views.visualizerWebView = Ti.UI.createWebView({
        id: "visualizerWebView",
        height: "90%"
    });
    $.__views.index.add($.__views.visualizerWebView);
    exports.destroy = function() {};
    _.extend($, $.__views);
    $.index.open();
    __defers["$.__views.index!postlayout!windowPostlayout"] && $.__views.index.addEventListener("postlayout", windowPostlayout);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;