-- SQLite Schema for MEV Bot Price Monitoring System
-- Optimized for high-frequency data and fast queries

-- Prices table for storing real-time price data
CREATE TABLE IF NOT EXISTS prices (
    id TEXT PRIMARY KEY,
    chain_id INTEGER NOT NULL,
    dex_name TEXT NOT NULL,
    token_pair TEXT NOT NULL,
    base_token TEXT NOT NULL,
    quote_token TEXT NOT NULL,
    price REAL NOT NULL,
    price_usd REAL NOT NULL,
    liquidity REAL NOT NULL,
    volume_24h REAL DEFAULT 0,
    timestamp TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    gas_price TEXT,
    fee_tier INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Arbitrage opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    token_pair TEXT NOT NULL,
    base_token TEXT NOT NULL,
    quote_token TEXT NOT NULL,
    source_chain INTEGER NOT NULL,
    source_dex TEXT NOT NULL,
    target_chain INTEGER NOT NULL,
    target_dex TEXT NOT NULL,
    source_price REAL NOT NULL,
    target_price REAL NOT NULL,
    price_difference REAL NOT NULL,
    price_difference_percent REAL NOT NULL,
    potential_profit REAL NOT NULL,
    gas_cost REAL NOT NULL,
    net_profit REAL NOT NULL,
    profit_margin REAL NOT NULL,
    timestamp TEXT NOT NULL,
    is_profitable INTEGER NOT NULL,
    min_profit_threshold REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- System health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
    id TEXT PRIMARY KEY,
    chain_id INTEGER NOT NULL,
    rpc_status TEXT NOT NULL CHECK (rpc_status IN ('healthy', 'degraded', 'down')),
    last_block_number INTEGER NOT NULL,
    last_block_time TEXT NOT NULL,
    latency INTEGER NOT NULL,
    error_count INTEGER DEFAULT 0,
    uptime INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Price alerts table for notifications
CREATE TABLE IF NOT EXISTS price_alerts (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL,
    token_pair TEXT NOT NULL,
    profit_margin REAL NOT NULL,
    net_profit REAL NOT NULL,
    source_chain INTEGER NOT NULL,
    target_chain INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    is_notified INTEGER DEFAULT 0,
    notification_sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

-- Token pairs configuration table
CREATE TABLE IF NOT EXISTS token_pairs (
    id TEXT PRIMARY KEY,
    base_token TEXT NOT NULL,
    quote_token TEXT NOT NULL,
    base_token_address TEXT NOT NULL,
    quote_token_address TEXT NOT NULL,
    base_token_decimals INTEGER NOT NULL,
    quote_token_decimals INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(base_token, quote_token)
);

-- DEX configurations table
CREATE TABLE IF NOT EXISTS dex_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    factory_address TEXT NOT NULL,
    router_address TEXT NOT NULL,
    version TEXT NOT NULL,
    fee_tier INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(name, chain_id)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    chain_id INTEGER,
    dex_name TEXT,
    success INTEGER NOT NULL,
    error_message TEXT,
    timestamp TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for optimal query performance

-- Prices table indexes
CREATE INDEX IF NOT EXISTS idx_prices_chain_dex ON prices(chain_id, dex_name);
CREATE INDEX IF NOT EXISTS idx_prices_token_pair ON prices(token_pair);
CREATE INDEX IF NOT EXISTS idx_prices_timestamp ON prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prices_block_number ON prices(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_prices_chain_dex_timestamp ON prices(chain_id, dex_name, timestamp DESC);

-- Opportunities table indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_token_pair ON opportunities(token_pair);
CREATE INDEX IF NOT EXISTS idx_opportunities_timestamp ON opportunities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_profit_margin ON opportunities(profit_margin DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_profitable ON opportunities(is_profitable);
CREATE INDEX IF NOT EXISTS idx_opportunities_chains ON opportunities(source_chain, target_chain);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_chain_id ON system_health(chain_id);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(rpc_status);

-- Price alerts indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_opportunity_id ON price_alerts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_timestamp ON price_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_is_notified ON price_alerts(is_notified);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_success ON performance_metrics(success);

-- Partial indexes for better performance (SQLite doesn't support WHERE in CREATE INDEX)
CREATE INDEX IF NOT EXISTS idx_prices_recent ON prices(chain_id, dex_name, token_pair, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_profitable ON opportunities(token_pair, profit_margin DESC, timestamp DESC);

-- Views for common queries
CREATE VIEW IF NOT EXISTS recent_prices AS
SELECT 
    chain_id,
    dex_name,
    token_pair,
    price,
    price_usd,
    liquidity,
    timestamp,
    block_number
FROM prices 
WHERE timestamp > datetime('now', '-1 hour')
ORDER BY timestamp DESC;

CREATE VIEW IF NOT EXISTS profitable_opportunities AS
SELECT 
    token_pair,
    source_chain,
    source_dex,
    target_chain,
    target_dex,
    price_difference_percent,
    net_profit,
    profit_margin,
    timestamp
FROM opportunities 
WHERE is_profitable = 1 
    AND profit_margin >= 2.0
    AND timestamp > datetime('now', '-24 hours')
ORDER BY profit_margin DESC, timestamp DESC;

CREATE VIEW IF NOT EXISTS system_status AS
SELECT 
    chain_id,
    rpc_status,
    last_block_number,
    latency,
    error_count,
    timestamp
FROM system_health 
WHERE timestamp > datetime('now', '-1 hour')
ORDER BY chain_id, timestamp DESC;

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_prices_updated_at 
    AFTER UPDATE ON prices
    FOR EACH ROW
    BEGIN
        UPDATE prices SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_token_pairs_updated_at 
    AFTER UPDATE ON token_pairs
    FOR EACH ROW
    BEGIN
        UPDATE token_pairs SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_dex_configs_updated_at 
    AFTER UPDATE ON dex_configs
    FOR EACH ROW
    BEGIN
        UPDATE dex_configs SET updated_at = datetime('now') WHERE id = NEW.id;
    END; 