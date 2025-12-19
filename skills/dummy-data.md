---
name: dummy-data
description: Generate realistic dummy/seed data for databases, APIs, and UI testing. Creates clients, users, products, transactions, and any data type. Use when seeding databases or creating demo content.
---

# Dummy Data Generator Skill

Generate realistic seed data for databases, demos, and testing.

## Quick Generation Methods

### Method 1: Direct SQL (Supabase)
Best for: Quick seeding with RLS bypass

```sql
-- Disable RLS temporarily
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Insert data
INSERT INTO table_name (...) VALUES (...);

-- Re-enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Method 2: JavaScript/TypeScript
Best for: Complex relationships, randomization

```typescript
import { faker } from '@faker-js/faker';

const generateUsers = (count: number) => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    createdAt: faker.date.past()
  }));
};
```

### Method 3: Multi-Agent Generation
Best for: Large datasets with variety

```
spawn_agents({
  tasks: [
    { id: "gen-1", task: "Generate 50 realistic client profiles for a wealth management app" },
    { id: "gen-2", task: "Generate 100 transaction records with realistic amounts and dates" },
    { id: "gen-3", task: "Generate 30 company entities with parent-child relationships" }
  ],
  model: "devstral-free"
})
```

## Data Templates by Type

### Users/Clients

```sql
INSERT INTO clients (name, email, phone, industry, aum, status, created_at) VALUES
('Robert Wellington III', 'r.wellington@email.com', '+1-555-0101', 'Private Equity', 450000000, 'active', NOW() - INTERVAL '2 years'),
('Sophia Chen-Nakamura', 'sophia.cn@email.com', '+1-555-0102', 'Biotechnology', 180000000, 'active', NOW() - INTERVAL '18 months'),
('Al-Rashid Family Office', 'contact@alrashid.ae', '+971-4-555-0103', 'Real Estate', 1200000000, 'active', NOW() - INTERVAL '3 years'),
('Elena Volkov-Petrov', 'elena.vp@email.com', '+1-555-0104', 'Art & Luxury', 95000000, 'pending', NOW() - INTERVAL '6 months'),
('Morrison Healthcare Trust', 'info@morrisontrust.com', '+1-555-0105', 'Healthcare', 145000000, 'active', NOW() - INTERVAL '1 year');
```

### Products/Items

```sql
INSERT INTO products (name, description, price, category, sku, stock, image_url) VALUES
('Premium Widget Pro', 'High-end widget with advanced features', 299.99, 'Electronics', 'WGT-PRO-001', 150, 'https://picsum.photos/seed/product1/400'),
('Basic Gadget', 'Entry-level gadget for beginners', 49.99, 'Electronics', 'GDG-BSC-001', 500, 'https://picsum.photos/seed/product2/400'),
('Deluxe Service Package', 'All-inclusive service for 1 year', 999.00, 'Services', 'SVC-DLX-001', NULL, 'https://picsum.photos/seed/product3/400'),
('Organic Coffee Blend', 'Premium arabica beans, fair trade', 24.99, 'Food & Beverage', 'COF-ORG-001', 200, 'https://picsum.photos/seed/product4/400'),
('Wireless Earbuds X', 'Noise-canceling, 24hr battery', 149.99, 'Electronics', 'EAR-WRL-001', 75, 'https://picsum.photos/seed/product5/400');
```

### Transactions

```sql
INSERT INTO transactions (user_id, amount, type, description, status, created_at) VALUES
('uuid-here', 15000.00, 'deposit', 'Initial deposit', 'completed', NOW() - INTERVAL '30 days'),
('uuid-here', -2500.00, 'withdrawal', 'Monthly expenses', 'completed', NOW() - INTERVAL '25 days'),
('uuid-here', 8750.50, 'dividend', 'Q4 dividend payment', 'completed', NOW() - INTERVAL '20 days'),
('uuid-here', -500.00, 'fee', 'Management fee', 'completed', NOW() - INTERVAL '15 days'),
('uuid-here', 25000.00, 'transfer', 'Wire transfer from external', 'pending', NOW() - INTERVAL '2 days');
```

### Blog Posts/Articles

```sql
INSERT INTO posts (title, slug, content, author_id, status, published_at) VALUES
('10 Tips for Better Productivity', 'productivity-tips', 'Lorem ipsum...', 'author-uuid', 'published', NOW() - INTERVAL '7 days'),
('The Future of AI in 2025', 'ai-future-2025', 'Lorem ipsum...', 'author-uuid', 'published', NOW() - INTERVAL '14 days'),
('How to Build a Startup', 'build-startup-guide', 'Lorem ipsum...', 'author-uuid', 'draft', NULL),
('Investment Strategies for Beginners', 'investment-basics', 'Lorem ipsum...', 'author-uuid', 'published', NOW() - INTERVAL '21 days');
```

### E-commerce Orders

```sql
INSERT INTO orders (user_id, total, status, shipping_address, items, created_at) VALUES
('user-uuid', 349.98, 'delivered', '{"street": "123 Main St", "city": "New York", "zip": "10001"}', '[{"sku": "WGT-PRO-001", "qty": 1}, {"sku": "GDG-BSC-001", "qty": 1}]', NOW() - INTERVAL '10 days'),
('user-uuid', 999.00, 'processing', '{"street": "456 Oak Ave", "city": "Los Angeles", "zip": "90001"}', '[{"sku": "SVC-DLX-001", "qty": 1}]', NOW() - INTERVAL '2 days'),
('user-uuid', 74.97, 'shipped', '{"street": "789 Pine Rd", "city": "Chicago", "zip": "60601"}', '[{"sku": "COF-ORG-001", "qty": 3}]', NOW() - INTERVAL '5 days');
```

## JavaScript Generation Functions

### Install Faker
```bash
npm install @faker-js/faker
```

### User Generator
```typescript
import { faker } from '@faker-js/faker';

export const generateUser = () => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: faker.location.country()
  },
  createdAt: faker.date.past(),
  role: faker.helpers.arrayElement(['user', 'admin', 'moderator'])
});

export const generateUsers = (count: number) =>
  Array.from({ length: count }, generateUser);
```

### Financial Data Generator
```typescript
export const generateTransaction = (userId: string) => ({
  id: faker.string.uuid(),
  userId,
  amount: faker.number.float({ min: -10000, max: 50000, fractionDigits: 2 }),
  type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'transfer', 'dividend', 'fee']),
  description: faker.finance.transactionDescription(),
  status: faker.helpers.arrayElement(['pending', 'completed', 'failed']),
  createdAt: faker.date.recent({ days: 90 })
});

export const generatePortfolio = (userId: string) => ({
  id: faker.string.uuid(),
  userId,
  name: `${faker.word.adjective()} ${faker.helpers.arrayElement(['Growth', 'Income', 'Balanced', 'Aggressive'])} Portfolio`,
  totalValue: faker.number.float({ min: 10000, max: 5000000, fractionDigits: 2 }),
  holdings: Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, () => ({
    ticker: faker.finance.currencyCode(),
    name: faker.company.name(),
    shares: faker.number.int({ min: 10, max: 1000 }),
    price: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
    weight: faker.number.float({ min: 1, max: 20, fractionDigits: 2 })
  }))
});
```

### Company/Entity Generator
```typescript
export const generateCompany = () => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  industry: faker.helpers.arrayElement([
    'Technology', 'Healthcare', 'Finance', 'Real Estate',
    'Manufacturing', 'Retail', 'Energy', 'Entertainment'
  ]),
  website: faker.internet.url(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  employees: faker.number.int({ min: 10, max: 10000 }),
  revenue: faker.number.float({ min: 100000, max: 100000000, fractionDigits: 2 }),
  founded: faker.date.past({ years: 50 }),
  description: faker.company.catchPhrase()
});
```

## Supabase Seed Script Template

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
);

async function seed() {
  console.log('Seeding database...');

  // Generate users
  const users = Array.from({ length: 10 }, () => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    // ... other fields
  }));

  const { data: insertedUsers, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) throw error;
  console.log(`Inserted ${insertedUsers.length} users`);

  // Generate related data using inserted IDs
  for (const user of insertedUsers) {
    const transactions = Array.from({ length: 20 }, () => ({
      user_id: user.id,
      amount: faker.number.float({ min: -5000, max: 10000, fractionDigits: 2 }),
      // ... other fields
    }));

    await supabase.from('transactions').insert(transactions);
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);
```

### Run Seed Script
```bash
# With ts-node
npx ts-node scripts/seed.ts

# Or compile first
npx tsc scripts/seed.ts && node scripts/seed.js
```

## Placeholder Images

### Picsum Photos (Random)
```
https://picsum.photos/400/300          # Random 400x300
https://picsum.photos/seed/abc/400/300 # Seeded (consistent)
```

### UI Faces (Avatars)
```
https://i.pravatar.cc/150?u=email@example.com
```

### Placeholder.com
```
https://via.placeholder.com/400x300/0066cc/ffffff?text=Product
```

### Lorem Picsum Categories
```
https://picsum.photos/400/300?grayscale
https://picsum.photos/400/300?blur=2
```

## Data Relationships

### Parent-Child Entities
```sql
-- Parent companies
INSERT INTO entities (id, name, type) VALUES
('parent-1', 'Acme Holdings LLC', 'holding_company'),
('parent-2', 'Global Ventures Inc', 'corporation');

-- Child entities
INSERT INTO entities (id, name, type, parent_id) VALUES
('child-1', 'Acme Tech Division', 'subsidiary', 'parent-1'),
('child-2', 'Acme Real Estate', 'subsidiary', 'parent-1'),
('child-3', 'GV Europe', 'subsidiary', 'parent-2');

-- Relationships table
INSERT INTO entity_relationships (parent_entity_id, child_entity_id, relationship_type, ownership_percentage) VALUES
('parent-1', 'child-1', 'owns', 100),
('parent-1', 'child-2', 'owns', 75),
('parent-2', 'child-3', 'controls', 51);
```

## Realistic Data Patterns

### Wealth Management Clients
- AUM range: $1M - $1B+
- Industries: PE, VC, Real Estate, Healthcare, Tech
- Statuses: active, pending, inactive
- Mix of individuals and family offices

### Financial Transactions
- 80% completed, 15% pending, 5% failed
- Deposits typically larger than withdrawals
- Monthly patterns for fees
- Quarterly patterns for dividends

### E-commerce Orders
- Peak during lunch and evening hours
- Higher value on weekends
- 70% delivered, 20% processing, 10% returned

## Integration with Other Skills

- **supabase-expert**: For RLS-aware seeding
- **devops**: For deployment of seed scripts
- **multi-agent-patterns**: For parallel data generation
- **webapp-testing**: Test with generated data