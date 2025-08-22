import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UniversalPvp } from "../target/types/universal_pvp";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

describe("Universal PvP - Interactive Testing", () => {
    // Configure the client to use devnet
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.UniversalPvp as Program<UniversalPvp>;
    
    // PDAs
    const [gameRegistryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("game_registry")],
        program.programId
    );

    console.log("🎮 Universal PvP Testing Suite");
    console.log("================================");
    console.log(`Program ID: ${program.programId.toBase58()}`);
    console.log(`Registry PDA: ${gameRegistryPDA.toBase58()}`);
    console.log("");

    it("Initialize Game Registry", async () => {
        try {
            console.log("📝 Initializing game registry...");
            
            const tx = await program.methods
                .initializeRegistry()
                .accounts({
                    gameRegistry: gameRegistryPDA,
                    authority: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            
            console.log("✅ Registry initialized!");
            console.log(`   Transaction: ${tx}`);
            console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            
            // Fetch and display registry data
            const registry = await program.account.gameRegistry.fetch(gameRegistryPDA);
            console.log("\n📊 Registry Status:");
            console.log(`   Authority: ${registry.authority.toBase58()}`);
            console.log(`   Total Games: ${registry.totalGames}`);
            console.log(`   Paused: ${registry.paused}`);
            
        } catch (error) {
            if (error.toString().includes("already in use")) {
                console.log("ℹ️  Registry already initialized, fetching current state...");
                
                const registry = await program.account.gameRegistry.fetch(gameRegistryPDA);
                console.log("\n📊 Current Registry Status:");
                console.log(`   Authority: ${registry.authority.toBase58()}`);
                console.log(`   Total Games: ${registry.totalGames}`);
                console.log(`   Active Games: ${registry.activeGames.length}`);
                console.log(`   Paused: ${registry.paused}`);
            } else {
                console.error("❌ Error:", error);
                throw error;
            }
        }
    });

    it("Register Rock-Paper-Scissors Game", async () => {
        try {
            console.log("\n🎯 Registering Rock-Paper-Scissors...");
            
            const tx = await program.methods
                .registerGame(
                    { rockPaperScissors: {} }, // GameType enum
                    "Rock Paper Scissors"
                )
                .accounts({
                    gameRegistry: gameRegistryPDA,
                    authority: provider.wallet.publicKey,
                })
                .rpc();
            
            console.log("✅ RPS Game registered!");
            console.log(`   Transaction: ${tx}`);
            console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            
        } catch (error) {
            if (error.toString().includes("GameAlreadyRegistered")) {
                console.log("ℹ️  RPS already registered");
            } else {
                console.error("❌ Error:", error);
            }
        }
    });

    it("Register Dice Game", async () => {
        try {
            console.log("\n🎲 Registering Dice Game...");
            
            const tx = await program.methods
                .registerGame(
                    { dice: {} }, // GameType enum
                    "Dice Game"
                )
                .accounts({
                    gameRegistry: gameRegistryPDA,
                    authority: provider.wallet.publicKey,
                })
                .rpc();
            
            console.log("✅ Dice Game registered!");
            console.log(`   Transaction: ${tx}`);
            console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            
        } catch (error) {
            if (error.toString().includes("GameAlreadyRegistered")) {
                console.log("ℹ️  Dice already registered");
            } else {
                console.error("❌ Error:", error);
            }
        }
    });

    it("Create a Test Match (Rock-Paper-Scissors)", async () => {
        try {
            console.log("\n🎮 Creating a new RPS match...");
            
            const matchId = Keypair.generate();
            const betAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL); // 0.1 SOL
            
            const [matchPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("match"), matchId.publicKey.toBuffer()],
                program.programId
            );
            
            const tx = await program.methods
                .createMatch(
                    { rockPaperScissors: {} }, // GameType
                    betAmount,
                    5, // Best of 5 rounds
                    null // No token mint (using SOL)
                )
                .accounts({
                    match: matchPDA,
                    matchId: matchId.publicKey,
                    gameRegistry: gameRegistryPDA,
                    player1: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([matchId])
                .rpc();
            
            console.log("✅ Match created successfully!");
            console.log(`   Match ID: ${matchId.publicKey.toBase58()}`);
            console.log(`   Match PDA: ${matchPDA.toBase58()}`);
            console.log(`   Bet Amount: 0.1 SOL`);
            console.log(`   Rounds: Best of 5`);
            console.log(`   Transaction: ${tx}`);
            console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            
            // Fetch match data
            const matchData = await program.account.universalMatch.fetch(matchPDA);
            console.log("\n📊 Match Details:");
            console.log(`   Player 1: ${matchData.player1.toBase58()}`);
            console.log(`   Status: Waiting for Player 2`);
            console.log(`   Game Type: Rock-Paper-Scissors`);
            
            console.log("\n💡 To join this match, another player needs to call 'joinMatch' with:");
            console.log(`   - Match ID: ${matchId.publicKey.toBase58()}`);
            console.log(`   - Bet Amount: 0.1 SOL`);
            
        } catch (error) {
            console.error("❌ Error creating match:", error);
        }
    });

    it("Display Registry Summary", async () => {
        console.log("\n📈 Final Registry Summary");
        console.log("==========================");
        
        try {
            const registry = await program.account.gameRegistry.fetch(gameRegistryPDA);
            
            console.log(`Total Games Registered: ${registry.totalGames}`);
            console.log(`Active Games: ${registry.activeGames.length}`);
            
            if (registry.activeGames.length > 0) {
                console.log("\nRegistered Game Types:");
                registry.activeGames.forEach((game, index) => {
                    console.log(`  ${index + 1}. ${game.name}`);
                    console.log(`     - Status: ${game.active ? "Active" : "Inactive"}`);
                    console.log(`     - Total Matches: ${game.totalMatches}`);
                });
            }
            
        } catch (error) {
            console.error("❌ Error fetching registry:", error);
        }
    });
});