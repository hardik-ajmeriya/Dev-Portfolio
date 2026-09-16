-- Fixed-window counters for the public enquiry endpoint.
--
-- See worker/rateLimit.js for why this exists. Short version: the cooldown in
-- Contact.jsx runs in the visitor's browser, so it only stops accidental
-- double submits. This table is what stops curl in a loop from burning the
-- Resend quota or turning the auto-reply into an open relay.
--
-- Apply with:
--   npx wrangler d1 migrations apply hardik-enquiries --local   (dev)
--   npx wrangler d1 migrations apply hardik-enquiries --remote  (production)

CREATE TABLE IF NOT EXISTS rate_limits (
  -- "<limit-name>:<salted-hash-of-identity>". The identity is an IP address
  -- or an email address, hashed — the limiter only needs to know whether two
  -- requests came from the same place, so storing either in the clear would
  -- be holding personal data for no reason.
  bucket      TEXT PRIMARY KEY,

  count       INTEGER NOT NULL DEFAULT 0,

  -- Unix seconds. A new window produces a strictly larger value, which is
  -- what resets the counter in the upsert.
  expires_at  INTEGER NOT NULL
);

-- Supports the opportunistic sweep of closed windows.
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
  ON rate_limits (expires_at);
