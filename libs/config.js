var nconf = require('nconf');

// Development error handler will print stacktrace
switch(process.env.NODE_ENV){
    case 'development':
        nconf.argv()
            .env()
            .file({ file: './config-dev.json'});
        break;
    default:
        nconf.argv()
            .env()
            .file({file: './config.json'});
        break;
}

module.exports = nconf;