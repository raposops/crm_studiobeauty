const url = 'https://evo.fidustecnologia.com.br/message/sendText/meu_acessor';
const apiKey = '306435C88588-4EE6-AD53-E5882B4EE2AD';

async function testSendMariana() {
  console.log('Testing Evolution API send text to 5551981108170...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: '5551981108170',
        text: 'Olá *Mariana*! ✅\n\nSeu agendamento no *Studio Beauty* para dia *13/08/2026* às *08:00* foi *CONFIRMADO* com sucesso!\n\nTe esperamos! Caso precise de alguma informação, estamos à disposição. 😊',
        options: { delay: 1000, presence: 'composing', linkPreview: false },
      }),
    });

    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.dir(data, { depth: null });
  } catch (err) {
    console.error('Error sending:', err);
  }
}

testSendMariana();
