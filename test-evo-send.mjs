const url = 'https://evo.fidustecnologia.com.br/message/sendText/meu_acessor';
const apiKey = '306435C88588-4EE6-AD53-E5882B4EE2AD';

async function testSend() {
  console.log('Testing Evolution API send text...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: '5551997912672',
        text: 'Teste de mensagem automatica de conclusao do CRM Studio Beauty! ✅',
        options: { delay: 1000, presence: 'composing', linkPreview: false },
      }),
    });

    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response body:', data);
  } catch (err) {
    console.error('Error sending:', err);
  }
}

testSend();
