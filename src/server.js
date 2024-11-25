import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import tradingRoutes from './routes/tradingRoutes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// API routes
app.use('/api/trading', tradingRoutes);

// Swagger documentation
const swaggerDocument = YAML.load('./src/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Trading bot server running on port ${port}`);
});