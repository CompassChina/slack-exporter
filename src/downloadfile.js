const fs = require('fs');
const https = require('https');
const path = require('path');
const _ = require('lodash');
const axios = require('axios');
const {SLACK_TOKEN, FOLDER} = require("./constants");
const {createObjectCsvWriter: createCsvWriter} = require("csv-writer");
const logger = require("./log");
const {parseFilePath, getFilesInFolderSync} = require("./utils");

/**
 * Find the threads that have file
 * @param filePath
 * @returns {[]}
 */
function filterThreadsHasFiles(filePath) {
    logger.info(`Reading File ${filePath}`);
    const hasFileThreads = [];
    const data = fs.readFileSync(filePath);
    const jsonData = JSON.parse(data);

    for (let i = 0; i < jsonData.length; i++) {
        const thread = jsonData[i];

        const hasFile = _.has(thread, 'files');

        if (hasFile) {
            hasFileThreads.push({
                thread,
                filePath
            });
        }
    }

    logger.info(`The threads have files: ${hasFileThreads.length} `)

    return hasFileThreads;
}

/**
 * Download the file
 * @param downloadFilePath
 * @param fileURL
 * @returns {Promise<boolean>}
 */
async function downloadFile(downloadFilePath, fileURL) {

    try {

        const headers = {
            Authorization: `Bearer ${SLACK_TOKEN}`,
        };

        const fileResponse = await axios.get(fileURL, {
            headers,
            responseType: 'arraybuffer',
        });

        fs.writeFileSync(downloadFilePath, fileResponse.data);
        logger.info(`File downloaded: ${downloadFilePath}`);
        return true;

    } catch (err) {
        logger.error(`Download File Error: ${err.message}`);
        return false;
    }
}

/**
 * Create folder
 * @param folderPath
 */
function createFileFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            logger.info(`Create Folder: ${folderPath}`);
        } catch (ex) {
            logger.error(`Create Folder Error: ${ex}`);
        }
    } else {
        logger.info(`Folder Exist: ${folderPath}`);
    }
}

/**
 * Remove delete and external files
 * @param files
 */
function removeInvalidFiles(files) {
    // remove deleted file
    const data = _.filter(files, (file) => {
        let validFile = true;
        if (_.has(file, 'mode') && file.mode === 'tombstone') { //deleted file
            validFile = false;
        } else {
            if (_.has(file, 'external_url')) { // external file like google doc/sheet and etc
                validFile = false;
            } else if (_.has(file, 'file_access')) {
                if (file.file_access === 'file_not_found' || file.file_access === 'access_denied') { // invalid file can not found
                    validFile = false;
                }
            }
        }

        if (validFile) {
            logger.info(`File keep: ${file.name}`);
        } else {
            logger.info(`Invalid File: ${file.name}`);
        }

        return validFile;
    });
    return data;
}

/**
 * Process Download files in threads
 * @param data - Object thread and filePath
 * @returns {Promise<*[]>}
 */
async function processDownloadThreadFiles(data) {
    const pathObject = parseFilePath(data.filePath);
    const rootPath = pathObject.rootFolder;
    const channelId = pathObject.channelId;
    const thread = data.thread;
    const downloadFileFolder = `${rootPath}/files`;
    createFileFolder(downloadFileFolder);

    try {
        const files = removeInvalidFiles(thread.files);

        const csvArray = [];
        for (let j = 0; j < files.length; j++) {
            const fileType = files[j].filetype !== '' ? files[j].filetype : path.extname(files[j].url_private_download);
            const downloadFileName = `${thread.ts}_${j.toString()}.${fileType}`;
            const downloadFilePath = `${downloadFileFolder}/${downloadFileName}`;
            logger.info(`Channel ID:${channelId}'s Thread TS: ${thread.ts} Downloading ${files[j].url_private_download}`);
            logger.info(`File Local Path: ${downloadFilePath}`);
            const result = await downloadFile(downloadFilePath, files[j].url_private_download);
            if (result) {
                csvArray.push({
                    id: channelId,
                    threadts: thread.ts,
                    replayts: thread.thread_ts,
                    userid: thread.user,
                    fileid: files[j].id,
                    fileurl: files[j].url_private_download,
                    filelocalpath: downloadFilePath
                });
            }
        }

        return csvArray;
    } catch (err) {
        logger.error(`Process download thread ${JSON.stringify(data)} error: ${err} `);
        return [];
    }
}

async function getFilesInAllMessages(channelType, isArchived = false) {
    const CHANNEL_TYPE = channelType;
    const archive_folder = isArchived ? FOLDER.ARCHIVE : FOLDER.UNARCHIVE;
    const allMessagesPath = `${CHANNEL_TYPE.ROOT_PATH}/${archive_folder}/${FOLDER.ALL_MESSAGES}`;
    const allMessagesJsonFiles = getFilesInFolderSync(allMessagesPath);

    const CSVWriter = createCsvWriter({
        path: `${CHANNEL_TYPE.ROOT_PATH}/${archive_folder}/files.csv`,
        header: [
            {id: 'id', title: 'Channel/DM ID'},
            {id: 'threadts', title: 'Thread TS'},
            {id: 'replayts', title: 'Reply TS'},
            {id: 'userid', title: 'User ID'},
            {id: 'fileid', title: 'Slack File ID'},
            {id: 'fileurl', title: 'Slack File Download URL'},
            {id: 'filelocalpath', title: 'Local File Path'},
        ]
    });

    const hasFileThreads = [];
    for (let i = 0; i < allMessagesJsonFiles.length; i++) {
        const filePath = allMessagesJsonFiles[i];
        const fileThreads = filterThreadsHasFiles('./'+filePath);
        if (fileThreads.length > 0) {
            hasFileThreads.push(...fileThreads);
        }
    }

    const csvData = [];
    for (let j = 0; j < hasFileThreads.length; j++) {
        const data = hasFileThreads[j];
        const csv = await processDownloadThreadFiles(data);
        if (csv) {
            csvData.push(...csv);
        }
    }

    CSVWriter.writeRecords(csvData).then(() => {
        logger.info(`Channel Type:${CHANNEL_TYPE.name} download files finished successfully!`);
    });
}

module.exports = {
    processDownloadThreadFiles,
    createFileFolder,
    filterThreadsHasFiles,
    getFilesInAllMessages
}