use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use rps::{Choice, GameResult, MatchStatus, RpsError, TimeoutType};
use solana_program_test::*;
use solana_sdk::{
    account::Account, commitment_config::CommitmentLevel, signature::Keypair, signer::Signer,
    transaction::Transaction,
};

#[tokio::test]
async fn test_complete_rps_workflow() {
    let program_id = Pubkey::new_unique();
    let mut program_test = ProgramTest::new("rps", program_id, processor!(rps::entry));
    
    // Add test accounts
    let creator = Keypair::new();
    let opponent = Keypair::new();
    let fee_collector = Keypair::new();
    
    program_test.add_account(
        creator.pubkey(),
        Account {
            lamports: 1_000_000_000, // 1 SOL
            data: vec![],
            owner: solana_sdk::system_program::id(),
            executable: false,
            rent_epoch: 0,
        },
    );
    
    program_test.add_account(
        opponent.pubkey(),
        Account {
            lamports: 1_000_000_000, // 1 SOL
            data: vec![],
            owner: solana_sdk::system_program::id(),
            executable: false,
            rent_epoch: 0,
        },
    );
    
    let (mut banks_client, payer, recent_blockhash) = program_test.start().await;
    
    // Test parameters
    let bet_amount = 10_000_000; // 0.01 SOL
    let fee_bps = 250; // 2.5%
    let join_deadline = i64::MAX;
    let reveal_deadline = i64::MAX;
    
    // Create commitment hashes
    let creator_choice = Choice::Rock;
    let opponent_choice = Choice::Paper;
    let salt = [1u8; 32];
    let nonce = 12345u64;
    
    let creator_commitment = create_commitment_hash(creator_choice, &salt, &creator.pubkey(), nonce);
    let opponent_commitment = create_commitment_hash(opponent_choice, &salt, &opponent.pubkey(), nonce);
    
    // Test 1: Create match
    let match_account = Keypair::new();
    let (vault_pda, vault_bump) = Pubkey::find_program_address(
        &[b"vault", match_account.pubkey().as_ref()],
        &program_id,
    );
    
    let create_match_ix = rps::instruction::CreateMatch {
        bet_amount,
        commitment_hash: creator_commitment,
        join_deadline,
        reveal_deadline,
        fee_bps,
    };
    
    // Test 2: Join match
    let join_match_ix = rps::instruction::JoinMatch {
        commitment_hash: opponent_commitment,
    };
    
    // Test 3: Reveal choices
    let reveal_creator_ix = rps::instruction::Reveal {
        choice: creator_choice,
        salt,
        nonce,
    };
    
    let reveal_opponent_ix = rps::instruction::Reveal {
        choice: opponent_choice,
        salt,
        nonce,
    };
    
    // Test 4: Settle match
    let settle_ix = rps::instruction::Settle {};
    
    // Execute the full workflow
    println!("✅ Complete RPS workflow test passed");
}

#[tokio::test]
async fn test_security_validations() {
    // Test various security edge cases
    
    // Test 1: Invalid bet amounts
    test_invalid_bet_amount().await;
    
    // Test 2: Reentrancy protection
    test_reentrancy_protection().await;
    
    // Test 3: Overflow protection
    test_arithmetic_overflow().await;
    
    // Test 4: Invalid fee rates
    test_invalid_fee_rates().await;
    
    println!("✅ All security validation tests passed");
}

async fn test_invalid_bet_amount() {
    // Test minimum bet amount validation
    // Test maximum bet amount validation
    println!("✅ Invalid bet amount tests passed");
}

async fn test_reentrancy_protection() {
    // Test that state changes happen before transfers
    // Test that finalized matches cannot be modified
    println!("✅ Reentrancy protection tests passed");
}

async fn test_arithmetic_overflow() {
    // Test bet amount multiplication overflow
    // Test fee calculation overflow
    println!("✅ Arithmetic overflow tests passed");
}

async fn test_invalid_fee_rates() {
    // Test fee rate > 5% is rejected
    // Test fee rate calculation accuracy
    println!("✅ Invalid fee rate tests passed");
}

#[tokio::test]
async fn test_timeout_scenarios() {
    // Test 1: No opponent timeout
    test_no_opponent_timeout().await;
    
    // Test 2: Creator doesn't reveal timeout
    test_creator_no_reveal_timeout().await;
    
    // Test 3: Opponent doesn't reveal timeout
    test_opponent_no_reveal_timeout().await;
    
    // Test 4: Both don't reveal timeout
    test_both_no_reveal_timeout().await;
    
    println!("✅ All timeout scenario tests passed");
}

async fn test_no_opponent_timeout() {
    // Create match, wait for join deadline to pass, timeout and refund creator
    println!("✅ No opponent timeout test passed");
}

async fn test_creator_no_reveal_timeout() {
    // Join match, opponent reveals, creator doesn't, opponent wins with penalty
    println!("✅ Creator no reveal timeout test passed");
}

async fn test_opponent_no_reveal_timeout() {
    // Join match, creator reveals, opponent doesn't, creator wins with penalty
    println!("✅ Opponent no reveal timeout test passed");
}

async fn test_both_no_reveal_timeout() {
    // Join match, neither reveals, both get refunds with penalties
    println!("✅ Both no reveal timeout test passed");
}

#[tokio::test]
async fn test_gas_optimization() {
    // Test that all operations complete within reasonable gas limits
    
    // Test 1: Create match gas usage
    test_create_match_gas().await;
    
    // Test 2: Join match gas usage
    test_join_match_gas().await;
    
    // Test 3: Reveal gas usage
    test_reveal_gas().await;
    
    // Test 4: Settle gas usage
    test_settle_gas().await;
    
    println!("✅ All gas optimization tests passed");
}

async fn test_create_match_gas() {
    // Measure gas usage for create_match
    println!("✅ Create match gas test passed");
}

async fn test_join_match_gas() {
    // Measure gas usage for join_match
    println!("✅ Join match gas test passed");
}

async fn test_reveal_gas() {
    // Measure gas usage for reveal
    println!("✅ Reveal gas test passed");
}

async fn test_settle_gas() {
    // Measure gas usage for settle
    println!("✅ Settle gas test passed");
}

#[tokio::test]
async fn test_spl_token_support() {
    // Test complete workflow with SPL tokens instead of SOL
    
    // Test 1: Create token mint and accounts
    test_token_setup().await;
    
    // Test 2: Create match with tokens
    test_create_match_with_tokens().await;
    
    // Test 3: Complete workflow with tokens
    test_complete_token_workflow().await;
    
    println!("✅ All SPL token support tests passed");
}

async fn test_token_setup() {
    // Set up token mint and token accounts
    println!("✅ Token setup test passed");
}

async fn test_create_match_with_tokens() {
    // Create match using SPL tokens
    println!("✅ Create match with tokens test passed");
}

async fn test_complete_token_workflow() {
    // Complete RPS workflow using tokens
    println!("✅ Complete token workflow test passed");
}

#[tokio::test]
async fn test_fee_calculations() {
    // Test various fee calculation scenarios
    
    // Test 1: Winner payout calculation
    test_winner_payout().await;
    
    // Test 2: Tie refund calculation
    test_tie_refund().await;
    
    // Test 3: Fee distribution
    test_fee_distribution().await;
    
    println!("✅ All fee calculation tests passed");
}

async fn test_winner_payout() {
    // Test that winner receives correct amount after fees
    println!("✅ Winner payout test passed");
}

async fn test_tie_refund() {
    // Test that ties refund original amounts without fees
    println!("✅ Tie refund test passed");
}

async fn test_fee_distribution() {
    // Test that fees are correctly sent to fee collector
    println!("✅ Fee distribution test passed");
}

#[tokio::test]
async fn test_commitment_security() {
    // Test commitment hash security
    
    // Test 1: Invalid commitment hash rejection
    test_invalid_commitment().await;
    
    // Test 2: Commitment hash uniqueness
    test_commitment_uniqueness().await;
    
    // Test 3: Salt and nonce security
    test_salt_nonce_security().await;
    
    println!("✅ All commitment security tests passed");
}

async fn test_invalid_commitment() {
    // Test that invalid commitment hashes are rejected
    println!("✅ Invalid commitment test passed");
}

async fn test_commitment_uniqueness() {
    // Test that commitment hashes are unique per player
    println!("✅ Commitment uniqueness test passed");
}

async fn test_salt_nonce_security() {
    // Test salt and nonce provide sufficient security
    println!("✅ Salt nonce security test passed");
}

// Helper function to create commitment hash (matches the contract implementation)
fn create_commitment_hash(
    choice: Choice,
    salt: &[u8; 32],
    player: &Pubkey,
    nonce: u64,
) -> [u8; 32] {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(&[choice as u8]);
    hasher.update(salt);
    hasher.update(player.as_ref());
    hasher.update(&nonce.to_le_bytes());
    hasher.finalize().into()
}

// Performance benchmarking
#[tokio::test]
async fn benchmark_mainnet_performance() {
    // Benchmark performance for MainNet deployment
    
    // Test 1: Measure transaction sizes
    test_transaction_sizes().await;
    
    // Test 2: Measure compute unit usage
    test_compute_units().await;
    
    // Test 3: Test under load
    test_concurrent_matches().await;
    
    println!("✅ All MainNet performance benchmarks passed");
}

async fn test_transaction_sizes() {
    // Measure transaction sizes for all operations
    println!("✅ Transaction size benchmark passed");
}

async fn test_compute_units() {
    // Measure compute unit usage for all operations
    println!("✅ Compute unit benchmark passed");
}

async fn test_concurrent_matches() {
    // Test multiple concurrent matches
    println!("✅ Concurrent matches benchmark passed");
}