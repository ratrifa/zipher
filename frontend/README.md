# Zipher Frontend

This is the frontend for Zipher, built with Next.js 16 and React 19.

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4, Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Hooks & Context API
- **HTTP Client**: Axios

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components (including Shadcn UI).
- `hooks/`: Custom React hooks.
- `lib/`: Utility functions, API clients, and crypto logic.
- `public/`: Static assets.

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.
- `npm run typecheck`: Run TypeScript type check.
