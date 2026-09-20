var AxeBuilder = require('@axe-core/webdriverjs'),
    AxeReports = require('axe-reports'),
    webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
	var chrome = require('selenium-webdriver/chrome')
var chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless', '--disable-gpu', '--window-size=1920,1080');

 

var driver = new webdriver.Builder()
    .forBrowser('chrome')
	.setChromeOptions(chromeOptions)
    .build();
	

var AXE_BUILDER = new AxeBuilder(driver);
    // specify your test criteria (see aXe documentation for more info)

 

var pathConfig = {};
var csvjson = require('csvjson');
var fs = require('fs');
var options = {
    delimiter : ',' , // optional
    quote     : '"' // optional
};
var file_data = fs.readFileSync('../TesturlUpdated.csv', { encoding : 'utf8'});
pathConfig.array = csvjson.toObject(file_data, options);
console.log(pathConfig.array);
 //Converted json object from csv data
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
			console.log(url);

			driver.then(
			setTimeout(
			function () 
			{
			AXE_BUILDER.analyze
				(
					
					function (err,results) 
						{
							if (err) 
							{
								console.log("error in Analyzing page");
							}
							
						AxeReports.processResults(results, 'csv', './Output/test-results', false,i);
							executeDriver(i+1,array);
							//console.log(results);
						},10000);
							},10000));
		},10000);
		
	}
	else
			driver.close();
	
}
//executeDriver(1,array);

if(pathConfig.array.length){
    executeDriver(0,pathConfig.array);

}


