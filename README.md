# API Monitoring Backend

NestJS backend for API Monitoring Dashboard with MongoDB, cron jobs, and real-time monitoring.

## Features

- **REST API**: CRUD operations for API endpoints and logs
- **Cron Jobs**: Automatic health checks every minute using `@nestjs/schedule`
- **MongoDB**: Data persistence with Mongoose ODM
- **Response Time Tracking**: Measure API latency with Axios
- **Status Logging**: Store success/fail status with timestamps

## Project Structure

```
src/
├── api/              # API entity management
│   ├── api.schema.ts
│   ├── api.service.ts
│   ├── api.controller.ts
│   └── api.module.ts
├── log/              # Log storage and retrieval
│   ├── log.schema.ts
│   ├── log.service.ts
│   ├── log.controller.ts
│   └── log.module.ts
├── monitor/          # Cron job monitoring service
│   ├── monitor.service.ts
│   ├── monitor.controller.ts
│   └── monitor.module.ts
├── app.module.ts     # Root module
└── main.ts           # Entry point
```

## Database Collections

### APIs
```json
{
  "url": "https://api.example.com",
  "name": "Production API",
  "interval": 1,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Logs
```json
{
  "apiId": "ObjectId",
  "status": "success" | "fail",
  "responseTime": 120,
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb+srv://your_connection_string
PORT=3001
NODE_ENV=production
```

## Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api` | Add new API to monitor |
| GET | `/api` | List all APIs |
| GET | `/api/:id` | Get single API |
| DELETE | `/api/:id` | Remove API |
| GET | `/logs` | Get all logs |
| GET | `/logs/api/:apiId` | Get logs for specific API |
| POST | `/monitor/check/:apiId` | Manual check now |

## Deployment (Render)

1. Create new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run start:prod`
5. Add environment variables:
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `NODE_ENV=production`

## Technologies Used

- **NestJS** - Backend framework
- **Mongoose** - MongoDB ODM
- **Axios** - HTTP client for API checks
- **@nestjs/schedule** - Cron job scheduler
