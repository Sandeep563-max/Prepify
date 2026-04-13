import express from 'express';
import authRouter from './routes/auth.routes.js';// requires all the routes here and use them in the app
import cookieParser from 'cookie-parser'
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin : "http://localhost:5174",
  credentials: true,
}));

app.use('/api/auth', authRouter)


app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Prepify API!' });
});

export default app;