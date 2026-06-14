import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import BalanceDisplay from './components/BalanceDisplay';
import SendPayment from './components/SendPayment';
import './App.css';

function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="header">
        <h1>Stellar dApp</h1>
        <p className="subtitle">Stellar Testnet · White Belt</p>
      </header>

      <main className="main">
        <WalletConnector
          isConnected={!!publicKey}
          publicKey={publicKey}
          onConnect={setPublicKey}
          onDisconnect={() => setPublicKey(null)}
        />

        <BalanceDisplay publicKey={publicKey} />
        <SendPayment publicKey={publicKey} />
      </main>
    </div>
  );
}

export default App;
