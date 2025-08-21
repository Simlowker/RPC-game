# Solana Mainnet Keypair Setup Guide

## ⚠️ SECURITY WARNING
This guide helps you create a MAINNET keypair that will control real SOL tokens. 
**NEVER share your private key or seed phrase with anyone!**

## Prerequisites

Ensure Solana CLI is installed:
```bash
solana --version
```

If not installed, run:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## Keypair Generation Options

### Option 1: Direct Generation (Interactive)
```bash
solana-keygen new -o ~/.config/solana/mainnet-keypair.json
```

### Option 2: Silent Generation (Non-interactive)
```bash
solana-keygen new --no-bip39-passphrase -o ~/.config/solana/mainnet-keypair.json
```

### Option 3: With Custom Seed Phrase
```bash
solana-keygen new --word-count 24 -o ~/.config/solana/mainnet-keypair.json
```

## Step-by-Step Process

### 1. Generate the Keypair

Run the generation command:
```bash
solana-keygen new -o ~/.config/solana/mainnet-keypair.json
```

You will be prompted:
- **BIP39 Passphrase**: Press Enter for none (recommended for simplicity)
- **Seed Phrase**: WRITE THIS DOWN IMMEDIATELY - it's your only recovery method
- **Confirmation**: Re-enter seed phrase to verify

### 2. Verify Keypair Creation

Check that the file was created:
```bash
ls -la ~/.config/solana/mainnet-keypair.json
```

Get your public key (wallet address):
```bash
solana-keygen pubkey ~/.config/solana/mainnet-keypair.json
```

### 3. Set File Permissions (Critical for Security)

```bash
chmod 600 ~/.config/solana/mainnet-keypair.json
```

### 4. Configure Solana CLI for Mainnet

Set mainnet as default:
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

Set your keypair as default:
```bash
solana config set --keypair ~/.config/solana/mainnet-keypair.json
```

Verify configuration:
```bash
solana config get
```

### 5. Check Wallet Balance

```bash
solana balance
```

## Backup Instructions

### 1. Backup Seed Phrase
- Write down your 12 or 24-word seed phrase on paper
- Store in a secure location (safe, safety deposit box)
- Never store digitally or take photos

### 2. Backup Keypair File
```bash
# Create encrypted backup
tar -czf - ~/.config/solana/mainnet-keypair.json | \
  openssl enc -aes-256-cbc -salt -out ~/mainnet-keypair-backup.tar.gz.enc

# To decrypt later:
openssl enc -aes-256-cbc -d -in ~/mainnet-keypair-backup.tar.gz.enc | tar -xzf -
```

### 3. Multiple Backup Locations
- USB drive (encrypted)
- External hard drive (encrypted)
- Paper wallet with QR code

## Security Best Practices

### DO's ✅
- Store seed phrase offline
- Use hardware wallet for large amounts
- Enable 2FA on exchanges
- Verify transaction details before signing
- Keep software updated
- Use a dedicated computer for crypto

### DON'Ts ❌
- Share private keys or seed phrases
- Store keys in cloud storage
- Use public WiFi for transactions
- Click suspicious links
- Trust DMs about "support"
- Keep large amounts in hot wallets

## Funding Your Wallet

### From Exchange
1. Copy your public key:
   ```bash
   solana address
   ```
2. Go to exchange withdrawal page
3. Select SOL
4. Paste your address
5. Send small test amount first
6. Verify receipt:
   ```bash
   solana balance
   ```

### Minimum SOL Requirements
- **Transaction fees**: ~0.00025 SOL per transaction
- **Rent exemption**: ~0.002 SOL for basic account
- **Recommended minimum**: 0.05 SOL for operations

## Recovery Process

If you lose your keypair file but have the seed phrase:

```bash
# Recover from seed phrase
solana-keygen recover -o ~/.config/solana/mainnet-keypair-recovered.json

# Enter your seed phrase when prompted
```

## Troubleshooting

### Permission Denied
```bash
sudo chown $USER:$USER ~/.config/solana/mainnet-keypair.json
chmod 600 ~/.config/solana/mainnet-keypair.json
```

### Wrong Network
```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Other networks:
# Devnet: https://api.devnet.solana.com
# Testnet: https://api.testnet.solana.com
```

### Check Keypair Info
```bash
solana-keygen pubkey ~/.config/solana/mainnet-keypair.json
solana-keygen verify <PUBKEY> ~/.config/solana/mainnet-keypair.json
```

## Quick Reference Commands

```bash
# Generate new keypair
solana-keygen new -o ~/.config/solana/mainnet-keypair.json

# Get public key
solana address

# Check balance
solana balance

# Set as default
solana config set --keypair ~/.config/solana/mainnet-keypair.json

# Airdrop (testnet/devnet only)
solana airdrop 1  # Does NOT work on mainnet
```

## Next Steps

1. ✅ Generate keypair
2. ✅ Backup seed phrase
3. ✅ Secure keypair file
4. ✅ Configure Solana CLI
5. 📝 Fund wallet with SOL
6. 📝 Deploy programs
7. 📝 Interact with dApps

## Important Resources

- [Solana Docs](https://docs.solana.com)
- [Solana Explorer](https://explorer.solana.com)
- [Solana Status](https://status.solana.com)
- [Phantom Wallet](https://phantom.app)
- [Solflare Wallet](https://solflare.com)

---

⚠️ **FINAL REMINDER**: This is a MAINNET keypair. Losing access means losing real funds. Take security seriously!