# Business Readiness Overview

This document defines the minimum criteria for declaring the platform production-ready.

## 1. Functional Scope Covered
- User Registration / Login / Token issuance
- Story CRUD: create, edit, preview, publish flag
- Character management: add, update, delete, copy/paste, popularity (internal)
- Timeline: scene creation, media (images/video/audio) attachment, copy/paste scenes
- Genre association and filtering

## 2. Non-Functional Requirements
- Performance: Initial bundle < 350KB (post gzip). API average p95 latency < 300ms under light load.
- Reliability: Graceful failure (ErrorBoundary in frontend). Critical endpoints return structured JSON error bodies.
- Security: JWT required for modifying protected resources. CORS restricted to configured origins. Input validation via Bean Validation annotations.
- Observability: Actuator health endpoints exposed. (Future: add metrics & log correlation IDs.)

## 3. Deployment Prerequisites
| Item | Requirement |
|------|-------------|
| JDK | 21 (All microservices) |
| Node | >=18.x (Frontend) |
| Database | MySQL >=8.x |
| Reverse Proxy | Nginx/Ingress for static + gateway routing |
| Email | SMTP config (optional if verification disabled) |

## 4. Environment Variables (Example)
```
STORY_DB_URL=jdbc:mysql://host:3306/storydb
USER_DB_URL=jdbc:mysql://host:3306/userdb
JWT_SECRET=replace_with_long_random_value
SMTP_HOST=smtp.example.com
SMTP_USER=notifications@example.com
SMTP_PASS=***
``` 

## 5. Required Startup Order
1. Eureka (if still using service discovery)
2. User Service
3. Story Service
4. API Gateway
5. Frontend (served separately or via CDN)

## 6. Validation Checklist (Run per release)
- [ ] Register user succeeds; login returns JWT
- [ ] Create story with 2 characters & 3 scenes (images + video)
- [ ] Character rename updates timeline correctly
- [ ] Copy/paste character and scene works; no duplicate IDs leakage
- [ ] Story preview paginates scenes properly
- [ ] Genres endpoint cached (headers present)
- [ ] ErrorBoundary catches artificial thrown error in a component
- [ ] No popularity value rendered publicly
- [ ] Media uploads return expected URLs and accessible through gateway

## 7. Risk & Gap Tracking
| Gap | Impact | Mitigation |
|-----|--------|-----------|
| No automated tests | Manual regression effort | Add smoke scripts + Jest/Playwright suite |
| No rate limiting | Potential abuse | Add gateway filter or API key throttling |
| No audit logging | Limited traceability | Introduce Spring AOP for mutation logs |

## 8. Decommission Plan (Legacy)
- Backend/ legacy folder -> verify unused then remove
- Duplicate markdown docs -> mark deprecated then prune
- Batch scripts -> replace with unified `start_all.ps1` and `start_all.bat`

## 9. Next Improvements
- Add Redis or Caffeine for server-side caching of genres & popular stories
- Add pagination & filters to story list API
- Add CI pipeline (build, lint, vulnerability scan)
- Introduce integration tests hitting running containers (Testcontainers)

## 10. Acceptance
All items above must be checked and documented in release notes prior to production deployment.
