const bcrypt = require('bcryptjs');
const pass = '378ED19B';
bcrypt.hash(pass, 10).then(hash => {
    console.log('PASSWORD:', pass);
    console.log('HASH:', hash);
});
