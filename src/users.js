const {OPTIONS_GET, SLACK_API, FOLDER} = require("./constants");
const { compressDataFile } = require("./downloadfile");
const jsonfile = require("jsonfile");
const logger = require("./log");
const fs = require("jsonfile");
const _ = require("lodash");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const activeUserCSVWriter = createCsvWriter({
    path: `${FOLDER.USERS}/active_users.csv`,
    header: [
        {id: 'id', title: 'User ID'},
        {id: 'realname', title: 'Slack User Name'},
    ]
});

const deletedUserCSVWriter = createCsvWriter({
    path: `${FOLDER.USERS}/delete_users.csv`,
    header: [
        {id: 'id', title: 'User ID'},
        {id: 'realname', title: 'Slack User Name'},
    ]
});

const botUserCSVWriter = createCsvWriter({
    path: `${FOLDER.USERS}/bot_users.csv`,
    header: [
        {id: 'id', title: 'User ID'},
        {id: 'realname', title: 'Slack Bot Name'},
    ]
});

/**
 * Get User List Not Used
 * @returns {Promise<void>}
 */
async function getUserList() {
    try {
        const response = await fetch(SLACK_API.USER_LIST, OPTIONS_GET);
        const data = await response.json();

        if (data.ok) {
            jsonfile.writeFileSync(`${FOLDER.USERS}/users.json`, data.members);

            const deletedUsers = [];
            const deletedUserCSV = [];
            const activeUsers = [];
            const activeUserCSV = [];
            const botUsers = [];
            const botUserCSV = [];

            for (let i = 0; i < data.members.length; i++) {

                if (data.members[i].is_bot) {
                    botUsers.push(data.members[i]);
                    botUserCSV.push({
                        id: data.members[i].id,
                        realname: data.members[i].profile.real_name
                    });
                } else {
                    if (data.members[i].deleted) {
                        deletedUsers.push(data.members[i]);
                        deletedUserCSV.push({
                            id:data.members[i].id,
                            realname: data.members[i].profile.real_name
                        });
                    } else {
                        activeUsers.push(data.members[i]);
                        activeUserCSV.push({
                            id: data.members[i].id,
                            realname: data.members[i].real_name
                        });
                    }
                }
            }

            jsonfile.writeFileSync(`${FOLDER.USERS}/active_users.json`, activeUsers);
            jsonfile.writeFileSync(`${FOLDER.USERS}/delete_users.json`, deletedUsers);
            jsonfile.writeFileSync(`${FOLDER.USERS}/bot_users.json`, botUsers);

            activeUserCSVWriter.writeRecords(activeUserCSV)
                .then(() => {
                    logger.info(`Active User list CSV Done`);
                });
            deletedUserCSVWriter.writeRecords(deletedUserCSV)
                .then(() => {
                    logger.info(`Deleted User list CSV Done`);
                });
            botUserCSVWriter.writeRecords(botUserCSV)
                .then(() => {
                    logger.info(`Bot User list CSV Done`);
                });

            compressDataFile(FOLDER.USERS, `${FOLDER.ROOT_PATH}/users.zip`);
        }
    } catch (ex) {
        logger.error(`Get Slack Users List Error: ${ex}`);
    }
}

/**
 * Get User Detail
 * @param userId
 * @returns {Promise<number|PublicKeyCredentialUserEntity|null>}
 */
async function getUserInfo(userId)  {
    try {
        logger.info(`Start fetch API users.info by User ID: ${userId}`);
        const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, OPTIONS_GET);
        const data = await response.json();

        logger.info(`User Name: ${data.user.profile.real_name}`);
        if (data.ok) {
            return data.user;
        }
    } catch (ex) {
        logger.error(`API users.info error: ${ex}`);
        return null;
    }
}

/**
 * Get User List By Channel Id
 * @param channelId
 * @returns {Promise<null|{name: [], id}>}
 */
async function getUserNameListInConversation(channelId) {
    try {
        const response = await fetch(`${SLACK_API.CONVERSATIONS_MEMBERS}?channel=${channelId}`, OPTIONS_GET);
        const data = await response.json();

        if (data.ok) {
            const userNameArray = [];
            const userIDArray = data.members;
            for(let i=0;i<data.members.length;i++) {
                const userId = data.members[i];
                logger.info(`Channel ID:${channelId} is searching User ID: ${userId}'s info...`);
                const result = searchUserInfoInJson(userId);
                if (result && result.length > 0) {
                    const user = result[0];
                    userNameArray.push(user.profile.real_name);
                }
            }

            return {
                name: userNameArray,
                id: userIDArray,
            }
        }
    } catch (ex) {
        logger.error(`Get UserName ListInConversation Error: ${ex}`);
        return null;
    }
}

/**
 * Search User Info in `users.json` file
 * @param userId
 * @returns {Object[]}
 */
function searchUserInfoInJson(userId) {
    try {
        const usesJsonFilePath = `${FOLDER.USERS}/users.json`;
        const userList = fs.readFileSync(usesJsonFilePath, 'utf8');
        const result = _.filter(userList, (user) => user.id === userId);
        return result;
    } catch (err) {
        logger.error(`Search User Info By ID:${userId} Error: ${err}`);
        return null;
    }

}

module.exports = {
    getUserInfo,
    getUserNameListInConversation,
    getUserList,
    searchUserInfoInJson
};