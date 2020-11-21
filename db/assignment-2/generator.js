const knex = require("knex")({ client: "pg" });
const parse = require("csv-parse");

const fs = require("fs");
const path = require("path");

const file = [];

function a(schema) {
  file.push(`${schema.toString()};`);
}

a(knex.schema.dropTableIfExists("Match"));
a(knex.schema.dropTableIfExists("Stadium"));
a(knex.schema.dropTableIfExists("Nationality"));

a(
  knex.schema.createTable("Nationality", (table) => {
    table.text("country").primary();
    table.text("continent").notNullable();
    table.string("group", 1).notNullable();
  })
);

a(
  knex.schema.createTable("Stadium", (table) => {
    table.text("name").primary();
    table.text("city").notNullable();
    table
      .text("country")
      .notNullable()
      .references("country")
      .inTable("Nationality");
    table.integer("capacity").notNullable();
  })
);

a(
  knex.schema.createTable("Match", (table) => {
    table.text("stadium").notNullable();
    table.date("date").notNullable();
    table.time("time").notNullable();
    table
      .text("home")
      .notNullable()
      .references("country")
      .inTable("Nationality");
    table
      .text("guest")
      .notNullable()
      .references("country")
      .inTable("Nationality");
    table.primary(["stadium", "date", "time"]);
  })
);

async function main() {
  function pparse(file) {
    return new Promise((resolve) => {
      parse(fs.readFileSync(file), (err, out) => {
        const fields = out[0];
        const data = out.splice(1);
        const values = [];
        for (const record of data) {
          const value = {};
          for (let i = 0; i < fields.length; i++) {
            value[fields[i]] = record[i];
          }
          values.push(value);
        }
        resolve(values);
      });
    });
  }

  const nationality = await pparse("nationality.csv");
  a(knex("Nationality").insert(nationality));

  const stadium = await pparse("stadium.csv");
  a(knex("Stadium").insert(stadium));

  const match = await pparse("match.csv");
  a(knex("Match").insert(match));

  if (!fs.existsSync("out")) {
    fs.mkdirSync("out");
  }

  await fs.promises.writeFile(
    path.join("out", "create_db.sql"),
    file.join("\n\n")
  );
}

main();
