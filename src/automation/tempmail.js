const SERVICES = [
  {
    name: "mail.tm",
    type: "mailtm",
    apiUrl: "https://api.mail.tm",
    active: true,
  },
  {
    name: "guerrillamail",
    type: "guerrilla",
    apiUrl: "https://api.guerrillamail.com/ajax.php",
    active: true,
  },
];

let currentServiceIndex = 0;
let usedEmails = [];

function rotateService() {
  let attempts = 0;
  while (attempts < SERVICES.length) {
    currentServiceIndex = (currentServiceIndex + 1) % SERVICES.length;
    const svc = SERVICES[currentServiceIndex];
    if (svc.active) {
      console.log(`[TempMail] Rotated to service: ${svc.name}`);
      return svc;
    }
    attempts++;
  }
  return SERVICES[0];
}

function getCurrentService() {
  return SERVICES[currentServiceIndex];
}

async function createMailTMEmail() {
  const svc = getCurrentService();
  const domainsRes = await fetch(`${svc.apiUrl}/domains?page=1`);
  const domainsData = await domainsRes.json();
  const domain = domainsData["hydra:member"][0].domain;

  const randomString = Math.random().toString(36).substring(2, 10);
  const email = `${randomString}@${domain}`;
  const password = "Temp@" + Math.random().toString(36).substring(2, 8) + "!";

  const accountRes = await fetch(`${svc.apiUrl}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });

  if (!accountRes.ok) {
    throw new Error(`Account creation failed: ${await accountRes.text()}`);
  }

  const tokenRes = await fetch(`${svc.apiUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });

  const tokenData = await tokenRes.json();

  return {
    service: "mailtm",
    email,
    login: randomString,
    domain,
    password,
    token: tokenData.token,
    apiUrl: svc.apiUrl,
  };
}

async function createGuerrillaEmail() {
  const svc = getCurrentService();
  const dataRes = await fetch(`${svc.apiUrl}?f=get_email_address`);
  const data = await dataRes.json();

  const email = data.email_addr;
  const sidToken = data.sid_token;
  const alias = data.alias;
  const login = email.split("@")[0];
  const domain = email.split("@")[1];

  return {
    service: "guerrilla",
    email,
    login,
    domain,
    password: null,
    token: sidToken,
    alias,
    apiUrl: svc.apiUrl,
  };
}

async function getTempEmail() {
  for (let attempt = 0; attempt < SERVICES.length; attempt++) {
    const svc = getCurrentService();
    try {
      let session;
      if (svc.type === "mailtm") {
        session = await createMailTMEmail();
      } else if (svc.type === "guerrilla") {
        session = await createGuerrillaEmail();
      }

      if (!usedEmails.includes(session.email)) {
        usedEmails.push(session.email);
        console.log(`[TempMail] Created via ${svc.name}: ${session.email}`);
        return session;
      }

      console.log(`[TempMail] Email already used, rotating...`);
      rotateService();
    } catch (error) {
      console.error(`[TempMail] ${svc.name} failed: ${error.message}`);
      svc.active = false;
      rotateService();
    }
  }

  usedEmails = [];
  SERVICES.forEach((s) => (s.active = true));
  currentServiceIndex = 0;
  throw new Error("All email services exhausted.");
}

module.exports = { getTempEmail };
