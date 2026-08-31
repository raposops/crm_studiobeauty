async function checkWebhook() {
  const evoUrl = 'https://evo.fidustecnologia.com.br';
  const evoKey = '9858375C8262-4CCB-83D2-E66974D498A1';
  const instanceName = 'fidus';

  const res = await fetch(`${evoUrl}/webhook/find/${instanceName}`, {
    headers: { 'apikey': evoKey }
  });
  const data = await res.json();
  console.log('Webhook config for fidus:', JSON.stringify(data, null, 2));
}

checkWebhook();
