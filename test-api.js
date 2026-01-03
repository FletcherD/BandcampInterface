#!/usr/bin/env node

/**
 * Bandcamp API Testing Utility
 *
 * Usage:
 *   node test-api.js menubar
 *   node test-api.js tralbum <band_id> <type> <tralbum_id>
 *   node test-api.js band <band_id>
 *   node test-api.js collection <fan_id> [older_than] [count]
 *   node test-api.js wishlist <fan_id> [older_than] [count]
 *   node test-api.js search-collection <fan_id> <search_key>
 *   node test-api.js search-wishlist <fan_id> <search_key>
 *   node test-api.js autocomplete <search_text> [fan_id]
 *
 * Examples:
 *   node test-api.js menubar
 *   node test-api.js tralbum 752078214 a 2011188266
 *   node test-api.js band 752078214
 *   node test-api.js collection 621507
 *   node test-api.js autocomplete "pink floyd"
 */

const ENDPOINTS = {
  menubar: '/api/design_system/1/menubar',
  tralbum: '/api/mobile/24/tralbum_details',
  band: '/api/mobile/24/band_details',
  collection: '/api/mobile/24/fan_collection',
  wishlist: '/api/mobile/24/fan_wishlist',
  searchCollection: '/api/fancollection/1/search_items',
  autocomplete: '/api/bcsearch_public_api/1/autocomplete_elastic',
};

const BASE_URL = 'https://bandcamp.com';

async function makeRequest(endpoint, body) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

function formatOutput(data, options = {}) {
  const { maxDepth = 3, compact = false } = options;

  if (compact) {
    return JSON.stringify(data, null, 2);
  }

  // For large responses, show summary + first few items
  if (Array.isArray(data)) {
    console.log(`\n📊 Array with ${data.length} items`);
    if (data.length > 0) {
      console.log('\nFirst item:');
      console.log(JSON.stringify(data[0], null, 2));
      if (data.length > 1) {
        console.log(`\n... and ${data.length - 1} more items`);
      }
    }
  } else if (data && typeof data === 'object') {
    console.log('\n📋 Response structure:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

async function testMenubar() {
  console.log('🔍 Testing menubar API (current user)...\n');
  const data = await makeRequest(ENDPOINTS.menubar, {});

  if (data.fan_data) {
    console.log('✅ User authenticated:');
    console.log(`   Fan ID: ${data.fan_data.fan_id}`);
    console.log(`   Username: ${data.fan_data.username || 'N/A'}`);
    console.log(`   Name: ${data.fan_data.name || 'N/A'}`);
  } else {
    console.log('❌ Not authenticated');
  }

  return data;
}

async function testTralbum(bandId, type, tralbumId) {
  console.log(`🔍 Testing tralbum_details API...\n`);
  console.log(`   Band ID: ${bandId}`);
  console.log(`   Type: ${type === 'a' ? 'album' : 'track'}`);
  console.log(`   Tralbum ID: ${tralbumId}\n`);

  const data = await makeRequest(ENDPOINTS.tralbum, {
    band_id: parseInt(bandId),
    tralbum_type: type,
    tralbum_id: parseInt(tralbumId),
  });

  console.log('✅ Album/Track details:');
  console.log(`   Title: ${data.title}`);
  console.log(`   Album Artist: ${data.tralbum_artist || 'N/A'}`);
  console.log(`   Tracks: ${data.tracks.length}`);

  // Check for compilation (different artists per track)
  const trackArtists = new Set(data.tracks.map(t => t.band_name).filter(Boolean));
  if (trackArtists.size > 1) {
    console.log(`\n🎵 COMPILATION ALBUM detected!`);
    console.log(`   ${trackArtists.size} different artists across ${data.tracks.length} tracks:`);
    data.tracks.slice(0, 5).forEach(t => {
      console.log(`   Track ${t.track_num}: ${t.title} - ${t.band_name || 'N/A'}`);
    });
    if (data.tracks.length > 5) {
      console.log(`   ... and ${data.tracks.length - 5} more tracks`);
    }
  } else if (trackArtists.size === 1) {
    console.log(`\n   All tracks by: ${[...trackArtists][0]}`);
  }

  return data;
}

async function testBand(bandId) {
  console.log(`🔍 Testing band_details API...\n`);
  console.log(`   Band ID: ${bandId}\n`);

  const data = await makeRequest(ENDPOINTS.band, {
    band_id: parseInt(bandId),
  });

  console.log('✅ Band details:');
  console.log(`   Name: ${data.name}`);
  console.log(`   Discography: ${data.discography?.length || 0} items`);

  return data;
}

async function testCollection(fanId, olderThan, count = 40) {
  console.log(`🔍 Testing fan_collection API...\n`);
  console.log(`   Fan ID: ${fanId}`);
  if (olderThan) console.log(`   Older than: ${olderThan}`);
  console.log(`   Count: ${count}\n`);

  const body = {
    fan_id: parseInt(fanId),
    count: parseInt(count),
  };
  if (olderThan) body.older_than = olderThan;

  const data = await makeRequest(ENDPOINTS.collection, body);

  console.log('✅ Collection response:');
  console.log(`   Items: ${data.items?.length || 0}`);
  console.log(`   Has more: ${!!data.more_available}`);
  if (data.last_token) console.log(`   Last token: ${data.last_token}`);

  return data;
}

async function testWishlist(fanId, olderThan, count = 40) {
  console.log(`🔍 Testing fan_wishlist API...\n`);
  console.log(`   Fan ID: ${fanId}`);
  if (olderThan) console.log(`   Older than: ${olderThan}`);
  console.log(`   Count: ${count}\n`);

  const body = {
    fan_id: parseInt(fanId),
    count: parseInt(count),
  };
  if (olderThan) body.older_than = olderThan;

  const data = await makeRequest(ENDPOINTS.wishlist, body);

  console.log('✅ Wishlist response:');
  console.log(`   Items: ${data.items?.length || 0}`);
  console.log(`   Has more: ${!!data.more_available}`);
  if (data.last_token) console.log(`   Last token: ${data.last_token}`);

  return data;
}

async function testSearchCollection(fanId, searchKey) {
  console.log(`🔍 Testing collection search API...\n`);
  console.log(`   Fan ID: ${fanId}`);
  console.log(`   Search: "${searchKey}"\n`);

  const data = await makeRequest(ENDPOINTS.searchCollection, {
    fan_id: parseInt(fanId),
    search_key: searchKey,
    search_type: 'collection',
  });

  console.log('✅ Search results:');
  console.log(`   Items: ${data.items?.length || 0}`);

  return data;
}

async function testSearchWishlist(fanId, searchKey) {
  console.log(`🔍 Testing wishlist search API...\n`);
  console.log(`   Fan ID: ${fanId}`);
  console.log(`   Search: "${searchKey}"\n`);

  const data = await makeRequest(ENDPOINTS.searchCollection, {
    fan_id: parseInt(fanId),
    search_key: searchKey,
    search_type: 'wishlist',
  });

  console.log('✅ Search results:');
  console.log(`   Items: ${data.items?.length || 0}`);

  return data;
}

async function testAutocomplete(searchText, fanId) {
  console.log(`🔍 Testing autocomplete search API...\n`);
  console.log(`   Search: "${searchText}"`);
  if (fanId) console.log(`   Fan ID: ${fanId}`);
  console.log('');

  const body = {
    search_text: searchText,
    search_filter: '',
    full_page: false,
  };
  if (fanId) body.fan_id = parseInt(fanId);

  const data = await makeRequest(ENDPOINTS.autocomplete, body);

  console.log('✅ Autocomplete results:');
  if (data.auto?.results) {
    console.log(`   Results: ${data.auto.results.length}`);

    const types = {};
    data.auto.results.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });
    console.log('   By type:', types);
  }

  return data;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node test-api.js <command> [args...]');
    console.log('\nCommands:');
    console.log('  menubar                                    - Get current user');
    console.log('  tralbum <band_id> <type> <tralbum_id>     - Get album/track details');
    console.log('  band <band_id>                             - Get band details');
    console.log('  collection <fan_id> [older_than] [count]   - Get user collection');
    console.log('  wishlist <fan_id> [older_than] [count]     - Get user wishlist');
    console.log('  search-collection <fan_id> <search_key>    - Search user collection');
    console.log('  search-wishlist <fan_id> <search_key>      - Search user wishlist');
    console.log('  autocomplete <search_text> [fan_id]        - Global search');
    console.log('\nAdd --json flag to output raw JSON');
    process.exit(1);
  }

  const command = args[0];
  const jsonOutput = args.includes('--json');

  try {
    let data;

    switch (command) {
      case 'menubar':
        data = await testMenubar();
        break;
      case 'tralbum':
        if (args.length < 4) throw new Error('Usage: tralbum <band_id> <type> <tralbum_id>');
        data = await testTralbum(args[1], args[2], args[3]);
        break;
      case 'band':
        if (args.length < 2) throw new Error('Usage: band <band_id>');
        data = await testBand(args[1]);
        break;
      case 'collection':
        if (args.length < 2) throw new Error('Usage: collection <fan_id> [older_than] [count]');
        data = await testCollection(args[1], args[2], args[3]);
        break;
      case 'wishlist':
        if (args.length < 2) throw new Error('Usage: wishlist <fan_id> [older_than] [count]');
        data = await testWishlist(args[1], args[2], args[3]);
        break;
      case 'search-collection':
        if (args.length < 3) throw new Error('Usage: search-collection <fan_id> <search_key>');
        data = await testSearchCollection(args[1], args[2]);
        break;
      case 'search-wishlist':
        if (args.length < 3) throw new Error('Usage: search-wishlist <fan_id> <search_key>');
        data = await testSearchWishlist(args[1], args[2]);
        break;
      case 'autocomplete':
        if (args.length < 2) throw new Error('Usage: autocomplete <search_text> [fan_id]');
        data = await testAutocomplete(args[1], args[2]);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    if (jsonOutput) {
      console.log('\n📄 Raw JSON output:\n');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
