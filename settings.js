var settings = {}
 
settings.mongo.uri = process.env.OPENSHIFT_MONGODB_DB_URL;
settings.mongo.host = process.env.OPENSHIFT_MONGODB_DB_HOST;
settings.mongo.port = process.env.OPENSHIFT_MONGODB_DB_PORT;
settings.mongo.db = 'nodesession';
 
module.exports = settings;