# SolDuel RPS Platform - Mainnet Deployment Guide

## 🚀 Deployment Overview

This guide provides comprehensive instructions for deploying the SolDuel RPS platform to Solana mainnet.

## Prerequisites

### 1. System Requirements
- Node.js v18+ and npm/yarn
- Rust 1.70+
- Solana CLI 1.17+
- Anchor CLI 0.29.0
- Git

### 2. Wallet Requirements
- **Deployment Wallet**: Minimum 2 SOL for program deployment
- **Fee Account**: 0.5 SOL for transaction fees
- **Program Authority**: Secure keypair for program upgrades

## Pre-Deployment Checklist

### Security Audit
- [ ] Smart contract audited
- [ ] No hardcoded secrets in code
- [ ] All test cases passing
- [ ] Security vulnerabilities addressed
- [ ] Program upgrade authority secured

### Testing Complete
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Devnet deployment tested
- [ ] User acceptance testing complete
- [ ] Performance benchmarks met

### Documentation
- [ ] API documentation complete
- [ ] User guide finalized
- [ ] Terms of service prepared
- [ ] Privacy policy ready

## Step 1: Wallet Setup

### Create Mainnet Wallet
```bash
# Generate new mainnet keypair (if needed)
solana-keygen new -o ~/.config/solana/mainnet-keypair.json

# Set as default
solana config set --keypair ~/.config/solana/mainnet-keypair.json

# Get wallet address
solana address

# Fund wallet with at least 2 SOL
# Use exchanges or OTC to acquire mainnet SOL
```

### Backup Critical Keypairs
```bash
# Backup deployment keypair
cp ~/.config/solana/mainnet-keypair.json ~/secure-backup/mainnet-keypair.json

# Create program authority keypair
solana-keygen new -o ~/secure-backup/program-authority.json

# Store recovery phrase securely
```

## Step 2: Configure for Mainnet

### Update Anchor.toml
```toml
[toolchain]
anchor_version = "0.29.0"
package_manager = "yarn"

[features]
resolution = true
skip-lint = false

[programs.mainnet-beta]
rps = "RPSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Will be generated

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "mainnet-beta"
wallet = "~/.config/solana/mainnet-keypair.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Configure Solana CLI
```bash
# Set to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Verify configuration
solana config get

# Check wallet balance
solana balance
```

## Step 3: RPC Endpoint Setup

### Recommended RPC Providers
1. **Helius**: https://mainnet.helius.xyz
2. **QuickNode**: https://api.quicknode.com
3. **Alchemy**: https://solana-mainnet.alchemyapi.io
4. **Triton**: https://api.triton.one

### Configure Custom RPC
```bash
# Using Helius (recommended for production)
export MAINNET_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"

# Update Solana CLI
solana config set --url $MAINNET_RPC_URL
```

## Step 4: Build and Deploy Program

### Build for Mainnet
```bash
cd rps-game

# Clean previous builds
anchor clean

# Build program
anchor build

# Verify build
ls -la target/deploy/
```

### Deploy to Mainnet
```bash
# Deploy program (this will cost ~1-2 SOL)
anchor deploy --provider.cluster mainnet-beta

# Save the program ID
echo "Program ID: $(solana address -k target/deploy/rps-keypair.json)"

# Update Anchor.toml with the new program ID
# Update frontend configuration with program ID
```

### Verify Deployment
```bash
# Check program account
solana program show <PROGRAM_ID>

# Verify program is executable
solana account <PROGRAM_ID> --output json | jq '.data.parsed.info.executable'
```

## Step 5: Update Frontend Configuration

### Update Environment Variables
```env
# .env.production
VITE_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
VITE_NETWORK=mainnet-beta
VITE_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
VITE_GAMBA_PROGRAM_ID=GambaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Update Configuration Files
```typescript
// src/config/constants.ts
export const MAINNET_CONFIG = {
  programId: new PublicKey('YOUR_MAINNET_PROGRAM_ID'),
  network: 'mainnet-beta',
  rpcEndpoint: process.env.VITE_RPC_URL,
  commitment: 'confirmed' as const,
};
```

## Step 6: Frontend Deployment

### Build Frontend for Production
```bash
cd ..  # Back to platform root
npm run build

# Test production build locally
npm run preview
```

### Deploy to Hosting Provider

#### Option 1: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir dist

# Set environment variables in Netlify dashboard
```

#### Option 3: Custom Server
```bash
# Copy build files
scp -r dist/* user@your-server:/var/www/solduel/

# Configure nginx/apache
# Set up SSL certificate
# Configure CDN (CloudFlare recommended)
```

## Step 7: Post-Deployment Verification

### Program Verification
```bash
# Test program functionality
anchor test --provider.cluster mainnet-beta --skip-deploy

# Monitor program logs
solana logs <PROGRAM_ID> --url mainnet-beta
```

### Frontend Verification
- [ ] Connect wallet functionality
- [ ] Game creation working
- [ ] Gameplay smooth
- [ ] Transactions confirming
- [ ] Error handling functional

### Performance Monitoring
```bash
# Monitor RPC performance
curl -X POST $MAINNET_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check transaction throughput
solana ping --count 10
```

## Step 8: Security Hardening

### Program Security
```bash
# Transfer upgrade authority to multisig
anchor upgrade <PROGRAM_ID> --program-id <PROGRAM_ID> \
  --new-upgrade-authority <MULTISIG_ADDRESS>

# Verify authority transfer
solana program show <PROGRAM_ID>
```

### Frontend Security
- Enable CORS properly
- Implement rate limiting
- Add request validation
- Enable CSP headers
- Use HTTPS only

## Step 9: Monitoring Setup

### Error Monitoring (Sentry)
```javascript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

### Analytics (Google Analytics)
```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Uptime Monitoring
- Configure UptimeRobot or similar
- Set up alerts for downtime
- Monitor RPC endpoint health
- Track transaction success rates

## Step 10: Backup and Recovery

### Backup Strategy
```bash
# Backup program keypair
cp target/deploy/rps-keypair.json ~/secure-backup/

# Backup deployment configuration
cp Anchor.toml ~/secure-backup/Anchor.toml.mainnet

# Document program ID and deployment details
echo "Program ID: <PROGRAM_ID>" > ~/secure-backup/deployment-info.txt
echo "Deployment Date: $(date)" >> ~/secure-backup/deployment-info.txt
echo "Deployment Wallet: $(solana address)" >> ~/secure-backup/deployment-info.txt
```

### Recovery Plan
1. Store keypairs in secure location (hardware wallet/cold storage)
2. Document recovery procedures
3. Test recovery process on devnet
4. Maintain upgrade authority security

## Maintenance Tasks

### Regular Updates
```bash
# Check for Anchor updates
anchor --version

# Update dependencies
cd rps-game && yarn upgrade
cd .. && npm update

# Rebuild and test before deploying updates
```

### Monitoring Checklist
- [ ] Daily: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Security audit
- [ ] Quarterly: Dependency updates

## Troubleshooting

### Common Issues

#### Insufficient SOL for deployment
```bash
# Check exact requirement
anchor deploy --provider.cluster mainnet-beta --dry-run

# Fund wallet with additional SOL
```

#### RPC rate limiting
```bash
# Switch to premium RPC endpoint
# Implement request batching
# Add retry logic with exponential backoff
```

#### Transaction failures
```bash
# Increase compute units
# Optimize transaction size
# Use priority fees during congestion
```

## Cost Estimation

### One-time Costs
- Program deployment: ~1.5 SOL
- Initial testing: ~0.5 SOL
- Total: ~2 SOL

### Ongoing Costs
- Transaction fees: ~0.00025 SOL per game
- RPC costs: $100-500/month (depending on usage)
- Hosting: $20-100/month
- Monitoring: $50-200/month

## Support Resources

### Documentation
- [Solana Docs](https://docs.solana.com)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [RPC Provider Docs](https://docs.helius.dev/)

### Community
- Discord: [Join our server]
- Twitter: [@SolDuelPlatform]
- Email: support@solduel.com

## Final Checklist

Before going live:
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Wallet funded
- [ ] Backups created
- [ ] Monitoring configured
- [ ] Documentation published
- [ ] Support channels ready
- [ ] Marketing materials prepared
- [ ] Terms of Service live
- [ ] Privacy Policy published

## Emergency Contacts

- Technical Lead: [Contact Info]
- Security Team: [Contact Info]
- DevOps: [Contact Info]
- Legal: [Contact Info]

---

**Remember**: Always test on devnet first, maintain secure backups, and never share private keys!