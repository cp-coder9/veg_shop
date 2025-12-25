# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### Environment Configuration

- [ ] **Backend .env file created**
  - [ ] `DATABASE_URL` set to production database
  - [ ] `JWT_SECRET` is strong (min 32 chars, generated with `openssl rand -base64 32`)
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` configured (default: 3000)
  - [ ] `CORS_ORIGIN` set to production frontend URL

- [ ] **External Services Configured**
  - [ ] WhatsApp Business API credentials set
    - [ ] `WHATSAPP_API_URL`
    - [ ] `WHATSAPP_API_TOKEN`
    - [ ] `WHATSAPP_PHONE_NUMBER_ID`
  - [ ] SendGrid email service configured
    - [ ] `SENDGRID_API_KEY`
    - [ ] `SENDGRID_FROM_EMAIL` (verified sender)

- [ ] **Frontend .env file created**
  - [ ] `VITE_API_URL` points to production backend

- [ ] **Docker Compose .env file created** (if using Docker)
  - [ ] All required variables set
  - [ ] Strong passwords for database

### Database Setup

- [ ] **Production database provisioned**
  - [ ] PostgreSQL 16+ instance created
  - [ ] SSL/TLS enabled
  - [ ] Firewall rules configured
  - [ ] Connection string obtained

- [ ] **Database access configured**
  - [ ] Database user created with appropriate permissions
  - [ ] IP whitelist configured (if applicable)
  - [ ] Connection tested from deployment environment

- [ ] **Backup strategy in place**
  - [ ] Automated daily backups enabled
  - [ ] Backup retention policy set (30 days recommended)
  - [ ] Backup restore procedure tested

### Security Review

- [ ] **Secrets Management**
  - [ ] No secrets committed to version control
  - [ ] `.env` files in `.gitignore`
  - [ ] Production secrets stored securely (platform env vars or secret manager)

- [ ] **JWT Configuration**
  - [ ] `JWT_SECRET` is unique and strong
  - [ ] Token expiration times appropriate (15m access, 7d refresh)
  - [ ] Not using default/example secrets

- [ ] **API Keys**
  - [ ] All API keys are production keys (not test/sandbox)
  - [ ] API keys have minimum required permissions
  - [ ] Rate limits configured appropriately

- [ ] **CORS Configuration**
  - [ ] `CORS_ORIGIN` set to production domain(s) only
  - [ ] No wildcard (`*`) CORS in production

### Code Review

- [ ] **Latest code deployed**
  - [ ] All tests passing
  - [ ] No console.log statements in production code
  - [ ] Error handling implemented
  - [ ] Linting passes

- [ ] **Dependencies updated**
  - [ ] No critical security vulnerabilities (`npm audit`)
  - [ ] Dependencies up to date
  - [ ] Lock files committed

## Deployment

### Build and Deploy

- [ ] **Docker images built**
  ```bash
  docker-compose -f docker-compose.prod.yml build
  ```

- [ ] **Database migrations run**
  ```bash
  docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy
  ```

- [ ] **Database seeded** (first deployment only)
  ```bash
  docker-compose -f docker-compose.prod.yml run backend npm run prisma:seed
  ```
  - [ ] Admin user credentials noted
  - [ ] Sample customers removed (if not needed)

- [ ] **Services started**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```

### Verification

- [ ] **Services running**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
  - [ ] All containers in "Up" state
  - [ ] No restart loops

- [ ] **Health checks passing**
  - [ ] Backend health endpoint: `curl https://api.yourdomain.com/health`
  - [ ] Frontend accessible: `curl https://yourdomain.com`
  - [ ] Database connection working

- [ ] **Logs reviewed**
  ```bash
  docker-compose -f docker-compose.prod.yml logs
  ```
  - [ ] No critical errors
  - [ ] Configuration logged correctly
  - [ ] External services connected

### Functional Testing

- [ ] **Authentication works**
  - [ ] Can request verification code
  - [ ] Verification code received (WhatsApp/Email)
  - [ ] Can login with code
  - [ ] JWT tokens issued correctly

- [ ] **Admin functions work**
  - [ ] Can login as admin
  - [ ] Can view/edit products
  - [ ] Can view orders
  - [ ] Can generate invoices
  - [ ] Can record payments

- [ ] **Customer functions work**
  - [ ] Can login as customer
  - [ ] Can view products
  - [ ] Can place order
  - [ ] Can view order history

- [ ] **External integrations work**
  - [ ] WhatsApp messages sending
  - [ ] Emails sending
  - [ ] PDFs generating correctly

## Post-Deployment

### Monitoring Setup

- [ ] **Logging configured**
  - [ ] Application logs accessible
  - [ ] Error tracking enabled (Sentry, etc.)
  - [ ] Log retention policy set

- [ ] **Monitoring enabled**
  - [ ] Uptime monitoring configured
  - [ ] Performance monitoring enabled
  - [ ] Database monitoring active

- [ ] **Alerts configured**
  - [ ] Critical error alerts
  - [ ] Downtime alerts
  - [ ] High resource usage alerts

### Documentation

- [ ] **Deployment documented**
  - [ ] Deployment date recorded
  - [ ] Version/commit hash noted
  - [ ] Configuration changes documented

- [ ] **Access documented**
  - [ ] Admin credentials stored securely
  - [ ] Database access documented
  - [ ] Server access documented

- [ ] **Runbook created**
  - [ ] Common issues and solutions
  - [ ] Rollback procedure
  - [ ] Emergency contacts

### Performance

- [ ] **Performance tested**
  - [ ] Page load times acceptable
  - [ ] API response times acceptable
  - [ ] Database queries optimized

- [ ] **Scaling configured**
  - [ ] Resource limits set appropriately
  - [ ] Auto-scaling configured (if applicable)
  - [ ] Load balancing configured (if applicable)

### Backup and Recovery

- [ ] **Backup verified**
  - [ ] First backup completed successfully
  - [ ] Backup restoration tested
  - [ ] Backup monitoring enabled

- [ ] **Disaster recovery plan**
  - [ ] Recovery time objective (RTO) defined
  - [ ] Recovery point objective (RPO) defined
  - [ ] Recovery procedure documented

## Ongoing Maintenance

### Daily

- [ ] Check application logs for errors
- [ ] Monitor uptime and performance
- [ ] Review error tracking dashboard

### Weekly

- [ ] Review database performance
- [ ] Check disk space usage
- [ ] Review API usage and rate limits
- [ ] Check backup status

### Monthly

- [ ] Update dependencies (security patches)
- [ ] Review and rotate API keys
- [ ] Test backup restoration
- [ ] Review and optimize database
- [ ] Review monitoring alerts and thresholds

### Quarterly

- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill
- [ ] Review and update documentation

## Rollback Procedure

If issues occur after deployment:

1. **Identify the issue**
   - [ ] Check logs
   - [ ] Check monitoring
   - [ ] Identify affected functionality

2. **Decide on rollback**
   - [ ] Issue is critical
   - [ ] Cannot be fixed quickly
   - [ ] Affects core functionality

3. **Execute rollback**
   ```bash
   # Stop current deployment
   docker-compose -f docker-compose.prod.yml down
   
   # Checkout previous version
   git checkout <previous-commit>
   
   # Rebuild and deploy
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Rollback database** (if needed)
   ```bash
   # Restore from backup
   docker-compose exec postgres psql -U postgres organic_veg_db < backup.sql
   ```

5. **Verify rollback**
   - [ ] Services running
   - [ ] Functionality restored
   - [ ] Users notified

6. **Post-mortem**
   - [ ] Document what went wrong
   - [ ] Identify root cause
   - [ ] Plan fix for next deployment

## Emergency Contacts

- **System Administrator**: [Name/Contact]
- **Database Administrator**: [Name/Contact]
- **On-Call Developer**: [Name/Contact]
- **Hosting Provider Support**: [Contact/URL]
- **WhatsApp API Support**: [Contact/URL]
- **SendGrid Support**: [Contact/URL]

## Notes

- Keep this checklist updated as deployment process evolves
- Document any deviations from standard procedure
- Review and improve checklist after each deployment
