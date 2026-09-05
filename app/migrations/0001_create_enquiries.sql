-- Enquiries captured from the contact form.
--
-- Apply with:
--   npx wrangler d1 migrations apply hardik-enquiries --local   (dev)
--   npx wrangler d1 migrations apply hardik-enquiries --remote  (production)

CREATE TABLE IF NOT EXISTS enquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Submitted by the visitor
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  company       TEXT,
  project_type  TEXT NOT NULL,
  budget        TEXT NOT NULL,
  timeline      TEXT NOT NULL,
  message       TEXT NOT NULL,

  -- Your pipeline. Constrained rather than free text so a typo cannot
  -- silently create a fourth status that the UI never shows.
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'replied', 'won', 'lost', 'archived')),
  notes         TEXT NOT NULL DEFAULT '',
  follow_up_on  TEXT,           -- ISO date (YYYY-MM-DD), null when none set

  -- Metadata. Useful for spotting abuse and for knowing where leads come from.
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  ip_country    TEXT,
  user_agent    TEXT
);

-- The default view is "newest first", so index the sort column.
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at
  ON enquiries (created_at DESC);

-- Filtering by status is the other common read.
CREATE INDEX IF NOT EXISTS idx_enquiries_status
  ON enquiries (status, created_at DESC);

-- Finding what is due for follow-up.
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up
  ON enquiries (follow_up_on)
  WHERE follow_up_on IS NOT NULL;

-- Keep updated_at honest without having to remember it in every UPDATE.
CREATE TRIGGER IF NOT EXISTS enquiries_touch_updated_at
AFTER UPDATE ON enquiries
FOR EACH ROW
BEGIN
  UPDATE enquiries SET updated_at = datetime('now') WHERE id = NEW.id;
END;
