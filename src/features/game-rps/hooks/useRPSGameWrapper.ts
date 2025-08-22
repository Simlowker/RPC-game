// Wrapper hook that switches between mock and real implementation
import { useRPSGame as useRPSGameMock } from './useRPSGame';
import { useRPSGameReal } from './useRPSGameReal';
import { RPS_CONFIG } from '../../../config/rps-config';

export const useRPSGame = () => {
  // Use configuration to determine which implementation to use
  if (RPS_CONFIG.USE_REAL_IMPLEMENTATION) {
    console.log('Using REAL RPS implementation - On-chain transactions enabled');
    return useRPSGameReal();
  } else {
    console.log('Using MOCK RPS implementation - For UI testing only');
    return useRPSGameMock();
  }
};

// Export for debugging
export { useRPSGameMock, useRPSGameReal };