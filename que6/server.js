const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); // allow frontend to call this server

app.get('/api/catfact', async (req, res) => {
    try {
        const response = await axios.get('https://catfact.ninja/fact');
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch cat fact' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
