# Fix GitHub Push Protection by rewriting history
Write-Host "🔧 Fixing git history to remove secret..." -ForegroundColor Yellow

# Create a backup branch
git branch backup-before-history-rewrite

# Remove the problematic commit from history
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch PUSH_TO_GITHUB.md" `
  --prune-empty --tag-name-filter cat -- --all

# Force push (this will update Railway too)
Write-Host "`n⚠️  About to force push - this will rewrite history" -ForegroundColor Red
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host

git push origin --force --all

Write-Host "`n✅ Done! History cleaned and pushed." -ForegroundColor Green
