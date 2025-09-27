# Carnival Search Server

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**

    Create a `.env` file in the root directory from the example template:

    ```bash
    cp .env.example .env
    ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build

npm start
```

## Project Structure

```
src/
├── controllers/     # Request handlers
├── db/             # Database schema and migrations
├── jobs/           # Background jobs (not used currently)
├── lib/            # Authentication library
├── middlewares/    # Express middlewares
├── providers/      # Configuration and service providers
├── routes/         # API route definitions
├── services/       # Business logic
│   └── connectors/ # Integration services
└── types.ts        # TypeScript type definitions
```