const { exec, spawn } = require('child_process');

/**
 * Função utilitária para rodar comandos sequenciais e aguardar.
 */
function run(cmd, desc) {
  return new Promise((resolve, reject) => {
    console.log(`\n[Olympus Setup] 🛠️  ${desc}...`);
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr || err.message);
        reject(new Error(`${desc} falhou`));
        return;
      }
      console.log(`✅ ${desc} finalizado.`);
      resolve(stdout);
    });
  });
}

function commandExists(cmd) {
  return new Promise((resolve) => {
    exec(`command -v ${cmd}`, (err) => {
      resolve(!err);
    });
  });
}

async function main() {
  const setupOnly = process.argv.includes("--setup-only");

  console.log("\n====================================================");
  console.log("🚀 OLYMPUS CLIMB - STARTUP COMPLETO (V3)");
  console.log("====================================================\n");

  // 1. Limpar apenas processos locais do app. O Postgres em 5432 pertence ao Docker Compose.
  await run("fuser -k 3000/tcp 3001/tcp 5555/tcp 2>/dev/null || true", "Limpando processos órfãos do app");

  // 2. Subir Banco quando Docker estiver disponivel; caso contrario, usar o Postgres local configurado.
  if (await commandExists("docker")) {
    await run("docker compose up -d", "Iniciando infraestrutura Docker");
  } else {
    console.warn("\n[Olympus Setup] ⚠️  Docker não encontrado; usando Postgres local de DATABASE_URL.");
    console.warn("[Olympus Setup] ⚠️  Se o próximo passo falhar, suba/instale o Postgres ou ajuste .env.");
  }

  // 3. Sincronizar e gerar client.
  await run("npx prisma db push --schema=services/api/prisma/schema.prisma", "Sincronizando Schema");
  await run("npx prisma generate --schema=services/api/prisma/schema.prisma", "Gerando Prisma Client (Fix para o Studio)");

  if (setupOnly) {
    console.log("\n✅ Setup validado. Use `npm run up` para iniciar API, WebApp e Prisma Studio.");
    return;
  }

  console.log("\n🔥 Iniciando API, WebApp e Prisma Studio...");
  
  // 4. Iniciar serviços em paralelo
  const devProcess = spawn("npx", [
    "concurrently", 
    "-k", 
    "-n", "api,web,studio", 
    "-c", "blue,green,magenta",
    "\"npm run dev:api\"",
    "\"npm run dev:web\"",
    "\"npx prisma studio --schema=services/api/prisma/schema.prisma --browser none\"" // studio sem abrir o browser sozinho
  ], { stdio: "inherit", shell: true });

  // 5. Abrir o navegador manualmente com atraso
  setTimeout(() => {
    console.log("\n🌐 Abrindo WebApp e Prisma Studio...");
    
    const urls = ["http://localhost:3000/", "http://localhost:5555/"];
    
    urls.forEach(url => {
      exec(`explorer.exe ${url}`, (err) => {
        if (err) exec(`xdg-open ${url}`);
      });
    });
    
    console.log("\n💡 Dica do dia: Se o Prisma Studio der 'Fatal Error', dê um F5 forte (Ctrl+F5) ou limpe o cache do navegador.");
  }, 8000);

  process.on('SIGINT', () => {
    console.log("\n🛑 Encerrando Olympus Climb...");
    devProcess.kill();
    process.exit();
  });
}

main().catch(err => {
  console.error("❌ Erro no script:", err);
  process.exit(1);
});
