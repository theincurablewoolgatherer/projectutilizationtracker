var winston = require('winston');

exports.logger = function () {
  return new (winston.Logger)({
    	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'logs.log' })
    	]
	});
};