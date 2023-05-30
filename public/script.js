
// Cadastro

function cadastrar(event) {
  event.preventDefault();

  const nomeInput = document.getElementById('nomeCadastro');
  const emailInput = document.getElementById('emailCadastro');
  const senhaInput = document.getElementById('senhaCadastro');

  const nome = nomeInput.value;
  const email = emailInput.value;
  const senha = senhaInput.value;

  fetch('/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome: nome, email: email, senha: senha })
  })
    .then(response => {
      if (response.ok) {
        alert('Usuário registrado com sucesso');

        // Clear the input fields
        nomeInput.value = '';
        emailInput.value = '';
        senhaInput.value = '';
      } else {
        throw new Error('Erro ao registrar usuário');
      }
    })
    .catch(error => {
      alert('Erro ao cadastrar o usuário');
      console.error('Erro ao enviar o cadastro:', error);
    });
}

//Login

function logar() {
  const emailInput = document.getElementById('emailLogin');
  const senhaInput = document.getElementById('senhaLogin');

  const email = emailInput.value;
  const senha = senhaInput.value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email, senha: senha })
  })
    .then(response => {
      if (response.ok) {
        alert('Logado com sucesso');
        window.location.href = '/chatbox'; // Redirect to the chatbox page
      } else {
        alert('Dados incorretos');
      }
    })
    .catch(error => {
      alert('Erro');
      console.error('Algum erro:', error);
    })
    .finally(() => {
      // Clear the input fields
      emailInput.value = '';
      senhaInput.value = '';
    });
}

