const {getThreadListByType, getThreadsAndAllMessagesWithFiles} = require("../conversation");
const {CHANNEL_TYPE, FOLDER} = require("../constants");
const logger = require("../log");
const {getFilesInAllMessages, compressDataFile} = require("../downloadfile");
const async = require("async");
const minimist = require("minimist");

function step1(callback) {
    logger.info("Step 1: Public Channel 获取Channel List");
    setTimeout(async () => {
        await getThreadListByType(CHANNEL_TYPE.PUBLIC_CHANNEL);
        callback(null, "Step 1 Done");
    }, 1000);
}

function step2(callback) {
    logger.info("Step 2: Public Channel Un-Archive 频道，获取每个Thread中的所有消息回复");
    setTimeout(async () => {
        await getThreadsAndAllMessagesWithFiles(CHANNEL_TYPE.PUBLIC_CHANNEL, false);
        callback(null, "Step 2 Done");
    }, 1000);
}

function step3(callback) {
    logger.info("Step 3: Public Channel Archive 频道，获取每个Thread中的所有消息回复");
    setTimeout(async () => {
        await getThreadsAndAllMessagesWithFiles(CHANNEL_TYPE.PUBLIC_CHANNEL, true);
        callback(null, "Step 3 Done");
    }, 1000);
}

function step4(callback) {
    logger.info("Step 4: Public Channel Un-Archive 频道，获取每个消息中需要下载的文件");
    setTimeout(async () => {
        await getFilesInAllMessages(CHANNEL_TYPE.PUBLIC_CHANNEL, false);
        callback(null, "Step 4 Done");
    }, 1000);
}

function step5(callback) {
    logger.info("Step 5: Public Channel Archive 频道，获取每个消息中需要下载的文件");
    setTimeout(async () => {
        await getFilesInAllMessages(CHANNEL_TYPE.PUBLIC_CHANNEL, false);
        callback(null, "Step 5 Done");
    }, 1000);
}

function step6(callback) {
    logger.info("Step 6: Public Channel 频道，压缩已下载完成的所有数据文件");
    setTimeout(() => {
        compressDataFile(FOLDER.PUBLIC_CHANNELS_PATH, `${FOLDER.ROOT_PATH}/multi_direct_message.zip`);
        callback(null, "Step 6 Done");
    }, 1000);
}

// 分步骤执行
async function runSteps() {
    const args = minimist(process.argv.slice(2));
    logger.info(`执行命令参数 ${JSON.stringify(args)}`);
    if (args.step === 'channel') {
        try {
            const results = await async.series([step1]);
            logger.info(`Step 1. Public Channel gel all channel list completed! Please confirm the channel list, which will be exported`);
        } catch (err) {
            logger.error("分步骤执行 Error:", err);
        }
    } else if(args.step === 'data') {
        try {
            const results = await async.series([step2, step3, step4, step5,step6]);
            logger.info(`Public Channel get all selected channel's messages completed! ${results}`);
        } catch (err) {
            logger.error("分步骤执行 Error:", err);
        }
    }
}

runSteps();