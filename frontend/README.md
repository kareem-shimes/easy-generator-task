# Frontend - EasyGenerator Authentication App

This is a [Next.js](https://nextjs.org) frontend application for the EasyGenerator authentication system, built with TypeScript, TailwindCSS, and shadcn/ui components.

## 🚀 Quick Start

### Using Docker (Recommended)

The easiest way to run the entire application (frontend, backend, and database) is using Docker Compose from the project root:

```bash
# Navigate to project root
cd ..

# Start all services
docker-compose up -d

# Frontend will be available at http://localhost:3001
```

See the [Root README](../README.md) for comprehensive setup instructions.

### Local Development (Without Docker)

If you prefer to run the frontend locally:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_API_URL to your backend URL

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) (or the next available port).

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **Icons**: Lucide React

## 🐳 Docker

The frontend includes a `Dockerfile.dev` for development with hot-reload support.

**Note**: Docker Compose configuration is managed at the project root level.

```bash
# From project root
docker-compose up -d frontend
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [TailwindCSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 📖 Full Documentation

For complete setup instructions, architecture details, and API documentation, see the [Root README](../README.md).
