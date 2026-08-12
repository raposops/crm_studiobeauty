const apiKey = '306435C88588-4EE6-AD53-E5882B4EE2AD';
const baseUrl = 'https://evo.fidustecnologia.com.br';
const instance = 'meu_acessor';

async function checkWebhook() {
  console.log('--- CHECKING EVOLUTION API WEBHOOK CONFIG ---');
  try {
    const res = await fetch(`${baseUrl}/webhook/find/${instance}`, {
      headers: { 'apikey': apiKey }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.dir(data, { depth: null });
  } catch (err) {
    console.error('Error fetching webhook:', err);
  }
}

checkWebhook();
