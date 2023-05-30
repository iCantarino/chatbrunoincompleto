const path = require('path');
const fs = require('fs');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret Key:', secretKey);

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const http = require('http').createServer(app);
const io = require('socket.io')(http);

let jsonData = { usuarios: [] }; 

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

app.use(cookieParser());

function authenticate(req, res, next) {
  const token = req.cookies.authToken;

  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        res.redirect('/login.html'); 
      } else {
        req.userId = decoded.userId; 
        next();
      }
    });
  } else {
    res.redirect('/login.html'); 
  }
}


app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.get('/style.css', (request, response) => {
  response.sendFile(path.join(__dirname, "style.css"));
});

app.get('/login.css', (request, response) => {
  response.sendFile(path.join(__dirname, "login.css"));
});

app.post('/usuarios', (req, res) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    const { nome, email, senha } = JSON.parse(data);

    if (!nome || !email || !senha) {
      res.statusCode = 400; 
      res.end('Missing required fields');
      return;
    }

    const dbPath = path.join(__dirname, 'public', 'db.json');

    try {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      if (fileData) {
        jsonData = JSON.parse(fileData); // Lê o arquivo existente
      }
    } catch (error) {
      console.error('Error reading db.json:', error);
    }

    const emailExists = jsonData.usuarios.some(user => user.email === email);
    if (emailExists) {
      res.statusCode = 409; // Conflito - e-mail já cadastrado
      res.end('E-mail já existe');
    } else {
      const newUser = { id: uuidv4(), nome, email, senha };
      jsonData.usuarios.push(newUser); // Adiciona o novo usuário na chave "usuarios"

      try {
        fs.writeFileSync(dbPath, JSON.stringify(jsonData, null, 2));
        console.log('Data stored in db.json');
        res.statusCode = 200;
        res.end('Adicionado com sucesso');
      } catch (error) {
        console.error('Error writing to db.json:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });
});

app.post('/login', (req, res) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    const { email, senha } = JSON.parse(data);

    const dbPath = path.join(__dirname, 'public', 'db.json');
    // let jsonData = { usuarios: [] };

    try {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      if (fileData) {
        jsonData = JSON.parse(fileData);
      }
    } catch (error) {
      console.error('Error reading db.json:', error);
    }

    const usuario = jsonData.usuarios.find(user => user.email === email && user.senha === senha);
      if (usuario) {
    const token = jwt.sign({ userId: usuario.id }, secretKey);
    res.cookie('authToken', token, { httpOnly: true });

    io.emit('userConnected', usuario.nome);

    res.redirect('/chatbox'); 
  } else {
    res.statusCode = 401;
    res.end('Invalid credentials');
  }

  });
});

app.get('/user', authenticate, (req, res) => {
  const userId = req.userId;
  const user = jsonData.usuarios.find(user => user.id === userId);

  if (user) {
    const userData = {
      name: user.nome,
      email: user.email,
    };
    res.status(200).json(userData);
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/chatbox', authenticate, (req, res) => {
  const userId = req.userId;
  const user = jsonData.usuarios.find(user => user.id === userId);

  if (user) {
    const userName = user.nome;
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
  } else {
    res.status(401).send('Unauthorized');
  }
});

io.on('connection', (socket) => {
  socket.on('userConnected', () => {
    const userId = socket.id; 
    const user = jsonData.usuarios.find(user => user.id === userId);

    if (user) {
      const newUserName = user.name; 

      socket.broadcast.emit('newUserJoined', newUserName);
    }
  });
  console.log('Usuário conectado');
  console.log(socket.id);

  socket.on('chat message', (data) => io.emit('chat message', data));
  socket.on('disconnect', () => console.log('Usuário desconectado'));
});

http.listen(3000, () => {
  console.log(`Servidor rodando na porta 3000 - Link http://localhost:3000`);
});
