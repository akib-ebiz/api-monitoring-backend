# API Monitoring Backend - Interview Preparation Guide

This guide contains common interview questions and answers about the API Monitoring Backend project.

---

## Project Overview

**What is this project?**
This is a full-stack API Monitoring Dashboard built with NestJS backend and React frontend. It monitors the health and performance of external APIs by:
- Automatically checking APIs every minute using cron jobs
- Tracking response times and status codes
- Logging success/failure history
- Providing a real-time dashboard view

---

## Architecture & Design

### Q: What is the overall architecture of this project?
**A:** 
- **Backend:** NestJS with MongoDB for data persistence
- **Frontend:** React with Axios for API calls
- **Database:** MongoDB Atlas (cloud MongoDB)
- **Deployment:** Render (backend) and Vercel (frontend)
- **Monitoring:** Cron jobs using @nestjs/schedule

### Q: Why did you choose NestJS over Express?
**A:**
- **TypeScript support:** Built-in TypeScript with decorators
- **Modular architecture:** Easy to organize code into modules
- **Dependency injection:** Built-in DI container for better testability
- **CLI tools:** Powerful CLI for generating modules, services, controllers
- **Enterprise-ready:** Follows SOLID principles and best practices
- **Swagger integration:** Easy API documentation

### Q: Why MongoDB instead of SQL?
**A:**
- **Flexible schema:** Easy to add/modify fields without migrations
- **Document-based:** Natural fit for API logs with varying structures
- **Scalability:** Good for time-series data (logs)
- **Cloud hosting:** MongoDB Atlas free tier available
- **JSON native:** Stores data in JSON-like format, matches API responses

---

## Technical Implementation

### Q: How does the cron job monitoring work?
**A:**
- Uses `@nestjs/schedule` with `@Cron('*/1 * * * *')` decorator
- Runs every minute to check all active APIs
- For each API:
  1. Makes HTTP request using Axios
  2. Measures response time
  3. Determines status (success/fail based on HTTP status code)
  4. Logs result to MongoDB
- Uses `validateStatus: () => true` to not throw on error status codes

### Q: How do you handle API timeouts?
**A:**
- Set `timeout: 30000` (30 seconds) in Axios config
- If timeout occurs, error is caught and logged as failure
- Response time is still measured and recorded

### Q: Explain the database schema design.
**A:**
Two main collections:

**API Collection:**
- `url`: The API endpoint to monitor
- `name`: Human-readable name
- `interval`: Check frequency (in minutes)
- `isActive`: Boolean to enable/disable monitoring
- `timestamps`: Auto-generated createdAt/updatedAt

**Log Collection:**
- `apiId`: Reference to API being monitored
- `status`: 'success' or 'fail'
- `responseTime`: Milliseconds
- `statusCode`: HTTP status code
- `errorMessage`: Error details (if failed)
- `timestamp`: When the check occurred

### Q: How do you implement health checks?
**A:**
Two endpoints:

**`GET /health`** (Liveness):
- Returns app status, environment, version, uptime
- Fast check - no database queries
- Used by load balancers to verify app is running

**`GET /ready`** (Readiness):
- Checks MongoDB connection status
- Returns database health
- Used to determine if app can handle traffic
- Returns 503 if database is down

### Q: Why use Swagger?
**A:**
- **Auto-documentation:** Generates API docs from code
- **Interactive UI:** Test endpoints directly from browser
- **Client generation:** Can generate client SDKs
- **Standard:** Follows OpenAPI specification
- **Team collaboration:** Easy for frontend/backend teams to agree on API contracts

---

## NestJS Specific

### Q: What are NestJS modules and why use them?
**A:**
- Modules organize application into cohesive blocks
- Each feature has its own module (ApiModule, LogModule, etc.)
- Enable dependency injection between modules
- Provide encapsulation - control what's exported
- Follow Single Responsibility Principle

### Q: Explain Dependency Injection in NestJS.
**A:**
- Services are marked with `@Injectable()` decorator
- Injected into controllers/modules via constructor
- NestJS DI container manages lifecycle
- Benefits:
  - Easier testing (can mock dependencies)
  - Loose coupling
  - Single instances (singleton pattern)
  - Cleaner code

### Q: What is the difference between `@Controller` and `@Service`?
**A:**
**Controller:**
- Handles HTTP requests/responses
- Contains route handlers
- Validates input
- Delegates business logic to services

**Service:**
- Contains business logic
- Data access/manipulation
- Reusable across controllers
- No HTTP concerns

### Q: How does Mongoose work with NestJS?
**A:**
- `@nestjs/mongoose` provides integration
- Schemas defined using TypeScript decorators (`@Prop`, `@Schema`)
- `MongooseModule.forRoot()` connects to database
- `MongooseModule.forFeature()` registers schemas
- `@InjectModel()` injects models into services
- Provides type-safe database operations

---

## Error Handling

### Q: How do you handle API failures?
**A:**
- Axios `validateStatus: () => true` prevents throwing on error codes
- Try-catch blocks in monitor service
- Log failures with error message
- Continue monitoring other APIs even if one fails
- User can manually retry via `/monitor/check/:apiId`

### Q: What if MongoDB connection fails?
**A:**
- Mongoose auto-retries connection
- Health check `/ready` returns 503 with database: DOWN
- Logs show connection errors
- App continues running but can't persist data
- Need to check MongoDB Atlas IP whitelist

### Q: How do you handle heap out of memory errors?
**A:**
- Use `npm run start:prod` (compiled code) instead of `nest start`
- Production mode uses `node dist/main` - memory efficient
- Development mode uses JIT compilation - more memory
- On Render, set start command to `npm run start:prod`

---

## Deployment

### Q: How did you deploy to Render?
**A:**
1. Created `render.yaml` with build/start commands
2. Pushed code to GitHub
3. Connected GitHub repo to Render
4. Set environment variables (MONGODB_URI, NODE_ENV, PORT, APP_VERSION)
5. Set health check path to `/health`
6. Whitelisted Render IP in MongoDB Atlas
7. Deployed

### Q: Why use render.yaml?
**A:**
- Infrastructure as code approach
- Version-controlled deployment config
- Consistent deployments
- Defines build/start commands
- Sets environment variables
- Can be reused across environments

### Q: What environment variables are needed?
**A:**
- `MONGODB_URI`: Database connection string
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (3001 local, 10000 on Render)
- `APP_VERSION`: Version number for health checks

### Q: How do you handle CORS?
**A:**
- `app.enableCors()` in main.ts
- Allows frontend to call backend
- In production, would restrict to specific origins
- Important for cross-origin requests

---

## Performance & Scalability

### Q: How does this scale?
**A:**
- **Database:** MongoDB Atlas scales horizontally
- **App:** Can run multiple instances behind load balancer
- **Cron jobs:** Would need distributed scheduler (Redis) for multiple instances
- **Logs:** Consider log rotation/archival (MongoDB TTL indexes)
- **Caching:** Could add Redis for caching API responses

### Q: How do you optimize performance?
**A:**
- Use compiled code in production (`start:prod`)
- Limit log queries (`.limit(100)` for recent logs)
- Index on `apiId` and `timestamp` for faster queries
- Connection pooling in Mongoose
- Async/await for non-blocking operations

### Q: What about log retention?
**A:**
- Currently keeps all logs (not ideal for production)
- Could implement:
  - MongoDB TTL indexes to auto-delete old logs
  - Archive logs to cheaper storage (S3)
  - Aggregate logs (daily summaries)
  - User-configurable retention period

---

## Security

### Q: How do you secure the API?
**A:**
- Would add authentication (JWT, OAuth)
- Add rate limiting
- Input validation (class-validator)
- Sanitize MongoDB queries (Mongoose provides protection)
- HTTPS only in production
- Environment variables for secrets
- CORS restrictions

### Q: How do you protect MongoDB credentials?
**A:**
- Store in environment variables (`.env`)
- `.env` in `.gitignore` (never committed)
- Use Render environment variables in production
- URL-encode special characters in password
- Use strong passwords
- IP whitelist in MongoDB Atlas

---

## Testing

### Q: How would you test this?
**A:**
**Unit Tests:**
- Test services with mocked dependencies
- Test business logic in isolation
- Use Jest (built into NestJS)

**Integration Tests:**
- Test API endpoints with test database
- Test cron job scheduling
- Test MongoDB operations

**E2E Tests:**
- Test full monitoring flow
- Use test APIs (mock servers)
- Verify logging

### Q: How to mock external APIs?
**A:**
- Use Nock or Axios mock adapter
- Return predefined responses
- Test success/failure scenarios
- Test timeout handling

---

## Challenges & Solutions

### Q: What was the biggest challenge?
**A:**
**Render deployment memory issue:**
- **Problem:** Heap out of memory with `nest start`
- **Solution:** Use `npm run start:prod` for compiled code
- **Learning:** Development tools use more memory

**MongoDB connection:**
- **Problem:** IP not whitelisted
- **Solution:** Allow all IPs (`0.0.0.0/0`) in Atlas
- **Learning:** Cloud databases need IP whitelisting

### Q: What would you improve?
**A:**
- Add authentication/authorization
- Implement log retention policies
- Add alerting (email/SMS on failures)
- Real-time WebSocket updates for dashboard
- Add API response time graphs
- Support different check intervals per API
- Add user accounts and multi-tenancy
- Add API authentication (API keys)
- Implement retry logic for failed checks

---

## Behavioral Questions

### Q: Tell me about a technical challenge you faced.
**A:** During deployment to Render, the app kept crashing with "heap out of memory". I researched and found that `nest start` is for development and uses JIT compilation which is memory-intensive. The solution was to use `npm run start:prod` which runs pre-compiled code. This taught me the importance of using production-optimized commands in cloud deployments.

### Q: How do you stay updated with new technologies?
**A:**
- Follow tech blogs and newsletters
- Participate in developer communities
- Read documentation for new libraries
- Build side projects
- Attend meetups and conferences
- Follow GitHub repositories of projects I use

### Q: How do you handle tight deadlines?
**A:**
- Prioritize features (MVP first)
- Break down tasks into smaller chunks
- Focus on core functionality first
- Use established libraries instead of building from scratch
- Communicate early if deadlines are unrealistic
- Document trade-offs made

---

## Quick Reference

**Key Technologies:**
- NestJS - Backend framework
- MongoDB - Database
- Mongoose - ODM
- Axios - HTTP client
- @nestjs/schedule - Cron jobs
- @nestjs/swagger - API docs
- Render - Backend deployment
- Vercel - Frontend deployment

**Key Commands:**
```bash
npm run start:dev    # Development
npm run build        # Build
npm run start:prod   # Production
nest g module <name> # Generate module
nest g service <name> # Generate service
nest g controller <name> # Generate controller
```

**Key Files:**
- `src/main.ts` - Entry point
- `src/app.module.ts` - Root module
- `src/api/` - API management
- `src/log/` - Log storage
- `src/monitor/` - Cron job monitoring
- `src/health/` - Health checks
