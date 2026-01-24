const { format } = require('date-fns');
const now = new Date();
console.log('Format:', format(now, "yyyy-MM-dd'T'HH:mm:ssXXX"));
