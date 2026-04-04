const NodeCache = require('node-cache');

// Standard TTL is 1 hour = 3600 seconds
// Check period (removes expired keys automatically) = 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

class CacheManager {
    static get(key) {
        return cache.get(key);
    }

    static set(key, value, ttl = 3600) {
        return cache.set(key, value, ttl);
    }

    static invalidate(key) {
        return cache.del(key);
    }

    static flush() {
        return cache.flushAll();
    }
}

module.exports = CacheManager;
