-- Dummy enquiries for local testing.
--
-- Run with:  npm run seed:local
--
-- NOTE: this lives in seeds/, NOT migrations/. Anything in migrations/ runs
-- against production on the next `migrations apply --remote`, and fake client
-- records in your real pipeline would be genuinely confusing. The npm script
-- hardcodes --local for the same reason.
--
-- The rows below are chosen to exercise every state the panel can show:
-- all five statuses, an overdue follow-up, a future one, none at all, a
-- missing company, a long Markdown brief, and two hostile values that check
-- the escaping and CSV guards actually work.

DELETE FROM enquiries WHERE email LIKE '%@seed.test';

INSERT INTO enquiries
  (name, email, company, project_type, budget, timeline, message, status, notes, follow_up_on, created_at, ip_country)
VALUES

-- 1. New, no follow-up set. The common case.
('Priya Sharma', 'priya@seed.test', 'Northwind Logistics',
 'SaaS product', '$3,000 – $5,000', 'Within 1 month',
 'We run a small logistics company and track deliveries in spreadsheets. We need a multi-tenant dashboard our dispatch team and drivers can both use.

**Key features:**
- Driver assignment and live status
- Customer-facing tracking page
- Weekly CSV reporting

No existing codebase. Hosting is not set up, so we would need help deploying too.',
 'new', '', NULL, datetime('now', '-2 hours'), 'IN'),

-- 2. New, high budget, urgent. Should sort to the top on budget.
('Daniel Okafor', 'daniel@seed.test', 'Meridian Health',
 'New web application', '$5,000+', 'ASAP',
 'Our patient intake process is entirely paper-based and it is costing us hours every day. We need a secure web portal where patients complete forms before their appointment, and staff can review submissions. Compliance matters here so we need to talk about data handling.',
 'new', '', date('now', '+2 days'), datetime('now', '-1 day'), 'NG'),

-- 3. Replied, follow-up OVERDUE — should show the amber flag.
('Anjali Mehta', 'anjali@seed.test', 'Craftly',
 'Rebuild or redesign of an existing app', '$1,000 – $3,000', 'Within 2–3 months',
 'Our current site was built by a freelancer who has gone quiet. It works but is slow and we cannot edit anything ourselves. We would like it rebuilt on something maintainable.',
 'replied',
 'Sent scope + quote on the 2nd. Chased once. Worth one more nudge before writing off.',
 date('now', '-4 days'), datetime('now', '-9 days'), 'IN'),

-- 4. Won. Should show green in the tracker.
('Marcus Bell', 'marcus@seed.test', 'Bell & Sons',
 'Cloud setup and deployment', '$1,000 – $3,000', 'Within 2 weeks',
 'We have a working Node app running on a single VPS that keeps falling over. We need it containerised and moved somewhere that scales, with monitoring so we know before customers do.',
 'won',
 'Signed. Kickoff call Monday 10am. Deposit received.',
 date('now', '+3 days'), datetime('now', '-16 days'), 'GB'),

-- 5. Lost — budget mismatch. Useful to see how that reads back.
('Sofia Rinaldi', 'sofia@seed.test', NULL,
 'New web application', 'Under $500', 'Flexible',
 'I want a booking website for my yoga studio with online payments and class scheduling. Something simple but it should look professional.',
 'lost',
 'Budget well below scope. Suggested a Squarespace template and offered to help configure payments if she wants. Left it warm.',
 NULL, datetime('now', '-22 days'), 'IT'),

-- 6. Archived — spam-ish, kept rather than deleted.
('Growth Partners', 'partners@seed.test', 'Growth Partners LLC',
 'Something else', 'Not sure yet', 'Flexible',
 'Hi! We help developers scale their agency to $50k/month with our proven system. Book a free strategy call to learn more about our done-for-you client acquisition service.',
 'archived', 'Cold outreach, not an enquiry.', NULL, datetime('now', '-5 days'), 'US'),

-- 7. No company, minimum-length brief. Checks the em-dash fallback.
('Tom Whitfield', 'tom@seed.test', NULL,
 'API or backend work', '$500 – $1,000', 'Within 1 month',
 'Need a REST API built for an existing mobile app. Auth, user profiles, and push notification endpoints.',
 'new', '', NULL, datetime('now', '-3 days'), 'AU'),

-- 8. Long brief — checks the drawer scrolls and pre-wrap holds.
('Rebecca Lin', 'rebecca@seed.test', 'Stellar Analytics',
 'DevOps and CI/CD', '$3,000 – $5,000', 'Within 2–3 months',
 'Context: we are a team of four engineers shipping a data analytics product. Deploys are manual, take about 40 minutes, and only one person knows how to do them. That person is going on leave.

What we need:
1. Automated build and test on every pull request
2. Staging environment that mirrors production
3. One-command (or zero-command) deploys to production
4. Rollback that does not require SSH access
5. Documentation the rest of the team can actually follow

Current stack is Node + Postgres on AWS, some Terraform already but incomplete and nobody trusts it. Happy to discuss whether to extend it or start that part fresh.

Timeline is flexible but we would like the PR checks in place before the leave starts.',
 'replied', 'Discovery call done. Sending proposal Thursday.',
 date('now', '+5 days'), datetime('now', '-6 days'), 'SG'),

-- 9. HOSTILE INPUT: HTML/script in fields. The panel must render this as
--    literal text. If you ever see a popup here, escaping has broken.
('<script>alert(1)</script> Ravi', 'ravi@seed.test', '<img src=x onerror=alert(2)>',
 'Ongoing support and maintenance', '$500 – $1,000', 'Within 2 weeks',
 'Testing escaping: <b>bold</b> <script>alert("xss")</script> & ampersands & "quotes".',
 'new', '', NULL, datetime('now', '-4 hours'), 'IN'),

-- 10. HOSTILE INPUT: leading = makes this a formula in Excel. Export the CSV
--     and confirm the cell shows the text, not a computed value.
('=cmd|''/c calc''!A1', 'calc@seed.test', '+44 not a formula',
 'Technical consultation', 'Not sure yet', 'Flexible',
 'Testing CSV formula injection. This row exists so the export guard can be verified by opening the file, not just by trusting the test.',
 'archived', 'Seed row — safe to delete.', NULL, datetime('now', '-30 days'), 'IN');
