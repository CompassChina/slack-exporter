const fs = require('fs');
const path = require('path');
const logger = require("./log");

/**
 * Get files in specific folder
 * @param folderPath
 * @returns {*[]}
 */
function getFilesInFolderSync(folderPath) {
    try {
        let results = [];
        const list = fs.readdirSync(folderPath);

        list.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                results = results.concat(getFilesInFolderSync(filePath));
            } else if (path.extname(file).toLowerCase() === '.json') {
                results.push(filePath);
            }
        });

        logger.info(`The folder ${folderPath} has ${results.length} files`);
        return results;
    } catch (err) {
        logger.error(`GetFilesInFolder ${folderPath} Error: ${err}`);
    }
}

/**
 * Parse File Path
 * @param filePath
 * @returns {{rootFolder: string, channelId: unknown, ts: unknown}}
 */
function parseFilePath(filePath) {
    try {
        const dirPath = path.dirname(filePath);
        const folders = dirPath.split(path.sep);
        const lastTwoFolders = folders.slice(-2);

        return {
            rootFolder: dirPath,
            channelId: lastTwoFolders[0],
            ts: lastTwoFolders[1]
        };

    } catch (err) {
        logger.error(`ParseFilePath: ${filePath} Error: ${err}`);
    }
}

module.exports = {
    getFilesInFolderSync,
    parseFilePath
}