import { Pool, type QueryResultRow } from "pg";
import { randomUUID } from "node:crypto";
import { seedDemoWorkspaces } from "./demo";

declare global {
  // eslint-disable-next-line no-var
  var __misePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __miseSchema: Promise<void> | undefined;
}
const schema = [
"CREATE TABLE IF NOT EXISTS restaurants(id uuid PRIMARY KEY,name text NOT NULL,slug text NOT NULL UNIQUE,currency text NOT NULL DEFAULT 'CAD',timezone text NOT NULL DEFAULT 'America/Vancouver',tax_rate numeric(7,5) NOT NULL DEFAULT 0.0,tax_rate_verified boolean NOT NULL DEFAULT false,phone text,email text,address text,city text NOT NULL DEFAULT 'Vancouver',province text NOT NULL DEFAULT 'BC',postal_code text,website text,description text,brand_color text NOT NULL DEFAULT '#284b3e',accepting_orders boolean NOT NULL DEFAULT true,accepting_reservations boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())",
"ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false",
"CREATE INDEX IF NOT EXISTS restaurants_demo_idx ON restaurants(is_demo,slug)",
"CREATE TABLE IF NOT EXISTS users(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,name text NOT NULL,email text NOT NULL,password_hash text NOT NULL,role text NOT NULL DEFAULT 'owner' CHECK(role IN ('owner','manager','staff')),active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,email))",
"CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users(lower(email))",
"ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT true",
"CREATE TABLE IF NOT EXISTS email_verification_tokens(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,consumed_at timestamptz,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens(user_id,created_at DESC)",
"CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at)",
"CREATE TABLE IF NOT EXISTS auth_attempts(id bigserial PRIMARY KEY,subject_hash text NOT NULL,success boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS auth_attempts_lookup_idx ON auth_attempts(subject_hash,created_at DESC)",
"CREATE TABLE IF NOT EXISTS categories(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,name text NOT NULL,sort_order integer NOT NULL DEFAULT 0,active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,name))",
"CREATE TABLE IF NOT EXISTS menu_items(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,category_id uuid REFERENCES categories(id) ON DELETE SET NULL,name text NOT NULL,description text,price_cents integer NOT NULL CHECK(price_cents>=0),image_url text,allergens text[] NOT NULL DEFAULT ARRAY[]::text[],dietary_tags text[] NOT NULL DEFAULT ARRAY[]::text[],available boolean NOT NULL DEFAULT true,featured boolean NOT NULL DEFAULT false,sort_order integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS menu_restaurant_idx ON menu_items(restaurant_id,available,sort_order)",
"CREATE TABLE IF NOT EXISTS dining_tables(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,label text NOT NULL,capacity integer NOT NULL DEFAULT 2 CHECK(capacity BETWEEN 1 AND 30),active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,label))",
"CREATE TABLE IF NOT EXISTS customers(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,name text NOT NULL,email text,phone text,marketing_consent boolean NOT NULL DEFAULT false,loyalty_points integer NOT NULL DEFAULT 0,lifetime_spend_cents bigint NOT NULL DEFAULT 0,visit_count integer NOT NULL DEFAULT 0,last_visit_at timestamptz,order_request_count integer NOT NULL DEFAULT 0,last_order_request_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,email))",
"CREATE INDEX IF NOT EXISTS customers_restaurant_idx ON customers(restaurant_id,last_visit_at DESC)",
"CREATE TABLE IF NOT EXISTS customer_consent_events(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,channel text NOT NULL CHECK(channel IN ('email')),purpose text NOT NULL CHECK(purpose IN ('marketing')),decision text NOT NULL CHECK(decision IN ('granted','withdrawn','unverified_legacy')),source text NOT NULL,evidence jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS consent_events_customer_idx ON customer_consent_events(restaurant_id,customer_id,created_at DESC)",
"CREATE TABLE IF NOT EXISTS customer_unsubscribe_tokens(token_hash text PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,expires_at timestamptz,consumed_at timestamptz,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS unsubscribe_tokens_customer_idx ON customer_unsubscribe_tokens(restaurant_id,customer_id,created_at DESC)",
"CREATE TABLE IF NOT EXISTS orders(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,order_number text NOT NULL,order_type text NOT NULL CHECK(order_type IN ('pickup','dine_in')),table_label text,customer_name text NOT NULL,customer_email text,customer_phone text,items_json jsonb NOT NULL,subtotal_cents integer NOT NULL,tax_cents integer NOT NULL,total_cents integer NOT NULL,tax_rate numeric(7,5) NOT NULL,status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','accepted','preparing','ready','completed','cancelled')),payment_method text NOT NULL DEFAULT 'pay_at_pickup' CHECK(payment_method IN ('pay_at_pickup','pay_at_table','cash')),payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded')),notes text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,order_number))",
"CREATE INDEX IF NOT EXISTS orders_restaurant_time_idx ON orders(restaurant_id,created_at DESC)",
"CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(restaurant_id,status)",
"CREATE TABLE IF NOT EXISTS reservations(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,guest_name text NOT NULL,guest_email text,guest_phone text,party_size integer NOT NULL CHECK(party_size BETWEEN 1 AND 30),reserved_for timestamptz NOT NULL,duration_minutes integer NOT NULL DEFAULT 90,notes text,status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','seated','completed','cancelled','no_show')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS reservations_restaurant_time_idx ON reservations(restaurant_id,reserved_for)",
"CREATE TABLE IF NOT EXISTS loyalty_transactions(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,order_id uuid REFERENCES orders(id) ON DELETE SET NULL,points integer NOT NULL,description text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE TABLE IF NOT EXISTS campaigns(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,name text NOT NULL,channel text NOT NULL DEFAULT 'email' CHECK(channel IN ('email','sms','in_store')),audience text NOT NULL DEFAULT 'consented_guests',subject text,body text NOT NULL,status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','sent','cancelled')),scheduled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE TABLE IF NOT EXISTS reviews(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,order_id uuid REFERENCES orders(id) ON DELETE SET NULL,guest_name text NOT NULL,rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),body text,published boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE TABLE IF NOT EXISTS integration_connections(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,provider text NOT NULL,status text NOT NULL DEFAULT 'not_connected' CHECK(status IN ('not_connected','pending','connected','error')),external_account_id text,last_verified_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(restaurant_id,provider))",
"CREATE TABLE IF NOT EXISTS audit_events(id uuid PRIMARY KEY,restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,action text NOT NULL,entity_type text NOT NULL,entity_id text,details jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now())",
"CREATE INDEX IF NOT EXISTS audit_restaurant_time_idx ON audit_events(restaurant_id,created_at DESC)"
].join(";");
export function uid(){return randomUUID();}
export function pool(){
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if(!globalThis.__misePool) globalThis.__misePool=new Pool({connectionString:process.env.DATABASE_URL,max:12,idleTimeoutMillis:30000,connectionTimeoutMillis:10000,application_name:"misenorth"});
  return globalThis.__misePool;
}
export async function db(){
  const p=pool();
  if(!globalThis.__miseSchema){
    globalThis.__miseSchema=(async()=>{
      const client=await p.connect();
      try{
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended('misenorth:schema-v1',0))");
        await client.query(schema);
        await client.query("CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())");
        await client.query("INSERT INTO schema_migrations(version) VALUES('0001_core_schema') ON CONFLICT(version) DO NOTHING");
        const migration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0002_commercial_truth'");
        if(!migration.rowCount){
          await client.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tax_rate_verified boolean NOT NULL DEFAULT false");
          await client.query("ALTER TABLE restaurants ALTER COLUMN tax_rate SET DEFAULT 0");
          await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS order_request_count integer NOT NULL DEFAULT 0");
          await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_request_at timestamptz");
          await client.query(`WITH request_rollup AS (
            SELECT restaurant_id,lower(customer_email) AS email,count(*)::int AS request_count,max(created_at) AS last_request_at
            FROM orders WHERE customer_email IS NOT NULL
            GROUP BY restaurant_id,lower(customer_email)
          )
          UPDATE customers c SET order_request_count=request_rollup.request_count,last_order_request_at=request_rollup.last_request_at
          FROM request_rollup
          WHERE c.restaurant_id=request_rollup.restaurant_id AND lower(c.email)=request_rollup.email`);
          await client.query("CREATE INDEX IF NOT EXISTS customers_request_idx ON customers(restaurant_id,last_order_request_at DESC)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0002_commercial_truth')");
        }
        const rateLimitMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0003_api_rate_limits'");
        if(!rateLimitMigration.rowCount){
          await client.query("CREATE TABLE IF NOT EXISTS api_rate_limits(bucket_hash text NOT NULL,window_start timestamptz NOT NULL,hit_count integer NOT NULL DEFAULT 0 CHECK(hit_count>=0),expires_at timestamptz NOT NULL,PRIMARY KEY(bucket_hash,window_start))");
          await client.query("CREATE INDEX IF NOT EXISTS api_rate_limits_expiry_idx ON api_rate_limits(expires_at)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0003_api_rate_limits')");
        }
        const consentMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0004_guest_consent_ledger'");
        if(!consentMigration.rowCount){
          await client.query(`INSERT INTO customer_consent_events(id,restaurant_id,customer_id,channel,purpose,decision,source,evidence,created_at)
            SELECT gen_random_uuid(),c.restaurant_id,c.id,'email','marketing','unverified_legacy','legacy_boolean_without_evidence',
              jsonb_build_object('migration','0004_guest_consent_ledger','legacy_marketing_consent',true),now()
            FROM customers c
            JOIN restaurants r ON r.id=c.restaurant_id
            WHERE c.marketing_consent=true AND r.is_demo=false
              AND NOT EXISTS(SELECT 1 FROM customer_consent_events e WHERE e.customer_id=c.id AND e.source='legacy_boolean_without_evidence')`);
          await client.query("UPDATE customers c SET marketing_consent=false FROM restaurants r WHERE r.id=c.restaurant_id AND r.is_demo=false AND c.marketing_consent=true");
          await client.query(`INSERT INTO customer_consent_events(id,restaurant_id,customer_id,channel,purpose,decision,source,evidence,created_at)
            SELECT gen_random_uuid(),c.restaurant_id,c.id,'email','marketing','granted','synthetic_demo_fixture',
              jsonb_build_object('synthetic',true,'fixture','demo-scenarios.json'),now()
            FROM customers c
            JOIN restaurants r ON r.id=c.restaurant_id
            WHERE c.marketing_consent=true AND r.is_demo=true
              AND NOT EXISTS(SELECT 1 FROM customer_consent_events e WHERE e.customer_id=c.id AND e.source='synthetic_demo_fixture' AND e.decision='granted')`);
          await client.query("INSERT INTO schema_migrations(version) VALUES('0004_guest_consent_ledger')");
        }
        const emailVerificationMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0005_email_verification'");
        if(!emailVerificationMigration.rowCount){
          await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT true");
          await client.query("CREATE TABLE IF NOT EXISTS email_verification_tokens(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,consumed_at timestamptz,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())");
          await client.query("CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens(user_id,created_at DESC)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0005_email_verification')");
        }
        const billingMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0006_stripe_billing'");
        if(!billingMigration.rowCount){
          await client.query(`CREATE TABLE IF NOT EXISTS misenorth_billing_accounts(
            restaurant_id uuid PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
            stripe_customer_id text UNIQUE,
            stripe_subscription_id text UNIQUE,
            stripe_price_id text,
            quantity integer NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 100),
            unit_amount_cents bigint,
            currency char(3) NOT NULL DEFAULT 'CAD',
            billing_interval text NOT NULL DEFAULT 'month',
            subscription_status text NOT NULL DEFAULT 'not_started' CHECK(subscription_status IN ('not_started','incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')),
            entitlement_status text NOT NULL DEFAULT 'inactive' CHECK(entitlement_status IN ('inactive','active','grace','blocked','review')),
            grace_until timestamptz,
            current_period_start timestamptz,
            current_period_end timestamptz,
            cancel_at_period_end boolean NOT NULL DEFAULT false,
            latest_invoice_id text,
            latest_invoice_status text,
            last_verified_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query(`CREATE TABLE IF NOT EXISTS misenorth_billing_invoices(
            stripe_invoice_id text PRIMARY KEY,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            stripe_subscription_id text,
            stripe_payment_intent_id text,
            stripe_charge_id text,
            amount_due_cents bigint NOT NULL DEFAULT 0,
            amount_paid_cents bigint NOT NULL DEFAULT 0,
            currency char(3) NOT NULL DEFAULT 'CAD',
            status text NOT NULL,
            billing_reason text,
            hosted_invoice_url text,
            invoice_pdf_url text,
            period_start timestamptz,
            period_end timestamptz,
            paid_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS misenorth_billing_invoices_tenant_idx ON misenorth_billing_invoices(restaurant_id,created_at DESC)");
          await client.query(`CREATE TABLE IF NOT EXISTS misenorth_stripe_events(
            stripe_event_id text PRIMARY KEY,
            event_type text NOT NULL,
            object_id text,
            livemode boolean NOT NULL,
            processing_status text NOT NULL DEFAULT 'received' CHECK(processing_status IN ('received','processed','failed','ignored')),
            error_code text,
            received_at timestamptz NOT NULL DEFAULT now(),
            processed_at timestamptz
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS misenorth_stripe_events_status_idx ON misenorth_stripe_events(processing_status,received_at DESC)");
          await client.query(`CREATE TABLE IF NOT EXISTS misenorth_checkout_attempts(
            idempotency_key text PRIMARY KEY,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            stripe_checkout_session_id text UNIQUE,
            checkout_url text,
            expires_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("INSERT INTO schema_migrations(version) VALUES('0006_stripe_billing')");
        }
        const supportMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0007_support_and_privacy_requests'");
        if(!supportMigration.rowCount){
          await client.query(`CREATE TABLE IF NOT EXISTS support_tickets(
            id uuid PRIMARY KEY,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            requester_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            subject text NOT NULL,
            category text NOT NULL CHECK(category IN ('product','billing','security','privacy','data','other')),
            severity text NOT NULL DEFAULT 'normal' CHECK(severity IN ('low','normal','high','critical')),
            description text NOT NULL,
            status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','triaged','in_progress','waiting_customer','resolved','closed')),
            assigned_department text NOT NULL DEFAULT 'support',
            first_response_at timestamptz,
            resolved_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS support_tickets_tenant_idx ON support_tickets(restaurant_id,status,created_at DESC)");
          await client.query(`CREATE TABLE IF NOT EXISTS privacy_requests(
            id uuid PRIMARY KEY,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            requester_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            request_type text NOT NULL CHECK(request_type IN ('data_export','erasure','correction','access')),
            subject text NOT NULL,
            details text NOT NULL,
            status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','identity_review','in_progress','waiting_customer','completed','rejected')),
            outcome_summary text,
            reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            completed_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS privacy_requests_tenant_idx ON privacy_requests(restaurant_id,status,created_at DESC)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0007_support_and_privacy_requests')");
        }
        const invoiceLineMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0008_billing_invoice_lines'");
        if(!invoiceLineMigration.rowCount){
          await client.query(`CREATE TABLE IF NOT EXISTS misenorth_billing_invoice_lines(
            stripe_invoice_line_id text PRIMARY KEY,
            stripe_invoice_id text NOT NULL REFERENCES misenorth_billing_invoices(stripe_invoice_id) ON DELETE CASCADE,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            stripe_price_id text,
            stripe_product_id text,
            description text,
            quantity integer NOT NULL DEFAULT 1,
            amount_cents bigint NOT NULL DEFAULT 0,
            currency char(3) NOT NULL DEFAULT 'CAD',
            line_type text NOT NULL DEFAULT 'unknown' CHECK(line_type IN ('recurring','one_time','unknown')),
            recurring_interval text,
            created_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS misenorth_billing_invoice_lines_tenant_idx ON misenorth_billing_invoice_lines(restaurant_id,line_type,stripe_invoice_id)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0008_billing_invoice_lines')");
        }
        const passwordResetMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0009_password_reset_tokens'");
        if(!passwordResetMigration.rowCount){
          await client.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens(
            token_hash text PRIMARY KEY,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at timestamptz NOT NULL,
            consumed_at timestamptz,
            revoked_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id,created_at DESC)");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0009_password_reset_tokens')");
        }
        const teamInviteMigration=await client.query("SELECT 1 FROM schema_migrations WHERE version='0010_team_invitations'");
        if(!teamInviteMigration.rowCount){
          await client.query(`CREATE TABLE IF NOT EXISTS team_invitations(
            id uuid PRIMARY KEY,
            restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            invited_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
            email text NOT NULL,
            role text NOT NULL CHECK(role IN ('manager','staff')),
            token_hash text NOT NULL UNIQUE,
            expires_at timestamptz NOT NULL,
            accepted_at timestamptz,
            revoked_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
          )`);
          await client.query("CREATE INDEX IF NOT EXISTS team_invitations_tenant_idx ON team_invitations(restaurant_id,created_at DESC)");
          await client.query("CREATE INDEX IF NOT EXISTS team_invitations_pending_email_idx ON team_invitations(restaurant_id,lower(email),expires_at) WHERE accepted_at IS NULL AND revoked_at IS NULL");
          await client.query("INSERT INTO schema_migrations(version) VALUES('0010_team_invitations')");
        }
        await client.query("COMMIT");
      }catch(error){
        try{await client.query("ROLLBACK");}catch{}
        throw error;
      }finally{client.release();}
      if(process.env.MISENORTH_SEED_DEMOS==="true"){
        await seedDemoWorkspaces(p);
      }
    })().catch(error=>{globalThis.__miseSchema=undefined;throw error;});
  }
  await globalThis.__miseSchema;
  return p;
}
export async function query<T extends QueryResultRow=any>(sql:string,values:unknown[]=[]){return (await db()).query<T>(sql,values);}
export async function audit(rid:string,actor:string|null,action:string,type:string,id?:string,details:Record<string,unknown>={}){await query("INSERT INTO audit_events(id,restaurant_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6,$7)",[uid(),rid,actor,action,type,id||null,JSON.stringify(details)]);}
