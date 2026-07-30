const fs = require("fs");

const files = [
  "pt.json",
  "en.json",
  "es.json",
  "fr.json"
];

for (const file of files) {
  const path = `src/locales/${file}`;

  try {
    let text = fs.readFileSync(path, "utf8");

    // Remove erros comuns de JSON causados por edições manuais
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");

    const data = JSON.parse(text);

    if (data.patterns && data.patterns.home) {
      const home = data.patterns.home;

      // mover blocos para o nível correto
      if (!data.patterns.evolution && home.evolution) {
        data.patterns.evolution = home.evolution;
        delete home.evolution;
      }

      if (!data.patterns.library && home.library) {
        data.patterns.library = home.library;
        delete home.library;
      }

      if (!data.patterns.plan && home.plan) {
        data.patterns.plan = home.plan;
        delete home.plan;
      }

      // garantir hábitos dentro de home
      if (!home.habits && data.patterns.habits) {
        home.habits = data.patterns.habits;
        delete data.patterns.habits;
      }

      // alinhar description/subtitle dos hábitos
      if (home.habits && !home.habits.description && home.habits.subtitle) {
        home.habits.description = home.habits.subtitle;
      }

      fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2) + "\n"
      );

      console.log(`Corrigido: ${file}`);
    }

  } catch (err) {
    console.log(`ERRO em ${file}:`);
    console.log(err.message);
  }
}
