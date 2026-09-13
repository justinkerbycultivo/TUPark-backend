require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRouter = require('./routes/auth');
const spotsRouter = require('./routes/spots');
const reservationsRouter = require('./routes/reservations');
const guardRouter = require('./routes/guard');
const adminRouter = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'TUPark API is running' });
});

app.use('/api/spots', spotsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/guard', guardRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TUPark API listening on port ${PORT}`);
  });
});
