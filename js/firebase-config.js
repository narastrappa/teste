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
  apiKey: "SUBSTITUA_API_KEY",
  authDomain: "SUBSTITUA_PROJETO.firebaseapp.com",
  projectId: "SUBSTITUA_PROJETO_ID",
  storageBucket: "SUBSTITUA_PROJETO.appspot.com",
  messagingSenderId: "SUBSTITUA_SENDER_ID",
  appId: "SUBSTITUA_APP_ID",
};

/* E-mail com permissão para lançar resultados após o login com Google.
   Este mesmo e-mail também deve ser colado nas regras de segurança do
   Firestore (arquivo firestore.rules) — o controle real de quem pode
   GRAVAR dados é feito lá, não aqui. Este valor só controla o que a
   interface mostra/esconde no navegador. */
export const ADMIN_EMAIL = "narastrappa@gmail.com";
