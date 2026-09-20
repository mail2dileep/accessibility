process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { URL } = require('url');
const xml2js = require('xml2js');

// ==== CONFIGURE THIS ====
//const START_URL = 'https://www.mbusa.com';  // Change to your site
const START_URL = process.argv[2];
if (!START_URL) {
  console.error('Usage: node crawl.js <START_URL>');
  process.exit(1);
}

const DOMAIN = (new URL(START_URL)).hostname;
const MAX_URLS = 10000;
const MAX_CONCURRENT = 5;

const VISITED_FILE = './visited_urls.txt';
const visited = new Set();

// Load visited URLs from file (if exists)
if (fs.existsSync(VISITED_FILE)) {
  const lines = fs.readFileSync(VISITED_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    if (line) visited.add(line.trim());
  }
}

const queue = [START_URL];
let activeCount = 0;

const urlWriteStream = fs.createWriteStream('./TesturlUpdated.csv');
urlWriteStream.write('URL\n');

function writeUrl(url) {
  urlWriteStream.write(`"${url}"\n`);
}

async function loadSitemapUrls(startUrl) {
  const urls = [];
  try {
    const base = new URL(startUrl);
    const sitemapUrl = `${base.origin}/sitemap.xml`;
    console.log(`Attempting to load sitemap from: ${sitemapUrl}`);
    const res = await axios.get(sitemapUrl, { timeout: 10000 });
    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml);
    if (parsed.urlset && parsed.urlset.url) {
      for (const entry of parsed.urlset.url) {
        if (entry.loc && entry.loc[0]) {
          urls.push(entry.loc[0]);
        }
      }
    }
  } catch (e) {
    // No sitemap or failed to load, ignore
  }
  return urls;
}

async function crawl() {
  // Try to load sitemap URLs first
  const sitemapUrls = await loadSitemapUrls(START_URL);
  if (sitemapUrls.length > 0) {
    console.log(`Loaded ${sitemapUrls.length} URLs from sitemap.xml`);
    for (const url of sitemapUrls) {
      if (!visited.has(url) && !queue.includes(url) && !url.includes('#') && queue.length < MAX_URLS && !url.includes('/content/dam') ){
        queue.push(url);
      }
	        if (queue.length >= MAX_URLS) break;
    }
	console.log(queue.length);
  }
  console.log(`Starting crawl with ${queue.length} initial URLs...`);
  console.log(`Crawling up to ${MAX_URLS} URLs within domain: ${DOMAIN}`);
  console.log(activeCount)

  while ((queue.length > 0 || activeCount > 0) && visited.size < MAX_URLS) {
    while (activeCount < MAX_CONCURRENT && queue.length > 0 && visited.size < MAX_URLS) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      console.log("Visiting:", url);
      visited.add(url);
      writeUrl(url);
      fs.appendFileSync(VISITED_FILE, url + '\n');

      activeCount++;
	
      (async () => {
        try {
          const res = await axios.get(url, { timeout: 15000 });
          const $ = cheerio.load(res.data);

          $('a[href]').each((i, el) => {
            let href = $(el).attr('href');
            if (!href) return;

            // Ignore anchors, js, mailto, tel
            if (/^(#|javascript:|mailto:|tel:)/i.test(href)) return;
            if (href.includes('/content/dam')) return;

            // Make relative URLs absolute
            try {
              href = new URL(href, url).href;
            } catch (e) {
              return;
            }

            // Exclude URLs with fragments after resolving absolute URL
            if (href.includes('#')) return;

            // Only crawl links within the same domain and under limit
            if (new URL(href).hostname === DOMAIN) {
              if (!visited.has(href) && !queue.includes(href) && visited.size + queue.length < MAX_URLS) {
                queue.push(href);
              }
            }
          });
        } catch (err) {
          // Optionally log errors
        } finally {
          activeCount--;
        }
      })();
    }
    // Wait a bit before next batch
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  urlWriteStream.end();
}

(async () => {
  await crawl();
  console.log(`Crawling complete. URLs written to TesturlUpdated.csv`);
  // Delete visited_urls.txt after execution
 try {
    if (fs.existsSync(VISITED_FILE)) {
      fs.unlinkSync(VISITED_FILE);
      console.log('Deleted visited_urls.txt');
    }
  } catch (e) {
    console.error('Failed to delete visited_urls.txt:', e.message);
  }
})();