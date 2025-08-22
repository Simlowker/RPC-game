#!/usr/bin/env ts-node
/**
 * Script pour initialiser le registre Universal PvP sur Devnet
 * 
 * Utilisation:
 *   npx ts-node scripts/initialize-registry.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection, Keypair } from "@solana/web3.js";
import fs from 'fs';
import os from 'os';

// Configuration
const PROGRAM_ID = new PublicKey("4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR");
const DEVNET_URL = "https://api.devnet.solana.com";

// IDL du programme (simplifié pour ce script)
const IDL = {
  "version": "1.0.0",
  "name": "universal_pvp",
  "instructions": [
    {
      "name": "initializeRegistry",
      "accounts": [
        { "name": "gameRegistry", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "registerGame",
      "accounts": [
        { "name": "gameRegistry", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": false, "isSigner": true }
      ],
      "args": [
        { "name": "gameType", "type": { "defined": "GameType" } },
        { "name": "name", "type": "string" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "GameRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "totalGames", "type": "u32" },
          { "name": "activeGames", "type": { "vec": { "defined": "GameDefinition" } } },
          { "name": "paused", "type": "bool" }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameType",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "RockPaperScissors" },
          { "name": "Dice" },
          { "name": "CoinFlip" },
          { "name": "HighCard" },
          { "name": "Custom", "fields": ["u64"] }
        ]
      }
    },
    {
      "name": "GameDefinition",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "gameType", "type": { "defined": "GameType" } },
          { "name": "name", "type": "string" },
          { "name": "active", "type": "bool" },
          { "name": "totalMatches", "type": "u64" },
          { "name": "createdAt", "type": "i64" }
        ]
      }
    }
  ]
};

async function main() {
  console.log("🎮 Universal PvP - Registry Initialization");
  console.log("==========================================\n");

  try {
    // 1. Connexion à Devnet
    console.log("📡 Connecting to Devnet...");
    const connection = new Connection(DEVNET_URL, "confirmed");
    
    // 2. Charger le wallet
    const walletPath = process.env.WALLET_PATH || `${os.homedir()}/.config/solana/devnet-keypair.json`;
    console.log(`📂 Loading wallet from: ${walletPath}`);
    
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet file not found at ${walletPath}`);
    }
    
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    );
    
    const wallet = new Wallet(walletKeypair);
    console.log(`✅ Wallet loaded: ${wallet.publicKey.toBase58()}`);
    
    // 3. Vérifier le solde
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.01 * anchor.web3.LAMPORTS_PER_SOL) {
      console.log("⚠️  Low balance! Getting airdrop...");
      const airdropSig = await connection.requestAirdrop(
        wallet.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig);
      console.log("✅ Airdrop received!");
    }
    
    // 4. Créer le provider
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed"
    });
    
    // 5. Créer le programme
    const program = new Program(IDL as any, PROGRAM_ID, provider);
    
    // 6. Calculer le PDA du registre
    const [gameRegistryPDA, registryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_registry")],
      PROGRAM_ID
    );
    
    console.log(`\n📍 Registry PDA: ${gameRegistryPDA.toBase58()}`);
    console.log(`   Bump: ${registryBump}`);
    
    // 7. Vérifier si le registre existe déjà
    console.log("\n🔍 Checking if registry already exists...");
    const registryAccount = await connection.getAccountInfo(gameRegistryPDA);
    
    if (registryAccount) {
      console.log("ℹ️  Registry already initialized!");
      
      // Essayer de récupérer les données (si possible)
      try {
        const registryData = await program.account.gameRegistry.fetch(gameRegistryPDA);
        console.log("\n📊 Current Registry Status:");
        console.log(`   Authority: ${registryData.authority.toBase58()}`);
        console.log(`   Total Games: ${registryData.totalGames}`);
        console.log(`   Active Games: ${registryData.activeGames.length}`);
        console.log(`   Paused: ${registryData.paused}`);
        
        if (registryData.activeGames.length > 0) {
          console.log("\n🎮 Registered Games:");
          registryData.activeGames.forEach((game: any, index: number) => {
            console.log(`   ${index + 1}. ${game.name}`);
          });
        }
      } catch (err) {
        console.log("⚠️  Could not decode registry data");
      }
      
      return;
    }
    
    // 8. Initialiser le registre
    console.log("\n🚀 Initializing registry...");
    
    const tx = await program.methods
      .initializeRegistry()
      .accounts({
        gameRegistry: gameRegistryPDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log("\n✅ Registry initialized successfully!");
    console.log(`📝 Transaction signature: ${tx}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    // 9. Vérifier l'initialisation
    console.log("\n🔍 Verifying initialization...");
    const newRegistryData = await program.account.gameRegistry.fetch(gameRegistryPDA);
    
    console.log("\n📊 Registry Status:");
    console.log(`   Authority: ${newRegistryData.authority.toBase58()}`);
    console.log(`   Total Games: ${newRegistryData.totalGames}`);
    console.log(`   Paused: ${newRegistryData.paused}`);
    
    console.log("\n✨ Registry is ready for game registration!");
    console.log("Next steps:");
    console.log("  1. Run: npx ts-node scripts/register-games.ts");
    console.log("  2. Create matches and start playing!");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
main().then(() => {
  console.log("\n✅ Script completed successfully!");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});