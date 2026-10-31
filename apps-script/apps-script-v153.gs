const SCRIPT_VERSION = "v141-noticias-certas";
const SHEET_ID = "1Lbd1paBp736DsaVld9iA_OJQ_x6YvApenqOfGTG5Uvc";

// Um nome de competição "estragado" é vazio, só números (um dia), ou parece um bocado de JSON
function isBadCompName_(name) {
  if (!name) return true;
  const s = String(name).trim();
  if (/^\d+$/.test(s)) return true;
  if (/^[\{\[]/.test(s)) return true;
  return false;
}


const SETTINGS_COMP_ID = "__app_settings__"; // linha reservada, nunca aparece como competição
const VISIT_LOG_COMP_ID = "__visit_log__"; // linha reservada, guarda o registo de acessos
const MAX_VISIT_LOG_ENTRIES = 300; // limite para nunca voltar a bater no tamanho máximo de uma célula
const VISIT_LOG_ARCHIVE_PREFIX = "__visit_log_archive_"; // + número da página
const FEEDBACK_COMP_ID = "__feedback__"; // linha reservada, guarda bugs/sugestões reportados
const MAX_FEEDBACK_ENTRIES = 200;
const FEEDBACK_ARCHIVE_PREFIX = "__feedback_archive_"; // + número da página
const NEWSLETTER_COMP_ID = "__newsletter__"; // linha reservada, guarda os emails inscritos no resumo semanal
const NEWSLETTER_FROM = "dragaostats@gmail.com"; // tem de estar configurado como "Enviar e-mail como" na conta que corre o script
// QR fixo para dragaostats.pt, sempre igual (o site nunca muda), por isso vem já
// pronto em base64 em vez de ser gerado a cada envio — poupa trabalho ao script
// e funciona mesmo em clientes de email que bloqueiam imagens externas.
const NEWSLETTER_QR_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAANgAAADYCAIAAAAGQrq6AAAD9klEQVR4nO3dwW0VMRRA0XzEjgIogf7LoQQKYD00gCMZ2fg6OWebaDL5c+XF0/j79TzPG5z25fQNwNubEIkQIglCJEGIJAiRBCGS8HX0g2/ff/zP+/hnv3/9nPr90f81e51T15/9uzWjz8GKSIIQSRAiCUIkQYgkCJEEIZIwnCOO7J6HjczOyWrzwt2/P3LL87IikiBEEoRIghBJECIJQiRBiCRMzxFHVr0Pd8vca9bueeGs2vOyIpIgRBKESIIQSRAiCUIkQYgkLJsj3mJ2fjY7/5udC9bmi6dYEUkQIglCJEGIJAiRBCGSIEQSPuwccdX3Ju6+/kedC86yIpIgRBKESIIQSRAiCUIkQYgkLJsj3j4Pq80dd3+etedlRSRBiCQIkQQhkiBEEoRIghBJmJ4j3nIucO1ck1P3c8vzsiKSIEQShEiCEEkQIglCJEGIJAzniLX31Xjf7c/LikiCEEkQIglCJEGIJAiRBCGS8Hqe568/qH2f36r3+VbZ/d7hKqfeX5z9u1ZEEoRIghBJECIJQiRBiCQIkYTpOeLIZzt32JzyfeaIXEmIJAiRBCGSIEQShEiCEElYNkccOXV+yan55S3zxZHdc8rRdayIJAiRBCGSIEQShEiCEEkQIgnDOeKsU+eIzKrdZ+36p+aRVkQShEiCEEkQIglCJEGIJAiRhOE5K7U536zRfd6+n3rk1Pujq1gRSRAiCUIkQYgkCJEEIZIgRBKGc8RZu+dPtXNKdu//nb3+qc9n1bzZikiCEEkQIglCJEGIJAiRBCGSsOy85lv2586qvX95yzx19jpWRBKESIIQSRAiCUIkQYgkCJGEZe8jjqyaM+2eY+1+X7A2L5y9/u7/14pIghBJECIJQiRBiCQIkQQhkrB9jrhqXrXKqfcmR27Zj7zq/xqxIpIgRBKESIIQSRAiCUIkQYgkLDuvuebUOTEjt+8T382KSIIQSRAiCUIkQYgkCJEEIZIwfV5zzap90LPzs93v582qzQVn78eKSIIQSRAiCUIkQYgkCJEEIZIwva+5NpeadWrf7sgt58HMsq+ZKwmRBCGSIEQShEiCEEkQIgnLvh/xlnnYqXOfVzl1P7ufrxWRBCGSIEQShEiCEEkQIglCJGH7OSs1s3PKW+aLI6vmsrs/BysiCUIkQYgkCJEEIZIgRBKESMKnmyOu2r+8e652y/7xVZ+DFZEEIZIgRBKESIIQSRAiCUIkYdkcsfb9fCOnvtdw9zkuqzivmU9NiCQIkQQhkiBEEoRIghBJmJ4j3rKf95b7nFX7/shVrIgkCJEEIZIgRBKESIIQSRAiCa/neU7fA1gRaRAiCUIkQYgkCJEEIZIgRBL+AB+Qgn4Wcg2xAAAAAElFTkSuQmCC";
const PUSH_TOKENS_COMP_ID = "__push_tokens__"; // linha reservada, guarda os tokens de notificações push (Firebase)
const NOTIFIED_UPCOMING_COMP_ID = "__notified_upcoming__"; // linha reservada, guarda que jogos já dispararam o aviso "a sério" de 15 min antes (para não repetir a cada corrida do gatilho)
const UPCOMING_REMINDER_MINUTES = 15; // quantos minutos antes do início do jogo dispara o aviso a sério
const GAME_REMINDERS_COMP_ID = "__game_reminders__"; // linha reservada, guarda quem pediu "Lembrar-me" em cada jogo (v93) e que lembretes já foram enviados
const GAME_REMINDER_MINUTES = 60; // o lembrete sai 1 hora antes do jogo, só para quem o pediu
const CLAIMED_NAMES_COMP_ID = "__claimed_names__"; // linha reservada, guarda que nomes de visitante já estão "ocupados" (para dar João 2, João 3, etc.)
const SCHEDULED_PUSH_COMP_ID = "__scheduled_push__"; // linha reservada, guarda as notificações agendadas para mais tarde (ainda não enviadas)
const PENDING_RESULT_NOTIFS_COMP_ID = "__pending_result_notifs__"; // linha reservada, guarda avisos de "novo resultado" à espera de alguns segundos antes de sair, para dar tempo de marcar Vitória/Empate/Derrota
const RESULT_NOTIF_DELAY_SECONDS = 20; // quanto tempo se espera, no mínimo, antes de mandar o aviso de resultado novo
const SENT_PUSH_HISTORY_COMP_ID = "__sent_push_history__"; // linha reservada, guarda as últimas notificações já enviadas (para não repetires um aviso parecido sem dares por isso)
const MAX_SENT_PUSH_HISTORY = 100; // nunca guarda mais do que isto — as mais antigas vão caindo
const NOTIFIED_DAYBEFORE_COMP_ID = "__notified_daybefore__"; // linha reservada, guarda que jogos já dispararam o aviso "véspera" (para não repetir a cada dia que o gatilho corre)
const PREDICTION_REMINDER_SENT_COMP_ID = "__prediction_reminder_sent__"; // linha reservada, guarda em que dia foi enviado por último o lembrete de palpite (para nunca mandar dois no mesmo dia)

function doGet(e) {
  // pedido de cancelar subscrição da newsletter — vem de um link clicado dentro
  // do próprio email, por isso é sempre um GET, nunca um POST
  if (e && e.parameter && e.parameter.unsubscribe) {
    const sheet0 = getSheet_();
    const removed = unsubscribeNewsletter_(sheet0, e.parameter.unsubscribe);
    return HtmlService.createHtmlOutput(
      '<body style="font-family:sans-serif; text-align:center; padding:40px; background:#0d1b2e; color:#eef2f8;">' +
      (removed ? '<h2>Subscrição cancelada.</h2><p>Já não vais receber o resumo semanal.</p>' : '<h2>Link inválido ou já cancelado.</h2>') +
      '</body>'
    );
  }
  // confirmação da inscrição na newsletter (double opt-in) — também vem de um
  // link clicado no email, nunca de um POST
  if (e && e.parameter && e.parameter.confirm) {
    const sheet1 = getSheet_();
    const confirmed = confirmNewsletter_(sheet1, e.parameter.confirm);
    return HtmlService.createHtmlOutput(
      '<body style="font-family:sans-serif; text-align:center; padding:40px; background:#0d1b2e; color:#eef2f8;">' +
      (confirmed ? '<h2>✅ Inscrição confirmada!</h2><p>Vais começar a receber o resumo semanal.</p>' : '<h2>Link inválido ou já confirmado.</h2>') +
      '</body>'
    );
  }
  // v109: escudo de uma equipa (pedido pelo site, que guarda a imagem no aparelho)
  if (e && e.parameter && e.parameter.escudo) {
    return jsonOut_(escudoImagem_(e.parameter.escudo));
  }
  noteWebVersion_();
  const sheet = getSheet_();
  migrateOldFormatIfNeeded_(sheet);
  const result = readAll_(sheet);
  const settings = readSettings_(sheet);
  const visitLog = readVisitLog_(sheet);
  const feedback = readFeedback_(sheet);
  const reactions = readReactions_(sheet);
  const predictions = readPredictions_(sheet);
  const stdsDoSite = standingsForSite_(sheet);       // v126: calculadas uma vez, para as tabelas e para os escudos delas
  const compStdDoSite = compStdParaSite_();
  return jsonOut_({
    competitions: result.competitions,
    data: result.data,
    sportLinks: settings.sportLinks || {},
    statTypes: settings.statTypes || {},
    competitionOptions: settings.competitionOptions || {},
    questionTemplates: settings.questionTemplates || {},
    cevLive: readAoVivoTodos_(),
    standings: stdsDoSite,
    escudos: escudosComTabelas_(result, stdsDoSite, compStdDoSite),
    detalhes: sofaDetalhesParaSite_(),
    formas: formasParaSite_(result),
    plantel: plantelParaSite_(),
    classificacoesComp: compStdDoSite,
    noticias: noticiasParaSite_(),
    viewerAuth: settings.viewerAuth || {},
    // adminAuth (a lista de passwords de admin) deixou de vir aqui — isto é um
    // pedido GET, visível a toda a gente (inclui quem só tem o link "só ver"),
    // por isso nunca pode trazer as passwords. A entrada na edição passa a ser
    // validada no próprio servidor (ver "adminLoginAttempt" no doPost), e a
    // lista completa só é devolvida a quem já provar ter uma password válida
    // (ver "getAdminAuth", que exige adminPassword, tal como getFullVisitLog).
    // hasAdminAuth é só um sim/não (nunca a lista) — o cliente usa isto para
    // saber se deve sequer pedir uma password, sem revelar nada sobre ela.
    hasAdminAuth: Object.keys(settings.adminAuth || {}).length > 0,
    announcement: settings.announcement || null,
    poll: settings.poll || null,
    visitLog: visitLog,
    feedback: stripPushTokens_(feedback),
    reactions: reactions,
    predictions: predictions,
    SCRIPT_VERSION: SCRIPT_VERSION
  });
}

// Confirma se a password dada corresponde a uma das passwords de admin
// guardadas — nunca deixa passar um pedido de admin sem isto bater certo.
function isValidAdminPassword_(sheet, password) {
  const settings = readSettings_(sheet);
  const adminAuth = settings.adminAuth || {};
  Logger.log("isValidAdminPassword_ — password recebida: '" + password + "' (tipo: " + typeof password + ") — passwords guardadas: " + JSON.stringify(Object.keys(adminAuth)));
  if (!password) return false;
  return Object.prototype.hasOwnProperty.call(adminAuth, password);
}
// Só para o momento de arranque (primeira password de admin de sempre) — depois
// de existir pelo menos uma, deixa de se aplicar.
function hasAnyAdminPassword_(sheet) {
  const settings = readSettings_(sheet);
  const adminAuth = settings.adminAuth || {};
  return Object.keys(adminAuth).length > 0;
}

function doPost(e) {
  noteWebVersion_();
  // v131: contagem anónima de uso (só números por nome de ação, sem dados pessoais). Tratada à parte, rápida.
  try {
    const rawT = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    if (rawT.length < 2000 && rawT.indexOf('"track"') > 0 && rawT.indexOf('"track"') < 6) {
      const objT = JSON.parse(rawT);
      if (objT && objT.track && typeof objT.track === "object") { usoRegistar_(objT.track); return jsonOut_({ ok: true, SCRIPT_VERSION: SCRIPT_VERSION }); }
    }
  } catch (eT) { return jsonOut_({ ok: false, SCRIPT_VERSION: SCRIPT_VERSION }); }
  // Espera a vez antes de mexer na Sheet — evita que duas gravações quase ao mesmo
  // tempo (ex: duas pessoas a eliminar provas juntas) se atropelem uma à outra.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000); // espera até 25 segundos por um lugar livre
  } catch (lockError) {
    return jsonOut_({ ok: false, error: "Demasiadas gravações ao mesmo tempo — tenta outra vez em breve.", SCRIPT_VERSION: SCRIPT_VERSION });
  }

  try {
    const sheet = getSheet_();
    migrateOldFormatIfNeeded_(sheet);
    repairNumericNames_(sheet);

    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : null;
    if (!raw) return jsonOut_({ ok: false, error: "sem dados", SCRIPT_VERSION: SCRIPT_VERSION });
    const incoming = JSON.parse(raw); // { competitions, compId, compData:{events,status} } ou { competitions, deleteCompId }

    // ===== PROTEÇÃO: ações de admin exigem a password certa =====
    // Sem isto, qualquer pessoa que descubra este URL (visível no código-fonte do
    // site) conseguia ler a lista de emails, apagar jogos, mudar passwords, etc.,
    // sem precisar de autenticação nenhuma. As ações de visitante (reagir, votar,
    // inscrever-se, reportar) continuam sempre abertas, como já era.
    const ADMIN_ONLY_KEYS = [
      "setSportLinks", "setStatTypes", "setCompetitionOptions", "setQuestionTemplates", "setViewerAuth", "setAdminAuth",
      "deleteFeedback", "updatePollQuestion", "replyFeedback", "sendCustomPush", "getPollArchive", "resendNewsletterConfirmation",
      "scheduleCustomPush", "getScheduledPush", "cancelScheduledPush", "getSentPushHistory", "sendNewsletterTest",
      "getInstalledAndNotifyingNames",
      "getFullVisitLog", "getFullFeedback", "getNewsletterSubscribers", "deleteCompId",
      "deletePollOther", "getAdminAuth", "setManualStandings", "ocultarNoticia"
    ];
    let needsAdminAuth = ADMIN_ONLY_KEYS.some(function(key) { return incoming[key] !== undefined; });
    if (incoming.setAnnouncement !== undefined) needsAdminAuth = true;
    if (incoming.setPoll !== undefined) needsAdminAuth = true;
    if (incoming.compId && incoming.setArchived !== undefined) needsAdminAuth = true;
    if (incoming.compId && incoming.deleteEventId) needsAdminAuth = true;
    if (incoming.compId && incoming.compData) needsAdminAuth = true;

    // enquanto NÃO existir nenhuma password de admin configurada, o site também
    // nunca pede uma (deixa entrar em edição livremente) — por isso o servidor
    // também tem de deixar passar tudo nesse período, senão ninguném conseguia
    // gravar nada sem existir sequer um sítio para escrever uma password
    if (needsAdminAuth && !hasAnyAdminPassword_(sheet)) {
      needsAdminAuth = false;
    }
    if (needsAdminAuth && !isValidAdminPassword_(sheet, incoming.adminPassword)) {
      // diagnóstico temporário: mostra diretamente no aviso de erro (sem precisar
      // de ires a Execuções) o que chegou e o que está guardado, de forma parcial
      // e segura (nunca a password toda)
      const debugSettings = readSettings_(sheet);
      const debugAuth = debugSettings.adminAuth || {};
      const recebida = incoming.adminPassword;
      const recebidaInfo = recebida ? ("'" + recebida.slice(0,2) + "..." + recebida.slice(-2) + "' (" + recebida.length + " caracteres)") : "(vazia/em falta)";
      const guardadasInfo = Object.keys(debugAuth).map(function(p){ return "'" + p.slice(0,2) + "..." + p.slice(-2) + "' (" + p.length + " caracteres)"; }).join(", ") || "(nenhuma guardada)";
      return jsonOut_({ ok: false, error: "Password de admin inválida ou em falta. [Diagnóstico: recebida " + recebidaInfo + " — guardadas: " + guardadasInfo + "]", SCRIPT_VERSION: SCRIPT_VERSION });
    }

    if (incoming.deleteCompId) {
      deleteAllRowsForComp_(sheet, incoming.deleteCompId);
    } else if (incoming.setSportLinks) {
      const current = readSettings_(sheet);
      current.sportLinks = incoming.setSportLinks;
      writeSettings_(sheet, current);
    } else if (incoming.setStatTypes) {
      // nomes de estatística conhecidos por modalidade (Golos, Assistências, ...)
      const current = readSettings_(sheet);
      current.statTypes = incoming.setStatTypes;
      writeSettings_(sheet, current);
    } else if (incoming.setCompetitionOptions) {
      // nomes de competição conhecidos por modalidade (Campeonato Nacional, Amigável, ...)
      // — mesmo padrão do setStatTypes, para o campo "Competição" deixar de ser texto livre
      const current = readSettings_(sheet);
      current.competitionOptions = incoming.setCompetitionOptions;
      writeSettings_(sheet, current);
    } else if (incoming.setQuestionTemplates) {
      // perguntas-modelo de prognóstico por modalidade (as que o site mostra ao escolher
      // a pergunta de um jogo) — faltava mesmo este ramo; sem ele, o pedido do site
      // chegava aqui e não batia em nenhum "else if", por isso nunca ficava gravado
      // (o site também nunca via o erro, porque não verifica a resposta deste pedido).
      // Mesmo padrão do setStatTypes/setCompetitionOptions.
      const current = readSettings_(sheet);
      current.questionTemplates = incoming.setQuestionTemplates;
      writeSettings_(sheet, current);
    } else if (incoming.setViewerAuth) {
      // lista de passwords -> nome de quem só pode VER (link de leitura)
      const current = readSettings_(sheet);
      current.viewerAuth = incoming.setViewerAuth;
      writeSettings_(sheet, current);
    } else if (incoming.setAdminAuth) {
      // lista de passwords -> nome de quem pode editar (protege o link normal)
      const current = readSettings_(sheet);
      current.adminAuth = incoming.setAdminAuth;
      writeSettings_(sheet, current);
    } else if (incoming.logVisit) {
      appendVisitLog_(sheet, incoming.logVisit);
    } else if (incoming.logVisitTime) {
      updateVisitTime_(sheet, incoming.logVisitTime);
    } else if (incoming.claimViewerName) {
      // dá um nome único a quem entra pela primeira vez — se "João" já estiver
      // usado por outro aparelho, devolve "João 2" sem a pessoa dar por isso;
      // quem pergunta guarda o que vier daqui, para sempre, nesse aparelho
      const assigned = claimViewerName_(sheet, incoming.claimViewerName.name);
      return jsonOut_({ ok: true, assignedName: assigned, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.submitFeedback) {
      appendFeedback_(sheet, incoming.submitFeedback);
    } else if (incoming.deleteFeedback) {
      // remove um reporte específico da página ATUAL (não mexe no que já foi
      // arquivado) — identificado pela hora exata a que foi enviado
      deleteFeedbackByTime_(sheet, incoming.deleteFeedback.t);
    } else if (incoming.addReaction) {
      // reações (👏🔥😢) vivem numa linha própria, completamente à parte dos
      // jogos — nunca tocam em EVENTS, para nunca haver risco de uma reação de
      // um visitante qualquer apagar por engano um resultado que se acabou de gravar
      addReaction_(sheet, incoming.addReaction.compId, incoming.addReaction.eventId, incoming.addReaction.emoji, incoming.addReaction.name);
    } else if (incoming.addPrediction) {
      // prognósticos (Vitória/Empate/Derrota) vivem numa linha própria, isolada,
      // pela mesma razão das reações — nunca tocam em EVENTS
      addPrediction_(sheet, incoming.addPrediction.compId, incoming.addPrediction.eventId, incoming.addPrediction.option, incoming.addPrediction.name);
    } else if (incoming.subscribeNewsletter) {
      // inscrição no resumo semanal por email — linha reservada própria, nunca
      // toca em EVENTS nem em nada dos outros dados
      subscribeNewsletter_(sheet, incoming.subscribeNewsletter.email);
    } else if (incoming.resendNewsletterConfirmation) {
      // o admin pede para reenviar o email de confirmação a quem ainda não
      // confirmou — reaproveita a mesma função de sempre, que já sabe reenviar
      // em vez de duplicar quando o email já existe e está por confirmar
      subscribeNewsletter_(sheet, incoming.resendNewsletterConfirmation.email);
    } else if (incoming.ocultarNoticia) {
      // v140: esconder (ou voltar a mostrar) uma notícia — só admin (ver ADMIN_ONLY_KEYS)
      return jsonOut_({ ok: noticiaOcultar_(incoming.ocultarNoticia), SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.setManualStandings) {
      // classificação preenchida à mão (futsal) — só admin (ver ADMIN_ONLY_KEYS)
      const okMs = setManualStandings_(sheet, incoming.setManualStandings);
      return jsonOut_({ ok: okMs, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.setGameReminder) {
      // "Lembrar-me" num jogo: guarda (ou retira) o pedido deste aparelho. O envio é feito
      // pelo relógio de 5 em 5 minutos (checkGameRemindersForPush_), 1 hora antes do jogo.
      const g = incoming.setGameReminder;
      const done = setGameReminder_(sheet, String(g.token || ""), String(g.evId || ""), !!g.on);
      return jsonOut_({ ok: true, reminder: done, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.registerPushToken) {
      // regista o token deste telemóvel/browser para poder receber avisos a sério
      // (push, mesmo com a app fechada) — linha reservada própria, isolada
      registerPushToken_(sheet, incoming.registerPushToken.token, incoming.registerPushToken.name);
    } else if (incoming.sendCustomPush) {
      // aviso espontâneo escrito à mão pelo admin ("hoje há jogo de andebol às
      // 20h!") — envia logo, na hora, para todos os aparelhos com avisos ligados;
      // já passou pela proteção de password de admin lá em cima
      const title = String(incoming.sendCustomPush.title || "Dragão Stats").slice(0, 100);
      const body = String(incoming.sendCustomPush.body || "").slice(0, 500);
      const link = buildEventPushLink_(incoming.sendCustomPush.evId, incoming.sendCustomPush.compId);
      if (body.trim()) sendPushToAll_(title, body, link);
    } else if (incoming.scheduleCustomPush) {
      // mesma coisa, mas para daqui a bocado — fica à espera do gatilho de 5 em
      // 5 minutos (checkScheduledPush_) para disparar sozinha na hora certa
      const scheduled = readScheduledPush_(sheet);
      const entry = {
        id: Utilities.getUuid(),
        title: String(incoming.scheduleCustomPush.title || "Dragão Stats").slice(0, 100),
        body: String(incoming.scheduleCustomPush.body || "").slice(0, 500),
        sendAt: String(incoming.scheduleCustomPush.sendAt || ""),
        evId: incoming.scheduleCustomPush.evId ? String(incoming.scheduleCustomPush.evId).slice(0, 100) : null,
        compId: incoming.scheduleCustomPush.compId ? String(incoming.scheduleCustomPush.compId).slice(0, 100) : null,
        evLabel: incoming.scheduleCustomPush.evLabel ? String(incoming.scheduleCustomPush.evLabel).slice(0, 150) : null,
        createdAt: new Date().toISOString()
      };
      scheduled.push(entry);
      writeScheduledPush_(sheet, scheduled);
      return jsonOut_({ ok: true, scheduled: scheduled });
    } else if (incoming.getScheduledPush) {
      return jsonOut_({ ok: true, scheduled: readScheduledPush_(sheet) });
    } else if (incoming.getSentPushHistory) {
      return jsonOut_({ ok: true, history: readSentPushHistory_(sheet) });
    } else if (incoming.getInstalledAndNotifyingNames) {
      const names = buildInstalledAndNotifyingNames_(sheet);
      return jsonOut_({ ok: true, installed: names.installed, notifying: names.notifying });
    } else if (incoming.sendNewsletterTest) {
      // envia só para o email que o admin escolher, com o mesmo conteúdo que a
      // sério — nunca mexe na lista de subscritores nem conta como um envio real
      const testEmail = String(incoming.sendNewsletterTest.email || "").trim();
      if (!testEmail) return jsonOut_({ ok: false, error: "Sem email de teste." });
      const email = buildNewsletterEmail_(sheet);
      if (!email) return jsonOut_({ ok: true, hadContent: false });
      const testHtml = email.bodyHtml.replace(
        '</div>',
        '<p style="font-size:11px; color:#9aa5b1;">⚠️ Isto é um envio de TESTE — o link de cancelar subscrição não é real.</p></div>'
      );
      GmailApp.sendEmail(testEmail, "[TESTE] " + email.subject, "", {
        htmlBody: testHtml,
        from: NEWSLETTER_FROM,
        name: "Dragão Stats"
      });
      return jsonOut_({ ok: true, hadContent: true });
    } else if (incoming.cancelScheduledPush) {
      const scheduled = readScheduledPush_(sheet).filter(function(s) { return s.id !== incoming.cancelScheduledPush.id; });
      writeScheduledPush_(sheet, scheduled);
      return jsonOut_({ ok: true, scheduled: scheduled });
    } else if (incoming.setAnnouncement !== undefined) {
      // aviso do admin no topo da app — guardado na mesma linha de configurações
      // partilhadas que já é usada para os links de classificação (sportLinks)
      const current = readSettings_(sheet);
      current.announcement = incoming.setAnnouncement; // { text, updatedAt } ou null para apagar
      writeSettings_(sheet, current);
    } else if (incoming.setPoll !== undefined) {
      // enquete rápida do admin — substitui sempre a anterior e reinicia os
      // votos, mas primeiro guarda a que estava ativa num arquivo, para nunca
      // se perderem os resultados de uma sondagem antiga
      const current = readSettings_(sheet);
      if (current.poll && current.poll.question) {
        if (!Array.isArray(current.pollArchive)) current.pollArchive = [];
        current.pollArchive.push(current.poll);
        while (current.pollArchive.length > 200) current.pollArchive.shift(); // nunca deixa crescer para sempre
      }
      current.poll = incoming.setPoll; // { question, options:[...], votes:{}, updatedAt }
      writeSettings_(sheet, current);
    } else if (incoming.votePoll) {
      // um voto só conta se for para a enquete que está ativa agora (pollId = updatedAt
      // da enquete no momento em que a pessoa a viu) — evita votos "fantasma" numa
      // enquete antiga que entretanto já foi substituída
      const current = readSettings_(sheet);
      if (current.poll && current.poll.updatedAt === incoming.votePoll.pollId) {
        if (!current.poll.votes) current.poll.votes = {};
        const opt = incoming.votePoll.option;
        current.poll.votes[opt] = (current.poll.votes[opt] || 0) + 1;
        writeSettings_(sheet, current);
      }
    } else if (incoming.submitPollOther) {
      // resposta livre da opção "Outra" — só conta para a sondagem que está
      // mesmo ativa agora (mesma proteção que o votePoll já tinha); guarda com
      // um id próprio, para o admin poder apagar só essa, sem mexer nas outras
      const current = readSettings_(sheet);
      if (current.poll && current.poll.updatedAt === incoming.submitPollOther.pollId) {
        const text = String(incoming.submitPollOther.text || "").trim().slice(0, 200);
        if (text) {
          if (!current.poll.votes) current.poll.votes = {};
          current.poll.votes["Outra"] = (current.poll.votes["Outra"] || 0) + 1; // conta logo como voto, igual às outras opções
          if (!Array.isArray(current.poll.otherAnswers)) current.poll.otherAnswers = [];
          current.poll.otherAnswers.push({ id: Utilities.getUuid(), text: text, t: new Date().toISOString() });
          while (current.poll.otherAnswers.length > 300) current.poll.otherAnswers.shift(); // nunca cresce para sempre
          writeSettings_(sheet, current);
        }
      }
    } else if (incoming.deletePollOther) {
      // só o admin apaga — para tirar respostas fora do assunto, sem afetar os
      // votos das opções fixas nem as outras respostas livres
      const current = readSettings_(sheet);
      if (current.poll && Array.isArray(current.poll.otherAnswers)) {
        current.poll.otherAnswers = current.poll.otherAnswers.filter(function(a){ return a.id !== incoming.deletePollOther.id; });
        writeSettings_(sheet, current);
      }
    } else if (incoming.updatePollQuestion) {
      // corrige só o texto da pergunta de uma sondagem já ativa — lê o estado mais
      // recente do servidor antes de gravar (nunca o que o admin tinha no ecrã),
      // para nunca apagar por engano um voto que tenha chegado entretanto
      const current = readSettings_(sheet);
      if (current.poll && current.poll.updatedAt === incoming.updatePollQuestion.pollId) {
        current.poll.question = String(incoming.updatePollQuestion.question || "").slice(0, 300);
        writeSettings_(sheet, current);
      }
    } else if (incoming.getPollArchive) {
      const current = readSettings_(sheet);
      return jsonOut_({ ok: true, pollArchive: current.pollArchive || [] });
    } else if (incoming.replyFeedback) {
      const pushToken = replyFeedback_(sheet, incoming.replyFeedback.t, incoming.replyFeedback.reply);
      if (pushToken) {
        try {
          sendPushToOneToken_(pushToken, "💬 Resposta ao teu reporte", String(incoming.replyFeedback.reply || "").slice(0, 150));
        } catch (pushErr) {
          // uma falha aqui nunca pode fazer parecer que a resposta não foi gravada
        }
      }
    } else if (incoming.getFullVisitLog) {
      const fullLog = readFullVisitLog_(sheet);
      SpreadsheetApp.flush();
      return jsonOut_({ ok: true, fullVisitLog: fullLog, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.getFullFeedback) {
      const fullFeedback = readFullFeedback_(sheet);
      SpreadsheetApp.flush();
      return jsonOut_({ ok: true, fullFeedback: stripPushTokens_(fullFeedback), SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.getNewsletterSubscribers) {
      // só devolve email + data de inscrição + estado de confirmação — nunca o
      // token (esse serve só para a própria pessoa confirmar/cancelar, não deve sair daqui)
      const subs = readNewsletterSubscribers_(sheet).map(function(s) { return { email: s.email, t: s.t, confirmed: s.confirmed !== false }; });
      return jsonOut_({ ok: true, newsletterSubscribers: subs, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.getAdminAuth) {
      // lista toda de passwords de admin + nomes — só chega até aqui depois de
      // "needsAdminAuth" já ter confirmado a password recebida, por isso é seguro
      // devolvê-la (usado pelo painel de "gerir acessos", já depois de autenticado)
      const current = readSettings_(sheet);
      return jsonOut_({ ok: true, adminAuth: current.adminAuth || {}, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.adminLoginAttempt !== undefined) {
      // Ecrã de entrada em modo de edição: confirma a password SEM nunca mandar
      // a lista toda de volta — só diz se está certa e, nesse caso, o nome
      // associado. Esta ação fica de propósito fora de ADMIN_ONLY_KEYS (ainda
      // ninguém está autenticado quando a chama, é o próprio momento de entrar).
      const pwdTried = incoming.adminLoginAttempt;
      const valid = isValidAdminPassword_(sheet, pwdTried);
      let matchedName = null;
      if (valid) {
        const s = readSettings_(sheet);
        matchedName = (s.adminAuth || {})[pwdTried] || null;
      }
      return jsonOut_({ ok: true, valid: valid, name: matchedName, SCRIPT_VERSION: SCRIPT_VERSION });
    } else if (incoming.compId && incoming.setArchived !== undefined) {
      // Arquivar/desarquivar é só uma etiqueta — não mexe nas provas nem no nome
      setArchivedFlag_(sheet, incoming.compId, incoming.setArchived);
    } else if (incoming.compId && incoming.deleteEventId) {
      // Elimina uma prova a sério — nunca passa pela junção normal, para não
      // correr o risco de "ressuscitar" por causa dela.
      const compId = incoming.compId;
      const existing = readCompetitionFull_(sheet, compId);
      const remainingEvents = existing.events.filter(function(ev) { return ev.id !== incoming.deleteEventId; });
      const remainingStatus = Object.assign({}, existing.status);
      delete remainingStatus[incoming.deleteEventId];

      let compName = findCompName_(sheet, compId) || compId;
      if (isBadCompName_(compName)) compName = compId;

      writeCompetitionByDay_(sheet, compId, compName, remainingEvents, remainingStatus);

    } else if (incoming.compId && incoming.compData) {
      const compId = incoming.compId;
      const existing = readCompetitionFull_(sheet, compId);

      const existingEvents = existing.events;
      const incomingEvents = Array.isArray(incoming.compData.events) ? incoming.compData.events : [];
      const mergedMap = {};
      existingEvents.forEach(function(ev) { mergedMap[ev.id] = ev; });
      incomingEvents.forEach(function(ev) { mergedMap[ev.id] = ev; });
      const mergedEvents = Object.values(mergedMap);

      const existingStatus = existing.status;
      const incomingStatus = (incoming.compData.status && typeof incoming.compData.status === "object") ? incoming.compData.status : {};
      const mergedStatus = Object.assign({}, existingStatus);
      Object.keys(incomingStatus).forEach(function(id) {
        const inc = incomingStatus[id];
        const exist = mergedStatus[id];
        if (!exist || (inc.updatedAt || 0) >= (exist.updatedAt || 0)) mergedStatus[id] = inc;
      });

      let compName = findCompName_(sheet, compId) || compId;
      if (isBadCompName_(compName)) compName = compId; // nunca gravar um nome estragado, nem por engano
      if (incoming.competitions) {
        // ignora nomes que pareçam ser um número de dia (ex: "22") — proteção contra
        // um cliente antigo/com bug que confunda dias com competições
        const found = incoming.competitions.filter(function(c) {
          return c.id === compId && !isBadCompName_(c.name);
        })[0];
        if (found) compName = found.name;
      }

      // deteta resultados que passaram de vazios a preenchidos NESTA gravação, para
      // avisar por push quem tiver os avisos a sério ligados — comparado ANTES de
      // gravar, nunca depois, para não disparar duas vezes na mesma alteração
      const newlyResulted = [];
      Object.keys(mergedStatus).forEach(function(id) {
        const before = (existingStatus[id] && existingStatus[id].resultado) ? String(existingStatus[id].resultado).trim() : "";
        const after = (mergedStatus[id] && mergedStatus[id].resultado) ? String(mergedStatus[id].resultado).trim() : "";
        if (!before && after) newlyResulted.push(id);
      });

      writeCompetitionByDay_(sheet, compId, compName, mergedEvents, mergedStatus);

      // o envio de push nunca pode travar nem estragar a gravação em si — corre
      // sempre depois, e qualquer erro aqui fica contido. Não manda logo: fica
      // à espera uns segundos (RESULT_NOTIF_DELAY_SECONDS), para dar tempo de
      // também marcar Vitória/Empate/Derrota antes do aviso sair — ver
      // checkPendingResultNotifications_, que trata de despachar isto.
      if (newlyResulted.length > 0) {
        try {
          const pending = readPendingResultNotifs_(sheet);
          const readyAt = new Date(Date.now() + RESULT_NOTIF_DELAY_SECONDS * 1000).toISOString();
          newlyResulted.forEach(function(id) {
            pending.push({ id: id, compId: compId, readyAt: readyAt });
          });
          writePendingResultNotifs_(sheet, pending);
        } catch (pushErr) {
          Logger.log("Erro a agendar aviso de novo resultado: " + pushErr.message);
        }
      }
    }

    if (incoming.competitions) {
      const rows = sheet.getDataRange().getValues();
      incoming.competitions.forEach(function(c) {
        // mesma proteção aqui: nunca aceitar um "nome" que seja só um número de dia
        if (isBadCompName_(c.name)) return;
        rows.forEach(function(row, idx) {
          if (row[0] === c.id) {
            sheet.getRange(idx + 1, 3).setValue(c.name);
            sheet.getRange(idx + 1, 5).setValue(c.archived ? "1" : "");
            sheet.getRange(idx + 1, 6).setValue(c.mode || "medals");
          }
        });
      });
    }

    SpreadsheetApp.flush();
    return jsonOut_({ ok: true, SCRIPT_VERSION: SCRIPT_VERSION });

  } catch (fatalError) {
    return jsonOut_({ ok: false, error: String(fatalError.message), SCRIPT_VERSION: SCRIPT_VERSION });
  } finally {
    lock.releaseLock();
  }
}

function readCompetitionFull_(sheet, compId) {
  const rows = sheet.getDataRange().getValues();
  let events = [];
  let status = {};
  rows.forEach(function(row) {
    if (row[0] !== compId) return;
    try {
      const parsed = JSON.parse(row[3] || "{}");
      if (Array.isArray(parsed.events)) events = events.concat(parsed.events);
      if (parsed.status) Object.assign(status, parsed.status);
    } catch (err) {}
  });
  return { events: dedupeById_(events), status: status };
}

// Se o mesmo id aparecer mais do que uma vez (ex: por causa de uma correção
// anterior), fica só uma cópia — a última encontrada.
function dedupeById_(list) {
  const map = {};
  list.forEach(function(item) { if (item && item.id) map[item.id] = item; });
  return Object.values(map);
}

function findCompName_(sheet, compId) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === compId) return rows[i][2];
  }
  return null;
}

// "matches" = competição pública (Modo Modalidades), visível para toda a
// gente; "medals" = competição só para quem edita (Modo Medalhas), nunca
// aparece a quem só vê. Usado para nunca mandar push de competições privadas
// para toda a gente — ver checkPendingResultNotifications_.
function findCompMode_(sheet, compId) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === compId) return rows[i][5] || "medals";
  }
  return "medals";
}

function setArchivedFlag_(sheet, compId, archived) {
  const rows = sheet.getDataRange().getValues();
  rows.forEach(function(row, idx) {
    if (row[0] === compId) sheet.getRange(idx + 1, 5).setValue(archived ? "1" : "");
  });
}

function deleteAllRowsForComp_(sheet, compId) {
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i][0] === compId) sheet.deleteRow(i + 1);
  }
}

// Grava uma competição inteira (todos os seus dias) de forma rápida: lê a Sheet
// só uma vez, monta tudo em memória, e escreve tudo de uma só vez no fim — em vez
// de apagar/inserir linha a linha (que é lento e é o que causava filas de espera).
function writeCompetitionByDay_(sheet, compId, compName, allEvents, allStatus) {
  const byDay = {};
  allEvents.forEach(function(ev) {
    const d = ev.day || "_sem_dia";
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(ev);
  });
  const days = Object.keys(byDay);

  const allRows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, allRows.length ? allRows[0].length : 6);

  // preserva o "arquivada?" e o "modo" desta competição (não é isto que está a mudar aqui)
  let archivedFlag = "";
  let modeFlag = "medals";
  allRows.forEach(function(row) {
    if (row[0] === compId) {
      if (row[4]) archivedFlag = row[4];
      if (row[5]) modeFlag = row[5];
    }
  });

  const otherRows = allRows
    .filter(function(row) { return row[0] !== compId; })
    .map(function(row) { return padRow_(row, numCols); });

  let newRowsForComp;
  if (days.length === 0) {
    newRowsForComp = [[compId, "", compName, JSON.stringify({ events: [], status: {} }), archivedFlag, modeFlag]];
  } else {
    newRowsForComp = days.map(function(day) {
      const dayEvents = byDay[day];
      const idsThisDay = {};
      dayEvents.forEach(function(ev) { idsThisDay[ev.id] = true; });
      const dayStatus = {};
      Object.keys(allStatus).forEach(function(id) { if (idsThisDay[id]) dayStatus[id] = allStatus[id]; });
      return [compId, day, compName, JSON.stringify({ events: dayEvents, status: dayStatus }), archivedFlag, modeFlag];
    });
  }
  newRowsForComp = newRowsForComp.map(function(row) { return padRow_(row, numCols); });

  const finalRows = otherRows.concat(newRowsForComp);

  // Escreve por cima SEM apagar primeiro — se algo falhar a meio, os dados antigos
  // continuam lá, em vez de ficar tudo vazio (foi isto que correu mal antes).
  const oldRowCount = allRows.length;
  const newRowCount = finalRows.length;

  if (finalRows.length > 0) {
    sheet.getRange(1, 1, finalRows.length, numCols).setValues(finalRows);
  }
  // só depois de escrever com sucesso é que limpa uma eventual sobra de linhas antigas
  if (newRowCount < oldRowCount) {
    sheet.getRange(newRowCount + 1, 1, oldRowCount - newRowCount, numCols).clearContent();
  }
}

function padRow_(row, numCols) {
  const r = row.slice(0, numCols);
  while (r.length < numCols) r.push("");
  return r;
}

// Configurações partilhadas entre os dois dispositivos (ex: links de classificação
// por modalidade) — guardadas numa linha reservada que nunca aparece como competição.
function readSettings_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SETTINGS_COMP_ID) {
      try { return JSON.parse(rows[i][3] || "{}"); } catch (err) { return {}; }
    }
  }
  return {};
}

function writeSettings_(sheet, settingsObj) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let rowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SETTINGS_COMP_ID) { rowIdx = i + 1; break; }
  }
  const rowData = padRow_([SETTINGS_COMP_ID, "", "", JSON.stringify(settingsObj), "", ""], numCols);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Registo de acessos de quem entra pelo link "só ver" — guardado numa linha
// reservada à parte, com um limite de entradas para nunca crescer sem controlo
// (foi um limite de tamanho de célula que causou muitos problemas no passado).
// Regista acessos por "páginas": a página atual é pequena e rápida (é a única que
// entra na sincronização normal), e quando enche fica arquivada para sempre numa
// linha nova, começando uma página atual vazia — nunca se perde histórico, e nunca
// se aproxima do limite de 50.000 carateres de uma célula.
function readVisitLog_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === VISIT_LOG_COMP_ID) {
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        return Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) { return []; }
    }
  }
  return [];
}

// Junta a página atual com TODAS as páginas arquivadas — só se usa quando alguém
// pede mesmo o histórico completo, nunca na sincronização normal (ficaria pesado).
// Junta, num único sítio, quem já instalou a app (nome mais recente por
// pessoa, tirado do registo de acessos) e quem tem as notificações a sério
// ligadas (tirado dos tokens de push guardados) — sem repetir a mesma pessoa
// duas vezes em cada lista.
function buildInstalledAndNotifyingNames_(sheet) {
  const fullLog = readFullVisitLog_(sheet);
  const installedByName = {};
  fullLog.forEach(function(e) {
    if (e.type === "install" && e.name && e.name !== "(sem nome)") {
      const t = e.t || "";
      if (!installedByName[e.name] || t > installedByName[e.name]) installedByName[e.name] = t;
    }
  });
  const installed = Object.keys(installedByName).map(function(name) {
    return { name: name, t: installedByName[name] };
  }).sort(function(a, b) { return (b.t || "").localeCompare(a.t || ""); });

  const tokens = readPushTokens_(sheet);
  const notifying = tokens.map(function(t) {
    return { name: t.name || "?", t: t.t || "" };
  }).sort(function(a, b) { return (b.t || "").localeCompare(a.t || ""); });

  return { installed: installed, notifying: notifying };
}

function readFullVisitLog_(sheet) {
  const rows = sheet.getDataRange().getValues();
  const archivePages = [];
  let current = [];
  rows.forEach(function(row) {
    if (row[0] === VISIT_LOG_COMP_ID) {
      try {
        const parsed = JSON.parse(row[3] || "{}");
        current = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
    } else if (String(row[0]).indexOf(VISIT_LOG_ARCHIVE_PREFIX) === 0) {
      try {
        const parsed = JSON.parse(row[3] || "{}");
        archivePages.push({
          n: parseInt(String(row[0]).slice(VISIT_LOG_ARCHIVE_PREFIX.length), 10) || 0,
          entries: Array.isArray(parsed.entries) ? parsed.entries : []
        });
      } catch (err) {}
    }
  });
  archivePages.sort(function(a, b) { return a.n - b.n; }); // mais antigas primeiro
  let all = [];
  archivePages.forEach(function(p) { all = all.concat(p.entries); });
  all = all.concat(current);
  return all;
}

// v138: tempo e nº de ecrãs de cada visita (valores ABSOLUTOS da visita, a mesma linha é atualizada várias vezes).
// Procura a entrada do registo de acessos com o mesmo nome e a mesma hora; se já foi arquivada, ignora.
function updateVisitTime_(sheet, o) {
  if (!o || !o.name || !o.t) return;
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] !== VISIT_LOG_COMP_ID) continue;
    let parsed; try { parsed = JSON.parse(rows[i][3] || "{}"); } catch (err) { return; }
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const name = String(o.name).slice(0, 60);
    for (let k = entries.length - 1; k >= 0 && k >= entries.length - 150; k--) {
      const en = entries[k];
      if (en.name === name && en.t === o.t) {
        const d = Math.max(0, Math.min(21600, Math.floor(Number(o.secs) || 0)));
        const v = Math.max(0, Math.min(99, Math.floor(Number(o.views) || 0)));
        if (d <= (en.d || 0) && v <= (en.v || 0)) return; // nunca diminui
        en.d = Math.max(d, en.d || 0); en.v = Math.max(v, en.v || 0);
        const numCols = Math.max(6, rows[0].length);
        sheet.getRange(i + 1, 1, 1, numCols).setValues([padRow_([VISIT_LOG_COMP_ID, "", "", JSON.stringify({ entries: entries }), "", ""], numCols)]);
        return;
      }
    }
    return;
  }
}

function appendVisitLog_(sheet, entry) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let rowIdx = -1;
  let entries = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === VISIT_LOG_COMP_ID) {
      rowIdx = i + 1;
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
      break;
    }
  }
  entries.push({
    name: String(entry.name || "?").slice(0, 60),
    t: entry.t || new Date().toISOString(),
    type: (["install", "gate_shown", "support_click", "facebook_click", "instagram_click", "install_click"].indexOf(entry.type) !== -1) ? entry.type : "visit",
    notify: !!entry.notify
  });

  if (entries.length > MAX_VISIT_LOG_ENTRIES) {
    // arquiva a página cheia para sempre, numa linha nova, e começa uma página vazia
    archiveFullPage_(sheet, VISIT_LOG_ARCHIVE_PREFIX, entries.slice(0, entries.length - 1));
    entries = [entries[entries.length - 1]]; // só a entrada que acabou de chegar
  }

  const rowData = padRow_([VISIT_LOG_COMP_ID, "", "", JSON.stringify({ entries: entries }), "", ""], numCols);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Cria a próxima linha de arquivo disponível (nunca apaga nenhuma anterior)
function archiveFullPage_(sheet, prefix, entriesToArchive) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let maxN = 0;
  rows.forEach(function(row) {
    if (String(row[0]).indexOf(prefix) === 0) {
      const n = parseInt(String(row[0]).slice(prefix.length), 10) || 0;
      if (n > maxN) maxN = n;
    }
  });
  const newId = prefix + (maxN + 1);
  sheet.appendRow(padRow_([newId, "", "", JSON.stringify({ entries: entriesToArchive }), "", ""], numCols));
}

// Bugs/sugestões reportados por quem usa a app — mesmo padrão do registo de acessos,
// com limite de entradas para nunca crescer sem controlo.
// Nunca manda o token de push de volta ao frontend — não há necessidade
// nenhuma de o admin o ver, é só usado aqui dentro para a resposta chegar ao
// aparelho certo.
function stripPushTokens_(entries) {
  return entries.map(function(e) {
    const copy = Object.assign({}, e);
    delete copy.pushToken;
    return copy;
  });
}

function readFeedback_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === FEEDBACK_COMP_ID) {
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        return Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) { return []; }
    }
  }
  return [];
}

function readFullFeedback_(sheet) {
  const rows = sheet.getDataRange().getValues();
  const archivePages = [];
  let current = [];
  rows.forEach(function(row) {
    if (row[0] === FEEDBACK_COMP_ID) {
      try {
        const parsed = JSON.parse(row[3] || "{}");
        current = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
    } else if (String(row[0]).indexOf(FEEDBACK_ARCHIVE_PREFIX) === 0) {
      try {
        const parsed = JSON.parse(row[3] || "{}");
        archivePages.push({
          n: parseInt(String(row[0]).slice(FEEDBACK_ARCHIVE_PREFIX.length), 10) || 0,
          entries: Array.isArray(parsed.entries) ? parsed.entries : []
        });
      } catch (err) {}
    }
  });
  archivePages.sort(function(a, b) { return a.n - b.n; });
  let all = [];
  archivePages.forEach(function(p) { all = all.concat(p.entries); });
  all = all.concat(current);
  return all;
}

function appendFeedback_(sheet, entry) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let rowIdx = -1;
  let entries = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === FEEDBACK_COMP_ID) {
      rowIdx = i + 1;
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
      break;
    }
  }
  entries.push({
    type: (entry.type === "sugestao") ? "sugestao" : "bug",
    name: String(entry.name || "Anónimo").slice(0, 60),
    message: String(entry.message || "").slice(0, 1000),
    t: entry.t || new Date().toISOString(),
    // guardado só para, se um dia respondermos, sabermos a quem mandar a
    // notificação a sério — nunca é mostrado ao admin (ver stripPushTokens_)
    pushToken: entry.pushToken ? String(entry.pushToken).slice(0, 300) : null
  });

  if (entries.length > MAX_FEEDBACK_ENTRIES) {
    archiveFullPage_(sheet, FEEDBACK_ARCHIVE_PREFIX, entries.slice(0, entries.length - 1));
    entries = [entries[entries.length - 1]];
  }

  const rowData = padRow_([FEEDBACK_COMP_ID, "", "", JSON.stringify({ entries: entries }), "", ""], numCols);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Remove um reporte específico da página atual, pela hora exata a que foi
// enviado (é o que identifica cada reporte de forma praticamente única)
function deleteFeedbackByTime_(sheet, t) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === FEEDBACK_COMP_ID) {
      let entries = [];
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
      entries = entries.filter(function(e) { return e.t !== t; });
      const rowData = padRow_([FEEDBACK_COMP_ID, "", "", JSON.stringify({ entries: entries }), "", ""], numCols);
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
}

// Acrescenta/atualiza a resposta do admin a um reporte específico, pela hora
// exata a que foi enviado — mesma lógica do deleteFeedbackByTime_, mas em vez
// de remover a entrada, só lhe acrescenta o campo "reply". Devolve o token de
// push guardado nessa entrada (ou null), para quem chamar poder avisar a sério
// quem enviou, sem esta função ter de saber nada sobre notificações.
function replyFeedback_(sheet, t, reply) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let pushToken = null;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === FEEDBACK_COMP_ID) {
      let entries = [];
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch (err) {}
      entries = entries.map(function(e) {
        if (e.t === t) {
          e.reply = String(reply || "").slice(0, 500);
          pushToken = e.pushToken || null;
        }
        return e;
      });
      const rowData = padRow_([FEEDBACK_COMP_ID, "", "", JSON.stringify({ entries: entries }), "", ""], numCols);
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return pushToken;
    }
  }
  return pushToken;
}

// Reações (👏🔥😢) por prova — guardadas numa linha reservada própria, completamente
// isolada dos jogos. Estrutura: { "<compId>": { "<eventId>": { "emoji": contagem } } }
const REACTIONS_COMP_ID = "__reactions__";

function readReactions_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === REACTIONS_COMP_ID) {
      try { return JSON.parse(rows[i][3] || "{}"); } catch (err) { return {}; }
    }
  }
  return {};
}

function addReaction_(sheet, compId, eventId, emoji, name) {
  if (!compId || !eventId || !emoji) return; // pedido incompleto, ignora em silêncio
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let all = {};
  let rowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === REACTIONS_COMP_ID) {
      rowIdx = i + 1;
      try { all = JSON.parse(rows[i][3] || "{}"); } catch (err) { all = {}; }
      break;
    }
  }
  if (!all[compId]) all[compId] = {};
  if (!all[compId][eventId]) all[compId][eventId] = {};
  const existing = all[compId][eventId][emoji];
  let list;
  if (Array.isArray(existing)) {
    list = existing;
  } else if (typeof existing === "number") {
    // dados de antes desta versão (só um número) — mantém o total, sem nomes
    // conhecidos para essas reações antigas
    list = [];
    for (let k = 0; k < existing; k++) list.push("Anónimo");
  } else {
    list = [];
  }
  list.push(String(name || "Anónimo").slice(0, 60));
  all[compId][eventId][emoji] = list;

  const rowData = padRow_([REACTIONS_COMP_ID, "", "", JSON.stringify(all), "", ""], numCols);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, numCols).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

const PREDICTIONS_COMP_ID = "__predictions__";

function readPredictions_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PREDICTIONS_COMP_ID) {
      try { return JSON.parse(rows[i][3] || "{}"); } catch (err) { return {}; }
    }
  }
  return {};
}

// Prognóstico (Vitória/Empate/Derrota) de um jogo ainda não começado — mesma
// lógica isolada da addReaction_, numa linha própria, nunca toca em EVENTS.
function addPrediction_(sheet, compId, eventId, option, name) {
  if (!compId || !eventId || !option) return; // pedido incompleto, ignora em silêncio
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  let all = {};
  let rowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PREDICTIONS_COMP_ID) {
      rowIdx = i + 1;
      try { all = JSON.parse(rows[i][3] || "{}"); } catch (err) { all = {}; }
      break;
    }
  }
  if (!all[compId]) all[compId] = {};
  if (!all[compId][eventId]) all[compId][eventId] = {};
  const existing = all[compId][eventId][option];
  let list;
  if (Array.isArray(existing)) {
    list = existing;
  } else if (typeof existing === "number") {
    // dados de antes desta versão (só um número) — mantém o total, sem nomes
    // conhecidos para essas respostas antigas
    list = [];
    for (let k = 0; k < existing; k++) list.push("Anónimo");
  } else {
    list = [];
  }
  list.push(String(name || "Anónimo").slice(0, 60));
  all[compId][eventId][option] = list;

  const rowData2 = padRow_([PREDICTIONS_COMP_ID, "", "", JSON.stringify(all), "", ""], numCols);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, numCols).setValues([rowData2]);
  } else {
    sheet.appendRow(rowData2);
  }
}

// ===================== NEWSLETTER SEMANAL POR EMAIL =====================

function readNewsletterSubscribers_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NEWSLETTER_COMP_ID) {
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        return Array.isArray(parsed.subscribers) ? parsed.subscribers : [];
      } catch (err) { return []; }
    }
  }
  return [];
}

function writeNewsletterSubscribers_(sheet, subscribers) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  const rowData = padRow_([NEWSLETTER_COMP_ID, "", "", JSON.stringify({ subscribers: subscribers }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NEWSLETTER_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Double opt-in: uma inscrição nova fica "por confirmar" até a pessoa clicar no
// link enviado por email — evita que alguém inscreva o email de outra pessoa
// sem ela saber. Subscrições já existentes de antes desta versão (sem o campo
// "confirmed") continuam válidas, tratadas como já confirmadas — não obriga
// quem já estava inscrito a confirmar outra vez.
function subscribeNewsletter_(sheet, email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean || clean.indexOf("@") === -1) return; // email claramente inválido, ignora em silêncio
  const subscribers = readNewsletterSubscribers_(sheet);
  const existing = subscribers.find(function(s) { return s.email === clean; });
  if (existing) {
    if (existing.confirmed !== false) return; // já confirmado (ou é de antes desta versão) — nada a fazer
    sendNewsletterConfirmationEmail_(existing.email, existing.token); // ainda pendente — reenvia o link, sem duplicar a entrada
    return;
  }
  const token = Utilities.getUuid();
  subscribers.push({ email: clean, t: new Date().toISOString(), token: token, confirmed: false });
  writeNewsletterSubscribers_(sheet, subscribers);
  sendNewsletterConfirmationEmail_(clean, token);
}

function confirmNewsletter_(sheet, token) {
  const subscribers = readNewsletterSubscribers_(sheet);
  const idx = subscribers.findIndex(function(s) { return s.token === token; });
  if (idx === -1 || subscribers[idx].confirmed !== false) return false; // token inválido ou já confirmado antes
  subscribers[idx].confirmed = true;
  writeNewsletterSubscribers_(sheet, subscribers);
  return true;
}

function sendNewsletterConfirmationEmail_(email, token) {
  const baseUrl = ScriptApp.getService().getUrl();
  const confirmUrl = baseUrl + "?confirm=" + encodeURIComponent(token);
  const html = '<div style="font-family:sans-serif; background:#0d1b2e; color:#eef2f8; padding:24px; border-radius:8px;">' +
    '<h2 style="color:#e3b23c; margin-top:0;">Confirma a tua inscrição</h2>' +
    '<p>Falta só um passo — clica no botão abaixo para confirmares que queres receber o resumo semanal do Dragão Stats.</p>' +
    '<p style="margin-top:20px;"><a href="' + confirmUrl + '" style="background:#e3b23c; color:#20140a; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">Confirmar inscrição</a></p>' +
    '<p style="font-size:11px; color:#9aa5b1; margin-top:20px;">Se não pediste isto, ignora este email — não vais receber mais nada.</p>' +
    '<p style="font-size:11px; color:#9aa5b1;">Dúvidas ou contacto: dragaostats@gmail.com</p>' +
    '</div>';
  try {
    GmailApp.sendEmail(email, "Confirma a tua inscrição — Dragão Stats", "", {
      htmlBody: html,
      from: NEWSLETTER_FROM,
      name: "Dragão Stats"
    });
  } catch (err) {
    // um email de confirmação a falhar não deve travar nada — a pessoa simplesmente não recebe
  }
}

function unsubscribeNewsletter_(sheet, token) {
  const subscribers = readNewsletterSubscribers_(sheet);
  const filtered = subscribers.filter(function(s) { return s.token !== token; });
  if (filtered.length === subscribers.length) return false; // nenhum token correspondia
  writeNewsletterSubscribers_(sheet, filtered);
  return true;
}

// Corre por um trigger de tempo (configurado à mão no Apps Script, ex: toda a
// segunda-feira às 9h) — junta os resultados dos últimos 7 dias e envia o
// resumo a quem está inscrito. Nunca corre sozinha sem essa configuração.
// Vitória/Empate/Derrota de um jogo — usa SÓ a marcação manual (resultTag),
// a mesma que os botões ✅/🟰/❌ de cada cartão gravam. Não tenta adivinhar a
// partir do placar (isso dava resultados errados em jogos de campo neutro) —
// se não houver marcação manual, simplesmente não mostra selo nenhum.
function getMatchResultTag_(ev, st) {
  if (st && (st.resultTag === "win" || st.resultTag === "draw" || st.resultTag === "loss")) return st.resultTag;
  return null;
}
function resultTagLabel_(tag) {
  if (tag === "win") return '<span style="color:#4caf7d;">✅ Vitória</span>';
  if (tag === "loss") return '<span style="color:#e05c5c;">❌ Derrota</span>';
  // NÃO usar 🟰 aqui: é um emoji de 4 bytes e o GmailApp estraga-o (aparece "?????").
  // ➖ é do mesmo tipo do ✅ e ❌ (3 bytes), que passam bem.
  if (tag === "draw") return '<span style="color:#e3b23c;">➖ Empate</span>';
  return '';
}
// Igual ao de cima, mas em texto simples (sem HTML) — para sítios que não
// interpretam HTML, como o corpo de uma notificação push.
function resultTagLabelPlain_(tag) {
  if (tag === "win") return '✅ Vitória';
  if (tag === "loss") return '❌ Derrota';
  if (tag === "draw") return '🟰 Empate';
  return '';
}

// ===================== NOTIFICAÇÕES PUSH A SÉRIO (Firebase Cloud Messaging) =====================
// Precisa de 3 propriedades do script já configuradas (Definições do projeto →
// Propriedades do script): FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY —
// e da biblioteca "OAuth2 for Apps Script" adicionada ao projeto.

function readPushTokens_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PUSH_TOKENS_COMP_ID) {
      try {
        const parsed = JSON.parse(rows[i][3] || "{}");
        return Array.isArray(parsed.tokens) ? parsed.tokens : [];
      } catch (err) { return []; }
    }
  }
  return [];
}

function writePushTokens_(sheet, tokens) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  const rowData = padRow_([PUSH_TOKENS_COMP_ID, "", "", JSON.stringify({ tokens: tokens }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PUSH_TOKENS_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function registerPushToken_(sheet, token, name) {
  Logger.log("registerPushToken_ chamado — token: " + (token ? (token.slice(0,20) + "...") : "(vazio)") + " nome: " + name);
  if (!token) return; // pedido incompleto, ignora em silêncio
  const tokens = readPushTokens_(sheet);
  const idx = tokens.findIndex(function(t) { return t.token === token; });
  if (idx >= 0) {
    tokens[idx].name = name || tokens[idx].name;
    tokens[idx].t = new Date().toISOString();
  } else {
    tokens.push({ token: token, name: String(name || "?").slice(0, 60), t: new Date().toISOString() });
  }
  writePushTokens_(sheet, tokens);
  Logger.log("Tokens guardados agora: " + tokens.length);
}

// Autentica-se junto da Google usando a chave de conta de serviço (via a
// biblioteca OAuth2), para poder pedir ao Firebase Cloud Messaging que envie
// notificações — é a parte "complicada" que a biblioteca resolve por nós.
function getFcmService_() {
  const props = PropertiesService.getScriptProperties();
  const privateKey = props.getProperty("FCM_PRIVATE_KEY").replace(/\\n/g, "\n");
  return OAuth2.createService("FCM")
    .setTokenUrl("https://oauth2.googleapis.com/token")
    .setPrivateKey(privateKey)
    .setIssuer(props.getProperty("FCM_CLIENT_EMAIL"))
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope("https://www.googleapis.com/auth/firebase.messaging");
}

// Envia a mesma notificação a todos os telemóveis/browsers registados. Cada
// envio é isolado — se um telemóvel falhar (ex: desinstalou a app), não afeta
// os restantes.
// Constrói o link "vai direto a este jogo" para uma notificação — usado tanto
// nas automáticas de resultado como nas escritas à mão, quando o admin liga a
// notificação a um jogo em concreto. Sem evId, devolve undefined (o envio usa
// então o link genérico da página inicial).
function buildEventPushLink_(evId, compId) {
  if (!evId) return undefined;
  let link = "https://dragaostats.pt/?jogo=" + encodeURIComponent(evId);
  if (compId) link += "&comp=" + encodeURIComponent(compId);
  return link;
}

// Quando o telemóvel/browser de alguém troca sozinho de "código de receção"
// (acontece de vez em quando, sem ninguém fazer nada), o código antigo ficava
// para sempre na lista — e como enviamos para todos os códigos guardados, essa
// pessoa recebia a mesma notificação duas vezes. Aqui só se mantém o código
// mais recente por nome, aproveitando que os nomes já não se repetem entre
// pessoas diferentes (ver claimViewerName_). Nomes "?" nunca se juntam entre
// si, para nunca arriscar misturar duas pessoas diferentes por engano.
function dedupeTokensByName_(tokens) {
  const latestByName = {};
  const keepAsIs = [];
  tokens.forEach(function(t) {
    if (!t.name || t.name === "?") { keepAsIs.push(t); return; }
    const current = latestByName[t.name];
    if (!current || (t.t || "") > (current.t || "")) latestByName[t.name] = t;
  });
  return keepAsIs.concat(Object.values(latestByName));
}

function sendPushToAll_(title, body, link) {
  const sheet = getSheet_();
  appendSentPushHistory_(sheet, title, body); // regista sempre, mesmo que ninguém tenha avisos ligados — serve para saberes o que já foi dito, não para confirmar entrega
  const rawTokens = readPushTokens_(sheet);
  const tokens = dedupeTokensByName_(rawTokens);
  if (tokens.length !== rawTokens.length) writePushTokens_(sheet, tokens); // aproveita e limpa os códigos antigos guardados, para não continuar a acumular
  Logger.log("sendPushToAll_: " + tokens.length + " token(s) registado(s)");
  sendPushToTokenList_(tokens, title, body, link);
}

// Notificação dirigida a UM único aparelho (ex: resposta a um feedback) — não
// entra no histórico geral de avisos, porque não é um aviso para toda a gente.
function sendPushToOneToken_(token, title, body) {
  if (!token) return;
  sendPushToTokenList_([{ token: token, name: "(resposta a feedback)" }], title, body);
}

// A parte comum a sendPushToAll_ e sendPushToOneToken_ — manda o mesmo pedido
// ao FCM para cada token da lista dada. Cada envio é isolado: se um telemóvel
// falhar (ex: desinstalou a app), não afeta os restantes.
function sendPushToTokenList_(tokenObjs, title, body, link) {
  if (!tokenObjs || tokenObjs.length === 0) return;

  const service = getFcmService_();
  const hasAccess = service.hasAccess();
  Logger.log("hasAccess: " + hasAccess);
  if (!hasAccess) {
    Logger.log("Erro OAuth2: " + service.getLastError());
    return; // a chave não está bem configurada — falha em silêncio, não trava a gravação
  }

  const accessToken = service.getAccessToken();
  const projectId = PropertiesService.getScriptProperties().getProperty("FCM_PROJECT_ID");
  const url = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";
  const finalLink = link || "https://dragaostats.pt"; // por defeito, sem jogo associado, abre só a página inicial

  tokenObjs.forEach(function(t) {
    const payload = {
      message: {
        token: t.token,
        notification: { title: title, body: body },
        // Urgency:"high" pede ao FCM/browser para tratar isto como urgente e
        // tentar entregar mais depressa — ajuda em muitos telemóveis, mas não
        // consegue contornar poupanças de bateria muito agressivas de alguns
        // fabricantes (isso só se desativa nas definições do próprio aparelho)
        webpush: { headers: { Urgency: "high" }, fcm_options: { link: finalLink } }
      }
    };
    try {
      const resp = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + accessToken },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      Logger.log("Envio para " + t.name + ": código " + resp.getResponseCode() + " — " + resp.getContentText());
    } catch (err) {
      Logger.log("Erro a enviar para " + t.name + ": " + err.message);
      // um telemóvel a falhar não deve travar o envio aos restantes
    }
  });
}

// Corre à mão no editor do Apps Script, para confirmares que todo o mecanismo
// (chave, biblioteca, tokens registados) está mesmo a funcionar de ponta a ponta.
function sendTestPush() {
  sendPushToAll_("🔔 Teste", "Se estás a ver isto, os avisos a sério estão a funcionar!");
}

// ===================== AVISO A SÉRIO 15 MIN ANTES DO JOGO =====================
// Corre sozinho de X em X minutos (gatilho por tempo, ver installUpcomingGamesTrigger
// mais abaixo) — não depende de ninguém ter a app aberta, ao contrário do aviso
// antigo que vivia só no index.html.

function readNotifiedUpcoming_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NOTIFIED_UPCOMING_COMP_ID) {
      try { return JSON.parse(rows[i][3]).notified || {}; } catch (e) { return {}; }
    }
  }
  return {};
}

function writeNotifiedUpcoming_(sheet, notified) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([NOTIFIED_UPCOMING_COMP_ID, "", "", JSON.stringify({ notified: notified }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NOTIFIED_UPCOMING_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Chamada pelo gatilho — vê todos os jogos (só Modo Modalidades, que tem data e
// hora reais; Modo Medalhas só guarda o dia do mês, não dá para calcular "faltam
// X minutos") e avisa a sério quem faltar entre 0 e UPCOMING_REMINDER_MINUTES
// minutos para começar. Cada jogo só avisa uma vez (guardado na Sheet, sobrevive
// a reiniciar o relógio do gatilho).
function checkUpcomingGamesForPush_() {
  recordHeartbeat_("upcoming");
  updateStandingsIfDue_(); // classificações: no máximo de hora a hora (v94)
  noticiasSeDevido_();     // v140: notícias das modalidades (de hora a hora) + imagens pendentes
  const sheet = getSheet_();
  const result = readAll_(sheet);
  const now = new Date();
  const notified = readNotifiedUpcoming_(sheet);
  let changed = false;

  result.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const compData = result.data[c.id] || {};
    const events = compData.events || [];
    events.forEach(function(ev) {
      if (!ev.day || !ev.t) return;
      if (notified[ev.id]) return; // já avisado
      const evDate = new Date(ev.day + "T" + ev.t + ":00");
      if (isNaN(evDate)) return;
      const diffMin = (evDate - now) / 60000;
      if (diffMin >= 0 && diffMin <= UPCOMING_REMINDER_MINUTES) {
        try {
          sendPushToAll_("⏰ Falta pouco!", ev.sport + ": vs " + ev.athlete + (ev.detail ? " · " + ev.detail : "") + " às " + ev.t, buildEventPushLink_(ev.id, c.id));
        } catch (pushErr) {
          Logger.log("Erro a enviar aviso de jogo próximo: " + pushErr.message);
        }
        notified[ev.id] = evDate.toISOString();
        changed = true;
      }
    });
  });

  // limpeza: tira do registo jogos de há mais de 2 dias, para a lista nunca crescer para sempre
  Object.keys(notified).forEach(function(id) {
    const t = new Date(notified[id]);
    if (isNaN(t) || (now - t) / 3600000 > 48) {
      delete notified[id];
      changed = true;
    }
  });

  if (changed) writeNotifiedUpcoming_(sheet, notified);

  // aproveita o mesmo relógio de 5 em 5 minutos para despachar notificações
  // agendadas pelo admin, sem precisar de um segundo gatilho instalado à parte
  try {
    checkScheduledPush_();
  } catch (schedErr) {
    Logger.log("Erro a verificar notificações agendadas: " + schedErr.message);
  }
  // v93: lembretes "Lembrar-me" pedidos por cada pessoa (1 hora antes do jogo)
  try {
    checkGameRemindersForPush_();
  } catch (remErr) {
    Logger.log("Erro a verificar lembretes de jogo: " + remErr.message);
  }
}

// Corre isto UMA VEZ, à mão, no editor do Apps Script (seleciona esta função no
// menu de cima e carrega em "Executar") para ligar o relógio de 5 em 5 minutos.
// Apaga primeiro qualquer gatilho antigo com o mesmo nome, para nunca ficar com
// dois a correr ao mesmo tempo caso corras isto outra vez sem querer.
function installUpcomingGamesTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkUpcomingGamesForPush_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkUpcomingGamesForPush_")
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log("Gatilho instalado — checkUpcomingGamesForPush_ vai correr de 5 em 5 minutos.");
}

// ===================== "LEMBRAR-ME" NUM JOGO (v93) =====================
// Cada pessoa pode pedir um aviso para um jogo. Guardado numa linha reservada:
// { reminders: { idDoJogo: [token, token...] }, sent: { idDoJogo: dataISO } }
function readGameReminders_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === GAME_REMINDERS_COMP_ID) {
      try {
        const p = JSON.parse(rows[i][3] || "{}");
        return { reminders: p.reminders || {}, sent: p.sent || {}, started: p.started || {} };
      } catch (e) { return { reminders: {}, sent: {}, started: {} }; }
    }
  }
  return { reminders: {}, sent: {}, started: {} };
}

function writeGameReminders_(sheet, data) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([GAME_REMINDERS_COMP_ID, "", "", JSON.stringify(data), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === GAME_REMINDERS_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Liga/desliga o lembrete deste aparelho para um jogo. Devolve o estado final (true = ligado).
function setGameReminder_(sheet, token, evId, on) {
  if (!token || !evId) return false;
  const data = readGameReminders_(sheet);
  const list = data.reminders[evId] || [];
  const idx = list.indexOf(token);
  if (on && idx < 0) list.push(token);
  if (!on && idx >= 0) list.splice(idx, 1);
  if (list.length) data.reminders[evId] = list; else delete data.reminders[evId];
  writeGameReminders_(sheet, data);
  return on;
}

// Corre dentro do relógio de 5 em 5 minutos (chamada por checkUpcomingGamesForPush_).
// Quando falta 1 hora ou menos para um jogo (e ainda não começou), avisa só quem pediu.
function checkGameRemindersForPush_() {
  const sheet = getSheet_();
  const data = readGameReminders_(sheet);
  const ids = Object.keys(data.reminders);
  if (!ids.length) return;
  const result = readAll_(sheet);
  const now = new Date();
  let changed = false;
  const known = {};
  result.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((result.data[c.id] || {}).events || []).forEach(function(ev) {
      known[ev.id] = { ev: ev, compId: c.id };
    });
  });
  ids.forEach(function(evId) {
    const k = known[evId];
    if (!k || !k.ev.day || !k.ev.t) return;
    const evDate = new Date(k.ev.day + "T" + k.ev.t + ":00");
    if (isNaN(evDate)) return;
    const diffMin = (evDate - now) / 60000;
    // v133: "Já começou!" — para quem pediu o lembrete deste jogo, até 15 min depois da hora marcada (grava antes de enviar: nunca repete)
    if (!data.started) data.started = {};
    if (!data.started[evId] && diffMin <= 0 && diffMin >= -15 && !(((((result.data[k.compId] || {}).status || {})[evId] || {}).resultado || "").toString().trim())) {
      data.started[evId] = now.toISOString();
      changed = true;
      writeGameReminders_(sheet, data);
      const toksS = (data.reminders[evId] || []).map(function(t) { return { token: t, name: "(jogo começou)" }; });
      const temDireto = k.ev.sport !== "Futsal";
      try {
        sendPushToTokenList_(toksS, "🔴 Já começou!", k.ev.sport + ": FC Porto vs " + k.ev.athlete + (temDireto ? " — acompanha em direto no Dragão Stats" : " — resultado no Dragão Stats"), buildEventPushLink_(evId, k.compId));
      } catch (errS) { Logger.log("Erro a enviar aviso de início: " + errS.message); }
    }
    if (data.sent[evId]) return;
    if (diffMin > 0 && diffMin <= GAME_REMINDER_MINUTES) {
      const toks = data.reminders[evId].map(function(t) { return { token: t, name: "(lembrete de jogo)" }; });
      try {
        sendPushToTokenList_(toks, "⏰ Daqui a 1 hora", k.ev.sport + ": FC Porto vs " + k.ev.athlete + (k.ev.detail ? " · " + k.ev.detail : "") + " às " + k.ev.t, buildEventPushLink_(evId, k.compId));
      } catch (err) { Logger.log("Erro a enviar lembrete: " + err.message); }
      data.sent[evId] = evDate.toISOString();
      changed = true;
    }
  });
  // limpeza: tira jogos que já passaram há mais de 2 dias
  Object.keys(data.reminders).forEach(function(evId) {
    const k = known[evId];
    const t = k && k.ev.day ? new Date(k.ev.day + "T" + (k.ev.t || "00:00") + ":00") : null;
    if (!k || !t || isNaN(t) || (now - t) / 3600000 > 48) {
      delete data.reminders[evId]; delete data.sent[evId]; if (data.started) delete data.started[evId]; changed = true;
    }
  });
  if (changed) writeGameReminders_(sheet, data);
}

// ===================== AVISO A SÉRIO NA VÉSPERA DO JOGO (v90) =====================
// Completamente independente do aviso de 15 min antes (checkUpcomingGamesForPush_)
// — tem o seu próprio registo de "já avisei este jogo", por isso os dois disparam
// para o mesmo jogo, cada um na sua altura, sem se pisarem. Corre só UMA VEZ por
// dia (ver installDayBeforeTrigger mais abaixo), ao fim da tarde/noite, e avisa de
// todos os jogos marcados para o dia seguinte.

function readNotifiedDayBefore_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NOTIFIED_DAYBEFORE_COMP_ID) {
      try { return JSON.parse(rows[i][3]).notified || {}; } catch (e) { return {}; }
    }
  }
  return {};
}

function writeNotifiedDayBefore_(sheet, notified) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([NOTIFIED_DAYBEFORE_COMP_ID, "", "", JSON.stringify({ notified: notified }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === NOTIFIED_DAYBEFORE_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// "2026-10-16" -> "2026-10-17" (dia seguinte), sem depender de fuso horário —
// construído a partir dos números do próprio texto, tal como o resto do script
// já faz noutros sítios (ver formatFullDatePt_).
function tomorrowDateStr_(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

function checkDayBeforeGamesForPush_() {
  recordHeartbeat_("dayBefore");
  const sheet = getSheet_();
  const result = readAll_(sheet);
  const now = new Date();
  const tomorrow = tomorrowDateStr_(now);
  const notified = readNotifiedDayBefore_(sheet);
  let changed = false;

  result.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const compData = result.data[c.id] || {};
    const events = compData.events || [];
    events.forEach(function(ev) {
      if (!ev.day || ev.day !== tomorrow) return;
      if (notified[ev.id]) return; // já avisado
      try {
        sendPushToAll_(
          "📅 Amanhã há jogo!",
          ev.sport + ": vs " + ev.athlete + (ev.t ? " às " + ev.t : "") + (ev.detail ? " · " + ev.detail : ""),
          buildEventPushLink_(ev.id, c.id)
        );
      } catch (pushErr) {
        Logger.log("Erro a enviar aviso de véspera: " + pushErr.message);
      }
      notified[ev.id] = now.toISOString();
      changed = true;
    });
  });

  // limpeza: tira do registo jogos de há mais de 4 dias, para a lista nunca crescer para sempre
  Object.keys(notified).forEach(function(id) {
    const t = new Date(notified[id]);
    if (isNaN(t) || (now - t) / 3600000 > 96) {
      delete notified[id];
      changed = true;
    }
  });

  if (changed) writeNotifiedDayBefore_(sheet, notified);
}

// Corre isto UMA VEZ, à mão, no editor do Apps Script — liga o relógio diário
// (por volta das 19h) que avisa da véspera. Apaga primeiro qualquer gatilho
// antigo com o mesmo nome, tal como os outros installX já fazem.
function installDayBeforeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkDayBeforeGamesForPush_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkDayBeforeGamesForPush_")
    .timeBased()
    .everyDays(1)
    .atHour(19)
    .create();
  Logger.log("Gatilho instalado — checkDayBeforeGamesForPush_ vai correr uma vez por dia, por volta das 19h.");
}

// ===================== LEMBRETE DE PALPITE (v90) =====================
// Aviso geral (não sabe quem já palpitou e quem não) — se houver jogo(s) marcado(s)
// para hoje com pergunta de prognóstico, manda UM único aviso de manhã a convidar
// a fazer o palpite antes de começarem. Corre uma vez por dia; o registo de "já
// mandei hoje" vive numa linha reservada própria, para nunca duplicar mesmo que
// o gatilho seja corrido à mão por engano no mesmo dia.

function readPredictionReminderSentDate_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PREDICTION_REMINDER_SENT_COMP_ID) {
      try { return JSON.parse(rows[i][3]).date || null; } catch (e) { return null; }
    }
  }
  return null;
}

function writePredictionReminderSentDate_(sheet, dateStr) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([PREDICTION_REMINDER_SENT_COMP_ID, "", "", JSON.stringify({ date: dateStr }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PREDICTION_REMINDER_SENT_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function todayDateStr_(now) {
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + mm + "-" + dd;
}

function checkPredictionReminderForPush_() {
  recordHeartbeat_("predictionReminder");
  const sheet = getSheet_();
  const now = new Date();
  const today = todayDateStr_(now);

  if (readPredictionReminderSentDate_(sheet) === today) return; // já mandado hoje, não repete

  const result = readAll_(sheet);
  let count = 0;
  result.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const compData = result.data[c.id] || {};
    const events = compData.events || [];
    events.forEach(function(ev) {
      if (ev.day !== today || !ev.predictionQuestion) return;
      // só conta jogos que ainda não começaram — não faz sentido pedir palpite
      // de um jogo que já está a decorrer ou já acabou
      if (ev.t) {
        const evDate = new Date(ev.day + "T" + ev.t + ":00");
        if (!isNaN(evDate) && evDate <= now) return;
      }
      count++;
    });
  });

  if (count === 0) return; // sem jogos com prognóstico hoje, não há nada a lembrar

  try {
    sendPushToAll_(
      "🎯 Já fizeste o teu palpite?",
      count === 1 ? "Há um jogo hoje à espera do teu palpite!" : "Há " + count + " jogos hoje à espera do teu palpite!",
      "https://dragaostats.pt"
    );
  } catch (pushErr) {
    Logger.log("Erro a enviar lembrete de palpite: " + pushErr.message);
  }
  writePredictionReminderSentDate_(sheet, today);
}

// Corre isto UMA VEZ, à mão, no editor do Apps Script — liga o relógio diário
// (por volta das 10h) do lembrete de palpite.
function installPredictionReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkPredictionReminderForPush_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkPredictionReminderForPush_")
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
  Logger.log("Gatilho instalado — checkPredictionReminderForPush_ vai correr uma vez por dia, por volta das 10h.");
}

// ===================== NOMES DE VISITANTE ÚNICOS (João, João 2, João 3...) =====================
// Tira acentos, baixa para minúsculas e limpa espaços a mais — para "João",
// "joão" e "Joao" contarem todos como o mesmo nome ao verificar duplicados.
function normalizeViewerName_(name) {
  return String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // tira acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function readClaimedNames_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === CLAIMED_NAMES_COMP_ID) {
      try { return JSON.parse(rows[i][3]).claimed || {}; } catch (e) { return {}; }
    }
  }
  return {};
}

function writeClaimedNames_(sheet, claimed) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([CLAIMED_NAMES_COMP_ID, "", "", JSON.stringify({ claimed: claimed }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === CLAIMED_NAMES_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Dá um nome final a quem entra pela primeira vez. Se o nome (sem acentos,
// minúsculas) ainda não tiver sido usado por ninguém, fica tal e qual foi
// escrito. Se já tiver, devolve o mesmo nome com " 2", " 3", etc. — o primeiro
// a chegar é que fica com o nome "limpo".
function claimViewerName_(sheet, rawName) {
  const typed = String(rawName || "").trim() || "Anónimo";
  const key = normalizeViewerName_(typed);
  const claimed = readClaimedNames_(sheet);
  const usedForKey = claimed[key] || [];

  let finalName;
  if (usedForKey.length === 0) {
    finalName = typed;
  } else {
    finalName = typed + " " + (usedForKey.length + 1);
  }

  usedForKey.push(finalName);
  claimed[key] = usedForKey;
  writeClaimedNames_(sheet, claimed);
  return finalName;
}

// ===================== NOTIFICAÇÕES AGENDADAS (dispara sozinha à hora marcada) =====================
// ===================== HISTÓRICO DE NOTIFICAÇÕES JÁ ENVIADAS =====================
function readSentPushHistory_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SENT_PUSH_HISTORY_COMP_ID) {
      try { return JSON.parse(rows[i][3]).history || []; } catch (e) { return []; }
    }
  }
  return [];
}

function appendSentPushHistory_(sheet, title, body) {
  const history = readSentPushHistory_(sheet);
  history.push({ title: title, body: body, sentAt: new Date().toISOString() });
  while (history.length > MAX_SENT_PUSH_HISTORY) history.shift(); // tira sempre a mais antiga primeiro

  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([SENT_PUSH_HISTORY_COMP_ID, "", "", JSON.stringify({ history: history }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SENT_PUSH_HISTORY_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// ===================== FILA DE ESPERA DO AVISO DE "NOVO RESULTADO" =====================
function readPendingResultNotifs_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PENDING_RESULT_NOTIFS_COMP_ID) {
      try { return JSON.parse(rows[i][3]).pending || []; } catch (e) { return []; }
    }
  }
  return [];
}

function writePendingResultNotifs_(sheet, pending) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([PENDING_RESULT_NOTIFS_COMP_ID, "", "", JSON.stringify({ pending: pending }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === PENDING_RESULT_NOTIFS_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Corre a cada minuto (ver installPendingResultNotifTrigger). Para cada aviso
// já pronto (passou o tempo de espera), vai buscar o resultado e o selo
// Vitória/Empate/Derrota MAIS RECENTES à Sheet (não o que estava no momento em
// que o resultado foi escrito) — assim, mesmo que o selo só tenha sido
// marcado uns segundos depois, o aviso já sai com ele incluído.
function checkPendingResultNotifications_() {
  recordHeartbeat_("pendingResult");
  const sheet = getSheet_();
  const pending = readPendingResultNotifs_(sheet);
  if (!pending.length) return;
  const now = new Date();
  const stillWaiting = [];

  // agrupa por competição, para só ler cada uma uma vez mesmo com vários jogos pendentes
  const byComp = {};
  pending.forEach(function(p) {
    const readyAt = new Date(p.readyAt);
    if (isNaN(readyAt) || readyAt > now) { stillWaiting.push(p); return; }
    if (!byComp[p.compId]) byComp[p.compId] = [];
    byComp[p.compId].push(p);
  });

  Object.keys(byComp).forEach(function(compId) {
    const full = readCompetitionFull_(sheet, compId);
    if (!full) return;
    // competição do Modo Medalhas (só para quem edita) — nunca avisa toda a
    // gente, mesmo que lá se escreva um resultado. Só avisa de competições
    // públicas (Modo Modalidades), tal como já acontecia no aviso "Falta pouco".
    if (findCompMode_(sheet, compId) !== "matches") return;
    byComp[compId].forEach(function(p) {
      const ev = (full.events || []).filter(function(e) { return e.id === p.id; })[0];
      const st = (full.status || {})[p.id];
      if (!ev || !st || !st.resultado || !String(st.resultado).trim()) return; // resultado foi apagado entretanto — não avisa nada
      const tagPlain = resultTagLabelPlain_(getMatchResultTag_(ev, st));
      try {
        sendPushToAll_("🔔 Novo resultado", ev.sport + ": vs " + ev.athlete + " — " + (tagPlain ? tagPlain + " · " : "") + st.resultado.trim(), buildEventPushLink_(p.id, compId));
      } catch (pushErr) {
        Logger.log("Erro a enviar aviso de novo resultado: " + pushErr.message);
      }
    });
  });

  if (stillWaiting.length !== pending.length) writePendingResultNotifs_(sheet, stillWaiting);
}

// Corre isto UMA VEZ, à mão, tal como o installUpcomingGamesTrigger — liga o
// relógio de minuto a minuto que despacha os avisos de resultado em espera.
function installPendingResultNotifTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkPendingResultNotifications_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkPendingResultNotifications_")
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log("Gatilho instalado — checkPendingResultNotifications_ vai correr a cada minuto.");
}

function readScheduledPush_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SCHEDULED_PUSH_COMP_ID) {
      try { return JSON.parse(rows[i][3]).scheduled || []; } catch (e) { return []; }
    }
  }
  return [];
}

function writeScheduledPush_(sheet, scheduled) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([SCHEDULED_PUSH_COMP_ID, "", "", JSON.stringify({ scheduled: scheduled }), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === SCHEDULED_PUSH_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Chamada pelo mesmo gatilho de 5 em 5 minutos que já trata dos avisos de jogo
// (checkUpcomingGamesForPush_) — vê se alguma notificação agendada já chegou à
// hora marcada e, se sim, envia-a a sério e tira-a da lista de pendentes.
function checkScheduledPush_() {
  const sheet = getSheet_();
  const scheduled = readScheduledPush_(sheet);
  if (!scheduled.length) return;
  const now = new Date();
  const stillPending = [];
  scheduled.forEach(function(s) {
    const sendAt = new Date(s.sendAt);
    if (!isNaN(sendAt) && sendAt <= now) {
      try {
        sendPushToAll_(s.title, s.body, buildEventPushLink_(s.evId, s.compId));
      } catch (pushErr) {
        Logger.log("Erro a enviar notificação agendada: " + pushErr.message);
      }
    } else {
      stillPending.push(s); // ainda não chegou a hora, ou data inválida — mantém-se na lista
    }
  });
  if (stillPending.length !== scheduled.length) writeScheduledPush_(sheet, stillPending);
}

// Constrói o corpo do email do resumo semanal (resultados da semana passada +
// jogos a acontecer esta semana + os avisos discretos do fim). Devolve null se
// não houver nada para mostrar (sem resultados nem jogos agendados) — usado
// tanto pelo envio a sério como pelo envio de teste, para nunca haver duas
// versões do mesmo email a divergir uma da outra.
function buildNewsletterEmail_(sheet) {
  const result = readAll_(sheet);
  // semana de segunda de manhã a domingo à noite — não os últimos 7 dias a partir
  // de agora. Se isto correr à segunda de manhã, apanha a segunda-feira anterior
  // (00:00) até ao domingo que acabou de terminar (23:59:59), a semana inteira
  // que já passou, mesmo que o próprio dia de hoje já tenha algum jogo novo.
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = todayMidnight.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
  const daysToThisMonday = (dow + 6) % 7; // segunda->0, terça->1, ..., domingo->6
  const thisMonday = new Date(todayMidnight);
  thisMonday.setDate(thisMonday.getDate() - daysToThisMonday);
  const weekStart = new Date(thisMonday);
  weekStart.setDate(weekStart.getDate() - 7); // a segunda-feira da semana ANTERIOR
  const weekEnd = thisMonday; // exclusivo — tudo antes desta segunda-feira conta
  // janela de "jogos a acontecer": os próximos 7 dias a partir de AGORA, não
  // "resto desta semana no calendário" — assim funciona bem seja em que dia for
  // que isto correr (o envio a sério é sempre à segunda, mas um teste feito a
  // meio da semana também deve mostrar jogos a sério, não ficar vazio)
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  Logger.log("Janela de resultados: " + weekStart + " até " + weekEnd);
  Logger.log("Competições encontradas: " + result.competitions.length + " — modos: " + result.competitions.map(function(c){ return c.name + " (" + c.mode + (c.archived ? ", arquivada" : "") + ")"; }).join(" | "));

  const bySport = {};
  const upcomingBySport = {};
  let totalEventsComResultado = 0;
  result.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const compData = result.data[c.id] || {};
    const events = compData.events || [];
    const status = compData.status || {};
    events.forEach(function(ev) {
      const st = status[ev.id] || {}; // resultado e resultTag vivem aqui, não no próprio evento
      const evDate = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
      if (isNaN(evDate)) return;
      if (st.resultado && String(st.resultado).trim()) {
        totalEventsComResultado++;
        if (evDate < weekStart || evDate >= weekEnd) return;
        if (!bySport[ev.sport]) bySport[ev.sport] = [];
        bySport[ev.sport].push({ ev: ev, st: st, compId: c.id });
      } else {
        // ainda sem resultado — conta como "a acontecer" se cair esta semana
        if (evDate < now || evDate >= sevenDaysFromNow) return;
        if (!upcomingBySport[ev.sport]) upcomingBySport[ev.sport] = [];
        upcomingBySport[ev.sport].push({ ev: ev, compId: c.id });
      }
    });
  });
  Logger.log("Jogos com resultado (em qualquer altura): " + totalEventsComResultado + " — dentro da janela desta semana: " + Object.keys(bySport).reduce(function(sum, s){ return sum + bySport[s].length; }, 0));

  const sportNames = Object.keys(bySport).sort();
  const upcomingSportNames = Object.keys(upcomingBySport).sort();
  if (sportNames.length === 0 && upcomingSportNames.length === 0) {
    Logger.log("Sem resultados nem jogos agendados esta semana — não há nada a mostrar.");
    return null;
  }

  const totalResults = sportNames.reduce(function(sum, s) { return sum + bySport[s].length; }, 0);
  const intro = totalResults === 0
    ? "Esta semana ainda não há resultados para mostrar, mas o calendário não para:"
    : totalResults <= 2
    ? "Foi uma semana calma, mas não passou despercebida:"
    : "Foi uma semana cheia! Aqui fica o resumo:";

  let bodyHtml = '<div style="font-family:sans-serif; background:#0d1b2e; color:#eef2f8; padding:24px;">' +
    '<h2 style="color:#e3b23c;">Resumo da semana — Dragão Stats</h2>' +
    '<p style="margin:0 0 16px;">Olá! ' + intro + '</p>';
  sportNames.forEach(function(sport) {
    bodyHtml += '<h3 style="margin-bottom:6px;">' + sport + '</h3>';
    bySport[sport].sort(function(a, b) { return (a.ev.day || "").localeCompare(b.ev.day || ""); }).forEach(function(item) {
      const ev = item.ev, st = item.st;
      const comp = ev.detail ? (' (' + ev.detail + (ev.phase ? ' · ' + ev.phase : '') + ')') : '';
      const tagHtml = resultTagLabel_(getMatchResultTag_(ev, st));
      const link = buildEventPushLink_(ev.id, item.compId);
      bodyHtml += '<p style="margin:4px 0;"><a href="' + link + '" style="color:#eef2f8; text-decoration:none;">vs ' + ev.athlete + ' — ' + (tagHtml ? tagHtml + ' · ' : '') + '<b>' + st.resultado + '</b>' + comp + '</a></p>';
    });
  });

  if (upcomingSportNames.length > 0) {
    bodyHtml += '<h3 style="margin:20px 0 6px; color:#93a2bd;">Esta semana também há</h3>';
    upcomingSportNames.forEach(function(sport) {
      bodyHtml += '<h4 style="margin-bottom:4px; color:#c7d2e6;">' + sport + '</h4>';
      upcomingBySport[sport].sort(function(a, b) { return (a.ev.day || "").localeCompare(b.ev.day || ""); }).forEach(function(item) {
        const ev = item.ev;
        const comp = ev.detail ? (' (' + ev.detail + (ev.phase ? ' · ' + ev.phase : '') + ')') : '';
        const link = buildEventPushLink_(ev.id, item.compId);
        const diaSemana = formatFullDatePt_(ev.day);
        bodyHtml += '<p style="margin:4px 0; font-size:14px; color:#c7d2e6;"><a href="' + link + '" style="color:#c7d2e6; text-decoration:none;">vs ' + ev.athlete + ' — ' + diaSemana + ', ' + (ev.t || '') + comp + '</a></p>';
      });
    });
  }

  bodyHtml += '<div style="margin-top:20px; display:flex; align-items:center; gap:14px;">' +
    '<img src="data:image/png;base64,' + NEWSLETTER_QR_BASE64 + '" width="64" height="64" alt="QR dragaostats.pt" style="border-radius:6px;">' +
    '<p style="margin:0;">Podes ver mais detalhes, estatísticas e reagir aos resultados em <a href="https://dragaostats.pt" style="color:#e3b23c;">dragaostats.pt</a>.<br><span style="font-size:11px; color:#7a8aa8;">A ler isto no computador? Aponta a câmara do telemóvel ao código para abrires lá.</span></p>' +
    '</div>' +
    '<p style="margin-top:16px; font-size:13px; color:#c7d2e6;">→ Já agora — sabias que também dá para ativar notificações no site? Serás avisado sempre que um resultado seja colocado, sem teres de andar a verificar. <a href="https://dragaostats.pt" style="color:#e3b23c;">Ativa aqui</a>.</p>' +
    '<p style="margin-top:8px; font-size:13px; color:#c7d2e6;">→ Conheces mais alguém adepto destas modalidades? Passa-lhe a palavra sobre o site!</p>' +
    '<p style="margin-top:8px; font-size:13px; color:#c7d2e6;">→ Segue-nos também no <a href="https://www.facebook.com/profile.php?id=61594855463005" style="color:#e3b23c;">Facebook</a> e no <a href="https://www.instagram.com/dragaostats/" style="color:#e3b23c;">Instagram</a> para não perderes nenhum resultado.</p>' +
    '<p style="margin-top:16px; font-size:11px; color:#7a8aa8;">☕ Se um dia quiseres ajudar a cobrir os custos do projeto, há um botão de apoio voluntário <a href="https://ko-fi.com/dragaostats" style="color:#7a8aa8;">aqui</a> — totalmente opcional, a app continua sempre gratuita.</p>' +
    '<p style="margin-top:12px;">Até para semana!</p>' +
    '</div>';

  return { subject: "Resumo da semana — Dragão Stats", bodyHtml: bodyHtml };
}

// "2026-09-20" -> "Domingo, 20 Setembro" (mesma lógica usada no frontend,
// reescrita aqui porque o Apps Script não tem acesso ao código do site)
function formatFullDatePt_(dateStr) {
  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return dias[d.getDay()] + ", " + d.getDate() + " " + meses[d.getMonth()];
}

function sendWeeklyNewsletter() {
  recordHeartbeat_("newsletter");
  const sheet = getSheet_();
  const subscribers = readNewsletterSubscribers_(sheet).filter(function(s) { return s.confirmed !== false; }); // só quem já confirmou (ou é de antes do double opt-in)
  Logger.log("Subscritores confirmados: " + subscribers.length + " — " + subscribers.map(function(s){ return s.email; }).join(", "));
  if (subscribers.length === 0) return; // ninguém inscrito, não há nada a fazer

  const email = buildNewsletterEmail_(sheet);
  if (!email) return; // sem resultados nem jogos esta semana, não manda email vazio

  const baseUrl = ScriptApp.getService().getUrl();
  subscribers.forEach(function(sub) {
    const unsubscribeUrl = baseUrl + '?unsubscribe=' + encodeURIComponent(sub.token);
    const fullHtml = email.bodyHtml.replace(
      '</div>',
      '<p style="font-size:11px; color:#9aa5b1;">Já não queres receber isto? <a href="' + unsubscribeUrl + '" style="color:#9aa5b1;">Cancelar subscrição</a></p>' +
      '<p style="font-size:11px; color:#9aa5b1;">Dúvidas ou contacto: dragaostats@gmail.com</p></div>'
    );
    try {
      GmailApp.sendEmail(sub.email, email.subject, "", {
        htmlBody: fullHtml,
        from: NEWSLETTER_FROM,
        name: "Dragão Stats"
      });
      Logger.log("Email enviado para " + sub.email);
    } catch (err) {
      Logger.log("Erro a enviar para " + sub.email + ": " + err.message);
      // um envio a falhar (ex: email inválido) não deve travar os restantes
    }
  });
}

function readAll_(sheet) {
  repairNumericNames_(sheet); // corrige sozinho linhas antigas cujo "nome" ficou um número de dia

  const rows = sheet.getDataRange().getValues();
  const names = {};
  const archived = {};
  const modes = {};
  const events = {};
  const status = {};
  rows.forEach(function(row) {
    const id = row[0], name = row[2], json = row[3], archivedFlag = row[4], modeFlag = row[5];
    if (!id || id === SETTINGS_COMP_ID || id === VISIT_LOG_COMP_ID || id === FEEDBACK_COMP_ID || id === REACTIONS_COMP_ID || id === PREDICTIONS_COMP_ID || id === NEWSLETTER_COMP_ID || id === PUSH_TOKENS_COMP_ID
      || id === NOTIFIED_UPCOMING_COMP_ID || id === CLAIMED_NAMES_COMP_ID || id === SCHEDULED_PUSH_COMP_ID || id === SENT_PUSH_HISTORY_COMP_ID || id === PENDING_RESULT_NOTIFS_COMP_ID
      || id === NOTIFIED_DAYBEFORE_COMP_ID || id === PREDICTION_REMINDER_SENT_COMP_ID || id === GAME_REMINDERS_COMP_ID || id === STANDINGS_COMP_ID
      || String(id).indexOf(VISIT_LOG_ARCHIVE_PREFIX) === 0 || String(id).indexOf(FEEDBACK_ARCHIVE_PREFIX) === 0) return; // linhas reservadas nunca são "competições"
    // repairNumericNames_ já garantiu, mesmo antes disto, que todas as linhas
    // do mesmo id têm o mesmo nome "a sério" — aqui é só ler
    names[id] = name || id;
    if (String(archivedFlag).trim() === "1") archived[id] = true;
    if (modeFlag) modes[id] = modeFlag;
    let parsed;
    try { parsed = JSON.parse(json || "{}"); } catch (err) { parsed = { events: [], status: {} }; }
    events[id] = (events[id] || []).concat(Array.isArray(parsed.events) ? parsed.events : []);
    status[id] = Object.assign(status[id] || {}, parsed.status || {});
  });
  const competitions = Object.keys(names).map(function(id) {
    return { id: id, name: names[id], archived: !!archived[id], mode: modes[id] || "medals" };
  });
  const data = {};
  competitions.forEach(function(c) {
    data[c.id] = { events: dedupeById_(events[c.id] || []), status: status[c.id] || {} };
  });
  return { competitions: competitions, data: data };
}

// Corrige diretamente na Sheet qualquer linha cujo nome tenha ficado só um número de dia,
// copiando o primeiro nome "a sério" que encontrar para esse mesmo id.
function repairNumericNames_(sheet) {
  const rows = sheet.getDataRange().getValues();
  const goodNameByCompId = {};
  rows.forEach(function(row) {
    const id = row[0], name = row[2];
    if (!id || !name) return;
    if (!isBadCompName_(name) && !goodNameByCompId[id]) goodNameByCompId[id] = name;
  });
  let changed = false;
  rows.forEach(function(row, idx) {
    const id = row[0], name = row[2];
    if (!id) return;
    if (isBadCompName_(name) && goodNameByCompId[id] && goodNameByCompId[id] !== name) {
      sheet.getRange(idx + 1, 3).setValue(goodNameByCompId[id]);
      changed = true;
    }
  });
  if (changed) SpreadsheetApp.flush();
}

function migrateOldFormatIfNeeded_(sheet) {
  const rows = sheet.getDataRange().getValues();
  const hasNewFormat = rows.some(function(row) { return row[0] && row.length >= 4 && row[3]; });
  if (hasNewFormat) return;

  let competitions = [];
  let data = {};

  const hasOldRowFormat = rows.some(function(row) { return row[0] && row[2] && !row[3]; });
  if (hasOldRowFormat) {
    rows.forEach(function(row) {
      const id = row[0], name = row[1], json = row[2];
      if (!id) return;
      competitions.push({ id: id, name: name || id });
      try { data[id] = JSON.parse(json || "{}"); } catch (err) { data[id] = { events: [], status: {} }; }
    });
  } else {
    const a1 = sheet.getRange('A1').getValue();
    if (!a1) return;
    let parsed;
    try { parsed = JSON.parse(a1); } catch (err) { return; }
    if (parsed && Array.isArray(parsed.competitions)) {
      competitions = parsed.competitions;
      data = parsed.data || {};
    } else {
      competitions = [{ id: "taranto2026", name: "Jogos do Mediterrâneo 2026" }];
      data = { "taranto2026": { events: Array.isArray(parsed.events) ? parsed.events : [], status: parsed.status || {} } };
    }
  }

  const numCols = Math.max(6, rows.length ? rows[0].length : 6);
  // preserva o "arquivada?" e o "modo" de cada competição, se já existir
  const archivedByComp = {};
  const modeByComp = {};
  rows.forEach(function(row) {
    if (!row[0]) return;
    if (row[4]) archivedByComp[row[0]] = row[4];
    if (row[5]) modeByComp[row[0]] = row[5];
  });

  const finalRows = [];
  competitions.forEach(function(c) {
    const compData = data[c.id] || { events: [], status: {} };
    const events = Array.isArray(compData.events) ? compData.events : [];
    const status = compData.status || {};
    const archivedFlag = archivedByComp[c.id] || "";
    const modeFlag = c.mode || modeByComp[c.id] || "medals";
    const byDay = {};
    events.forEach(function(ev) {
      const d = ev.day || "_sem_dia";
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(ev);
    });
    const days = Object.keys(byDay);
    if (days.length === 0) {
      finalRows.push(padRow_([c.id, "", c.name, JSON.stringify({ events: [], status: {} }), archivedFlag, modeFlag], numCols));
    } else {
      days.forEach(function(day) {
        const dayEvents = byDay[day];
        const idsThisDay = {};
        dayEvents.forEach(function(ev) { idsThisDay[ev.id] = true; });
        const dayStatus = {};
        Object.keys(status).forEach(function(id) { if (idsThisDay[id]) dayStatus[id] = status[id]; });
        finalRows.push(padRow_([c.id, day, c.name, JSON.stringify({ events: dayEvents, status: dayStatus }), archivedFlag, modeFlag], numCols));
      });
    }
  });

  // Escreve por cima sem apagar primeiro — a mesma proteção usada em writeCompetitionByDay_
  const oldRowCount = rows.length;
  if (finalRows.length > 0) {
    sheet.getRange(1, 1, finalRows.length, numCols).setValues(finalRows);
  }
  if (finalRows.length < oldRowCount) {
    sheet.getRange(finalRows.length + 1, 1, oldRowCount - finalRows.length, numCols).clearContent();
  }
  SpreadsheetApp.flush();
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName('Dados') || ss.insertSheet('Dados');
}

// ===================== BACKUP AUTOMÁTICO + SAÚDE DOS GATILHOS (v82) =====================
// Cópia semanal da Sheet para uma pasta do teu Drive, e uma verificação diária
// que te avisa por email se algum gatilho deixou de correr (ou está preso numa
// versão antiga). Para ligar tudo, corre UMA VEZ installBackupAndHealthTriggers.

const BACKUP_FOLDER_NAME = "Dragão Stats — Backups";
const BACKUP_FILE_PREFIX = "Backup Dragão Stats ";
const BACKUP_KEEP_WEEKS = 8; // cópias mais antigas que isto vão para o lixo do Drive
const HEARTBEAT_MIN_GAP_MS = 10 * 60 * 1000; // não regista o "sinal de vida" mais do que de 10 em 10 min

// hint = o que fazer se o gatilho estiver parado
const HEALTH_CHECKS_ = [
  { key: "upcoming", label: "Aviso de jogo (gatilho de 5 em 5 min)", maxAgeHours: 1, checkVersion: true,
    hint: "Corre installUpcomingGamesTrigger no editor para o recriar." },
  { key: "pendingResult", label: "Aviso de resultado (gatilho de minuto a minuto)", maxAgeHours: 1, checkVersion: true,
    hint: "Corre installPendingResultNotifTrigger no editor para o recriar." },
  { key: "aoVivo", label: "Resultados ao vivo (gatilho de minuto a minuto)", maxAgeHours: 1, checkVersion: true,
    hint: "Corre installCevLiveTrigger no editor para o recriar." },
  { key: "newsletter", label: "Newsletter semanal", maxAgeHours: 24 * 8, checkVersion: false,
    hint: "Apaga o gatilho de sendWeeklyNewsletter no painel Gatilhos e cria-o de novo (segunda de manhã)." },
  { key: "backup", label: "Backup semanal da Sheet", maxAgeHours: 24 * 8, checkVersion: false,
    hint: "Corre installBackupAndHealthTriggers no editor para o recriar." },
  { key: "dayBefore", label: "Aviso de véspera (gatilho diário, ~19h)", maxAgeHours: 30, checkVersion: true,
    hint: "Corre installDayBeforeTrigger no editor para o recriar." },
  { key: "predictionReminder", label: "Lembrete de palpite (gatilho diário, ~10h)", maxAgeHours: 30, checkVersion: true,
    hint: "Corre installPredictionReminderTrigger no editor para o recriar." }
];

// Regista que um gatilho correu, e com que versão do código. Escreve no máximo de
// 10 em 10 minutos (por gatilho) para não sobrecarregar.
function recordHeartbeat_(name) {
  try {
    const props = PropertiesService.getScriptProperties();
    const key = "HB_" + name;
    const now = Date.now();
    const raw = props.getProperty(key);
    if (raw) {
      const prev = JSON.parse(raw);
      if (prev && prev.v === SCRIPT_VERSION && (now - prev.t) < HEARTBEAT_MIN_GAP_MS) return;
    }
    props.setProperty(key, JSON.stringify({ t: now, v: SCRIPT_VERSION }));
  } catch (err) {
    // o sinal de vida nunca pode estragar o trabalho real do gatilho
  }
}

// Guarda qual é a versão que a app web (a publicada em "Gerir implementações")
// está a correr. Usa a cache para só escrever quando a versão muda.
function noteWebVersion_() {
  try {
    const cache = CacheService.getScriptCache();
    if (cache.get("webver") === SCRIPT_VERSION) return;
    PropertiesService.getScriptProperties().setProperty("WEB_VERSION", SCRIPT_VERSION);
    cache.put("webver", SCRIPT_VERSION, 21600);
  } catch (err) {
    // nunca pode estragar a resposta ao visitante
  }
}

function getBackupFolder_() {
  const it = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
}

// Chamada pelo gatilho semanal (domingo de madrugada): faz uma cópia da Sheet e
// põe no lixo as cópias com mais de BACKUP_KEEP_WEEKS semanas (o lixo do Drive
// ainda guarda 30 dias, por isso nada se perde de imediato).
function backupSheetWeekly_() {
  const folder = getBackupFolder_();
  const stamp = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd_HH-mm");
  DriveApp.getFileById(SHEET_ID).makeCopy(BACKUP_FILE_PREFIX + stamp, folder);

  const cutoff = new Date(Date.now() - BACKUP_KEEP_WEEKS * 7 * 24 * 3600 * 1000);
  const files = folder.getFiles();
  let trashed = 0;
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf(BACKUP_FILE_PREFIX) === 0 && f.getDateCreated() < cutoff) {
      f.setTrashed(true);
      trashed++;
    }
  }
  recordHeartbeat_("backup"); // só depois de a cópia ter mesmo corrido bem
  Logger.log("Backup feito: " + BACKUP_FILE_PREFIX + stamp + " (pasta \"" + BACKUP_FOLDER_NAME + "\"). Cópias antigas para o lixo: " + trashed);
}

function fmtAge_(hours) {
  if (hours < 1) return Math.max(1, Math.round(hours * 60)) + " min";
  if (hours < 48) return Math.round(hours) + " h";
  return Math.round(hours / 24) + " dias";
}

// Verificação diária. Se houver problemas, manda email (texto simples).
// Chamada pelo gatilho — por isso não usa o parâmetro que o gatilho passa.
function checkHealth_() {
  runHealthCheck_(false);
}

// Para testares à mão no editor: envia SEMPRE um email com o estado atual.
function healthCheckNow() {
  runHealthCheck_(true);
}

function runHealthCheck_(force) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const since = Number(props.getProperty("HEALTH_SINCE")) || now;
  const webVersion = props.getProperty("WEB_VERSION") || "";
  const problems = [];
  const lines = [];

  HEALTH_CHECKS_.forEach(function(c) {
    let hb = null;
    try { hb = JSON.parse(props.getProperty("HB_" + c.key) || "null"); } catch (e) { hb = null; }
    const maxAgeMs = c.maxAgeHours * 3600000;
    if (!hb) {
      lines.push("- " + c.label + ": ainda sem registo de execução");
      if (now - since > maxAgeMs) {
        problems.push(c.label + ": sem sinal de vida desde que o verificador foi instalado. Pode estar apagado, parado ou preso numa versão antiga. " + c.hint);
      }
      return;
    }
    const ageH = (now - hb.t) / 3600000;
    lines.push("- " + c.label + ": última vez há " + fmtAge_(ageH) + " (versão " + hb.v + ")");
    if (ageH > c.maxAgeHours) {
      problems.push(c.label + ": não corre há " + fmtAge_(ageH) + " (esperado no máximo a cada " + fmtAge_(c.maxAgeHours) + "). " + c.hint);
    } else if (c.checkVersion && webVersion && hb.v !== webVersion) {
      problems.push(c.label + ": está a correr a versão " + hb.v + ", mas a app web está na " + webVersion + ". " + c.hint);
    }
  });

  lines.push("- App web (versão publicada): " + (webVersion || "ainda sem registo") + " · verificador: " + SCRIPT_VERSION);
  if (webVersion && webVersion !== SCRIPT_VERSION) {
    problems.push("O código guardado (" + SCRIPT_VERSION + ") não é o mesmo que a app web está a servir (" + webVersion + "). Se acabaste de atualizar, confirma que fizeste \"Gerir implementações → editar → Nova versão\".");
  }

  if (!problems.length && !force) {
    Logger.log("Verificação diária: tudo em ordem.");
    return;
  }

  const to = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
  const head = problems.length
    ? "⚠️ " + problems.length + " problema(s) encontrado(s):\n\n" + problems.map(function(p) { return "• " + p; }).join("\n\n")
    : "✅ Tudo em ordem.";
  const body = head + "\n\n---\nEstado atual:\n" + lines.join("\n");
  GmailApp.sendEmail(to, (problems.length ? "⚠️ " : "✅ ") + "Dragão Stats — verificação diária", body);
  Logger.log("Email da verificação enviado para " + to + " (" + problems.length + " problema(s)).");
}

// Corre isto UMA VEZ, à mão, no editor do Apps Script. Liga o backup semanal
// (domingo, por volta das 3h) e a verificação diária (por volta das 9h), e faz já
// a primeira cópia — é aqui que o Google te pede autorização para usar o Drive.
function installBackupAndHealthTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    const h = t.getHandlerFunction();
    if (h === "backupSheetWeekly_" || h === "checkHealth_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("backupSheetWeekly_")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
  ScriptApp.newTrigger("checkHealth_")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("HEALTH_SINCE")) props.setProperty("HEALTH_SINCE", String(Date.now()));
  backupSheetWeekly_();
  Logger.log("Gatilhos instalados — backup semanal (domingo ~3h) e verificação diária (~9h).");
}

// =====================================================================================
// AO VIVO — marcador da CEV (voleibol)                                          (v92)
// Lê a lista de jogos do site oficial da CEV (livescores.cev.eu) de minuto a minuto,
// SÓ durante os jogos de voleibol do dia, e guarda o marcador numa "propriedade do
// script" (não na Sheet). O doGet devolve-o ao site junto com o resto.
// NUNCA escreve resultados nem estatísticas na Sheet — o que se escreve à mão
// continua a ser a única fonte de verdade. Se a CEV falhar ou mudar, simplesmente
// deixa de haver marcador ao vivo, e o site fica como estava.
// Para ligar: correr UMA VEZ, à mão, installCevLiveTrigger().
// =====================================================================================
const CEV_BASE_ = "https://livescores.cev.eu";
const CEV_LIVE_PROP_ = "cevLive";
const CEV_WATCH_PROP_ = "cevWatch";
const CEV_SPORTS_ = ["Voleibol"];
const CEV_CLUB_CODE_ = "FCP";

// Lido pelo doGet. Dados com mais de 10 minutos já não são "ao vivo" — ignora-os.
function readCevLive_() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(CEV_LIVE_PROP_);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (!obj || !obj.updated || Math.abs(Date.now() - obj.updated) > 10 * 60 * 1000) return {};
    return obj;
  } catch (e) { return {}; }
}

function cevNorm_(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
// Dois nomes "batem" se um contém o outro, ou se partilham uma palavra com 4+ letras.
function cevNomesBatem_(a, b) {
  const A = cevNorm_(a), B = cevNorm_(b);
  if (!A || !B) return false;
  if (A.indexOf(B) >= 0 || B.indexOf(A) >= 0) return true;
  const pb = B.split(" ");
  return A.split(" ").some(function(w) { return w.length >= 4 && pb.indexOf(w) >= 0; });
}

// Lista (para hoje) dos jogos de voleibol que temos na Sheet, em competições de jogos.
function buildCevWatch_(sheet, hojeISO) {
  const all = readAll_(sheet);
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const events = (all.data[c.id] || {}).events || [];
    events.forEach(function(ev) {
      if (CEV_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hojeISO || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport });
    });
  });
  return { day: hojeISO, builtAt: Date.now(), items: items };
}

// Transforma um jogo da CEV no formato pequeno que o site usa. Sempre "FC Porto primeiro".
function cevResumo_(m) {
  const fcpCasa = m.HomeClubCode === CEV_CLUB_CODE_;
  const sets = [];
  for (let i = 1; i <= 5; i++) {
    const h = Number(m["Set" + i + "_Home"]) || 0, g = Number(m["Set" + i + "_Guest"]) || 0;
    if (h || g) sets.push(fcpCasa ? [h, g] : [g, h]);
  }
  const wonH = Number(m.WonSetHome) || 0, wonG = Number(m.WonSetGuest) || 0;
  const temPontos = sets.length > 0 || wonH + wonG > 0 || (Number(m.PointsHome) || 0) + (Number(m.PointsGuest) || 0) > 0;
  const fin = !!m.Finalized;
  // a CEV marca "In Progress" (MatchStatus 3) assim que o jogo começa, mesmo antes do primeiro ponto
  const emCurso = /progress/i.test(String(m.MatchStatusDescription || ""));
  return {
    estado: fin ? "fim" : ((temPontos || emCurso) ? "vivo" : "agendado"),
    cev: m.MatchID,
    setsFcp: fcpCasa ? wonH : wonG,
    setsAdv: fcpCasa ? wonG : wonH,
    sets: sets,
    status: String(m.MatchStatusDescription || "")
  };
}

// forcar = true ignora a janela de horas (para testes à mão).
function atualizarAoVivoCevCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");

  let watch = null;
  try { watch = JSON.parse(props.getProperty(CEV_WATCH_PROP_) || "null"); } catch (e) { watch = null; }
  if (!watch || watch.day !== hoje || (agora - (watch.builtAt || 0)) > 30 * 60 * 1000) {
    watch = buildCevWatch_(getSheet_(), hoje);
    props.setProperty(CEV_WATCH_PROP_, JSON.stringify(watch));
  }

  const ativos = watch.items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 4 * 3600000;
  });
  if (!ativos.length) return "sem jogos de voleibol em curso";

  const dataCev = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyyMMdd");
  const resp = UrlFetchApp.fetch(CEV_BASE_ + "/api/matches/week/" + dataCev + "/" + dataCev,
    { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
  if (resp.getResponseCode() !== 200) return "CEV respondeu " + resp.getResponseCode();
  const lista = (JSON.parse(resp.getContentText()).data) || [];

  const candidatos = lista.filter(function(m) {
    return m.HomeClubCode === CEV_CLUB_CODE_ || m.GuestClubCode === CEV_CLUB_CODE_;
  });
  const out = {};
  ativos.forEach(function(it) {
    for (let i = 0; i < candidatos.length; i++) {
      const m = candidatos[i];
      const nomeAdv = m.HomeClubCode === CEV_CLUB_CODE_ ? m.GuestTeamName : m.HomeTeamName;
      if (cevNomesBatem_(it.adv, nomeAdv)) {
        out[it.id] = cevResumo_(m);
        out[it.id].adv = it.adv;      // nome do adversário como está no nosso site
        out[it.id].sport = it.sport;  // para o cartão "Ao vivo agora"
        break;
      }
    }
  });
  props.setProperty(CEV_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

// É isto que o gatilho de minuto a minuto chama. Nunca deixa um erro escapar.
function atualizarAoVivoCev_() {
  try { atualizarAoVivoCevCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoCev_ — erro: " + e); }
  atualizarAoVivoHoquei_(); // hóquei em patins (v95), no mesmo gatilho de minuto a minuto
  atualizarAoVivoAndebol_(); // andebol (v96), idem
  atualizarAoVivoVoleiNac_(); // voleibol do campeonato nacional (v97), idem
  atualizarAoVivoEquipaB_(); // Equipa B, Liga Portugal (v99), idem
  atualizarAoVivoBasquete_(); // basquetebol, FIBA LiveStats (v100), idem
  atualizarAoVivoSofascore_(); // futebol feminino, andebol e futsal, Sofascore (v102), idem
  recordHeartbeat_("aoVivo");
  verificarSaudeAoVivo_(); // v108: avisa por email se um jogo a decorrer não tem dados ao vivo
  verificarLigacaoAntes_(); // v134: avisa ANTES do jogo se o Sofascore não o encontra (dá tempo de pôr o ID)
  try { verificarSaudeFontesSeDevido_(); usoResumoSemanalSeDevido_(); resumoMensalSeDevido_(); } catch (eF) { Logger.log("fontes/uso — erro: " + eF); } // v131
  try { backupDiarioSeDevido_(); } catch (eB) { Logger.log("backup diário — erro: " + eB); } // v132
  try { escudosAtualizarSeDevido_(); } catch (e) {} // v109: lista de equipas/escudos (de 12 em 12 h)
  try { formasAtualizarSeDevido_(); } catch (e) {} // v116: forma recente dos adversários (de 6 em 6 h)
  try { plantelAtualizarSeDevido_(); } catch (e) {} // v120: plantel oficial do site do FC Porto (de 24 em 24 h)
  try { compStdAtualizarSeDevido_(); } catch (e) {} // v123: classificações das competições europeias/taças (de hora a hora)
}

// Para testar à mão, a qualquer hora: ignora a janela de horas e mostra o que fez.
function testarAoVivoCevAgora() {
  Logger.log(atualizarAoVivoCevCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(CEV_LIVE_PROP_));
}

// Corre isto UMA VEZ, à mão — liga o relógio de minuto a minuto.
function installCevLiveTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "atualizarAoVivoCev_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("atualizarAoVivoCev_").timeBased().everyMinutes(1).create();
  Logger.log("Gatilho instalado — atualizarAoVivoCev_ vai correr a cada minuto.");
}

// ===================== CLASSIFICAÇÕES (v94) =====================
// Lê de hora a hora a classificação de cada modalidade e guarda-a numa linha reservada da folha.
// O site só lê o resultado (campo "standings" do doGet). Se uma fonte falhar, fica a última boa.
// Futsal não tem fonte automática: é preenchida à mão em modo edição (setManualStandings).
const STANDINGS_COMP_ID = "__classificacoes__";
const STANDINGS_EVERY_MINUTES = 60;
const STANDINGS_LAST_RUN_PROP_ = "standingsLastRun";

const STANDINGS_SOURCES_ = [
  { sport: "Andebol",          url: "https://portal.fpa.pt/prova/10016/",                         source: "Federação de Andebol de Portugal", parse: parseStandingsFpa_ },
  { sport: "Voleibol",         url: "https://www.portugalvoleibol.com/classificacao/classificacao.php?campeonato=NSFI&fase=1&serie=.", source: "Federação Portuguesa de Voleibol", parse: parseStandingsFpv_ },
  { sport: "Basquetebol",      url: "https://www.fpb.pt/classificacao/11440",                      source: "Federação Portuguesa de Basquetebol", parse: parseStandingsFpb_ },
  { sport: "Hóquei Patins",    url: "https://www.hoqueipatins.pt/liga/1-divisao-regular/",         source: "hoqueipatins.pt", parse: parseStandingsHoquei_ },
  { sport: "Futebol Feminino", url: "https://www.fcporto.pt/pt/futebol/feminino/classificacao",    source: "fcporto.pt", parse: parseStandingsFcporto_ },
  { sport: "Equipa B",         url: "https://www.fcporto.pt/pt/futebol/fcportob/classificacao",    source: "fcporto.pt", parse: parseStandingsFcporto_ },
  // v103: Futsal via Sofascore (3ª Divisão, 1ª Fase, Série A, época 26/27). Os números mudam de época para época:
  // torneio 112814 / época 102039 (vêm no jogo: event.tournament.id e event.season.id). A edição manual fica como reserva.
  // v149: Futebol (Liga Portugal) via Sofascore; os números da época descobrem-se pelos jogos da equipa (urlFn)
  { sport: "Equipa A",          urlFn: function() { return sofaLigaUrl_("Equipa A"); }, source: "Sofascore", headers: { "Accept": "application/json" }, parse: function(t) { return parseStandingsSofascore_(t, "Liga Portugal", "", "Equipa A"); } },
  { sport: "Futsal",           url: "https://api.sofascore.com/api/v1/tournament/112814/season/102039/standings/total", source: "Sofascore", headers: { "Accept": "application/json" }, parse: parseStandingsSofascore_ }
];

function readStandingsStore_(sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === STANDINGS_COMP_ID) {
      try {
        const p = JSON.parse(rows[i][3] || "{}");
        return { auto: p.auto || {}, manual: p.manual || {}, errors: p.errors || {} };
      } catch (e) { return { auto: {}, manual: {}, errors: {} }; }
    }
  }
  return { auto: {}, manual: {}, errors: {} };
}

function writeStandingsStore_(sheet, data) {
  const rows = sheet.getDataRange().getValues();
  const numCols = Math.max(sheet.getLastColumn(), 6);
  const rowData = padRow_([STANDINGS_COMP_ID, "", "", JSON.stringify(data), "", ""], numCols);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === STANDINGS_COMP_ID) {
      sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// O que o site recebe: por modalidade, a automática (se existir e não estiver velha de mais) ou a manual.
function standingsForSite_(sheet) {
  const st = readStandingsStore_(sheet);
  const out = {};
  const sports = {};
  Object.keys(st.auto).forEach(function(k) { sports[k] = true; });
  Object.keys(st.manual).forEach(function(k) { sports[k] = true; });
  Object.keys(sports).forEach(function(sport) {
    const a = st.auto[sport], m = st.manual[sport];
    const autoFresh = a && a.updated && (Date.now() - a.updated) < 72 * 3600 * 1000;
    if (autoFresh) out[sport] = a;
    else if (m) out[sport] = m;
    else if (a) out[sport] = a;
  });
  return out;
}

function standingsFetch_(url, headers) {
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: headers || {} });
  if (r.getResponseCode() !== 200) throw new Error("código " + r.getResponseCode());
  return r.getContentText();
}

// Corre sozinha (a partir do gatilho de 5 minutos) no máximo de hora a hora.
function updateStandingsIfDue_() {
  try {
    const props = PropertiesService.getScriptProperties();
    const last = Number(props.getProperty(STANDINGS_LAST_RUN_PROP_) || 0);
    if (Date.now() - last < STANDINGS_EVERY_MINUTES * 60 * 1000) return;
    props.setProperty(STANDINGS_LAST_RUN_PROP_, String(Date.now()));
    updateStandings_();
  } catch (e) { Logger.log("updateStandingsIfDue_: " + e); }
}


// ===================== ZONAS DAS CLASSIFICAÇÕES (v137) =====================
// Linha de água / apuramentos / lugares europeus. Vêm do Sofascore (campo "promotion" de cada linha) para o Futsal,
// as competições europeias e — por posição, só se a tabela tiver o MESMO número de equipas e os mesmos nomes — para
// as tabelas das federações; no Hóquei vêm das cores das linhas da própria página. O site só desenha.
// Formato: zonas = [ { a: 1, b: 8, k: "playoff", t: "Playoffs" } ] (a..b = posições, k = tipo/cor, t = texto) e zonasN = nº de equipas.
const ZONAS_PT_ = {
  "champions league":                { k: "europa",  t: "Liga dos Campeões" },
  "champions league qualification":  { k: "europa2", t: "Qualificação Liga dos Campeões" },
  "europa league":                   { k: "europa2", t: "Liga Europa" },
  "europa conference league":        { k: "europa3", t: "Liga Conferência" },
  "europa league qualification":     { k: "europa2", t: "Qualificação Liga Europa" },   // v150 (Liga Portugal)
  "conference league qualification": { k: "europa3", t: "Qualificação Liga Conferência" }, // v150
  "conference league":               { k: "europa3", t: "Liga Conferência" },
  "european league ehf":             { k: "europa2", t: "Liga Europeia (EHF)" },
  "promotion":                       { k: "sobe",    t: "Subida" },
  "promotion playoffs":              { k: "psobe",   t: "Playoff de subida" },
  "promotion round":                 { k: "fase",    t: "Fase de subida" },
  "relegation":                      { k: "desce",   t: "Descida" },
  "relegation playoffs":             { k: "pdesce",  t: "Playoff de descida" },
  "relegation round":                { k: "fdesce",  t: "Fase de descida" },
  "playoffs":                        { k: "playoff", t: "Playoffs" },
  "qualification playoffs":          { k: "pq",      t: "Playoff de qualificação" },
  "main round":                      { k: "playoff", t: "Fase seguinte" },
  "championship round":              { k: "playoff", t: "Fase de campeonato" },
  "qualifying round":                { k: "fase",    t: "Fase de qualificação" }
};
// A Equipa B não pode subir de divisão: esconde as zonas de subida nessa tabela.
const ZONAS_OCULTAR_ = {};

function zonaPT_(txt) {
  const k = String(txt || "").trim().toLowerCase();
  return ZONAS_PT_[k] || { k: "fase", t: String(txt || "").trim() };
}

// linhas = [{ position, promotion:{text} }]  →  [{a,b,k,t}] (posições seguidas com a mesma zona ficam juntas)
function zonasDeLinhas_(linhas, sport) {
  const ocultar = ZONAS_OCULTAR_[sport] || [];
  const ord = linhas.slice().sort(function(x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); });
  const out = [];
  ord.forEach(function(l) {
    const pos = Number(l.position) || 0;
    if (!pos || !l.promotion || !l.promotion.text) return;
    const z = zonaPT_(l.promotion.text);
    if (ocultar.indexOf(z.k) >= 0) return;
    const ult = out[out.length - 1];
    if (ult && ult.t === z.t && ult.k === z.k && ult.b === pos - 1) ult.b = pos;
    else out.push({ a: pos, b: pos, k: z.k, t: z.t });
  });
  return out;
}

// Procura, no Sofascore, a tabela do campeonato nacional (a época em curso) que corresponde à tabela da federação:
// mesmo número de equipas, o FC Porto lá dentro e pelo menos 60% dos nomes a bater. Devolve zonas ou null.
function zonasSofaDescobrir_(sport, fedRows) {
  const cfg = SOFA_SPORTS_[sport];
  if (!cfg || !fedRows || !fedRows.length) return null;
  const agora = Date.now() / 1000, comps = {};
  ["next", "last"].forEach(function(k) {
    const q = sofaGet_("team/" + cfg.teamId + "/events/" + k + "/0");
    ((q.dados && q.dados.events) || []).forEach(function(e) {
      const t = e.tournament || {}, ut = t.uniqueTournament || {}, se = e.season || {};
      if (!ut.id || !se.id || !e.startTimestamp) return;
      const pais = (((ut.category || t.category) || {}).name) || "";
      if (!/^portugal$/i.test(pais)) return;
      const d = Math.abs(e.startTimestamp - agora);
      if (!comps[ut.id] || d < comps[ut.id].d) comps[ut.id] = { ut: ut.id, se: se.id, d: d };
    });
  });
  let melhor = null;
  Object.keys(comps).forEach(function(id) {
    const c = comps[id];
    const q = sofaGet_("unique-tournament/" + c.ut + "/season/" + c.se + "/standings/total");
    if (!q.dados) return;
    (q.dados.standings || []).forEach(function(tb) {
      const rows = tb.rows || [];
      if (rows.length !== fedRows.length) return;
      if (!rows.some(function(r) { return sofaEhPorto_(r.team); })) return;
      let bat = 0;
      rows.forEach(function(r) {
        const n = (r.team && (r.team.name || r.team.shortName)) || "";
        if (fedRows.some(function(f) { return cevNomesBatem_(f.t, n); })) bat++;
      });
      if (bat < Math.ceil(rows.length * 0.6)) return;
      const zonas = zonasDeLinhas_(rows.map(function(r) { return { position: r.position, promotion: r.promotion }; }), sport);
      if (!melhor || (!melhor.length && zonas.length)) melhor = zonas;
    });
  });
  return melhor;
}

// v149: endereço da tabela do campeonato nacional (Sofascore) a partir dos jogos da equipa: país "Portugal" e nome com "Liga Portugal"/"Primeira Liga".
function sofaLigaUrl_(sport) {
  const cfg = SOFA_SPORTS_[sport];
  if (!cfg) return "";
  const agora = Date.now() / 1000;
  let melhor = null;
  ["next", "last"].forEach(function(k) {
    const q = sofaGet_("team/" + cfg.teamId + "/events/" + k + "/0");
    ((q.dados && q.dados.events) || []).forEach(function(e) {
      const t = e.tournament || {}, ut = t.uniqueTournament || {}, se = e.season || {};
      if (!ut.id || !se.id || !e.startTimestamp) return;
      const nome = String(ut.name || t.name || "");
      const pais = (((ut.category || t.category) || {}).name) || "";
      if (!/^portugal$/i.test(pais) || !/liga portugal|primeira liga|liga betclic/i.test(nome) || /liga 2|segunda|meu super|u23|sub/i.test(nome)) return;
      const d = Math.abs(e.startTimestamp - agora);
      if (!melhor || d < melhor.d) melhor = { ut: ut.id, se: se.id, d: d };
    });
  });
  return melhor ? SOFA_BASE_ + "unique-tournament/" + melhor.ut + "/season/" + melhor.se + "/standings/total" : "";
}

function updateStandings_() {
  const sheet = getSheet_();
  const store = readStandingsStore_(sheet);
  STANDINGS_SOURCES_.forEach(function(src) {
    try {
      const urlFonte = src.urlFn ? src.urlFn() : src.url;
      if (!urlFonte) throw new Error("não encontrei o campeonato no Sofascore");
      const html = standingsFetch_(urlFonte, src.headers);
      const res = src.parse(html);
      if (!res || !res.rows || res.rows.length < 4) throw new Error("tabela com poucas linhas");
      const antes = store.auto[src.sport] || {};
      store.auto[src.sport] = {
        sport: src.sport, comp: res.comp || "", fase: res.fase || "", source: src.source, url: urlFonte,
        updated: Date.now(), cols: res.cols, rows: res.rows,
        zonas: res.zonas || antes.zonas || [], zonasN: res.zonas ? res.rows.length : (antes.zonasN || 0)
      };
      // v137: zonas pelo Sofascore para as tabelas das federações (falha → fica a última boa)
      if (!res.zonas && SOFA_SPORTS_[src.sport]) {
        try {
          const z = zonasSofaDescobrir_(src.sport, res.rows);
          if (z) { store.auto[src.sport].zonas = z; store.auto[src.sport].zonasN = res.rows.length; }
          else if (store.auto[src.sport].zonasN !== res.rows.length) { store.auto[src.sport].zonas = []; store.auto[src.sport].zonasN = 0; }
        } catch (ez) { Logger.log("Zonas " + src.sport + ": " + ez); }
      }
      delete store.errors[src.sport];
    } catch (e) {
      store.errors[src.sport] = { when: Date.now(), msg: String(e).substring(0, 200) };
      Logger.log("Classificação " + src.sport + " falhou: " + e);
    }
    Utilities.sleep(800);
  });
  writeStandingsStore_(sheet, store);
}

// Para correres à mão (Executar) e veres o que cada fonte devolve, sem esperar pela hora.
function atualizarClassificacoesAgora() {
  PropertiesService.getScriptProperties().setProperty(STANDINGS_LAST_RUN_PROP_, String(Date.now()));
  updateStandings_();
  const st = readStandingsStore_(getSheet_());
  STANDINGS_SOURCES_.forEach(function(src) {
    const a = st.auto[src.sport], er = st.errors[src.sport];
    if (er) Logger.log(src.sport + " | ERRO: " + er.msg);
    else if (a) Logger.log(src.sport + " | " + a.rows.length + " equipas | colunas " + a.cols.join("/") + " | 1.º: " + a.rows[0].t + " " + a.rows[0].c.join(" ") + (a.rows.filter(function(r) { return r.me; })[0] ? " | FC Porto: " + a.rows.filter(function(r) { return r.me; })[0].p + ".º" : ""));
  });
}

// ---------- ajudantes de leitura ----------
function stDecode_(s) {
  return String(s || "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function stText_(html) {
  return stDecode_(String(html || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function stNum_(s) {
  const t = String(s == null ? "" : s).replace(/\s/g, "").replace(",", ".").replace("−", "-");
  const m = t.match(/^[+-]?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}
const ST_NAMES_ = {
  "futebol clube do porto": "FC Porto", "fc porto": "FC Porto", "fc porto sad": "FC Porto", "fc porto b": "FC Porto B",
  "sport lisboa e benfica": "SL Benfica", "sl benfica": "SL Benfica", "sl benfica sad": "SL Benfica",
  "sporting clube portugal": "Sporting CP", "sporting clube de portugal": "Sporting CP", "sporting cp": "Sporting CP", "sporting cp sad": "Sporting CP",
  "sporting clube de braga": "SC Braga", "sc braga": "SC Braga", "sc braga sad": "SC Braga",
  "vitoria sport clube": "Vitória SC", "vitoria sc": "Vitória SC", "vitoria sc sad": "Vitória SC",
  "leixoes sport club": "Leixões SC", "associacao academica de s. mamede": "AA S. Mamede", "clube desportivo de faies": "CD Fiães",
  "castelo da maia ginasio clube": "Castelo da Maia GC", "scu torreense": "Torreense", "scu torreense sad": "Torreense",
  "cs maritimo madeira": "Marítimo", "valadares gaia fc": "Valadares Gaia", "rio ave fc sad": "Rio Ave", "racing power fc": "Racing Power"
};
function stTeam_(raw) {
  const name = stText_(raw).replace(/\s+/g, " ").trim();
  const key = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (ST_NAMES_[key]) return ST_NAMES_[key];
  if (name === name.toUpperCase() && /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(name)) {
    const small = { "DE": 1, "DA": 1, "DO": 1, "DAS": 1, "DOS": 1, "E": 1, "A": 1, "O": 1, "EM": 1 };
    return name.split(" ").map(function(w) {
      if (small[w]) return w.toLowerCase();
      if (w.length <= 3 || w.indexOf(".") >= 0) return w;
      return w.charAt(0) + w.slice(1).toLowerCase();
    }).join(" ").replace(/^\w/, function(c) { return c.toUpperCase(); });
  }
  return name;
}
function stIsMe_(team) { return /\bporto\b/i.test(team); }
function stRow_(pos, team, cells) { return { p: pos, t: team, c: cells.map(function(x) { return String(x); }), me: stIsMe_(team) }; }
function stTrs_(html) { return html.match(/<tr[\s\S]*?<\/tr>/gi) || []; }
function stTds_(tr) {
  const out = [], re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let m;
  while ((m = re.exec(tr)) !== null) out.push(m[1]);
  return out;
}
function stCheck_(rows, label) {
  // verificação de sanidade: pontos e jogos têm de ser números
  rows.forEach(function(r) { r.c.forEach(function(x) { if (!/^[+-]?\d+(\.\d+)?(-\d+)?$/.test(x)) throw new Error(label + ": valor estranho '" + x + "' em " + r.t); }); });
}

// ---------- Sofascore (Futsal, v103) ----------
// /tournament/<id>/season/<id>/standings/total → { standings:[ { name, rows:[ { position, team:{name}, matches, wins, draws, losses, scoresFor, scoresAgainst, points } ] } ] }
function parseStandingsSofascore_(texto, comp, fase, sportZ) {
  let d; try { d = JSON.parse(texto); } catch (e) { throw new Error("resposta do Sofascore não é JSON"); }
  const g = (d.standings || [])[0];
  if (!g || !g.rows || !g.rows.length) throw new Error("tabela vazia no Sofascore");
  const rows = g.rows.map(function(l) {
    const dg = (Number(l.scoresFor) || 0) - (Number(l.scoresAgainst) || 0);
    const row = stRow_(Number(l.position) || 0, stTeam_((l.team && l.team.name) || ""),
      [l.points, l.matches, l.wins, l.draws, l.losses, l.scoresFor, l.scoresAgainst, (dg > 0 ? "+" : "") + dg]);
    if (row && l.team && l.team.id) row.i = l.team.id; // v153: id da equipa no Sofascore → escudo direto na tabela
    return row;
  }).filter(function(r) { return r.t; });
  rows.sort(function(a, b) { return a.p - b.p; });
  rows.forEach(function(r, i) { if (!r.p) r.p = i + 1; });
  stCheck_(rows, "Sofascore");
  const zonas = zonasDeLinhas_(g.rows.map(function(l) { return { position: l.position, promotion: l.promotion }; }), sportZ || "Futsal");
  return { comp: comp || "3ª Divisão", fase: (fase === undefined || fase === null) ? "1ª Fase · Série A" : fase, cols: ["Pts", "J", "V", "E", "D", "GM", "GS", "DG"], rows: rows, zonas: zonas };
}

// ---------- fcporto.pt (Futebol Feminino, Equipa B) ----------
function parseStandingsFcporto_(html) {
  const ti = html.indexOf("soccer-standings");
  if (ti < 0) throw new Error("tabela soccer-standings não encontrada");
  const end = html.indexOf("</table>", ti);
  const tbl = html.substring(ti, end);
  const head = stTds_(tbl.split("<tbody")[0]).map(stText_).join("|").toLowerCase();
  if (head.indexOf("pt") < 0 || head.indexOf("gm") < 0) throw new Error("cabeçalho inesperado: " + head);
  const rows = [];
  stTrs_(tbl.split("<tbody")[1] || "").forEach(function(tr) {
    const td = stTds_(tr);
    if (td.length < 9) return;
    const pos = stNum_(stText_(td[0])), team = stTeam_(td[1]);
    const pts = stNum_(stText_(td[2])), j = stNum_(stText_(td[3])), v = stNum_(stText_(td[4])), e = stNum_(stText_(td[5])), d = stNum_(stText_(td[6])), gm = stNum_(stText_(td[7])), gs = stNum_(stText_(td[8]));
    if (isNaN(pos) || isNaN(pts) || !team) return;
    const dg = gm - gs;
    rows.push(stRow_(pos, team, [pts, j, v, e, d, gm, gs, (dg > 0 ? "+" : "") + dg]));
  });
  const title = (html.match(/<title[^>]*>([^<]*)/i) || [])[1] || "";
  return { comp: stText_(title).replace(/^FC Porto - /, ""), cols: ["Pts", "J", "V", "E", "D", "GM", "GS", "DG"], rows: rows };
}

// ---------- Federação de Andebol (JSON dentro da página) ----------
function parseStandingsFpa_(html) {
  const i = html.indexOf('"id":"ranking"');
  if (i < 0) throw new Error("bloco ranking não encontrado");
  const j = html.indexOf('"rows":[', i);
  if (j < 0) throw new Error("linhas do ranking não encontradas");
  let k = j + 7, depth = 0, inStr = false, esc = false, endIdx = -1;
  for (let x = k; x < html.length; x++) {
    const ch = html.charAt(x);
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { endIdx = x; break; } }
  }
  if (endIdx < 0) throw new Error("JSON incompleto");
  const arr = JSON.parse(html.substring(k, endIdx + 1));
  const rows = arr.map(function(r) {
    const dg = Number(r.DIFERENCA);
    return stRow_(Number(r.PEQ_CLASS_CLASSIFICACAO), stTeam_(r.CLU_NOME),
      [r.PEQ_CLASS_PONTOS, r.PEQ_CLASS_NUMERO_JOGOS, r.PEQ_CLASS_NUMERO_VITORIAS, r.PEQ_CLASS_NUMERO_EMPATES, r.PEQ_CLASS_NUMERO_DERROTAS, r.PEQ_CLASS_GOLOS_MARCADOS, r.PEQ_CLASS_GOLOS_SOFRIDOS, (dg > 0 ? "+" : "") + dg]);
  });
  const comp = (html.match(/"PRO_DESCRICAO":"[^"]*? - ([^"]*)"/) || [])[1] || "Campeonato";
  const fase = (html.substring(i, j).match(/"name":"([^"]*)"/) || [])[1] || "";
  rows.sort(function(a, b) { return a.p - b.p; });
  stCheck_(rows, "FPA");
  return { comp: comp, fase: fase, cols: ["Pts", "J", "V", "E", "D", "GM", "GS", "DG"], rows: rows };
}

// ---------- Federação de Voleibol (tabela HTML) ----------
function parseStandingsFpv_(html) {
  const rows = [];
  stTrs_(html).forEach(function(tr) {
    if (tr.indexOf("rankn") < 0) return;
    const td = stTds_(tr);
    if (td.length < 15) return;
    const pos = stNum_(stText_(td[0])), team = stTeam_((tr.match(/class="teamnm">([^<]*)</) || [])[1] || td[1]);
    const v = td.slice(2).map(stText_);
    // J V D Pts 3-0 3-1 3-2 2-3 1-3 0-3 Sets+ Sets- RS Pontos+ Pontos- RP Forma
    const j = v[0], vit = v[1], der = v[2], pts = v[3], sp = v[10], sc = v[11], rp = v[15];
    if (isNaN(pos) || !team || isNaN(stNum_(pts))) return;
    rows.push(stRow_(pos, team, [pts, j, vit, der, sp + "-" + sc, rp]));
  });
  rows.sort(function(a, b) { return a.p - b.p; });
  rows.forEach(function(r) { r.c[5] = (Number(r.c[5]) > 0 ? "+" : "") + r.c[5]; });
  stCheck_(rows.map(function(r) { return { t: r.t, c: r.c.slice(0, 4) }; }), "FPV");
  return { comp: "Campeonato Nacional A1", cols: ["Pts", "J", "V", "D", "Sets", "Dif. pontos"], rows: rows };
}

// ---------- Federação de Basquetebol (blocos HTML) ----------
function parseStandingsFpb_(html) {
  const parts = html.split("/equipa/equipa_");
  const seen = {}, rows = [];
  for (let k = 1; k < parts.length; k++) {
    const ch = parts[k];
    const nm = ch.match(/<h5[^>]*only-desktop[^>]*>([^<]*)<\/h5>/i);
    if (!nm) continue;
    const team = stTeam_(nm[1]);
    if (!team || seen[team]) continue;
    const after = ch.substring(ch.indexOf(nm[0]) + nm[0].length);
    const nums = [], re = /<h5[^>]*>\s*(?:<b>)?\s*([+-]?\d+)\s*(?:<\/b>)?\s*<\/h5>/gi; // os pontos vêm dentro de <b>
    let m;
    while ((m = re.exec(after)) !== null && nums.length < 8) nums.push(m[1]);
    if (nums.length < 8) continue;
    // J V D FC PM PS DIF PTS
    const j = Number(nums[0]), v = Number(nums[1]), d = Number(nums[2]);
    if (j !== v + d + Number(nums[3])) continue;
    seen[team] = true;
    rows.push(stRow_(rows.length + 1, team, [nums[7], nums[0], nums[1], nums[2], nums[4], nums[5], (Number(nums[6]) > 0 ? "+" : "") + nums[6]]));
  }
  if (rows.length < 4) throw new Error("só " + rows.length + " equipas lidas");
  return { comp: "Liga Betclic", cols: ["Pts", "J", "V", "D", "PM", "PS", "DIF"], rows: rows };
}

// ---------- hoqueipatins.pt (tabela HTML) ----------
function parseStandingsHoquei_(html) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  let best = null, bestN = 0;
  tables.forEach(function(t) { const n = (t.match(/numberStanding/g) || []).length; if (n > bestN) { bestN = n; best = t; } });
  if (!best) throw new Error("tabela não encontrada");
  const rows = [];
  stTrs_(best).forEach(function(tr) {
    if (tr.indexOf("numberStanding") < 0) return;
    const cells = tr.match(/<td[^>]*numberStanding[^>]*>[\s\S]*?<\/td>/gi) || [];
    const nums = cells.map(function(c) { return stText_(c); });
    if (nums.length < 8) return;
    const tds = stTds_(tr);
    let team = "", logo = "";
    for (let x = 0; x < tds.length; x++) {
      if (tds[x].indexOf("numberStanding") >= 0) continue;
      const t = stText_(tds[x].replace(/<span[^>]*live_time_team_ranking[^>]*>[\s\S]*?<\/span>/gi, ""));
      if (/[A-Za-zÀ-ÿ]{3,}/.test(t)) {
        team = t;
        const lm = tds[x].match(/<img[^>]+src=["'](?:https?:\/\/(?:www\.)?hoqueipatins\.pt)?\/wp-content\/uploads\/([^"']+)["']/i); // escudo (v130)
        if (lm) logo = lm[1];
        break;
      }
    }
    team = stTeam_(team);
    if (!team) return;
    // PTS JOG VIT EMP DER GM GS DG
    const dg = Number(nums[7]);
    const linha = stRow_(0, team, [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], nums[6], (dg > 0 ? "+" : "") + nums[7]]);
    if (logo && /^[\w\/.\-]+\.(gif|png|jpe?g|webp)$/i.test(logo)) linha.g = logo;
    const cm = tr.match(/background-color:\s*(#[0-9a-fA-F]{6})/);
    linha._cor = cm ? cm[1].toLowerCase() : ""; // v137: cor da linha = zona
    rows.push(linha);
  });
  if (rows.length < 4) throw new Error("só " + rows.length + " equipas lidas");
  if (rows.some(function(r) { return Number(r.c[0]) > 0; })) {
    rows.sort(function(a, b) { return (Number(b.c[0]) - Number(a.c[0])) || (Number(b.c[7]) - Number(a.c[7])) || (Number(b.c[5]) - Number(a.c[5])); });
  }
  rows.forEach(function(r, i) { r.p = i + 1; });
  // v137: zonas a partir das cores das linhas (verde = apurado para playoff, vermelho = descida)
  const HOQ_ZONAS_ = { "#6cf900": { k: "playoff", t: "Apurado para playoff" }, "#ff0400": { k: "desce", t: "Descida" } };
  const hz = [];
  rows.forEach(function(r) {
    const z = HOQ_ZONAS_[r._cor];
    if (z) { const u = hz[hz.length - 1]; if (u && u.t === z.t && u.b === r.p - 1) u.b = r.p; else hz.push({ a: r.p, b: r.p, k: z.k, t: z.t }); }
    delete r._cor;
  });
  return { comp: "Liga Placard", fase: "Fase regular", cols: ["Pts", "J", "V", "E", "D", "GM", "GS", "DG"], rows: rows, zonas: hz };
}

// Gravação manual (futsal, ou qualquer modalidade sem fonte automática) — só admin.
function setManualStandings_(sheet, m) {
  const sport = String(m.sport || "").substring(0, 40);
  if (!sport) return false;
  const store = readStandingsStore_(sheet);
  if (m.clear) { delete store.manual[sport]; writeStandingsStore_(sheet, store); return true; }
  const rows = (m.rows || []).slice(0, 40).map(function(r, i) {
    return { p: Number(r.p) || (i + 1), t: String(r.t || "").substring(0, 60), c: (r.c || []).slice(0, 10).map(function(x) { return String(x).substring(0, 12); }), me: stIsMe_(String(r.t || "")) };
  }).filter(function(r) { return r.t; });
  if (rows.length < 2) return false;
  store.manual[sport] = {
    sport: sport, comp: String(m.comp || "").substring(0, 80), fase: "", source: "Atualizado à mão", manual: true,
    updated: Date.now(), cols: (m.cols || []).slice(0, 10).map(function(x) { return String(x).substring(0, 12); }), rows: rows
  };
  writeStandingsStore_(sheet, store);
  return true;
}

// ===================== AO VIVO — HÓQUEI EM PATINS (v95) =====================
// O hoqueipatins.pt tem um serviço de dados ao vivo (o mesmo que usa a página "Jogos em direto"):
// https://live.hoqueipatins.pt/api/updates → { games:[{ id, score:["2","3"], time, part, ended, status, teams:["3584_230", ...] }] }
// Não vem o nome das equipas, só os códigos "<id>_<competição>". O FC Porto é o id 3584.
// Corre no mesmo gatilho de minuto a minuto do voleibol (ver atualizarAoVivoCev_).
const HOQUEI_LIVE_PROP_ = "aoVivoHoquei";
const HOQUEI_SPORTS_ = ["Hóquei Patins"];
const HOQUEI_FCP_TEAM_ID_ = "3584";
const HOQUEI_API_ = "https://live.hoqueipatins.pt/api/updates?time=";

function hoqueiTeamIdIs_(code, id) { return String(code || "").split("_")[0] === id; }

// forcar = true ignora a janela de horas (para testes à mão).
function atualizarAoVivoHoqueiCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (HOQUEI_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 3 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(HOQUEI_LIVE_PROP_); return "sem jogos de hóquei em curso"; }
  try { hqDetalhesDosAtivos_(ativos, hoje, agora, forcar); } catch (e) { Logger.log("hóquei detalhe: " + e); } // v148: cronologia do hoqueipatins.pt

  const resp = UrlFetchApp.fetch(HOQUEI_API_ + Math.round(agora / 30000), { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
  if (resp.getResponseCode() !== 200) return "hoqueipatins respondeu " + resp.getResponseCode();
  const games = (JSON.parse(resp.getContentText()).games) || [];
  const meus = games.filter(function(g) {
    return (g.teams || []).some(function(t) { return hoqueiTeamIdIs_(t, HOQUEI_FCP_TEAM_ID_); });
  });
  const out = {};
  ativos.forEach(function(it, idx) {
    // se houver mais de um jogo do FC Porto no dia, liga-os pela ordem das horas
    const g = meus.length === 1 ? meus[0] : meus[Math.min(idx, meus.length - 1)];
    if (!g) return;
    const iFcp = (g.teams || []).findIndex(function(t) { return hoqueiTeamIdIs_(t, HOQUEI_FCP_TEAM_ID_); });
    const sc = (g.score || []).map(function(x) { return Number(x) || 0; });
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    const terminou = g.ended === true;
    const jaComecou = forcar || agora >= ini - 5 * 60000;
    // Visto num jogo real: a decorrer → status:true, ended:false, time:"1ªP - 10'", part:"1ªP".
    // Terminado → ended:true, time:"Resultado final" (a "part" fica velha, ex. "1ªP Pr."). O tempo já traz a parte, por isso não se repete.
    const tempoRaw = String(g.time || "").trim(), parteRaw = String(g.part || "").trim();
    const tempo = /resultado final/i.test(tempoRaw) ? "" : tempoRaw;
    const parte = (!tempo || (parteRaw && tempo.indexOf(parteRaw) === 0)) ? "" : parteRaw;
    out[it.id] = {
      estado: terminou ? "fim" : ((g.status === true || jaComecou) ? "vivo" : "agendado"),
      golosFcp: iFcp === 1 ? sc[1] : sc[0],
      golosAdv: iFcp === 1 ? sc[0] : sc[1],
      tempo: tempo,
      parte: parte,
      evento: g.id, adv: it.adv, sport: it.sport
    };
  });
  props.setProperty(HOQUEI_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoHoquei_() {
  try { atualizarAoVivoHoqueiCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoHoquei_ — erro: " + e); }
}

// Para testar à mão: mostra o que o serviço devolve e que jogos do FC Porto lá estão.
function testarAoVivoHoqueiAgora() {
  const r = UrlFetchApp.fetch(HOQUEI_API_ + Math.round(Date.now() / 30000), { muteHttpExceptions: true });
  const games = (JSON.parse(r.getContentText()).games) || [];
  Logger.log("jogos no serviço: " + games.length);
  games.forEach(function(g) {
    const fcp = (g.teams || []).some(function(t) { return hoqueiTeamIdIs_(t, HOQUEI_FCP_TEAM_ID_); });
    Logger.log((fcp ? "★ FC PORTO " : "") + "jogo " + g.id + " | " + (g.score || []).join("-") + " | tempo '" + g.time + "' | parte '" + g.part + "' | ended " + g.ended + " | status " + g.status + " | equipas " + (g.teams || []).join(" vs "));
  });
  Logger.log(atualizarAoVivoHoqueiCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(HOQUEI_LIVE_PROP_));
}

// ===================== AO VIVO — ANDEBOL (v96) =====================
// A página da prova no portal da FPA (a mesma da classificação) traz, dentro do HTML, todos os jogos com
// data, hora, equipas, golos (JOG_GOLOS_CASA / JOG_GOLOS_FORA) e estado (JOGO_ESTADO_CODIGO; "50" = terminado).
// Ainda não se sabe que código aparece a meio do jogo — por isso: jogo do FC Porto, já na hora (ou depois) e
// com código diferente de "50" = "vivo". O código vai junto (campo "codigo") para se confirmar num jogo real.
const ANDEBOL_LIVE_PROP_ = "aoVivoAndebol";
const ANDEBOL_SPORTS_ = ["Andebol"];
const ANDEBOL_PROVA_URL_ = "https://portal.fpa.pt/prova/10016/";

// Lê todos os jogos da página. Devolve [{data,hora,casa,fora,golosCasa,golosFora,codigo}].
function parseJogosFpa_(html) {
  const txt = html.replace(/\\"/g, '"');
  const partes = txt.split('"JOG_NUM_JOGO"');
  const get = function(blk, k) { const m = blk.match(new RegExp('"' + k + '"\\s*:\\s*"([^"]*)"')); return m ? m[1] : ""; };
  const dec = function(v) { try { return JSON.parse('"' + v + '"'); } catch (e) { return v; } };
  const out = [];
  for (let i = 1; i < partes.length; i++) {
    const blk = partes[i];
    const data = get(blk, "JOG_DATA");
    if (!data) continue;
    out.push({
      data: data.substring(0, 10), hora: get(blk, "JOG_HORA").substring(0, 5),
      casa: dec(get(blk, "EQUIPA_CASA")).trim(), fora: dec(get(blk, "EQUIPA_FORA")).trim(),
      golosCasa: get(blk, "JOG_GOLOS_CASA"), golosFora: get(blk, "JOG_GOLOS_FORA"),
      codigo: get(blk, "JOGO_ESTADO_CODIGO")
    });
  }
  return out;
}

function atualizarAoVivoAndebolCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (ANDEBOL_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 3 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(ANDEBOL_LIVE_PROP_); return "sem jogos de andebol em curso"; }

  const resp = UrlFetchApp.fetch(ANDEBOL_PROVA_URL_ + "?t=" + Math.round(agora / 30000), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
  if (resp.getResponseCode() !== 200) return "FPA respondeu " + resp.getResponseCode();
  const meus = parseJogosFpa_(resp.getContentText()).filter(function(g) {
    return g.data === hoje && (/porto/i.test(g.casa) || /porto/i.test(g.fora));
  });
  const out = {};
  ativos.forEach(function(it) {
    // liga pelo mesmo horário; se só houver um jogo do FC Porto nesse dia, é esse
    const g = meus.filter(function(x) { return x.hora === it.t; })[0] || (meus.length === 1 ? meus[0] : null);
    if (!g) return;
    const casaFcp = /porto/i.test(g.casa);
    const gc = Number(g.golosCasa) || 0, gf = Number(g.golosFora) || 0;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    const terminou = g.codigo === "50";
    const jaComecou = forcar || agora >= ini - 5 * 60000;
    out[it.id] = {
      estado: terminou ? "fim" : (jaComecou ? "vivo" : "agendado"),
      golosFcp: casaFcp ? gc : gf, golosAdv: casaFcp ? gf : gc,
      tempo: "", parte: "", codigo: g.codigo, adv: it.adv, sport: it.sport
    };
  });
  props.setProperty(ANDEBOL_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoAndebol_() {
  try { atualizarAoVivoAndebolCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoAndebol_ — erro: " + e); }
}

// Para testar à mão (de preferência durante um jogo): mostra os jogos do FC Porto da página e o código de estado.
function testarAoVivoAndebolAgora() {
  const r = UrlFetchApp.fetch(ANDEBOL_PROVA_URL_ + "?t=" + Date.now(), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
  const jogos = parseJogosFpa_(r.getContentText());
  Logger.log("HTTP " + r.getResponseCode() + " | jogos na página: " + jogos.length);
  const cont = {}; jogos.forEach(function(g) { cont[g.codigo] = (cont[g.codigo] || 0) + 1; });
  Logger.log("códigos de estado: " + JSON.stringify(cont));
  jogos.filter(function(g) { return /porto/i.test(g.casa) || /porto/i.test(g.fora); }).slice(-4).forEach(function(g) {
    Logger.log(g.data + " " + g.hora + " | " + g.casa + " " + g.golosCasa + "-" + g.golosFora + " " + g.fora + " | código " + g.codigo);
  });
  Logger.log(atualizarAoVivoAndebolCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(ANDEBOL_LIVE_PROP_));
}

// ===================== AO VIVO — VOLEIBOL, CAMPEONATO NACIONAL (v97) =====================
// A Federação Portuguesa de Voleibol tem um serviço que a própria página usa para o "AO VIVO":
// https://www.portugalvoleibol.com/classificacao/api/live.php?status=all  → { jogos:[ { data_jogo, hora_jogo, status,
// resultado_a/b (sets), sets:[{pontosA,pontosB,finalizado}], equipa_a/b:{cod_clube,nome} } ] }
// status: DRAFT (por começar) | IN_PROGRESS | COMPLETED. (O campo "live" não é de fiar — usa-se o status.)
// O FC Porto é o clube "FCPORTO". Corre no mesmo gatilho de 1 minuto. A CEV (Liga dos Campeões) continua à parte.
const VOLEINAC_LIVE_PROP_ = "aoVivoVoleiNac";
const VOLEINAC_URL_ = "https://www.portugalvoleibol.com/classificacao/api/live.php?status=all&_=";
const VOLEINAC_CLUBE_ = "FCPORTO";

function fpvResumo_(g) {
  const casaFcp = g.equipa_a && g.equipa_a.cod_clube === VOLEINAC_CLUBE_;
  const sets = [];
  (g.sets || []).forEach(function(st) {
    const a = Number(st.pontosA) || 0, b = Number(st.pontosB) || 0;
    if (a || b) sets.push(casaFcp ? [a, b] : [b, a]);
  });
  const ra = Number(g.resultado_a) || 0, rb = Number(g.resultado_b) || 0;
  const st = String(g.status || "").toUpperCase();
  return {
    estado: st === "COMPLETED" ? "fim" : ((st === "IN_PROGRESS" || g.live === true || sets.length > 0 || ra + rb > 0) ? "vivo" : "agendado"),
    fpv: g.numero_jogo,
    setsFcp: casaFcp ? ra : rb, setsAdv: casaFcp ? rb : ra,
    sets: sets, status: st
  };
}

function atualizarAoVivoVoleiNacCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (CEV_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 4 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(VOLEINAC_LIVE_PROP_); return "sem jogos de voleibol em curso"; }

  const resp = UrlFetchApp.fetch(VOLEINAC_URL_ + Math.round(agora / 30000), { muteHttpExceptions: true, headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" } });
  if (resp.getResponseCode() !== 200) return "FPV respondeu " + resp.getResponseCode();
  const d = JSON.parse(resp.getContentText());
  if (d && d.success === false) return "FPV: " + (d.error || "erro");
  const meus = ((d && d.jogos) || []).filter(function(g) {
    return g.data_jogo === hoje && ((g.equipa_a && g.equipa_a.cod_clube === VOLEINAC_CLUBE_) || (g.equipa_b && g.equipa_b.cod_clube === VOLEINAC_CLUBE_));
  });
  const out = {};
  ativos.forEach(function(it) {
    const advDe = function(g) { return (g.equipa_a && g.equipa_a.cod_clube === VOLEINAC_CLUBE_) ? (g.equipa_b || {}).nome : (g.equipa_a || {}).nome; };
    // 1.º pelo nome do adversário + hora, depois só pela hora, depois se for o único jogo do dia
    const g = meus.filter(function(x) { return x.hora_jogo === it.t && cevNomesBatem_(it.adv, advDe(x)); })[0]
      || meus.filter(function(x) { return x.hora_jogo === it.t; })[0]
      || meus.filter(function(x) { return cevNomesBatem_(it.adv, advDe(x)); })[0]
      || (meus.length === 1 ? meus[0] : null);
    if (!g) return;
    const r = fpvResumo_(g);
    r.adv = it.adv; r.sport = it.sport;
    out[it.id] = r;
  });
  props.setProperty(VOLEINAC_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoVoleiNac_() {
  try { atualizarAoVivoVoleiNacCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoVoleiNac_ — erro: " + e); }
}

// Para testar à mão: mostra os jogos do FC Porto de hoje no serviço da Federação e o que ficaria ligado ao site.
function testarAoVivoVoleiNacAgora() {
  const r = UrlFetchApp.fetch(VOLEINAC_URL_ + Date.now(), { muteHttpExceptions: true, headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" } });
  const d = JSON.parse(r.getContentText());
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  Logger.log("HTTP " + r.getResponseCode() + " | jogos " + ((d.jogos || []).length));
  (d.jogos || []).filter(function(g) { return g.data_jogo === hoje && /porto/i.test(JSON.stringify([g.equipa_a, g.equipa_b])); }).forEach(function(g) {
    Logger.log(g.hora_jogo + " | " + g.equipa_a.nome + " " + g.resultado_a + "-" + g.resultado_b + " " + g.equipa_b.nome + " | " + g.status + " | live " + g.live + " | " + (g.competicao || {}).nome);
  });
  Logger.log(atualizarAoVivoVoleiNacCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(VOLEINAC_LIVE_PROP_));
}

// ===================== AO VIVO — EQUIPA B (v99) =====================
// A Liga Portugal publica um calendário (iCal) do FC Porto B com o endereço da página de cada jogo:
//   https://www.ligaportugal.pt/calendars-ics/fc_porto_b.ics   (DTSTART em UTC, SUMMARY "FC Porto B - U. Leiria", URL do jogo)
// A página do jogo vem escrita no HTML (bloco <script id="__NUXT_DATA__">, formato "devalue": lista de valores
// que se referem uns aos outros por posição) com homeTeamGoals, awayTeamGoals, status, subStatus.
// Ainda NÃO se viu um jogo a decorrer: os valores de status/subStatus são desconhecidos, por isso o código aceita
// vários nomes e guarda os valores brutos em "codigo" para se afinar depois do primeiro jogo real.
const EQB_LIVE_PROP_ = "aoVivoEquipaB";
const EQB_SPORTS_ = ["Equipa B"];
const EQB_ICS_ = "https://www.ligaportugal.pt/calendars-ics/fc_porto_b.ics";

function eqbParseIcs_(txt) {
  const linhas = String(txt || "").replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const out = []; let cur = null;
  linhas.forEach(function(l) {
    if (l === "BEGIN:VEVENT") cur = {};
    else if (l === "END:VEVENT") { if (cur && cur.ini && cur.url) out.push(cur); cur = null; }
    else if (cur) {
      let m;
      if ((m = l.match(/^DTSTART[^:]*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/))) cur.ini = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      else if ((m = l.match(/^SUMMARY:(.*)$/))) cur.resumo = m[1].replace(/\\,/g, ",");
      else if ((m = l.match(/^URL[^:]*:(https?:.*)$/))) cur.url = m[1].trim();
    }
  });
  return out;
}

// Resolve o formato "devalue" do Nuxt: números dentro de objetos/listas são posições na lista principal.
function eqbResolve_(arr, i, depth) {
  if (depth > 4) return undefined;
  if (typeof i !== "number") return i;
  if (i < 0) return undefined;
  const v = arr[i];
  if (Array.isArray(v)) {
    if (typeof v[0] === "string" && /^(Reactive|ShallowReactive|Ref|ShallowRef|NuxtError)$/.test(v[0])) return eqbResolve_(arr, v[1], depth + 1);
    return v.map(function(x) { return eqbResolve_(arr, x, depth + 1); });
  }
  if (v && typeof v === "object") {
    const o = {};
    Object.keys(v).forEach(function(k) { o[k] = eqbResolve_(arr, v[k], depth + 1); });
    return o;
  }
  return v;
}

// Lê a página de um jogo e devolve { golosCasa, golosFora, status, subStatus, tempo, chaves }.
function eqbLerJogo_(html) {
  const m = html.match(/<script type="application\/json" id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("bloco de dados não encontrado");
  const arr = JSON.parse(m[1]);
  let obj = null;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v && typeof v === "object" && !Array.isArray(v) && "homeTeamGoals" in v && "awayTeamGoals" in v && "status" in v) { obj = v; break; }
  }
  if (!obj) throw new Error("jogo não encontrado nos dados");
  const g = function(k) { return k in obj ? eqbResolve_(arr, obj[k], 0) : undefined; };
  let tempo = "";
  Object.keys(obj).forEach(function(k) {
    if (/minute|clock|elapsed|matchTime|currentTime/i.test(k)) {
      const v = g(k);
      // v111: só aceita um minuto verdadeiro (ex.: 54, 54', 45+2'); valores estranhos (ex.: "-54") ficam de fora
      if (v !== undefined && v !== null && v !== "" && /^\d{1,3}(\+\d{1,2})?'?$/.test(String(v).trim())) tempo = String(v).trim().replace(/'?$/, "'");
    }
  });
  const num = function(x) { if (x === null || x === undefined || x === "") return null; const n = Number(x); return (isNaN(n) || n < 0) ? null : n; };
  const brutos = {};
  Object.keys(obj).forEach(function(k) { const v = g(k); if (v === null || ["string", "number", "boolean"].indexOf(typeof v) >= 0) brutos[k] = v; });
  return { golosCasa: num(g("homeTeamGoals")), golosFora: num(g("awayTeamGoals")), status: g("status"), subStatus: g("subStatus"), tempo: tempo, decorrido: (typeof brutos.minutesTillMatchStarts === "number" ? -brutos.minutesTillMatchStarts : null), chaves: Object.keys(obj), brutos: brutos };
}

function eqbEstado_(j, jaComecou) {
  const s = (String(j.status == null ? "" : j.status) + " " + String(j.subStatus == null ? "" : j.subStatus)).toLowerCase();
  // v110: antes da hora do jogo nunca é "vivo" (a página da Liga traz 0-0 e, às vezes, um relógio antigo), e "notStarted" contém "started"
  if (!jaComecou) return "agendado";
  if (/not.?start|schedul|upcoming|pre.?match|agend|postpon|adiad|cancel|suspens/.test(s)) return "agendado";
  if (/final|finish|ended|terminad|full.?time|\bft\b|conclu|encerr/.test(s)) return "fim";
  if (/live|play|progress|half|interval|decorr|curso|1st|2nd|first|second|break|ongoing|running|started/.test(s)) return "vivo";
  if (j.golosCasa !== null || j.golosFora !== null) return "vivo";
  return "agendado";
}

function atualizarAoVivoEquipaBCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (EQB_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 3 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(EQB_LIVE_PROP_); return "sem jogos da Equipa B em curso"; }

  // endereços dos jogos de hoje (o calendário muda raramente: guarda-se 6 horas)
  let cal = null;
  try { cal = JSON.parse(props.getProperty("eqbIcsCache") || "null"); } catch (e) { cal = null; }
  if (!cal || (agora - cal.t) > 6 * 3600000) {
    const r = UrlFetchApp.fetch(EQB_ICS_, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.getResponseCode() !== 200) return "calendário da Liga respondeu " + r.getResponseCode();
    cal = { t: agora, jogos: eqbParseIcs_(r.getContentText()) };
    props.setProperty("eqbIcsCache", JSON.stringify(cal));
  }
  const dosHoje = cal.jogos.filter(function(g) { return Utilities.formatDate(new Date(g.ini), "Europe/Lisbon", "yyyy-MM-dd") === hoje; });
  const out = {};
  ativos.forEach(function(it) {
    const g = dosHoje.filter(function(x) { return Utilities.formatDate(new Date(x.ini), "Europe/Lisbon", "HH:mm") === it.t; })[0] || (dosHoje.length === 1 ? dosHoje[0] : null);
    if (!g) return;
    const resp = UrlFetchApp.fetch(g.url + "?t=" + Math.round(agora / 30000), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
    if (resp.getResponseCode() !== 200) return;
    const j = eqbLerJogo_(resp.getContentText());
    const fcpCasa = /^\s*FC Porto B\s*-/i.test(g.resumo || "");
    const ini = g.ini;
    const estado = eqbEstado_(j, forcar || agora >= ini);
    out[it.id] = {
      estado: estado,
      golosFcp: (fcpCasa ? j.golosCasa : j.golosFora) || 0, golosAdv: (fcpCasa ? j.golosFora : j.golosCasa) || 0,
      tempo: estado === "vivo" ? (j.tempo || "") : "", parte: "", codigo: String(j.status) + "/" + String(j.subStatus) + "/dec" + String(j.decorrido), adv: it.adv, sport: it.sport
    };
  });
  props.setProperty(EQB_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoEquipaB_() {
  try { atualizarAoVivoEquipaBCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoEquipaB_ — erro: " + e); }
}

// Para testar à mão (durante um jogo da Equipa B, ou antes para ver os campos): mostra os valores brutos da página do jogo.
function testarAoVivoEquipaBAgora() {
  const r = UrlFetchApp.fetch(EQB_ICS_, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
  const jogos = eqbParseIcs_(r.getContentText()).sort(function(a, b) { return a.ini - b.ini; });
  const agora = Date.now();
  Logger.log("calendário HTTP " + r.getResponseCode() + " | jogos: " + jogos.length);
  const prox = jogos.filter(function(g) { return g.ini > agora - 3 * 3600000; })[0];
  if (!prox) { Logger.log("sem jogos futuros no calendário"); return; }
  Logger.log("jogo: " + prox.resumo + " | " + Utilities.formatDate(new Date(prox.ini), "Europe/Lisbon", "yyyy-MM-dd HH:mm") + " | " + prox.url);
  const j = eqbLerJogo_(UrlFetchApp.fetch(prox.url + "?t=" + Date.now(), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } }).getContentText());
  Logger.log("golos casa/fora: " + j.golosCasa + "/" + j.golosFora + " | status: " + JSON.stringify(j.status) + " | subStatus: " + JSON.stringify(j.subStatus) + " | tempo: '" + j.tempo + "' | estado: " + eqbEstado_(j, true));
  Logger.log("campos do jogo: " + j.chaves.join(","));
  // v111: todos os valores simples da página (para descobrir qual é o campo do minuto)
  Logger.log("VALORES: " + JSON.stringify(j.brutos));
}

// ===================== AO VIVO — BASQUETEBOL (v100) =====================
// O FIBA LiveStats (Genius Sports), que a FPB usa nos jogos, tem um ficheiro de dados por jogo:
//   https://fibalivestats.dcd.shared.geniussports.com/data/<ID>/data.json  → { clock:"08:42", period:3, periodType:"REGULAR",
//   periodsMax, tm:{ "1":{name,score,...}, "2":{...} } }
// O <ID> é o número do jogo no FIBA (aparece no endereço .../u/FPDB/<ID>/). Não há forma automática de o descobrir,
// por isso escreve-se no campo "ID do jogo ao vivo" do jogo, no editor do site (ev.liveId).
// Não há um campo de estado: "terminou" = último período e relógio a 00:00 com resultado desigual.
const BASQUETE_LIVE_PROP_ = "aoVivoBasquete";
const BASQUETE_SPORTS_ = ["Basquetebol"];
const FIBA_DATA_URL_ = "https://fibalivestats.dcd.shared.geniussports.com/data/";

// Lê o data.json de um jogo e devolve o formato pequeno do site (FC Porto primeiro). null se não houver dados.
function fibaResumo_(d, advNome) {
  if (!d || !d.tm || !d.tm["1"] || !d.tm["2"]) return null;
  const a = d.tm["1"], b = d.tm["2"];
  const sa = Number(a.score) || 0, sb = Number(b.score) || 0;
  let fcp = /porto/i.test(String(a.name || "")) ? 0 : (/porto/i.test(String(b.name || "")) ? 1 : -1);
  if (fcp < 0) fcp = cevNomesBatem_(advNome, a.name) ? 1 : 0; // pelo adversário
  const golosFcp = fcp === 0 ? sa : sb, golosAdv = fcp === 0 ? sb : sa;
  const per = Number(d.period) || 0, clock = String(d.clock || "00:00");
  const max = Number(d.periodsMax) || 4;
  const ot = String(d.periodType || "").toUpperCase() === "OVERTIME" || d.inOT === 1;
  const relogioZero = /^0?0:00(\.\d+)?$/.test(clock);
  const acabou = per >= max && relogioZero && sa !== sb;
  let estado;
  if (per === 0 && sa + sb === 0) estado = "agendado";
  else estado = acabou ? "fim" : "vivo";
  const periodoTxt = ot ? "Prolongamento" : (per + ".º período");
  return {
    estado: estado, golosFcp: golosFcp, golosAdv: golosAdv,
    tempo: estado === "vivo" ? (periodoTxt + " " + clock.replace(/^0/, "")) : "", parte: "",
    codigo: "p" + per + " " + clock + (ot ? " OT" : "")
  };
}

// Descoberta automática do número do FIBA (v101). Visto a 24/10/2026: a FPB regista os jogos da Liga Betclic no FIBA
// em lotes seguidos (2922716…2922733 = jornada 3, 2922737 = FC Porto–CAB Madeira), e o FIBA tem a página criada com antecedência.
// Procura, a partir do último número conhecido, um jogo cujo nome tenha "Porto" e o adversário do site. Guarda o resultado
// (evento → número) para não repetir. Um ID escrito à mão no editor ("ID do jogo ao vivo") tem sempre prioridade.
const BASQUETE_MAP_PROP_ = "basqueMap";
const BASQUETE_BASE_INICIAL_ = 2922734;
const BASQUETE_PASSO_ = 40;       // quantos números testa por minuto
const BASQUETE_ALCANCE_ = 400;    // até onde procura, a partir da base, antes de recomeçar

function basqueDescobrirId_(it, props) {
  let m; try { m = JSON.parse(props.getProperty(BASQUETE_MAP_PROP_) || "{}"); } catch (e) { m = {}; }
  if (m.ids && m.ids[it.id]) return m.ids[it.id];
  m.ids = m.ids || {};
  const usados = Object.keys(m.ids).map(function(k) { return Number(m.ids[k]); });
  const base = Math.max.apply(null, [BASQUETE_BASE_INICIAL_].concat(usados.map(function(n) { return n + 1; })));
  let cur = (m.cursor && m.cursor >= base && m.cursor < base + BASQUETE_ALCANCE_) ? m.cursor : base;
  let achado = "";
  for (let n = 0; n < BASQUETE_PASSO_ && !achado; n++, cur++) {
    let r;
    try { r = UrlFetchApp.fetch(FIBA_DATA_URL_ + cur + "/data.json", { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } }); } catch (e) { continue; }
    if (r.getResponseCode() !== 200) continue;
    let d; try { d = JSON.parse(r.getContentText()); } catch (e) { continue; }
    if (!d || !d.tm || !d.tm["1"] || !d.tm["2"]) continue;
    const a = String(d.tm["1"].name || ""), b = String(d.tm["2"].name || "");
    const temPorto = /porto/i.test(a) || /porto/i.test(b);
    const outro = /porto/i.test(a) ? b : a;
    if (temPorto && cevNomesBatem_(it.adv, outro) && usados.indexOf(cur) < 0) achado = String(cur);
  }
  m.cursor = cur;
  if (achado) { m.ids[it.id] = achado; m.cursor = Number(achado) + 1; }
  props.setProperty(BASQUETE_MAP_PROP_, JSON.stringify(m));
  return achado;
}

function atualizarAoVivoBasqueCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (BASQUETE_SPORTS_.indexOf(ev.sport) < 0 || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport, liveId: String(ev.liveId || "").replace(/\D/g, "") });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 3 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(BASQUETE_LIVE_PROP_); return "sem jogos de basquetebol em curso"; }
  const out = {};
  ativos.forEach(function(it) {
    if (!it.liveId) it.liveId = basqueDescobrirId_(it, props); // sem ID escrito à mão: procura sozinho
    if (!it.liveId) return;
    const r = UrlFetchApp.fetch(FIBA_DATA_URL_ + it.liveId + "/data.json?t=" + Math.round(agora / 15000), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.getResponseCode() !== 200) return;
    let d; try { d = JSON.parse(r.getContentText()); } catch (e) { return; }
    const res = fibaResumo_(d, it.adv);
    if (!res) return;
    res.adv = it.adv; res.sport = it.sport;
    out[it.id] = res;
  });
  props.setProperty(BASQUETE_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoBasquete_() {
  try { atualizarAoVivoBasqueCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoBasquete_ — erro: " + e); }
}

// Para testar à mão: usa o ID que escreveres em ID_TESTE (por defeito, o jogo 2938408 que já acabou) e mostra o que o site receberia.
function testarAoVivoBasqueAgora() {
  const ID_TESTE = "2938408";
  const r = UrlFetchApp.fetch(FIBA_DATA_URL_ + ID_TESTE + "/data.json?t=" + Date.now(), { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
  Logger.log("FIBA " + ID_TESTE + " HTTP " + r.getResponseCode());
  const d = JSON.parse(r.getContentText());
  Logger.log("equipas: " + d.tm["1"].name + " vs " + d.tm["2"].name + " | período " + d.period + " | relógio " + d.clock + " | periodsMax " + d.periodsMax);
  Logger.log("resumo: " + JSON.stringify(fibaResumo_(d, d.tm["2"].name)));
  Logger.log(atualizarAoVivoBasqueCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(BASQUETE_LIVE_PROP_));
}

// ===================== AO VIVO — SOFASCORE (v102) =====================
// Futebol feminino, andebol e futsal. Fonte: api.sofascore.com (não oficial; se deixar de responder, o site volta ao resultado manual).
//   /api/v1/event/<id>  → { event:{ status:{type:"notstarted|inprogress|finished",description}, homeScore:{current,period1..}, awayScore, homeTeam, awayTeam,
//                           time:{currentPeriodStartTimestamp}, startTimestamp, tournament:{name} } }
//   /api/v1/sport/<football|handball|futsal>/scheduled-events/<yyyy-MM-dd> → { events:[ ...mesmo formato... ] }  (usado para descobrir o jogo sozinho)
// O número do jogo (campo "ID do jogo ao vivo", ev.liveId) tem prioridade; sem ele, procura nos jogos da equipa do FC Porto (hora + adversário).
const SOFA_LIVE_PROP_ = "aoVivoSofascore";
const SOFA_MAP_PROP_ = "sofaMap";
const SOFA_PER_PROP_ = "sofaPeriodos"; // { idDoJogoNoSofascore: { d: descrição da parte, s: quando a vimos começar } }
const SOFA_BASE_ = "https://api.sofascore.com/api/v1/";
// teamId = número da equipa do FC Porto no Sofascore (lido do próprio jogo em 24/10/2026). A procura usa os jogos da equipa
// (team/<id>/events/next/0 + last/0): a lista "scheduled-events" do dia NÃO existe (404).
const SOFA_SPORTS_ = {
  "Futebol Feminino": { slug: "football", metade: 45, intervalo: 15, teamId: 938214, relogioPeriodo: true },
  // v149: Futebol (equipa principal, Liga Portugal + Taças + europeias). teamId 3002 = FC Porto no Sofascore (confirmar com testarFutebolAgora)
  "Equipa A":          { slug: "football", metade: 45, intervalo: 15, teamId: 3002, relogioPeriodo: true },
  "Andebol":          { slug: "handball", metade: 30, intervalo: 10, teamId: 21795 },
  "Futsal":           { slug: "futsal",   metade: 20, intervalo: 10, teamId: 1268317 },
  // v111: Equipa B (FC Porto B, Liga Portugal 2) — a página da Liga não tem relógio; o Sofascore (equipa 74469) dá o minuto real e sobrepõe-na
  "Equipa B":         { slug: "football", metade: 45, intervalo: 15, teamId: 74469, relogioPeriodo: true },
  // v105: voleibol (campeonato) — o Sofascore dá os pontos do set em curso (homeScore.period1..5) e os sets (current)
  "Voleibol":         { slug: "volleyball", metade: 0, teamId: 335647, sets: true },
  // v124: basquetebol (equipa "Porto", id 208083, Liga Betclic + europeias). Mostra o quarto em curso (sem minutos); o FIBA LiveStats continua a mandar quando tem dados
  "Basquetebol":      { slug: "basketball", metade: 20, teamId: 208083, quartos: true }
};

function sofaGet_(caminho) {
  const r = UrlFetchApp.fetch(SOFA_BASE_ + caminho, { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
  if (r.getResponseCode() !== 200) return { erro: "HTTP " + r.getResponseCode() };
  try { return { dados: JSON.parse(r.getContentText()) }; } catch (e) { return { erro: "JSON inválido" }; }
}

function sofaEhPorto_(t) { return /porto/i.test((t && t.name) || "") && !/porto\s+(salvo|santo)/i.test((t && t.name) || ""); }

// Devolve o evento do Sofascore (ou null) para um jogo do site, procurando nos jogos da equipa do FC Porto (próximos + últimos).
function sofaDescobrir_(it, cfg, hoje, listas) {
  if (!listas[cfg.slug]) {
    const vistos = {}, todos = [];
    ["next", "last"].forEach(function(k) {
      const q = sofaGet_("team/" + cfg.teamId + "/events/" + k + "/0");
      ((q.dados && q.dados.events) || []).forEach(function(e) { if (!vistos[e.id]) { vistos[e.id] = 1; todos.push(e); } });
    });
    listas[cfg.slug] = todos;
  }
  const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime() / 1000;
  const cand = listas[cfg.slug].filter(function(e) {
    if (!sofaEhPorto_(e.homeTeam) && !sofaEhPorto_(e.awayTeam)) return false;
    return Utilities.formatDate(new Date(e.startTimestamp * 1000), "Europe/Lisbon", "yyyy-MM-dd") === hoje;
  });
  const adv = function(e) { return sofaEhPorto_(e.homeTeam) ? e.awayTeam : e.homeTeam; };
  const porNome = cand.filter(function(e) { return it.adv && cevNomesBatem_(it.adv, adv(e).name); });
  const porHora = cand.filter(function(e) { return Math.abs(e.startTimestamp - ini) <= 20 * 60; });
  return porNome.filter(function(e) { return porHora.indexOf(e) >= 0; })[0] || porNome[0] || (porHora.length === 1 ? porHora[0] : null);
}

// Converte o evento do Sofascore no formato que o site já conhece (como o hóquei).
function sofaResumo_(e, cfg, agora, memo) {
  const tipo = (e.status && e.status.type) || "";
  if (cfg.sets) { // voleibol: formato igual ao da CEV — setsFcp/setsAdv e sets [[pontosFcp,pontosAdv],...] (inclui o set em curso)
    if (tipo === "canceled" || tipo === "postponed" || tipo === "notstarted") return null;
    const casaV = sofaEhPorto_(e.homeTeam);
    const hs = e.homeScore || {}, as = e.awayScore || {};
    const sets = [];
    for (let i = 1; i <= 5; i++) {
      if (hs["period" + i] === undefined && as["period" + i] === undefined) continue;
      const a = Number(hs["period" + i]) || 0, b = Number(as["period" + i]) || 0;
      sets.push(casaV ? [a, b] : [b, a]);
    }
    const sh = Number(hs.current) || 0, sa = Number(as.current) || 0;
    return { estado: tipo === "finished" ? "fim" : "vivo", setsFcp: casaV ? sh : sa, setsAdv: casaV ? sa : sh, sets: sets,
             status: tipo, codigo: tipo + "/" + String((e.status && e.status.description) || "") };
  }
  const desc = String((e.status && e.status.description) || "").toLowerCase();
  const casaFcp = sofaEhPorto_(e.homeTeam);
  const gc = Number(e.homeScore && e.homeScore.current) || 0, gf = Number(e.awayScore && e.awayScore.current) || 0;
  let estado = "agendado";
  if (tipo === "inprogress" || tipo === "interrupted") estado = "vivo";
  else if (tipo === "finished") estado = "fim";
  else if (tipo === "canceled" || tipo === "postponed") return null;
  let parte = "", tempo = "";
  if (estado === "vivo") {
    // v107: minuto REAL. O Sofascore dá time.played (segundos jogados) e playedLastUpdated (quando o relógio foi atualizado).
    // Avançamos desde essa atualização (no máximo 90 s: se o relógio parar, o minuto fica parado em vez de continuar a contar).
    const tm = e.time || {};
    const metadeS = (Number(tm.periodLength) || cfg.metade * 60);
    const minReal = function() {
      if (tm.played === undefined || tm.played === null || isNaN(Number(tm.played))) return 0;
      let seg = Number(tm.played);
      const quando = tm.playedLastUpdated ? Date.parse(tm.playedLastUpdated) : 0;
      if (quando && agora > quando) seg += Math.min(90, (agora - quando) / 1000);
      return Math.floor(seg / 60) + 1;
    };
    // v113: futebol — o minuto sai do INÍCIO REAL da parte em curso (currentPeriodStartTimestamp), não de time.played
    // (que dava 76' quando eram 52'). 1.ª parte: minutos desde o início; 2.ª: 45 + minutos desde o recomeço; passado o tempo regulamentar mostra 45+N' / 90+N'.
    const minutoFutebol = function(base) {
      if (!tm.currentPeriodStartTimestamp) return "";
      const m = Math.floor((agora - tm.currentPeriodStartTimestamp * 1000) / 60000) + 1;
      if (m < 1 || m > 70) return "";
      const total = base + m, lim = base + cfg.metade;
      return total > lim ? lim + "+" + (total - lim) + "'" : total + "'";
    };
    if (cfg.quartos) { // v124: basquetebol — 4 quartos; "Quarter 1", "1st quarter", "Q1", "Halftime", "Overtime"
      const mq = desc.match(/([1-4])(?:st|nd|rd|th)?\s*(?:quarter|qtr|q)\b|\bq\s*([1-4])\b|quarter\s*([1-4])/);
      if (/halftime|half time/.test(desc)) parte = "Intervalo";
      else if (/overtime|\bot\b/.test(desc)) parte = "Prolongamento";
      else if (mq) parte = (mq[1] || mq[2] || mq[3]) + ".º quarto";
      else if (/break|pause/.test(desc)) parte = "Intervalo";
    } else if (/halftime|half time|pause|break/.test(desc)) { parte = "Intervalo"; }
    else if (cfg.relogioPeriodo && /2nd|second/.test(desc)) { parte = "2.ª parte"; tempo = minutoFutebol(cfg.metade); }
    else if (cfg.relogioPeriodo && /1st|first/.test(desc)) { parte = "1.ª parte"; tempo = minutoFutebol(0); }
    else if (/2nd|second/.test(desc)) {
      parte = "2.ª parte";
      let m = minReal();
      if (m && m <= metadeS / 60) m += metadeS / 60; // se o contador vier só da 2.ª parte, soma a 1.ª
      if (!m && tm.currentPeriodStartTimestamp) m = metadeS / 60 + Math.floor((agora - tm.currentPeriodStartTimestamp * 1000) / 60000) + 1; // início real da parte
      tempo = m ? Math.min(m, cfg.metade * 2 + 15) + "'" : "";
    } else if (/1st|first/.test(desc)) {
      parte = "1.ª parte";
      let m = minReal();
      if (!m && tm.currentPeriodStartTimestamp) m = Math.floor((agora - tm.currentPeriodStartTimestamp * 1000) / 60000) + 1;
      tempo = m ? Math.min(m, cfg.metade + 15) + "'" : "";
    } else if (/extra|overtime|penalt/.test(desc)) { parte = "Prolongamento"; }
  }
  return { estado: estado, golosFcp: casaFcp ? gc : gf, golosAdv: casaFcp ? gf : gc, tempo: tempo, parte: parte, codigo: tipo + "/" + desc };
}

function atualizarAoVivoSofascoreCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const items = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (!SOFA_SPORTS_[ev.sport] || ev.day !== hoje || !ev.t) return;
      items.push({ id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport, liveId: (ev.sport === "Basquetebol" && !/#id:/.test(String(ev.liveId || ""))) ? "" : String(ev.liveId || "").replace(/\D/g, ""), noAuto: !!ev.noAuto, compId: c.id, local: ev.local || "casa" });
    });
  });
  const ativos = items.filter(function(it) {
    if (forcar) return true;
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    return agora >= ini - 30 * 60000 && agora <= ini + 3 * 3600000;
  });
  if (!ativos.length) { props.deleteProperty(SOFA_LIVE_PROP_); return "sem jogos para o Sofascore em curso"; }
  let mapa; try { mapa = JSON.parse(props.getProperty(SOFA_MAP_PROP_) || "{}"); } catch (e) { mapa = {}; }
  let periodos; try { periodos = JSON.parse(props.getProperty(SOFA_PER_PROP_) || "{}"); } catch (e) { periodos = {}; }
  const listas = {};
  const out = {};
  const avisosPend = []; // v115: avisos automáticos a enviar depois de guardar o estado
  let estadosAuto; try { estadosAuto = JSON.parse(props.getProperty(AVISOS_AUTO_PROP_) || "{}"); } catch (e) { estadosAuto = {}; }
  ativos.forEach(function(it) {
    const cfg = SOFA_SPORTS_[it.sport];
    let sid = it.liveId || mapa[it.id + "|" + hoje] || "";
    let e = null;
    if (sid) {
      const q = sofaGet_("event/" + sid);
      e = q.dados && q.dados.event;
    } else {
      e = sofaDescobrir_(it, cfg, hoje, listas); // sem ID escrito à mão: procura sozinho
      if (e) { mapa[it.id + "|" + hoje] = String(e.id); }
    }
    if (!e) return;
    const chave = String(e.id);
    const res = sofaResumo_(e, cfg, agora, periodos[chave]);
    // memória: quando começou a parte em curso (para contar os minutos quando o Sofascore não os dá)
    const descAtual = String((e.status && e.status.description) || "").toLowerCase();
    if (!periodos[chave] || periodos[chave].d !== descAtual) periodos[chave] = { d: descAtual, s: agora, o: !!periodos[chave] }; // o = vimos mesmo a mudança (senão só a vimos a meio)
    if (!res) return;
    res.adv = it.adv; res.sport = it.sport;
    out[it.id] = res;
    if (SOFA_DET_SPORTS_.indexOf(it.sport) >= 0 && (res.estado === "vivo" || res.estado === "fim")) {
      try { sofaGuardarDetalhe_(it.id, e, agora, it.sport); } catch (err) { Logger.log("detalhe " + it.id + ": " + err); }
    }
    try { avisosAutoProcessar_(it, res, estadosAuto, avisosPend, agora); } catch (err) { Logger.log("avisos auto " + it.id + ": " + err); }
  });
  // limpa estados com mais de 2 dias e guarda ANTES de enviar (se algo falhar, nunca se repete um aviso)
  Object.keys(estadosAuto).forEach(function(k) { if (!estadosAuto[k].t || agora - estadosAuto[k].t > 2 * 86400000) delete estadosAuto[k]; });
  props.setProperty(AVISOS_AUTO_PROP_, JSON.stringify(estadosAuto));
  avisosPend.forEach(function(a) { try { avisosAutoEnviar_(a); } catch (err) { Logger.log("envio aviso: " + err); } });
  props.setProperty(SOFA_PER_PROP_, JSON.stringify(periodos));
  props.setProperty(SOFA_MAP_PROP_, JSON.stringify(mapa));
  props.setProperty(SOFA_LIVE_PROP_, JSON.stringify({ updated: agora, jogos: out }));
  return "jogos ligados: " + Object.keys(out).length + " de " + ativos.length;
}

function atualizarAoVivoSofascore_() {
  try { atualizarAoVivoSofascoreCore_(false); }
  catch (e) { Logger.log("atualizarAoVivoSofascore_ — erro: " + e); }
}

// Para testar à mão a qualquer hora (inclui o voleibol): ignora a janela de horas, mostra os jogos de HOJE do Porto que o Sofascore lista e o que o site receberia.
function testarAoVivoSofascoreAgora() {
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  Object.keys(SOFA_SPORTS_).forEach(function(nome) {
    const cfg = SOFA_SPORTS_[nome];
    ["next", "last"].forEach(function(k) {
      const q = sofaGet_("team/" + cfg.teamId + "/events/" + k + "/0");
      if (q.erro) { Logger.log("[" + nome + "] " + k + ": " + q.erro); return; }
      const deHoje = (q.dados.events || []).filter(function(e) {
        return Utilities.formatDate(new Date(e.startTimestamp * 1000), "Europe/Lisbon", "yyyy-MM-dd") === hoje;
      });
      Logger.log("[" + nome + "] " + k + ": " + (q.dados.events || []).length + " jogos, de hoje: " + deHoje.length);
      deHoje.forEach(function(e) {
        Logger.log("   " + e.id + " | " + (e.tournament && e.tournament.name) + " | " + e.homeTeam.name + " " + (e.homeScore && e.homeScore.current) + "-" + (e.awayScore && e.awayScore.current) + " " + e.awayTeam.name +
          " | " + (e.status && e.status.type) + " (" + (e.status && e.status.description) + ") | " + JSON.stringify(sofaResumo_(e, cfg, Date.now())));
      });
    });
  });
  Logger.log(atualizarAoVivoSofascoreCore_(true));
  Logger.log(PropertiesService.getScriptProperties().getProperty(SOFA_LIVE_PROP_));
}

// O que o site recebe como "cevLive": junta o voleibol (CEV e campeonato), o hóquei e o andebol num só pacote.
function readAoVivoTodos_() {
  const cev = readCevLive_();
  const jogos = {};
  let updated = cev.updated || 0;
  Object.keys((cev && cev.jogos) || {}).forEach(function(k) { jogos[k] = cev.jogos[k]; });
  const daFiba = {}; // v124: jogos de basquetebol com dados do FIBA (relógio certo) — o Sofascore não os sobrepõe
  [HOQUEI_LIVE_PROP_, ANDEBOL_LIVE_PROP_, VOLEINAC_LIVE_PROP_, EQB_LIVE_PROP_, BASQUETE_LIVE_PROP_, SOFA_LIVE_PROP_].forEach(function(prop) {
    try {
      const raw = PropertiesService.getScriptProperties().getProperty(prop);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (!o || !o.updated || Math.abs(Date.now() - o.updated) > 10 * 60 * 1000) return;
      Object.keys(o.jogos || {}).forEach(function(k) {
        if (prop === BASQUETE_LIVE_PROP_) daFiba[k] = 1;
        if (prop === SOFA_LIVE_PROP_ && daFiba[k]) return;
        jogos[k] = o.jogos[k];
      });
      updated = Math.max(updated, o.updated);
    } catch (e) {}
  });
  return { updated: updated, jogos: jogos };
}


// ===================== ALERTAS DE "AO VIVO SEM DADOS" (v108) =====================
// De 5 em 5 minutos (dentro do gatilho de minuto a minuto), procura jogos de hoje que:
//   • já começaram há mais de 20 minutos e há menos de 2 h 30,
//   • ainda não têm resultado escrito no site,
//   • e para os quais NENHUMA fonte ao vivo está a dar dados (ou o jogo continua "agendado" na fonte).
// Manda UM email por jogo (para o dono do script) a dizer qual é a fonte e o que fazer. O site não é afetado:
// sem dados ao vivo, continua a mostrar o jogo e o resultado que for escrito à mão.
// Modalidades sem fonte ao vivo fiável ficam em ALERTA_AOVIVO_IGNORAR (futsal: o Sofascore não acompanha a 3.ª Divisão).
const ALERTA_AOVIVO_IGNORAR = ["Futsal"];
const ALERTA_AOVIVO_FONTES_ = {
  "Equipa A": "Sofascore", "Futebol Feminino": "Sofascore", "Andebol": "Sofascore", "Futsal": "Sofascore", "Voleibol": "Sofascore / FPV / CEV",
  "Hóquei Patins": "hoqueipatins.pt (live)", "Basquetebol": "FIBA LiveStats / Sofascore", "Equipa B": "Sofascore / Liga Portugal"
};
const ALERTA_AOVIVO_PROP_ = "alertasAoVivo";

function verificarSaudeAoVivo_() {
  try { verificarSaudeAoVivoCore_(false); }
  catch (e) { Logger.log("verificarSaudeAoVivo_ — erro: " + e); }
}

function verificarSaudeAoVivoCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const ultimo = Number(props.getProperty("alertasAoVivoUltimo")) || 0;
  if (!forcar && agora - ultimo < 5 * 60 * 1000) return "ainda cedo";
  props.setProperty("alertasAoVivoUltimo", String(agora));
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const vivos = readAoVivoTodos_().jogos || {};
  let enviados; try { enviados = JSON.parse(props.getProperty(ALERTA_AOVIVO_PROP_) || "{}"); } catch (e) { enviados = {}; }
  Object.keys(enviados).forEach(function(k) { if (k.indexOf(hoje) !== 0) delete enviados[k]; }); // só guarda os de hoje
  const problemas = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const d = all.data[c.id] || {};
    (d.events || []).forEach(function(ev) {
      if (ev.day !== hoje || !ev.t || !ALERTA_AOVIVO_FONTES_[ev.sport] || ALERTA_AOVIVO_IGNORAR.indexOf(ev.sport) >= 0) return;
      const st = (d.status || {})[ev.id] || {};
      if (st.resultado && String(st.resultado).trim()) return; // já tem resultado — nada a avisar
      const ini = Utilities.parseDate(hoje + " " + ev.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
      if (agora < ini + 20 * 60000 || agora > ini + 150 * 60000) return;
      const j = vivos[ev.id];
      if (j && (j.estado === "vivo" || j.estado === "fim")) return; // há dados
      const chave = hoje + "|" + ev.id;
      if (enviados[chave]) return;
      enviados[chave] = agora;
      problemas.push({ ev: ev, min: Math.round((agora - ini) / 60000), estado: j ? j.estado : "sem entrada" });
    });
  });
  props.setProperty(ALERTA_AOVIVO_PROP_, JSON.stringify(enviados));
  if (!problemas.length) return "tudo em ordem";
  const para = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
  problemas.forEach(function(p) {
    const ev = p.ev, fonte = ALERTA_AOVIVO_FONTES_[ev.sport];
    const jogo = ev.sport + " — " + (ev.local === "fora" ? ev.athlete + " vs FC Porto" : "FC Porto vs " + ev.athlete);
    const corpo = "O jogo começou às " + ev.t + " (há " + p.min + " min) e o site não tem dados ao vivo dele (" + (p.estado === "agendado" ? "a fonte ainda o dá como agendado" : "a fonte não o devolve") + ").\n\n" +
      "Fonte desta modalidade: " + fonte + ".\n\n" +
      "O que fazer:\n• Nada é obrigatório: o site continua a funcionar e mostra o jogo normalmente.\n" +
      "• Quando o jogo acabar, escreve o resultado à mão no site.\n" +
      "• Se for um jogo importante, corre testarAoVivoSofascoreAgora (ou o teste da modalidade) no Apps Script e vê o registo.\n" +
      "• Se isto acontecer em vários jogos seguidos, a fonte pode ter mudado.\n\n" +
      "Este aviso só é enviado uma vez por jogo.";
    GmailApp.sendEmail(para, "⚠️ Ao vivo sem dados: " + jogo, corpo);
  });
  return "avisos enviados: " + problemas.length;
}

// Para testares à mão (ignora a pausa de 5 minutos): mostra o que faria hoje.
function testarAlertasAoVivoAgora() {
  Logger.log(verificarSaudeAoVivoCore_(true));
}


// ===================== ESCUDOS DOS ADVERSÁRIOS (v109) =====================
// Fonte: Sofascore (não oficial; se falhar, o site mostra as iniciais como antes).
//  1) Lê os jogos da equipa do FC Porto em cada modalidade (team/<id>/events/next|last) e guarda as equipas adversárias (id + nome).
//  2) O doGet junta a isso os jogos do site: "Modalidade|Adversário" → id do Sofascore (campo "escudos").
//  3) ?escudo=<id> devolve a imagem em base64 (para o site a desenhar também nas imagens de partilha).
const ESCUDOS_PROP_ = "escudosSofa";

function escudosAtualizarSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  const ult = Number(props.getProperty("escudosUltimo")) || 0;
  if (Date.now() - ult < 12 * 3600 * 1000) return "ainda cedo";
  return escudosAtualizar_();
}

function escudosAtualizar_() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("escudosUltimo", String(Date.now()));
  let atual; try { atual = JSON.parse(props.getProperty(ESCUDOS_PROP_) || "{}"); } catch (e) { atual = {}; }
  const equipas = atual.equipas || {};
  Object.keys(SOFA_SPORTS_).forEach(function(nome) {
    const cfg = SOFA_SPORTS_[nome];
    const mapa = {};
    (equipas[nome] || []).forEach(function(x) { mapa[x[0]] = x[1]; }); // mantém o que já sabia
    [["next", 0], ["next", 1], ["last", 0], ["last", 1]].forEach(function(k) {
      const q = sofaGet_("team/" + cfg.teamId + "/events/" + k[0] + "/" + k[1]);
      ((q.dados && q.dados.events) || []).forEach(function(ev) {
        [ev.homeTeam, ev.awayTeam].forEach(function(t) { if (t && t.id && !sofaEhPorto_(t)) mapa[t.id] = t.name || ""; });
      });
    });
    equipas[nome] = Object.keys(mapa).map(function(id) { return [Number(id), mapa[id]]; });
  });
  props.setProperty(ESCUDOS_PROP_, JSON.stringify({ updated: Date.now(), equipas: equipas }));
  let pesq = ""; try { pesq = " | pesquisa: " + escudosPesquisar_(); } catch (e3) { pesq = " | pesquisa falhou: " + e3; }
  return "equipas guardadas: " + Object.keys(equipas).map(function(n) { return n + "=" + equipas[n].length; }).join(", ") + pesq;
}

// "Modalidade|Adversário (como está no site)" → id da equipa no Sofascore
function escudosParaSite_(all) {
  const out = {};
  try {
    const guardado = JSON.parse(PropertiesService.getScriptProperties().getProperty(ESCUDOS_PROP_) || "{}");
    const equipas = guardado.equipas || {};
    // o escudo do FC Porto: equipa de cada modalidade no Sofascore; as outras (basquetebol, hóquei) usam o do futebol feminino
    Object.keys(SOFA_SPORTS_).forEach(function(n) { out["FCP|" + n] = SOFA_SPORTS_[n].teamId; });
    out["FCP|*"] = SOFA_SPORTS_["Futebol Feminino"].teamId;
    let busca; try { busca = JSON.parse(PropertiesService.getScriptProperties().getProperty("escudosBusca") || "{}"); } catch (e2) { busca = {}; }
    Object.keys(busca).forEach(function(k) { if (!busca[k] || !busca[k].id) delete busca[k]; });
    all.competitions.forEach(function(c) {
      if (c.mode !== "matches" || c.archived) return;
      ((all.data[c.id] || {}).events || []).forEach(function(ev) {
        const adv = String(ev.athlete || "").trim();
        if (!adv || !equipas[ev.sport]) return;
        const chave = ev.sport + "|" + adv;
        if (out[chave]) return;
        const lista = equipas[ev.sport];
        let achada = null;
        if (ESCUDO_ALIASES_[chave]) achada = [ESCUDO_ALIASES_[chave], adv];                                                       // à mão
        for (let i = 0; i < lista.length && !achada; i++) if (cevNorm_(lista[i][1]) === cevNorm_(adv)) achada = lista[i];       // igual
        for (let i = 0; i < lista.length && !achada; i++) if (cevNomesBatem_(adv, lista[i][1])) achada = lista[i];               // parecido
        for (let i = 0; i < lista.length && !achada; i++) if (escudoQuaseIgual_(adv, lista[i][1])) achada = lista[i];            // 1-2 letras de diferença
        if (!achada && busca[chave]) achada = [busca[chave].id, adv];                                                              // encontrado pela pesquisa do Sofascore
        if (achada) out[chave] = achada[0];
      });
    });
  } catch (e) {}
  return out;
}

const ESCUDO_HOSTS_ = ["https://api.sofascore.com/api/v1/team/", "https://api.sofascore.app/api/v1/team/", "https://img.sofascore.com/api/v1/team/"];
function escudoHoqueiImagem_(idBruto) {
  // v130: escudos do hoqueipatins.pt — id "hq:2021/07/sc_tomar_300.png"
  const m = String(idBruto || "").match(/^hq:([\w\/.\-]{3,100}\.(?:gif|png|jpe?g|webp))$/i);
  if (!m || m[1].indexOf("..") >= 0) return { ok: false };
  const cache = CacheService.getScriptCache();
  const chave = "escudo" + Utilities.base64EncodeWebSafe(m[1]).slice(0, 200);
  const hit = cache.get(chave);
  if (hit) return { ok: true, img: hit };
  try {
    const r = UrlFetchApp.fetch("https://www.hoqueipatins.pt/wp-content/uploads/" + m[1], { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" } });
    const blob = r.getBlob(), tipo = String(blob.getContentType() || "");
    if (r.getResponseCode() !== 200 || tipo.indexOf("image/") !== 0) return { ok: false };
    const img = "data:" + tipo + ";base64," + Utilities.base64Encode(blob.getBytes());
    if (img.length < 95000) cache.put(chave, img, 21600);
    return { ok: true, img: img };
  } catch (e) { return { ok: false }; }
}
function escudoImagem_(idBruto, diag) {
  if (String(idBruto || "").indexOf("hq:") === 0) return escudoHoqueiImagem_(idBruto);
  const id = String(idBruto || "").replace(/\D/g, "");
  if (!id || id.length > 9) return { ok: false };
  const cache = CacheService.getScriptCache();
  const hit = cache.get("escudo" + id);
  if (hit && !diag) return { ok: true, img: hit };
  for (let i = 0; i < ESCUDO_HOSTS_.length; i++) {
    try {
      const r = UrlFetchApp.fetch(ESCUDO_HOSTS_[i] + id + "/image", { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" } });
      const cod = r.getResponseCode();
      if (diag) Logger.log("  escudo " + id + " em " + ESCUDO_HOSTS_[i] + " → HTTP " + cod + " " + (r.getBlob().getContentType() || ""));
      if (cod !== 200) continue;
      const blob = r.getBlob(), tipo = String(blob.getContentType() || "");
      if (tipo.indexOf("image/") !== 0) continue;
      const img = "data:" + tipo + ";base64," + Utilities.base64Encode(blob.getBytes());
      if (img.length < 95000) cache.put("escudo" + id, img, 21600);
      return { ok: true, img: img };
    } catch (e) { if (diag) Logger.log("  escudo " + id + " em " + ESCUDO_HOSTS_[i] + " → erro " + e); }
  }
  return { ok: false };
}

// TESTE: corre no Apps Script e abre o Registo. Mostra, por modalidade, quantos adversários do site têm escudo.
function testarEscudosAgora() {
  Logger.log(escudosAtualizar_());
  const all = readAll_(getSheet_());
  const mapa = escudosParaSite_(all);
  const total = {}, com = {}, semNome = {};
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (!SOFA_SPORTS_[ev.sport] || !ev.athlete) return;
      const ch = ev.sport + "|" + String(ev.athlete).trim();
      total[ev.sport] = total[ev.sport] || {}; total[ev.sport][ch] = 1;
      if (mapa[ch]) { com[ev.sport] = com[ev.sport] || {}; com[ev.sport][ch] = 1; }
      else { semNome[ev.sport] = semNome[ev.sport] || {}; semNome[ev.sport][ev.athlete] = 1; }
    });
  });
  Object.keys(SOFA_SPORTS_).forEach(function(n) {
    Logger.log(n + ": " + Object.keys(com[n] || {}).length + " de " + Object.keys(total[n] || {}).length + " adversários reconhecidos" +
      (semNome[n] ? " · sem escudo: " + Object.keys(semNome[n]).join(", ") : ""));
  });
  const um = Object.keys(mapa)[0];
  if (um) { const r = escudoImagem_(mapa[um], true); Logger.log("imagem de teste (" + um + "): " + (r.ok ? "OK, " + r.img.length + " caracteres" : "FALHOU")); }
  else Logger.log("nenhum adversário reconhecido — verifica se o Sofascore responde (corre testarAoVivoSofascoreAgora).");
}


// ===================== CRONOLOGIA E ESTATÍSTICAS DO JOGO (v112) =====================
// Do Sofascore (não oficial): event/<id>/incidents (golos, cartões, substituições) e event/<id>/statistics.
// Guarda por jogo, compacto, na prop "sofaDetalhes" (as mais recentes; máx. ~8 KB). O site só mostra, nunca altera resultados.
//  inc: [[minuto "45+2", tipo, lado(0=FC Porto,1=adversário), nome, extra], ...] por ordem do jogo
//     tipo: G golo, GP golo de penálti, AG auto-golo, CA amarelo, CV vermelho, CA2 2.º amarelo, S substituição (nome = entra, extra = sai), O outro
//  st:  [[nome, valorFcp, valorAdv], ...]
const SOFA_DET_SPORTS_ = ["Equipa A", "Futebol Feminino", "Andebol", "Equipa B", "Basquetebol"];
const SOFA_DET_MAX_ST_ = { "Equipa A": 26, "Basquetebol": 24 }; // v149: o jogo da equipa principal guarda mais estatísticas (posse, remates, xG, passes…)
const SOFA_DET_PROP_ = "sofaDetalhes";

function sofaGuardarDetalhe_(evId, e, agora, sportDet) {
  const casaFcp = sofaEhPorto_(e.homeTeam);
  const lado = function(isHome) { return (!!isHome === casaFcp) ? 0 : 1; };
  const inc = [];
  const qi = sofaGet_("event/" + e.id + "/incidents");
  ((qi.dados && qi.dados.incidents) || []).forEach(function(x) {
    const t = x.incidentType, cl = String(x.incidentClass || "");
    const min = (x.time !== undefined && x.time !== null) ? String(x.time) + (x.addedTime ? "+" + x.addedTime : "") : "";
    const nome = function(p) { return p ? String(p.shortName || p.name || "") : ""; };
    if (t === "goal") inc.push([min, cl === "ownGoal" ? "AG" : (cl === "penalty" ? "GP" : "G"), lado(x.isHome), nome(x.player), nome(x.assist1)]);
    else if (t === "card") inc.push([min, cl === "red" ? "CV" : (cl === "yellowRed" ? "CA2" : (cl === "yellow" ? "CA" : "O")), lado(x.isHome), nome(x.player), cl === "yellow" || cl === "red" || cl === "yellowRed" ? "" : cl]);
    else if (t === "substitution") inc.push([min, "S", lado(x.isHome), nome(x.playerIn), nome(x.playerOut)]);
    else if (x.player && min && t !== "period" && t !== "injuryTime" && t !== "varDecision") inc.push([min, "O", lado(x.isHome), nome(x.player), String(t || "") + (cl ? " " + cl : "")]);
  });
  inc.reverse(); // o Sofascore manda o mais recente primeiro
  const st = [];
  const qs = sofaGet_("event/" + e.id + "/statistics");
  const per = ((qs.dados && qs.dados.statistics) || []).filter(function(p) { return p.period === "ALL"; })[0];
  ((per && per.groups) || []).forEach(function(g) {
    (g.statisticsItems || []).forEach(function(i) {
      if (st.length >= (SOFA_DET_MAX_ST_[sportDet] || 14) || !i.name) return;
      if (st.some(function(x) { return x[0] === String(i.name); })) return; // v149: o Sofascore repete algumas (Total shots, Expected goals) em grupos diferentes
      st.push([String(i.name), String(casaFcp ? i.home : i.away), String(casaFcp ? i.away : i.home)]);
    });
  });
  // v151 Basquetebol: ficha de cada jogador (event/<id>/lineups). jg: [[nome, camisola, lado(0=FC Porto,1=adv), minutos, pontos, ressaltos, assistências, roubos, +/-, nota, lançamentos "marcados/tentados"]]
  // (os 80+ lances de pontos não se guardam: não cabem e o site já mostra o resultado)
  const jg = [];
  if (sportDet === "Basquetebol") {
    inc.length = 0;
    const ql = sofaGet_("event/" + e.id + "/lineups");
    const L = ql.dados || {};
    [["home", true], ["away", false]].forEach(function(par) {
      ((L[par[0]] || {}).players || []).forEach(function(pl) {
        const s2 = pl.statistics || {}, p = pl.player || {};
        if (!s2.secondsPlayed) return; // quem não jogou fica de fora
        jg.push([String(p.shortName || p.name || ""), String(pl.jerseyNumber || pl.shirtNumber || p.jerseyNumber || ""), (par[1] === casaFcp) ? 0 : 1,
          Math.round(s2.secondsPlayed / 60), s2.points || 0, s2.rebounds || 0, s2.assists || 0, s2.steals || 0, s2.plusMinus === undefined ? "" : s2.plusMinus,
          s2.rating === undefined ? "" : Math.round(s2.rating * 10) / 10, (s2.fieldGoalsMade || 0) + "/" + (s2.fieldGoalAttempts || 0)]);
      });
    });
    jg.sort(function(a, b) { return a[2] - b[2] || b[4] - a[4] || b[3] - a[3]; });
  }
  if (!inc.length && !st.length && !jg.length) return;
  const props = PropertiesService.getScriptProperties();
  let todos; try { todos = JSON.parse(props.getProperty(SOFA_DET_PROP_) || "{}"); } catch (err) { todos = {}; }
  todos[evId] = { t: agora, inc: inc, st: st };
  if (jg.length) todos[evId].jg = jg;
  // limpa: só os 6 mais recentes e sempre abaixo de ~8 KB
  let chaves = Object.keys(todos).sort(function(a, b) { return todos[b].t - todos[a].t; });
  chaves.slice(6).forEach(function(k) { delete todos[k]; });
  while (JSON.stringify(todos).length > 8000 && Object.keys(todos).length > 1) {
    chaves = Object.keys(todos).sort(function(a, b) { return todos[b].t - todos[a].t; });
    delete todos[chaves[chaves.length - 1]];
  }
  if (JSON.stringify(todos).length > 8000) { delete todos[evId].jg; if (JSON.stringify(todos).length > 8000) todos[evId].st = []; }
  props.setProperty(SOFA_DET_PROP_, JSON.stringify(todos));
}

function sofaDetalhesParaSite_() {
  try {
    const todos = JSON.parse(PropertiesService.getScriptProperties().getProperty(SOFA_DET_PROP_) || "{}");
    const out = {};
    Object.keys(todos).forEach(function(k) { if (Date.now() - todos[k].t < 4 * 86400000) out[k] = { inc: todos[k].inc, st: todos[k].st, jg: todos[k].jg }; });
    return out;
  } catch (e) { return {}; }
}

// TESTE: mostra o que o Sofascore devolve para o jogo de hoje (corre durante ou logo depois de um jogo)
function testarDetalheSofascoreAgora() {
  Logger.log(atualizarAoVivoSofascoreCore_(true));
  Logger.log("detalhes guardados: " + PropertiesService.getScriptProperties().getProperty(SOFA_DET_PROP_));
}


// ===================== ESCUDOS v114: nomes diferentes, pesquisa e equivalências à mão =====================
// Equivalências à mão, se a pesquisa não acertar: "Modalidade|Adversário (como está no site)": <id da equipa no Sofascore>
const ESCUDO_ALIASES_ = {
  "Andebol|Vezprem": 6628, // One Veszprém (Sofascore)
};
function escudoDist_(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = []; for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function escudoQuaseIgual_(a, b) {
  const A = cevNorm_(a).replace(/\s/g, ""), B = cevNorm_(b).replace(/\s/g, "");
  return A.length >= 5 && B.length >= 5 && escudoDist_(A, B) <= 2;
}
// Para os adversários do site que continuam sem escudo, pergunta ao Sofascore pelo nome (no máx. 8 por vez; repete passados 3 dias)
function escudosPesquisar_() {
  const props = PropertiesService.getScriptProperties();
  let busca; try { busca = JSON.parse(props.getProperty("escudosBusca") || "{}"); } catch (e) { busca = {}; }
  const all = readAll_(getSheet_());
  const mapa = escudosParaSite_(all);
  const pendentes = {};
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      const adv = String(ev.athlete || "").trim(), chave = ev.sport + "|" + adv;
      if (!adv || !SOFA_SPORTS_[ev.sport] || mapa[chave]) return;
      if (busca[chave] && Date.now() - busca[chave].t < 3 * 86400000) return;
      pendentes[chave] = { sport: ev.sport, adv: adv };
    });
  });
  let n = 0; const log = [];
  Object.keys(pendentes).forEach(function(chave) {
    if (n >= 8) return; n++;
    const p = pendentes[chave], cfg = SOFA_SPORTS_[p.sport];
    const q = sofaGet_("search/all?q=" + encodeURIComponent(p.adv));
    let id = 0, nome = "";
    ((q.dados && q.dados.results) || []).forEach(function(r) {
      const en = r.entity || {};
      if (id || r.type !== "team" || !en.id || !en.sport || en.sport.slug !== cfg.slug) return;
      if (cevNomesBatem_(p.adv, en.name || "") || escudoQuaseIgual_(p.adv, en.name || "")) { id = en.id; nome = en.name; }
    });
    busca[chave] = { id: id, t: Date.now(), nome: nome };
    log.push(chave + " → " + (id ? id + " (" + nome + ")" : "não encontrado"));
  });
  props.setProperty("escudosBusca", JSON.stringify(busca));
  return log.length ? log.join(" | ") : "nada por pesquisar";
}


// ===================== AVISOS AUTOMÁTICOS DE GOLO E DE FIM DE SET (v115) =====================
// Golos: Equipa B e Futebol Feminino (golo do FC Porto e do adversário). Voleibol: resultado de cada set (menos o último, que decide o jogo:
// esse é o aviso do resultado final que já é feito à mão). Intervalo e resultado final continuam manuais.
// Segurança: só avisa depois de a mesma pontuação aparecer em DUAS leituras seguidas (1 min cada); cada aviso é gravado antes de ser enviado,
// por isso nunca se repete; o editor tem "Sem avisos automáticos" por jogo (ev.noAuto).
// Destinatários: propriedade do script AVISOS_AUTO_MODO = "teste" (por defeito: só quem tem o nome em AVISOS_AUTO_NOMES, ex.: "Fernando,Bruno")
// ou "todos". Em modo teste o título leva "[TESTE]".
const AVISOS_AUTO_PROP_ = "avisosAuto";
const AVISOS_AUTO_GOLOS_ = ["Equipa B", "Futebol Feminino", "Equipa A"];
const AVISOS_AUTO_SETS_ = ["Voleibol"];

function avisosAutoModo_() { return String(PropertiesService.getScriptProperties().getProperty("AVISOS_AUTO_MODO") || "teste").toLowerCase() === "todos" ? "todos" : "teste"; }
function avisosAutoModoTodos() { PropertiesService.getScriptProperties().setProperty("AVISOS_AUTO_MODO", "todos"); Logger.log("Avisos automáticos: agora vão para TODOS."); }
function avisosAutoModoTeste() { PropertiesService.getScriptProperties().setProperty("AVISOS_AUTO_MODO", "teste"); Logger.log("Avisos automáticos: agora só vão para os nomes em AVISOS_AUTO_NOMES."); }

function avisosAutoDestinatarios_(sheet, modo) {
  const tokens = dedupeTokensByName_(readPushTokens_(sheet));
  if (modo === "todos") return tokens;
  const nomes = String(PropertiesService.getScriptProperties().getProperty("AVISOS_AUTO_NOMES") || "").split(",").map(function(x) { return x.trim().toLowerCase(); }).filter(Boolean);
  return tokens.filter(function(t) { return nomes.indexOf(String(t.name || "").trim().toLowerCase()) >= 0; });
}

function avisosAutoEnviar_(a) {
  const sheet = getSheet_();
  const modo = a.forcarTeste ? "teste" : avisosAutoModo_(); // v125: a simulação nunca vai para toda a gente
  const dest = avisosAutoDestinatarios_(sheet, modo);
  const titulo = (modo === "teste" ? "[TESTE] " : "") + a.titulo;
  Logger.log("aviso automático (" + modo + ", " + dest.length + " destinatário(s)): " + titulo + " — " + a.corpo);
  if (modo === "todos") appendSentPushHistory_(sheet, titulo, a.corpo);
  if (!dest.length) { Logger.log("  sem destinatários: em modo teste, define AVISOS_AUTO_NOMES nas propriedades do script (nomes como aparecem em quem ativou os avisos)."); return; }
  sendPushToTokenList_(dest, titulo, a.corpo, buildEventPushLink_(a.evId, a.compId));
}

// golo n-ésimo de um lado (0 = FC Porto, 1 = adversário), lido da cronologia já guardada (para dizer quem marcou e quando)
function avisosAutoMarcador_(evId, lado, n) {
  try {
    const d = JSON.parse(PropertiesService.getScriptProperties().getProperty(SOFA_DET_PROP_) || "{}")[evId];
    if (!d) return "";
    const golos = (d.inc || []).filter(function(x) { return (x[1] === "G" || x[1] === "GP") && x[2] === lado; });
    return golos.length >= n && golos[n - 1][3] ? golos[n - 1][3] + " " + golos[n - 1][0] + "' · " : "";
  } catch (e) { return ""; }
}

function avisosAutoPlacar_(it, f, a) { return it.local === "fora" ? it.adv + " " + a + "-" + f + " FC Porto" : "FC Porto " + f + "-" + a + " " + it.adv; }

function avisosAutoProcessar_(it, res, estados, pend, agora) {
  if (it.noAuto || res.estado !== "vivo") return;
  const golos = AVISOS_AUTO_GOLOS_.indexOf(it.sport) >= 0, sets = AVISOS_AUTO_SETS_.indexOf(it.sport) >= 0;
  if (!golos && !sets) return;
  const est = estados[it.id] || (estados[it.id] = {});
  est.t = agora;
  if (golos && res.golosFcp !== undefined) {
    const a = Number(res.golosFcp) || 0, b = Number(res.golosAdv) || 0;
    if (!est.g) est.g = [a, b]; // 1.ª leitura: só serve de referência
    else if (a !== est.g[0] || b !== est.g[1]) {
      if (est.p && est.p[0] === a && est.p[1] === b) { // confirmado em duas leituras seguidas
        for (let i = est.g[0] + 1; i <= a; i++) pend.push({ evId: it.id, compId: it.compId, titulo: "⚽ Golo do FC Porto!", corpo: avisosAutoMarcador_(it.id, 0, i) + it.sport + ": " + avisosAutoPlacar_(it, a, b) });
        for (let j = est.g[1] + 1; j <= b; j++) pend.push({ evId: it.id, compId: it.compId, titulo: "Golo do adversário", corpo: avisosAutoMarcador_(it.id, 1, j) + it.sport + ": " + avisosAutoPlacar_(it, a, b) });
        est.g = [a, b]; est.p = null;
      } else est.p = [a, b];
    } else est.p = null;
  }
  if (sets && Array.isArray(res.sets)) {
    let fechados = 0;
    for (let i = 0; i < res.sets.length; i++) {
      const x = Number(res.sets[i][0]) || 0, y = Number(res.sets[i][1]) || 0, alvo = i >= 4 ? 15 : 25;
      if (Math.max(x, y) >= alvo && Math.abs(x - y) >= 2) fechados++; else break;
    }
    if (est.s === undefined) est.s = fechados;
    else if (fechados > est.s) {
      if (est.ps === fechados) {
        for (let k = est.s; k < fechados; k++) {
          let wf = 0, wa = 0;
          for (let m = 0; m <= k; m++) { if ((Number(res.sets[m][0]) || 0) > (Number(res.sets[m][1]) || 0)) wf++; else wa++; }
          if (wf < 3 && wa < 3) { // o último set decide o jogo: esse aviso é o do resultado final (manual)
            const f = Number(res.sets[k][0]) || 0, a = Number(res.sets[k][1]) || 0;
            pend.push({ evId: it.id, compId: it.compId, titulo: "🏐 Fim do " + (k + 1) + ".º set", corpo: "Voleibol: " + (it.local === "fora" ? it.adv + " " + a + "-" + f + " FC Porto" : "FC Porto " + f + "-" + a + " " + it.adv) + " · Sets " + (it.local === "fora" ? wa + "-" + wf : wf + "-" + wa) });
          }
        }
        est.s = fechados; est.ps = null;
      } else est.ps = fechados;
    } else est.ps = null;
  }
}

// TESTE de entrega: manda um aviso de exemplo (só para o modo atual) para confirmar que chega ao telemóvel
function testarAvisosAutoAgora() {
  Logger.log("Modo atual: " + avisosAutoModo_() + " | nomes de teste: " + (PropertiesService.getScriptProperties().getProperty("AVISOS_AUTO_NOMES") || "(nenhum)"));
  avisosAutoEnviar_({ evId: "", compId: "", titulo: "⚽ Golo do FC Porto!", corpo: "Exemplo · Equipa B: FC Porto 1-0 U. Leiria" });
}


// ===================== FORMA DOS ADVERSÁRIOS (v116) =====================
// Para os jogos dos próximos 7 dias, lê os últimos jogos de cada adversário no Sofascore (team/<id>/events/last/0)
// e guarda os 5 mais recentes como [V|E|D, oponente, placar do adversário]. O doGet devolve-os em "formas"
// ("Modalidade|Adversário" → lista), e a página do jogo mostra-os no cartão "Antes do jogo".
const FORMAS_PROP_ = "formasSofa";

function formasAtualizarSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  if (Date.now() - (Number(props.getProperty("formasUltimo")) || 0) < 6 * 3600 * 1000) return "ainda cedo";
  return formasAtualizar_();
}

function formasAtualizar_() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("formasUltimo", String(Date.now()));
  const all = readAll_(getSheet_());
  const mapa = escudosParaSite_(all);
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  const limite = Utilities.formatDate(new Date(Date.now() + 7 * 86400000), "Europe/Lisbon", "yyyy-MM-dd");
  let guardado; try { guardado = JSON.parse(props.getProperty(FORMAS_PROP_) || "{}"); } catch (e) { guardado = {}; }
  const ids = {};
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (!SOFA_SPORTS_[ev.sport] || !ev.day || ev.day < hoje || ev.day > limite) return;
      const id = mapa[ev.sport + "|" + String(ev.athlete || "").trim()];
      if (id && String(id).indexOf("FCP") !== 0) ids[id] = 1;
    });
  });
  let feitos = 0, falhas = 0;
  Object.keys(ids).slice(0, 25).forEach(function(id) {
    const q = sofaGet_("team/" + id + "/events/last/0");
    if (!q.dados) { falhas++; return; }
    const jogos = (q.dados.events || []).filter(function(e) { return e.status && e.status.type === "finished" && e.homeScore && e.awayScore; })
      .sort(function(a, b) { return (b.startTimestamp || 0) - (a.startTimestamp || 0); }).slice(0, 5);
    const f = jogos.map(function(e) {
      const casa = String(e.homeTeam && e.homeTeam.id) === String(id);
      const meu = Number((casa ? e.homeScore : e.awayScore).current), dele = Number((casa ? e.awayScore : e.homeScore).current);
      const opo = ((casa ? e.awayTeam : e.homeTeam) || {}).name || "";
      return [meu > dele ? "V" : (meu < dele ? "D" : "E"), opo, meu + "-" + dele];
    }).reverse(); // do mais antigo para o mais recente
    guardado[id] = { t: Date.now(), f: f };
    feitos++;
  });
  Object.keys(guardado).forEach(function(k) { if (Date.now() - guardado[k].t > 14 * 86400000) delete guardado[k]; });
  props.setProperty(FORMAS_PROP_, JSON.stringify(guardado));
  return "adversários lidos: " + feitos + " (falhas: " + falhas + ") de " + Object.keys(ids).length + " com jogo nos próximos 7 dias";
}

function formasParaSite_(all) {
  const out = {};
  try {
    const guardado = JSON.parse(PropertiesService.getScriptProperties().getProperty(FORMAS_PROP_) || "{}");
    const mapa = escudosParaSite_(all);
    Object.keys(mapa).forEach(function(chave) {
      if (chave.indexOf("FCP|") === 0) return;
      const g = guardado[mapa[chave]];
      if (g && g.f && g.f.length) out[chave] = g.f;
    });
  } catch (e) {}
  return out;
}

// TESTE: lê já a forma dos adversários e mostra o que guardou
function testarFormasAgora() {
  Logger.log(formasAtualizar_());
  const all = readAll_(getSheet_());
  const f = formasParaSite_(all);
  Object.keys(f).forEach(function(k) { Logger.log(k + " → " + f[k].map(function(x) { return x[0] + " " + x[2] + " (" + x[1] + ")"; }).join(" | ")); });
}


// ===================== TESTE DO PLANTEL (v117) — só lê e escreve no registo, não muda nada =====================
// Para cada modalidade do Sofascore, lê team/<id>/players e diz quantos jogadores vieram, quantos têm número e posição.
function testarPlantelAgora() {
  Object.keys(SOFA_SPORTS_).forEach(function(nome) {
    const cfg = SOFA_SPORTS_[nome];
    const q = sofaGet_("team/" + cfg.teamId + "/players");
    if (!q.dados) { Logger.log(nome + " (equipa " + cfg.teamId + "): ERRO " + q.erro); return; }
    const lista = (q.dados.players || []).map(function(x) { return x.player || x; });
    const comNum = lista.filter(function(p) { return p.jerseyNumber !== undefined && p.jerseyNumber !== null && p.jerseyNumber !== ""; }).length;
    const comPos = lista.filter(function(p) { return p.position; }).length;
    Logger.log(nome + " (equipa " + cfg.teamId + "): " + lista.length + " jogadores | com número: " + comNum + " | com posição: " + comPos);
    lista.slice(0, 4).forEach(function(p) { Logger.log("    " + (p.jerseyNumber !== undefined ? "#" + p.jerseyNumber : "#?") + " " + (p.name || "?") + " — " + (p.position || "sem posição")); });
    if (!lista.length) Logger.log("    chaves devolvidas: " + Object.keys(q.dados).join(", "));
  });
}


// ===================== TESTE DO PLANTEL OFICIAL DO FC PORTO (v118) — só lê e escreve no registo =====================
// A API do site do clube: api.app.fcporto.pt/v2/sportClasses/<modalidade>/teamsSquads?team=<equipa>. Aqui lê o Futebol Feminino
// (modalidade 17, equipa 1150) e depois experimenta as outras modalidades (1 a 40) sem equipa, para descobrir os números.
const FCP_API_ = "https://api.app.fcporto.pt/v2/sportClasses/";
function fcpPlantelGet_(classe, equipa) {
  const url = FCP_API_ + classe + "/teamsSquads?locale=pt&fields=slug,country,alternative_name" + (equipa ? "&team=" + equipa : "") + "&bundle=pt.thingpink.web.fcporto&platform=5";
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
  if (r.getResponseCode() !== 200) return { erro: "HTTP " + r.getResponseCode() };
  try { return { dados: JSON.parse(r.getContentText()) }; } catch (e) { return { erro: "JSON inválido" }; }
}
function testarPlantelFcpAgora() {
  const q = fcpPlantelGet_(17, 1150);
  if (!q.dados) { Logger.log("Feminino (17/1150): ERRO " + q.erro); }
  else {
    const j = (q.dados.squad && q.dados.squad.players) || [];
    Logger.log("Feminino (17/1150): " + j.length + " jogadoras | com número: " + j.filter(function(p) { return p.number; }).length);
    j.forEach(function(p) { Logger.log("   #" + p.number + " " + p.full_name + " — " + ((p.position && p.position.name) || "?")); });
    const staff = ((q.dados.data || [])[0] || {}).staff_teams;
    Logger.log("Equipa técnica: " + (staff && staff[0] && staff[0].staff ? staff[0].staff.length : "?") + " | chaves de 'data[0]': " + Object.keys((q.dados.data || [])[0] || {}).join(","));
  }
  Logger.log("--- a experimentar outras modalidades (sem equipa) ---");
  for (let c = 1; c <= 40; c++) {
    if (c === 17) continue;
    const x = fcpPlantelGet_(c, "");
    if (!x.dados) { continue; }
    const j2 = (x.dados.squad && x.dados.squad.players) || [];
    const d0 = (x.dados.data || [])[0] || {};
    Logger.log("modalidade " + c + ": " + j2.length + " jogadores" + (j2[0] ? " (ex.: " + j2[0].full_name + ")" : "") + " | equipa(s): " + JSON.stringify(((x.dados.data || []).map(function(d) { return d.id + ":" + (d.name || d.slug || d.alternative_name || ""); })).slice(0, 6)) + " | chaves: " + Object.keys(d0).join(","));
  }
}


// ===================== TESTE 2 DO PLANTEL DO FC PORTO (v119) — só lê e escreve no registo =====================
// A resposta tem "data" = lista de equipas da modalidade (cada uma com o seu "squad"). Procura as jogadoras onde quer que estejam
// e, para cada modalidade, experimenta as equipas "futebol-clube-do-porto…" para descobrir qual é qual.
function fcpAcharJogadores_(o, caminho, out) {
  if (!o || typeof o !== "object") return out;
  if (Array.isArray(o)) {
    if (o.length && o[0] && typeof o[0] === "object" && o[0].full_name) out.push({ caminho: caminho, lista: o });
    else o.forEach(function(x, i) { fcpAcharJogadores_(x, caminho + "[" + i + "]", out); });
    return out;
  }
  Object.keys(o).forEach(function(k) { if (k !== "profile" && k !== "header" && k !== "country") fcpAcharJogadores_(o[k], caminho + "." + k, out); });
  return out;
}
function testarPlantelFcp2Agora() {
  const q = fcpPlantelGet_(17, 1150);
  if (!q.dados) { Logger.log("Feminino: ERRO " + q.erro); return; }
  Logger.log("Feminino — chaves de topo: " + Object.keys(q.dados).join(",") + " | equipas em data: " + (q.dados.data || []).length);
  fcpAcharJogadores_(q.dados, "resposta", []).forEach(function(a) { Logger.log("   lista de jogadores em " + a.caminho + ": " + a.lista.length); });
  const fem = fcpAcharJogadores_(q.dados, "resposta", []);
  if (fem.length) {
    const j = fem.sort(function(a, b) { return b.lista.length - a.lista.length; })[0].lista;
    Logger.log("Feminino: " + j.length + " jogadoras (maior lista)");
    j.forEach(function(p) { Logger.log("   #" + p.number + " " + p.full_name + " — " + ((p.position && p.position.name) || "?")); });
  }
  Logger.log("--- equipas do FC Porto em cada modalidade ---");
  for (let c = 1; c <= 21; c++) {
    if (c === 17) continue;
    const x = fcpPlantelGet_(c, "");
    if (!x.dados) continue;
    (x.dados.data || []).filter(function(d) { return /^futebol-clube-do-porto/.test(d.slug || ""); }).slice(0, 6).forEach(function(d) {
      const y = fcpPlantelGet_(c, d.id);
      if (!y.dados) { Logger.log("classe " + c + " equipa " + d.id + ": ERRO " + y.erro); return; }
      const ach = fcpAcharJogadores_(y.dados, "r", []).sort(function(a, b) { return b.lista.length - a.lista.length; });
      const l = ach.length ? ach[0].lista : [];
      Logger.log("classe " + c + " equipa " + d.id + " [" + (d.alternative_name || d.short_name || "") + "]: " + l.length + " jogadores" + (l.length ? " (ex.: " + l.slice(0, 3).map(function(p) { return "#" + p.number + " " + p.full_name; }).join(", ") + ")" : ""));
    });
  }
}


// ===================== PLANTEL (v120) =====================
// Fonte: API do site do FC Porto (api.app.fcporto.pt/v2/sportClasses/<modalidade>/teamsSquads?team=<equipa>). Só texto:
// jogadores [número, nome, posição] e equipa técnica [nome, cargo]. Cada modalidade fica numa propriedade própria
// (as propriedades do script têm limite de tamanho). Se a API mudar ou falhar, fica o último plantel guardado.
const PLANTEL_FCP_ = {
  "Equipa A":          { classe: 1,  equipa: 1 },    // v150: confirmado em 31/10/2026 (30 jogadores, 1.º = Cláudio Ramos, guarda-redes). A equipa 10 da mesma classe tem staff/outros.
  "Futebol Feminino": { classe: 17, equipa: 1150 },
  "Equipa B":         { classe: 2,  equipa: 100 },
  "Andebol":          { classe: 3,  equipa: 200 },
  "Basquetebol":      { classe: 4,  equipa: 300 },
  "Hóquei Patins":    { classe: 5,  equipa: 400 }, // v132: o nome tem de ser o mesmo que o site usa nos jogos ("Hóquei Patins"); antes estava "Hóquei em Patins" e o plantel nunca aparecia
  "Futsal":           { classe: 21, equipa: 1500 },
  "Voleibol":         { classe: 14, equipa: 250 }
};
function plantelAtualizarSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  if (Date.now() - (Number(props.getProperty("plantelUltimo")) || 0) < 24 * 3600 * 1000) return "ainda cedo";
  return plantelAtualizar_();
}
function plantelAtualizar_() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("plantelUltimo", String(Date.now()));
  const resumo = [];
  Object.keys(PLANTEL_FCP_).forEach(function(nome) {
    const cfg = PLANTEL_FCP_[nome];
    const q = fcpPlantelGet_(cfg.classe, cfg.equipa);
    if (!q.dados) { resumo.push(nome + ": ERRO " + q.erro); return; }
    const d = (q.dados.data || [])[0] || {};
    const lista = (d.squad && d.squad.players) || [];
    if (!lista.length) { resumo.push(nome + ": sem jogadores (mantém o anterior)"); return; }
    // v121: fotografia (endereço da imagem no servidor do clube; só se for mesmo um endereço http — nunca dados embutidos)
    const foto = function(x) { const pr = x && x.profile; if (!pr) return ""; const u = [pr.thumb, pr.url].filter(function(v) { return typeof v === "string" && /^https?:\/\//.test(v); })[0]; return u || ""; };
    const j = lista.map(function(p) { return [p.number === null || p.number === undefined ? "" : String(p.number), String(p.full_name || p.short_name || ""), String((p.position && p.position.name) || ""), foto(p)]; });
    const staff = [];
    (d.staff_teams || []).forEach(function(g) { (g.members || []).forEach(function(m) { staff.push([String(m.full_name || m.short_name || ""), String(m.speciality || ""), foto(m)]); }); });
    props.setProperty("plantelFcp_" + nome, JSON.stringify({ t: Date.now(), j: j, s: staff }));
    resumo.push(nome + ": " + j.length + " jogadores (" + j.filter(function(r) { return r[3]; }).length + " com foto), " + staff.length + " na equipa técnica (" + staff.filter(function(r) { return r[2]; }).length + " com foto) | 1.ª foto: " + ((j.filter(function(r) { return r[3]; })[0] || [])[3] || "nenhuma"));
  });
  return resumo.join(" | ");
}
function plantelParaSite_() {
  const out = {};
  try {
    const props = PropertiesService.getScriptProperties();
    Object.keys(PLANTEL_FCP_).forEach(function(nome) {
      const v = props.getProperty("plantelFcp_" + nome);
      if (v) out[nome] = JSON.parse(v);
    });
  } catch (e) {}
  return out;
}
// TESTE: lê já os plantéis e mostra o resumo
function atualizarPlantelAgora() { Logger.log(plantelAtualizar_()); }


// ===================== TESTE: BASQUETEBOL E COMPETIÇÕES EUROPEIAS NO SOFASCORE (v122) — só lê e escreve no registo =====================
function testeSofaTorneios_(nome, teamId) {
  const vistos = {};
  const jogos = [];
  [["next", 0], ["last", 0], ["last", 1]].forEach(function(k) {
    const q = sofaGet_("team/" + teamId + "/events/" + k[0] + "/" + k[1]);
    ((q.dados && q.dados.events) || []).forEach(function(e) { jogos.push(e); });
  });
  Logger.log(nome + " (equipa " + teamId + "): " + jogos.length + " jogos lidos");
  jogos.slice(0, 3).forEach(function(e) {
    Logger.log("    jogo: " + ((e.homeTeam || {}).name) + " vs " + ((e.awayTeam || {}).name) + " | estado " + ((e.status || {}).type) + " | " + (e.startTimestamp ? Utilities.formatDate(new Date(e.startTimestamp * 1000), "Europe/Lisbon", "yyyy-MM-dd HH:mm") : "?"));
  });
  jogos.forEach(function(e) {
    const t = e.tournament || {}, ut = t.uniqueTournament || {}, se = e.season || {};
    const chave = (ut.id || t.id) + "/" + se.id;
    if (vistos[chave]) return;
    vistos[chave] = 1;
    let r1 = "", r2 = "";
    if (ut.id && se.id) { const a = sofaGet_("unique-tournament/" + ut.id + "/season/" + se.id + "/standings/total"); r1 = a.dados ? ((a.dados.standings || []).length + " tabela(s), 1.ª com " + (((a.dados.standings || [])[0] || {}).rows || []).length + " equipas") : a.erro; }
    if (t.id && se.id) { const b = sofaGet_("tournament/" + t.id + "/season/" + se.id + "/standings/total"); r2 = b.dados ? ((b.dados.standings || []).length + " tabela(s), 1.ª com " + (((b.dados.standings || [])[0] || {}).rows || []).length + " equipas") : b.erro; }
    Logger.log("    competição: " + (ut.name || t.name) + " [" + (t.name || "") + "] | unique " + ut.id + " tournament " + t.id + " época " + se.id + " (" + (se.name || "") + ") | via unique: " + r1 + " | via tournament: " + r2);
  });
}

function testarBasqueEuropaAgora() {
  // 1) Basquetebol: procura a equipa do FC Porto
  Logger.log("=== BASQUETEBOL: candidatas no Sofascore ===");
  const cand = [];
  ["FC Porto basketball", "FC Porto basquetebol", "Porto basket"].forEach(function(termo) {
    const q = sofaGet_("search/all?q=" + encodeURIComponent(termo));
    ((q.dados && q.dados.results) || []).forEach(function(r) {
      const en = r.entity || {};
      if (r.type === "team" && /basket/i.test(((en.sport || {}).slug) || "") && /porto/i.test(en.name || "") && !cand.some(function(c) { return c.id === en.id; })) cand.push({ id: en.id, nome: en.name, pais: ((en.country || {}).name) || "" });
    });
  });
  cand.forEach(function(c) { Logger.log("  candidata: " + c.id + " " + c.nome + " (" + c.pais + ")"); });
  if (cand.length) testeSofaTorneios_("Basquetebol", cand[0].id);
  else Logger.log("  nenhuma equipa de basquetebol com 'Porto' encontrada");
  // 2) Competições de cada modalidade que o Sofascore já acompanha
  Logger.log("=== COMPETIÇÕES (incluindo europeias) ===");
  Object.keys(SOFA_SPORTS_).forEach(function(n) { testeSofaTorneios_(n, SOFA_SPORTS_[n].teamId); });
}


// ===================== CLASSIFICAÇÕES DAS COMPETIÇÕES EUROPEIAS E TAÇAS (v123) =====================
// Para cada modalidade do Sofascore: vê as competições em que o FC Porto tem jogos (últimos 45 dias / próximos 150), ignora os campeonatos
// nacionais (esses já têm a sua fonte) mas inclui a Taça da Liga, e lê a classificação (unique-tournament/<id>/season/<id>/standings/total).
// Guarda só os grupos onde está o FC Porto, no mesmo formato da classificação normal. O site junta-as no separador "Classificação" e
// mostra a tabela certa na página do jogo (reconhece o grupo pelo adversário).
const COMPSTD_PROP_ = "compStandings";

function compStdAtualizarSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  if (Date.now() - (Number(props.getProperty("compStdUltimo")) || 0) < 55 * 60 * 1000) return "ainda cedo";
  return compStdAtualizar_();
}

function compStdAtualizar_() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("compStdUltimo", String(Date.now()));
  const agora = Date.now() / 1000;
  const out = {};
  const log = [];
  Object.keys(SOFA_SPORTS_).forEach(function(nome) {
    const cfg = SOFA_SPORTS_[nome];
    const comps = {};
    [["next", 0], ["last", 0]].forEach(function(k) {
      const q = sofaGet_("team/" + cfg.teamId + "/events/" + k[0] + "/" + k[1]);
      ((q.dados && q.dados.events) || []).forEach(function(e) {
        const t = e.tournament || {}, ut = t.uniqueTournament || {}, se = e.season || {};
        if (!ut.id || !se.id || !e.startTimestamp) return;
        const dias = (e.startTimestamp - agora) / 86400;
        if (dias < -45 || dias > 150) return;
        const pais = (((ut.category || t.category) || {}).name) || "";
        if (/^portugal$/i.test(pais) && !/ta[cç]a da liga/i.test(ut.name || "")) return;
        comps[ut.id + "/" + se.id] = { ut: ut.id, se: se.id, nome: ut.name || t.name || "" };
      });
    });
    const lista = [];
    Object.keys(comps).forEach(function(ch) {
      const c = comps[ch];
      const q = sofaGet_("unique-tournament/" + c.ut + "/season/" + c.se + "/standings/total");
      if (!q.dados) { log.push(nome + " / " + c.nome + ": sem tabela (" + q.erro + ")"); return; }
      (q.dados.standings || []).forEach(function(tb) {
        const rows = tb.rows || [];
        if (!rows.some(function(r) { return sofaEhPorto_(r.team); })) return; // só o grupo do FC Porto
        const semE = (nome === "Voleibol" || nome === "Basquetebol");
        const cols = semE ? ["Pts", "J", "V", "D", "GM", "GS"] : ["Pts", "J", "V", "E", "D", "GM", "GS"];
        lista.push({
          comp: c.nome, fase: String(tb.name || ""), source: "Sofascore", updated: Date.now(), cols: cols,
          zonas: zonasDeLinhas_(rows.map(function(r) { return { position: r.position, promotion: r.promotion }; }), nome), zonasN: rows.length,
          rows: rows.map(function(r) {
            const c2 = semE ? [r.points, r.matches, r.wins, r.losses, r.scoresFor, r.scoresAgainst] : [r.points, r.matches, r.wins, r.draws, r.losses, r.scoresFor, r.scoresAgainst];
            return { p: r.position, t: (r.team && (r.team.name || r.team.shortName)) || "", i: (r.team && r.team.id) || 0, me: sofaEhPorto_(r.team), c: c2.map(function(v) { return v === undefined || v === null ? "" : String(v); }) };
          })
        });
        log.push(nome + " / " + c.nome + " / " + (tb.name || "") + ": " + rows.length + " equipas");
      });
    });
    if (lista.length) out[nome] = lista;
  });
  props.setProperty(COMPSTD_PROP_, JSON.stringify({ t: Date.now(), d: out }));
  return log.join(" | ") || "nenhuma competição com tabela";
}

function compStdParaSite_() {
  try { return (JSON.parse(PropertiesService.getScriptProperties().getProperty(COMPSTD_PROP_) || "{}").d) || {}; } catch (e) { return {}; }
}

// TESTE: lê já e mostra o que guardou
function testarClassificacoesEuropaAgora() {
  Logger.log(compStdAtualizar_().split(" | ").join("\n"));
  const d = compStdParaSite_();
  Object.keys(d).forEach(function(n) { d[n].forEach(function(t) { Logger.log(n + " — " + t.comp + " · " + t.fase + ": " + t.rows.slice(0, 4).map(function(r) { return r.p + "." + r.t + (r.me ? "*" : "") + " " + r.c[0] + "pts"; }).join(", ")); }); });
}

// TESTE 2 do basquetebol: lista TUDO o que a pesquisa devolve para "Porto" (qualquer modalidade), para escolher a equipa certa
function testarBasqueSofaAgora() {
  ["Porto", "FC Porto", "FC Porto Basketball", "Porto Basquetebol", "Liga Betclic"].forEach(function(termo) {
    const q = sofaGet_("search/all?q=" + encodeURIComponent(termo));
    Logger.log("--- pesquisa: " + termo + (q.dados ? "" : " (ERRO " + q.erro + ")") + " ---");
    ((q.dados && q.dados.results) || []).slice(0, 14).forEach(function(r) {
      const en = r.entity || {};
      Logger.log("  " + r.type + " | " + (en.id || "") + " | " + (en.name || "") + " | " + (((en.sport || {}).slug) || ((((en.tournament || {}).category) || {}).sport || {}).slug || "") + " | " + ((((en.country || {}).name)) || (((en.category || {}).name)) || ""));
    });
  });
}


// TESTE: lê os jogos de basquetebol no Sofascore (equipa 208083) e o que a leitura ao vivo devolveria
function testarBasqueSofaJogosAgora() {
  testeSofaTorneios_("Basquetebol", 208083);
  const q = sofaGet_("team/208083/events/next/0");
  const e = ((q.dados && q.dados.events) || [])[0];
  if (e) { const res = sofaResumo_(e, SOFA_SPORTS_["Basquetebol"], Date.now(), null); Logger.log("Próximo jogo: " + ((e.homeTeam || {}).name) + " vs " + ((e.awayTeam || {}).name) + " | leitura: " + JSON.stringify(res)); }
}


// ===================== TESTE SIMULADO DOS AVISOS (v125) =====================
// Faz passar leituras inventadas pelo MESMO código que trata os jogos a sério e envia os avisos resultantes SÓ para os nomes de
// AVISOS_AUTO_NOMES (com "[TESTE]"), mesmo que o modo esteja em "todos". Não mexe no estado dos jogos reais.
// Deves receber: 1 golo do FC Porto, 1 golo do adversário, e o fim do 1.º set (a partir de 2 leituras iguais cada).
function testarAvisosSimuladoAgora() {
  const pend = [];
  const estados = {};
  const agora = Date.now();
  const golos = { id: "SIM-G", sport: "Equipa B", adv: "Equipa Teste", compId: "", local: "casa", noAuto: false };
  [[0, 0], [0, 0], [1, 0], [1, 0], [1, 1], [1, 1]].forEach(function(l) { avisosAutoProcessar_(golos, { estado: "vivo", golosFcp: l[0], golosAdv: l[1] }, estados, pend, agora); });
  const volei = { id: "SIM-S", sport: "Voleibol", adv: "Equipa Teste", compId: "", local: "casa", noAuto: false };
  [[[10, 8]], [[25, 20]], [[25, 20]], [[25, 20], [5, 3]]].forEach(function(sets) { avisosAutoProcessar_(volei, { estado: "vivo", sets: sets }, estados, pend, agora); });
  Logger.log("Simulação: " + pend.length + " aviso(s) gerado(s) (esperado: 3)");
  pend.forEach(function(a) { a.forcarTeste = true; avisosAutoEnviar_(a); });
}


// ===================== ESCUDOS NAS CLASSIFICAÇÕES (v126) =====================
// Acrescenta ao campo "escudos" as chaves "Modalidade|Nome na tabela" → id do Sofascore, para o site desenhar o escudo em cada linha.
//  • Tabelas europeias/taças (Sofascore): cada linha já traz o id da equipa.
//  • Tabelas dos campeonatos (FPA, FPB, FPV…): procura o nome entre as equipas que o Sofascore conhece nessa modalidade e entre os adversários
//    do calendário (que já têm escudo); um nome que não seja reconhecido fica simplesmente sem escudo.
function escudosComTabelas_(all, stds, compStd) {
  const out = escudosParaSite_(all);
  try {
    const guardado = JSON.parse(PropertiesService.getScriptProperties().getProperty(ESCUDOS_PROP_) || "{}");
    const equipas = guardado.equipas || {};
    // europeias: id direto
    Object.keys(compStd || {}).forEach(function(sport) {
      (compStd[sport] || []).forEach(function(tb) { (tb.rows || []).forEach(function(r) { if (r.i && !r.me) out[sport + "|" + r.t] = r.i; }); });
    });
    // campeonatos: por nome
    Object.keys(stds || {}).forEach(function(sport) {
      const s = stds[sport];
      if (!s || !Array.isArray(s.rows)) return;
      const lista = (equipas[sport] || []).slice();
      Object.keys(out).forEach(function(k) { if (k.indexOf(sport + "|") === 0 && k.indexOf("FCP|") !== 0) lista.push([out[k], k.slice(sport.length + 1)]); });
      s.rows.forEach(function(r) {
        const nome = String(r.t || "").trim();
        if (!nome || r.me || out[sport + "|" + nome]) return;
        if (r.i) { out[sport + "|" + nome] = r.i; return; } // v153: tabelas do Sofascore (Equipa A, Futsal) trazem o id
        let achada = null;
        for (let i = 0; i < lista.length && !achada; i++) if (cevNorm_(lista[i][1]) === cevNorm_(nome)) achada = lista[i];
        for (let i = 0; i < lista.length && !achada; i++) if (cevNomesBatem_(nome, lista[i][1])) achada = lista[i];
        for (let i = 0; i < lista.length && !achada; i++) if (escudoQuaseIgual_(nome, lista[i][1])) achada = lista[i];
        if (achada) out[sport + "|" + nome] = achada[0];
      });
    });
    // v130: Hóquei Patins — escudos lidos da própria tabela do hoqueipatins.pt (campo g) e jogos do calendário por nome parecido
    Object.keys(stds || {}).forEach(function(sport) {
      const rows = ((stds[sport] || {}).rows || []).filter(function(r) { return r.g && !r.me; });
      if (!rows.length) return;
      rows.forEach(function(r) { out[sport + "|" + String(r.t || "").trim()] = "hq:" + r.g; });
      all.competitions.forEach(function(c) {
        if (c.mode !== "matches" || c.archived) return;
        ((all.data[c.id] || {}).events || []).forEach(function(ev) {
          if (ev.sport !== sport) return;
          const adv = String(ev.athlete || "").trim(), chave = sport + "|" + adv;
          if (!adv || out[chave]) return;
          let achada = null;
          for (let i = 0; i < rows.length && !achada; i++) if (cevNorm_(rows[i].t) === cevNorm_(adv)) achada = rows[i];
          for (let i = 0; i < rows.length && !achada; i++) if (cevNomesBatem_(adv, rows[i].t)) achada = rows[i];
          for (let i = 0; i < rows.length && !achada; i++) if (escudoQuaseIgual_(adv, rows[i].t)) achada = rows[i];
          if (achada) out[chave] = "hq:" + achada.g;
        });
      });
    });
  } catch (e) {}
  return out;
}

// TESTE: quantas linhas de cada tabela ficam com escudo (e quais ficam sem)
function testarEscudosTabelasAgora() {
  const sheet = getSheet_();
  const all = readAll_(sheet);
  const stds = standingsForSite_(sheet), cs = compStdParaSite_();
  const m = escudosComTabelas_(all, stds, cs);
  Object.keys(stds).forEach(function(sport) {
    const rows = (stds[sport].rows || []).filter(function(r) { return !r.me; });
    const sem = rows.filter(function(r) { return !m[sport + "|" + String(r.t || "").trim()]; }).map(function(r) { return r.t; });
    Logger.log(sport + " (campeonato): " + (rows.length - sem.length) + " de " + rows.length + " com escudo" + (sem.length ? " | sem: " + sem.join(", ") : ""));
  });
  Object.keys(cs).forEach(function(sport) { cs[sport].forEach(function(tb) { Logger.log(sport + " (" + tb.comp + " " + tb.fase + "): " + tb.rows.filter(function(r) { return r.i && !r.me; }).length + " de " + tb.rows.filter(function(r) { return !r.me; }).length + " com escudo"); }); });
}

// ---------- v127: teste de leitura do hoqueipatins.pt (escudos, plantéis, estatísticas) ----------
// Só lê e escreve no registo; não altera nada. Corre testarHoqueiSiteAgora e mostra o registo.
function hqLer_(url) {
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { "User-Agent": "Mozilla/5.0" } });
    return { code: r.getResponseCode(), html: r.getContentText() };
  } catch (e) { return { code: 0, html: "", err: String(e) }; }
}
function hqResumo_(titulo, url) {
  const r = hqLer_(url);
  Logger.log("=== " + titulo + " | " + url + " | HTTP " + r.code + " | " + r.html.length + " caracteres" + (r.err ? " | " + r.err : ""));
  if (r.code !== 200) return r;
  // imagens
  const imgs = [], reImg = /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
  let m; while ((m = reImg.exec(r.html))) imgs.push(m[1]);
  const logos = imgs.filter(function(s) { return /logo|escudo|clube|club|team|equipa|crest|badge/i.test(s); });
  Logger.log("imagens: " + imgs.length + " (com cara de escudo: " + logos.length + ") ex.: " + logos.slice(0, 3).join(" , "));
  // ligações por prefixo de caminho
  const cont = {}, ex = {}, reA = /<a[^>]+href=["']([^"'#]+)["']/gi;
  while ((m = reA.exec(r.html))) {
    let h = m[1].replace(/^https?:\/\/(www\.)?hoqueipatins\.pt/i, "");
    if (h.charAt(0) !== "/") continue;
    const p = "/" + (h.split("/")[1] || "");
    cont[p] = (cont[p] || 0) + 1; if (!ex[p]) ex[p] = h;
  }
  Logger.log("ligações: " + Object.keys(cont).sort().map(function(p) { return p + " ×" + cont[p] + " (" + ex[p] + ")"; }).join(" | ").slice(0, 1500));
  // palavras-chave
  ["marcador", "estatística", "estatistica", "plantel", "jogador", "atleta", "golos"].forEach(function(k) {
    const n = (r.html.toLowerCase().match(new RegExp(k, "g")) || []).length;
    if (n) Logger.log("palavra '" + k + "': " + n + "×");
  });
  return r;
}
function testarHoqueiSiteAgora() {
  const base = "https://www.hoqueipatins.pt";
  const liga = hqResumo_("Liga 1.ª divisão", base + "/liga/1-divisao-regular/");
  hqResumo_("Página inicial", base + "/");
  // primeiro clube e primeiro jogador/atleta encontrados na página da liga
  const links = []; const re = /<a[^>]+href=["']([^"'#]+)["']/gi; let m;
  while ((m = re.exec(liga.html || ""))) links.push(m[1].replace(/^https?:\/\/(www\.)?hoqueipatins\.pt/i, ""));
  const clube = links.filter(function(h) { return /^\/(clube|clubes|equipa|equipas)\//i.test(h); })[0];
  if (clube) hqResumo_("Clube (primeira ligação)", base + clube);
  else Logger.log("Sem ligações de clube na página da liga.");
  ["/marcadores/", "/liga/1-divisao-regular/marcadores/", "/estatisticas/", "/clubes/", "/jogadores/"].forEach(function(p) { hqResumo_("Tentativa " + p, base + p); });
}

// ---------- v128: olhar para dentro de /estatisticas/ do hoqueipatins.pt ----------
function testarHoqueiEstatisticasAgora() {
  const r = hqLer_("https://www.hoqueipatins.pt/estatisticas/");
  const h = r.html;
  Logger.log("HTTP " + r.code + " | " + h.length + " caracteres");
  // iframes e scripts que apontam para outros endereços (onde podem estar os dados)
  const fr = []; let m; const reF = /<iframe[^>]+src=["']([^"']+)["']/gi; while ((m = reF.exec(h))) fr.push(m[1]);
  Logger.log("iframes: " + (fr.join(" , ") || "nenhum"));
  const hosts = {}; const reU = /(?:src|href)=["'](https?:\/\/[^"'\/]+)/gi; while ((m = reU.exec(h))) hosts[m[1]] = (hosts[m[1]] || 0) + 1;
  Logger.log("endereços externos: " + JSON.stringify(hosts).slice(0, 600));
  // padrões dos escudos
  const logos = []; const reL = /["'](https?:\/\/[^"']*\/logos\/[^"']+)["']/gi; while ((m = reL.exec(h))) if (logos.indexOf(m[1]) < 0) logos.push(m[1]);
  Logger.log("escudos distintos: " + logos.length + " | ex.: " + logos.slice(0, 6).join(" , "));
  // títulos e texto à volta de "marcador" e "golos"
  ["marcador", "Marcador", "golos"].forEach(function(k) {
    let i = h.indexOf(k), n = 0;
    while (i >= 0 && n < 2) { Logger.log("«" + k + "» …" + h.substring(Math.max(0, i - 200), i + 300).replace(/\s+/g, " ") + "…"); i = h.indexOf(k, i + 400); n++; }
  });
  // cabeçalhos
  const hs = []; const reH = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi; while ((m = reH.exec(h))) hs.push(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  Logger.log("títulos: " + hs.filter(Boolean).slice(0, 25).join(" | "));
}

// ---------- v129: lista de escudos e estrutura da tabela de goleadores (hoqueipatins.pt) ----------
function testarHoqueiGoleadoresAgora() {
  const h = hqLer_("https://www.hoqueipatins.pt/estatisticas/").html;
  let m;
  const logos = []; const reL = /["'](https?:\/\/[^"']*\/logos\/[^"']+)["']/gi; while ((m = reL.exec(h))) if (logos.indexOf(m[1]) < 0) logos.push(m[1]);
  Logger.log("ESCUDOS (" + logos.length + "): " + logos.map(function(u) { return u.replace(/^.*\/logos\//, ""); }).join(" , "));
  const trs = h.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  Logger.log("linhas de tabela: " + trs.length);
  trs.slice(0, 6).forEach(function(t, i) { Logger.log("TR" + i + ": " + t.replace(/\s+/g, " ").slice(0, 700)); });
  // uma linha com o FC Porto
  const fcp = trs.filter(function(t) { return /fc_porto/i.test(t); }).slice(0, 3);
  fcp.forEach(function(t, i) { Logger.log("FCP" + i + ": " + t.replace(/\s+/g, " ").slice(0, 700)); });
  // a página de bolas paradas (ligada no menu)
  const r2 = hqLer_("https://www.hoqueipatins.pt/melhores-marcadores-de-bola-paradas-em-portugal-placard-2a-e-3a-divisoes/");
  Logger.log("bolas paradas: HTTP " + r2.code + " | " + r2.html.length);
}


// ===================== v131: AVISO QUANDO UMA FONTE DEIXA DE DAR DADOS =====================
// De 6 em 6 horas olha para a "data da última leitura boa" de cada fonte automática. Se alguma
// estiver velha de mais, manda UM email (agrupado) e só repete o mesmo problema passados 3 dias.
// Não mexe em nada: só avisa. Se a fonte voltar, o problema desaparece sozinho.
const ALERTA_FONTES_PROP_ = "alertaFontes";
const ALERTA_FONTES_REPETIR_MS_ = 3 * 86400000;

function fontesProblemas_() {
  const agora = Date.now(), H = 3600000, p = [];
  const props = PropertiesService.getScriptProperties();
  // classificações (Futsal: a edição manual também serve)
  try {
    const st = readStandingsStore_(getSheet_());
    STANDINGS_SOURCES_.forEach(function(src) {
      const a = st.auto[src.sport], m = st.manual[src.sport];
      if (a && a.updated && (agora - a.updated) < 72 * H) return;
      if (src.sport === "Futsal" && m) return;
      const idade = (a && a.updated) ? Math.round((agora - a.updated) / H) + " h" : "nunca lida";
      p.push({ k: "class|" + src.sport, t: "Classificação de " + src.sport + " (" + src.source + "): última leitura boa há " + idade + "." });
    });
  } catch (e) { p.push({ k: "class|erro", t: "Não consegui verificar as classificações: " + e }); }
  // escudos
  try {
    const o = JSON.parse(props.getProperty(ESCUDOS_PROP_) || "{}");
    if (!o.updated || (agora - o.updated) > 36 * H) p.push({ k: "escudos", t: "Escudos dos adversários (Sofascore): última leitura há " + (o.updated ? Math.round((agora - o.updated) / H) + " h" : "— nunca") + "." });
  } catch (e) {}
  // plantel
  Object.keys(PLANTEL_FCP_).forEach(function(nome) {
    try {
      const o = JSON.parse(props.getProperty("plantelFcp_" + nome) || "null");
      if (!o || !o.t || (agora - o.t) > 72 * H) p.push({ k: "plantel|" + nome, t: "Plantel de " + nome + " (site do clube): " + (o && o.t ? "última leitura há " + Math.round((agora - o.t) / H) + " h." : "ainda sem dados.") });
    } catch (e) {}
  });
  // classificações europeias
  try {
    const o = JSON.parse(props.getProperty(COMPSTD_PROP_) || "null");
    if (!o || !o.t || (agora - o.t) > 6 * H) p.push({ k: "europa", t: "Classificações europeias (Sofascore): última leitura há " + (o && o.t ? Math.round((agora - o.t) / H) + " h." : "— nunca.") });
  } catch (e) {}
  // forma dos adversários (só se houver entradas)
  try {
    const f = JSON.parse(props.getProperty(FORMAS_PROP_) || "{}");
    const ts = Object.keys(f).map(function(k) { return f[k].t || 0; });
    if (ts.length && (agora - Math.max.apply(null, ts)) > 24 * H) p.push({ k: "formas", t: "Forma dos adversários (Sofascore): última leitura há " + Math.round((agora - Math.max.apply(null, ts)) / H) + " h." });
  } catch (e) {}
  return p;
}

function verificarSaudeFontesSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  if (Date.now() - (Number(props.getProperty("fontesVerificadoUltimo")) || 0) < 6 * 3600000) return "ainda cedo";
  return verificarSaudeFontesCore_(false);
}

function verificarSaudeFontesCore_(forcarEnvio) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  props.setProperty("fontesVerificadoUltimo", String(agora));
  const lista = fontesProblemas_();
  let enviados; try { enviados = JSON.parse(props.getProperty(ALERTA_FONTES_PROP_) || "{}"); } catch (e) { enviados = {}; }
  const chavesAtuais = {};
  lista.forEach(function(x) { chavesAtuais[x.k] = 1; });
  Object.keys(enviados).forEach(function(k) { if (!chavesAtuais[k]) delete enviados[k]; }); // resolvido: esquece
  const novos = lista.filter(function(x) { return forcarEnvio || !enviados[x.k] || (agora - enviados[x.k]) > ALERTA_FONTES_REPETIR_MS_; });
  if (!novos.length) { props.setProperty(ALERTA_FONTES_PROP_, JSON.stringify(enviados)); return lista.length ? "problemas já avisados: " + lista.length : "tudo em ordem"; }
  novos.forEach(function(x) { enviados[x.k] = agora; });
  props.setProperty(ALERTA_FONTES_PROP_, JSON.stringify(enviados)); // grava antes de enviar
  const para = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
  const corpo = "Há fontes de dados do Dragão Stats que deixaram de atualizar:\n\n• " + novos.map(function(x) { return x.t; }).join("\n• ") + "\n\n" +
    "O que fazer:\n• Nada é obrigatório: o site continua a funcionar e mostra o último valor bom (ou esconde o bloco).\n" +
    "• Para ver qual falha e porquê, corre no Apps Script a função da fonte (atualizarClassificacoesAgora, testarEscudosAgora, atualizarPlantelAgora, testarClassificacoesEuropaAgora, testarFormasAgora) e lê o registo.\n" +
    "• Se uma fonte mudou o HTML, só essa modalidade pára; basta avisar para ajustar.\n\n" +
    "Este aviso repete-se no máximo de 3 em 3 dias enquanto o problema durar.";
  GmailApp.sendEmail(para, "Dragão Stats — " + novos.length + " fonte(s) sem dados", corpo);
  return "email enviado: " + novos.length + " problema(s)";
}

// TESTE: mostra os problemas atuais no registo (e envia o email de verdade, ignorando os 3 dias)
function testarSaudeFontesAgora() {
  Logger.log("Problemas agora: " + (fontesProblemas_().map(function(x) { return "\n - " + x.t; }).join("") || "nenhum"));
  Logger.log(verificarSaudeFontesCore_(true));
}

// ===================== v131: USO ANÓNIMO =====================
// O site manda, em lote, só contagens por nome de ação (ex.: reel_gerado: 3). Nada de nomes, aparelhos
// ou endereços. Guarda por dia (props "uso_AAAA-MM-DD") durante 60 dias. Resumo: usoResumoAgora.
function usoDia_(d) { return Utilities.formatDate(d || new Date(), "Europe/Lisbon", "yyyy-MM-dd"); }

function usoRegistar_(obj) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { return; } // se estiver ocupado, perde-se este lote (não é crítico)
  try {
    const props = PropertiesService.getScriptProperties();
    const chave = "uso_" + usoDia_();
    let dia; try { dia = JSON.parse(props.getProperty(chave) || "{}"); } catch (e) { dia = {}; }
    let novos = 0;
    Object.keys(obj).slice(0, 25).forEach(function(nome) {
      if (!/^[a-z0-9_]{1,30}$/.test(nome)) return;
      const n = Math.max(0, Math.min(50, Math.floor(Number(obj[nome]) || 0)));
      if (!n) return;
      if (dia[nome] === undefined) { if (Object.keys(dia).length >= 40) return; novos++; }
      dia[nome] = (dia[nome] || 0) + n;
    });
    props.setProperty(chave, JSON.stringify(dia));
    // limpeza ocasional
    if (novos) {
      const limite = usoDia_(new Date(Date.now() - 60 * 86400000));
      const todas = props.getKeys();
      todas.forEach(function(k) { if (k.indexOf("uso_") === 0 && k.substring(4) < limite) props.deleteProperty(k); });
    }
  } finally { lock.releaseLock(); }
}

function usoSomar_(dias) {
  const props = PropertiesService.getScriptProperties();
  const tot = {};
  for (let i = 0; i < dias; i++) {
    const v = props.getProperty("uso_" + usoDia_(new Date(Date.now() - i * 86400000)));
    if (!v) continue;
    try { const o = JSON.parse(v); Object.keys(o).forEach(function(k) { tot[k] = (tot[k] || 0) + o[k]; }); } catch (e) {}
  }
  return tot;
}

const USO_ROTULOS_ = {
  sessao: "Visitas (aberturas do site)", jogo_aberto: "Jogos abertos", pesquisa: "Pesquisas", jogador_aberto: "Fichas de jogador abertas",
  plantel_aberto: "Plantel aberto", classificacao_aberta: "Classificação aberta (separador)", classificacao_inicio: "Classificação aberta (Início)",
  marcadores_aberto: "Marcadores aberto", reel_gerado: "Reel da semana gerado", lembrar_me: "Lembrar-me", instalar_clique: "Instalar app (cliques)",
  notif_convite_sim: "Convite de avisos aceite", favorita: "Modalidade favorita escolhida", hoje_chip: "Toques em \"Hoje joga\"", subscrever_calendario: "Subscrever calendário (cliques)"
};

function usoTexto_(dias) {
  const tot = usoSomar_(dias);
  const ks = Object.keys(tot).sort(function(a, b) { return tot[b] - tot[a]; });
  if (!ks.length) return "Ainda sem dados de uso nos últimos " + dias + " dias.";
  return ks.map(function(k) { return "• " + (USO_ROTULOS_[k] || k) + ": " + tot[k]; }).join("\n");
}

// TESTE / consulta: o que os adeptos abriram (últimos 7 e 30 dias)
function usoResumoAgora() {
  Logger.log("ÚLTIMOS 7 DIAS\n" + usoTexto_(7));
  Logger.log("ÚLTIMOS 30 DIAS\n" + usoTexto_(30));
}

// Às segundas, 1 email com o resumo da semana anterior
function usoResumoSemanalSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  const hoje = usoDia_();
  if (Utilities.formatDate(new Date(), "Europe/Lisbon", "u") !== "1") return "não é segunda";
  if (props.getProperty("usoResumoUltimo") === hoje) return "já enviado";
  const hora = Number(Utilities.formatDate(new Date(), "Europe/Lisbon", "H"));
  if (hora < 9) return "ainda cedo";
  props.setProperty("usoResumoUltimo", hoje);
  const para = usoResumoDestinos_();
  GmailApp.sendEmail(para, "Dragão Stats — resumo da semana", usoResumoCorpo_());
  return "email enviado";
}

// v133: o email de segunda passa a ter também os jogos dos próximos 7 dias. Destinatários: o dono do script
// + os emails extra da propriedade RESUMO_EMAILS_EXTRA (separados por vírgula; ex.: o email do teu irmão).
function usoResumoDestinos_() {
  const base = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
  const extra = String(PropertiesService.getScriptProperties().getProperty("RESUMO_EMAILS_EXTRA") || "").split(",").map(function(x) { return x.trim(); }).filter(function(x) { return x && x.indexOf("@") > 0; });
  const todos = [base];
  extra.forEach(function(x) { if (todos.indexOf(x) < 0) todos.push(x); });
  return todos.join(",");
}

function usoResumoCorpo_() {
  return "Os jogos da próxima semana:\n\n" + jogosSemanaTexto_(7) + "\n\n—\nO que os adeptos abriram nos últimos 7 dias (contagens anónimas):\n\n" + usoTexto_(7) +
    "\n\nPara ver mais tempo: corre usoResumoAgora no Apps Script.";
}

function jogosSemanaTexto_(dias) {
  const SEM = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  const fim = Utilities.formatDate(new Date(Date.now() + dias * 86400000), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  const lista = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (!ev || !ev.day || ev.day < hoje || ev.day >= fim) return;
      const st = ((all.data[c.id] || {}).status || {})[ev.id] || {};
      if (st.resultado && String(st.resultado).trim()) return;
      lista.push(ev);
    });
  });
  if (!lista.length) return "Sem jogos marcados nos próximos " + dias + " dias.";
  lista.sort(function(a, b) { return (a.day + (a.t || "")).localeCompare(b.day + (b.t || "")); });
  return lista.map(function(ev) {
    const d = new Date(ev.day + "T12:00:00");
    const dd = ev.day.split("-");
    const quem = ev.local === "fora" ? (ev.athlete + " vs FC Porto") : ("FC Porto vs " + ev.athlete);
    return "• " + SEM[d.getDay()] + " " + dd[2] + "/" + dd[1] + (ev.t ? " " + ev.t : "") + " — " + ev.sport + ": " + quem + (ev.detail ? " (" + ev.detail + ")" : "");
  }).join("\n");
}

// TESTE: mostra o corpo do email semanal sem o enviar
function testarResumoSemanalAgora() {
  Logger.log("PARA: " + usoResumoDestinos_() + "\n\n" + usoResumoCorpo_());
}

// TESTE: simula 1 lote do site e mostra o resultado
function testarUsoAgora() {
  usoRegistar_({ sessao: 1, teste_uso: 2 });
  Logger.log(usoTexto_(1));
}


// ===================== v132: BACKUP DIÁRIO =====================
// O backup semanal (v82) deixava até 7 dias de resultados sem cópia. Este corre sozinho no gatilho de
// 1 minuto, UMA vez por dia depois das 04:00 (hora de Lisboa, quando não há jogos), e guarda uma cópia da Sheet na
// mesma pasta "Dragão Stats — Backups" com o nome "Backup diário AAAA-MM-DD". Mantém as últimas 14;
// as mais antigas vão para o lixo do Drive (que ainda guarda 30 dias). O semanal continua como está.
// Se falhar, manda UM email por dia. Não precisa de gatilho novo.
const BACKUP_DIARIO_PREFIX_ = "Backup diário ";
const BACKUP_DIARIO_MANTER_ = 14;

function backupDiarioSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  const agora = new Date();
  const hoje = Utilities.formatDate(agora, "Europe/Lisbon", "yyyy-MM-dd");
  if (props.getProperty("backupDiarioUltimo") === hoje) return "já feito hoje";
  if (Number(Utilities.formatDate(agora, "Europe/Lisbon", "H")) < 4) return "ainda cedo";
  if (props.getProperty("backupDiarioTentativa") === hoje) return "já tentado hoje";
  props.setProperty("backupDiarioTentativa", hoje); // grava antes: se falhar, só volta a tentar amanhã
  try {
    const r = backupDiarioFazer_(hoje);
    props.setProperty("backupDiarioUltimo", hoje);
    return r;
  } catch (e) {
    const para = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
    GmailApp.sendEmail(para, "Dragão Stats — o backup diário falhou",
      "Não consegui fazer a cópia diária da Sheet (" + hoje + ").\n\nErro: " + e +
      "\n\nO site continua a funcionar. Corre testarBackupDiarioAgora no Apps Script para ver o erro e, se for permissão, autoriza quando o Google pedir.");
    return "falhou: " + e;
  }
}

function backupDiarioFazer_(hoje) {
  const folder = getBackupFolder_();
  const nome = BACKUP_DIARIO_PREFIX_ + hoje;
  const existentes = folder.getFilesByName(nome);
  if (!existentes.hasNext()) DriveApp.getFileById(SHEET_ID).makeCopy(nome, folder);
  // fica só com as últimas N cópias diárias (por nome, que ordena por data)
  const nomes = [];
  const it = folder.getFiles();
  while (it.hasNext()) { const f = it.next(); if (f.getName().indexOf(BACKUP_DIARIO_PREFIX_) === 0) nomes.push({ n: f.getName(), f: f }); }
  nomes.sort(function(a, b) { return a.n < b.n ? 1 : (a.n > b.n ? -1 : 0); });
  let lixo = 0;
  nomes.slice(BACKUP_DIARIO_MANTER_).forEach(function(x) { x.f.setTrashed(true); lixo++; });
  return "cópia \"" + nome + "\" feita; cópias diárias guardadas: " + Math.min(nomes.length, BACKUP_DIARIO_MANTER_) + "; para o lixo: " + lixo;
}

// TESTE: faz a cópia de hoje já (ignora a hora) e mostra o resultado
function testarBackupDiarioAgora() {
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  Logger.log(backupDiarioFazer_(hoje));
  PropertiesService.getScriptProperties().setProperty("backupDiarioUltimo", hoje);
  Logger.log("Procura na pasta \"" + BACKUP_FOLDER_NAME + "\" do teu Drive.");
}


// ===================== v134: AVISO ANTES DO JOGO + RESUMO MENSAL =====================
// 1) Entre 90 e 20 minutos antes de um jogo de hoje (Futebol Feminino, Andebol, Voleibol, Equipa B), se o Sofascore não o encontra
//    e o jogo não tem "ID do jogo ao vivo" escrito à mão, manda UM email com o que fazer. Se o próprio Sofascore não responder
//    (lista vazia), não avisa — evita alarmes falsos. Estado na prop alertaPreLigacao (só guarda os de hoje).
const ALERTA_PRE_DESPORTOS_ = ["Equipa A", "Futebol Feminino", "Andebol", "Voleibol", "Equipa B"];

function verificarLigacaoAntes_() {
  try { return verificarLigacaoAntesCore_(false); }
  catch (e) { Logger.log("verificarLigacaoAntes_ — erro: " + e); }
}

function verificarLigacaoAntesCore_(forcar) {
  const props = PropertiesService.getScriptProperties();
  const agora = Date.now();
  const ultimo = Number(props.getProperty("alertaPreUltimo")) || 0;
  if (!forcar && agora - ultimo < 5 * 60 * 1000) return "ainda cedo";
  props.setProperty("alertaPreUltimo", String(agora));
  const hoje = Utilities.formatDate(new Date(agora), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  let enviados; try { enviados = JSON.parse(props.getProperty("alertaPreLigacao") || "{}"); } catch (e) { enviados = {}; }
  Object.keys(enviados).forEach(function(k) { if (k.indexOf(hoje) !== 0) delete enviados[k]; });
  const listas = {};
  const sem = [];
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    const d = all.data[c.id] || {};
    (d.events || []).forEach(function(ev) {
      if (ev.day !== hoje || !ev.t || ALERTA_PRE_DESPORTOS_.indexOf(ev.sport) < 0 || !SOFA_SPORTS_[ev.sport]) return;
      const st = (d.status || {})[ev.id] || {};
      if (st.resultado && String(st.resultado).trim()) return;
      if (String(ev.liveId || "").replace(/\D/g, "")) return; // já tem ID à mão
      const ini = Utilities.parseDate(hoje + " " + ev.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
      if (!forcar && (agora < ini - 90 * 60000 || agora > ini - 20 * 60000)) return;
      if (forcar && agora > ini) return;
      const chave = hoje + "|" + ev.id;
      if (enviados[chave] && !forcar) return;
      const cfg = SOFA_SPORTS_[ev.sport];
      const it = { id: ev.id, t: ev.t, adv: ev.athlete || "", sport: ev.sport };
      let achado = null;
      try { achado = sofaDescobrir_(it, cfg, hoje, listas); } catch (err) { return; }
      if (!(listas[cfg.slug] || []).length) return; // o Sofascore não respondeu: não é o jogo que falta
      if (achado) return;
      enviados[chave] = agora;
      sem.push(ev);
    });
  });
  props.setProperty("alertaPreLigacao", JSON.stringify(enviados));
  if (!sem.length) return "todos os jogos de hoje estão ligados (ou fora da janela)";
  const para = Session.getEffectiveUser().getEmail() || NEWSLETTER_FROM;
  sem.forEach(function(ev) {
    const jogo = ev.sport + " — " + (ev.local === "fora" ? ev.athlete + " vs FC Porto" : "FC Porto vs " + ev.athlete) + " às " + ev.t;
    GmailApp.sendEmail(para, "Dragão Stats — sem ao vivo à vista: " + jogo,
      "Ainda não encontrei este jogo no Sofascore:\n" + jogo + "\n\n" +
      "Se quiseres o acompanhamento ao vivo:\n" +
      "1. Procura o jogo no Sofascore (site ou app) e copia o endereço — termina em #id:NNNNNNN.\n" +
      "2. No editor do site, abre este jogo e escreve esse endereço (ou só o número) em \"ID do jogo ao vivo\".\n" +
      "3. Guarda e, se quiseres confirmar, corre testarAoVivoSofascoreAgora no Apps Script.\n\n" +
      "Se o Sofascore não tiver o jogo, não há nada a fazer: o site mostra-o normalmente e o resultado escreve-se à mão.");
  });
  return "avisos enviados: " + sem.length;
}

// TESTE: corre a verificação já, para todos os jogos de hoje por começar, e mostra o resultado (pode enviar email)
function testarLigacaoAntesAgora() {
  Logger.log(verificarLigacaoAntesCore_(true));
}

// 2) Resumo do mês: dia 1 de cada mês, depois das 09:00 (hora de Lisboa). Vai para os mesmos destinatários do resumo semanal
//    (o dono do script + RESUMO_EMAILS_EXTRA). Conta os resultados com marcação V/E/D do mês anterior, por modalidade.
function resumoMensalSeDevido_() {
  const props = PropertiesService.getScriptProperties();
  const agora = new Date();
  if (Utilities.formatDate(agora, "Europe/Lisbon", "d") !== "1") return "não é dia 1";
  if (Number(Utilities.formatDate(agora, "Europe/Lisbon", "H")) < 9) return "ainda cedo";
  const chave = Utilities.formatDate(agora, "Europe/Lisbon", "yyyy-MM");
  if (props.getProperty("resumoMensalUltimo") === chave) return "já enviado";
  props.setProperty("resumoMensalUltimo", chave); // grava antes de enviar
  GmailApp.sendEmail(usoResumoDestinos_(), "Dragão Stats — resumo do mês", resumoMensalCorpo_());
  return "email enviado";
}

function resumoMensalCorpo_() {
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const ontem = new Date(Date.now() - 86400000); // dia 1 → último dia do mês anterior
  const mes = Utilities.formatDate(ontem, "Europe/Lisbon", "yyyy-MM");
  const nome = MESES[Number(mes.slice(5, 7)) - 1] + " de " + mes.slice(0, 4);
  const all = readAll_(getSheet_());
  const por = {};
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches") return;
    const d = all.data[c.id] || {};
    (d.events || []).forEach(function(ev) {
      if (!ev.day || ev.day.slice(0, 7) !== mes) return;
      const st = (d.status || {})[ev.id] || {};
      if (!(st.resultado && String(st.resultado).trim())) return;
      const o = por[ev.sport] = por[ev.sport] || { j: 0, w: 0, e: 0, l: 0 };
      o.j++;
      const tag = getMatchResultTag_(ev, st);
      if (tag === "win") o.w++; else if (tag === "draw") o.e++; else if (tag === "loss") o.l++;
    });
  });
  const ks = Object.keys(por).sort(function(a, b) { return por[b].j - por[a].j; });
  const jogos = ks.length ? ks.map(function(k) { const o = por[k]; return "• " + k + ": " + o.j + " jogo" + (o.j === 1 ? "" : "s") + " — " + o.w + " V, " + o.e + " E, " + o.l + " D"; }).join("\n") : "Sem jogos com resultado registado.";
  return "Resumo de " + nome + "\n\nJogos com resultado:\n" + jogos + "\n(V/E/D só conta jogos com a marcação ✅/🟰/❌ feita no site.)\n\n—\nO que os adeptos abriram nos últimos 30 dias (contagens anónimas):\n\n" + usoTexto_(30);
}

// TESTE: mostra o resumo do mês anterior sem o enviar
function testarResumoMensalAgora() {
  Logger.log("PARA: " + usoResumoDestinos_() + "\n\n" + resumoMensalCorpo_());
}


// ===================== INSPEÇÃO DAS CLASSIFICAÇÕES (v135) =====================
// SÓ LÊ E ESCREVE NO REGISTO — não muda nada no site nem na folha.
// Corre `inspecionarClassificacoesAgora` à mão e manda-me o Registo: mostra, para cada fonte, se há sinais de
// "zonas" (apuramento, descida, lugares europeus): legendas, palavras-chave, classes/cores das linhas e, no
// Sofascore/FPA, os campos de cada linha.
function inspecionarClassificacoesAgora() {
  STANDINGS_SOURCES_.forEach(function(src) {
    Logger.log("==================== " + src.sport + " ====================");
    try {
      const urlI = src.urlFn ? src.urlFn() : src.url;
      if (!urlI) { Logger.log("sem endereço (não encontrei o campeonato)"); return; }
      const r = UrlFetchApp.fetch(urlI, { muteHttpExceptions: true, followRedirects: true, headers: src.headers || {} });
      const code = r.getResponseCode();
      const txt = r.getContentText();
      Logger.log("HTTP " + code + " · " + txt.length + " caracteres");
      if (code !== 200) return;
      if (txt.charAt(0) === "{") insp_sofascore_(txt);
      else insp_html_(src.sport, txt);
    } catch (e) { Logger.log("erro: " + e); }
  });
  Logger.log("=== fim === (manda-me este Registo)");
}

function insp_sofascore_(txt) {
  const d = JSON.parse(txt);
  const g = (d.standings || [])[0] || {};
  Logger.log("campos do grupo: " + Object.keys(g).join(", "));
  const rows = g.rows || [];
  if (rows[0]) Logger.log("campos da 1.ª linha: " + Object.keys(rows[0]).join(", "));
  const vistos = {};
  rows.forEach(function(l) {
    const p = l.promotion;
    const chave = p ? (p.text || "") + " (id " + (p.id || "?") + ")" : "(sem zona)";
    vistos[chave] = (vistos[chave] || []).concat(l.position);
  });
  Object.keys(vistos).forEach(function(k) { Logger.log("zona «" + k + "»: posições " + vistos[k].join(",")); });
}

function insp_html_(sport, html) {
  // 1) campos de uma linha do JSON embutido (FPA)
  const ir = html.indexOf('"id":"ranking"');
  if (ir >= 0) {
    const jr = html.indexOf('"rows":[{', ir);
    if (jr >= 0) {
      const amostra = html.substring(jr + 7, jr + 1500);
      const chaves = (amostra.match(/"([A-Z_a-z]+)":/g) || []).map(function(s) { return s.replace(/[":]/g, ""); });
      Logger.log("campos da 1.ª linha (JSON embutido): " + Array.from(new Set(chaves)).join(", "));
    }
    const jl = html.indexOf('"legend', ir);
    if (jl >= 0) Logger.log("«legend» no JSON: " + html.substring(jl, jl + 300).replace(/\s+/g, " "));
  }
  // 2) palavras-chave de zonas, com um bocadinho de contexto
  const re = /(legenda|legend|descida|despromo|relega|play-?off|apura|champions|liga dos campe|liga europa|conference|europa|qualifica|promo[cç]|zona|promo|manuten)/ig;
  const vistos = {};
  let m, n = 0;
  while ((m = re.exec(html)) && n < 8) {
    const k = m[1].toLowerCase();
    if (vistos[k]) continue;
    vistos[k] = 1; n++;
    const a = Math.max(0, m.index - 70), b = Math.min(html.length, m.index + 90);
    Logger.log("palavra «" + k + "»: …" + html.substring(a, b).replace(/\s+/g, " ").replace(/</g, "‹") + "…");
  }
  if (!n) Logger.log("nenhuma palavra-chave de zonas encontrada");
  // 3) classes e cores nas linhas da tabela
  const classes = {}, cores = {};
  (html.match(/<tr[^>]*>/ig) || []).forEach(function(t) {
    const c = (t.match(/class=["']([^"']*)["']/i) || [])[1];
    if (c) classes[c] = (classes[c] || 0) + 1;
    const s = (t.match(/style=["']([^"']*)["']/i) || [])[1];
    if (s && /(background|border|color)/i.test(s)) cores[s] = (cores[s] || 0) + 1;
  });
  (html.match(/<td[^>]*>/ig) || []).forEach(function(t) {
    const s = (t.match(/style=["']([^"']*)["']/i) || [])[1];
    if (s && /(background|border-left|border-bottom)/i.test(s)) cores[s] = (cores[s] || 0) + 1;
  });
  const top = function(o) { return Object.keys(o).sort(function(a, b) { return o[b] - o[a]; }).slice(0, 10).map(function(k) { return "«" + k + "» ×" + o[k]; }).join(" | "); };
  Logger.log("classes das linhas <tr>: " + (top(classes) || "(nenhuma)"));
  Logger.log("estilos com cor: " + (top(cores) || "(nenhum)"));
}


// ===================== INSPEÇÃO DAS ZONAS NO SOFASCORE (v136) =====================
// SÓ LÊ E ESCREVE NO REGISTO. Para cada modalidade, procura os campeonatos da equipa do FC Porto no Sofascore
// (incluindo os de Portugal) e mostra, de cada tabela, as zonas marcadas por posição (apuramento, descida, europa…).
// Também mostra o que a página da Federação de Voleibol tem como "legenda".
function inspecionarZonasSofascoreAgora() {
  const agora = Date.now() / 1000;
  Object.keys(SOFA_SPORTS_).forEach(function(nome) {
    const cfg = SOFA_SPORTS_[nome];
    Logger.log("==================== " + nome + " (equipa " + cfg.teamId + ") ====================");
    try {
      const comps = {};
      [["next", 0], ["last", 0], ["last", 1]].forEach(function(k) {
        const q = sofaGet_("team/" + cfg.teamId + "/events/" + k[0] + "/" + k[1]);
        if (!q.dados) { Logger.log("  eventos " + k[0] + "/" + k[1] + ": " + q.erro); return; }
        (q.dados.events || []).forEach(function(e) {
          const t = e.tournament || {}, ut = t.uniqueTournament || {}, se = e.season || {};
          if (!ut.id || !se.id) return;
          comps[ut.id + "/" + se.id] = { ut: ut.id, se: se.id, nome: ut.name || t.name || "", pais: (((ut.category || t.category) || {}).name) || "" };
        });
      });
      const chaves = Object.keys(comps);
      if (!chaves.length) { Logger.log("  nenhuma competição encontrada"); return; }
      chaves.forEach(function(ch) {
        const c = comps[ch];
        const q = sofaGet_("unique-tournament/" + c.ut + "/season/" + c.se + "/standings/total");
        if (!q.dados) { Logger.log("  • " + c.nome + " [" + c.pais + "]: sem tabela (" + q.erro + ")"); return; }
        (q.dados.standings || []).forEach(function(tb) {
          const rows = tb.rows || [];
          const porPromo = {};
          rows.forEach(function(r) {
            const p = r.promotion;
            const k = p ? (p.text || "?") : "(sem zona)";
            porPromo[k] = (porPromo[k] || []).concat(r.position);
          });
          const resumo = Object.keys(porPromo).map(function(k) { return "«" + k + "»: " + porPromo[k].join(","); }).join(" | ");
          Logger.log("  • " + c.nome + " [" + c.pais + "] · " + (tb.name || "") + " · " + rows.length + " equipas → " + resumo);
        });
      });
    } catch (e) { Logger.log("  erro: " + e); }
  });
  // voleibol (FPV): a página tem estilos de legenda — existirá o elemento?
  try {
    const src = STANDINGS_SOURCES_.filter(function(s) { return s.sport === "Voleibol"; })[0];
    const html = UrlFetchApp.fetch(src.url, { muteHttpExceptions: true, followRedirects: true }).getContentText();
    Logger.log("==================== Voleibol (FPV) — legenda na página ====================");
    const re = /class=["'][^"']*tbl-legend[^"']*["'][^>]*>/ig;
    let m, n = 0;
    while ((m = re.exec(html)) && n < 3) {
      n++;
      Logger.log("elemento: " + html.substring(m.index, m.index + 600).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    }
    if (!n) Logger.log("nenhum elemento «tbl-legend» no HTML (só o estilo)");
  } catch (e2) { Logger.log("FPV erro: " + e2); }
  Logger.log("=== fim === (manda-me este Registo)");
}


// ===================== v139: TESTE DE FONTES DE NOTÍCIAS (só lê e escreve no Registo; não muda nada no site) =====================
// Correr "testarNoticiasAgora" no Apps Script e abrir Ver > Registos. Mostra que fontes respondem e que notícias trazem.
function noticiasTitulos_(xml, max) {
  const out = [];
  const itens = xml.split(/<item[\s>]|<entry[\s>]/i).slice(1);
  itens.slice(0, max || 5).forEach(function(it) {
    const m = it.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const src = it.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const d = it.match(/<pubDate>([\s\S]*?)<\/pubDate>|<updated>([\s\S]*?)<\/updated>/i);
    let t = m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim() : "(sem título)";
    out.push("   - " + t.substring(0, 110) + (src ? "  [" + src[1].replace(/<[^>]+>/g, "").trim() + "]" : "") + (d ? "  (" + (d[1] || d[2]).trim().substring(0, 25) + ")" : ""));
  });
  return { n: itens.length, linhas: out };
}

function noticiasBuscar_(url) {
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)", "Accept": "application/rss+xml, application/xml, application/json, text/html;q=0.8, */*;q=0.5" } });
    return { code: r.getResponseCode(), tipo: String((r.getHeaders() || {})["Content-Type"] || (r.getHeaders() || {})["content-type"] || ""), txt: r.getContentText() || "" };
  } catch (e) { return { code: 0, tipo: "", txt: "", erro: String(e).substring(0, 120) }; }
}

function testarNoticiasAgora() {
  const L = function(s) { Logger.log(s); };
  L("=== 1) GOOGLE NEWS (agrega todos os jornais; por modalidade) ===");
  ["andebol", "basquetebol", "voleibol", "hóquei em patins", "futebol feminino", "futsal", "equipa B"].forEach(function(mod) {
    const q = encodeURIComponent('"FC Porto" ' + mod);
    const r = noticiasBuscar_("https://news.google.com/rss/search?q=" + q + "+when:7d&hl=pt-PT&gl=PT&ceid=PT:pt-150");
    const t = noticiasTitulos_(r.txt, 5);
    L("[" + mod + "] HTTP " + r.code + " · " + t.n + " notícias nos últimos 7 dias" + (r.erro ? " · ERRO " + r.erro : ""));
    t.linhas.forEach(L);
  });

  L("\n=== 2) FEEDS RSS DIRETOS (tentativas) ===");
  [
    "https://www.ojogo.pt/rss", "https://www.ojogo.pt/rss/", "https://www.abola.pt/rss", "https://www.record.pt/rss",
    "https://maisfutebol.iol.pt/rss", "https://www.fcporto.pt/rss", "https://www.fcporto.pt/feed", "https://www.fcporto.pt/pt/rss",
    "https://superportistas.pt/feed/", "https://www.fpa.pt/feed/", "https://www.fpb.pt/feed/", "https://www.portugalvoleibol.com/feed/"
  ].forEach(function(u) {
    const r = noticiasBuscar_(u);
    const eRss = /<rss|<feed|<channel/i.test(r.txt);
    const t = eRss ? noticiasTitulos_(r.txt, 3) : { n: 0, linhas: [] };
    L(u + " → HTTP " + r.code + (eRss ? " · RSS OK, " + t.n + " itens" : " · não é feed") + (r.erro ? " · " + r.erro : ""));
    t.linhas.forEach(L);
  });

  L("\n=== 3) PÁGINAS INICIAIS: procurar o endereço do feed (link rel=alternate) ===");
  [
    "https://www.ojogo.pt/", "https://www.abola.pt/", "https://www.record.pt/", "https://www.fcporto.pt/pt/noticias", "https://www.fpa.pt/", "https://www.fpb.pt/",
    "https://www.portugalvoleibol.com/", "https://www.hoqueipatins.pt/"
  ].forEach(function(u) {
    const r = noticiasBuscar_(u);
    const feeds = (r.txt.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*>/gi) || []).map(function(x) { const h = x.match(/href=["']([^"']+)["']/i); return h ? h[1] : ""; }).filter(String);
    L(u + " → HTTP " + r.code + " · " + (feeds.length ? "feeds: " + feeds.slice(0, 3).join(" | ") : "sem feed anunciado") + (r.erro ? " · " + r.erro : ""));
  });

  L("\n=== 4) API DA APP DO CLUBE (a mesma dos plantéis): tem notícias? ===");
  [
    "https://api.app.fcporto.pt/v2/news", "https://api.app.fcporto.pt/v2/articles", "https://api.app.fcporto.pt/v2/posts",
    "https://api.app.fcporto.pt/v2/news?sportClass=3", "https://api.app.fcporto.pt/v2/sportClasses/3/news", "https://api.app.fcporto.pt/v2/sportClasses"
  ].forEach(function(u) {
    const r = noticiasBuscar_(u);
    L(u + " → HTTP " + r.code + " · " + r.tipo.substring(0, 30) + " · " + r.txt.length + " bytes · " + r.txt.substring(0, 140).replace(/\s+/g, " "));
  });
  L("\nFIM. Copia tudo o que está no Registo e envia-me.");
}



// ===================== v141: NOTÍCIAS DAS MODALIDADES (lê a própria notícia para perceber de que modalidade é) =====================
// 1) Google News (uma pesquisa por modalidade) dá os candidatos: título, fonte, data, ligação.
// 2) Para cada candidato novo: descobre o endereço real da notícia, lê a página (título, descrição, endereço, início do texto, imagem)
//    e pontua as 7 modalidades. Só entra se uma modalidade se destacar com clareza; futebol masculino e notícias de outros clubes ficam de fora.
// 3) No site só vai título, fonte, data, ligação e imagem. Nada do texto é copiado.
const NOTICIAS_CONSULTAS_ = [
  { sport: "Andebol", q: '"FC Porto" andebol' },
  { sport: "Basquetebol", q: '"FC Porto" basquetebol' },
  { sport: "Voleibol", q: '"FC Porto" voleibol' },
  { sport: "Hóquei Patins", q: '"FC Porto" hóquei em patins' },
  { sport: "Futebol Feminino", q: '"FC Porto" futebol feminino' },
  { sport: "Futsal", q: '"FC Porto" futsal' },
  { sport: "Equipa B", q: '"FC Porto" "equipa B"' }
];
// palavras de cada modalidade e o peso de cada uma (3 = prova forte)
const NOTICIAS_KW_ = {
  "Andebol": [["andebol", 3], ["andebolista", 3], ["andebolistas", 3], ["ehf", 2], ["fpa", 1]],
  "Basquetebol": [["basquetebol", 3], ["basquete", 3], ["triplos", 2], ["triplo", 1], ["liga betclic", 1], ["fpb", 1], ["cesto", 1]],
  "Voleibol": [["voleibol", 3], ["volei", 3], ["liga solverde", 3], ["cev", 2], ["libero", 2]],
  "Hóquei Patins": [["hoquei em patins", 3], ["hoquei", 3], ["patins", 2], ["liga placard", 3], ["elite cup", 3], ["placard", 1]],
  "Futebol Feminino": [["futebol feminino", 3], ["liga bpi", 3], ["taca feminina", 3], ["taca de portugal feminina", 3], ["taca da liga feminina", 3], ["equipa feminina", 1], ["futebolistas", 1], ["feminino", 1], ["feminina", 1]],
  "Futsal": [["futsal", 3]],
  "Equipa B": [["equipa b", 3], ["fc porto b", 3], ["porto b", 2], ["liga meu super", 3], ["liga 2", 2], ["sub 23", 1]]
};
// sinais de futebol masculino da equipa principal: fora
const NOTICIAS_EXCLUIR_TIT_ = /^(ficha de jogo|plantel|resumo|fotografias|campeonato nacional)\b/;
const NOTICIAS_EXCLUIR_ = /\b(futebol nacional|farioli|equipa principal|liga portugal betclic|smalling|duran|evanilson)\b/;
const NOTICIAS_EXCLUIR_TACAS_ = /\b(liga europa|europa league|taca de portugal|taca da liga)\b/; // só vale se o título não for do futebol feminino
const NOTICIAS_MAX_POR_MODALIDADE_ = 14;
const NOTICIAS_DIAS_OFICIAL_ = 14; // v147: fonte oficial guarda 14 dias (o site mostra só os mais recentes nas listas; as notícias do jogo usam as mais antigas)
const NOTICIAS_EVERY_MINUTES_ = 15;
const NOTICIAS_DIAS_ = 3;
const NOTICIAS_VERSAO_ = "4";
const NOTICIAS_GOOGLE_ON_ = false; // v144: só a fonte oficial (API do FC Porto). Pôr true para voltar a juntar o Google News.

function noticiasChave_(sport) { return "noticias_" + sport.replace(/[^A-Za-z]/g, ""); }
function noticiasLer_(sport) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(noticiasChave_(sport)) || "[]"); } catch (e) { return []; }
}
function noticiasGravar_(sport, lista) {
  let l = lista.slice();
  let txt = JSON.stringify(l);
  while (txt.length > 8500 && l.length > 2) { l.pop(); txt = JSON.stringify(l); } // cabe sempre em 9 KB: tira as mais antigas
  PropertiesService.getScriptProperties().setProperty(noticiasChave_(sport), txt);
}
function noticiasOcultasLer_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty("noticiasOcultas") || "[]"); } catch (e) { return []; }
}
function noticiasVistosLer_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty("noticiasVistos") || "{}"); } catch (e) { return {}; }
}
function noticiasLimparTudo() {
  const props = PropertiesService.getScriptProperties();
  NOTICIAS_CONSULTAS_.forEach(function(c) { props.deleteProperty(noticiasChave_(c.sport)); });
  props.deleteProperty("noticiasVistos");
  props.setProperty("noticiasUltimo", NOTICIAS_GOOGLE_ON_ ? String(Date.now()) : "0"); // (Google ligado:) não deixa o gatilho de 5 min correr em paralelo e sobrepor os resultados
  props.setProperty("noticiasVersao", NOTICIAS_VERSAO_);
  Logger.log("Notícias apagadas; voltam a ser calculadas na próxima execução.");
}

function noticiasSeDevido_() {
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty("noticiasVersao") !== NOTICIAS_VERSAO_) noticiasLimparTudo(); // versão nova das regras: recomeça limpo
    const ultimo = Number(props.getProperty("noticiasUltimo") || 0);
    if (Date.now() - ultimo < NOTICIAS_EVERY_MINUTES_ * 60 * 1000) return;
    props.setProperty("noticiasUltimo", String(Date.now()));
    noticiasAtualizar_(false);
  } catch (e) { Logger.log("noticiasSeDevido_: " + e); }
}

function noticiasNorm_(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function noticiasDesescapar_(x) {
  return String(x || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function noticiasId_(txt) {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(txt), Utilities.Charset.UTF_8);
  return b.map(function(x) { return ("0" + (x & 0xff).toString(16)).slice(-2); }).join("").substring(0, 10);
}

// pontos de cada modalidade para um texto (já normalizado)
function noticiasPontos_(texto) {
  const out = {};
  Object.keys(NOTICIAS_KW_).forEach(function(sp) {
    let p = 0;
    NOTICIAS_KW_[sp].forEach(function(k) { if (new RegExp("(^| )" + k[0] + "( |$)").test(texto)) p += k[1]; });
    out[sp] = p;
  });
  return out;
}

// há alguma palavra de peso 3 da modalidade no texto?
function noticiasPontosFortes_(texto, sp) {
  return NOTICIAS_KW_[sp].some(function(k) { return k[1] >= 3 && new RegExp("(^| )" + k[0] + "( |$)").test(texto); });
}

// Decide a modalidade. n = { t: título, u: endereço, desc, corpo, fonte }. Devolve { sp: "Andebol"|"" , motivo }.
function noticiasClassificar_(n) {
  const tit = noticiasNorm_(n.t), ur = noticiasNorm_(n.u || ""), de = noticiasNorm_(n.desc || ""), co = noticiasNorm_(n.corpo || "");
  const oficial = /^fc porto$/i.test(String(n.fonte || "").trim());
  const fem = /feminin/.test(tit);
  if (NOTICIAS_EXCLUIR_.test(tit) || NOTICIAS_EXCLUIR_.test(ur) || (!fem && (NOTICIAS_EXCLUIR_TACAS_.test(tit) || NOTICIAS_EXCLUIR_TACAS_.test(ur)))) return { sp: "", motivo: "futebol masculino / outras competições" };
  if (NOTICIAS_EXCLUIR_TIT_.test(tit)) return { sp: "", motivo: "não é uma notícia (ficha/plantel/resumo)" };
  // o FC Porto tem de estar no TÍTULO (a descrição/texto citam o Porto em resumos de outros clubes); a fonte oficial dispensa
  if (!oficial && !/(^| )(fc porto|porto b|dragoes|portista|portistas)( |$)/.test(tit)) return { sp: "", motivo: "o FC Porto não está no título" };
  const amb = /(champions|liga dos campeoes|champions league) feminina/g; // ambíguo: voleibol ou futebol
  const limpa = function(t) { return t.replace(amb, " "); };
  const pT = noticiasPontos_(limpa(tit)), pU = noticiasPontos_(ur), pD = noticiasPontos_(limpa(de)), pC = noticiasPontos_(limpa(co));
  const tot = {};
  Object.keys(NOTICIAS_KW_).forEach(function(sp) { tot[sp] = pT[sp] + pU[sp] + pD[sp] + Math.min(2, pC[sp] * 0.5); });
  const ord = Object.keys(tot).sort(function(a, b) { return tot[b] - tot[a]; });
  const melhor = ord[0], seg = ord[1];
  if (tot[melhor] < 3) return { sp: "", motivo: "sem sinal claro de modalidade (" + tot[melhor] + ")" };
  const forte = noticiasPontosFortes_(limpa(tit) + " " + ur + " " + limpa(de) + " " + limpa(co.substring(0, 700)), melhor);
  if (!forte) return { sp: "", motivo: "sem palavra clara de " + melhor + " (só pistas fracas)" };
  const gap = tot[melhor] - tot[seg];
  if (gap < (tot[seg] >= 2 ? 4 : 1)) return { sp: "", motivo: "dúvida entre " + melhor + " e " + seg };
  return { sp: melhor, motivo: melhor + " (" + tot[melhor] + " vs " + tot[seg] + ")" };
}

// parecido com outra notícia já guardada (mesma história em jornais diferentes)?
function noticiasParecida_(titulo, lista) {
  const pal = function(t) { return noticiasNorm_(t).split(" ").filter(function(w) { return w.length > 3; }); };
  const a = pal(titulo);
  if (!a.length) return false;
  return lista.some(function(n) {
    const b = pal(n.t);
    const comuns = a.filter(function(w) { return b.indexOf(w) >= 0; }).length;
    return comuns / Math.max(1, Math.min(a.length, b.length)) >= 0.7;
  });
}

// ---- endereço real e página
function noticiasResolverGoogle_(link) {
  try {
    const m = link.match(/news\.google\.com\/(?:rss\/)?articles\/([^?\/]+)/);
    if (!m) return link;
    const b64 = m[1];
    try { // formato antigo: o endereço vem dentro do próprio código
      const txt = Utilities.newBlob(Utilities.base64DecodeWebSafe(b64)).getDataAsString("ISO-8859-1");
      const u = txt.match(/https?:\/\/[A-Za-z0-9\-._~:\/?#\[\]@!$&'()*+,;=%]+/);
      if (u && u[0].indexOf("news.google.com") < 0) return u[0];
    } catch (e1) {}
    const pg = UrlFetchApp.fetch("https://news.google.com/rss/articles/" + b64 + "?hl=pt-PT&gl=PT&ceid=PT:pt-150", { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } }).getContentText();
    const sg = pg.match(/data-n-a-sg="([^"]+)"/), ts = pg.match(/data-n-a-ts="([^"]+)"/);
    if (!sg || !ts) return "";
    const inner = '["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"' + b64 + '",' + ts[1] + ',"' + sg[1] + '"]';
    const body = "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]]));
    const rr = UrlFetchApp.fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", { method: "post", muteHttpExceptions: true, contentType: "application/x-www-form-urlencoded;charset=UTF-8", payload: body, headers: { "User-Agent": "Mozilla/5.0" } }).getContentText();
    const u2 = rr.match(/garturlres\\",\\"(https?:[^"\\]+)/);
    return u2 ? u2[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&") : "";
  } catch (e) { return ""; }
}

function noticiasPagina_(url) {
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)", "Accept": "text/html", "Accept-Language": "pt-PT,pt;q=0.9" } });
    if (r.getResponseCode() !== 200) return null;
    const html = r.getContentText().substring(0, 250000);
    const meta = function(prop) {
      const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*content=["\']([^"\']*)["\']', "i")) || html.match(new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + prop + '["\']', "i"));
      return m ? noticiasDesescapar_(m[1]) : "";
    };
    let corpo = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/gi, " ");
    const art = corpo.match(/<article[\s\S]*?<\/article>/i);
    if (art) corpo = art[0];
    corpo = noticiasDesescapar_(corpo).substring(0, 3000);
    let img = meta("og:image");
    if (img.indexOf("//") === 0) img = "https:" + img;
    if (!/^https:\/\//i.test(img)) img = "";
    return { desc: meta("og:description") || meta("description"), kw: meta("keywords"), img: img.substring(0, 400), corpo: corpo, titulo: meta("og:title") };
  } catch (e) { return null; }
}

// Lê o RSS do Google News e devolve os candidatos (ainda sem classificar)
function noticiasCandidatos_() {
  const limiteMs = Date.now() - (NOTICIAS_GOOGLE_ON_ ? NOTICIAS_DIAS_ : NOTICIAS_DIAS_OFICIAL_) * 86400000;
  const porId = {};
  NOTICIAS_CONSULTAS_.forEach(function(c) {
    try {
      const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(c.q) + "+when:7d&hl=pt-PT&gl=PT&ceid=PT:pt-150";
      const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)" } });
      if (r.getResponseCode() !== 200) return;
      r.getContentText().split(/<item[\s>]/i).slice(1).forEach(function(it) {
        const get = function(tag) { const m = it.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i")); return m ? noticiasDesescapar_(m[1]) : ""; };
        let titulo = get("title"), fonte = get("source"), link = get("link"), guid = get("guid"), data = Date.parse(get("pubDate"));
        if (!titulo || !link || isNaN(data) || data < limiteMs) return;
        if (fonte && titulo.slice(-(fonte.length + 3)) === " - " + fonte) titulo = titulo.slice(0, -(fonte.length + 3));
        titulo = titulo.replace(/^Notícias\s*-\s*/i, "").trim();
        const id = noticiasId_(guid || link);
        if (!porId[id]) porId[id] = { id: id, t: titulo.substring(0, 150), f: fonte.substring(0, 30), g: link, d: data };
      });
    } catch (e) { Logger.log("noticiasCandidatos_ " + c.sport + ": " + e); }
  });
  return Object.keys(porId).map(function(k) { return porId[k]; }).sort(function(a, b) { return b.d - a.d; });
}

// Processa candidatos novos (os mais recentes primeiro) dentro de um tempo máximo; o resto fica para a execução seguinte.
function noticiasAtualizar_(verbose) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(verbose ? 60000 : 2000)) return "ocupado (outra execução de notícias a decorrer)";
  try { return noticiasAtualizarLocked_(verbose); } finally { try { lock.releaseLock(); } catch (e) {} }
}
function noticiasAtualizarLocked_(verbose) {
  const t0 = Date.now(), tempoMs = verbose ? 150000 : 50000;
  const props = PropertiesService.getScriptProperties();
  const vistos = noticiasVistosLer_();
  const cands = !NOTICIAS_GOOGLE_ON_ ? [] : noticiasCandidatos_().filter(function(c) { return vistos[c.id] !== 1; });
  const limiteMs = Date.now() - NOTICIAS_DIAS_ * 86400000;
  const porSport = {};
  NOTICIAS_CONSULTAS_.forEach(function(c) { porSport[c.sport] = noticiasLer_(c.sport); });
  let aceites = 0, rejeitadas = 0, feitas = 0, falhasSeguidas = 0;
  const linhas = [];
  for (let i = 0; i < cands.length; i++) {
    if (Date.now() - t0 > tempoMs) break;
    const c = cands[i];
    let real = "";
    if (falhasSeguidas < 6) { real = noticiasResolverGoogle_(c.g); falhasSeguidas = real ? 0 : falhasSeguidas + 1; } // Google a limitar? depois de 6 falhas seguidas deixa de insistir nesta execução
    const pag = real ? noticiasPagina_(real) : null;
    const res = noticiasClassificar_({ t: c.t, u: real || "", desc: pag ? (pag.desc + " " + pag.kw) : "", corpo: pag ? pag.corpo : "", fonte: c.f, pagina: !!pag });
    if (!pag && !res.sp) { // sem página e só o título não chega: tenta de novo nas próximas execuções (máx. 3 vezes)
      const n = (vistos[c.id] < 0 ? -vistos[c.id] : 0) + 1;
      if (n < 3) { vistos[c.id] = -n; feitas++; if (verbose) linhas.push("adiada (" + (real ? "página não abriu" : "endereço real não obtido") + ", tentativa " + n + ") | " + c.t.substring(0, 80) + " [" + c.f + "]"); continue; }
    }
    vistos[c.id] = 1; feitas++;
    Utilities.sleep(250);
    if (res.sp) {
      const lista = porSport[res.sp] || [];
      if (noticiasParecida_(c.t, lista)) { rejeitadas++; if (verbose) linhas.push("fica de fora: repetida (mesma história de outro jornal) | " + c.t.substring(0, 80) + " [" + c.f + "]"); continue; }
      lista.push({ id: c.id, t: c.t, f: c.f, u: (real || c.g), d: c.d, i: pag ? pag.img : "" });
      porSport[res.sp] = lista; aceites++;
    } else rejeitadas++;
    if (verbose) linhas.push((res.sp ? "ENTRA em " : "fica de fora: ") + res.motivo + (real ? "" : " [sem endereço real]") + (pag ? "" : " [sem página]") + " | " + c.t.substring(0, 80) + " [" + c.f + "]");
  }
  let oficiais = "";
  try { oficiais = " · oficial: " + noticiasOficiais_(porSport, verbose, linhas); } catch (e) { oficiais = " · oficial: ERRO " + String(e).substring(0, 100); }
  NOTICIAS_CONSULTAS_.forEach(function(c) {
    const lista = (porSport[c.sport] || []).filter(function(n) { return n.d >= limiteMs; }).sort(function(a, b) { return b.d - a.d; }).slice(0, NOTICIAS_MAX_POR_MODALIDADE_);
    noticiasGravar_(c.sport, lista);
  });
  // lembra só os ids mais recentes (cabe numa propriedade)
  const ids = Object.keys(vistos);
  if (ids.length > 450) { const novo = {}; ids.slice(-400).forEach(function(k) { novo[k] = 1; }); props.setProperty("noticiasVistos", JSON.stringify(novo)); }
  else props.setProperty("noticiasVistos", JSON.stringify(vistos));
  const resumo = "Analisadas " + feitas + " (" + aceites + " entram, " + rejeitadas + " ficam de fora); por analisar: " + Math.max(0, cands.length - feitas) + oficiais;
  if (verbose) { linhas.forEach(function(l) { Logger.log(l); }); }
  return resumo;
}

function noticiasParaSite_() {
  try {
    const ocultas = {};
    noticiasOcultasLer_().forEach(function(id) { ocultas[id] = 1; });
    const out = {};
    NOTICIAS_CONSULTAS_.forEach(function(c) {
      const l = noticiasLer_(c.sport).filter(function(n) { return !ocultas[n.id]; }).map(function(n) { return { id: n.id, t: n.t, f: n.f, u: n.u, d: n.d, i: n.i || "", g: n.g || [] }; });
      if (l.length) out[c.sport] = l;
    });
    return out;
  } catch (e) { return {}; }
}

function noticiaOcultar_(o) {
  const id = String((o && o.id) || "").replace(/[^a-f0-9]/g, "").substring(0, 12);
  if (!id) return false;
  const props = PropertiesService.getScriptProperties();
  let l = noticiasOcultasLer_().filter(function(x) { return x !== id; });
  if (o.on !== false) l.unshift(id);
  props.setProperty("noticiasOcultas", JSON.stringify(l.slice(0, 200)));
  return true;
}

// TESTE: corre já (até 2,5 min), mostra no Registo o que entra, o que fica de fora e porquê. Antes limpa tudo para recomeçar.
function noticiasAtualizarAgora() {
  if (NOTICIAS_GOOGLE_ON_ || PropertiesService.getScriptProperties().getProperty("noticiasVersao") !== NOTICIAS_VERSAO_) noticiasLimparTudo();
  Logger.log(noticiasAtualizar_(true));
  NOTICIAS_CONSULTAS_.forEach(function(c) {
    const l = noticiasLer_(c.sport);
    Logger.log("[" + c.sport + "] " + l.length + " notícias, " + l.filter(function(x) { return x.i; }).length + " com imagem");
    l.slice(0, 4).forEach(function(x) { Logger.log("   - " + x.t.substring(0, 80) + " [" + x.f + "] → " + x.u.substring(0, 90)); });
  });
}


// ===================== v142: TESTE da fonte oficial de notícias (só lê; não altera nada) =====================
// Procura onde o site/app do FC Porto guarda as notícias de todas as modalidades e mostra o formato.
// Corre UMA vez e envia o Registo completo.
function testarNoticiasFcpAgora() {
  const L = function(s) { Logger.log(s); };
  const H = { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)", "Accept": "application/json, text/html;q=0.8, */*;q=0.5" };
  const get = function(u) {
    try { const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true, headers: H }); return { code: r.getResponseCode(), txt: r.getContentText() || "" }; }
    catch (e) { return { code: 0, txt: "", erro: String(e).substring(0, 100) }; }
  };
  const forma = function(o, nivel) { // descreve as chaves e um exemplo de cada valor
    if (o === null || typeof o !== "object") return JSON.stringify(o).substring(0, 70);
    if (Array.isArray(o)) return "[" + o.length + " itens] " + (o.length && nivel < 3 ? forma(o[0], nivel + 1) : "");
    return "{" + Object.keys(o).slice(0, 25).map(function(k) { return k + ":" + (nivel < 3 ? forma(o[k], nivel + 1) : "…"); }).join(", ") + "}";
  };
  L("=== 1) API DA APP: endereços possíveis ===");
  const base = "https://api.app.fcporto.pt/v2/";
  const cands = ["news", "news?limit=20", "articles", "posts", "contents", "content", "noticias", "feed", "home", "highlights", "sportClasses", "sportClasses/3/news", "sportClasses/3/articles", "sportClasses/3/contents", "news?sportClass=3", "news?sport=3"];
  cands.forEach(function(c) {
    const r = get(base + c);
    let d = "";
    if (r.code === 200) { try { d = forma(JSON.parse(r.txt), 0).substring(0, 700); } catch (e) { d = "(não é JSON) " + r.txt.substring(0, 100).replace(/\s+/g, " "); } }
    L(c + " → HTTP " + r.code + (r.erro ? " " + r.erro : "") + (d ? "\n    " + d : ""));
  });

  L("\n=== 2) PÁGINA DE NOTÍCIAS DO SITE ===");
  ["https://www.fcporto.pt/pt/noticias", "https://www.fcporto.pt/pt/modalidades", "https://www.fcporto.pt/pt/andebol/noticias"].forEach(function(u) {
    const r = get(u), t = r.txt;
    L(u + " → HTTP " + r.code + " · " + t.length + " bytes");
    if (r.code !== 200) return;
    const apis = (t.match(/https?:\/\/[a-z0-9.-]*fcporto\.pt\/[a-zA-Z0-9_\/.\-?=&%]*(api|v2|news|noticia)[a-zA-Z0-9_\/.\-?=&%]*/gi) || []).filter(function(x, i, a) { return a.indexOf(x) === i; }).slice(0, 15);
    L("  endereços com api/v2/news: " + (apis.join(" | ") || "nenhum"));
    L("  __NEXT_DATA__: " + (/__NEXT_DATA__/.test(t) ? "sim" : "não") + " · __NUXT: " + (/__NUXT/.test(t) ? "sim" : "não") + " · JSON-LD: " + (/ld\+json/.test(t) ? "sim" : "não"));
    const links = (t.match(/href=["'](\/pt\/[^"']*noticia[^"']*)["']/gi) || []).slice(0, 8);
    L("  ligações de notícias (amostra): " + (links.join(" ") || "nenhuma"));
    L("  texto: " + t.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 300));
  });
  L("\nFIM. Copia tudo o que está no Registo e envia-me.");
}


// ===================== v143: 2.º TESTE da fonte oficial (só lê): fotos, modalidade e ligação de cada notícia =====================
function testarNoticiasFcp2Agora() {
  const L = function(s) { Logger.log(s); };
  const H = { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)", "Accept": "application/json" };
  const get = function(u) {
    try { const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true, headers: H }); return { code: r.getResponseCode(), txt: r.getContentText() || "" }; }
    catch (e) { return { code: 0, txt: "", erro: String(e).substring(0, 100) }; }
  };
  const base = "https://api.app.fcporto.pt/v2/news";
  const r = get(base + "?limit=30");
  L("HTTP " + r.code + " · " + r.txt.length + " bytes");
  let lista = [];
  try { lista = JSON.parse(r.txt).data || []; } catch (e) { L("não é JSON"); return; }

  L("\n=== A) ITEM COMPLETO (1.º e 2.º), sem o texto longo ===");
  [0, 1].forEach(function(i) {
    if (!lista[i]) return;
    const c = JSON.parse(JSON.stringify(lista[i]));
    if (c.message) c.message = String(c.message).substring(0, 150) + "…";
    (c.items || []).forEach(function(it) { Object.keys(it).forEach(function(k) { if (typeof it[k] === "string" && it[k].length > 150) it[k] = it[k].substring(0, 150) + "…"; }); });
    L(JSON.stringify(c).substring(0, 3500));
  });

  L("\n=== B) 30 NOTÍCIAS: data · título · tags · imagem ===");
  lista.forEach(function(n) {
    const tags = (n.tags || []).map(function(t) { return typeof t === "object" ? (t.name || t.title || t.slug || t.id) + (t.sportClass ? "#" + t.sportClass : "") : t; }).join(",");
    const cv = n.cover || {};
    L(n.id + " · " + n.date + " · " + String(n.title).substring(0, 55) + " · tags[" + tags.substring(0, 140) + "] · img " + (cv.thumb || cv.url || cv.image || "—").toString().substring(0, 90));
  });

  L("\n=== C) FILTROS POR MODALIDADE: o 1.º id e as tags mudam? ===");
  ["sportClass=14", "sportClass=4", "sportClass=3", "sportClass=5", "sportClass=17", "sportClass=2", "sportClass=21", "sportClasses=14", "sportClassId=14", "tag=14", "page=2"].forEach(function(q) {
    const x = get(base + "?limit=5&" + q);
    let d = "";
    try { d = (JSON.parse(x.txt).data || []).map(function(n) { return n.id; }).join(","); } catch (e) { d = "?"; }
    L(q + " → HTTP " + x.code + " · ids " + d);
  });
  L("\nFIM. Copia tudo o que está no Registo e envia-me.");
}


// ===================== v144: NOTÍCIAS OFICIAIS (API do FC Porto, todas as modalidades, com foto) =====================
// A modalidade vem das etiquetas (tags) de cada notícia. Só entra o que tem etiqueta de uma das 7 modalidades.
const NOTICIAS_FCP_API_ = "https://api.app.fcporto.pt/v2/news";
const NOTICIAS_FCP_PAG_ = "https://www.fcporto.pt/pt/noticias";
function noticiasSlug_(t) { return noticiasNorm_(t).replace(/ /g, "-"); }
function noticiasSportDasTags_(tags) {
  const x = (tags || []).map(function(t) { return String(typeof t === "object" ? (t.name || t.title || t.slug || "") : t).toLowerCase(); });
  const tem = function(re) { return x.some(function(t) { return re.test(t); }); };
  if (tem(/andebol/)) return "Andebol";
  if (tem(/basquet/)) return "Basquetebol";
  if (tem(/voleibol|volei/)) return "Voleibol";
  if (tem(/hoquei/)) return "Hóquei Patins";
  if (tem(/futsal/)) return "Futsal";
  if (tem(/^fcportob$/)) return "Equipa B";
  if (tem(/^fcportow$/)) return "Futebol Feminino";
  return "";
}
// v146: a API aceita ?tags=<etiqueta>&limit=20 (testado). Uma chamada por etiqueta de modalidade + a lista geral.
const NOTICIAS_FCP_TAGS_ = ["andebol", "basquetebol", "voleibol", "hoqueiempatins", "futsal", "fcportob", "fcportow"];
function noticiasFcpPagina_(tag) {
  const r = UrlFetchApp.fetch(NOTICIAS_FCP_API_ + "?limit=20" + (tag ? "&tags=" + encodeURIComponent(tag) : ""), { muteHttpExceptions: true, headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)" } });
  if (r.getResponseCode() !== 200) return [];
  try { return JSON.parse(r.getContentText()).data || []; } catch (e) { return []; }
}
function noticiasOficiais_(porSport, verbose, linhas) {
  let todas = noticiasFcpPagina_("");
  if (!todas.length) return "API sem resposta";
  const vistosIds = {}; todas.forEach(function(n) { vistosIds[n.id] = 1; });
  const porTag = [];
  NOTICIAS_FCP_TAGS_.forEach(function(t) {
    let l = [];
    try { l = noticiasFcpPagina_(t); } catch (e) {}
    porTag.push(t + " " + l.length);
    l.forEach(function(n) { if (!vistosIds[n.id]) { vistosIds[n.id] = 1; todas.push(n); } });
  });
  if (verbose) linhas.push("por etiqueta: " + porTag.join(" · "));
  // ligações reais das notícias (a página do site lista-as com o endereço certo)
  const slugs = [];
  try {
    const h = UrlFetchApp.fetch(NOTICIAS_FCP_PAG_, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)" } }).getContentText() || "";
    const re = /\/pt\/noticias\/(\d{8}-pt-([a-z0-9-]+))/g; let m;
    while ((m = re.exec(h))) if (slugs.every(function(q) { return q.full !== m[1]; })) slugs.push({ full: m[1], slug: m[2] });
  } catch (e) {}
  const agora = Date.now();
  let novas = 0, semModalidade = 0, comFoto = 0;
  todas.forEach(function(n) {
    const sp = noticiasSportDasTags_(n.tags);
    const vis = n.visibility || {};
    if (!sp) { semModalidade++; return; }
    if (String(vis.website) === "0" && String(vis.mobile) === "0") return;
    let d = 0;
    try { d = Utilities.parseDate(String(n.date), "Europe/Lisbon", "yyyy-MM-dd HH:mm:ss").getTime(); } catch (e) { return; }
    if (d > agora + 10 * 60000) return; // agendada para o futuro
    const sl = noticiasSlug_(n.title);
    let enc = null;
    for (let i = 0; i < slugs.length && !enc; i++) if (slugs[i].slug === sl || slugs[i].slug.indexOf(sl) === 0 || sl.indexOf(slugs[i].slug) === 0) enc = slugs[i];
    const ddmm = String(n.date).substring(0, 10).replace(/-/g, "");
    const url = "https://www.fcporto.pt/pt/noticias/" + (enc ? enc.full : ddmm + "-pt-" + sl);
    const cv = n.cover || {};
    const img = cv.thumb || cv.url || cv.image || "";
    if (img) comFoto++;
    const id = noticiasId_("fcp" + n.id);
    const lista = (porSport[sp] || []).filter(function(x) { return x.id !== id; });
    const gt = (n.tags || []).map(function(t) { return String(typeof t === "object" ? (t.name || t.slug || "") : t).toLowerCase(); })
      .filter(function(t) { return t && !/^(fcporto|fcportob|fcportow|\d{4}(\/\d{4})?|estadiododragao)$/.test(t); }).slice(0, 6);
    lista.push({ id: id, t: noticiasDesescapar_(n.title), f: "FC Porto", u: url, d: d, i: img, g: gt });
    porSport[sp] = lista; novas++;
    if (verbose) linhas.push("OFICIAL → " + sp + " | " + String(n.title).substring(0, 70) + (enc ? "" : " [endereço deduzido]") + (img ? "" : " [sem foto]"));
  });
  return todas.length + " lidas, " + novas + " das modalidades (" + comFoto + " com foto), " + semModalidade + " sem modalidade (futebol, etc.)";
}


// ===================== v145: 3.º TESTE (só lê): como ir buscar mais de 20 notícias / filtrar por modalidade =====================
function testarNoticiasFcp3Agora() {
  const L = function(s) { Logger.log(s); };
  const H = { "User-Agent": "Mozilla/5.0 (compatible; DragaoStatsBot/1.0)", "Accept": "application/json, text/html;q=0.8" };
  const get = function(u) {
    try { const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true, headers: H }); return { code: r.getResponseCode(), txt: r.getContentText() || "" }; }
    catch (e) { return { code: 0, txt: "", erro: String(e).substring(0, 80) }; }
  };
  const base = "https://api.app.fcporto.pt/v2/news";
  const ids = function(txt) { try { return (JSON.parse(txt).data || []).map(function(n) { return { id: n.id, d: String(n.date).substring(0, 10), tags: (n.tags || []).join(",") }; }); } catch (e) { return null; } };
  const ref = ids(get(base).txt) || [];
  L("referência (sem parâmetros): " + ref.length + " itens · de " + (ref.length ? ref[0].id + " (" + ref[0].d + ") a " + ref[ref.length - 1].id + " (" + ref[ref.length - 1].d + ")" : "?"));
  const primeiro = ref.length ? ref[0].id : "";
  L("\n=== A) PARÂMETROS DE PÁGINA / TAMANHO (mostra quantos itens e o intervalo de ids) ===");
  ["limit=100", "limit=50", "per_page=50", "perPage=50", "size=50", "count=50", "num=50", "pageSize=50", "take=50", "max=50",
   "page=2", "p=2", "pagina=2", "offset=20", "skip=20", "start=20", "from=20", "page=2&limit=20", "offset=20&limit=20",
   "before=28250", "beforeId=28250", "lastId=28250", "last_id=28250", "maxId=28250", "max_id=28250", "id_lt=28250", "olderThan=28250", "after=28200", "since=2026-10-25", "from_date=2026-10-25", "date=2026-10-25", "dateTo=2026-10-25"
  ].forEach(function(q) {
    const r = get(base + "?" + q), l = ids(r.txt);
    L(q + " → HTTP " + r.code + (l ? " · " + l.length + " itens · " + (l.length ? l[0].id + " (" + l[0].d + ") … " + l[l.length - 1].id + " (" + l[l.length - 1].d + ")" + (l[0].id !== primeiro ? "  ◄ DIFERENTE" : "") : "") : ""));
  });
  L("\n=== B) FILTRO POR MODALIDADE (etiqueta) ===");
  ["tag=andebol", "tags=andebol", "tag[]=andebol", "tags[]=andebol", "q=andebol", "search=andebol", "query=andebol", "keyword=andebol", "sport=andebol", "modality=andebol", "category=andebol", "tag=voleibol", "tag=futsal"].forEach(function(q) {
    const r = get(base + "?" + q), l = ids(r.txt);
    const com = l ? l.filter(function(x) { return x.tags.indexOf(q.split("=")[1]) >= 0; }).length : 0;
    L(q + " → HTTP " + r.code + (l ? " · " + l.length + " itens · com a etiqueta: " + com + (l.length && l[0].id !== primeiro ? "  ◄ DIFERENTE" : "") : ""));
  });
  L("\n=== C) CAMINHOS ALTERNATIVOS ===");
  ["news/tag/andebol", "news/tags/andebol", "tags/andebol/news", "tags/andebol", "news/28250", "news/latest", "news/list", "search?q=andebol", "news/search?q=andebol", "sportClasses/3/teamsNews", "sportClasses/3/news?limit=20", "teams/200/news", "news/archive", "news/all"].forEach(function(c) {
    const r = get("https://api.app.fcporto.pt/v2/" + c), l = ids(r.txt);
    L(c + " → HTTP " + r.code + (l ? " · " + l.length + " itens · " + (l.length ? l[0].id + " (" + l[0].d + ")" : "") : (r.code === 200 ? " · " + r.txt.substring(0, 100).replace(/\s+/g, " ") : "")));
  });
  L("\n=== D) PÁGINAS DO SITE (HTML): quantas ligações de notícias e de que datas ===");
  ["https://www.fcporto.pt/pt/noticias", "https://www.fcporto.pt/pt/noticias?page=2", "https://www.fcporto.pt/pt/noticias/2", "https://www.fcporto.pt/pt/noticias?tag=andebol", "https://www.fcporto.pt/pt/noticias/andebol", "https://www.fcporto.pt/pt/andebol", "https://www.fcporto.pt/pt/modalidades/andebol", "https://www.fcporto.pt/pt/andebol/noticias", "https://www.fcporto.pt/pt/basquetebol", "https://www.fcporto.pt/pt/hoquei-em-patins"].forEach(function(u) {
    const r = get(u);
    const ls = (r.txt.match(/\/pt\/noticias\/\d{8}-pt-[a-z0-9-]+/g) || []).filter(function(x, i, a) { return a.indexOf(x) === i; });
    const datas = ls.map(function(x) { return x.match(/\/(\d{8})-/)[1]; }).sort();
    L(u + " → HTTP " + r.code + " · " + r.txt.length + " bytes · " + ls.length + " notícias" + (ls.length ? " · de " + datas[0] + " a " + datas[datas.length - 1] : ""));
  });
  L("\nFIM. Copia tudo o que está no Registo e envia-me.");
}



// ===================== v148: CRONOLOGIA DO HÓQUEI (hoqueipatins.pt/evento/<id>) =====================
// A página de cada jogo tem o "lance a lance" (golos com minuto e assistência, cartões, power plays, timeouts, penáltis, VAR,
// substituições de guarda-redes). Lê-se no mesmo gatilho de 1 min enquanto o jogo decorre (e até 3 h depois do início) e guarda-se
// no mesmo sítio dos detalhes do Sofascore (prop sofaDetalhes), no mesmo formato: [minuto, tipo, lado(0=FC Porto,1=adversário), nome, extra].
// O minuto leva a parte à frente ("1ªP 5"), o site acrescenta o apóstrofo.
const HQ_SITE_ = "https://www.hoqueipatins.pt";
const HQ_DET_ESPERA_MS_ = 90 * 1000; // não volta a ler o mesmo jogo antes de 90 s

function hqTxt_(h) {
  return String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#8217;|&rsquo;/g, "'").replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, function(m, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function(m, n) { return String.fromCharCode(parseInt(n, 16)); });
}
function hqLinhas_(h) {
  return hqTxt_(h).split("\n").map(function(x) { return x.replace(/[ \t]+/g, " ").trim(); }).filter(Boolean);
}
function hqNome_(n) { return String(n || "").replace(/[®]/g, "").replace(/\(cap\.?\)/gi, "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim(); }

// Procura o endereço do jogo (número do evento) nas páginas de resultados do site, pelo FC Porto + adversário.
function hqEventoId_(adv) {
  const norm = function(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); };
  const GEN = { ad: 1, sc: 1, cd: 1, hc: 1, ac: 1, fc: 1, clube: 1, de: 1, do: 1, da: 1, hoquei: 1, patins: 1, cp: 1 };
  const toks = norm(adv).split(" ").filter(function(t) { return t.length >= 3 && !GEN[t]; });
  if (!toks.length) return "";
  const urls = ["/resultados-do-dia/", "/resultados/", "/agenda/"];
  for (let u = 0; u < urls.length; u++) {
    let html = "";
    try { html = UrlFetchApp.fetch(HQ_SITE_ + urls[u], { muteHttpExceptions: true, followRedirects: true, headers: { "User-Agent": "Mozilla/5.0" } }).getContentText() || ""; } catch (e) { continue; }
    // 1) cada jogo é uma linha <tr data-live-event="ID"> com as duas equipas (a ligação /evento/ID vem no fim da linha)
    const reL = /<tr[^>]*data-live-event=["'](\d+)["'][\s\S]*?<\/tr>/g; let m;
    while ((m = reL.exec(html))) {
      const t = norm(hqTxt_(m[0]));
      if (/porto/.test(t) && toks.every(function(x) { return t.indexOf(x) >= 0; })) return m[1];
    }
  }
  return "";
}

// Lê a página do evento e devolve { fcpCasa, inc, st, estado }.
function hqParseEvento_(html) {
  const nomes = []; let m; const reN = /class=["']nameTeam["'][\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = reN.exec(html)) && nomes.length < 2) nomes.push(hqTxt_(m[1]).replace(/\s+/g, " ").trim());
  const fcpCasa = /porto/i.test(nomes[0] || "");
  const ladoEsq = fcpCasa ? 0 : 1, ladoDir = fcpCasa ? 1 : 0; // a coluna da esquerda é a equipa da casa
  const inc = []; let ultimoMin = "";
  const rows = html.match(/<tr class=["']commentary-item["']>[\s\S]*?<\/tr>/g) || [];
  rows.forEach(function(r) {
    const tds = r.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    if (tds.length < 3) return;
    const tm = tds[1].match(/<div class=["']time["']>\s*(\d+)['’]?\s*([^<]*?)\s*<\/div>/);
    if (tm) ultimoMin = (tm[2].trim() + " " + tm[1]).trim();
    else if (/Fim da \d/i.test(hqTxt_(tds[1]))) ultimoMin = "Intervalo"; // o que vem a seguir (ex.: troca de guarda-redes) é do intervalo
    [[0, ladoEsq], [2, ladoDir]].forEach(function(par) {
      const lado = par[1], L = hqLinhas_(tds[par[0]]);
      for (let i = 0; i < L.length; i++) {
        const x = L[i]; let q;
        if ((q = x.match(/^Sai (.+?),\s*entra (.+)$/i))) { inc.push([ultimoMin, "S", lado, hqNome_(q[2]), hqNome_(q[1])]); continue; }
        if (!tm) continue; // linhas sem minuto (cinco inicial, "Início do jogo", "Fim da 1ª parte") não entram
        if ((q = x.match(/^(\d+)\s*-\s*(\d+)\s+(.+?)\s*(?:\(([^)]*)\))?\s*$/))) {
          let ass = ""; const nx = L[i + 1] || "", a = nx.match(/^Assist[eê]ncia de (.+)$/i);
          if (a) { ass = hqNome_(a[1]); i++; }
          const fl = String(q[4] || "");
          inc.push([ultimoMin, /auto/i.test(fl) ? "AG" : (/penal/i.test(fl) ? "GP" : "G"), lado, hqNome_(q[3]), ass]); continue;
        }
        if ((q = x.match(/^Cart[aã]o (azul|amarelo|vermelho)\s+(.+)$/i))) {
          const c = q[1].toLowerCase();
          inc.push([ultimoMin, c === "amarelo" ? "CA" : (c === "vermelho" ? "CV" : "O"), lado, hqNome_(q[2]), c === "azul" ? "Cartão azul" : ""]); continue;
        }
        if (/^Timeout/i.test(x)) { inc.push([ultimoMin, "O", lado, "", "Timeout"]); continue; }
        if (/^In[ií]cio Powerplay/i.test(x)) { inc.push([ultimoMin, "O", lado, "", "Power play"]); continue; }
        if (/^Grande Penalidade/i.test(x)) { inc.push([ultimoMin, "O", lado, "", "Grande penalidade"]); continue; }
        if ((q = x.match(/^Pen[aá]lti falhado (.+)$/i))) { inc.push([ultimoMin, "O", lado, hqNome_(q[1]), "Penálti falhado"]); continue; }
        if ((q = x.match(/^Defesa de pen[aá]lti (.+)$/i))) { inc.push([ultimoMin, "O", lado, hqNome_(q[1]), "Defesa de penálti"]); continue; }
        if (/VAR/.test(x)) { // a revisão fica do lado da equipa a favor de quem era o lance (se o texto o disser)
          const fv = x.match(/a favor d[ao]s? ([^,.]+)/i);
          inc.push([ultimoMin, "O", fv ? (/porto/i.test(fv[1]) ? 0 : 1) : lado, "", "Revisão VAR"]); continue;
        }
      }
    });
  });
  // estatísticas simples tiradas da própria cronologia
  const cont = function(f) { return [inc.filter(function(x) { return x[2] === 0 && f(x); }).length, inc.filter(function(x) { return x[2] === 1 && f(x); }).length]; };
  const linhasSt = [["Golos", function(x) { return x[1] === "G" || x[1] === "GP" || x[1] === "AG"; }],
    ["Power plays", function(x) { return x[4] === "Power play"; }], ["Grandes penalidades", function(x) { return x[4] === "Grande penalidade"; }],
    ["Cartões azuis", function(x) { return x[4] === "Cartão azul"; }], ["Cartões amarelos", function(x) { return x[1] === "CA"; }],
    ["Timeouts", function(x) { return x[4] === "Timeout"; }]];
  const st = [];
  linhasSt.forEach(function(l) { const c = cont(l[1]); if (c[0] || c[1]) st.push([l[0], String(c[0]), String(c[1])]); });
  const estado = (html.match(/live_time_\d+["'][^>]*>([^<]*)</) || [])[1] || "";
  return { fcpCasa: fcpCasa, nomes: nomes, inc: inc, st: st, estado: String(estado).trim() };
}

function hqGuardarDetalhe_(evId, inc, st, agora) {
  const props = PropertiesService.getScriptProperties();
  let todos; try { todos = JSON.parse(props.getProperty(SOFA_DET_PROP_) || "{}"); } catch (err) { todos = {}; }
  todos[evId] = { t: agora, inc: inc, st: st };
  let chaves = Object.keys(todos).sort(function(a, b) { return todos[b].t - todos[a].t; });
  chaves.slice(6).forEach(function(k) { delete todos[k]; });
  while (JSON.stringify(todos).length > 8000 && Object.keys(todos).length > 1) {
    chaves = Object.keys(todos).sort(function(a, b) { return todos[b].t - todos[a].t; });
    delete todos[chaves[chaves.length - 1]];
  }
  props.setProperty(SOFA_DET_PROP_, JSON.stringify(todos));
}

// Um jogo: descobre o evento (cache), lê, interpreta, guarda. Devolve texto para o Registo.
function hqDetalheUm_(it, agora, forcar) {
  const props = PropertiesService.getScriptProperties();
  const chUlt = "hqDetUlt_" + it.id, chId = "hqEvt_" + it.id;
  if (!forcar && agora - Number(props.getProperty(chUlt) || 0) < HQ_DET_ESPERA_MS_) return "espera";
  props.setProperty(chUlt, String(agora));
  let eid = props.getProperty(chId) || "";
  if (!eid) { eid = hqEventoId_(it.adv); if (eid) props.setProperty(chId, eid); }
  if (!eid) return "jogo não encontrado no hoqueipatins.pt";
  const r = UrlFetchApp.fetch(HQ_SITE_ + "/evento/" + eid + "/", { muteHttpExceptions: true, followRedirects: true, headers: { "User-Agent": "Mozilla/5.0" } });
  if (r.getResponseCode() !== 200) return "evento " + eid + " respondeu " + r.getResponseCode();
  const d = hqParseEvento_(r.getContentText() || "");
  if (d.inc.length) hqGuardarDetalhe_(it.id, d.inc, d.st, agora);
  return "evento " + eid + " · " + d.inc.length + " lances · " + d.st.length + " estatísticas · " + (d.estado || "?");
}
function hqDetalhesDosAtivos_(ativos, hoje, agora, forcar) {
  ativos.forEach(function(it) {
    const ini = Utilities.parseDate(hoje + " " + it.t, "Europe/Lisbon", "yyyy-MM-dd HH:mm").getTime();
    if (!forcar && agora < ini - 2 * 60000) return;
    const res = hqDetalheUm_(it, agora, forcar);
    if (res !== "espera") Logger.log("hóquei detalhe " + it.adv + ": " + res);
  });
}

// TESTE (só lê e guarda a cronologia): usa o último jogo de hóquei do site (hoje ou o mais recente) e mostra o que apanhou.
function testarHoqueiDetalheAgora() {
  const hoje = Utilities.formatDate(new Date(), "Europe/Lisbon", "yyyy-MM-dd");
  const all = readAll_(getSheet_());
  let ult = null;
  all.competitions.forEach(function(c) {
    if (c.mode !== "matches" || c.archived) return;
    ((all.data[c.id] || {}).events || []).forEach(function(ev) {
      if (HOQUEI_SPORTS_.indexOf(ev.sport) < 0 || !ev.day || ev.day > hoje || !ev.t) return;
      if (!ult || (ev.day + ev.t) > (ult.day + ult.t)) ult = ev;
    });
  });
  if (!ult) { Logger.log("Sem jogos de hóquei até hoje no site."); return; }
  Logger.log("Jogo: " + ult.day + " " + ult.t + " vs " + ult.athlete);
  const res = hqDetalheUm_({ id: ult.id, t: ult.t, adv: ult.athlete || "" }, Date.now(), true);
  Logger.log("Resultado: " + res);
  if (/não encontrado/.test(res)) {
    const h = hqLer_(HQ_SITE_ + "/resultados/").html;
    const linhas = h.match(/<tr[^>]*data-live-event=["']\d+["'][\s\S]*?<\/tr>/g) || [];
    Logger.log("HTTP/linhas em /resultados/: " + h.length + " caracteres, " + linhas.length + " jogos; ligações /evento/: " + ((h.match(/\/evento\/\d+/g) || []).length));
    linhas.filter(function(l) { return /porto/i.test(hqTxt_(l)); }).slice(0, 3).forEach(function(l) { Logger.log("linha com Porto: " + hqTxt_(l).replace(/\s+/g, " ").slice(0, 260)); });
  }
  let todos = {}; try { todos = JSON.parse(PropertiesService.getScriptProperties().getProperty(SOFA_DET_PROP_) || "{}"); } catch (e) {}
  const d = todos[ult.id];
  if (!d) { Logger.log("Nada guardado."); return; }
  d.inc.forEach(function(x) { Logger.log(JSON.stringify(x)); });
  Logger.log("estatísticas: " + JSON.stringify(d.st));
}


// ===================== v149: FUTEBOL (EQUIPA PRINCIPAL) — TESTE =====================
// Corre `testarFutebolAgora` à mão e manda-me o Registo. Só lê (não escreve nada no site). Confirma:
//  1) que o id 3002 é mesmo o FC Porto no Sofascore (senão procura pelo nome); 2) próximos/últimos jogos e competições;
//  3) a tabela da Liga Portugal; 4) lances e estatísticas de um jogo já feito; 5) onze inicial; 6) plantel e notícias no site do clube.
function testarFutebolAgora() {
  const cfg = SOFA_SPORTS_["Equipa A"];
  Logger.log("=== 1) Equipa " + cfg.teamId);
  const qt = sofaGet_("team/" + cfg.teamId);
  const nome = qt.dados && qt.dados.team && qt.dados.team.name;
  Logger.log("nome: " + (nome || ("ERRO " + qt.erro)) + (nome && !/porto/i.test(nome) ? "  <-- NÃO PARECE O FC PORTO" : ""));
  if (!nome || !/porto/i.test(nome)) {
    const qs = sofaGet_("search/all?q=" + encodeURIComponent("FC Porto"));
    ((qs.dados && qs.dados.results) || []).filter(function(r) { return r.type === "team"; }).slice(0, 6).forEach(function(r) {
      const e = r.entity || {};
      Logger.log("  candidato: id " + e.id + " | " + e.name + " | " + ((e.sport || {}).name || "") + " | " + (((e.country || {}).name) || ""));
    });
  }
  Logger.log("=== 2) Jogos");
  let ultimoFim = null;
  ["next", "last"].forEach(function(k) {
    const q = sofaGet_("team/" + cfg.teamId + "/events/" + k + "/0");
    const ev = (q.dados && q.dados.events) || [];
    Logger.log(k + ": " + ev.length + " jogos" + (q.erro ? " (" + q.erro + ")" : ""));
    ev.slice(k === "last" ? -4 : 0, k === "last" ? undefined : 4).forEach(function(e) {
      const ut = (e.tournament || {}).uniqueTournament || {};
      Logger.log("  " + Utilities.formatDate(new Date(e.startTimestamp * 1000), "Europe/Lisbon", "dd/MM HH:mm") + " | " + ((e.homeTeam || {}).name) + " vs " + ((e.awayTeam || {}).name)
        + " | " + (ut.name || (e.tournament || {}).name) + " (" + ((ut.category || {}).name || "") + ") | " + ((e.status || {}).type) + " | id " + e.id);
      if (k === "last" && e.status && e.status.type === "finished") ultimoFim = e;
    });
  });
  Logger.log("=== 3) Classificação (Liga Portugal)");
  const url = sofaLigaUrl_("Equipa A");
  Logger.log("endereço: " + (url || "NÃO ENCONTRADO"));
  if (url) {
    try {
      const r = parseStandingsSofascore_(UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "Accept": "application/json" } }).getContentText(), "Liga Portugal", "", "Equipa A");
      Logger.log(r.rows.length + " equipas | 1.º: " + r.rows[0].t + " " + r.rows[0].c.join(" ") + " | zonas: " + JSON.stringify(r.zonas));
    } catch (e) { Logger.log("ERRO: " + e); }
  }
  if (ultimoFim) {
    Logger.log("=== 4) Lances e estatísticas de " + ((ultimoFim.homeTeam || {}).name) + " vs " + ((ultimoFim.awayTeam || {}).name));
    const qi = sofaGet_("event/" + ultimoFim.id + "/incidents");
    const inc = (qi.dados && qi.dados.incidents) || [];
    const tipos = {}; inc.forEach(function(x) { tipos[x.incidentType + (x.incidentClass ? "/" + x.incidentClass : "")] = (tipos[x.incidentType + (x.incidentClass ? "/" + x.incidentClass : "")] || 0) + 1; });
    Logger.log("lances: " + inc.length + " | tipos: " + JSON.stringify(tipos));
    const qs2 = sofaGet_("event/" + ultimoFim.id + "/statistics");
    const per = ((qs2.dados && qs2.dados.statistics) || []).filter(function(p) { return p.period === "ALL"; })[0];
    const nomes = []; ((per && per.groups) || []).forEach(function(g) { (g.statisticsItems || []).forEach(function(i) { nomes.push(i.name + " " + i.home + "-" + i.away); }); });
    Logger.log("estatísticas: " + nomes.length + " | " + nomes.join(" ; "));
    const ql = sofaGet_("event/" + ultimoFim.id + "/lineups");
    Logger.log("onze inicial: " + (ql.dados ? ("casa " + ((ql.dados.home || {}).formation || "?") + " (" + (((ql.dados.home || {}).players || []).length) + " jogadores) | fora " + ((ql.dados.away || {}).formation || "?")) : ("ERRO " + ql.erro)));
  }
  Logger.log("=== 5) Plantel no site do clube (classe/equipa a confirmar)");
  const cls = UrlFetchApp.fetch("https://api.app.fcporto.pt/v2/sportClasses", { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
  Logger.log("sportClasses: HTTP " + cls.getResponseCode() + " " + cls.getContentText().substring(0, 700));
  [[1, 1], [1, 10], [1, 50], [1, 100], [1, 1000], [6, 1], [7, 1]].forEach(function(c) {
    try {
      const r = UrlFetchApp.fetch("https://api.app.fcporto.pt/v2/sportClasses/" + c[0] + "/teamsSquads?team=" + c[1], { muteHttpExceptions: true, headers: { "Accept": "application/json" } });
      let n = "";
      try { const d = JSON.parse(r.getContentText()); const pl = (((d.data || [])[0] || {}).squad || {}).players || []; n = pl.length + " jogadores" + (pl[0] ? " | ex.: " + (pl[0].full_name || "") + " / " + ((pl[0].position || {}).name || "") : ""); } catch (e2) { n = "sem JSON"; }
      Logger.log("  classe " + c[0] + " equipa " + c[1] + ": HTTP " + r.getResponseCode() + " | " + n);
    } catch (e) { Logger.log("  classe " + c[0] + " equipa " + c[1] + ": " + e); }
  });
  Logger.log("=== 6) Notícias (etiquetas)");
  const nt = noticiasFcpPagina_("");
  const etq = {}; nt.forEach(function(n) { (n.tags || []).forEach(function(t) { const k = String(typeof t === "object" ? (t.name || t.title || t.slug || "") : t).toLowerCase(); etq[k] = (etq[k] || 0) + 1; }); });
  Logger.log("lista geral: " + nt.length + " notícias | etiquetas mais vistas: " + Object.keys(etq).sort(function(a, b) { return etq[b] - etq[a]; }).slice(0, 25).map(function(k) { return k + "×" + etq[k]; }).join(", "));
}
