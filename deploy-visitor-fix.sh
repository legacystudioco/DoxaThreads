#!/bin/bash

echo "🔧 Visitor Tracking Quick Fix"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the DoxaThreads root directory"
    exit 1
fi

echo "✅ Step 1: Backing up old VisitorTracker..."
if [ -f "components/VisitorTracker.tsx" ]; then
    BACKUP_NAME="components/VisitorTracker-backup-$(date +%Y%m%d-%H%M%S).tsx"
    cp components/VisitorTracker.tsx "$BACKUP_NAME"
    echo "   Backed up to: $BACKUP_NAME"
fi

echo ""
echo "✅ Step 2: Installing server-side VisitorTracker..."
cp components/VisitorTracker-ServerSide.tsx components/VisitorTracker.tsx
echo "   New component installed!"

echo ""
echo "✅ Step 3: Staging changes..."
git add app/api/track-visitor/route.ts
git add components/VisitorTracker.tsx
git add SOLUTION_SUMMARY.md
git add VISITOR_TRACKING_FIX_README.md

echo ""
echo "=============================="
echo "✅ All done! Ready to deploy."
echo ""
echo "Next steps:"
echo ""
echo "1. Commit and push:"
echo "   git commit -m 'fix: implement server-side visitor tracking'"
echo "   git push"
echo ""
echo "2. Add SUPABASE_SERVICE_ROLE_KEY to Vercel:"
echo "   https://vercel.com/settings/environment-variables"
echo "   (Copy from .env.local)"
echo ""
echo "3. Test at: https://www.doxa-threads.com"
echo ""
echo "📚 For troubleshooting, see: SOLUTION_SUMMARY.md"
echo ""
