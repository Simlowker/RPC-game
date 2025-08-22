#!/usr/bin/env ts-node
/**
 * Script pour enregistrer les jeux dans Universal PvP
 * 
 * Utilisation:
 *   npx ts-node scripts/register-games.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import fs from 'fs';
import os from 'os';

// Configuration
const PROGRAM_ID = new PublicKey("4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR");
const DEVNET_URL = "https://api.devnet.solana.com";

// IDL simplifié
const IDL = {
  "version": "1.0.0",
  "name": "universal_pvp",
  "instructions": [
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
    }
  ]
};

async function main() {
  console.log("🎮 Universal PvP - Game Registration");
  console.log("=====================================\n");

  try {
    // 1. Connexion à Devnet
    console.log("📡 Connecting to Devnet...");
    const connection = new Connection(DEVNET_URL, "confirmed");
    
    // 2. Charger le wallet
    const walletPath = process.env.WALLET_PATH || `${os.homedir()}/.config/solana/devnet-keypair.json`;
    console.log(`📂 Loading wallet from: ${walletPath}`);
    
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    );
    
    const wallet = new Wallet(walletKeypair);
    console.log(`✅ Wallet loaded: ${wallet.publicKey.toBase58()}\n`);
    
    // 3. Créer le provider
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed"
    });
    
    // 4. Créer le programme
    const program = new Program(IDL as any, PROGRAM_ID, provider);
    
    // 5. Calculer le PDA du registre
    const [gameRegistryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_registry")],
      PROGRAM_ID
    );
    
    console.log(`📍 Registry PDA: ${gameRegistryPDA.toBase58()}\n`);
    
    // 6. Définir les jeux à enregistrer
    const games = [
      { type: { rockPaperScissors: {} }, name: "Rock Paper Scissors", emoji: "✂️" },
      { type: { dice: {} }, name: "Dice Game", emoji: "🎲" },
      { type: { coinFlip: {} }, name: "Coin Flip", emoji: "🪙" },
      { type: { highCard: {} }, name: "High Card", emoji: "🃏" }
    ];
    
    console.log("🎯 Registering games...\n");
    
    // 7. Enregistrer chaque jeu
    for (const game of games) {
      try {
        console.log(`${game.emoji} Registering ${game.name}...`);
        
        const tx = await program.methods
          .registerGame(game.type, game.name)
          .accounts({
            gameRegistry: gameRegistryPDA,
            authority: wallet.publicKey,
          })
          .rpc();
        
        console.log(`   ✅ Registered! Tx: ${tx.substring(0, 8)}...`);
        console.log(`   🔗 https://explorer.solana.com/tx/${tx}?cluster=devnet\n`);
        
        // Attendre un peu entre les transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        if (error.toString().includes("GameAlreadyRegistered")) {
          console.log(`   ℹ️  ${game.name} already registered\n`);
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      }
    }
    
    // 8. Afficher le statut final
    console.log("📊 Fetching final registry status...");
    try {
      const registryData = await connection.getAccountInfo(gameRegistryPDA);
      if (registryData) {
        console.log("\n✅ Games registration complete!");
        console.log("   All games are now available for matches");
        
        // Note: Pour décoder les données complètes, nous aurions besoin de l'IDL complet
        // Ici nous affichons juste que le registre existe
        console.log(`   Registry size: ${registryData.data.length} bytes`);
      }
    } catch (err) {
      console.log("⚠️  Could not fetch registry data");
    }
    
    console.log("\n🎮 Next steps:");
    console.log("   1. Create a match: npx ts-node scripts/create-match.ts");
    console.log("   2. Join and play!");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Exécuter le script
main().then(() => {
  console.log("\n✅ Script completed!");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});