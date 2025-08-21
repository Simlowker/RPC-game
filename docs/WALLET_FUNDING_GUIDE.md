# Solana Mainnet Wallet Funding Guide

## Overview
This guide covers all methods to fund your Solana mainnet wallet with SOL tokens.

## Prerequisites
- Generated mainnet keypair (see MAINNET_KEYPAIR_SETUP.md)
- Your wallet public key (run: `solana address`)

## Funding Methods

### 1. Centralized Exchanges (CEX)

#### Popular Exchanges Supporting SOL
- **Binance**: Lowest fees, high liquidity
- **Coinbase**: User-friendly, good for beginners
- **Kraken**: Good security, reasonable fees
- **Crypto.com**: Mobile-friendly
- **KuCoin**: No KYC for small amounts

#### Steps to Fund from CEX:
1. **Buy SOL on exchange**
   - Use fiat (USD, EUR, etc.) or trade crypto
   - Consider fees and spread

2. **Navigate to Withdrawal**
   - Go to Wallet/Spot/Withdraw section
   - Select SOL

3. **Enter Your Address**
   ```bash
   # Get your address
   solana address
   ```
   - Double-check the address
   - Select Solana network (not Solana SPL)

4. **Test Transaction First**
   - Send 0.1 SOL as test
   - Verify receipt:
   ```bash
   solana balance
   ```

5. **Send Full Amount**
   - After test succeeds, send remaining amount
   - Keep some SOL on exchange for future needs

### 2. Decentralized Exchanges (DEX)

#### Cross-Chain Bridges
- **Wormhole**: ETH/BSC/Polygon → Solana
- **Allbridge**: Multi-chain bridge
- **Portal Bridge**: User-friendly interface

#### On-Solana DEXs (need initial SOL)
- **Jupiter**: Best aggregator
- **Raydium**: AMM and order book
- **Orca**: User-friendly

### 3. Peer-to-Peer (P2P)

#### Platforms
- **LocalCryptos**: Escrow service
- **Paxful**: Multiple payment methods
- **Bisq**: Decentralized P2P

#### Direct Transfer
- Find trusted seller
- Provide your public key
- Verify transaction on explorer

### 4. Fiat On-Ramps

#### Direct SOL Purchase
- **MoonPay**: Credit/debit card
- **Transak**: Bank transfer, cards
- **Ramp Network**: EU-focused

#### Process:
1. Visit on-ramp website
2. Enter amount in fiat
3. Provide Solana address
4. Complete KYC (if required)
5. Make payment
6. Receive SOL (5-30 minutes)

### 5. OTC (Over-The-Counter)

For large amounts ($10,000+):
- **Genesis Trading**
- **Cumberland**
- **Circle Trade**

Benefits:
- Better rates for large amounts
- Less slippage
- Personal service

## Minimum Funding Recommendations

### Transaction Costs
- **Base fee**: 0.000005 SOL (5000 lamports)
- **Priority fee**: Variable (0-0.001 SOL)
- **Typical transaction**: ~0.00025 SOL

### Recommended Minimums
- **Testing**: 0.05 SOL
- **Basic usage**: 0.5 SOL
- **Active trading**: 2-5 SOL
- **DeFi activities**: 5-10 SOL
- **NFT minting**: 2-3 SOL per mint

### Account Rent
- **Minimum balance**: ~0.002 SOL
- **Token accounts**: ~0.002 SOL each
- **Program accounts**: Variable

## Verification Steps

### 1. Check Balance
```bash
solana balance
# Or specify address
solana balance <YOUR_PUBLIC_KEY>
```

### 2. View on Explorer
```bash
# Open Solana Explorer
echo "https://explorer.solana.com/address/$(solana address)"
```

### 3. Transaction History
```bash
solana transaction-history
solana confirm <TRANSACTION_SIGNATURE>
```

## Fee Optimization

### Network Congestion
- Check current fees: `solana fees`
- Use priority fees during congestion
- Consider batching transactions

### Exchange Withdrawal Fees (Approximate)
- Binance: 0.01 SOL
- Coinbase: 0.0001 SOL
- Kraken: 0.02 SOL
- KuCoin: 0.01 SOL

### Timing
- Avoid high congestion periods
- Weekends often have lower fees
- Monitor Solana network status

## Security Checklist

### Before Funding
- [ ] Verify wallet address multiple times
- [ ] Test with small amount first
- [ ] Check exchange withdrawal fees
- [ ] Ensure using Solana mainnet
- [ ] Have seed phrase backed up

### During Transfer
- [ ] Use correct network (Solana, not SPL)
- [ ] Include memo if required by exchange
- [ ] Save transaction ID
- [ ] Monitor confirmation

### After Funding
- [ ] Verify balance on-chain
- [ ] Check transaction on explorer
- [ ] Keep transaction records
- [ ] Consider splitting funds across wallets

## Common Issues

### Transaction Not Showing
- Wait 1-2 minutes for confirmation
- Check explorer with transaction ID
- Verify correct network was used
- Contact exchange support if needed

### Wrong Network Used
- SOL sent on wrong chain is usually lost
- Some exchanges support recovery (fees apply)
- Always double-check network selection

### Insufficient Rent
```bash
# Check rent-exempt minimum
solana rent 0
```

## Tax Considerations

### Record Keeping
- Date and time of purchase
- Amount in fiat and SOL
- Exchange/platform used
- Transaction fees
- Purpose of transaction

### Tools
- Koinly
- CoinTracker
- TokenTax
- CryptoTaxCalculator

## Quick Commands Reference

```bash
# Get your address
solana address

# Check balance
solana balance

# Check USD value (approximate)
solana balance --url https://api.mainnet-beta.solana.com --lamports

# Monitor transactions
solana transaction-history --limit 10

# Check network fees
solana fees

# Verify address owns keypair
solana-keygen verify <PUBKEY> ~/.config/solana/mainnet-keypair.json
```

## Resources

### Official Links
- [Solana Explorer](https://explorer.solana.com)
- [Solana Beach](https://solanabeach.io)
- [Solscan](https://solscan.io)

### Price Tracking
- [CoinGecko](https://www.coingecko.com/en/coins/solana)
- [CoinMarketCap](https://coinmarketcap.com/currencies/solana)

### Support
- [Solana Discord](https://discord.com/invite/solana)
- [Solana Forum](https://forums.solana.com)

---

⚠️ **Remember**: Always send a test transaction first when using a new address or service!