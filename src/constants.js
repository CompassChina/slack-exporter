const SLACK_TOKEN = '替换自己的token到这里';

const SPLIT = {
    FILE_SIZE: '500', //500M
    FOLDER_NAME: 'split_zipfiles',
    OUTPUT_PREFIX: '_part_',
};

const OPTIONS_GET = {
    method: 'get',
    contentType: 'application/json',
    headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`
    }
};

const OPTIONS_POST = {
    method: 'post',
    contentType: 'application/json',
    headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`
    }
};

const FOLDER = {
    THREADS: 'threads',
    ALL_MESSAGES: 'messages',
    ARCHIVE: 'archive',
    UNARCHIVE: 'unarchive',
    DIRECT_MESSAGE_PATH: './json_data/direct_message',
    MULTI_DIRECT_MESSAGE_PATH: './json_data/multi_direct_message',
    PRIVATE_CHANNELS_PATH: './json_data/channels/private_channels',
    PUBLIC_CHANNELS_PATH: './json_data/channels/public_channels',
    USERS: './json_data/users',
    ROOT_PATH: './json_data'
};

const CHANNEL_TYPE = {
    PUBLIC_CHANNEL: {
        name: 'public_channel',
        ROOT_PATH: FOLDER.PUBLIC_CHANNELS_PATH
    },
    PRIVATE_CHANNEL: {
        name: 'private_channel',
        ROOT_PATH: FOLDER.PRIVATE_CHANNELS_PATH
    },
    DIRECT_MESSAGE: {
        name: 'im',
        ROOT_PATH: FOLDER.DIRECT_MESSAGE_PATH
    },
    MULTI_DIRECT_MESSAGE: {
        name: 'mpim',
        ROOT_PATH: FOLDER.MULTI_DIRECT_MESSAGE_PATH
    }
}

const SLACK_API = {
    CONVERSATIONS_HISTORY: 'https://slack.com/api/conversations.history',
    CONVERSATIONS_LIST: 'https://slack.com/api/conversations.list',
    CONVERSATIONS_REPLY: 'https://slack.com/api/conversations.replies',
    CONVERSATIONS_MEMBERS:'https://slack.com/api/conversations.members',
    USER_LIST: 'https://slack.com/api/users.list'
}

const LIMIT = {
    CONVERSATIONS_LIST: 1000,
    CONVERSATIONS_HISTORY: 999
}

module.exports = {
    SLACK_TOKEN,
    OPTIONS_GET,
    OPTIONS_POST,
    FOLDER,
    SLACK_API,
    CHANNEL_TYPE,
    LIMIT,
    SPLIT
}