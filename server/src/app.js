import './config/mongooseSetup.js'; // must stay first: it configures how models turn into JSON
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { corsOrigin } from './config/cors.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// The Express app. server.js starts it; tests import it directly.
const app = express();

app.set('trust proxy', 1); // one proxy hop (Render), so rate limiting keys on the real client IP
app.use(helmet()); // safer HTTP headers
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' })); // read JSON request bodies
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev')); // request log in the terminal

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
