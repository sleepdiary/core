const puppeteer = require("puppeteer");

(async () => {

    process.stderr.write("Running tests in headless " + (process.env.PUPPETEER_PRODUCT||"chrome"));

    for ( let n=0; n!=3; ++n ) {

        try {

            const browser = await puppeteer.launch();
            process.stderr.write('.');

            const page = await browser.newPage();
            process.stderr.write('.');

            await page.goto("file:///app/browser_test.html");
            process.stderr.write('. ');

            await page.waitForFunction("(jsApiReporter||{}).finished")
                .then(
                    async () => {

                        var status = await page.evaluate( () => jsApiReporter.runDetails.overallStatus );

                        await browser.close();

                        console.log( status );

                        process.exit( ( status == "passed" ) ? 0 : 2 );

                    },

                    () => {

                        console.error( "Could not run - test suite failed to load"  );
                        process.exit( 3 );

                    }
                );

        } catch (e) {
            process.stderr.write(e);
        }

    }

    console.error( "Could not run - Chromium failed to load"  );
    process.exit( 3 );

})();
