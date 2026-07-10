# Graph Report - . (2026-07-09)

## Corpus Check

- Corpus is ~38,178 words - fits in a single context window. You may not need a graph.

## Summary

- 403 nodes · 625 edges · 43 communities (18 shown, 25 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.86)
- Token cost: 108,809 input · 0 output

## Community Hubs (Navigation)

- API Route Handlers
- UI Pages and Components
- Docs, Audits and Security Concepts
- Zod Validation Schemas
- Dev Tooling Dependencies
- TypeScript Config
- App Layout and Providers
- Package Scripts
- Runtime Dependencies
- Env and Security Headers
- JS Path Aliases
- Sign-In Page
- Geohash Typings
- Vercel Starter Assets
- Husky Shell Shim
- Jest Config
- Next.js Branding Assets
- Retry Utility
- File Icon Asset
- Global Type Declarations
- ESLint Config
- Git Hook: applypatch-msg
- Git Hook: commit-msg
- Git Hook: post-applypatch
- Git Hook: post-checkout
- Git Hook: post-commit
- Git Hook: post-merge
- Git Hook: post-rewrite
- Git Hook: pre-applypatch
- Git Hook: pre-auto-gc
- Git Hook: pre-commit
- Git Hook: pre-merge-commit
- Git Hook: pre-push
- Git Hook: pre-rebase
- Git Hook: prepare-commit-msg
- PostCSS Config
- Prettier Config
- Globe Icon Asset

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 18 edges
2. `Logger` - 16 edges
3. `scripts` - 15 edges
4. `prisma` - 13 edges
5. `ItemForm()` - 11 edges
6. `calculateSalaryDays()` - 11 edges
7. `withApiHandler()` - 10 edges
8. `getOrCreateShadowProfile()` - 10 edges
9. `Security Guide` - 10 edges
10. `authOptions` - 9 edges

## Surprising Connections (you probably didn't know these)

- `Structured Logging Recommendation` --semantically_similar_to--> `Pino Structured Logging` [INFERRED] [semantically similar]
  ANALYSIS_REPORT.md → README.md
- `Centralized Error Middleware Proposal (withErrorHandling)` --semantically_similar_to--> `withApiHandler Middleware` [INFERRED] [semantically similar]
  ANALYSIS_REPORT.md → README.md
- `API Cache Headers Recommendation` --semantically_similar_to--> `Caching Strategies (Browser / Server / Redis)` [INFERRED] [semantically similar]
  ANALYSIS_REPORT.md → PERFORMANCE.md
- `Rate Limiting Proposal (Upstash Redis)` --semantically_similar_to--> `In-Memory Rate Limiting (src/lib/rate-limit.ts)` [INFERRED] [semantically similar]
  ANALYSIS_REPORT.md → SECURITY.md
- `Rate Limiting Proposal (Upstash Redis)` --semantically_similar_to--> `Finding S4: Zero Rate Limiting` [INFERRED] [semantically similar]
  ANALYSIS_REPORT.md → SECURITY_RESILIENCE_ACCESSIBILITY_AUDIT.md

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **GDPR Privacy and Consent Compliance** — api_routes_gdpr_api, security_consent_anti_forgery, security_privacy_by_design, architecture_anonymized_events, security_resilience_accessibility_audit_s2_consent_forgery [INFERRED 0.85]
- **Backend Resilience Stack (retry, error handler, logging, transactions)** — readme_retry_helper, readme_withapihandler, readme_pino_logging, security_resilience_accessibility_audit_r2_merge_idempotency [INFERRED 0.85]
- **Behavioral Finance Feature Loop** — readme_salary_days_calculation, readme_meditation_chamber, readme_financial_health_summary, readme_credit_marketplace [EXTRACTED 1.00]

## Communities (43 total, 25 thin omitted)

### Community 0 - "API Route Handlers"

Cohesion: 0.07
Nodes (43): handler, POST, POST, POST, GET, POST, DELETE, DELETE (+35 more)

### Community 1 - "UI Pages and Components"

Cohesion: 0.10
Nodes (41): OnboardingPage(), Home(), CreditMarketplace(), CreditMarketplaceProps, Product, PRODUCTS, FinancialHealthSummary(), FinancialHealthSummaryProps (+33 more)

### Community 2 - "Docs, Audits and Security Concepts"

Cohesion: 0.06
Nodes (50): CI Lint and Test Job, API Cache Headers Recommendation, Analysis Report: Efficiency, Resilience and Optimization, Centralized Error Middleware Proposal (withErrorHandling), Rate Limiting Proposal (Upstash Redis), Structured Logging Recommendation, Zod Input Validation Recommendation, Encrypted Backup API (+42 more)

### Community 3 - "Zod Validation Schemas"

Cohesion: 0.07
Nodes (29): BackupData, BackupDataSchema, BackupInput, BackupItemSchema, BackupSchema, ConsentInput, ConsentSchema, CreateItemInput (+21 more)

### Community 4 - "Dev Tooling Dependencies"

Cohesion: 0.08
Nodes (25): husky.sh script, devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, jest, jest-environment-jsdom (+17 more)

### Community 5 - "TypeScript Config"

Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, esModuleInterop, incremental, isolatedModules, jsx (+13 more)

### Community 6 - "App Layout and Providers"

Cohesion: 0.16
Nodes (13): geistMono, geistSans, metadata, Providers(), ProvidersProps, Header(), ThemeToggle(), ThemeProbe() (+5 more)

### Community 7 - "Package Scripts"

Cohesion: 0.11
Nodes (18): name, private, scripts, build, dev, format, lint, lint:md (+10 more)

### Community 8 - "Runtime Dependencies"

Cohesion: 0.11
Nodes (19): dependencies, @emotion/react, @emotion/styled, geohash, @hookform/resolvers, idb-keyval, @mui/icons-material, @mui/material (+11 more)

### Community 9 - "Env and Security Headers"

Cohesion: 0.27
Nodes (6): nextConfig, securityHeaders, env, EnvSchema, result, getSecurityHeaders()

### Community 10 - "JS Path Aliases"

Cohesion: 0.40
Nodes (4): compilerOptions, baseUrl, paths, @/\*

### Community 13 - "Vercel Starter Assets"

Cohesion: 0.50
Nodes (4): Next.js Scaffold Default Assets, Vercel Platform Branding, Vercel Logo (triangle SVG), Window Icon (browser window SVG)

### Community 17 - "Next.js Branding Assets"

Cohesion: 1.00
Nodes (3): Next.js Default Starter Template Asset, Next.js Framework, Next.js Wordmark Logo (next.svg)

## Knowledge Gaps

- **161 isolated node(s):** `husky.sh script`, `eslintConfig`, `createJestConfig`, `config`, `baseUrl` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `prisma` connect `Runtime Dependencies` to `API Route Handlers`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Tooling Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `husky.sh script`, `eslintConfig`, `createJestConfig` to the rest of the system?**
  _163 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06807511737089202 - nodes in this community are weakly interconnected._
- **Should `UI Pages and Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1013277428371768 - nodes in this community are weakly interconnected._
- **Should `Docs, Audits and Security Concepts` be split into smaller, more focused modules?**
  _Cohesion score 0.061224489795918366 - nodes in this community are weakly interconnected._
