var AxeBuilder = require('@axe-core/webdriverjs'),
    AxeReports = require('axe-reports'),
    webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser('firefox') //or firefox or whichever driver you use
    .build();

var AXE_BUILDER = AxeBuilder(driver); // specify your test criteria (see aXe documentation for more info)

driver.get('https://stayingsharp-pi.aarp.org');
/* 
			driver.then(
			
			function () 
			{
			AXE_BUILDER.analyze
				(
					
					function (results) 
						{
							
							
						AxeReports.processResults(results, 'csv', './Output/test-results', true);
						
						},10000);
							},); */
			driver.then(
			  new AxeBuilder(driver).analyze(
  (err, results) => {
    if (err) 
	{
      // Handle error somehow
    }
    console.log(results);
	AxeReports.processResults(results, 'csv', './Output/test-results', false);
  }))