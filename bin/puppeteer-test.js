const puppeteer = require("puppeteer");

(async () => {

    process.stdout.write("Running tests in headless " + (process.env.PUPPETEER_PRODUCT||"chrome") + "... ");

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto("file:///app/browser_test.html");

    await page.waitForFunction("jsApiReporter.finished");

    var status = await page.evaluate( () => jsApiReporter.runDetails.overallStatus );

    await browser.close();

    console.log( status );

    process.exit( ( status == "passed" ) ? 0 : 2 );

})();
