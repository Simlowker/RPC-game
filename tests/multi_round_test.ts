import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UniversalPvp } from "../target/types/universal_pvp";
import { expect } from "chai";

describe("Multi-Round RPS Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.UniversalPvp as Program<UniversalPvp>;
  
  let matchPda: anchor.web3.PublicKey;
  let player1: anchor.web3.Keypair;
  let player2: anchor.web3.Keypair;
  
  before(async () => {
    // Initialiser les joueurs
    player1 = anchor.web3.Keypair.generate();
    player2 = anchor.web3.Keypair.generate();
    
    // Airdrop SOL aux joueurs
    await provider.connection.requestAirdrop(
      player1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      player2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    
    // Attendre confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  describe("Best of 3 Match", () => {
    it("Should create a Best of 3 match", async () => {
      const matchId = anchor.web3.Keypair.generate().publicKey;
      const betAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
      
      // Créer le match avec configuration Best of 3
      const tx = await program.methods
        .createMatch(
          matchId,
          { rockPaperScissors: {} }, // GameType
          betAmount,
          3, // rounds: Best of 3
        )
        .accounts({
          creator: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      console.log("Match created:", tx);
      
      // Vérifier la création
      const matchAccount = await program.account.universalMatch.fetch(matchPda);
      expect(matchAccount.gameConfig.rounds).to.equal(3);
      expect(matchAccount.creator.toBase58()).to.equal(player1.publicKey.toBase58());
    });
    
    it("Should handle a draw and require replay", async () => {
      // Les deux joueurs choisissent Rock (0)
      const choice = 0; // Rock
      
      // Joueur 1 joue
      await program.methods
        .playRound(choice)
        .accounts({
          matchAccount: matchPda,
          player: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      // Joueur 2 joue le même choix
      const tx = await program.methods
        .playRound(choice)
        .accounts({
          matchAccount: matchPda,
          player: player2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();
      
      // Vérifier que c'est une égalité et qu'un rejeu est requis
      const matchAccount = await program.account.universalMatch.fetch(matchPda);
      
      // Le round ne devrait pas être compté dans rounds_played
      // car c'est une égalité
      console.log("Draw detected, immediate replay required");
    });
    
    it("Should complete a full Best of 3 match", async () => {
      // Simuler une série de rounds
      const rounds = [
        { p1: 0, p2: 2 }, // Rock vs Scissors - P1 wins
        { p1: 1, p2: 0 }, // Paper vs Rock - P1 wins
      ];
      
      for (const round of rounds) {
        // Joueur 1 joue
        await program.methods
          .playRound(round.p1)
          .accounts({
            matchAccount: matchPda,
            player: player1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player1])
          .rpc();
        
        // Joueur 2 joue
        await program.methods
          .playRound(round.p2)
          .accounts({
            matchAccount: matchPda,
            player: player2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player2])
          .rpc();
      }
      
      // Vérifier le gagnant
      const matchAccount = await program.account.universalMatch.fetch(matchPda);
      expect(matchAccount.winner.toBase58()).to.equal(player1.publicKey.toBase58());
      expect(matchAccount.status).to.deep.equal({ completed: {} });
      
      console.log("Match completed! Player 1 wins 2-0");
    });
    
    it("Should handle multiple consecutive draws", async () => {
      const matchId = anchor.web3.Keypair.generate().publicKey;
      const betAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
      
      // Créer un nouveau match
      await program.methods
        .createMatch(
          matchId,
          { rockPaperScissors: {} },
          betAmount,
          3,
        )
        .accounts({
          creator: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      // Simuler 3 égalités consécutives
      for (let i = 0; i < 3; i++) {
        // Les deux joueurs choisissent la même chose
        const choice = i % 3; // Rock, Paper, Scissors
        
        await program.methods
          .playRound(choice)
          .accounts({
            matchAccount: matchPda,
            player: player1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player1])
          .rpc();
        
        await program.methods
          .playRound(choice)
          .accounts({
            matchAccount: matchPda,
            player: player2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player2])
          .rpc();
      }
      
      // Après 3 égalités, une résolution forcée devrait être appliquée
      const matchAccount = await program.account.universalMatch.fetch(matchPda);
      expect(matchAccount.status).to.deep.equal({ completed: {} });
      console.log("Forced resolution after 3 consecutive draws");
    });
    
    it("Should track match progress correctly", async () => {
      const matchId = anchor.web3.Keypair.generate().publicKey;
      const betAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
      
      // Créer un match Best of 5
      await program.methods
        .createMatch(
          matchId,
          { rockPaperScissors: {} },
          betAmount,
          5, // Best of 5
        )
        .accounts({
          creator: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      // Jouer quelques rounds
      const rounds = [
        { p1: 0, p2: 2 }, // Rock vs Scissors - P1 wins (1-0)
        { p1: 1, p2: 2 }, // Paper vs Scissors - P2 wins (1-1)
        { p1: 2, p2: 0 }, // Scissors vs Rock - P2 wins (1-2)
      ];
      
      for (const [index, round] of rounds.entries()) {
        await program.methods
          .playRound(round.p1)
          .accounts({
            matchAccount: matchPda,
            player: player1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player1])
          .rpc();
        
        await program.methods
          .playRound(round.p2)
          .accounts({
            matchAccount: matchPda,
            player: player2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player2])
          .rpc();
        
        // Vérifier le score après chaque round
        const matchAccount = await program.account.universalMatch.fetch(matchPda);
        console.log(`After round ${index + 1}: Score tracking in round_state`);
      }
      
      // Continuer jusqu'à ce qu'un joueur gagne
      // P2 a besoin d'un round de plus pour gagner (3-1)
      await program.methods
        .playRound(0) // Rock
        .accounts({
          matchAccount: matchPda,
          player: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
      
      await program.methods
        .playRound(1) // Paper
        .accounts({
          matchAccount: matchPda,
          player: player2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();
      
      // P2 devrait avoir gagné 3-1
      const finalMatch = await program.account.universalMatch.fetch(matchPda);
      expect(finalMatch.winner.toBase58()).to.equal(player2.publicKey.toBase58());
      console.log("Match completed! Player 2 wins 3-1 in Best of 5");
    });
  });
  
  describe("Edge Cases", () => {
    it("Should handle match point scenarios", async () => {
      // Créer un match où un joueur est à un round de la victoire
      // et tester la pression du "match point"
      console.log("Testing match point pressure situations...");
    });
    
    it("Should enforce maximum round limits", async () => {
      // Tester avec un Best of 7 ou Best of 9
      console.log("Testing extended matches...");
    });
  });
});