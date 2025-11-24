# DOXA Threads - Launch Checklist

## ✅ Completed (Rebranding)

### Code & Content
- [x] Updated package.json with new brand name
- [x] Rebranded all page titles and meta descriptions
- [x] Updated header/footer with new branding
- [x] Removed all tattoo-related content
- [x] Created new homepage focused on monochrome streetwear
- [x] Updated all store pages with new messaging
- [x] Updated policy pages (Privacy, Terms, Shipping)
- [x] Created About page with brand story
- [x] Created Contact page with FAQ
- [x] Updated all email references to new domain
- [x] Updated order confirmation messaging
- [x] Updated all UI copy to calm, premium brand voice
- [x] Preserved all core functionality (checkout, cart, admin)

### Documentation
- [x] Created comprehensive changelog (REBRANDING_CHANGELOG.md)
- [x] Created brand guidelines (BRAND_GUIDELINES.md)
- [x] Created launch checklist (this file)

---

## 🔲 To Do Before Launch

### 1. Visual Assets (CRITICAL)
- [ ] Create DOXA Threads logo files (PNG, SVG)
  - Header logo (text or graphic)
  - Footer logo
  - Favicon
  - Social media profile images
- [ ] Replace banner images in `/public/assets/`
  - Desktop banner (hero section)
  - Mobile banner (hero section)
- [ ] Remove old brand assets
  - Delete any legacy logo/banner files once new ones are uploaded
  - Delete tattoo-related images
  - Delete old sponsor/partner logos
- [ ] Create product photography
  - Tees (front/back on model)
  - Hoodies (front/back on model)
  - Crewnecks (front/back on model)
  - Flat lay product shots
  - Detail shots of quality

### 2. Environment Variables
- [ ] Update email configuration
  ```
  EMAIL_FROM=DOXA Threads <hello@doxathreads.com>
  ```
- [ ] Verify Stripe configuration
  - [ ] Update business name in Stripe account
  - [ ] Verify webhook endpoints
  - [ ] Test payment flow
- [ ] Update Resend email domain
  - [ ] Add doxathreads.com to Resend
  - [ ] Verify DNS records
  - [ ] Test email sending
- [ ] Update Supabase configuration (if needed)
  - [ ] Verify database access
  - [ ] Check RLS policies
  - [ ] Test authentication

### 3. Domain & Hosting
- [ ] Register domain: doxathreads.com
- [ ] Configure DNS records
  - [ ] A record for main site
  - [ ] MX records for email
  - [ ] TXT records for email verification (Resend)
- [ ] Deploy to production (Vercel)
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Configure custom domain
  - [ ] Enable SSL certificate
- [ ] Set up email forwarding/inbox
  - [ ] hello@doxathreads.com
  - [ ] orders@doxathreads.com
  - [ ] shipping@doxathreads.com
  - [ ] support@doxathreads.com
  - [ ] privacy@doxathreads.com

### 4. Content & Products
- [ ] Create initial product collection
  - [ ] Design at least 4-6 unique designs
  - [ ] Create product descriptions
  - [ ] Set pricing strategy
  - [ ] Add products to database
- [ ] Write detailed product descriptions
  - [ ] Include faith message
  - [ ] Highlight quality
  - [ ] Add care instructions
- [ ] Create size charts for each product type
- [ ] Set up product categories
  - [ ] Tees
  - [ ] Hoodies
  - [ ] Crewnecks

### 5. Legal & Compliance
- [ ] Review and customize Terms of Service
- [ ] Review and customize Privacy Policy
- [ ] Review and customize Shipping Policy
- [ ] Add disclaimer about shipping times
- [ ] Set up cookie consent (if required)
- [ ] Register trademark for "DOXA Threads" (recommended)

### 6. Payment & Shipping
- [ ] Configure Stripe account
  - [ ] Business information
  - [ ] Bank account connection
  - [ ] Tax settings
- [ ] Set up shipping rates in Shippo
  - [ ] Configure carrier accounts
  - [ ] Set shipping zones
  - [ ] Test rate calculations
- [ ] Configure tax settings
  - [ ] Sales tax collection
  - [ ] Tax nexus states

### 7. Email Marketing
- [ ] Set up email service (Resend is configured)
- [ ] Create email templates
  - [ ] Order confirmation
  - [ ] Shipping notification
  - [ ] Delivery confirmation
  - [ ] Order status updates
- [ ] Test all automated emails
- [ ] Create welcome email sequence (optional)
- [ ] Set up abandoned cart emails (optional)

### 8. Testing
- [ ] Test complete checkout flow
  - [ ] Add to cart
  - [ ] Update quantities
  - [ ] Apply discount codes (if applicable)
  - [ ] Enter shipping info
  - [ ] Complete payment
  - [ ] Verify order confirmation
- [ ] Test email notifications
  - [ ] Order confirmation email
  - [ ] Shipping notification email
- [ ] Test on multiple devices
  - [ ] Desktop (Chrome, Firefox, Safari)
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Tablet
- [ ] Test responsive design
  - [ ] Homepage
  - [ ] Store pages
  - [ ] Product pages
  - [ ] Checkout flow
  - [ ] Cart page
- [ ] Verify all navigation links work
- [ ] Test product filtering/search
- [ ] Verify image loading performance

### 9. Analytics & Tracking
- [ ] Set up Google Analytics 4
- [ ] Configure conversion tracking
  - [ ] Add to cart events
  - [ ] Purchase events
  - [ ] Page view events
- [ ] Set up Facebook Pixel (optional)
- [ ] Configure Stripe Analytics dashboard
- [ ] Set up error monitoring (optional)
  - [ ] Sentry or similar service

### 10. Social Media Setup
- [ ] Create Instagram account (@doxathreads)
- [ ] Create Facebook page
- [ ] Create TikTok account (optional)
- [ ] Create X/Twitter account (optional)
- [ ] Design social media graphics
  - [ ] Profile images
  - [ ] Cover photos
  - [ ] Story templates
  - [ ] Post templates
- [ ] Create content calendar
- [ ] Prepare launch announcement posts

### 11. Pre-Launch Marketing
- [ ] Build email list
  - [ ] Create landing page
  - [ ] Offer launch discount/incentive
- [ ] Create launch announcement strategy
- [ ] Plan influencer outreach (optional)
- [ ] Prepare press release (optional)
- [ ] Create launch day content
  - [ ] Social media posts
  - [ ] Email announcement
  - [ ] Website banner

### 12. Customer Service
- [ ] Create customer service guidelines
- [ ] Prepare FAQ responses
- [ ] Set up support ticketing system (optional)
- [ ] Create response templates
  - [ ] Order status inquiries
  - [ ] Shipping questions
  - [ ] Return/exchange requests
  - [ ] Product questions
- [ ] Train customer service team (if applicable)

---

## 📋 Launch Day Checklist

### Morning of Launch
- [ ] Verify all products are active in database
- [ ] Test checkout flow one final time
- [ ] Verify email sending works
- [ ] Check inventory levels
- [ ] Confirm shipping rates are correct
- [ ] Verify payment processing works

### Launch Time
- [ ] Publish launch announcement on social media
- [ ] Send email to mailing list
- [ ] Enable Google/Facebook ads (if planned)
- [ ] Monitor website analytics
- [ ] Watch for order notifications
- [ ] Monitor customer service channels

### First 24 Hours
- [ ] Respond to all customer inquiries promptly
- [ ] Monitor order flow
- [ ] Check for any errors/issues
- [ ] Engage with social media comments
- [ ] Thank early customers
- [ ] Address any technical issues immediately

---

## 🚀 Post-Launch (First Week)

### Days 1-3
- [ ] Process first orders quickly
- [ ] Send personal thank-you notes to first customers
- [ ] Gather customer feedback
- [ ] Monitor for any site issues
- [ ] Post regularly on social media
- [ ] Respond to all inquiries within 24 hours

### Days 4-7
- [ ] Review analytics and metrics
- [ ] Adjust marketing based on data
- [ ] Create content from customer photos (with permission)
- [ ] Address any recurring issues
- [ ] Plan next product drops/releases
- [ ] Send shipping notifications promptly

---

## 🎯 First Month Goals

### Sales & Marketing
- [ ] Reach X number of orders
- [ ] Build email list to X subscribers
- [ ] Achieve X social media followers
- [ ] Generate X amount in revenue
- [ ] Establish posting rhythm on social

### Product & Operations
- [ ] Gather customer testimonials
- [ ] Get product photography from customers
- [ ] Optimize product descriptions based on questions
- [ ] Streamline order fulfillment process
- [ ] Identify best-selling designs

### Community Building
- [ ] Feature customer stories
- [ ] Create content showcasing craft and intention
- [ ] Engage with minimalist/design-forward communities
- [ ] Partner with aligned initiatives (if applicable)
- [ ] Build brand recognition in target market

---

## ⚠️ Critical Priorities

### Must-Have Before Launch
1. **Products**: At least 4-6 designs ready to sell
2. **Payment**: Stripe fully configured and tested
3. **Shipping**: Rates calculated correctly
4. **Emails**: Automated notifications working
5. **Domain**: doxathreads.com live and SSL enabled

### Nice-to-Have Before Launch
- Social media presence established
- Email list with subscribers
- Content calendar prepared
- Customer service guidelines ready
- Analytics tracking configured

---

## 📞 Support Contacts

### Technical Issues
- Vercel Support: [support.vercel.com]
- Stripe Support: [stripe.com/support]
- Supabase Support: [supabase.com/support]

### Design/Development
- [Your contact info here]

### Business Questions
- [Business partner contact here]

---

## 📊 Success Metrics to Track

### Week 1
- Total orders
- Total revenue
- Average order value
- Conversion rate
- Traffic sources
- Most popular products

### Month 1
- Customer acquisition cost
- Repeat purchase rate
- Email open/click rates
- Social media engagement
- Customer satisfaction
- Return/exchange rate

---

## 🎉 Celebration Milestones

- [ ] First order placed
- [ ] First 10 orders
- [ ] First 50 orders
- [ ] First 100 orders
- [ ] First $1,000 in sales
- [ ] First $10,000 in sales
- [ ] First customer testimonial
- [ ] First customer photo shared
- [ ] First partnership established
- [ ] First ministry donation made

---

## Notes & Reminders

### Important Dates
- Launch Date: [TBD]
- First Product Drop: [TBD]
- First Ministry Partnership: [TBD]

### Key Contacts
- Printer/Fulfillment: [TBD]
- Ministry Partners: [TBD]
- Graphic Designer: [TBD]

### Lessons Learned
[Space for notes during launch process]

---

*Last Updated: November 2024*
*Version 1.0 - Pre-Launch*
