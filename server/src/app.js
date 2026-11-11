import './config/mongooseSetup.js'; // must stay first: it configures how models turn into JSON
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// The Express app. server.js starts it; tests import it directly.
const app = express();

app.use(helmet()); // safer HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' })); // read JSON request bodies
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev')); // request log in the terminal

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
