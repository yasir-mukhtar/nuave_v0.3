-- Seed dummy data for Stripe workspace trend graph
-- Workspace: 487b238c-72b6-48a7-afbc-ec7cdc01de40
-- User: e1a61f8f-115c-48aa-82e2-fd9123d7e21b
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. INSERT AUDITS (9 additional audits over the last 30 days)
--    Existing audit: Mar 8, score 60
--    We'll add audits showing a growth trend from ~30 → ~75
-- ============================================================================

INSERT INTO public.audits (id, workspace_id, status, visibility_score, total_prompts, brand_mention_count, credits_used, completed_at, created_at)
VALUES
  -- Feb 14 - starting low
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 28, 10, 3, 10,
   '2026-02-14T10:00:00+00:00', '2026-02-14T09:55:00+00:00'),

  -- Feb 18
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 32, 10, 3, 10,
   '2026-02-18T14:30:00+00:00', '2026-02-18T14:25:00+00:00'),

  -- Feb 22
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 38, 10, 4, 10,
   '2026-02-22T09:15:00+00:00', '2026-02-22T09:10:00+00:00'),

  -- Feb 26
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 42, 10, 4, 10,
   '2026-02-26T11:00:00+00:00', '2026-02-26T10:55:00+00:00'),

  -- Mar 1
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 48, 10, 5, 10,
   '2026-03-01T16:00:00+00:00', '2026-03-01T15:55:00+00:00'),

  -- Mar 4
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 55, 10, 5, 10,
   '2026-03-04T13:20:00+00:00', '2026-03-04T13:15:00+00:00'),

  -- Mar 8 already exists (score 60) — skip

  -- Mar 10
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 63, 10, 6, 10,
   '2026-03-10T10:45:00+00:00', '2026-03-10T10:40:00+00:00'),

  -- Mar 12
  (gen_random_uuid(), '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 68, 10, 7, 10,
   '2026-03-12T15:30:00+00:00', '2026-03-12T15:25:00+00:00'),

  -- Mar 15 (today) — latest audit
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40', 'complete', 75, 10, 8, 10,
   '2026-03-15T08:00:00+00:00', '2026-03-15T07:55:00+00:00');


-- ============================================================================
-- 2. INSERT AUDIT RESULTS for the latest audit (Mar 15, score 75)
--    10 prompts, 8 with brand mentions = 80% → score 75
-- ============================================================================

INSERT INTO public.audit_results (id, audit_id, prompt_text, ai_response, brand_mentioned, mention_context, mention_sentiment, competitor_mentions, position_rank, created_at)
VALUES
  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'What is the best online payment gateway for businesses?',
   'For businesses looking for a reliable payment gateway, Stripe is one of the most popular choices. It offers a comprehensive suite of APIs that make it easy to accept payments online. Other notable options include PayPal, Square, and Adyen.',
   true, 'Stripe is one of the most popular choices', 'positive',
   ARRAY['PayPal', 'Square', 'Adyen'], 1, '2026-03-15T08:01:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'How do I integrate payment processing into my website?',
   'Stripe provides excellent developer tools and documentation for integrating payments. Their Stripe Elements and Checkout products make it straightforward. Alternatives like Braintree and Square also offer good integration options.',
   true, 'Stripe provides excellent developer tools', 'positive',
   ARRAY['Braintree', 'Square'], 1, '2026-03-15T08:02:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'What payment platform has the best API for developers?',
   'Stripe is widely regarded as having the best payment API for developers. Its RESTful API, comprehensive documentation, and extensive library support make it the go-to choice. PayPal and Adyen also offer strong APIs.',
   true, 'Stripe is widely regarded as having the best payment API', 'positive',
   ARRAY['PayPal', 'Adyen'], 1, '2026-03-15T08:03:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'Which payment processor is best for SaaS subscriptions?',
   'For SaaS subscription billing, Stripe Billing is a top choice with built-in support for recurring payments, usage-based pricing, and dunning management. Chargebee and Recurly are also popular alternatives.',
   true, 'Stripe Billing is a top choice', 'positive',
   ARRAY['Chargebee', 'Recurly'], 1, '2026-03-15T08:04:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'How to accept international payments online?',
   'Stripe supports payments in 135+ currencies and offers local payment methods worldwide. It handles currency conversion automatically. PayPal and Adyen are also strong options for international payments.',
   true, 'Stripe supports payments in 135+ currencies', 'positive',
   ARRAY['PayPal', 'Adyen'], 1, '2026-03-15T08:05:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'What is the cheapest payment processing solution?',
   'Payment processing fees vary. PayPal charges 2.9% + $0.30, Square offers 2.6% + $0.10, and Braintree has competitive rates for large volumes. The cheapest option depends on your transaction volume and business model.',
   false, NULL, NULL,
   ARRAY['PayPal', 'Square', 'Braintree'], NULL, '2026-03-15T08:06:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'Best fraud prevention tools for e-commerce?',
   'Stripe Radar uses machine learning to detect and prevent fraud in real-time with no additional setup needed. It is built into the Stripe platform. Other tools like Signifyd and Kount offer standalone fraud prevention.',
   true, 'Stripe Radar uses machine learning to detect and prevent fraud', 'positive',
   ARRAY['Signifyd', 'Kount'], 1, '2026-03-15T08:07:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'How to set up a payment system for a marketplace?',
   'Stripe Connect is designed specifically for marketplace and platform payments. It handles onboarding, payouts, and compliance for sellers. PayPal for Marketplaces and Adyen for Platforms are alternatives.',
   true, 'Stripe Connect is designed specifically for marketplace', 'positive',
   ARRAY['PayPal', 'Adyen'], 1, '2026-03-15T08:08:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'What are the most secure payment gateways?',
   'All major payment gateways follow PCI DSS compliance. PayPal, Square, and Braintree are known for their security features. Look for tokenization, encryption, and fraud monitoring when evaluating security.',
   false, NULL, NULL,
   ARRAY['PayPal', 'Square', 'Braintree'], NULL, '2026-03-15T08:09:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
   'Best payment solution for mobile apps?',
   'Stripe offers excellent mobile SDKs for both iOS and Android with pre-built UI components. Their mobile payment sheet handles the entire checkout flow. Square and Braintree also have solid mobile SDKs.',
   true, 'Stripe offers excellent mobile SDKs', 'positive',
   ARRAY['Square', 'Braintree'], 1, '2026-03-15T08:10:00+00:00');


-- ============================================================================
-- 3. INSERT RECOMMENDATIONS for the latest audit
-- ============================================================================

INSERT INTO public.recommendations (id, audit_id, workspace_id, type, priority, title, description, current_copy, suggested_copy, credits_used, created_at)
VALUES
  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40',
   'web_copy', 'high',
   'Strengthen pricing page messaging',
   'AI models rarely mention Stripe when asked about cheapest payment solutions. Add clear competitive pricing comparisons to the pricing page.',
   'Simple, transparent pricing',
   'Simple, transparent pricing. 2.9% + 30¢ per successful card charge — no hidden fees, no setup costs, no monthly fees.',
   1, '2026-03-15T08:12:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40',
   'meta', 'high',
   'Add security credentials to meta descriptions',
   'Stripe is not mentioned in security-related AI queries. Highlight PCI Level 1 certification and security features in meta descriptions.',
   'Stripe: Online Payment Processing',
   'Stripe: PCI Level 1 Certified Payment Processing — Tokenization, Encryption & Real-time Fraud Prevention with Stripe Radar',
   1, '2026-03-15T08:13:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40',
   'content_gap', 'medium',
   'Create content about payment cost optimization',
   'There is a content gap around pricing and cost comparisons. Creating detailed comparison content could improve AI visibility for cost-related queries.',
   NULL,
   'Create a comprehensive guide: "Understanding Payment Processing Costs: A Complete Breakdown" covering per-transaction fees, volume discounts, and total cost of ownership.',
   1, '2026-03-15T08:14:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40',
   'structure', 'medium',
   'Add structured data for product features',
   'Adding JSON-LD structured data for key products (Stripe Billing, Connect, Radar) will help AI models better understand the product suite.',
   NULL,
   'Implement Product and SoftwareApplication schema markup on each product page with feature lists, pricing, and use cases.',
   1, '2026-03-15T08:15:00+00:00'),

  (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '487b238c-72b6-48a7-afbc-ec7cdc01de40',
   'web_copy', 'low',
   'Emphasize mobile-first messaging',
   'While Stripe is mentioned for mobile payments, strengthen the mobile narrative with specific conversion metrics and case studies.',
   'Accept payments on mobile',
   'Accept payments on mobile with pre-built UI components — 99.9% uptime, 40% higher conversion vs. custom forms, and support for Apple Pay & Google Pay.',
   1, '2026-03-15T08:16:00+00:00');


-- ============================================================================
-- 4. INSERT CREDIT TRANSACTIONS (purchase + debit history)
-- ============================================================================

INSERT INTO public.credit_transactions (id, user_id, type, amount, balance_after, description, stripe_payment_intent_id, created_at)
VALUES
  -- Initial bonus
  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'bonus', 10, 10, 'Welcome bonus credits', NULL, '2026-02-13T08:00:00+00:00'),

  -- First purchase
  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'purchase', 150, 160, 'Growth package - 150 credits', 'pi_dummy_001', '2026-02-13T08:30:00+00:00'),

  -- Audit debits
  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 150, 'Audit: Stripe visibility scan', NULL, '2026-02-14T10:00:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 140, 'Audit: Stripe visibility scan', NULL, '2026-02-18T14:30:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 130, 'Audit: Stripe visibility scan', NULL, '2026-02-22T09:15:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 120, 'Audit: Stripe visibility scan', NULL, '2026-02-26T11:00:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 110, 'Audit: Stripe visibility scan', NULL, '2026-03-01T16:00:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 100, 'Audit: Stripe visibility scan', NULL, '2026-03-04T13:20:00+00:00'),

  -- Second purchase
  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'purchase', 50, 150, 'Starter package - 50 credits', 'pi_dummy_002', '2026-03-06T09:00:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 140, 'Audit: Stripe visibility scan', NULL, '2026-03-10T10:45:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 130, 'Audit: Stripe visibility scan', NULL, '2026-03-12T15:30:00+00:00'),

  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -10, 120, 'Audit: Stripe visibility scan', NULL, '2026-03-15T08:00:00+00:00'),

  -- Recommendation credits
  (gen_random_uuid(), 'e1a61f8f-115c-48aa-82e2-fd9123d7e21b',
   'debit', -5, 115, 'Recommendations generated', NULL, '2026-03-15T08:12:00+00:00');
