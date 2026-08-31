# SINOVA AI

SINOVA is a Next.js app with the original static branded homepage preserved and a Prisma-backed SQLite authentication system.

The existing branded homepage is served unchanged from `public/index.html`, with its assets in `public/app.js`, `public/styles.css`, and `public/favicon.svg`. The Next.js root page redirects to `/index.html` so the static SINOVA homepage remains the primary experience.

Authentication is implemented from scratch with:

- Prisma ORM
- SQLite database at `prisma/dev.db`
- `User` and `Session` models
- bcrypt password hashing
- httpOnly cookie-backed sessions

Routes:

- `/signup`
- `/login`
- `/dashboard`
- `/logout`
- `/forgot-password`

## Setup

```bash
pnpm install
node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma
node node_modules/prisma/build/index.js migrate dev --schema prisma/schema.prisma
pnpm dev
```

The app uses `DATABASE_URL="file:./dev.db"` from `.env`.

Useful checks:

```bash
node node_modules/eslint/bin/eslint.js app lib eslint.config.mjs next.config.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```
