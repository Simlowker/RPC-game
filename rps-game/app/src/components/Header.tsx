import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import SoundControls from './SoundControls';

const Header: React.FC = () => {
  const { publicKey } = useWallet();

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">🗿📄✂️ RPS PvP</h1>
            {publicKey && (
              <div className="text-sm text-gray-300">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <SoundControls 
              compact={true} 
              showAdvanced={publicKey ? true : false}
              className="hidden sm:flex"
            />
            <WalletMultiButton className="!bg-primary-600 hover:!bg-primary-700" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;