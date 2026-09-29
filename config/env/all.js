// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    cookieSecret: process.env.COOKIE_SECRET || "local_dev_only_cookie_secret",
    cryptoKey:    process.env.CRYPTO_KEY   || "local_dev_only_crypto_key",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

