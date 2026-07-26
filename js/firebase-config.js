/* ===================================================================
   Configuração do Firebase — SUBSTITUA pelos valores do SEU projeto.

   Como obter (leva ~5 minutos, gratuito):
   1. Acesse https://console.firebase.google.com/ e crie um projeto
      (ex.: "jiifal-2026").
   2. No menu à esquerda: Build > Authentication > Get started >
      aba "Sign-in method" > ative o provedor "Google" > salve.
   3. No menu à esquerda: Build > Firestore Database > Create database
      (modo produção, região southamerica-east1) > Enable.
   4. Ainda no Firestore, aba "Regras", cole o conteúdo do arquivo
      firestore.rules (na raiz deste projeto) e publique.
   5. Ícone de engrenagem > Configurações do projeto > aba "Geral" >
      role até "Seus apps" > clique no ícone Web (</>) > registre um
      app (ex.: "site-jiifal") > copie o objeto de configuração
      exibido e cole abaixo, substituindo os valores de exemplo.
   6. Ainda em Authentication > aba "Settings" > "Authorized domains":
      adicione o domínio onde o site for publicado (ex.:
      seu-usuario.github.io ou o domínio da Netlify/Vercel).
=================================================================== */

export const firebaseConfig = {
  apiKey: "AIzaSyCtsyvh7f0BKlCVofnZ_3EFl3N8T12pJBY",
  authDomain: "jiifal-alagoinhas.firebaseapp.com",
  projectId: "jiifal-alagoinhas",
  storageBucket: "jiifal-alagoinhas.firebasestorage.app",
  messagingSenderId: "155110517172",
  appId: "1:155110517172:web:2d0790146f39951b53aae1",
  measurementId: "G-HTZ5GH9JV9",
};

/* E-mails com permissão para lançar resultados após o login com Google.
   Estes mesmos e-mails também devem estar na lista `emailsAdmin()` das
   regras de segurança do Firestore (arquivo firestore.rules, já publicadas
   no console) — o controle real de quem pode GRAVAR dados é feito lá, não
   aqui. Esta lista só controla o que a interface mostra/esconde no
   navegador. Para adicionar mais administradores(as), inclua o e-mail
   nas duas listas (aqui e nas regras do Firestore). */
export const ADMIN_EMAILS = ["narastrappa@gmail.com", "prof.edf.eduardo@gmail.com"];
