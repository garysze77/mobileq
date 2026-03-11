# MobileQ 卦號

Phone Number Fortune System - Frontend

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
/app
  /page.tsx          - Main page
  /layout.tsx        - Layout
  /globals.css       - Styles
/components
  /Header.tsx        - Header
  /PhoneForm.tsx     - Phone input form
  /LifePath.tsx     - Life path display
  /Hexagram.tsx     - Hexagram display
/lib
  /api.ts            - API functions
```

## Deploy

Push to Vercel
