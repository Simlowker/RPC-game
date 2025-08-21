import { PublicKey } from "@solana/web3.js";

export interface TestMatchData {
  id: string;
  description: string;
  creatorChoice: number;
  opponentChoice: number;
  expectedWinner: 'creator' | 'opponent' | 'tie';
  betAmount: number;
  feeBps: number;
}

export interface TestScenario {
  name: string;
  description: string;
  matches: TestMatchData[];
  expectedOutcome: string;
}

// Comprehensive test match data for all game combinations
export const GameCombinations: TestMatchData[] = [
  // Creator wins scenarios
  {
    id: "creator_wins_1",
    description: "Rock beats Scissors",
    creatorChoice: 0, // Rock
    opponentChoice: 2, // Scissors
    expectedWinner: 'creator',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "creator_wins_2", 
    description: "Paper beats Rock",
    creatorChoice: 1, // Paper
    opponentChoice: 0, // Rock
    expectedWinner: 'creator',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "creator_wins_3",
    description: "Scissors beats Paper", 
    creatorChoice: 2, // Scissors
    opponentChoice: 1, // Paper
    expectedWinner: 'creator',
    betAmount: 0.1,
    feeBps: 250
  },

  // Opponent wins scenarios
  {
    id: "opponent_wins_1",
    description: "Scissors beats Rock",
    creatorChoice: 2, // Scissors
    opponentChoice: 0, // Rock
    expectedWinner: 'opponent',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "opponent_wins_2",
    description: "Rock beats Paper",
    creatorChoice: 0, // Rock
    opponentChoice: 1, // Paper
    expectedWinner: 'opponent',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "opponent_wins_3",
    description: "Paper beats Scissors",
    creatorChoice: 1, // Paper
    opponentChoice: 2, // Scissors
    expectedWinner: 'opponent',
    betAmount: 0.1,
    feeBps: 250
  },

  // Tie scenarios
  {
    id: "tie_1",
    description: "Rock vs Rock",
    creatorChoice: 0, // Rock
    opponentChoice: 0, // Rock
    expectedWinner: 'tie',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "tie_2",
    description: "Paper vs Paper",
    creatorChoice: 1, // Paper
    opponentChoice: 1, // Paper
    expectedWinner: 'tie',
    betAmount: 0.1,
    feeBps: 250
  },
  {
    id: "tie_3",
    description: "Scissors vs Scissors",
    creatorChoice: 2, // Scissors
    opponentChoice: 2, // Scissors
    expectedWinner: 'tie',
    betAmount: 0.1,
    feeBps: 250
  }
];

// Edge case test scenarios
export const EdgeCaseScenarios: TestMatchData[] = [
  {
    id: "high_stakes",
    description: "High stakes match",
    creatorChoice: 0,
    opponentChoice: 2,
    expectedWinner: 'creator',
    betAmount: 10.0, // 10 SOL
    feeBps: 1000 // 10% max fee
  },
  {
    id: "micro_bet",
    description: "Minimum bet amount",
    creatorChoice: 1,
    opponentChoice: 0,
    expectedWinner: 'creator',
    betAmount: 0.001, // Minimal bet
    feeBps: 100 // 1% fee
  },
  {
    id: "zero_fee",
    description: "No fee match",
    creatorChoice: 2,
    opponentChoice: 1,
    expectedWinner: 'creator',
    betAmount: 0.5,
    feeBps: 0 // No fee
  }
];

// Security test scenarios
export const SecurityTestScenarios: TestScenario[] = [
  {
    name: "commitment_integrity",
    description: "Test commitment hash integrity and prevent tampering",
    matches: [
      {
        id: "integrity_test_1",
        description: "Valid commitment verification",
        creatorChoice: 0,
        opponentChoice: 1,
        expectedWinner: 'opponent',
        betAmount: 0.1,
        feeBps: 250
      }
    ],
    expectedOutcome: "All commitment verifications should pass"
  },
  {
    name: "access_control",
    description: "Test access control and authorization",
    matches: [
      {
        id: "access_test_1", 
        description: "Unauthorized operations should fail",
        creatorChoice: 1,
        opponentChoice: 2,
        expectedWinner: 'opponent',
        betAmount: 0.1,
        feeBps: 250
      }
    ],
    expectedOutcome: "Unauthorized operations should be rejected"
  }
];

// Performance test scenarios
export const PerformanceTestScenarios: TestScenario[] = [
  {
    name: "concurrent_matches",
    description: "Multiple simultaneous matches",
    matches: Array.from({ length: 20 }, (_, i) => ({
      id: `concurrent_${i}`,
      description: `Concurrent match ${i}`,
      creatorChoice: i % 3,
      opponentChoice: (i + 1) % 3,
      expectedWinner: ((i % 3) === 0 && ((i + 1) % 3) === 2) || 
                      ((i % 3) === 1 && ((i + 1) % 3) === 0) ||
                      ((i % 3) === 2 && ((i + 1) % 3) === 1) ? 'creator' : 
                     ((i % 3) === ((i + 1) % 3)) ? 'tie' : 'opponent',
      betAmount: 0.1,
      feeBps: 250
    })),
    expectedOutcome: "All matches should complete successfully"
  },
  {
    name: "rapid_sequence",
    description: "Rapid sequential matches from same players", 
    matches: Array.from({ length: 10 }, (_, i) => ({
      id: `rapid_${i}`,
      description: `Rapid match ${i}`,
      creatorChoice: i % 3,
      opponentChoice: (i + 2) % 3,
      expectedWinner: ((i % 3) === 0 && ((i + 2) % 3) === 2) ||
                      ((i % 3) === 1 && ((i + 2) % 3) === 0) ||
                      ((i % 3) === 2 && ((i + 2) % 3) === 1) ? 'creator' : 'opponent',
      betAmount: 0.05,
      feeBps: 200
    })),
    expectedOutcome: "Sequential matches should maintain performance"
  }
];

// User journey test scenarios
export const UserJourneyScenarios: TestScenario[] = [
  {
    name: "patient_player",
    description: "Patient player waits for opponent and completes game",
    matches: [
      {
        id: "patient_game",
        description: "Normal paced game completion",
        creatorChoice: 0,
        opponentChoice: 2,
        expectedWinner: 'creator',
        betAmount: 0.1,
        feeBps: 250
      }
    ],
    expectedOutcome: "Game should complete normally with proper payouts"
  },
  {
    name: "impatient_player",
    description: "Player creates match but cancels when no opponent joins",
    matches: [
      {
        id: "cancelled_game",
        description: "Match creation followed by cancellation",
        creatorChoice: 1,
        opponentChoice: -1, // No opponent
        expectedWinner: 'creator', // Gets refund
        betAmount: 0.2,
        feeBps: 300
      }
    ],
    expectedOutcome: "Player should get refund upon cancellation"
  },
  {
    name: "tournament_series",
    description: "Multiple games between same players simulating tournament",
    matches: [
      {
        id: "tournament_1",
        description: "Tournament game 1",
        creatorChoice: 0,
        opponentChoice: 2, 
        expectedWinner: 'creator',
        betAmount: 0.5,
        feeBps: 500
      },
      {
        id: "tournament_2",
        description: "Tournament game 2",
        creatorChoice: 1,
        opponentChoice: 0,
        expectedWinner: 'creator',
        betAmount: 0.5,
        feeBps: 500
      },
      {
        id: "tournament_3",
        description: "Tournament game 3 - finals",
        creatorChoice: 2,
        opponentChoice: 1,
        expectedWinner: 'creator',
        betAmount: 1.0,
        feeBps: 250
      }
    ],
    expectedOutcome: "Tournament should progress through all rounds successfully"
  }
];

// Network condition test data
export const NetworkConditionTests = {
  latencyTests: [
    { delay: 0, description: "No latency" },
    { delay: 100, description: "Low latency (100ms)" },
    { delay: 500, description: "Medium latency (500ms)" },
    { delay: 1000, description: "High latency (1s)" },
    { delay: 2000, description: "Very high latency (2s)" }
  ],
  
  congestionTests: [
    { load: 1, description: "Light load" },
    { load: 5, description: "Medium load" },
    { load: 10, description: "Heavy load" },
    { load: 20, description: "Extreme load" }
  ]
};

// Error condition test data
export const ErrorConditions = {
  insufficientFunds: {
    description: "User attempts operation without sufficient funds",
    betAmount: 100, // More than typical test account funding
    expectedError: "insufficient"
  },
  
  invalidParameters: [
    {
      description: "Zero bet amount",
      betAmount: 0,
      expectedError: "InvalidBetAmount"
    },
    {
      description: "Excessive fee rate",
      feeBps: 10001, // > 100%
      expectedError: "InvalidFeeRate"
    },
    {
      description: "Past deadline",
      joinDeadline: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      expectedError: "InvalidDeadline"
    }
  ],

  stateViolations: [
    {
      description: "Reveal before opponent joins",
      operation: "reveal",
      state: "waitingForOpponent",
      expectedError: "InvalidMatchStatus"
    },
    {
      description: "Settle before reveals complete",
      operation: "settle", 
      state: "waitingForReveal",
      expectedError: "InvalidMatchStatus"
    },
    {
      description: "Join already joined match",
      operation: "join",
      state: "waitingForReveal", 
      expectedError: "InvalidMatchStatus"
    }
  ]
};

// Gas and compute unit expectations
export const ComputeExpectations = {
  operations: {
    createMatch: {
      maxComputeUnits: 80000,
      averageComputeUnits: 50000,
      description: "Match creation with escrow setup"
    },
    joinMatch: {
      maxComputeUnits: 60000,
      averageComputeUnits: 40000,
      description: "Opponent joining existing match"
    },
    reveal: {
      maxComputeUnits: 50000,
      averageComputeUnits: 30000,
      description: "Choice reveal with hash verification"
    },
    settle: {
      maxComputeUnits: 100000,
      averageComputeUnits: 70000, 
      description: "Match settlement with payouts"
    },
    cancel: {
      maxComputeUnits: 40000,
      averageComputeUnits: 25000,
      description: "Match cancellation with refund"
    },
    timeout: {
      maxComputeUnits: 80000,
      averageComputeUnits: 50000,
      description: "Timeout handling with appropriate payouts"
    }
  },
  
  totalGameFlow: {
    maxComputeUnits: 300000,
    averageComputeUnits: 220000,
    description: "Complete game from creation to settlement"
  }
};

export default {
  GameCombinations,
  EdgeCaseScenarios,
  SecurityTestScenarios,
  PerformanceTestScenarios,
  UserJourneyScenarios,
  NetworkConditionTests,
  ErrorConditions,
  ComputeExpectations
};