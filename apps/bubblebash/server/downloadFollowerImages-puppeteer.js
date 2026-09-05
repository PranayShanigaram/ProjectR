// downloadFollowerImages-puppeteer.js
// Automated browser-based follower image downloader (works best for Instagram)
// 
// RECENT FIXES (Feb 2026):
// - Added multiple selector fallbacks for login inputs (Instagram changed HTML structure)
// - Improved form detection with 3-second page load wait
// - Added screenshot debugging for login failures
// - Enhanced browser launch options with anti-detection flags
// - Improved submit button detection with XPath fallback
// - Better error messaging for 2FA and security challenges

const fs = require('fs');
const path = require('path');
const https = require('https');

// IMPORTANT: Install puppeteer first: npm install puppeteer
// This will download Chromium automatically

const CONFIG = {
  platform: 'instagram', // Currently only Instagram supported in this version
  username: 'brawlersarena', // Your Instagram username
  password: 'Brawlarena@777333', // Your Instagram password (stored locally, not sent anywhere)
  outputDir: path.join(__dirname, 'images'),
  maxFollowers: 50, // Keep low to avoid detection (50 is safe)
  headless: false, // Keep false - headless browsers are easier to detect
  clearCache: false, // Keep false - reusing session looks more natural
  downloadDelay: 12000, // 12 seconds between downloads (safer)
  scrollDelay: 4000, // 4 seconds between scrolls (safer)
  minCooldownHours: 24, // Minimum hours between runs
};

// Track last run to prevent running too frequently
const LAST_RUN_FILE = path.join(__dirname, '.last-run-timestamp');

function canRunNow() {
  try {
    if (fs.existsSync(LAST_RUN_FILE)) {
      const lastRun = parseInt(fs.readFileSync(LAST_RUN_FILE, 'utf8'));
      const hoursSinceLastRun = (Date.now() - lastRun) / (1000 * 60 * 60);
      if (hoursSinceLastRun < CONFIG.minCooldownHours) {
        const hoursRemaining = Math.ceil(CONFIG.minCooldownHours - hoursSinceLastRun);
        console.log(`⚠️  Safety cooldown: Please wait ${hoursRemaining} more hour(s) before running again.`);
        console.log(`   Last run: ${new Date(lastRun).toLocaleString()}`);
        console.log(`   This protects your account from being flagged.`);
        return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
}

function recordRun() {
  fs.writeFileSync(LAST_RUN_FILE, Date.now().toString());
}

// Helper: Download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// Helper: Sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
}

async function downloadInstagramFollowers() {
  let browser;
  
  try {
    // Import puppeteer
    const puppeteer = require('puppeteer');
    
    console.log('Launching browser...');
    
    // Setup launch options
    const launchOptions = {
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };
    
    // If clearCache is true, don't use user data directory (fresh start each time)
    // If false, use a persistent user data directory to save login state
    if (!CONFIG.clearCache) {
      launchOptions.userDataDir = path.join(__dirname, '.puppeteer-data');
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Instagram...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
    
    // Wait a bit for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wait for login form - try multiple selectors as Instagram changes their HTML
    let usernameInput = null;
    let passwordInput = null;
    let submitButton = null;
    
    const usernameSelectors = [
      'input[name="username"]',
      'input[autocomplete="username"]',
      'input[type="text"]',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[autocomplete="current-password"]',
      'input[type="password"]'
    ];
    
    // Try each selector until we find the inputs
    for (const selector of usernameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        usernameInput = await page.$(selector);
        if (usernameInput) {
          console.log(`✅ Found username input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        passwordInput = await page.$(selector);
        if (passwordInput) {
          console.log(`✅ Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!usernameInput || !passwordInput) {
      console.error('❌ Could not find login inputs!');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      throw new Error('Login form not found - check login-error.png for details');
    }
    
    console.log('Logging in...');
    // Type credentials into the found inputs
    await usernameInput.type(CONFIG.username, { delay: 50 });
    await passwordInput.type(CONFIG.password, { delay: 50 });
    
    // Find and click the submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button[form]',
      'button'
    ];
    
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          console.log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Also try XPath for "Log in" button text
    if (!submitButton) {
      try {
        const xpathButtons = await page.$x("//button[contains(text(), 'Log in') or contains(text(), 'log in')]");
        if (xpathButtons.length > 0) {
          submitButton = xpathButtons[0];
          console.log(`✅ Found submit button via XPath`);
        }
      } catch (e) {
        console.log('XPath search failed');
      }
    }
    
    if (!submitButton) {
      // Try pressing Enter instead
      console.log('Submit button not found, trying Tab + Enter...');
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.keyboard.press('Enter');
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
      await submitButton.click();
    }
    
    // Wait for navigation after login
    console.log('Waiting for login to complete...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    } catch (e) {
      console.log('Navigation timeout, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/accounts/login') || currentUrl.includes('/challenge/')) {
      console.error('❌ Login failed or challenge required!');
      console.log('Possible issues:');
      console.log('1. Incorrect username or password');
      console.log('2. Instagram requires 2FA verification');
      console.log('3. Instagram flagged this as suspicious login');
      console.log('4. Instagram is blocking automated login');
      console.log('\n💡 Solution: Set headless: false and manually complete any verification');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-challenge.png', fullPage: true });
      console.log('Screenshot saved as login-challenge.png');
      
      if (!CONFIG.headless) {
        console.log('\nBrowser is open - please manually complete any verification...');
        console.log('Waiting 45 seconds for manual intervention...');
        await new Promise(resolve => setTimeout(resolve, 45000));
        
        // Check again after manual intervention
        const retryUrl = page.url();
        if (retryUrl.includes('/accounts/login') || retryUrl.includes('/challenge/')) {
          throw new Error('Login still failed after manual intervention');
        }
      } else {
        throw new Error('Login failed - please set headless: false and try again');
      }
    }
    
    // Handle "Save Your Login Info" popup
    console.log('Handling post-login popups...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const notNowButton = await page.$x("//button[contains(text(), 'Not Now')]");
      if (notNowButton.length > 0) {
        await notNowButton[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {}
    
    // Handle "Turn on Notifications" popup
    try {
      const notNowButton = await page.$x("//button[contains(text(), 'Not Now')]");
      if (notNowButton.length > 0) {
        await notNowButton[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {}
    
    // Verify we're logged in before proceeding
    const finalUrl = page.url();
    if (finalUrl.includes('/accounts/login')) {
      throw new Error('Still on login page - login failed');
    }
    
    console.log('✅ Successfully logged in!');
    console.log('Navigating to profile...');
    await page.goto(`https://www.instagram.com/${CONFIG.username}/`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on followers link - try multiple selectors
    console.log('Opening followers list...');
    let followersLink = null;
    
    // Try different selectors for followers link
    const selectors = [
      'a[href*="/followers/"]',
      'a[href$="/followers/"]',
      'a[href="/' + CONFIG.username + '/followers/"]',
      'a:-soup-contains("followers")',
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        followersLink = await page.$(selector);
        if (followersLink) {
          console.log(`Found followers link with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If no selector worked, try clicking by text
    if (!followersLink) {
      console.log('Trying to find followers by text...');
      try {
        const links = await page.$x("//a[contains(., 'followers') or contains(., 'follower')]");
        if (links.length > 0) {
          followersLink = links[0];
          console.log('Found followers link by text');
        }
      } catch (e) {}
    }
    
    if (!followersLink) {
      // Last resort: navigate directly to followers page
      console.log('Using direct URL to followers page...');
      await page.goto(`https://www.instagram.com/${CONFIG.username}/followers/`, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      await followersLink.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check if we're still on the profile/followers page
    const currentUrl2 = page.url();
    console.log(`Current URL after clicking followers: ${currentUrl2}`);
    
    if (currentUrl2.includes('/accounts/login')) {
      throw new Error('Redirected to login page - session may have expired. Try logging in manually with headless: false');
    }
    
    // Wait for followers dialog or list
    console.log('Waiting for followers list to load...');
    try {
      // Try waiting for dialog (desktop view)
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
      console.log('✅ Found followers dialog');
    } catch (e) {
      // Dialog might not appear, check if we're on followers page
      console.log('Dialog not found, checking if on followers page...');
      const url = page.url();
      if (!url.includes('/followers')) {
        throw new Error('Could not access followers list - Instagram may be blocking automated access');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Scrolling to load followers...');
    const followersDialog = await page.$('div[role="dialog"] div');
    
    // Scroll to load more followers
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;
    
    while (scrollAttempts < maxScrollAttempts) {
      const currentHeight = await page.evaluate((dialog) => {
        dialog.scrollTop = dialog.scrollHeight;
        return dialog.scrollHeight;
      }, followersDialog);
      
      if (currentHeight === previousHeight) break;
      previousHeight = currentHeight;
      scrollAttempts++;
      
      // Wait longer between scrolls to avoid hitting API too frequently
      await new Promise(resolve => setTimeout(resolve, CONFIG.scrollDelay));
      console.log(`Scroll attempt ${scrollAttempts}/${maxScrollAttempts}...`);
    }
    
    console.log('Extracting follower data...');
    const followers = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return [];
      
      const uniqueFollowers = new Map();
      
      // First, find where "Suggested for you" text appears
      const allElements = dialog.querySelectorAll('*');
      let suggestedElement = null;
      
      for (const el of allElements) {
        const text = el.textContent.trim().toLowerCase();
        // More precise check - element should have short text matching exactly
        if (text === 'suggested for you' || text === 'suggestions for you') {
          suggestedElement = el;
          console.log('Found "Suggested for you" divider');
          break;
        }
      }
      
      // Get all username links in the dialog
      const allLinks = dialog.querySelectorAll('a[href^="/"][role="link"]');
      const processedUsernames = new Set();
      
      for (const link of allLinks) {
        // Skip if this link is AFTER the "Suggested for you" section
        if (suggestedElement) {
          const position = suggestedElement.compareDocumentPosition(link);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            continue;
          }
        }
        
        const href = link.getAttribute('href');
        const username = href.replace(/\//g, '');
        
        // Skip invalid, duplicates, or non-user links
        if (!username || processedUsernames.has(username)) continue;
        if (username.includes('explore') || username.includes('accounts') || username.includes('p')) continue;
        
        processedUsernames.add(username);
        
        // Now find the profile picture for this user
        // Strategy: Go up to find the row container, then find img within it
        let profilePicUrl = null;
        
        // Method 1: Check if the link itself contains an img
        const directImg = link.querySelector('img');
        if (directImg) {
          profilePicUrl = directImg.getAttribute('src');
        }
        
        // Method 2: Find the row container (go up several levels) and look for img
        if (!profilePicUrl) {
          let container = link.parentElement;
          for (let i = 0; i < 8; i++) {
            if (!container) break;
            
            // Look for any img in this container
            const imgs = container.querySelectorAll('img');
            for (const img of imgs) {
              const src = img.getAttribute('src');
              // Profile pics typically contain these patterns
              if (src && (src.includes('cdninstagram') || src.includes('fbcdn') || src.includes('instagram'))) {
                profilePicUrl = src;
                break;
              }
            }
            
            if (profilePicUrl) break;
            container = container.parentElement;
          }
        }
        
        // Method 3: Look for canvas (story ring) and find img nearby
        if (!profilePicUrl) {
          let container = link.parentElement;
          for (let i = 0; i < 8; i++) {
            if (!container) break;
            
            const canvas = container.querySelector('canvas');
            if (canvas) {
              // Canvas found (story ring), look for img in same container
              const img = container.querySelector('img');
              if (img) {
                profilePicUrl = img.getAttribute('src');
                break;
              }
            }
            container = container.parentElement;
          }
        }
        
        if (profilePicUrl && username) {
          uniqueFollowers.set(username, {
            username,
            profilePicUrl
          });
          console.log('Found follower:', username);
        }
      }
      
      return Array.from(uniqueFollowers.values());
    });
    
    console.log(`Found ${followers.length} followers with profile pictures`);
    
    // Close browser
    await browser.close();
    
    return followers;
    
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Instagram Follower Profile Picture Downloader (Puppeteer)');
  console.log('='.repeat(60));
  
  // Check cooldown to protect account
  if (!canRunNow()) {
    console.log('\n💡 Tip: To bypass cooldown (not recommended), delete the file:');
    console.log(`   ${LAST_RUN_FILE}`);
    return;
  }
  
  if (CONFIG.username === 'YOUR_USERNAME' || CONFIG.password === 'YOUR_PASSWORD') {
    console.error('\n❌ Error: Please set your Instagram username and password in the CONFIG');
    console.log('\nEdit the file and update:');
    console.log('  username: "YOUR_USERNAME"  →  username: "your_actual_username"');
    console.log('  password: "YOUR_PASSWORD"  →  password: "your_actual_password"');
    console.log('\nNote: Your credentials are only used locally and not sent anywhere.');
    return;
  }
  
  // Record this run
  recordRun();
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  console.log(`Output directory: ${CONFIG.outputDir}\n`);
  
  try {
    const followers = await downloadInstagramFollowers();
    
    if (followers.length === 0) {
      console.log('No followers found');
      return;
    }
    
    // Download images
    console.log(`\nDownloading ${followers.length} profile pictures...\n`);
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
      const filename = sanitizeFilename(follower.username);
      const filepath = path.join(CONFIG.outputDir, `${filename}.jpg`);
      
      // Skip if exists
      if (fs.existsSync(filepath)) {
        console.log(`[${i + 1}/${followers.length}] ⏭️  ${follower.username} (exists)`);
        continue;
      }
      
      try {
        await downloadImage(follower.profilePicUrl, filepath);
        console.log(`[${i + 1}/${followers.length}] ✅ ${follower.username}`);
        successCount++;
        
        // Wait before downloading next image to avoid rate limiting
        if (i < followers.length - 1) {
          console.log(`   ⏳ Waiting ${CONFIG.downloadDelay / 1000} seconds before next download...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.downloadDelay));
        }
      } catch (error) {
        console.log(`[${i + 1}/${followers.length}] ❌ ${follower.username} - ${error.message}`);
        errorCount++;
        
        // Still wait on error to maintain rate limit
        if (i < followers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.downloadDelay));
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`✅ Downloaded: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📁 Location: ${CONFIG.outputDir}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure puppeteer is installed: npm install puppeteer');
    console.log('2. Check your username and password are correct');
    console.log('3. Try with headless: false to see what\'s happening');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, CONFIG };
