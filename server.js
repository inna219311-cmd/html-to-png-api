const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HTML to PNG API is running',
    version: '2.0.0',
    endpoints: {
      health: 'GET /',
      convert: 'POST /convert',
      convertFile: 'POST /convert-file',
      batch: 'POST /batch'
    }
  });
});

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}

app.post('/convert', async (req, res) => {
  let browser;
  try {
    const { html, width = 1080, height = 1080 } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML content is required' });

    console.log(`Converting HTML (${html.length} chars) → PNG (${width}x${height})`);

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height }
    });

    const base64 = screenshot.toString('base64');
    console.log(`✓ Rendered (${screenshot.length} bytes)`);

    res.json({ success: true, image: base64, size: screenshot.length, width, height, mimeType: 'image/png' });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message, success: false });
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/convert-file', async (req, res) => {
  let browser;
  try {
    const { html, width = 1080, height = 1080 } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML content is required' });

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
    res.type('image/png').send(screenshot);

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/batch', async (req, res) => {
  let browser;
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Items array is required' });

    console.log(`Batch: ${items.length} items`);
    browser = await launchBrowser();
    const results = [];

    for (const item of items) {
      try {
        const w = item.width || 1080;
        const h = item.height || 1080;
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
        await page.setContent(item.html, { waitUntil: 'networkidle0', timeout: 30000 });
        const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
        await page.close();
        results.push({ id: item.id || `item_${results.length}`, success: true, image: screenshot.toString('base64'), size: screenshot.length });
      } catch (e) {
        results.push({ id: item.id || `item_${results.length}`, success: false, error: e.message });
      }
    }

    console.log(`✓ Batch done: ${results.filter(r => r.success).length}/${items.length}`);
    res.json({ success: true, total: items.length, successful: results.filter(r => r.success).length, results });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

app.listen(PORT, () => console.log(`HTML to PNG API running on port ${PORT}`));

process.on('SIGTERM', () => process.exit(0));
