CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('pol','partner','guest')),
  name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('in','out')),
  at INTEGER NOT NULL,
  request_id TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS events_at ON events(at);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id=1),
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings VALUES (1, '{"rent":1013,"pol":"Pol","partner":"Paula","split":"half"}');
