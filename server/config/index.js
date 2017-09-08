// process.env.NODE_ENV = 'production';

module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT || 3000,
    mongoose: {
        uri: "mongodb://localhost/doit"
    },
    security: {
        secret: "t45g3w45r34tw5ye454uhdgdf",
        expiresIn: "24h"
    },
    superadmin: {
        login: "superuser",
        email: "super@super.com",
        password: "1Superpass"
    }
};
