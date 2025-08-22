import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UniversalPvp } from "../target/types/universal_pvp";
import { 
  Keypair, 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { assert } from "chai";

describe("Universal PvP - Claim Winnings", () => {
  // Configure le client pour utiliser le cluster local
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UniversalPvp as Program<UniversalPvp>;
  
  // Comptes de test
  let gameRegistry: PublicKey;
  let creator: Keypair;
  let opponent: Keypair;
  let matchAccount: Keypair;
  let vault: PublicKey;

  before(async () => {
    // Générer les comptes
    creator = Keypair.generate();
    opponent = Keypair.generate();
    matchAccount = Keypair.generate();

    // Airdrop de SOL pour les tests
    await provider.connection.requestAirdrop(creator.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(opponent.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Attendre la confirmation des airdrops
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Trouver le PDA du registry
    [gameRegistry] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_registry")],
      program.programId
    );

    // Trouver le PDA du vault
    [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), matchAccount.publicKey.toBuffer()],
      program.programId
    );

    try {
      // Initialiser le registry
      await program.methods
        .initializeRegistry()
        .accounts({
          gameRegistry,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Game registry initialized");
    } catch (error) {
      // Le registry existe déjà
      console.log("📝 Game registry already exists");
    }
  });

  it("Teste le workflow complet: créer match → rejoindre → régler → réclamer gains", async () => {
    const betAmount = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL

    // Configuration du jeu RPS
    const gameConfig = {
      maxPlayers: 2,
      minBet: new anchor.BN(0.01 * LAMPORTS_PER_SOL),
      maxBet: new anchor.BN(10 * LAMPORTS_PER_SOL),
      rounds: 1, // Match simple
    };

    console.log("🎮 Création du match...");
    
    // 1. Créer le match
    await program.methods
      .createUniversalMatch(
        { rockPaperScissors: {} }, // GameType
        new anchor.BN(betAmount),
        gameConfig
      )
      .accounts({
        matchAccount: matchAccount.publicKey,
        vault,
        creator: creator.publicKey,
        tokenMint: null,
        creatorTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([creator, matchAccount])
      .rpc();

    console.log("✅ Match créé");

    // 2. Rejoindre le match
    console.log("⚔️ Rejoindre le match...");
    
    await program.methods
      .joinMatch()
      .accounts({
        matchAccount: matchAccount.publicKey,
        vault,
        opponent: opponent.publicKey,
        opponentTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([opponent])
      .rpc();

    console.log("✅ Match rejoint");

    // 3. Simuler des mouvements et régler le match
    console.log("🎯 Simulation des mouvements...");
    
    // Soumettre des mouvements fictifs (pour RPS)
    const move1 = Buffer.from([1]); // Rock
    const move2 = Buffer.from([2]); // Paper (Paper wins over Rock)

    await program.methods
      .submitMove(move1)
      .accounts({
        matchAccount: matchAccount.publicKey,
        player: creator.publicKey,
      })
      .signers([creator])
      .rpc();

    await program.methods
      .submitMove(move2)
      .accounts({
        matchAccount: matchAccount.publicKey,
        player: opponent.publicKey,
      })
      .signers([opponent])
      .rpc();

    console.log("✅ Mouvements soumis");

    // 4. Régler le match
    console.log("⚖️ Règlement du match...");
    
    await program.methods
      .settleMatch()
      .accounts({
        matchAccount: matchAccount.publicKey,
      })
      .rpc();

    console.log("✅ Match réglé");

    // 5. Vérifier l'état du match
    const matchData = await program.account.universalMatch.fetch(matchAccount.publicKey);
    console.log("🏆 Statut du match:", matchData.status);
    console.log("🏆 Gagnant:", matchData.winner?.toString());
    console.log("💰 Pot total:", matchData.totalPot.toString(), "lamports");

    // Déterminer qui doit réclamer les gains
    const winner = matchData.winner;
    const winnerKeypair = winner?.equals(creator.publicKey) ? creator : opponent;
    const winnerName = winner?.equals(creator.publicKey) ? "Creator" : "Opponent";

    console.log(`🎯 ${winnerName} doit réclamer les gains...`);

    // 6. Réclamer les gains (SOL)
    const balanceBeforeClaim = await provider.connection.getBalance(winnerKeypair.publicKey);
    console.log("💳 Solde avant réclamation:", balanceBeforeClaim / LAMPORTS_PER_SOL, "SOL");

    await program.methods
      .claimWinnings()
      .accounts({
        matchAccount: matchAccount.publicKey,
        vault,
        claimer: winnerKeypair.publicKey,
        claimerTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([winnerKeypair])
      .rpc();

    console.log("✅ Gains réclamés");

    // 7. Vérifier les soldes après réclamation
    const balanceAfterClaim = await provider.connection.getBalance(winnerKeypair.publicKey);
    console.log("💳 Solde après réclamation:", balanceAfterClaim / LAMPORTS_PER_SOL, "SOL");

    const gainReceived = balanceAfterClaim - balanceBeforeClaim;
    console.log("💰 Gain reçu:", gainReceived / LAMPORTS_PER_SOL, "SOL");

    // Le gagnant doit recevoir 100% du pot (2x le bet_amount)
    const expectedGain = betAmount * 2; // 100% du pot total
    
    // Permettre une petite marge d'erreur pour les frais de transaction
    const tolerance = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL de tolérance
    
    assert.isTrue(
      Math.abs(gainReceived - expectedGain) < tolerance,
      `Gain attendu: ${expectedGain / LAMPORTS_PER_SOL} SOL, reçu: ${gainReceived / LAMPORTS_PER_SOL} SOL`
    );

    console.log("🎉 Test réussi! Le gagnant a reçu 100% du pot sans frais!");
  });

  it("Teste la réclamation en cas d'égalité", async () => {
    const betAmount = 0.05 * LAMPORTS_PER_SOL; // 0.05 SOL
    const newMatchAccount = Keypair.generate();
    
    const [newVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), newMatchAccount.publicKey.toBuffer()],
      program.programId
    );

    const gameConfig = {
      maxPlayers: 2,
      minBet: new anchor.BN(0.01 * LAMPORTS_PER_SOL),
      maxBet: new anchor.BN(10 * LAMPORTS_PER_SOL),
      rounds: 1,
    };

    // Créer et rejoindre un nouveau match
    await program.methods
      .createUniversalMatch(
        { rockPaperScissors: {} },
        new anchor.BN(betAmount),
        gameConfig
      )
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        vault: newVault,
        creator: creator.publicKey,
        tokenMint: null,
        creatorTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([creator, newMatchAccount])
      .rpc();

    await program.methods
      .joinMatch()
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        vault: newVault,
        opponent: opponent.publicKey,
        opponentTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([opponent])
      .rpc();

    // Simuler une égalité (même mouvement)
    const sameMoveData = Buffer.from([1]); // Rock vs Rock = Draw

    await program.methods
      .submitMove(sameMoveData)
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        player: creator.publicKey,
      })
      .signers([creator])
      .rpc();

    await program.methods
      .submitMove(sameMoveData)
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        player: opponent.publicKey,
      })
      .signers([opponent])
      .rpc();

    // Régler le match (égalité)
    await program.methods
      .settleMatch()
      .accounts({
        matchAccount: newMatchAccount.publicKey,
      })
      .rpc();

    const matchData = await program.account.universalMatch.fetch(newMatchAccount.publicKey);
    console.log("⚖️ Résultat: Égalité (winner = null)");
    assert.isNull(matchData.winner, "En cas d'égalité, winner doit être null");

    // Les deux joueurs récupèrent leur mise
    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
    const opponentBalanceBefore = await provider.connection.getBalance(opponent.publicKey);

    // Creator réclame sa mise
    await program.methods
      .claimWinnings()
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        vault: newVault,
        claimer: creator.publicKey,
        claimerTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // Opponent réclame sa mise
    await program.methods
      .claimWinnings()
      .accounts({
        matchAccount: newMatchAccount.publicKey,
        vault: newVault,
        claimer: opponent.publicKey,
        claimerTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([opponent])
      .rpc();

    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const opponentBalanceAfter = await provider.connection.getBalance(opponent.publicKey);

    const creatorGain = creatorBalanceAfter - creatorBalanceBefore;
    const opponentGain = opponentBalanceAfter - opponentBalanceBefore;

    console.log("💰 Creator a récupéré:", creatorGain / LAMPORTS_PER_SOL, "SOL");
    console.log("💰 Opponent a récupéré:", opponentGain / LAMPORTS_PER_SOL, "SOL");

    // Chaque joueur récupère exactement sa mise originale
    const tolerance = 0.001 * LAMPORTS_PER_SOL;
    assert.isTrue(
      Math.abs(creatorGain - betAmount) < tolerance,
      "Creator doit récupérer sa mise originale"
    );
    assert.isTrue(
      Math.abs(opponentGain - betAmount) < tolerance,
      "Opponent doit récupérer sa mise originale"
    );

    console.log("🎉 Test d'égalité réussi! Chaque joueur a récupéré sa mise exacte!");
  });
});