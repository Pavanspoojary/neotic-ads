# Production Deployment & Infrastructure Playbook

## 1. Overview & Purpose
This playbook details the step-by-step procedure for deploying SponsorSlot to production across GitHub, Vercel Edge Network, and Supabase Cloud.

## 2. Infrastructure Inventory
- **Live URL**: [https://neotic-ads.vercel.app](https://neotic-ads.vercel.app)
- **GitHub Repository**: [https://github.com/Pavanspoojary/neotic-ads](https://github.com/Pavanspoojary/neotic-ads)
- **Vercel Project**: `pavanspoojary/neotic-ads`
- **Database Ref**: `bdctppftvcgyopvntrwf` (Supabase AWS us-east-1)

## 3. Pre-Deployment Quality Checklist
Before shipping any commit to `main`:
1. Run static analysis & type checking:
   ```bash
   npx tsc --noEmit
   ```
2. Run comprehensive automated test suite (214 tests):
   ```bash
   node --import tsx --test 'tests/**/*.test.ts'
   ```
3. Verify wiki links and documentation drift:
   ```bash
   python3 .agents/skills/wikiskill/scripts/wiki_cli.py lint
   ```

## 4. Production Deployment Sequence
1. **Commit & Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: description of release"
   git push origin main
   ```
2. **Deploy to Vercel Production**:
   ```bash
   npx vercel --prod
   ```
3. **Verify Live Response**:
   ```bash
   curl -sI https://neotic-ads.vercel.app | head -n 5
   ```
