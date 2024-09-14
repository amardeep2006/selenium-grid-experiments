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
    const { stream } = await client.send('Fetch.takeResponseBodyAsStream', {
      requestId
    });

    // Create a write stream to save the file to disk
    const fileStream = fs.createWriteStream(uuidv4() + `downloaded_file.${fileType}`);
    let eof = false;
    // Function to read from the stream and write to disk
    async function readFromStream() {
      while (!eof) {
        // Read the response body chunk by chunk
        const { data, base64Encoded, eof: streamEnd } = await client.send('IO.read', { handle: stream });

        // Write the chunk to the file stream (if base64Encoded, decode it first)
        if (base64Encoded) {
          fileStream.write(Buffer.from(data, 'base64'));
        } else {
          fileStream.write(data);
        }

        // If we reach the end of the file, close the file stream
        if (streamEnd) {
          eof = true;
          fileStream.end();
          console.log('File Download complete via CDP Fetch!');
        }
      }

      // Close the stream handle once the download is done
      await client.send('IO.close', { handle: stream });
    }

    // Start reading and writing the stream
    await readFromStream();
  });

  await page.goto('https://www.selenium.dev/selenium/web/downloads/download.html');
  // Click to download
  await page.getByRole('link', { name: `File ${fileType === 'txt' ? '1' : '2'}` }).click();

  await page.waitForTimeout(5000); // waits for 5 seconds

  // Close the browser
  await page.close();
}

test('Test text file download', async ({ page }) => {
  await downloadFile(page, 'txt');
});

test('Test jpg file download', async ({ page }) => {
  await downloadFile(page, 'jpg');
});