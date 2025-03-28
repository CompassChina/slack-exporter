const emoji = require("emoji-name-map");

const caches = {
  users: null,
};

exports.getBreadcrumbs = function(breadcrumbs = []) {
  return [{ text: "Home", href: "/" }, ...breadcrumbs];
};


exports.getUserById = function(userId) {
  if (!this.data.users) {
    return null;
  }
  if (!caches.users) {
    caches.users = {};
    this.data.users.forEach((user) => {
      caches.users[user.id] = user;
    });
  }
  return caches.users[userId];
}

exports.getUsernameById = function(userId) {
  const user = this.getUserById(userId);
  if (!user) {
    return "Unknown User";
  }
  return user.profile?.display_name || user.real_name || user.name;
}

exports.formatDate = function(timestamp) {
  return new Date(timestamp).toLocaleString();
}

exports.getChannelName = function(type, channel) {
  switch (type) {
    case "public_channel":
    case "private_channel":
      return `#${channel.name}`;
    case "im":
      return this.getUsernameById(channel.user);
    case "mpim":
      return channel?.purpose?.value ?? channel.name;
    default:
      return "Unknown";
  }
}

const MULTILINE_CODE_REGEX = /```([\S\s]+?)```/gm;
const INLINE_CODE_REGEX = /`([^\n`]+)`/g;
const MENTION_REGEX = /<@([A-Z0-9]+)>/g;
const LINK_REGEX = /<(https?:\/\/[^>]+)>/g;
const BOLD_REGEX = /\*([^*]+)\*/g;
const EMOJI_REGEX = /:([a-z0-9_]+):/g;

exports.formatMessage = function(message) {
  return message.replace(MENTION_REGEX, (match, userId) => {
    return `<span class="mention">@${this.getUsernameById(userId)}</span>`;
  }).replace(MULTILINE_CODE_REGEX, (match, source) => {
    return `<pre>${source}</pre>`;
  }).replace(INLINE_CODE_REGEX, (match, source) => {
    return `<code>${source}</code>`;
  }).replace(LINK_REGEX, (match, text) => {
    const [url, title] = text.split("|");
    return `<a target="_blank" href="${url}">${title || url}</a>`;
  }).replace(BOLD_REGEX, (match, text) => {
    return `<strong>${text}</strong>`;
  }).replace(EMOJI_REGEX, (match, name) => {
    const emojiChar = emoji.get(name);
    if (emojiChar) {
      return emojiChar;
    }
    return match;
  });
}

exports.getRenderTime = function() {
  if (!this.startTs) {
    this.startTs = Date.now();
  }
  const now = Date.now();
  return (now - this.startTs) / 1000;
}

exports.getExtName = function(filename) {
  return filename?.split(".").pop();
}

exports.getEmoji = function(name) {
  return emoji.get(name) || name;
}
