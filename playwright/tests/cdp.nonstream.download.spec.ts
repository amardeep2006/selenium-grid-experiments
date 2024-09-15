//This example is alternative Implementation via takeResponseBody for smaller files
// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function downloadFile(page, fileType) {
  // Enable CDP session
  console.log('Fork CDP session.');
  const client = await page.context().newCDPSession(page);
  console.log('Send CDP Page.setDownloadBehavior.');
  // Set downloadPath to a valid location on Grid Node
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: '/home/seluser/Downloads'
  });
  console.log('Send CDP Fetch.enable');
  // Setup request interception for your download, intercepting specific file types for demo
  await client.send('Fetch.enable', {
    patterns: [{ urlPattern: `*.${fileType}`, requestStage: 'Response' }]
  });
  console.log('Send CDP Fetch.requestPaused');
  client.on('Fetch.requestPaused', async event => {
    const { requestId } = event;
    console.log(`Request "${requestId}" paused.`);
//Only suitable for small files, see another example in this repo for streaming
    const responseCdp = await client.send("Fetch.getResponseBody", { requestId });
    console.log(`Response body for ${requestId} is ${responseCdp.body.length} bytes`);

    // Check if the response is base64 encoded
    const isBase64Encoded = responseCdp.base64Encoded;

    const data = isBase64Encoded ? Buffer.from(responseCdp.body, 'base64') : responseCdp.body;
    var filename = uuidv4() + `NSdownloaded_file.${fileType}`;
    fs.writeFileSync(filename, data);

    // Create a write stream to save the file to disk
    fs.writeFileSync(filename, data);

    await client.send("Fetch.continueRequest", { requestId });

  });

  await page.goto('https://www.selenium.dev/selenium/web/downloads/download.html');
  // Click to download
  await page.getByRole('link', { name: `File ${fileType === 'txt' ? '1' : '2'}` }).click();

  await page.waitForTimeout(5000); // waits for 5 seconds

  // Close the browser
  await page.close();
}

test('Test text file download Non Streaming', async ({ page }) => {
  await downloadFile(page, 'txt');
});

test('Test jpg file download  Non Streaming', async ({ page }) => {
  await downloadFile(page, 'jpg');
});