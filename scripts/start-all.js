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
  console.log("🚀 OLYMPUS CLIMB - STARTUP COMPLETO (V2)");
  console.log("====================================================\n");

  // 1. Limpar portas (WSL / Linux)
  await run("fuser -k 3000/tcp 3001/tcp 5432/tcp 5555/tcp", "Limpando processos nas portas 3000, 3001, 5432, 5555");

  // 2. Atualizar pacotes
  await run("npm install", "Atualizando dependências do monorepo");

  // 3. Garantir banco de dados (Docker)
  await run("docker compose up -d", "Tentando subir PostgreSQL via Docker");

  // 4. Sincronizar Prisma
  // Forçamos o carregamento do .env da raiz se necessário, mas o Prisma já o lê por padrão na raiz.
  await run("npx prisma db push --schema=services/api/prisma/schema.prisma", "Sincronizando Banco de Dados com Prisma");

  console.log("\n🔥 Subindo todos os serviços em paralelo...");
  
  // 5. Iniciar API, Web e Prisma Studio
  // Usamos aspas explícitas para o concurrently não se perder no shell
  const devProcess = spawn("npx", [
    "concurrently", 
    "-k", 
    "-n", "api,web,studio", 
    "-c", "blue,green,magenta",
    "\"npm run dev:api\"",
    "\"npm run dev:web\"",
    "\"npx prisma studio --schema=services/api/prisma/schema.prisma\""
  ], { stdio: "inherit", shell: true });

  // 6. Abrir o navegador em abas separadas
  setTimeout(() => {
    console.log("\n🌐 Abrindo WebApp e Prisma Studio...");
    
    // Abrimos individualmente para evitar o erro de concatenação de URL
    const urls = ["http://localhost:3000/", "http://localhost:5555/"];
    
    urls.forEach(url => {
      exec(`explorer.exe ${url}`, (err) => {
        if (err) {
          exec(`xdg-open ${url}`);
        }
      });
    });
    
    console.log("\n💡 Dica: Se as abas não abriram, acesse:");
    console.log("   👉 App: http://localhost:3000");
    console.log("   👉 Banco: http://localhost:5555\n");
  }, 7000);

  process.on('SIGINT', () => {
    console.log("\n🛑 Encerrando tudo...");
    devProcess.kill();
    process.exit();
  });
}

main().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
