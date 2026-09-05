// downloadFollowerImages.js
// Script to automatically download follower profile pictures

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  platform: 'instagram', // Options: 'instagram', 'twitter', 'github', 'tiktok'
  outputDir: path.join(__dirname, 'images'),
  imageFormat: 'jpg', // jpg, png, webp
  
  // API Credentials (fill these in based on your platform)
  instagram: {
    username: 'brawlersarena',
    sessionId: '79786935810%3APC5OHVNP8Zbcgq%3A25%3AAYiKQ0RLGN-iKhdkinG6ZTTCgIn6EL2k49rYsg6lmw', // Get from browser cookies after logging in
  },
  twitter: {
    bearerToken: 'YOUR_BEARER_TOKEN', // Get from Twitter Developer Portal
    username: 'YOUR_USERNAME',
  },
  github: {
    token: 'YOUR_GITHUB_TOKEN', // Get from GitHub Settings > Developer settings > Personal access tokens
    username: 'YOUR_USERNAME',
  },
  tiktok: {
    sessionId: 'YOUR_SESSION_ID',
    username: 'YOUR_USERNAME',
  }
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Helper: Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Helper: Sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
}

// ============================================
// INSTAGRAM - Using unofficial API
// ============================================
async function fetchInstagramFollowers() {
  const { username, sessionId } = CONFIG.instagram;
  
  if (!sessionId || sessionId === 'YOUR_SESSION_ID' || sessionId === 'PASTE_YOUR_SESSION_ID_HERE') {
    console.error('❌ Session ID not configured!');
    console.log('\n📋 How to get your Instagram session ID:');
    console.log('1. Open Instagram in Chrome/Edge and log in');
    console.log('2. Press F12 to open Developer Tools');
    console.log('3. Click the "Application" tab (or "Storage" in Firefox)');
    console.log('4. In left sidebar: Cookies → https://www.instagram.com');
    console.log('5. Find "sessionid" and copy its VALUE');
    console.log('6. Paste it in downloadFollowerImages.js CONFIG.instagram.sessionId');
    console.log('\n⚠️  Note: Session ID looks like: 54321%3AabcXYZ123...');
    console.log('   Make sure to copy the ENTIRE value!\n');
    return [];
  }

  console.log(`Fetching Instagram followers for @${username}...`);
  console.log(`Session ID: ${sessionId.substring(0, 20)}...${sessionId.length > 20 ? '(length: ' + sessionId.length + ')' : ''}`);
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Try simpler approach - directly access the profile page
    console.log('Fetching profile page...');
    const profileUrl = `https://www.instagram.com/${username}/`;
    
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'Cookie': `sessionid=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      }
    });
    
    if (!profileResponse.ok) {
      console.error(`❌ Failed to fetch profile: ${profileResponse.status}`);
      throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
    }
    
    const html = await profileResponse.text();
    
    // Extract data from the HTML (Instagram embeds it in a script tag)
    const sharedDataMatch = html.match(/<script type="text\/javascript">window\._sharedData = (.+?);<\/script>/);
    
    if (!sharedDataMatch) {
      console.error('❌ Could not find embedded data in profile page');
      console.log('This might mean:');
      console.log('1. Session ID is invalid/expired');
      console.log('2. Instagram is blocking automated access');
      console.log('3. Try using Puppeteer method instead: node downloadFollowerImages-puppeteer.js');
      throw new Error('Could not parse profile page');
    }
    
    const sharedData = JSON.parse(sharedDataMatch[1]);
    const userData = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
    
    if (!userData) {
      console.error('❌ Could not extract user data');
      throw new Error('Failed to get user data');
    }
    
    const userId = userData.id;
    const followerCount = userData.edge_followed_by?.count || 0;
    console.log(`✅ User ID: ${userId}`);
    console.log(`✅ Follower Count: ${followerCount}`);
    
    // Get CSRF token from cookies
    const setCookies = profileResponse.headers.raw()['set-cookie'] || [];
    let csrfToken = '';
    
    for (const cookie of setCookies) {
      if (cookie.includes('csrftoken=')) {
        csrfToken = cookie.split('csrftoken=')[1].split(';')[0];
        break;
      }
    }
    
    console.log(`CSRF Token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'Not found'}`);
    
    if (!csrfToken) {
      console.log('⚠️  No CSRF token found, continuing anyway...');
    }
    
    // Now fetch followers using the private API
    console.log('Fetching followers list...');
    
    const followersResponse = await fetch(`https://www.instagram.com/api/v1/friendships/${userId}/followers/?count=50`, {
      headers: {
        'Cookie': `sessionid=${sessionId}${csrfToken ? `; csrftoken=${csrfToken}` : ''}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-CSRFToken': csrfToken || '',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.instagram.com/${username}/followers/`,
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      }
    });
    
    if (!followersResponse.ok) {
      const errorText = await followersResponse.text();
      console.error(`❌ Failed to fetch followers: ${followersResponse.status}`);
      console.error(`Response: ${errorText.substring(0, 200)}`);
      
      if (followersResponse.status === 401 || followersResponse.status === 403) {
        console.log('\n💡 API method is not working. Recommendations:');
        console.log('1. Use Puppeteer method instead:');
        console.log('   node downloadFollowerImages-puppeteer.js');
        console.log('2. Or get a fresh session ID from browser');
      }
      
      throw new Error(`Failed to fetch followers: ${followersResponse.status}`);
    }
    
    const followersData = await followersResponse.json();
    const followers = followersData.users || [];
    
    console.log(`✅ Found ${followers.length} followers`);
    
    return followers.map(user => ({
      username: user.username,
      profilePicUrl: user.profile_pic_url,
      fullName: user.full_name || user.username
    }));
  } catch (error) {
    console.error('Instagram fetch error:', error.message);
    return [];
  }
}

// ============================================
// TWITTER/X - Using official API
// ============================================
async function fetchTwitterFollowers() {
  const { bearerToken, username } = CONFIG.twitter;
  
  if (!bearerToken || bearerToken === 'YOUR_BEARER_TOKEN') {
    console.error('Please set your Twitter Bearer Token in the config');
    console.log('\nHow to get Bearer Token:');
    console.log('1. Go to https://developer.twitter.com/');
    console.log('2. Create a new app or use existing one');
    console.log('3. Copy the Bearer Token from Keys and Tokens');
    return [];
  }

  console.log(`Fetching Twitter followers for @${username}...`);
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Get user ID
    const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });
    
    const userData = await userResponse.json();
    const userId = userData.data.id;
    
    // Get followers
    const followersResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/followers?max_results=1000&user.fields=profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    const followersData = await followersResponse.json();
    const followers = followersData.data || [];
    
    console.log(`Found ${followers.length} followers`);
    
    return followers.map(user => ({
      username: user.username,
      profilePicUrl: user.profile_image_url.replace('_normal', '_400x400'), // Get higher resolution
      fullName: user.name
    }));
  } catch (error) {
    console.error('Twitter fetch error:', error.message);
    return [];
  }
}

// ============================================
// GITHUB - Using official API
// ============================================
async function fetchGitHubFollowers() {
  const { token, username } = CONFIG.github;
  
  if (!token || token === 'YOUR_GITHUB_TOKEN') {
    console.error('Please set your GitHub token in the config');
    console.log('\nHow to get GitHub token:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Generate new token (classic)');
    console.log('3. Select "read:user" scope');
    console.log('4. Copy the token');
    return [];
  }

  console.log(`Fetching GitHub followers for @${username}...`);
  
  try {
    const fetch = (await import('node-fetch')).default;
    let allFollowers = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `https://api.github.com/users/${username}/followers?per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const followers = await response.json();
      
      if (followers.length === 0) {
        hasMore = false;
      } else {
        allFollowers = allFollowers.concat(followers);
        page++;
      }
    }
    
    console.log(`Found ${allFollowers.length} followers`);
    
    return allFollowers.map(user => ({
      username: user.login,
      profilePicUrl: user.avatar_url,
      fullName: user.login
    }));
  } catch (error) {
    console.error('GitHub fetch error:', error.message);
    return [];
  }
}

// ============================================
// Main execution
// ============================================
async function main() {
  console.log('='.repeat(50));
  console.log('Follower Profile Picture Downloader');
  console.log('='.repeat(50));
  console.log(`Platform: ${CONFIG.platform}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);
  console.log('='.repeat(50));
  
  let followers = [];
  
  // Fetch followers based on platform
  switch (CONFIG.platform) {
    case 'instagram':
      followers = await fetchInstagramFollowers();
      break;
    case 'twitter':
      followers = await fetchTwitterFollowers();
      break;
    case 'github':
      followers = await fetchGitHubFollowers();
      break;
    default:
      console.error(`Unsupported platform: ${CONFIG.platform}`);
      return;
  }
  
  if (followers.length === 0) {
    console.log('No followers found or error occurred');
    return;
  }
  
  // Download profile pictures
  console.log(`\nDownloading ${followers.length} profile pictures...`);
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < followers.length; i++) {
    const follower = followers[i];
    const filename = sanitizeFilename(follower.username);
    const filepath = path.join(CONFIG.outputDir, `${filename}.${CONFIG.imageFormat}`);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${followers.length}] ⏭️  Skipped: ${follower.username} (already exists)`);
      continue;
    }
    
    try {
      await downloadImage(follower.profilePicUrl, filepath);
      console.log(`[${i + 1}/${followers.length}] ✅ Downloaded: ${follower.username}`);
      successCount++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`[${i + 1}/${followers.length}] ❌ Failed: ${follower.username} - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`✅ Successfully downloaded: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📁 Saved to: ${CONFIG.outputDir}`);
  console.log('='.repeat(50));
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, CONFIG };
