CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  x_user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  oauth_token_encrypted TEXT NOT NULL,
  oauth_refresh_token_encrypted TEXT,
  email TEXT,
  goal TEXT,
  public_slug TEXT UNIQUE,
  share_enabled INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  last_scanned_at TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  x_post_id TEXT UNIQUE NOT NULL,
  text TEXT,
  post_type TEXT,
  created_at TEXT NOT NULL,
  has_url INTEGER DEFAULT 0,
  media_type TEXT,
  conversation_id TEXT,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  impressions INTEGER,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  quotes INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  engagements INTEGER,
  profile_clicks INTEGER,
  url_clicks INTEGER,
  FOREIGN KEY (post_id) REFERENCES posts (id)
);

CREATE TABLE IF NOT EXISTS post_features (
  post_id TEXT PRIMARY KEY,
  deterministic_json TEXT,
  semantic_json TEXT,
  feature_version TEXT,
  FOREIGN KEY (post_id) REFERENCES posts (id)
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT,
  post_count INTEGER DEFAULT 0,
  qualifying_post_count INTEGER DEFAULT 0,
  cost_estimate REAL DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  algorithm_snapshot_version TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  explanation TEXT,
  confidence TEXT,
  evidence_json TEXT,
  FOREIGN KEY (scan_id) REFERENCES scans (id)
);

CREATE TABLE IF NOT EXISTS moves (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  move_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  evidence_json TEXT,
  rewrite_text TEXT,
  status TEXT DEFAULT 'proposed',
  accepted_at TEXT,
  FOREIGN KEY (scan_id) REFERENCES scans (id)
);

CREATE TABLE IF NOT EXISTS playbook_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'candidate',
  confidence REAL DEFAULT 0,
  evidence_post_ids TEXT,
  counterexample_post_ids TEXT,
  experiment_ids TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  move_id TEXT,
  hypothesis TEXT,
  target_metrics_json TEXT,
  baseline_json TEXT,
  status TEXT DEFAULT 'proposed',
  started_at TEXT,
  completed_at TEXT,
  outcome_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
