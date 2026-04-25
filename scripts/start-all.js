const { exec, spawn } = require('child_process');

/**
 * Função utilitária para rodar comandos sequenciais e aguardar.
 */
function run(cmd, desc) {
  return new Promise((resolve) => {
    console.log(`\n[Olympus Setup] 🛠️  ${desc}...`);
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.warn(`⚠️  Aviso ou erro (continuando...): ${desc}`);
      } else {
        console.log(`✅ ${desc} finalizado.`);
      }
      resolve(stdout);
    });
  });
}

async function main() {
  console.log("\n====================================================");
  console.log("🚀 OLYMPUS CLIMB - STARTUP COMPLETO (V3)");
  console.log("====================================================\n");

  // 1. Limpar processos antigos
  // Matamos tudo nas portas 3000 (web), 3001 (api), 5432 (db) e 5555 (studio)
  await run("fuser -k 3000/tcp 3001/tcp 5432/tcp 5555/tcp", "Limpando processos órfãos");

  // 2. Atualizar dependências
  await run("npm install", "Atualizando pacotes (npm install)");

  // 3. Subir Banco (se docker existir)
  await run("docker compose up -d", "Iniciando infraestrutura Docker");

  // 4. Sincronizar e Gerar Client (Essencial para o Prisma Studio não crashar)
  await run("npx prisma db push --schema=services/api/prisma/schema.prisma", "Sincronizando Schema");
  await run("npx prisma generate --schema=services/api/prisma/schema.prisma", "Gerando Prisma Client (Fix para o Studio)");

  console.log("\n🔥 Iniciando API, WebApp e Prisma Studio...");
  
  // 5. Iniciar serviços em paralelo
  const devProcess = spawn("npx", [
    "concurrently", 
    "-k", 
    "-n", "api,web,studio", 
    "-c", "blue,green,magenta",
    "\"npm run dev:api\"",
    "\"npm run dev:web\"",
    "\"npx prisma studio --schema=services/api/prisma/schema.prisma --browser none\"" // studio sem abrir o browser sozinho
  ], { stdio: "inherit", shell: true });

  // 6. Abrir o navegador manualmente com atraso
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
