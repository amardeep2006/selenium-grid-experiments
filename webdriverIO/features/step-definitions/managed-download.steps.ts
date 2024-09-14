import { Given, When, Then } from '@wdio/cucumber-framework';
import { expect, $ } from '@wdio/globals'
import * as path from 'path'

Given(/^User downloads File$/, async () => {
    await browser.url('https://www.selenium.dev/selenium/web/downloads/download.html');
    await $('#file-1').click()
    await browser.waitUntil(async function () {
        return (await browser.getDownloadableFiles()).names.includes('file_1.txt')
    }, {timeout: 5000})
    // get downloadable files info on grid
    const files = await browser.getDownloadableFiles()
    console.log('Result of getDownloadableFiles is ' + files);
    //download the file to local machine
    const downloaded = await browser.downloadFile(files.names[0], path.join(process.cwd(), 'localfiles'))
    console.log('downloaded result:' + downloaded)
    // Delete downloadable files on grid
    await browser.deleteDownloadableFiles()
});
