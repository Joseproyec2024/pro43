const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { initializeGameLogic } = require('./gameLogic');
const dotenv = require('dotenv');
const ticTacToe = require('./ticTacToe');
const bcrypt = require('bcrypt');
const cors = require("cors");
const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");


function validarWalletBSC(wallet) {
    return web3.utils.isAddress(wallet);
}
// 1. Primero inicializa Express
const app = express();
// 2. Ahora puedes usar app para configurar middlewares
app.use(cors({ origin: "https://www.coinjanken.com" }));

// Configuraciones posteriores...
const httpServer = createServer(app);
const io = new Server(httpServer);

// Resto del código...
// Cargar variables de entorno desde .env
dotenv.config();

// Inicializar Express y el servidor HTTP

// 1. Middleware de CORS (PRIMERO)
app.use(cors({
  origin: "https://www.coinjanken.com",
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('.'));
app.use(express.static('public'));
// Inicializar la lógica del Tres en Raya
ticTacToe(io);
// Conexión a MongoDB usando Mongoose
const uri = process.env.MONGODB_URI; // Leer la URI de MongoDB desde .env
mongoose.connect(uri);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log("Conectado a MongoDB Atlas");
});
app.post('/guardar-nombre', async (req, res) => {
  const token = req.headers['authorization'];
  const { nombre } = req.body;

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { nombre } },
      { new: true }
    );

    if (user) {
      res.status(200).json({ message: 'Nombre guardado correctamente', nombre: user.nombre });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error('Error al guardar el nombre:', error);
    res.status(500).json({ error: "Error al guardar el nombre" });
  }
});
const roundSchema = new mongoose.Schema({
  round: Number,
  choice: String,
  result: String
});

const userSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 50 },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralBalance: { type: Number, default: 0 }, // Asegúrate de que este campo esté defin
  paymentHistory: [{
      amount: Number,
      token: String,
      txHash: String,
      date: { type: Date, default: Date.now }
  }],
  gameHistory: [{
    gameName: String, // Nuevo campo: nombre del juego
      rounds: [roundSchema],
      totalBet: Number,
      totalWins: Number,
      totalLosses: Number,
      date: { type: Date, default: Date.now }
  }],
  puntos: { type: Number, default: 0 },
  puntosResetTime: { type: Date },
  totalFees: { type: Number, default: 0 } // Nuevo campo para almacenar el total de comisiones
});
const feeSchema = new mongoose.Schema({
  withdrawalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawalRequest', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Fee = mongoose.model('Fee', feeSchema);
const User = mongoose.model('User', userSchema);

const withdrawalRequestBaseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    wallet: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'listed', 'canceled'],
      default: 'pending'
    }
  });
const totalFeesSchema = new mongoose.Schema({
  totalAmount: { type: Number, default: 0 }, // Total acumulado de comisiones
  lastUpdated: { type: Date, default: Date.now } // Fecha de la última actualización
});




app.get('/all-game-history', async (req, res) => {
  try {
    const users = await User.find({}).select('nombre gameHistory');

    const gameHistoryData = users.map(user => {
      return user.gameHistory
        .filter(game => game.totalWins > 0) // Solo juegos donde el usuario ganó
        .map(game => ({
          nombre: user.nombre,
          gameName: game.gameName, // Incluir el nombre del juego
          totalBet: game.totalBet,
          totalWins: game.totalWins,
          date: game.date
        }));
    }).flat();

    res.status(200).json(gameHistoryData);
  } catch (error) {
    console.error('Error al obtener el historial de juegos:', error);
    res.status(500).json({ error: "Error al obtener el historial de juegos" });
  }
});

app.get('/game-history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game-history.html'));
});




const TotalFees = mongoose.model('TotalFees', totalFeesSchema);
// Funciones auxiliares
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10);  // Genera un código aleatorio
};

// Rutas
app.get('/perfil.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
});



app.get('/perfil', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;
      const user = await User.findById(userId);

      if (user) {
          res.status(200).json({
              balance: user.balance,
              walletAddress: user.walletAddress, // Añadir este campo
              referralCode: user.referralCode,
              referralBalance: user.referralBalance,
              nombre: user.nombre,
              paymentHistory: user.paymentHistory
          });
      } else {
          res.status(404).json({ error: "Usuario no encontrado" });
      }
  } catch (error) {
      res.status(500).json({ error: "Error al obtener los datos del perfil" });
  }
});

app.get('/balance/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (user) {
      res.status(200).json({ balance: user.balance });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el balance" });
  }
});

app.post('/add-funds/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: "Monto inválido" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    if (user) {
      res.status(200).json({ message: "Fondos agregados correctamente" });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar fondos" });
  }
});

app.post('/update-balance', async (req, res) => {
  const token = req.headers['authorization'];
  const { balance } = req.body;

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { balance: balance } },
      { new: true }
    );

    if (user) {
      res.status(200).json({ message: 'Balance actualizado correctamente' });
    } else {
      res.status(404).json({ error: "Usuario no encontrado o balance sin cambios" });
    }
  } catch (error) {
    console.error('Error al actualizar el balance:', error);
    res.status(500).json({ error: "Error al actualizar el balance" });
  }
});


app.get('/referral-balance/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (user) {
      res.status(200).json({ referralBalance: user.referralBalance });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el balance de referidos" });
  }
});

app.get('/referral-code', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.userId;

    const user = await User.findById(userId);

    if (user) {
      res.status(200).json({ referralCode: user.referralCode });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el código de referido" });
  }
});

app.post('/transfer-referral-balance/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (user) {
      user.balance += user.referralBalance;
      user.referralBalance = 0;
      await user.save();

      res.status(200).json({ message: "Balance de referidos transferido correctamente", balance: user.balance });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al transferir el balance de referidos" });
  }
});
app.post('/api/register-payment', async (req, res) => {
    const { email, amount, token, txHash } = req.body; // Cambiar de walletAddress a email

    try {
        const user = await User.findOne({ email }); // Buscar por email en lugar de walletAddress

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        user.balance += parseFloat(amount);
        user.paymentHistory.push({ amount, token, txHash });
        await user.save();
        res.status(200).json({ message: "Pago registrado y balance actualizado", balance: user.balance });
    } catch (error) {
        console.error('Error al registrar el pago:', error);
        res.status(500).json({ error: "Error al registrar el pago" });
    }
});
// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir el archivo HTML principal
app.get('/gameoficial', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gameoficial', 'index.html'));
});

// Manejar conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log(`Usuario conectado. Total: ${io.engine.clientsCount}`);

    // Emitir la cantidad de usuarios conectados a todos los clientes
    io.emit('updateUserCount', io.engine.clientsCount);

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado. Total: ${io.engine.clientsCount}`);

        // Emitir la cantidad de usuarios conectados a todos los clientes
        io.emit('updateUserCount', io.engine.clientsCount);
    });
});
app.post('/save-rounds', async (req, res) => {
  const token = req.headers['authorization'];
  const { rounds, totalBet, totalWins, totalLosses } = req.body;

  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;

      const user = await User.findByIdAndUpdate(
          userId,
          {
              $push: {
                  gameHistory: {
                      rounds,
                      totalBet,
                      totalWins,
                      totalLosses
                  }
              }
          },
          { new: true }
      );

      if (user) {
          res.status(200).json({ message: 'Rondas guardadas correctamente' });
      } else {
          res.status(404).json({ error: "Usuario no encontrado" });
      }
  } catch (error) {
      console.error('Error al guardar las rondas:', error);
      res.status(500).json({ error: "Error al guardar las rondas" });
  }
});

app.get('/game-history', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;

      const user = await User.findById(userId);

      if (user) {
          res.status(200).json({ gameHistory: user.gameHistory });
      } else {
          res.status(404).json({ error: "Usuario no encontrado" });
      }
  } catch (error) {
      res.status(500).json({ error: "Error al obtener el historial de juegos" });
  }
});
// Inicializar la lógica del juego
initializeGameLogic(io);


app.get('/get-puntos', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;

      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({ puntos: user.puntos });
  } catch (error) {
      console.error('Error al obtener los puntos:', error);
      res.status(500).json({ error: "Error al obtener los puntos" });
  }
});

app.get('/top-players', async (req, res) => {
  try {
      const topPlayers = await User.find({})
          .sort({ puntos: -1 }) // Ordenar por puntos de mayor a menor
          .limit(20) // Limitar a 20 jugadores
          .select('nombre puntos'); // Seleccionar solo el nombre y los puntos

      res.status(200).json({ topPlayers });
  } catch (error) {
      console.error('Error al obtener los mejores jugadores:', error);
      res.status(500).json({ error: "Error al obtener los mejores jugadores" });
  }
});

app.post('/register', async (req, res) => {
    const { nombre, email, password, referralCode } = req.body;

    // Validaciones (si es necesario)
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        // Comprobar si el correo electrónico ya está registrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Correo electrónico ya registrado" });
        }

        // Generar un nuevo código de referido si no se pasa uno
        const referralCodeGenerated = referralCode || generateReferralCode();

        // Crear un nuevo usuario
        const hashedPassword = await bcrypt.hash(password, 10); // Seguridad con bcrypt
        const newUser = new User({
            nombre,
            email,
            password: hashedPassword,
            referralCode: referralCodeGenerated,
        });

        await newUser.save();
        res.status(201).json({ message: "Usuario registrado con éxito", userId: newUser._id });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
});



app.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;

      // Buscar el usuario en la base de datos
      const user = await User.findOne({ email });

      if (user) {
          // Comparar la contraseña hasheada
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
              return res.status(401).json({ error: "Credenciales incorrectas" });
          }

          // Generar el token JWT con el id del usuario
          const token = jwt.sign({ userId: user._id.toString() }, 'secret_key', { expiresIn: '1h' });

          // Enviar el token en la respuesta
          res.status(200).json({ token });
      } else {
          res.status(401).json({ error: "Credenciales incorrectas" });
      }
  } catch (error) {
      res.status(500).json({ error: "Error al iniciar sesión" });
  }
});



app.get('/perfil', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;
      const user = await User.findById(userId);

      if (user) {
          res.status(200).json({
              balance: user.balance, // Asegúrate de que esto esté correctamente definido
              walletAddress: user.walletAddress,
              referralCode: user.referralCode,
              referralBalance: user.referralBalance,
              nombre: user.nombre,
              paymentHistory: user.paymentHistory
          });
      } else {
          res.status(404).json({ error: "Usuario no encontrado" });
      }
  } catch (error) {
      res.status(500).json({ error: "Error al obtener los datos del perfil" });
  }
});







app.post('/update-puntos', async (req, res) => {
  const token = req.headers['authorization'];
  const { totalWins } = req.body;

  if (!token) {
      return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;

      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Sumar puntos según las rondas ganadas
      let puntosGanados = 0;
      if (totalWins === 1) {
          puntosGanados = 10;
      } else if (totalWins === 2) {
          puntosGanados = 40;
      } else if (totalWins === 3) {
          puntosGanados = 100;
      }

      user.puntos += puntosGanados; // Sumar puntos al total
      await user.save();

      res.status(200).json({ message: 'Puntos actualizados', puntos: user.puntos });
  } catch (error) {
      console.error('Error al actualizar los puntos:', error);
      res.status(500).json({ error: "Error al actualizar los puntos" });
  }
});

































// Solicitar retiro
app.post('/solicitar-retiro', async (req, res) => {
  const token = req.headers['authorization'];
  const { amount, wallet } = req.body;

  if (!token) return res.status(403).json({ error: "Token no proporcionado" });
  if (!wallet) return res.status(400).json({ error: "Wallet requerida" });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (user.balance < amount) return res.status(400).json({ error: "Saldo insuficiente" });

    // Calcular comisión del 1%
    const feeAmount = amount * 0.01;
    const netAmount = amount - feeAmount;

    // Determinar en qué tabla guardar la solicitud
    let withdrawalRequest;
    if (amount < 1000) {
      withdrawalRequest = new RetiroLessThan1k({
        user: user._id,
        amount: netAmount,
        wallet
      });
    } else if (amount >= 1000 && amount < 10000) {
      withdrawalRequest = new Retiro1kTo10k({
        user: user._id,
        amount: netAmount,
        wallet
      });
    } else if (amount >= 10000 && amount < 20000) {
      withdrawalRequest = new Retiro10kTo20k({
        user: user._id,
        amount: netAmount,
        wallet
      });
    } else if (amount >= 20000 && amount <= 40000) {
      withdrawalRequest = new Retiro20kTo40k({
        user: user._id,
        amount: netAmount,
        wallet
      });
    } else {
      return res.status(400).json({ error: "Monto fuera de rango" });
    }

    // Guardar la solicitud en la tabla correspondiente
    await withdrawalRequest.save();

    // Actualizar balance del usuario (restar monto completo)
    user.balance -= amount;
    await user.save();

    // Guardar comisión en tabla aparte
    const fee = new Fee({
      withdrawalRequest: withdrawalRequest._id,
      user: user._id,
      amount: feeAmount
    });
    await fee.save();

    // Actualizar el total acumulado de comisiones en la tabla TotalFees
    let totalFees = await TotalFees.findOne();
    if (!totalFees) {
      totalFees = new TotalFees({ totalAmount: feeAmount });
    } else {
      totalFees.totalAmount += feeAmount;
      totalFees.lastUpdated = Date.now();
    }
    await totalFees.save();

    res.status(200).json({ 
      message: "Solicitud creada y balance actualizado", 
      request: withdrawalRequest,
      newBalance: user.balance,
      totalFees: totalFees.totalAmount
    });
  } catch (error) {
    console.error('Error al solicitar retiro:', error);
    res.status(500).json({ error: "Error al crear la solicitud" });
  }
});



// Obtener solicitudes de retiro (admin)
app.get('/mis-solicitudes-retiro', async (req, res) => {
  const token = req.headers['authorization'];
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    
    const solicitudes = await WithdrawalRequest.find({ user: user._id });
    
    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});
// Procesar retiro (admin)
app.post('/procesar-retiro/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { txHash } = req.body;

  try {
    const request = await WithdrawalRequest.findById(requestId).populate('user');
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // Obtener comisión asociada
    const fee = await Fee.findOne({ withdrawalRequest: requestId });
    if (!fee) {
      return res.status(404).json({ error: "Comisión no encontrada" });
    }

    const user = request.user;
    const netAmount = request.amount - fee.amount;

    // Registrar en historial de pagos (monto total retirado)
    user.paymentHistory.push({
      amount: -request.amount,
      token: 'USDT',
      txHash,
      date: new Date()
    });

    // Actualizar estado de la solicitud
    request.status = 'paid';
    await request.save();
    await user.save();

    res.status(200).json({ 
      message: "Retiro procesado correctamente",
      details: {
        amountRequested: request.amount,
        fee: fee.amount,
        netAmountSent: netAmount
      }
    });
  } catch (error) {
    console.error('Error al procesar retiro:', error);
    res.status(500).json({ error: "Error al procesar el retiro" });
  }
});

app.get('/total-fees', async (req, res) => {
  try {
    const totalFees = await TotalFees.findOne();
    if (!totalFees) {
      return res.status(200).json({ totalFees: 0 }); // Si no hay registros, devuelve 0
    }
    res.status(200).json({ totalFees: totalFees.totalAmount });
  } catch (error) {
    console.error('Error al obtener el total de comisiones:', error);
    res.status(500).json({ error: "Error al obtener el total de comisiones" });
  }
});

async function initializeTotalFees() {
  const totalFees = await TotalFees.findOne();
  if (!totalFees) {
    await TotalFees.create({ totalAmount: 0 });
    console.log("Registro inicial de TotalFees creado.");
  }
}

// Llamar a la función al iniciar la aplicación
initializeTotalFees();
app.get('/solicitudes-retiro/lessThan1k', async (req, res) => {
  try {
    const solicitudes = await RetiroLessThan1k.find();
    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

app.get('/solicitudes-retiro/1kTo10k', async (req, res) => {
  try {
    const solicitudes = await Retiro1kTo10k.find();
    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

app.get('/solicitudes-retiro/10kTo20k', async (req, res) => {
  try {
    const solicitudes = await Retiro10kTo20k.find();
    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

app.get('/solicitudes-retiro/20kTo40k', async (req, res) => {
  try {
    const solicitudes = await Retiro20kTo40k.find();
    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});


const RetiroLessThan1k = mongoose.model('RetiroLessThan1k', withdrawalRequestBaseSchema);
const Retiro1kTo10k = mongoose.model('Retiro1kTo10k', withdrawalRequestBaseSchema);
const Retiro10kTo20k = mongoose.model('Retiro10kTo20k', withdrawalRequestBaseSchema);
const Retiro20kTo40k = mongoose.model('Retiro20kTo40k', withdrawalRequestBaseSchema);



// Iniciar el servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
