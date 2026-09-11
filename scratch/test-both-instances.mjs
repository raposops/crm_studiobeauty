async function testBoth() {
  const adminPhone = '5551981108170';
  const text = '🧪 *Teste de Notificação Admin - CRM Studio Beauty*\n\nVerificando qual instância da Evolution API está conectada e entregando mensagens!';

  // Teste 1: Instance 'fidus'
  console.log('--- Testando Instância fidus ---');
  try {
    const res1 = await fetch('https://evo.fidustecnologia.com.br/message/sendText/fidus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '9858375C8262-4CCB-83D2-E66974D498A1',
      },
      body: JSON.stringify({
        number: adminPhone,
        text: text + ' (Instância fidus)',
        options: { delay: 1000, presence: 'composing' },
      }),
    });
    console.log('Status fidus:', res1.status, res1.statusText);
    const data1 = await res1.json();
    console.log('Body fidus:', JSON.stringify(data1));
  } catch (err) {
    console.error('Erro fidus:', err.message);
  }

  // Teste 2: Instance 'meu_acessor'
  console.log('\n--- Testando Instância meu_acessor ---');
  try {
    const res2 = await fetch('https://evo.fidustecnologia.com.br/message/sendText/meu_acessor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '306435C88588-4EE6-AD53-E5882B4EE2AD',
      },
      body: JSON.stringify({
        number: adminPhone,
        text: text + ' (Instância meu_acessor)',
        options: { delay: 1000, presence: 'composing' },
      }),
    });
    console.log('Status meu_acessor:', res2.status, res2.statusText);
    const data2 = await res2.json();
    console.log('Body meu_acessor:', JSON.stringify(data2));
  } catch (err) {
    console.error('Erro meu_acessor:', err.message);
  }
}

testBoth();
