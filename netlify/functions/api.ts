import express from 'express';
import serverless from 'serverless-http';
import { apiRouter } from '../../src/server/api';

const app = express();
app.use(express.json());

// Support both /api and /.netlify/functions/api
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

export const handler = serverless(app);
