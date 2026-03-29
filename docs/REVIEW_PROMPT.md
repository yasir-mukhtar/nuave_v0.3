# Code Review & Quality Audit

Review the following code/changes with the rigor of a senior engineer at a top-tier tech company. Evaluate against these dimensions:

## 1. Security
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication & authorization gaps
- Secrets/credentials exposure
- Input validation and sanitization
- Dependency vulnerabilities (known CVEs)
- OWASP Top 10 compliance where applicable

## 2. Code Quality & Cleanliness
- Dead code, unused imports, commented-out blocks
- Naming clarity (variables, functions, files)
- Single Responsibility — each function/module does one thing well
- DRY violations (duplicated logic that should be abstracted)
- Consistent code style and formatting

## 3. Performance & Efficiency
- Unnecessary re-renders, re-fetches, or recomputations
- N+1 queries or unoptimized database access patterns
- Memory leaks (event listeners, subscriptions, timers not cleaned up)
- Appropriate use of caching, memoization, lazy loading
- Bundle size impact (unnecessary dependencies)

## 4. Maintainability & Readability
- Could a new team member understand this in 5 minutes?
- Proper separation of concerns (business logic vs UI vs data layer)
- Meaningful abstractions — not too early, not too late
- Error handling: graceful failures, informative error messages, no swallowed errors
- Logging and observability hooks where needed

## 5. Best Practices & Patterns
- Framework/library idioms (e.g., React hooks rules, Next.js conventions)
- TypeScript strictness: proper typing, no unnecessary `any`, discriminated unions where useful
- API design: RESTful conventions, consistent response shapes, proper HTTP status codes
- Environment-aware config (no hardcoded URLs, ports, keys)
- Edge cases handled (empty states, loading states, error states, race conditions)

## 6. Testing & Reliability
- Are critical paths testable? Are they tested?
- Missing guard clauses or boundary checks
- Concurrency/race condition risks
- Graceful degradation under failure

## 7. Data Privacy & Compliance
- No PII in logs, error messages, or client-facing API responses
- Tenant data isolation — no cross-tenant leakage in queries
- Data retention awareness — no indefinite storage without justification
- Secrets management — env vars validated at startup, not hardcoded

## 8. Resilience & Fault Tolerance
- External API calls: timeouts, retries with backoff, circuit breakers
- React error boundaries around critical UI sections
- Fallback states for third-party service failures
- Queue/job failures handled and retriable

## 9. Multi-tenancy & Authorization
- Every DB query scoped to the authenticated tenant
- RLS policies active and tested
- Authorization checked at route AND data layer (defense in depth)
- No tenant ID trust from client-side — always derive server-side

## 10. Observability & Audit
- Structured logging (JSON, not string interpolation)
- Correlation IDs across async request chains
- Audit trail for sensitive operations (who did what, when)
- Error tracking integration points (Sentry-ready)

## 11. Rate Limiting & Abuse Prevention
- API route rate limiting per tenant/user
- Third-party API budget guards (Anthropic, Firecrawl, OpenAI)
- Request size limits and payload validation

## 12. Deployment Hygiene
- Env var validation at startup (fail fast)
- No dev-only code in production builds
- Security headers (CSP, CORS, X-Frame-Options)
- Health check endpoint exists and is meaningful

## 13. Accessibility
- Semantic HTML elements used correctly
- Keyboard navigable — no mouse-only interactions
- ARIA labels on interactive components
- Color contrast meets WCAG 2.1 AA

## 14. API Stability
- Versioned endpoints or stable response contracts
- Breaking changes flagged explicitly
- Response schemas consistent and documented


## Output format

For each issue found:
1. **File & line** — where the issue lives
2. **Severity** — 🔴 Critical / 🟡 Important / 🔵 Suggestion
3. **What's wrong** — one-sentence description
4. **Why it matters** — real-world consequence if left unfixed
5. **Fix** — concrete code or approach to resolve it

End with a summary table: count of issues by severity, and an overall quality verdict (Ship It ✅ / Needs Work 🔧 / Do Not Ship 🚫).