# Development Setup Guide

## Overview

This SaaS starter project is built with Next.js 15, TypeScript, Supabase, and enterprise-grade security features.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd application
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run type-check` - TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
application/
├── app/              # Next.js app directory
├── components/       # Reusable UI components
├── lib/             # Utility functions and configurations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Helper utilities
├── __tests__/       # Test files
└── public/          # Static assets
```

## Technology Stack

### Core
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety with strict mode
- **Tailwind CSS v4** - Utility-first CSS framework

### Backend & Auth
- **Supabase** - Database, authentication, and real-time features
- **Upstash Redis** - Rate limiting and caching

### Testing & Quality
- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing
- **Prettier** - Code formatting
- **ESLint** - Code linting

### Security Features
- Device fingerprinting and confidence scoring
- NIST AAL compliance (AAL1/AAL2)
- Rate limiting with Redis
- CSRF protection
- Row Level Security (RLS) policies
- 2FA with TOTP and backup codes

## Development Guidelines

### Code Style
- Use Prettier for consistent formatting
- Follow TypeScript strict mode
- Use semantic variable and function names
- Write tests for new features

### Security Standards
- All database tables must have RLS enabled
- Validate all user inputs with Zod
- Never bypass security measures
- Follow NIST AAL specifications exactly

### Git Workflow
- Create feature branches from `main`
- Use conventional commit messages
- Run tests before committing
- Ensure TypeScript compilation passes

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

## Next Steps

1. Configure Supabase project (INFRA-002)
2. Set up Upstash Redis (INFRA-003) 
3. Create database schemas (DB-001)
4. Implement Row Level Security (DB-002)
5. Configure Supabase Auth (AUTH-001)

For detailed implementation guide, see the project documentation in `/docs`.
