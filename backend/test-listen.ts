import express from 'express';
const app = express();
const PORT = 3000;
console.log('🚀 Attempting to start test server...');
try {
    const server = app.listen(PORT, () => {
        console.log(`✅ Test server running on port ${PORT}`);
        server.close();
    });
} catch (error) {
    console.error('❌ Failed to start test server:', error);
}
