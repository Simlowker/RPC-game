# Smart Contract Development Prompt for RPC-Game

## 🎯 Context Setup for New Conversation

Copy and paste this entire prompt into a new Claude conversation:

---

# Solana Smart Contract Development - RPC Game

## Project Context
I'm working on a Rock-Paper-Scissors PvP game smart contract on Solana using Anchor framework. The project is located at `/Users/simeonfluck/teste 3/platform/rps-game/`.

## Current State
- **Framework**: Anchor 0.31.1
- **Language**: Rust
- **Network**: Solana
- **Contract Location**: `rps-game/programs/rps/src/lib.rs`
- **Tests**: `rps-game/tests/rps.ts`
- **GitHub**: https://github.com/Simlowker/RPC-game

## Development Requirements

### Core Features Needed:
1. **Match Creation & Management**
   - Create matches with betting amounts
   - Join existing matches
   - Handle match timeouts and cancellations

2. **Game Mechanics**
   - Commit-reveal pattern for fair play
   - Hash commitments to hide choices
   - Reveal phase with verification
   - Automatic winner determination

3. **Token Integration**
   - SPL token betting support
   - Escrow management for bets
   - Automatic payout to winner
   - Fee collection mechanism (optional)

4. **Security Features**
   - Prevent double-spending
   - Timeout mechanisms
   - Slashing for non-reveal
   - Anti-cheating measures

5. **State Management**
   - Match states (Created, Joined, Revealed, Completed, Cancelled)
   - Player statistics tracking
   - Leaderboard support

## Technical Specifications

### Program Structure:
```rust
// Account structures needed:
- Match account (PDA)
- Player stats account (PDA)
- Escrow account for tokens
- Program config account

// Instructions needed:
- initialize_program
- create_match
- join_match
- commit_choice
- reveal_choice
- claim_winnings
- cancel_match
- emergency_withdraw
```

### Testing Requirements:
- Unit tests for each instruction
- Integration tests for full game flow
- Edge case testing (timeouts, cancellations)
- Security testing (double-spend, replay attacks)

## MCP Agent Configuration

Please use these specific agents for the development:

### Primary Agents:
```javascript
// Initialize swarm for smart contract development
mcp__claude-flow__swarm_init({ 
  topology: "hierarchical", 
  maxAgents: 8,
  strategy: "parallel"
})

// Spawn specialized agents
mcp__claude-flow__agent_spawn({ type: "architect" })     // Contract architecture
mcp__claude-flow__agent_spawn({ type: "coder" })         // Rust implementation
mcp__claude-flow__agent_spawn({ type: "security" })      // Security auditing
mcp__claude-flow__agent_spawn({ type: "tester" })        // Test creation
mcp__claude-flow__agent_spawn({ type: "reviewer" })      // Code review
```

### Task Orchestration:
```javascript
mcp__claude-flow__task_orchestrate({
  task: "Develop and test Solana RPS smart contract",
  strategy: "sequential",
  priority: "high"
})
```

## Development Workflow

### Phase 1: Architecture & Design
- Review existing contract code
- Design improved architecture
- Create state diagrams
- Define security model

### Phase 2: Implementation
- Implement core game logic
- Add commit-reveal mechanism
- Integrate token handling
- Implement timeout logic

### Phase 3: Testing
- Write comprehensive tests
- Perform security audit
- Test edge cases
- Benchmark performance

### Phase 4: Optimization
- Optimize for compute units
- Reduce account sizes
- Improve error handling
- Add logging/events

## Specific Tasks

1. **Analyze Current Contract**
   - Review `rps-game/programs/rps/src/lib.rs`
   - Identify improvements needed
   - Check security vulnerabilities

2. **Implement Commit-Reveal**
   - Design hash commitment scheme
   - Implement commit instruction
   - Implement reveal instruction
   - Add verification logic

3. **Token Integration**
   - Setup SPL token accounts
   - Implement escrow logic
   - Add payout mechanism
   - Handle fee distribution

4. **Write Tests**
   - Setup test environment
   - Write happy path tests
   - Add edge case tests
   - Create integration tests

## Commands to Use

```bash
# Navigate to project
cd /Users/simeonfluck/teste 3/platform/rps-game

# Build contract
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Generate IDL
anchor idl init -f target/idl/rps.json
```

## Success Criteria
- [ ] Contract compiles without errors
- [ ] All tests pass (>90% coverage)
- [ ] Security audit completed
- [ ] Gas optimization done
- [ ] Documentation complete
- [ ] Deployed to devnet
- [ ] Frontend integration working

## Additional Context
- Use SPARC methodology for development
- Follow Anchor best practices
- Implement proper error handling
- Add comprehensive comments
- Create deployment documentation

Please start by analyzing the current smart contract and creating an improvement plan using the appropriate agents.

---

## 📋 Additional Notes for the Conversation

When you start the new conversation with this prompt, Claude will:

1. **Initialize the correct swarm topology** for smart contract development
2. **Spawn specialized agents** for Rust/Solana development
3. **Use SPARC methodology** for systematic development
4. **Focus specifically** on the smart contract without UI distractions
5. **Leverage security-focused agents** for audit and review

## 🚀 Quick Start Commands

After pasting the prompt, you can immediately ask:

- "Analyze the current smart contract and identify improvements"
- "Implement the commit-reveal mechanism"
- "Write comprehensive tests for the contract"
- "Optimize the contract for lower compute units"
- "Perform a security audit"

## 🔧 Recommended Agent Configuration

The prompt will automatically configure:
- **Architect Agent**: For contract design and architecture
- **Coder Agent**: For Rust implementation
- **Security Agent**: For vulnerability analysis
- **Tester Agent**: For test creation
- **Reviewer Agent**: For code quality

This setup ensures focused, efficient smart contract development with proper security considerations.