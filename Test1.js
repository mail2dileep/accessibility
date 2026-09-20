const AxeBuilder = require('@axe-core/webdriverjs');
const WebDriver = require('selenium-webdriver');

const driver = new WebDriver.Builder().forBrowser('chrome').build();

/* driver.get('https://stayingsharp-pi.aarp.org').then(() => 
{
  new AxeBuilder(driver).analyze(
  (err, results) => {
    if (err) 
	{
      // Handle error somehow
    }
    console.log(results);
  });
}); */

driver.get('http://uat-blogs.marvell.com/2021/10/marvell-and-los-alamos-national-laboratory-demonstrate-high-bandwidth-capability-for-hpc-storage-workloads-in-the-data-center-with-ethernet-bunch-of-flash-ebof-platform/');
 (err, results) => {
    if (err) 
	{
      // Handle error somehow
    }
  }
driver.then(new AxeBuilder(driver).analyze((err, results) => {
    if (err) 
	{
      // Handle error somehow
    }
	console.log(results);
  }));
