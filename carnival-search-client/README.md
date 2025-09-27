# Carnival Search Client

## Setup Instructions

### 1. Install dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the root directory from the example template:

```bash
cp .env.example .env
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure

- `/src/app` - Next.js 13+ app router pages and API routes
- `/src/components` - React components including UI components and connectors
- `/src/contexts` - React context providers
- `/src/utils` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/public` - Static assets including app logos and images

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm start` - Start the production server