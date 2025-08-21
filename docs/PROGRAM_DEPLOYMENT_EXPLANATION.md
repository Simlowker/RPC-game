# Understanding Solana Program Deployment & Costs

## 📦 What is a Solana Program?

A **Solana Program** (also called a "Smart Contract" on other blockchains) is compiled code that runs on the Solana blockchain. Think of it as:

- **Backend server** that runs on thousands of computers simultaneously
- **Business logic** that executes game rules trustlessly
- **Automated referee** that handles money and ensures fair play
- **Immutable code** that players can verify and trust

## 💰 Program Deployment Costs Breakdown

### What You're Actually Paying For:

#### 1. **Storage Rent (~1.3-1.5 SOL)**
- **What**: Space on the blockchain to store your program code
- **Size**: Your RPS program is ~500KB compiled
- **Formula**: `Rent = Program_Size × Rent_Rate × 2_Years`
- **Note**: Solana requires 2 years of "rent" upfront to keep data on-chain

#### 2. **Transaction Fees (~0.01 SOL)**
- **What**: Network processing fees for deployment transaction
- **Why**: Pays validators for processing and confirming your deployment

#### 3. **Account Creation (~0.002 SOL)**
- **What**: Creating the program account and program data account
- **Why**: Every piece of data on Solana needs an account

### Total Cost Breakdown:
```
Program Storage Rent:    1.3-1.5 SOL
Transaction Fees:        0.01 SOL
Account Creation:        0.002 SOL
Safety Buffer:          0.2 SOL
─────────────────────────────────
TOTAL:                  ~1.5-2 SOL
```

## 🎮 Your RPS Program Functions

Looking at your current program (`rps-game/programs/rps/src/lib.rs`), it handles:

### Core Game Functions:
1. **`create_match`** - Player 1 creates a game with bet amount
2. **`join_match`** - Player 2 joins and matches the bet
3. **`reveal_choice`** - Players reveal their moves (Rock/Paper/Scissors)
4. **`claim_reward`** - Winner claims the pot
5. **`cancel_match`** - Cancel if no opponent joins
6. **`claim_timeout`** - Claim win if opponent doesn't reveal

### Key Features:
- **Betting System**: Supports SOL or SPL tokens
- **Commitment Scheme**: Hides moves until both players commit
- **Fee System**: Platform can take 0-5% fee
- **Timeout Protection**: Auto-win if opponent abandons
- **Vault System**: Holds funds securely during game

## 🔄 Can This Program Handle Multiple Game Types?

### Current Design: **RPS-Specific**

Your current program is specifically designed for Rock-Paper-Scissors:

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Choice {
    Rock,
    Paper,
    Scissors,
}
```

### Options for Multiple PvP Games:

#### Option 1: **Single Universal Program** (Recommended)
Create one flexible program that handles multiple game types:

```rust
pub enum GameType {
    RockPaperScissors,
    CoinFlip,
    DiceRoll,
    NumberGuess,
    // Add more games
}

pub enum GameMove {
    RPS(Choice),
    CoinFlip(Side),
    DiceRoll(u8),
    NumberGuess(u32),
}
```

**Advantages:**
- Deploy once, pay once (~1.5 SOL total)
- Shared liquidity and player base
- Easier updates and maintenance
- Lower operational costs

**Disadvantages:**
- More complex code
- All games affected if bug found
- Larger program size

#### Option 2: **Separate Program Per Game**
Deploy individual programs for each game:

**Advantages:**
- Simple, focused code
- Isolated risk (bug in one doesn't affect others)
- Can optimize each game specifically
- Different fee structures per game

**Disadvantages:**
- Pay deployment cost for EACH game (1.5 SOL × N games)
- Separate liquidity pools
- More maintenance overhead
- Multiple programs to audit

#### Option 3: **Modular Architecture** (Advanced)
Use Solana's Cross-Program Invocation (CPI):

```
Main Router Program (1.5 SOL)
    ├── RPS Module (0.5 SOL)
    ├── Coin Flip Module (0.5 SOL)
    └── Dice Module (0.5 SOL)
```

## 💡 Recommendation for SolDuel Platform

For your SolDuel platform, I recommend:

### Phase 1: Current Approach ✅
- Deploy current RPS-specific program
- Test and validate the game mechanics
- Build player base and liquidity

### Phase 2: Expand Strategically
```rust
// Modify your program to support multiple games
pub struct Match {
    pub game_type: GameType,
    pub game_state: GameState,
    // ... rest of match data
}

pub enum GameType {
    RockPaperScissors,
    CoinFlip,
    HighCard,
    // Future games
}
```

### Phase 3: Cost Analysis
| Approach | Initial Cost | Per Game Cost | Total for 5 Games |
|----------|-------------|---------------|-------------------|
| Separate Programs | 1.5 SOL | 1.5 SOL | 7.5 SOL |
| Universal Program | 2 SOL | 0 SOL | 2 SOL |
| Modular System | 2 SOL | 0.5 SOL | 4 SOL |

## 🏗️ Program Architecture for Multiple Games

Here's how to modify your current program for multiple games:

```rust
// Enhanced program structure
#[program]
pub mod solduel_games {
    pub fn create_match(
        ctx: Context<CreateMatch>,
        game_type: GameType,
        bet_amount: u64,
        game_params: GameParams,
    ) -> Result<()> {
        match game_type {
            GameType::RPS => create_rps_match(ctx, bet_amount, game_params),
            GameType::CoinFlip => create_coin_flip(ctx, bet_amount, game_params),
            GameType::DiceRoll => create_dice_game(ctx, bet_amount, game_params),
        }
    }
}
```

## 📊 Deployment Cost Comparison

### Single RPS Deployment (Current)
- **One-time cost**: 1.5 SOL
- **Supports**: Rock-Paper-Scissors only
- **Future games**: Need new deployment

### Multi-Game Platform (Recommended)
- **One-time cost**: 2 SOL (slightly larger program)
- **Supports**: Unlimited game types
- **Future games**: Just add game logic, no redeployment

### Example Multi-Game Program Size:
```
RPS Logic:          50 KB
Coin Flip Logic:    20 KB
Dice Logic:         30 KB
High Card Logic:    40 KB
Shared Infrastructure: 100 KB
─────────────────────────
Total:              240 KB → ~1.8 SOL rent
```

## 🚀 Migration Path

If you want to support multiple games in the future:

1. **Option A**: Deploy RPS now, create new universal program later
   - Cost: 1.5 SOL now + 2 SOL later = 3.5 SOL total
   - Benefit: Start earning revenue immediately

2. **Option B**: Modify current program before deployment
   - Cost: 2 SOL once
   - Benefit: Never need to migrate

3. **Option C**: Use upgradeable programs
   - Cost: 1.5 SOL + 0.1 SOL per upgrade
   - Benefit: Can evolve over time
   - Risk: Upgrade authority security

## 🔐 Security Considerations

### Program Deployment Security:
1. **Immutable by default**: Once deployed, can't be changed (unless upgradeable)
2. **Upgrade Authority**: If upgradeable, secure with multisig
3. **Audit before mainnet**: Get security review for production
4. **Open source**: Players can verify the code

## 💭 Summary

**What you're paying for**: Blockchain storage space for your game's code (like renting a server that runs forever)

**What the program does**: Manages all Rock-Paper-Scissors games - creating matches, handling bets, determining winners, and distributing prizes

**Cost efficiency**: 
- Single program for all RPS games: ✅ Deployed once
- Different PvP games: ❓ Depends on architecture choice
- Recommendation: Start with RPS, plan for universal game program later

**The 1.5 SOL deployment** buys you:
- Permanent hosting on Solana blockchain
- Thousands of validators running your code
- Trustless game execution
- No monthly server costs
- Immutable, verifiable game rules

Your current RPS program is well-designed for its specific purpose. For multiple game types, you'll need to either:
1. Modify it to be more generic (recommended)
2. Deploy separate programs (expensive)
3. Build a modular system (complex but flexible)