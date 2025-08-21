# SolDuel Platform - API Documentation

## Table of Contents
1. [Smart Contract API](#smart-contract-api)
2. [Frontend Client API](#frontend-client-api)
3. [React Hooks API](#react-hooks-api)
4. [Utility Functions](#utility-functions)
5. [Type Definitions](#type-definitions)

---

## Smart Contract API

### Program ID
```
32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb
```

### Instructions

#### `create_match`
Creates a new Rock Paper Scissors match.

**Parameters:**
```rust
pub struct CreateMatch {
    pub bet_amount: u64,           // Bet amount in lamports
    pub commitment: [u8; 32],       // SHA256 hash of choice + salt
    pub join_deadline: i64,         // Unix timestamp for join deadline
    pub reveal_deadline: i64,       // Unix timestamp for reveal deadline
    pub token_mint: Option<Pubkey>, // Optional SPL token mint
}
```

**Accounts:**
- `creator` - Match creator (signer, mutable)
- `match_pda` - Match account PDA (mutable)
- `vault` - Escrow vault PDA (mutable)
- `system_program` - System program

**Returns:** Transaction signature

---

#### `join_match`
Join an existing match as opponent.

**Parameters:**
```rust
pub struct JoinMatch {
    pub commitment: [u8; 32], // SHA256 hash of choice + salt
}
```

**Accounts:**
- `opponent` - Player joining the match (signer, mutable)
- `match_pda` - Match account PDA (mutable)
- `vault` - Escrow vault PDA (mutable)
- `system_program` - System program

**Returns:** Transaction signature

---

#### `reveal`
Reveal player's choice after both players have joined.

**Parameters:**
```rust
pub struct Reveal {
    pub choice: Choice,  // Rock, Paper, or Scissors
    pub salt: String,    // Salt used in commitment
}
```

**Accounts:**
- `player` - Player revealing choice (signer)
- `match_pda` - Match account PDA (mutable)

**Returns:** Transaction signature

---

#### `settle`
Settle the match and distribute winnings.

**Accounts:**
- `settler` - Account settling the match (signer)
- `match_pda` - Match account PDA (mutable)
- `vault` - Escrow vault PDA (mutable)
- `creator` - Match creator (mutable)
- `opponent` - Match opponent (mutable)
- `fee_recipient` - Platform fee recipient (mutable)
- `system_program` - System program

**Returns:** Transaction signature

---

#### `cancel_match`
Cancel an unfinished match.

**Accounts:**
- `creator` - Match creator (signer, mutable)
- `match_pda` - Match account PDA (mutable)
- `vault` - Escrow vault PDA (mutable)
- `system_program` - System program

**Returns:** Transaction signature

---

#### `timeout_match`
Handle timeout scenarios for abandoned matches.

**Accounts:**
- `caller` - Account calling timeout (signer)
- `match_pda` - Match account PDA (mutable)
- `vault` - Escrow vault PDA (mutable)
- `creator` - Match creator (mutable)
- `opponent` - Match opponent (mutable)
- `system_program` - System program

**Returns:** Transaction signature

---

## Frontend Client API

### RPSClient Class

#### Constructor
```typescript
constructor(
  connection: Connection,
  wallet: WalletContextState,
  programId?: PublicKey
)
```

#### Methods

##### `createMatch`
```typescript
async createMatch(params: {
  betAmount: number;
  choice: Choice;
  joinDeadline?: number;
  revealDeadline?: number;
  tokenMint?: PublicKey;
}): Promise<string>
```

**Returns:** Transaction signature

---

##### `joinMatch`
```typescript
async joinMatch(params: {
  matchPubkey: PublicKey;
  choice: Choice;
}): Promise<string>
```

**Returns:** Transaction signature

---

##### `revealChoice`
```typescript
async revealChoice(params: {
  matchPubkey: PublicKey;
  choice: Choice;
  salt: string;
}): Promise<string>
```

**Returns:** Transaction signature

---

##### `settleMatch`
```typescript
async settleMatch(
  matchPubkey: PublicKey
): Promise<string>
```

**Returns:** Transaction signature

---

##### `getMatch`
```typescript
async getMatch(
  matchPubkey: PublicKey
): Promise<MatchAccount>
```

**Returns:** Match account data

---

##### `getAllMatches`
```typescript
async getAllMatches(
  filters?: MatchFilters
): Promise<MatchAccount[]>
```

**Returns:** Array of match accounts

---

##### `getPlayerMatches`
```typescript
async getPlayerMatches(
  playerPubkey: PublicKey
): Promise<MatchAccount[]>
```

**Returns:** Array of matches for a specific player

---

## React Hooks API

### `useRPSGame`

Primary hook for managing RPS game state.

```typescript
const {
  // State
  matches,
  activeMatch,
  isLoading,
  error,
  
  // Actions
  createMatch,
  joinMatch,
  revealChoice,
  settleMatch,
  cancelMatch,
  refreshMatches,
  
  // Utilities
  getMatchStatus,
  canJoinMatch,
  canReveal,
  canSettle,
} = useRPSGame();
```

#### State Properties

- **`matches`**: `MatchAccount[]` - All available matches
- **`activeMatch`**: `MatchAccount | null` - Currently active match
- **`isLoading`**: `boolean` - Loading state
- **`error`**: `string | null` - Error message

#### Action Methods

- **`createMatch`**: Create new match
- **`joinMatch`**: Join existing match
- **`revealChoice`**: Reveal player choice
- **`settleMatch`**: Settle completed match
- **`cancelMatch`**: Cancel unfinished match
- **`refreshMatches`**: Refresh match list

#### Utility Methods

- **`getMatchStatus`**: Get formatted match status
- **`canJoinMatch`**: Check if player can join
- **`canReveal`**: Check if player can reveal
- **`canSettle`**: Check if match can be settled

---

### `useWalletBalance`

Hook for managing wallet balance.

```typescript
const {
  balance,
  isLoading,
  refresh,
  hasEnoughBalance,
} = useWalletBalance();
```

---

### `useToast`

Hook for displaying notifications.

```typescript
const {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = useToast();
```

---

## Utility Functions

### Game Logic

#### `generateCommitment`
```typescript
function generateCommitment(
  choice: Choice,
  salt: string,
  playerPubkey: PublicKey
): Uint8Array
```

Generates SHA256 commitment hash.

---

#### `verifyCommitment`
```typescript
function verifyCommitment(
  commitment: Uint8Array,
  choice: Choice,
  salt: string,
  playerPubkey: PublicKey
): boolean
```

Verifies a commitment against revealed values.

---

#### `determineWinner`
```typescript
function determineWinner(
  choice1: Choice,
  choice2: Choice
): 'player1' | 'player2' | 'tie'
```

Determines match winner based on choices.

---

#### `calculatePayout`
```typescript
function calculatePayout(
  betAmount: number,
  feeBps: number
): {
  winnerPayout: number;
  platformFee: number;
}
```

Calculates payout amounts including fees.

---

### Formatting

#### `formatSOL`
```typescript
function formatSOL(
  lamports: number | BN
): string
```

Formats lamports to SOL display.

---

#### `formatAddress`
```typescript
function formatAddress(
  address: PublicKey | string,
  length?: number
): string
```

Truncates address for display.

---

#### `formatTimestamp`
```typescript
function formatTimestamp(
  timestamp: number
): string
```

Formats Unix timestamp to readable date.

---

## Type Definitions

### Core Types

```typescript
// Choice enum
enum Choice {
  Rock = 0,
  Paper = 1,
  Scissors = 2,
}

// Match status
enum MatchStatus {
  WaitingForOpponent = 0,
  WaitingForReveal = 1,
  ReadyToSettle = 2,
  Settled = 3,
  Cancelled = 4,
  TimedOut = 5,
}

// Match account structure
interface MatchAccount {
  publicKey: PublicKey;
  creator: PublicKey;
  opponent: PublicKey | null;
  betAmount: BN;
  tokenMint: PublicKey | null;
  commitmentCreator: Uint8Array;
  commitmentOpponent: Uint8Array | null;
  revealedCreator: Choice | null;
  revealedOpponent: Choice | null;
  joinDeadline: BN;
  revealDeadline: BN;
  status: MatchStatus;
  feeBps: number;
  winner: PublicKey | null;
  createdAt: BN;
  settledAt: BN | null;
}

// Match filters
interface MatchFilters {
  status?: MatchStatus;
  creator?: PublicKey;
  opponent?: PublicKey;
  minBet?: number;
  maxBet?: number;
  tokenMint?: PublicKey;
}

// Transaction result
interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

// Player statistics
interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  totalBet: number;
  totalWon: number;
  winRate: number;
}
```

### Component Props

```typescript
// Match card props
interface MatchCardProps {
  match: MatchAccount;
  onJoin?: (match: MatchAccount) => void;
  onReveal?: (match: MatchAccount) => void;
  onSettle?: (match: MatchAccount) => void;
  onCancel?: (match: MatchAccount) => void;
}

// Game interface props
interface GameInterfaceProps {
  match: MatchAccount;
  onChoiceSelect: (choice: Choice) => void;
  onReveal: () => void;
  disabled?: boolean;
}

// Create match modal props
interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: CreateMatchParams) => void;
  minBet?: number;
  maxBet?: number;
}
```

### Event Types

```typescript
// Match created event
interface MatchCreatedEvent {
  match: PublicKey;
  creator: PublicKey;
  betAmount: BN;
  timestamp: BN;
}

// Match joined event
interface MatchJoinedEvent {
  match: PublicKey;
  opponent: PublicKey;
  timestamp: BN;
}

// Match settled event
interface MatchSettledEvent {
  match: PublicKey;
  winner: PublicKey | null;
  payout: BN;
  fee: BN;
  timestamp: BN;
}
```

## Error Codes

### Smart Contract Errors

| Code | Name | Description |
|------|------|-------------|
| 6000 | `InvalidChoice` | Invalid choice value (not 0, 1, or 2) |
| 6001 | `MatchAlreadyJoined` | Match already has an opponent |
| 6002 | `JoinDeadlinePassed` | Join deadline has passed |
| 6003 | `RevealDeadlinePassed` | Reveal deadline has passed |
| 6004 | `NotYourTurn` | Not the player's turn to act |
| 6005 | `InvalidCommitment` | Commitment doesn't match revealed values |
| 6006 | `MatchNotReady` | Match not in correct state for action |
| 6007 | `InsufficientFunds` | Insufficient balance for bet |
| 6008 | `Unauthorized` | Unauthorized action |

### Client Errors

| Code | Name | Description |
|------|------|-------------|
| 1000 | `WalletNotConnected` | Wallet not connected |
| 1001 | `TransactionFailed` | Transaction failed to confirm |
| 1002 | `NetworkError` | Network connection error |
| 1003 | `InvalidParameters` | Invalid method parameters |
| 1004 | `AccountNotFound` | Account doesn't exist |

---

## Examples

### Creating a Match
```typescript
import { useRPSGame } from '@/hooks/useRPSGame';
import { Choice } from '@/types';

const MyComponent = () => {
  const { createMatch } = useRPSGame();
  
  const handleCreate = async () => {
    try {
      const signature = await createMatch({
        betAmount: 1.0, // 1 SOL
        choice: Choice.Rock,
        joinDeadline: 300, // 5 minutes
        revealDeadline: 600, // 10 minutes
      });
      console.log('Match created:', signature);
    } catch (error) {
      console.error('Failed to create match:', error);
    }
  };
  
  return <button onClick={handleCreate}>Create Match</button>;
};
```

### Joining a Match
```typescript
const handleJoin = async (matchPubkey: PublicKey) => {
  try {
    const signature = await joinMatch({
      matchPubkey,
      choice: Choice.Paper,
    });
    console.log('Joined match:', signature);
  } catch (error) {
    console.error('Failed to join match:', error);
  }
};
```

### Listening for Events
```typescript
useEffect(() => {
  const connection = new Connection(RPC_ENDPOINT);
  const programId = new PublicKey(PROGRAM_ID);
  
  const subscriptionId = connection.onProgramAccountChange(
    programId,
    (accountInfo) => {
      // Handle account changes
      console.log('Account updated:', accountInfo);
    },
    'confirmed'
  );
  
  return () => {
    connection.removeProgramAccountChangeListener(subscriptionId);
  };
}, []);
```

---

*Last Updated: January 2025*
*Version: 1.0.0*