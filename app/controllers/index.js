function loadVisualization() {
	console.log("~~~ loading ~~~");
	
	var newFile = Titanium.Filesystem.getFile('d3_Resources/ex_line_chart.html');
	// var newFile = Titanium.Filesystem.getFile('d3_Resources/hello.html');
	// var newFile = Titanium.Filesystem.getFile('hello.html');
	
	var visualizationPath = newFile.nativePath;
	
	$.visualizerWebView.url = visualizationPath;
}

// view lifecycles
function windowPostlayout(e) {
	loadVisualization();
}

$.index.open();