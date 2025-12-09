#!/bin/bash

# Quick Fix Script for Visitor Tracking
# This will implement the server-side solution (recommended)

echo "🔧 Fixing Visitor Tracking..."
echo ""

# Step 1: Backup the old component
if [ -f "components/VisitorTracker.tsx" ]; then
    echo "📦 Backing up old VisitorTracker.tsx..."
    cp components/VisitorTracker.tsx components/VisitorTracker-OLD-$(date +%Y%m%d-%H%M%S).tsx
fi

# Step 2: Replace with new server-side version
echo "✅ Installing new server-side VisitorTracker..."
cp components/VisitorTracker-ServerSide.tsx components/VisitorTracker.tsx

echo ""
echo "✅ Done! Now run:"
echo ""
echo "  git add ."
echo "  git commit -m 'fix: use server-side visitor tracking'"
echo "  git push"
echo ""
echo "📚 For more info, see: VISITOR_TRACKING_FIX_README.md"
