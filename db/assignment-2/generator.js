const knex = require('knex')({ client: "pg" });
const faker = require('faker');

const fs = require('fs');

const allCountries = require('./countries');
const allCapitals = require('./capitals');

const countryCount = 50;
const file = []

function a(schema) {
  file.push(`${schema.toString()};`);
}

a(knex.schema.dropTableIfExists('Match'));
a(knex.schema.dropTableIfExists('Stadium'));
a(knex.schema.dropTableIfExists('Nationality'));

a(knex.schema.createTable('Nationality', (table) => {
  table.text("country").primary();
  table.text("continent").notNullable();
  table.string("group", 1).notNullable();
}));

a(knex.schema.createTable('Stadium', (table) => {
  table.text("name").primary();
  table.text("city").notNullable();
  table.text("country").notNullable().references("country").inTable("Nationality");
  table.integer("capacity").notNullable();
}));

a(knex.schema.createTable('Match', (table) => {
  table.text("stadium").notNullable();
  table.date("date").notNullable();
  table.time("time").notNullable();
  table.text("home").notNullable().references("country").inTable("Nationality");
  table.text("guest").notNullable().references("country").inTable("Nationality");
  table.primary(["stadium", "date", "time"]);
}));

const nationalities = [];
const countries = faker.random.arrayElements(allCountries, countryCount);
for (let { country, continent } of countries) {
  nationalities.push({
    country,
    continent,
    group: faker.random.arrayElement(["A", "B", "C", "D"])
  })
}

a(knex('Nationality').insert(nationalities));

const stadiums = [];
for (let { country } of nationalities) {
  const { city } = allCapitals.find((capital) => capital.country === country);

  let name = faker.name.firstName();
  while (stadiums.some(s => s.name === name)) {
    name = faker.name.firstName();
  }

  stadiums.push({
    name,
    city,
    country,
    capacity: faker.random.number({ min: 25, max: 80 }) * 1e3
  })
}

a(knex('Stadium').insert(stadiums));

const matches = [];
for (let i = 0; i < 200; i++) {
  let { country, name } = faker.random.arrayElement(stadiums);
  let guest = faker.random.arrayElement(countries);
  while (guest.country === country) guest = faker.random.arrayElement(countries);

  const date = faker.random.boolean() ? faker.date.recent(200) : faker.date.soon(200);

  matches.push({
    stadium: name,
    home: country,
    guest: guest.country,
    date: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDay() + 1}`,
    time: `${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`
  })
}

a(knex('Match').insert(matches));

if (!fs.existsSync("out")) {
  fs.mkdirSync("out");
}

fs.writeFileSync("out/create_db.sql", file.join("\n\n"));
