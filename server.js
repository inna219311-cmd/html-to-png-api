const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (для Railway)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HTML to PNG API is running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      convert: 'POST /convert',
      convertWithFile: 'POST /convert-file'
    }
  });
});

/**
 * POST /convert
 * Конвертирует HTML в PNG
 * Body: { html: "...", width?: 1080, height?: 1080 }
 * Ответ: { success: true, image: "base64", size: 12345 }
 */
app.post('/convert', async (req, res) => {
  try {
    const { html, width = 1080, height = 1080, quality = 95 } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log(`Converting HTML (${html.length} chars) → PNG (${width}x${height})`);

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--disable-gpu']
      });

      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1
      });

      // Устанавливаем HTML (ждём пока загрузятся стили и изображения)
      await page.setContent(html, { waitUntil: 'networkidle' });

      // Делаем скриншот
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width, height }
      });

      const base64 = screenshot.toString('base64');

      console.log(`✓ Rendered successfully (${screenshot.length} bytes)`);

      res.json({
        success: true,
        image: base64,
        size: screenshot.length,
        width,
        height,
        mimeType: 'image/png'
      });

    } finally {
      if (browser) await browser.close();
    }

  } catch (error) {
    console.error('Conversion error:', error.message);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

/**
 * POST /convert-file
 * Альтернатива — если хочешь отправлять файл напрямую (для direct downloads)
 * Ответ: Binary PNG (Content-Type: image/png)
 */
app.post('/convert-file', async (req, res) => {
  try {
    const { html, width = 1080, height = 1080 } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log(`Converting to file: ${width}x${height}`);

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage']
      });

      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1
      });

      await page.setContent(html, { waitUntil: 'networkidle' });
      const screenshot = await page.screenshot({ type: 'png' });

      res.type('image/png').send(screenshot);
      console.log(`✓ File sent (${screenshot.length} bytes)`);

    } finally {
      if (browser) await browser.close();
    }

  } catch (error) {
    console.error('File conversion error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /batch
 * Конвертирует несколько HTML за раз (экономит ресурсы)
 * Body: { items: [{ html: "...", id: "slide_1" }, ...] }
 */
app.post('/batch', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    console.log(`Batch converting ${items.length} items`);

    let browser;
    const results = [];

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage']
      });

      for (const item of items) {
        try {
          const page = await browser.newPage({
            viewport: { width: 1080, height: 1080 }
          });

          await page.setContent(item.html, { waitUntil: 'networkidle' });
          const screenshot = await page.screenshot({ type: 'png' });
          const base64 = screenshot.toString('base64');

          results.push({
            id: item.id || `item_${results.length}`,
            success: true,
            image: base64,
            size: screenshot.length
          });

          await page.close();
        } catch (itemError) {
          results.push({
            id: item.id || `item_${results.length}`,
            success: false,
            error: itemError.message
          });
        }
      }

      console.log(`✓ Batch complete: ${results.filter(r => r.success).length}/${items.length} success`);

      res.json({
        success: true,
        total: items.length,
        successful: results.filter(r => r.success).length,
        results
      });

    } finally {
      if (browser) await browser.close();
    }

  } catch (error) {
    console.error('Batch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         HTML to PNG Converter API                              ║
║         Running on http://localhost:${PORT}                       ║
║                                                                ║
║  Endpoints:                                                    ║
║  • POST /convert       → Base64 PNG response                  ║
║  • POST /convert-file  → Binary PNG file download             ║
║  • POST /batch         → Multiple HTML items                  ║
║  • GET  /              → Health check                         ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
