/**
 * Automated Demo Recording Script for Web Terminal
 *
 * This script uses Puppeteer to automate a demo recording of the Web Terminal.
 * It simulates user interactions and records them to a video file.
 *
 * Prerequisites:
 * 1. Install dependencies: npm install (in parent directory)
 * 2. Run this script: npm run start (in demo-recorder directory)
 *
 * This script will:
 * - Automatically start the server and client using 'npm start'
 * - Wait for the application to be ready
 * - Record the automated demo
 * - Clean up by stopping the server
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Configuration
const CONFIG = {
  url: 'http://localhost:3000', // URL of the web terminal
  outputPath: path.join(__dirname, '../assets/demo.mp4'),
  viewport: {
    width: 1200,
    height: 800,
  },
  recordingOptions: {
    followNewTab: false,
    fps: 60,
    videoFrame: {
      width: 1200,
      height: 800,
    },
    aspectRatio: '3:2',
  },
};

// Utility functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start the server and client
async function startServerAndClient() {
  console.log('🚀 Starting server and client...\n');

  const rootDir = path.join(__dirname, '..');

  return new Promise((resolve, reject) => {
    // Start the server and client using npm start from root directory
    const serverProcess = spawn('npm', ['start'], {
      cwd: rootDir,
      shell: true,
      stdio: 'pipe',
    });

    let serverReady = false;
    let buildComplete = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      // Check if build is complete
      if (
        output.includes('Server running') ||
        output.includes('Nest application successfully started')
      ) {
        serverReady = true;
      }

      if (output.includes('dist/index.html') || buildComplete) {
        buildComplete = true;
      }

      // Resolve when both server is ready
      if (serverReady) {
        console.log('✅ Server and client started successfully!\n');
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Server process exited with code ${code}`);
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.log('⏳ Server is taking longer than expected, proceeding anyway...');
        resolve(serverProcess);
      }
    }, 60000);
  });
}

// Wait for server to be fully ready
async function waitForServer(url, maxAttempts = 30) {
  console.log('⏳ Waiting for server to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ Server is ready!\n');
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    await sleep(1000);
  }

  throw new Error('Server failed to start within the expected time');
}

const typeText = async (page, selector, text, delay = 100) => {
  await page.waitForSelector(selector);
  await page.type(selector, text, { delay });
  await sleep(300);
};

const clickElement = async (page, selector, waitTime = 1000) => {
  await page.waitForSelector(selector);
  await page.click(selector);
  await sleep(waitTime);
};

// Handle authentication if login page is detected
async function handleAuthentication(page) {
  console.log('🔐 Checking for login page...');

  try {
    // Check if we're on the login page
    const loginCard = await page.$('.login-card');
    if (!loginCard) {
      console.log('✅ No login required, already authenticated');
      return;
    }

    console.log('🔑 Login page detected, attempting authentication...');

    // Fetch auth status to determine available providers
    const authStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('/auth/status');
        return await response.json();
      } catch (error) {
        return null;
      }
    });

    if (!authStatus) {
      console.log('⚠️  Could not fetch auth status, skipping authentication');
      return;
    }

    console.log('Available providers:', authStatus.availableProviders);

    // Priority 1: Static Secret
    if (authStatus.availableProviders?.staticSecret) {
      console.log('🔑 Using static secret authentication...');

      // Look for static secret in config file or environment
      const fs = require('fs');
      const configPath = path.join(__dirname, '../config.json');
      // Try environment variable first (already loaded via dotenv at startup)
      let staticSecret = process.env.AUTH_STATIC_SECRET || '';

      // Try to read from config.json if exists
      if (!staticSecret && fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          staticSecret = config.auth?.staticSecret || '';
        } catch (error) {
          console.log('Could not read static secret from config.json');
        }
      }

      if (!staticSecret) {
        throw new Error(
          '❌ Static secret authentication is required but AUTH_STATIC_SECRET is not configured.\n' +
            '   Please set AUTH_STATIC_SECRET in server/.env or config.json',
        );
      }

      const secretInput = await page.$('.secret-input');
      if (secretInput) {
        await secretInput.type(staticSecret, { delay: 50 });
        await sleep(500);

        const submitButton = await page.$('.secret-button');
        if (submitButton) {
          await submitButton.click();
          await sleep(3000); // Wait for authentication to complete
          console.log('✅ Static secret authentication attempted');
          return;
        }
      }
    }

    // Priority 2: GitHub OAuth
    if (authStatus.availableProviders?.github) {
      console.log('🔑 Using GitHub OAuth authentication...');
      const githubButton = await page.$('.github-button');
      if (githubButton) {
        await githubButton.click();
        await sleep(2000);
        console.log('✅ Redirected to GitHub OAuth');
        // Note: OAuth requires manual interaction or pre-configured credentials
        return;
      }
    }

    // Priority 3: Google OAuth
    if (authStatus.availableProviders?.google) {
      console.log('🔑 Using Google OAuth authentication...');
      const googleButton = await page.$('.google-button');
      if (googleButton) {
        await googleButton.click();
        await sleep(2000);
        console.log('✅ Redirected to Google OAuth');
        // Note: OAuth requires manual interaction or pre-configured credentials
        return;
      }
    }

    console.log('⚠️  No authentication method available or configured');
  } catch (error) {
    console.error('❌ Authentication handling failed:', error);
  }
}

// Main demo script
async function recordDemo() {
  console.log('🎬 Starting automated demo recording...\n');

  let serverProcess = null;
  let browser = null;
  let recorder = null;

  try {
    // Start the server and client
    serverProcess = await startServerAndClient();

    // Wait for server to be fully ready
    await waitForServer(CONFIG.url);

    // Give it a bit more time to stabilize
    await sleep(3000);

    browser = await puppeteer.launch({
      headless: false, // Show browser for demonstration
      defaultViewport: CONFIG.viewport,
      args: ['--start-maximized'],
    });

    const page = await browser.newPage();
    await page.setViewport(CONFIG.viewport);

    // Initialize screen recorder
    recorder = new PuppeteerScreenRecorder(page, CONFIG.recordingOptions);
    console.log('📹 Starting recording...');
    await recorder.start(CONFIG.outputPath);

    // Scene 1: Load application (3 seconds)
    console.log('Scene 1: Loading application...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Handle authentication if needed
    await handleAuthentication(page);

    // Wait for terminal to be ready
    await page.waitForSelector('.xterm', { timeout: 10000 });
    await sleep(1000);

    // Scene 2: Basic terminal usage (8 seconds)
    console.log('Scene 2: Basic terminal commands...');

    // Focus terminal
    const terminal = await page.$('.xterm-helper-textarea');
    await terminal.click();
    await sleep(500);

    // Create a tmp folder
    await page.keyboard.type('mkdir -p tmp', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // Navigate to tmp folder
    await page.keyboard.type('cd tmp', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // Create some dummy files
    await page.keyboard.type('echo "Hello from Web Terminal! 🚀" > welcome.txt', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    await page.keyboard.type('echo "Demo file 1" > demo1.txt', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    await page.keyboard.type('echo "Demo file 2" > demo2.txt', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // List files in the directory
    await page.keyboard.type('ls -la', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(2000);

    // Go back to parent directory
    await page.keyboard.type('cd ..', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // Remove the tmp folder
    await page.keyboard.type('rm -rf tmp', { delay: 100 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // Scene 3: Multi-tab feature (8 seconds)
    console.log('Scene 3: Multi-tab functionality...');

    // Create new tab
    const addTabButton = await page.$('.tab-button[title="Add new tab"]');
    if (addTabButton) {
      await addTabButton.click();
      await sleep(2000);

      // Type in new tab
      await page.keyboard.type('pwd', { delay: 100 });
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(2000);

      // Switch back to first tab
      const firstTab = await page.$('.tab-button:first-child');
      if (firstTab) {
        await firstTab.click();
        await sleep(1500);
      }
    }

    // Scene 4: Theme toggle (5 seconds)
    console.log('Scene 4: Theme toggle...');

    const themeToggle = await page.$('.theme-toggle, [aria-label*="theme" i]');
    if (themeToggle) {
      await themeToggle.click();
      await sleep(2000);

      // Toggle back
      await themeToggle.click();
      await sleep(2000);
    }

    // Scene 5: Show features panel (if exists) (5 seconds)
    console.log('Scene 5: Additional features...');

    // Check for folder shortcuts or favorite commands
    const quickAccessButton = await page.$('.quick-access-toggle, .shortcuts-toggle');
    if (quickAccessButton) {
      await quickAccessButton.click();
      await sleep(3000);
    }

    // Scene 6: Final view (3 seconds)
    console.log('Scene 6: Final showcase...');
    await sleep(3000);
  } catch (error) {
    console.error('❌ Error during recording:', error);
  } finally {
    // Stop recording
    if (recorder) {
      console.log('\n📹 Stopping recording...');
      await recorder.stop();
      await sleep(1000);
    }

    if (browser) {
      await browser.close();
    }

    console.log('✅ Demo recording completed!');
    console.log(`📁 Video saved to: ${CONFIG.outputPath}`);

    // Clean up: stop the server
    if (serverProcess) {
      console.log('\n🛑 Stopping server and client...');
      serverProcess.kill('SIGTERM');

      // Give it time to shut down gracefully
      await sleep(2000);

      // Force kill if still running
      try {
        serverProcess.kill('SIGKILL');
      } catch (e) {
        // Process already stopped
      }

      console.log('✅ Server stopped.');
    }
  }
}

// Run the demo
recordDemo().catch(console.error);
