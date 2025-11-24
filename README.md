# DOXA Threads - Project README

## 🎯 Project Overview

**DOXA Threads** is a black-and-white streetwear label built for quiet, confident expression. DOXA means “glory” in Greek—we reflect it without shouting. This is a fully-functional e-commerce platform built with Next.js, Supabase, Stripe, and Shippo.

### Brand Mission
Craft monochrome pieces that carry weight with restraint. Premium materials, disciplined typography, and subtle references that nod to glory without claiming it.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Shipping**: Shippo
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## 📁 Project Structure

```
DoxaThreads/
├── app/                      # Next.js app directory
│   ├── about/               # Brand story page
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API routes
│   ├── contact/             # Contact page
│   ├── privacy/             # Privacy policy
│   ├── shipping/            # Shipping policy
│   ├── store/               # E-commerce pages
│   │   ├── cart/           # Shopping cart
│   │   ├── checkout/       # Checkout flow
│   │   ├── products/       # Product pages
│   │   └── orders/         # Order tracking
│   ├── studio/              # Studio dashboard (admin)
│   ├── terms/               # Terms of service
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/              # React components
├── lib/                     # Utility libraries
│   ├── db.ts               # Database helpers
│   ├── email.ts            # Email functions
│   ├── shipping.ts         # Shipping logic
│   ├── stripe.ts           # Stripe integration
│   └── supabase-*.ts       # Supabase clients
├── public/                  # Static assets
│   └── assets/             # Images, logos
├── styles/                  # Global styles
│   └── globals.css         # Tailwind + custom CSS
└── [config files]          # Various config files
```

---

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Shippo
SHIPPO_API_KEY=your_shippo_api_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=DOXA Threads <hello@doxathreads.com>

# Studio Auth (Optional)
STUDIO_JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=your_admin_password
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Stripe account
- Shippo account
- Resend account

### Installation

1. **Clone the repository**
```bash
cd DoxaThreads
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

4. **Run database migrations** (if needed)
```bash
# Run any pending Supabase migrations
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

---

## 📦 Key Features

### Customer-Facing
- ✅ Product browsing with filtering
- ✅ Product detail pages with variants (size, color)
- ✅ Shopping cart with local storage
- ✅ Checkout with Stripe integration
- ✅ Real-time shipping rate calculation
- ✅ Order confirmation and tracking
- ✅ Responsive design (mobile-first)

### Admin/Studio
- ✅ Product management (CRUD)
- ✅ Order management and tracking
- ✅ Inventory management
- ✅ Analytics dashboard
- ✅ Customer data access

### Technical
- ✅ Server-side rendering (SSR)
- ✅ API route handlers
- ✅ Database queries with Supabase
- ✅ Payment processing with Stripe
- ✅ Shipping integration with Shippo
- ✅ Email notifications with Resend
- ✅ Authentication with Supabase Auth

---

## 🗄️ Database Schema

### Key Tables
- `products` - Product catalog
- `variants` - Product variants (size, color, price)
- `product_images` - Product images with metadata
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `users` - Customer accounts (optional)

### Relationships
- Products → Variants (one-to-many)
- Products → Product Images (one-to-many)
- Orders → Order Items (one-to-many)
- Order Items → Variants (many-to-one)

---

## 🎨 Customization Guide

### Updating Brand Colors
Edit `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      // Add custom brand colors
      brand: {
        primary: '#000000',
        secondary: '#FFFFFF',
      }
    }
  }
}
```

### Modifying Styles
Edit `styles/globals.css` for global styles and component classes.

### Adding Products
1. Go to `/studio/products/new`
2. Fill in product details
3. Upload product images
4. Add variants (sizes, colors)
5. Publish product

---

## 📧 Email Templates

Email templates are defined in:
- `/lib/email.ts` - Core email functions
- API routes handle email triggers

Customize email content in the respective API routes that send emails.

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**
   - Link your repository to Vercel

2. **Configure Environment Variables**
   - Add all variables from `.env.local`

3. **Set Build Settings**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**
   - Push to main branch triggers automatic deployment

### Custom Domain
1. Add domain in Vercel project settings
2. Configure DNS records as instructed
3. Enable SSL (automatic with Vercel)

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Add product to cart
- [ ] Update cart quantities
- [ ] Complete checkout flow
- [ ] Verify order confirmation email
- [ ] Check order in admin dashboard
- [ ] Test shipping rate calculation
- [ ] Verify payment processing

### Test Cards (Stripe)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

---

## 📚 Documentation

- [REBRANDING_CHANGELOG.md](./REBRANDING_CHANGELOG.md) - Complete list of all rebranding changes
- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md) - Brand voice, messaging, and identity
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) - Pre-launch tasks and post-launch goals

---

## 🔒 Security Notes

### Critical Security Practices
1. **Never commit** `.env.local` to version control
2. **Use environment variables** for all sensitive data
3. **Enable RLS** (Row Level Security) in Supabase
4. **Validate all inputs** on both client and server
5. **Use HTTPS** in production (Vercel handles this)
6. **Keep dependencies updated** regularly

### Recommended Security Additions
- Rate limiting on API routes
- CSRF protection
- Input sanitization
- SQL injection prevention (Supabase handles this)

---

## 🐛 Troubleshooting

### Common Issues

**Stripe webhook not working:**
- Verify webhook secret in environment variables
- Check webhook endpoint URL in Stripe dashboard
- Ensure endpoint is publicly accessible

**Shipping rates not calculating:**
- Verify Shippo API key
- Check address format
- Ensure product weights are set

**Email not sending:**
- Verify Resend API key
- Check EMAIL_FROM format
- Verify domain DNS records

**Database connection issues:**
- Check Supabase URL and keys
- Verify network connectivity
- Check RLS policies

---

## 📞 Support & Resources

### External Services
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Shippo API Docs](https://goshippo.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)

---

## 📝 License

Copyright © 2024 DOXA Threads. All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- Next.js by Vercel
- Supabase
- Stripe
- Tailwind CSS
- And many other amazing open-source projects

---

## 📈 Roadmap

### Phase 1: Launch (Current)
- [x] Complete rebranding
- [ ] Add initial product collection
- [ ] Launch marketing campaign
- [ ] Go live on doxathreads.com

### Phase 2: Growth
- [ ] Add more product categories
- [ ] Implement customer reviews
- [ ] Launch referral program
- [ ] Add wishlists
- [ ] Enable international shipping

### Phase 3: Scale
- [ ] Mobile app (React Native)
- [ ] Subscription boxes
- [ ] Limited edition drops
- [ ] Wholesale program
- [ ] Ministry partnerships

---

*For questions or issues, contact: hello@doxathreads.com*
