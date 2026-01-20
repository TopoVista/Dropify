Project Folder Structure

Frontend (Next.js + TypeScript):

my-dropify-frontend/
├── public/                   # Static assets (images, favicon, QR icons, etc.)
│   ├── favicon.ico
│   └── ...
├── app/ or pages/            # Next.js pages or App Router (depending on Next.js version)
│   ├── layout.tsx           # Root layout (header/footer)
│   ├── page.tsx             # Main landing page
│   ├── (routes)/            # Optional route groups (e.g. for private routes)
│   └── api/                 # Next.js API routes (if using Pages Router for some APIs)
├── components/              # Reusable UI components (Buttons, Forms, Modals, etc.)
├── contexts/                # React Context providers (if needed for auth/session)
├── lib/                     # Helper libraries (e.g. WebSocket hook, API client)
├── styles/                  # CSS/SCSS files or Tailwind config
├── manifest.json            # PWA Web App Manifest (Next.js App Router can use app/manifest.ts)
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts


Backend (FastAPI on Render with Redis & PostgreSQL):

my-dropify-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── core/                # App-wide configs (config.py, security.py)
│   │   ├── config.py        # Load env vars (database URLs, secrets)
│   │   └── security.py      # e.g. password hashing functions
│   ├── models/              # SQLAlchemy models (Session, Drop, User, etc.)
│   │   └── ... .py
│   ├── schemas/             # Pydantic schemas for request/response validation
│   │   └── ... .py
│   ├── routers/             # API route modules (e.g. session.py, files.py, etc.)
│   │   └── ... .py
│   ├── services/            # Business logic separate from routers
│   │   └── ... .py
│   └── db/
│       ├── database.py      # DB connection (PostgreSQL via SQLAlchemy)
│       └── redis.py         # Redis client setup (for TTL, pub/sub)
├── tests/                   # Test suite (unit and integration tests)
│   └── ... .py
├── Dockerfile               # (Optional) Container config for deployment
├── requirements.txt         # Python dependencies
├── README.md
└── run.sh                   # (Optional) startup script


This structure follows recommended conventions: Next.js uses top-level app or pages and public (as per docs), and FastAPI uses an app/ directory with clear submodules for routers, models, schemas, services, and a db folder (as shown in best-practice examples). Environment/config files (e.g. .env) are kept out of version control.

We will follow Test-Driven Development (TDD) throughout. In TDD, we repeatedly write a failing test, then implement code to pass it, then refactor. Martin Fowler summarizes this cycle as: “Write a test for the next bit of functionality you want to add. Write the functional code until the test passes. Refactor both new and old code to make it well structured.”. All feature work below is planned in this red-green-refactor loop.

90-Day Development Plan

Day 1: Setup & TDD Prep. Learn/refine TDD process. Initialize Git repos for frontend and backend. Set up Next.js project with TypeScript (npx create-next-app --typescript) and FastAPI project (python -m venv, install FastAPI+Uvicorn). Create initial tests (e.g. using Jest/Vitest for frontend, pytest for backend) that assert “Hello World” endpoints (test should fail, then implement minimal code to pass). Install linting/formatting (ESLint/Prettier, Black) and run them. Document project READMEs.
Testing: Write a failing test for each “Hello world” endpoint. Implement minimal route & page to satisfy it. Refactor config.
Deployment: Confirm local dev servers (Next at localhost:3000, FastAPI at localhost:8000).

Day 2: Frontend Scaffold. Learn Next.js directory conventions. In app/ (or pages/), create placeholders: a HomePage (page.tsx) and a basic Layout (layout.tsx) with header/footer. Scaffold components folder. Write a unit test for a simple React component (e.g. a Button) and implement it (TDD). Ensure TypeScript is type-checking.
Tasks: TDD for a sample component. Add CSS framework or Tailwind setup for styling. Ensure a static build works.

Day 3: Backend Scaffold. Learn FastAPI app structure. In app/main.py, define FastAPI instance and include an empty router (pass). Create a health or root endpoint with test (TDD). Set up SQLAlchemy database.py to connect to PostgreSQL (env var DATABASE_URL). Write a test that tries to connect to DB (mock or use a test DB). Also configure Redis connection in db/redis.py, and test that Redis is reachable.
Tasks: Implement dummy “/health” endpoint that returns status (test-first). Initialize database (create tables script with SQLAlchemy Base).

Day 4: Session Model (Backend). Learn about session management for anonymous users. Create a SQLAlchemy model Session with fields: id (UUID), code (6-digit string, unique), expires_at (timestamp). Write a failing test for creating a session: POST /sessions should generate and return a new 6-digit code. Implement the endpoint and code generator (e.g. random numeric). Ensure uniqueness (e.g. loop on collision).
Testing: Unit test that a session code is always 6-digit and unique. Use pytest with a temporary DB (e.g. SQLite). Follow TDD cycle.

Day 5: Session Persistence & Expiry (Backend). Implement storage of sessions: generate code, store in PostgreSQL, set TTL in Redis (for quick expiry check). Write tests: after creation, querying by code returns session. Also test that upon expiry (simulate time or call expiry cleanup), the session no longer exists. Create a background task (or a CRON job via e.g. Redis key expiration) to delete expired sessions. (Redis TTL means “keys expire automatically”.)
Refactor: Ensure Session logic is in a service class (services/session_service.py), separate from router.

Day 6: Anonymous Join (Backend). Implement POST /sessions/join with a code body to join an existing session. Write tests: valid code returns session info; invalid code returns 404. Ensure session’s expires_at is extended or not (design decision). Add any needed dependencies (FastAPI Depends for DB session).
Refactor: Extract a get_session_by_code service. Use TDD.

Day 7: Frontend – Session Creation UI. Create Next.js page for creating/joining sessions. Write tests (React Testing Library) for UI form component (one input with “Create Session” button). On submit (client-side), call backend /sessions via fetch. For TDD: write a failing unit test for the component behavior, then implement. On success, navigate to session page (e.g. /session/[code]).
Tasks: Ensure cross-origin (CORS) is set in FastAPI to allow requests from Next.js domain. Use Next.js API routes as BFF proxy if needed.

Day 8: Frontend – Join by Code UI. Create UI input for existing 6-digit code. TDD for join component: write test expecting to navigate on valid code. Implement API call to /sessions/join. Handle errors gracefully (invalid code). Ensure UI shows error if join fails.
Refactor: Possibly refactor API calls into a helper in lib/api.ts.

Day 9: WebSocket Basics. Learn FastAPI WebSocket support. In app/main.py, add a websocket endpoint @app.websocket("/ws/{session_id}"). Implement a ConnectionManager class to track connections (like in FastAPI docs). Write tests simulating a client (e.g. use websockets or starlette.testclient). Confirm broadcast functionality.
Tasks: Frontend: install a WebSocket library (native WebSocket or socket.io). Write a failing unit test for a hook/component that connects via useEffect to ws://. Implement minimal WebSocket connection code.

Day 10: Real-time Sync – Text Drops. Implement text “drops”. In backend, create model Drop (fields: id, session_id (FK), content (text), created_at). Add POST /sessions/{session_id}/drops/text. TDD: write test that sending text stores a Drop. Include WebSocket broadcast in the endpoint: after saving, send message to all clients in the session’s room. Frontend: create a text input form component (TDD) that sends text to backend and updates UI on WebSocket message.
Testing: Unit-test the service logic (text length, sanitation). Integration test: simulate two WebSocket clients and ensure a drop appears in both (for real-time sync).

Day 11: Real-time Sync – File Uploads. Implement file drops. Backend: extend /sessions/{session_id}/drops/file to accept multipart UploadFile. Store files (locally or S3; start local file system for dev). Write TDD for file upload (test using Starlette TestClient and a temp file). Emit WebSocket event on successful upload. Frontend: create file input component (TDD) that POSTs file to backend and displays file link or preview. Handle WebSocket to receive new files from others.
Refactor: Factor out file storage logic into services/file_service.py.

Day 12: Cross-Device Sharing – QR Code Generation. Add QR code support: backend endpoint GET /sessions/{session_id}/qrcode that returns a QR image (PNG) or data URI for the session URL. Use a Python QR library (e.g. qrcode). Write a test generating a QR from a known URL. Frontend: on session page, display QR code (fetch from backend or generate in browser with a JS lib). Test that scanning the QR opens the session URL.
Testing: Ensure QR data matches session link (use known input in test).

Day 13: QR Code (Frontend) and Start Auto-Expiry. In the session page, implement “Copy Code” and “QR Code” display (TDD for rendering the code). In backend, implement auto-expiry logic: use Redis TTL (set TTL on session key when created) and/or a background task (Celery or FastAPI background tasks) to delete stale data from PostgreSQL. Write tests to simulate passage of time (e.g. monkeypatch expires_at) and ensure cleanup.
Refactor: Abstract expiry logic into a service (e.g. services/expiry_service.py).

Day 14: Refactoring & Code Review. Review all code so far. Refactor any duplication (e.g. repeated API call logic). Clean up folder structure; ensure separation of concerns (e.g. no business logic in routers). Write more unit tests for missing cases (e.g. invalid file type, missing session). Polish documentation (update README with setup instructions).
Testing: Increase test coverage to >80%. Fix any broken tests.

Day 15: Rate Limiting. Learn rate limiting strategies. Implement a per-IP or per-session rate limiter in FastAPI: use Redis to count requests (e.g. key = ip:action, INCR and EXPIRE). On exceeding limits, return 429. TDD: write tests that simulate >N requests and expect HTTP 429. Add appropriate headers (Retry-After). Frontend: handle 429 (e.g. show warning).
Review: Add middleware or dependency for rate-limit on sensitive routes (e.g. create session, upload). Use [39†L288-L296] as guide.

Day 16: Frontend – PWA Setup. Configure Progressive Web App support. Following Next.js guides, create app/manifest.ts (or public/manifest.json). Add icons, set theme. Register a service worker (maybe with next-pwa plugin or manual). TDD: write a test that the manifest file exists and is valid JSON. Check offline behavior: after first load, refresh with network off should still show basic UI (cache home page).
Polish: Test on mobile or Chrome DevTools for “Add to Home Screen” prompt.

Day 17: Offline Caching & IndexDB. Enhance PWA: use service worker to cache static assets and API responses (text drops) for offline usage. On session page, allow reading existing drops from cache. TDD: simulate offline (unit test of cache logic can be tricky; instead manual or e2e test). Implement a fallback page for offline.
Tasks: Ensure correct caching strategy (e.g. stale-while-revalidate for JSON).

Day 18: Integration Testing. Write integration/E2E tests (using Playwright or Cypress). Test key flows: create session, join session on another browser, exchange text and file drops in real time, ensure sync. Simulate two browser contexts. Test QR code scanning by using the QR image link. Ensure auto-expiry actually removes data after TTL.
Testing: These are not unit tests, but critical for verifying features.

Day 19: Security and Abuse Prevention. Implement basic abuse prevention: verify file type/size (reject executables or overly large files). In backend, sanitize text (e.g. escape HTML to prevent XSS in text drops). Use libraries or simple checks. TDD: write tests that uploading a disallowed file or script-injection text is rejected. Add CORS headers, rate-limit (done), and consider adding CAPTCHA on create session (optional if time).
Documentation: Update privacy/security notes in README.

Day 20: Code Review & Documentation. Conduct a thorough code review with peers or checklist. Refactor any messy code paths. Write docstrings for modules. Update API docs (FastAPI auto-docs are useful). Ensure README covers local and production setup (Vercel/Render).
Tasks: Clean up Git commit history if needed.

Day 21: Deployment Milestone 1 – Alpha. Deploy current backend to Render (staging) and frontend to Vercel. Configure environment variables (DB URL, Redis URL, secrets). Run smoke tests against deployed endpoints. Make sure websockets work (may need secure WSS). If any deployment issues, fix configuration (e.g. CORS, static files).
Review: Check logs.

Day 22: Optional Learning – ML Features. Research simple ML integrations: e.g. use a lightweight model to detect content type (image classification or NSFW detection for abuse). Plan where to plug in (likely as a pipeline before saving drop). Write a spike/test for a Python image model (e.g. use torchvision or an API).
Decision: Determine if these ML features are worthwhile; if so, allocate time.

Day 23: Optional ML – Content Detection. (If proceeding) Implement content detection for file drops: e.g., use an external API (like Google Vision) or a small model to detect inappropriate images. TDD: mock a “bad image” and reject upload (unit test on service level). For text, maybe integrate a profanity filter library. If out of scope, skip but note for future.
Tasks: Otherwise, focus on polishing existing features and tests.

Day 24: Optional ML – Expiry Prediction. (Optional) Create a simple ML model or heuristic: analyze drop content length or type to suggest or auto-set a smarter expiry (e.g. short text get longer life, long confidential text expire sooner). Implement in code as a separate service (you can stub model with if-else or use random forest on synthetic data). Test by feeding content to predict_expiry() and check output.
Decision: Label as optional (flag if not robust).

Day 25: UI/UX Polish. Improve frontend UX: add loading spinners, success/error toasts. Ensure mobile responsiveness. TDD: write snapshot tests for new components (snackbar, spinner). Refactor CSS for consistency.
Accessibility: Check basic accessibility (ARIA labels).

Day 26: Refactor & Tech Debt. Tackle any tech debt identified (duplicate code, security holes). For example, if any React state is messy, rewrite using a central store or context. Simplify complex functions. Ensure TDD cycle for refactoring: update tests first if needed.
Documentation: Update architecture diagram if any (optional image).

Day 27: Final Integration Tests. Run full E2E test suite covering all use-cases: new session, multiple drops, expiry, PWA offline. Fix any discovered bugs (likely off-by-one errors, race conditions). Ensure tests pass.
Review: Peer code review of final changes.

Day 28: Final Code Review & Cleanup. Last code review. Freeze feature set. Merge any branches. Update version numbers. Ensure code follows style guides (apply npm run lint && npm run format, flake8/black).
Tasks: Update README to final form, draft user guide or feature list.

Day 29: Release Prep. Prepare for production deployment: set up production DB and Redis (in Render or external), configure secrets. Write migration scripts for DB. Confirm no debug endpoints are exposed. Finalize PWA icons and metadata.
Testing: Smoke-test in staging (e.g. create session via deployed front).

Day 30: Launch (Production Deployment). Deploy backend on Render (production), frontend on Vercel. Test “production build” of Next.js (npm run build). Monitor logs for errors. Announce “beta dropify” to limited users. Post-launch, monitor errors and rate-limit logs.
Tasks: Celebrate completing MVP!

(At this point, core features are live with TDD, real-time sync, QR code, PWA support, and basic ML stubs. The remaining days focus on optional polish, additional ML, and robust testing.)

Day 31: User Feedback & Bugfixes. Collect any early user feedback. Fix reported bugs (write tests for any bugs found). Adjust UI text, translations, or accessibility issues. Write regression tests for critical user flows.
Documentation: Update FAQ in README.

Day 32: Performance Tuning. Profile performance. On backend, ensure DB queries are indexed (e.g. index session_id in drops). On frontend, lazy-load large components. TDD: add tests simulating large payload. Optimize caching (HTTP headers, CDN on Vercel).
Tasks: Improve caching strategies for assets.

Day 33: Scalability Review. Plan for scale: consider Sharding of Redis (for many sessions), DB connection pooling. Write a small load test script (maybe using locust) to simulate many users. Adjust rate limits if needed.
Tasks: Document scaling limits.

Day 34: ML (Optional) – Auto-Format Feature. If adding “auto-format” ML: integrate a library (e.g. Prettier for code, or a simple text summarizer API) to reformat pasted text. TDD: Given some unformatted text, test that auto_format(text) returns a nicer format. Implement and integrate on drop creation (user can opt-in to auto-format).
Decision: If dropped, skip.

Day 35: Database & Data Integrity. Add additional database constraints: e.g. cascade delete drops when session is deleted. Write tests for foreign key behavior. Ensure atomic transactions for drop creation. Implement idempotency if needed (duplicate POSTs).
Tasks: Add Alembic migrations if schema changed.

Day 36: Logging & Monitoring. Implement logging (e.g. log drop creations, errors). Integrate a simple monitoring (e.g. health check endpoint already exists; add Sentry or similar for error tracking). Test by generating a known error and verifying it’s logged.
Polish: Add informative log messages.

Day 37: Documentation Sprint. Create detailed developer docs: architecture overview, API specs, setup guide. Use Markdown or a wiki. Also prepare user documentation (how to use Dropify). TDD: For code examples in docs, ensure they match code.
Tasks: Tag v1.0 in Git.

Day 38: End-to-End Regression Testing. Run full test suite (unit + integration + e2e) from scratch. Fix any flakiness. Automate test runs (GitHub Actions or similar).
Review: Ensure CI is green on main branch.

Day 39: Final Polishing. Do final touches: adjust color scheme, logos, and UI animations. TDD: Write snapshot tests for final UI look. Ensure PWA “install” prompt works.
Checklist: Mobile responsiveness, retina images for QR/icons.

Day 40: Product Launch. Launch official version. Announce release notes. Monitor for any urgent issues. (No new feature coding; focus on observability.)

Days 41-90: Post-Launch Improvements & Learning:

Days 41-45: Allocate ~2-3 hours/day to optional ML features (content detection, expiry prediction) if still desired. Otherwise continue writing tests and small enhancements (e.g. dark mode, multi-language support).

Days 46-50: Plan and implement any new minor features based on user feedback (e.g. edit/delete drop). Test them thoroughly with TDD.

Days 51-55: Work on cross-device polish: ensure clipboard sharing works (maybe integrate Web Share API), finalize QR code scanning flow on various devices.

Days 56-60: Ramp up security: perform a vulnerability audit, fix any issues (use OWASP guidelines). Add rate-limit adjustments or CAPTCHAs if under attack.

Days 61-65: Performance revisit: consider migrating Redis to a managed tier if needed, or Postgres tuning. Possibly introduce caching of static API responses.

Days 66-70: ML enhancements (if any): refine or remove experimental ML features. Possibly integrate a simple NLP model for auto-format or summarization (text expander). Document any tradeoffs.

Days 71-75: User experience refinements: add animations to websockets updates, refine PWA offline caching (e.g. cache next-session for quicker load), write blog or tutorial about Dropify.

Days 76-80: Final testing and cleanup: aim to eliminate any remaining warnings, handle edge cases. Check GDPR/privacy compliance (auto-expiry helps privacy).

Days 81-85: Documentation and Code Comments: ensure all modules and functions are well-commented. Update Diagrams if needed. Check all citations in documentation.

Days 86-90: Wrap-up: Conduct one last code review, finalize backlog items. Prepare a retrospective of what was learned. Celebrate completion!

Throughout all days, maintain rigorous TDD: write tests before implementation for every new endpoint or component. Keep feature branches small and reviewed. Regularly merge to main with passing tests. Document every API and significant component. Use code reviews and pair programming where possible to ensure quality. Deploy early and often (each week deploy a staging build) so integration issues surface quickly. The above plan ensures all required features (WebSockets real-time sync, anonymous sessions, cross-device QR code sharing, text/file drops, auto-expiry, rate limiting, PWA polish, and optional ML) are built, tested, and deployed in a lean, well-structured codebase.

Sources: Project structure and conventions are guided by official docs and best practices. The TDD methodology is based on Fowler’s description. FastAPI examples for websockets, file uploads, and project layout informed the design. PWA setup references Next.js guides. Rate limiting approach follows Redis-backed patterns. QR code generation uses a Python library example. All features should be developed test-first, in the red-green-refactor cycle.