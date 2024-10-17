import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    user: 'postgres',
    host: 'database-1.ctgsmc6cetjm.us-east-1.rds.amazonaws.com',
    database: 'testDB',
    password: 'Team32ECE',
    port: 5432,

  },
  pool: { min: 2, max: 10 }, // Increase pool size

});


export async function ensureTablesExist() {
  try {
    console.log('Attempting to connect to the database...');
    await db.raw('SELECT 1+1 AS result'); // Simple query to test connection
    console.log('Connected to the database successfully.');

    console.log('Checking if packages schema exists...');
    const schemaExists = await db.schema.hasSchema('packages');
    if (!schemaExists) {
      console.log('Creating packages schema...');
      await db.schema.createSchema('packages');
      console.log('Created packages schema');
    } else {
      console.log('Packages schema already exists');
    }

    console.log('Checking if packages table exists in packages schema...');
    const tableExists = await db.schema.withSchema('packages').hasTable('packages');
    if (!tableExists) {
      console.log('Creating packages table in packages schema...');
      await db.schema.withSchema('packages').createTable('packages', (table) => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('version').notNullable();
        table.text('url').notNullable();
      });
      console.log('Created packages table in packages schema');
    } else {
      console.log('Packages table already exists in packages schema');
    }

    console.log('Checking if package_history table exists in packages schema...');
    const historyExists = await db.schema.withSchema('packages').hasTable('package_history');
    if (!historyExists) {
      console.log('Creating package_history table in packages schema...');
      await db.schema.withSchema('packages').createTable('package_history', (table) => {
        table.increments('id').primary();
        table.string('package_id').notNullable();
        table.string('action').notNullable();
        table.timestamp('date').notNullable();
        table.string('user_name').notNullable();
        table.foreign('package_id').references('packages.id');
      });
      console.log('Created package_history table in packages schema');
    } else {
      console.log('Package_history table already exists in packages schema');
    }
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}