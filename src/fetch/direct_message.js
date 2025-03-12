const async = require("async");
const minimist = require('minimist');
const {getThreadListByType, getThreadsAndAllMessagesWithFiles} = require("../conversation");
const {getFilesInAllMessages} = require("../downloadfile");
const {CHANNEL_TYPE} = require("../constants");
const logger = require("../log");

function step1(callback) {
    logger.info("Step 1: Direct Message 获取Channel List");
    setTimeout(async () => {
        await getThreadListByType(CHANNEL_TYPE.DIRECT_MESSAGE);
        callback(null, "Step 1 Done");
    }, 1000);
}

function step2(callback) {
    logger.info("Step 2: Direct Message Un-Archive 频道，获取每个Thread中的所有消息回复");
    setTimeout(async () => {
        await getThreadsAndAllMessagesWithFiles(CHANNEL_TYPE.DIRECT_MESSAGE, false);
        callback(null, "Step 2 Done");
    }, 1000);
}

function step3(callback) {
    logger.info("Step 3: Direct Message Archive 频道，获取每个Thread中的所有消息回复");
    setTimeout(async () => {
        await getThreadsAndAllMessagesWithFiles(CHANNEL_TYPE.DIRECT_MESSAGE, true);
        callback(null, "Step 3 Done");
    }, 1000);
}

function step4(callback) {
    logger.info("Step 4: Direct Message Un-Archive 频道，获取每个消息中需要下载的文件");
    setTimeout(async () => {
        await getFilesInAllMessages(CHANNEL_TYPE.DIRECT_MESSAGE, false);
        callback(null, "Step 4 Done");
    }, 1000);
}

function step5(callback) {
    logger.info("Step 5: Direct Message Archive 频道，获取每个消息中需要下载的文件");
    setTimeout(async () => {
        await getFilesInAllMessages(CHANNEL_TYPE.DIRECT_MESSAGE, false);
        callback(null, "Step 5 Done");
    }, 1000);
}

// 分步骤执行
async function runSteps() {
    const args = minimist(process.argv.slice(2));
    logger.info(`执行命令参数 ${JSON.stringify(args)}`);
    if (args.step === 'channel') {
        try {
            const results = await async.series([step1]);
            logger.info(`Step 1. Direct Message gel all channel list completed! Please confirm the channel list, which will be exported`);
        } catch (err) {
            logger.error("分步骤执行 Error:", err);
        }
    } else if(args.step === 'data') {
        try {
            const results = await async.series([step2, step3, step4, step5]);
            logger.info(`Direct Message get all selected channel's messages completed! ${results}`);
        } catch (err) {
            logger.error("分步骤执行 Error:", err);
        }
    }
}

runSteps();