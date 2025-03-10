const {getUserList} = require("../users");
const logger = require("../log");

getUserList().then(r => logger.info(`Get Slack Users List Done`));