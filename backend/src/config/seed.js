require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./database');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding database with demo data...');

    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      { name: 'Alice Johnson', email: 'alice@demo.com', color: '#6366f1' },
      { name: 'Bob Smith', email: 'bob@demo.com', color: '#14b8a6' },
      { name: 'Carol White', email: 'carol@demo.com', color: '#ec4899' },
    ];

    const userIds = [];
    for (const user of users) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        userIds.push(existing.rows[0].id);
        console.log(`  ⏭️  User ${user.email} already exists`);
        continue;
      }
      const res = await client.query(
        `INSERT INTO users (name, email, password, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id`,
        [user.name, user.email, hashedPassword, user.color]
      );
      userIds.push(res.rows[0].id);
      console.log(`  ✅ Created user: ${user.email}`);
    }

    const [aliceId, bobId, carolId] = userIds;

    // Create a demo project
    const projectRes = await client.query(
      `INSERT INTO projects (name, description, owner_id, due_date)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Website Redesign', 'Complete overhaul of the company website with new branding', aliceId, '2025-12-31']
    );
    const projectId = projectRes.rows[0].id;

    // Add members
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
      [projectId, aliceId]
    );
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
      [projectId, bobId]
    );
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
      [projectId, carolId]
    );

    // Create sample tasks
    const tasks = [
      { title: 'Design wireframes', description: 'Create low-fidelity wireframes for all pages', status: 'done', priority: 'high', assignee: aliceId, due: '2025-01-15' },
      { title: 'Set up design system', description: 'Define colors, typography, and component library', status: 'done', priority: 'high', assignee: carolId, due: '2025-01-20' },
      { title: 'Build homepage hero section', description: 'Implement the animated hero with CTA buttons', status: 'in_progress', priority: 'critical', assignee: bobId, due: '2025-05-10' },
      { title: 'Create navigation component', description: 'Responsive nav with mobile hamburger menu', status: 'in_progress', priority: 'high', assignee: aliceId, due: '2025-05-12' },
      { title: 'Implement contact form', description: 'Form with validation and email integration', status: 'review', priority: 'medium', assignee: carolId, due: '2025-05-08' },
      { title: 'Write blog section', description: 'Dynamic blog listing with pagination', status: 'todo', priority: 'medium', assignee: bobId, due: '2025-06-01' },
      { title: 'SEO optimization', description: 'Meta tags, sitemap, robots.txt, structured data', status: 'todo', priority: 'low', assignee: aliceId, due: '2025-06-15' },
      { title: 'Performance audit', description: 'Lighthouse audit, image optimization, lazy loading', status: 'todo', priority: 'high', assignee: carolId, due: '2025-05-01' },
    ];

    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [task.title, task.description, task.status, task.priority, projectId, task.assignee, aliceId, task.due]
      );
    }
    console.log(`  ✅ Created ${tasks.length} sample tasks`);

    await client.query('COMMIT');
    console.log('\n✨ Seed complete!');
    console.log('\n📧 Demo accounts (password: password123):');
    console.log('   alice@demo.com  (Project Owner)');
    console.log('   bob@demo.com    (Member)');
    console.log('   carol@demo.com  (Member)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
