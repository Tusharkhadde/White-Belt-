# Stellar Time Capsule ⏳

A beautiful Stellar testnet dApp that lets you send XLM sealed in time — locked until a future date you choose.

**Live Demo:** [stellar-topaz.vercel.app](https://stellar-topaz.vercel.app)  
**GitHub:** [github.com/Tusharkhadde/White-Belt-](https://github.com/Tusharkhadde/White-Belt-)

## Features

| Requirement | Implementation |
|-------------|---------------|
| Wallet Connect/Disconnect | Freighter wallet via `@stellar/freighter-api` |
| Balance Display | XLM balance fetched from Horizon testnet |
| Send XLM Transaction | Payment with memo (your secret message) |
| Transaction Feedback | Success/failure status + transaction hash |
| Time Capsule UI | Dark theme, countdown timers, glassmorphism cards |

## How It Works

1. Connect your Freighter wallet (set to **Testnet**)
2. Enter recipient address, amount, unlock date, and a secret message
3. Click **"Seal Time Capsule"** — sends XLM with your message as a memo
4. Watch the countdown tick down until your capsule unlocks

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Freighter Wallet](https://freighter.app) browser extension (set to **Testnet**)
- Testnet XLM — get free XLM via [Friendbot](https://friendbot.stellar.org?addr=G...)

## Setup (Run Locally)

```bash
git clone https://github.com/Tusharkhadde/White-Belt-.git
cd White-Belt-
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

## Screenshots

![Connected wallet](screenshots/screenshot-1.png)
![Balance after funding](screenshots/screenshot-2.png)
![Creating a capsule](screenshots/screenshot-3.png)
![Transaction result](screenshots/screenshot-4.png)

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Button, Card, Input, Badge, Separator)
- [GSAP](https://gsap.com) — Entrance animations
- [@stellar/stellar-sdk](https://github.com/stellar/js-stellar-sdk) — Horizon API
- [@stellar/freighter-api](https://github.com/stellar/freighter) — Wallet integration

## Project Structure

```
src/
├── App.tsx                      # Main app — layout + state
├── index.css                    # Tailwind + shadcn theme (dark)
├── main.tsx                     # Entry point
├── lib/
│   └── utils.ts                 # cn() utility
├── components/
│   ├── ui/                      # shadcn UI components
│   ├── Starfield.tsx            # Animated star background
│   ├── WalletConnector.tsx      # Freighter connect/disconnect
│   ├── CreateCapsule.tsx        # Time capsule creation form
│   └── CapsuleList.tsx          # Capsule list with countdowns
└── utils/
    └── stellar.ts               # Stellar SDK + Freighter helpers
```
