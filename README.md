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

Connected wallet

<img width="1919" height="962" alt="image" src="https://github.com/user-attachments/assets/60d4b28e-fde1-47aa-af2e-0d6ffec508a9" />

Balance after funding  

<img width="1917" height="999" alt="image" src="https://github.com/user-attachments/assets/1cccd2e6-11f4-469c-b6b1-db4ac2a0fdb6" />

Creating a capsule  

<img width="1051" height="807" alt="image" src="https://github.com/user-attachments/assets/deeca322-9076-423b-a868-7730c0d34246" />

Transaction result 

<img width="1919" height="914" alt="image" src="https://github.com/user-attachments/assets/b2662b88-7cc0-4253-8450-99cff37deedf" />


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
