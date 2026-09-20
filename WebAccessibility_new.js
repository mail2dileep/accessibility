var AxeBuilder = require('@axe-core/webdriverjs'),
    AxeReports = require('axe-reports'),
    webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

 

var driver = new webdriver.Builder()
    .forBrowser('firefox') //or firefox or whichever driver you use
    .build();

 

var AXE_BUILDER = AxeBuilder(driver);
    // specify your test criteria (see aXe documentation for more info)

 

var pathConfig = {};
var csvjson = require('csvjson');
var fs = require('fs');
var options = {
    delimiter : ',' , // optional
    quote     : '"' // optional
};
var file_data = fs.readFileSync('./TestData/TesturlUpdated.csv', { encoding : 'utf8'});
console.log(file_data);
pathConfig.array = csvjson.toObject(file_data, options);
console.log(pathConfig.array); //Converted json object from csv data
module.exports = pathConfig;

const fs1 = require('fs')

const path = './Output/test-results.csv'
if (fs1.existsSync(path))
{
try {
  fs1.unlinkSync(path)
  //file removed
} catch(err) {
  console.error(err)
}
}

var executeDriver = function(i,array)
{
    if(i<array.length)
	{
        setTimeout(function()
		{
            var url = pathConfig.array[i].URL;
			driver.get(url);

			driver.then(
			setTimeout(
			function () 
			{
			AXE_BUILDER.analyze
				(
					
					function (results) 
						{
						AxeReports.processResults(results, 'csv', './Output/test-results', false,i);
						executeDriver(i+1,array);
						},10000);
							},10000));
		},20000);
		
	}
	else
			driver.close();
	
}

if(pathConfig.array.length){
    executeDriver(0,pathConfig.array);

}


