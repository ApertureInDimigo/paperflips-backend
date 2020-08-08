"use strict";
exports.__esModule = true;
exports.log = void 0;
var winston = require('winston');
var moment = require('moment'); //한국시간을 나타내기 위한 모듈 추가
var fs = require('fs');
var logDir = './log/file';
/*로그 만드는 함수(방법) */
function log(info, level) {
    console.log(info);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    var logger = winston.createLogger({
        transports: [
            new (winston.transports.Console)({
                colorize: true,
                level: 'info',
                timestamp: function () {
                    return moment().format("YYYY-MM-DD HH:mm:ss");
                }
            }),
            new (require('winston-daily-rotate-file'))({
                level: 'info',
                filename: logDir + "/log.log",
                prepend: true,
                timestamp: function () {
                    return moment().format("YYYY-MM-DD HH:mm:ss");
                }
            })
        ]
    });
    try {
        logger.info(info + " " + moment().format("YYYY-MM-DD HH:mm:ss"));
    }
    catch (exception) {
        logger.error("ERROR=>" + exception);
    }
}
exports.log = log;
