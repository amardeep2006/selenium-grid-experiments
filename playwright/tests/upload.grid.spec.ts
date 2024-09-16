// @ts-check
const { test, expect } = require('@playwright/test');
import * as path from 'path';

test('Test file upload', async ({ page }) => {
    
    await page.goto('https://the-internet.herokuapp.com/upload')
    await page.locator('#file-upload').setInputFiles(path.join(__dirname, 'dummy.txt'));
    await page.locator('#file-submit').click();
    await page.waitForTimeout(1000);
  });



  