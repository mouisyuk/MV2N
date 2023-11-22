const fs = require('fs');

fs.rename('.output/server/index.mjs', '.output/server/server.bundle.mjs', (err) => {
    if(err) console.error(err)
});

fs.rename('.output/server/index.mjs.map', '.output/server/server.bundle.mjs.map', (err, data) => {
    if(err) console.error(err)

    fs.readFile('.output/server/server.bundle.mjs.map', 'utf8', (err, data) => {
        if (err) return console.log(err);
        
        const result = data.replace('index.mjs', 'server.bundle.mjs');
    
        fs.writeFile('.output/server/server.bundle.mjs.map', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
});

fs.readFile('.output/nitro.json', 'utf8', (err, data) => {
    if (err) return console.log(err);
    
    const result = data.replace('./server/index.mjs', './server/server.bundle.mjs');

    fs.writeFile('.output/nitro.json', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});