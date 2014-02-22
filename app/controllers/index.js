function loadVisualization() {
	console.log("~~~ loading ~~~");
	
	var newFile = Titanium.Filesystem.getFile('d3_Resources/ex_line_chart.html');
	var visualizationPath = newFile.nativePath;
	
	$.visualizerWebView.url = visualizationPath;
}

//test data generator
function sinAndCos() {
	var sin = [], sin2 = [], cos = [];

	//data is represented as array of {x, y} pairs
	for (var i = 0; i < 100; i++) {
		sin.push({x: i, y: Math.sin(i/10)});
		sin2.push({x: i, y: Math.sin(i/10) * 0.25 + 0.5});
		cos.push({x: i, y: .5 * Math.cos(i/10)});
	}

	//Line chart data should be sent as an array of series objects
	// that is, {key: *series name*, color: *hex*, values: *array of values in {x: ... ,y: ... } pairs*}
	return [
	{
		values: sin,
		key: 'Sine Wave',
		color: '#D2D9BA'
	},
	{
		values: sin2,
		key: 'Another sine wave',
		color: '#95BDA6'
	}, {
		values: cos,
		key: 'Cosine wave',
		color: '#F5E687'
	}
	];
};

Ti.App.addEventListener('chartItUp', function(e) {
	console.log('listening for charting on nvd3localtrieals index');
});

Ti.App.addEventListener('fromWebview', function(e) {
	console.log('just received word of webivew event');
});

// view lifecycles
function windowPostlayout(e) {
	loadVisualization();
	Titanium.App.fireEvent('chartItUp',{});
	console.log("titanium event fired in window postlayout");
}

function webviewLoaded(e) {
	var myData = sinAndCos();
	Ti.App.fireEvent('fromIndex', {"myData": myData});
}

$.index.open();