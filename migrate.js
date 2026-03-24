require('dotenv/config')
const postgres = require('postgres')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const connectionString = process.env.POSTGRES_URL;

// Automatically detect if we need SSL (local vs remote)
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

const sql = postgres(connectionString, {
  prepare: false,
  ssl: isLocal ? false : 'require',
  connect_timeout: 10
})

const namesMale = [
  'Budi', 'Joko', 'Slamet', 'Agus', 'Hendra', 'Rudi', 'Andi', 'Denny', 'Eko', 'Fajar',
  'Guntur', 'Hadi', 'Iwan', 'Junaedi', 'Kurniawan', 'Lukman', 'Mulyono', 'Nurhadi', 'Oki', 'Purnomo',
  'Rahmat', 'Saputra', 'Taufik', 'Ujang', 'Vikram', 'Wawan', 'Yanto', 'Zulkifli', 'Bambang', 'Wira',
  'Satria', 'Bintang', 'Surya', 'Candra', 'Dika', 'Aris', 'Bayu', 'Aditya', 'Pratama', 'Sanjaya'
];

const namesFemale = [
  'Siti', 'Ani', 'Dewi', 'Lestari', 'Sari', 'Indah', 'Putri', 'Ratna', 'Yanti', 'Eka',
  'Fitri', 'Gita', 'Hana', 'Iis', 'Julia', 'Kartika', 'Linda', 'Maya', 'Nani', 'Ovi',
  'Puji', 'Rini', 'Siska', 'Tati', 'Utami', 'Vina', 'Wati', 'Yeni', 'Zubaidah', 'Amelia',
  'Bela', 'Citra', 'Dian', 'Elsa', 'Farida', 'Gisela', 'Hilda', 'Intan', 'Jovita', 'Kania'
];

function getRandomName(gender) {
  const names = gender === 'male' ? namesMale : namesFemale;
  return names[Math.floor(Math.random() * names.length)] + ' ' + (names[Math.floor(Math.random() * names.length)]);
}

async function runSetup() {
  try {
    console.log('🏗️ Starting database migration and seeding...');

    // 1. Run Schema
    const schemaFile = path.join(process.cwd(), 'supabase/schema.sql');
    if (fs.existsSync(schemaFile)) {
      console.log('📜 Applying schema from supabase/schema.sql...');
      const schema = fs.readFileSync(schemaFile, 'utf8')
      await sql.unsafe(`
        DROP TABLE IF EXISTS parent_child;
        DROP TABLE IF EXISTS unions;
        DROP TABLE IF EXISTS people;
        DROP TABLE IF EXISTS users;
      `)
      await sql.unsafe(schema)
      console.log('✅ Tables created successfully!');
    } else {
      console.warn('⚠️ Warning: schema.sql not found, skipping table creation.');
    }

    // 2. Seed Users
    console.log('👤 Seeding default admin user...');
    const defaultEmail = 'admin@gmail.com'
    const defaultPassword = 'password'
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10)
    await sql`
      INSERT INTO users (email, password) 
      VALUES (${defaultEmail}, ${hashedPassword})
    `
    console.log(`✅ Default admin created: ${defaultEmail} / ${defaultPassword}`);

    // 3. Seed Family Tree
    console.log('🌳 Generating family tree (70+ people)...');
    const allPeople = [];
    const allUnions = [];
    const allParentChild = [];

    // Gen 1: Moyang
    const moyangMale = { id: crypto.randomUUID(), name: 'Moyang Raden ' + getRandomName('male'), gender: 'male', status: 'deceased', birth_date: '1900-01-01' };
    const moyangFemale = { id: crypto.randomUUID(), name: 'Moyang Nenek ' + getRandomName('female'), gender: 'female', status: 'deceased', birth_date: '1905-05-05' };
    allPeople.push(moyangMale, moyangFemale);
    const moyangUnion = { id: crypto.randomUUID(), partner1_id: moyangMale.id, partner2_id: moyangFemale.id, type: 'marriage' };
    allUnions.push(moyangUnion);

    // Gen 2 Children
    const numGen2 = 5;
    for (let i = 0; i < numGen2; i++) {
      const gender = i % 2 === 0 ? 'male' : 'female';
      const year = 1930 + i * 2;
      const child = { id: crypto.randomUUID(), name: getRandomName(gender), gender: gender, status: 'deceased', birth_date: `${year}-01-01` };
      allPeople.push(child);
      allParentChild.push({ id: crypto.randomUUID(), union_id: moyangUnion.id, child_id: child.id });

      const partnerGender = gender === 'male' ? 'female' : 'male';
      const partner = { id: crypto.randomUUID(), name: getRandomName(partnerGender), gender: partnerGender, status: 'deceased', birth_date: `${year}-02-02` };
      allPeople.push(partner);
      const union = { id: crypto.randomUUID(), partner1_id: child.id, partner2_id: partner.id, type: 'marriage' };
      allUnions.push(union);

      // Gen 3 Grandchildren
      for (let j = 0; j < 3 + (i % 2); j++) {
        const cGen3Gender = (i + j) % 2 === 0 ? 'male' : 'female';
        const yGen3 = 1960 + i * 3 + j;
        const cGen3 = { id: crypto.randomUUID(), name: getRandomName(cGen3Gender), gender: cGen3Gender, status: 'alive', birth_date: `${yGen3}-01-01` };
        allPeople.push(cGen3);
        allParentChild.push({ id: crypto.randomUUID(), union_id: union.id, child_id: cGen3.id });

        if (j < 3) {
          const pGen3Gender = cGen3Gender === 'male' ? 'female' : 'male';
          const pGen3 = { id: crypto.randomUUID(), name: getRandomName(pGen3Gender), gender: pGen3Gender, status: 'alive', birth_date: `${yGen3}-02-02` };
          allPeople.push(pGen3);
          const uGen3 = { id: crypto.randomUUID(), partner1_id: cGen3.id, partner2_id: pGen3.id, type: 'marriage' };
          allUnions.push(uGen3);

          // Gen 4 Great-grandchildren
          for (let k = 0; k < 2; k++) {
            const cGen4Gender = (i + j + k) % 2 === 0 ? 'male' : 'female';
            const yGen4 = 1990 + i * 2 + j + k;
            const cGen4 = { id: crypto.randomUUID(), name: getRandomName(cGen4Gender), gender: cGen4Gender, status: 'alive', birth_date: `${yGen4}-01-01` };
            allPeople.push(cGen4);
            allParentChild.push({ id: crypto.randomUUID(), union_id: uGen3.id, child_id: cGen4.id });
          }
        }
      }
    }

    await sql.begin(async (sql) => {
      await sql`INSERT INTO people ${sql(allPeople, 'id', 'name', 'gender', 'status', 'birth_date')}`;
      await sql`INSERT INTO unions ${sql(allUnions, 'id', 'partner1_id', 'partner2_id', 'type')}`;
      await sql`INSERT INTO parent_child ${sql(allParentChild, 'id', 'union_id', 'child_id')}`;
    });

    console.log('✅ Seeding complete!');
    console.log(`Total: ${allPeople.length} people, ${allUnions.length} unions, ${allParentChild.length} children relationships.`);

  } catch (err) {
    console.error('❌ Error during setup:', err);
  } finally {
    process.exit();
  }
}

runSetup();