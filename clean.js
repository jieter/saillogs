/*
 * Clean up data json files (round latlngs and prettyprint)
 */

var fs = require('fs');

var formatNum = function (num, digits) {
	var pow = Math.pow(10, digits || 5);
	return Math.round(num * pow) / pow;
};

if (process.argv.length < 3) {
	console.error('Please provide a name to clean...');
	process.exit();
}
var name = process.argv[2];

console.log('Cleaning ' + name);

fs.readFile(__dirname + '/' + name, 'utf8', function (error, data) {
	 if (error) {
		console.log('Error: ' + error);
		return;
	}

	data = JSON.parse(data);
	for (var i in data.legs) {
		if (data.legs[i].path && (typeof data.legs[i].path) !== "string") {
			for (var j in data.legs[i].path) {
				data.legs[i].path[j] = [
					formatNum(data.legs[i].path[j][0], 5),
					formatNum(data.legs[i].path[j][1], 5)
				]
			}
			console.log(data.legs[i].date, JSON.stringify(data.legs[i].path));
		}
	}

	//console.log(JSON.stringify(data).replace(/(path|text)/g, '\n$1'));

});


