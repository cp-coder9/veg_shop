const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '169.239.218.68',
    user: 'prepedb1_prod7',
    password: 'prepedb1_prod7',
    database: 'prepedb1_prod7',
    port: 3306,
    connectTimeout: 10000
});

console.log('Attempting to connect to MySQL...');

connection.connect((err) => {
    if (err) {
        console.error('Connection failed!');
        console.error('Error Code:', err.code);
        console.error('Error Number:', err.errno);
        console.error('Error Message:', err.message);
        process.exit(1);
    } else {
        console.log('Successfully connected to MySQL!');
        connection.end();
        process.exit(0);
    }
});
