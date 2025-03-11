const {
    OPTIONS_GET,
    FOLDER,
    SLACK_API, CHANNEL_TYPE, LIMIT,
} = require("./constants");
const jsonfile = require("jsonfile");
const fs = require("fs");
const {getUserInfo, getUserNameListInConversation} = require("./users");
const {processDownloadThreadFiles, createFileFolder} = require("./downloadfile");
const logger = require("./log");
const _ = require('lodash');
const {getReplies} = require("./reply");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Create CSV Writer by channel type
 * @param type
 * @returns {{archiveCSVWriter: CsvWriter<ObjectMap<Field>>, unarchiveCSVWriter: CsvWriter<ObjectMap<Field>>}|undefined}
 */
function getCSVWriter(type) {
    switch (type) {
        case CHANNEL_TYPE.DIRECT_MESSAGE.name:
            return {
                archiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.DIRECT_MESSAGE_PATH}/archiveList.csv`,
                    header: [
                        {id: 'id', title: 'DM ID'},
                        {id: 'userid', title: 'Slack User ID'},
                        {id: 'username', title: 'Slack User Name'},
                        {id: 'isbot', title: 'Slack Bot'},
                    ]
                }),
                unarchiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.DIRECT_MESSAGE_PATH}/unArchiveList.csv`,
                    header: [
                        {id: 'id', title: 'DM ID'},
                        {id: 'userid', title: 'Slack User ID'},
                        {id: 'username', title: 'Slack User Name'},
                        {id: 'isbot', title: 'Slack Bot'},
                    ]
                })
            }
        case CHANNEL_TYPE.PUBLIC_CHANNEL.name:
            return {
                archiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.PUBLIC_CHANNELS_PATH}/archiveList.csv`,
                    header: [
                        {id: 'id', title: 'DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                }),
                unarchiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.PUBLIC_CHANNELS_PATH}/unArchiveList.csv`,
                    header: [
                        {id: 'id', title: 'Multi DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                })
            }
        case CHANNEL_TYPE.PRIVATE_CHANNEL.name:
            return {
                archiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.PRIVATE_CHANNELS_PATH}/archiveList.csv`,
                    header: [
                        {id: 'id', title: 'DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                }),
                unarchiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.PRIVATE_CHANNELS_PATH}/unArchiveList.csv`,
                    header: [
                        {id: 'id', title: 'Multi DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                })
            }
        case CHANNEL_TYPE.MULTI_DIRECT_MESSAGE.name:
            return {
                archiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.MULTI_DIRECT_MESSAGE_PATH}/archiveList.csv`,
                    header: [
                        {id: 'id', title: 'DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                }),
                unarchiveCSVWriter: createCsvWriter({
                    path: `${FOLDER.MULTI_DIRECT_MESSAGE_PATH}/unArchiveList.csv`,
                    header: [
                        {id: 'id', title: 'Multi DM ID'},
                        {id: 'userid', title: 'Slack User IDs'},
                        {id: 'username', title: 'Slack User Names'},
                    ]
                })
            }
        default:
            return undefined;
    }
}

/**
 * Get Thread List by Type
 * @param channelType - Object inclues public_channel, private_channel, im, mpim
 * @returns {Promise<void>}
 */
async function getThreadListByType(channelType) {
    try {

        const CHANNEL_TYPE = channelType;
        var hasMore = true;
        var nextCursor = '';
        const archiveList = [];
        const unArchiveList = [];
        const archiveJSON = [];
        const unarchiveJSON = [];
        const csvWriters = getCSVWriter(CHANNEL_TYPE.name);

        while (hasMore) {
            const response = await fetch(`${SLACK_API.CONVERSATIONS_LIST}?limit=${LIMIT.CONVERSATIONS_LIST}&&types=${CHANNEL_TYPE.name}`, OPTIONS_GET);

            const data = await response.json();

            if (data.ok) {
                for (let i = 0; i < data.channels.length; i++) {
                    if (CHANNEL_TYPE.name === 'im') {
                        const user = await getUserInfo(data.channels[i].user);
                        const imJSON = {
                            id: data.channels[i].id,
                            userid: data.channels[i].user,
                            username: user.profile.real_name,
                            isbot: user.is_bot
                        }
                        if (data.channels[i].is_archived) {
                            archiveList.push(data.channels[i]);
                            archiveJSON.push(imJSON);
                        } else {
                            unArchiveList.push(data.channels[i]);
                            unarchiveJSON.push(imJSON);
                        }
                    } else {
                        const userArrayObject = await getUserNameListInConversation(data.channels[i].id);

                        const mdmJSON = {
                            id: data.channels[i].id,
                            userid: userArrayObject.id.toString(),
                            username: userArrayObject.name.toString()
                        }

                        if (data.channels[i].is_archived) {
                            archiveList.push(data.channels[i]);
                            archiveJSON.push(mdmJSON);
                        } else {
                            unArchiveList.push(data.channels[i]);
                            unarchiveJSON.push(mdmJSON);
                        }
                    }
                }
            }

            if (!data.has_more) {
                hasMore = false;
                nextCursor = '';
            } else {
                nextCursor = data.response_metadata.next_cursor;
            }
        }

        jsonfile.writeFileSync(`${CHANNEL_TYPE.ROOT_PATH}/archiveList.json`, archiveList);
        jsonfile.writeFileSync(`${CHANNEL_TYPE.ROOT_PATH}/unArchiveList.json`, unArchiveList);

        if (archiveJSON.length > 0) {
            csvWriters.archiveCSVWriter.writeRecords(archiveJSON)       // returns a promise
                .then(() => {
                    logger.info(`Channel Type: ${CHANNEL_TYPE.name}'s Archive list CSV Done`);
                });
        }

        if (unarchiveJSON.length > 0) {
            csvWriters.unarchiveCSVWriter.writeRecords(unarchiveJSON).then(() => {
                logger.info(`Channel Type: ${CHANNEL_TYPE.name}'s UnArchive list CSV Done`)
            })
        }

    } catch (err) {
        logger.error(`Get Channel Type:${CHANNEL_TYPE.name} Thread List Error: ${err}`);
    }
}

/**
 * Get
 * @param channelId
 * @param threadFolderPath
 * @param allMessagesFolderPath
 * @param isArchived
 * @returns {Promise<void>}
 */
async function getChannelThreadList(channelId, threadFolderPath, allMessagesFolderPath,isArchived = false) {
    try {
        let hasMore = true;
        let nextCursor = '';
        const threadData = [];

        while (hasMore) {
            const url = nextCursor ? `${SLACK_API.CONVERSATIONS_HISTORY}?channel=${channelId}&limit=${LIMIT.CONVERSATIONS_HISTORY}&cursor=${nextCursor}` : `${SLACK_API.CONVERSATIONS_HISTORY}?channel=${channelId}&limit=${LIMIT.CONVERSATIONS_HISTORY}`;
            const res = await fetch(url, OPTIONS_GET);

            const data = await res.json();
            if (data.ok) {
                if (data.messages.length > 0) {
                    threadData.push(...data.messages);

                    if (!data.has_more) {
                        hasMore = false;
                        nextCursor = '';
                    } else {
                        nextCursor = data.response_metadata.next_cursor;
                    }
                } else {
                    hasMore = false;
                    nextCursor = '';
                }
            }
        }

        const filePath = `${threadFolderPath}/${channelId}.json`;
        jsonfile.writeFileSync(filePath, threadData);
        logger.info(`Fetch Channel ID: ${channelId} thread data completed`);

        if (threadData.length >0) {
            logger.info(`Start to fetch replies in Channel ID: ${channelId}`);
            await getReplies(channelId, threadData, allMessagesFolderPath, isArchived);
        }

    } catch (ex) {
        logger.error('Get DM Channel threads Error: ', ex);
    }


}

async function getThreadsAndAllMessagesWithFiles(channelType, isArchived = false) {
    try {
        const CHANNEL_TYPE = channelType;
        const filePath = isArchived ? `${CHANNEL_TYPE.ROOT_PATH}/archiveList.json` : `${CHANNEL_TYPE.ROOT_PATH}/unArchiveList.json`;

        const data = fs.readFileSync(filePath, 'utf8');
        const list = JSON.parse(data);

        // Create Threads Folder
        const archive_folder = isArchived ? FOLDER.ARCHIVE : FOLDER.UNARCHIVE;
        const threadFolderPath = `${CHANNEL_TYPE.ROOT_PATH}/${archive_folder}/${FOLDER.THREADS}`;
        logger.info(threadFolderPath);
        createFileFolder(threadFolderPath);

        // Create All Messages Folder
        const allMessagesFolderPath = `${CHANNEL_TYPE.ROOT_PATH}/${archive_folder}/${FOLDER.ALL_MESSAGES}`;
        logger.info(allMessagesFolderPath);
        createFileFolder(allMessagesFolderPath);

        for (let i = 0; i < list.length; i++) {
            logger.info(`Start fetch Channel Type:${CHANNEL_TYPE.name}'s Channel ID: ${list[i].id}`);
            await getChannelThreadList(list[i].id, threadFolderPath, allMessagesFolderPath, isArchived);
        }
    } catch (ex) {
        logger.error(`Fetch Channel Type:${CHANNEL_TYPE.name} data Error: ${ex}`);
    }
}

module.exports = {
    getThreadListByType,
    getThreadsAndAllMessagesWithFiles
}
