const _ = require("lodash");
const {SLACK_API, OPTIONS_GET, FOLDER} = require("./constants");
const logger = require("./log");
const {createFileFolder} = require("./downloadfile");
const {createObjectCsvWriter: createCsvWriter} = require("csv-writer");
const jsonfile = require("jsonfile");

/**
 * Get Replies in threads
 * @param channelId - DM Id or Channel Id
 * @param threads - Thread list of a channel
 * @param allMessagesFolderPath - The folder to save all messages. Includes thread and replies
 * @param isArchive - Channel Status
 * @returns {Promise<void>}
 */
async function getReplies(channelId, threads, allMessagesFolderPath, isArchive = false) {
    try {
        for (let i=0; i<threads.length; i++) {
            let hasMore = true;
            let nextCursor = '';
            const thread = threads[i];
            const allMessagesData = [];

            // Create All Messages Folder
            const allMessagesFolder = `${allMessagesFolderPath}/${channelId}/${thread.ts}`;
            createFileFolder(allMessagesFolder);


            const replyCSVWriter = createCsvWriter({
                path: `${allMessagesFolder}/replies.csv`,
                header: [
                    {id: 'channelId', title: 'Channel/DM ID'},
                    {id: 'threadts', title: 'Thread TS'},
                    {id: 'replyts', title: 'Reply TS'},
                    {id: 'replyuser', title: 'Reply User ID'},
                ]
            });

            const hasReplies = _.has(thread, 'reply_count');
            const filePath = `${allMessagesFolder}/${thread.ts}.json`;
            if (hasReplies) {
                while (hasMore) {
                    const url = nextCursor ? `${SLACK_API.CONVERSATIONS_REPLY}?channel=${channelId}&ts=${thread.ts}&cursor=${nextCursor}` : `${SLACK_API.CONVERSATIONS_REPLY}?channel=${channelId}&ts=${thread.ts}`;

                    const res = await fetch(url, OPTIONS_GET);
                    const data = await res.json();
                    if (data.ok) {
                        if (data.messages.length > 0) {
                            allMessagesData.push(...data.messages);

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


                jsonfile.writeFileSync(filePath, allMessagesData);

                const allMessagesCSVData = []
                for (let j = 0; j< allMessagesData.length; j++) {
                    const row = {
                        channelId,
                        threadts: thread.ts,
                        replyts: allMessagesData[j].ts,
                        replyuser: allMessagesData[j].user,
                    };
                    allMessagesCSVData.push(row);
                }

                replyCSVWriter.writeRecords(allMessagesCSVData).then(() => {
                    logger.info(`Channel ID: ${channelId}'s thread ${thread.ts} has ${allMessagesCSVData.length} replies to CSV file`);
                });
            } else {
                allMessagesData.push(thread);
                jsonfile.writeFileSync(filePath, allMessagesData);
                logger.info(`Channel ID: ${channelId}'s thread ${thread.ts} has no reply`);
            }
        }

    } catch (ex) {
        logger.error(`Channel ID:${channelId}, Get All Messages in Threads Error: ${ex}`);
    }
}

module.exports = {
    getReplies
}