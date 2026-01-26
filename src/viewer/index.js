const express = require("express");
const jsonFile = require("jsonfile");
const path = require("node:path");
const fs = require("node:fs");
const { parse: parseCSV } = require("csv-parse/sync");
const { CHANNEL_TYPE, FOLDER } = require("../constants");
const helpers = require("./helpers");

const PORT = parseInt(process.env.PORT) || 3000;
const HOSTNAME = parseInt(process.env.HOSTNAME) || "127.0.0.1";
const OPEN = Boolean(process.env.OPEN) || false;
const DATA_DIR = "json_data/";

const channelNames = {
  im: "Direct Messages",
  mpim: "Multi Direct Messages (Groups)",
  private_channel: "Private Channels",
  public_channel: "Public Channels",
};

const CHANNEL_NAME_MAP = Object.fromEntries(
  Object.entries(CHANNEL_TYPE).map(([key, value]) => [value.name, key])
);

const getDataSource = (type) => {
  return CHANNEL_TYPE[CHANNEL_NAME_MAP[type]].ROOT_PATH;
};

const getAssetRootUrl = (type) => {
  return getDataSource(type).replace(/^\.\//, "");
};

const readJSON = (filepath, fallback = []) => {
  try {
    const data = jsonFile.readFileSync(filepath);
    // console.log(`Successfully read JSON file: ${filepath}`);
    return data;
  } catch (error) {
    console.error(`Failed to read JSON file: ${filepath}`);
    return fallback;
  }
};

const readCSV = (filepath, fallback = []) => {
  const fullPath = path.resolve(DATA_DIR, filepath);
  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    return parseCSV(raw, { columns: true });
  } catch (error) {
    console.error(`Failed to read CSV file: ${fullPath}`);
    return fallback;
  }
};

const data = {
  users: [...readJSON(`${FOLDER.USERS}/users.json`)],
  ...Object.entries(channelNames).reduce((acc, [key, value]) => {
    const basePath = getDataSource(key);
    acc[key] = [
      ...readJSON(`${basePath}/unArchiveList.json`),
      ...readJSON(`${basePath}/archiveList.json`),
    ];
    return acc;
  }, {}),
};

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(
  "/json_data",
  express.static(path.join(__dirname, "../..", "json_data"))
);

app.use("/", (req, res, next) => {
  res.locals = {
    ...res.locals,
    ...helpers,
    getAssetRootUrl,
    startTs: Date.now(),
    breadcrumbs: [{ text: "Home", href: "/" }],
    data,
  };
  next();
});

app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    messageTypes: channelNames,
    count: Object.keys(channelNames).length,
    ...res.locals,
  });
});

app.use("/list/:type", (req, res, next) => {
  const { type } = req.params;
  if (!channelNames[type]) {
    return res.status(404).send("Not Found");
  }
  res.locals.breadcrumbs.push({
    href: `/list/${type}`,
    text: channelNames[type],
  });
  res.locals.type = type;
  next();
});

app.get("/list/:type", (req, res) => {
  const { type } = req.params;
  const title = channelNames[type];
  res.render("channel-list", {
    type,
    title,
    count: data[type].length,
    ...res.locals,
  });
});

app.use("/list/:type/channel/:channelId", (req, res, next) => {
  const { type, channelId } = req.params;
  const channel = res.locals.data[type].find((c) => c.id === channelId);
  if (!channel) {
    return res.status(404).send("Not Found");
  }
  const archived = channel.is_archived ? "archive" : "unarchive";
  Object.assign(res.locals, {
    archived,
    channelId,
    channel,
  });
  res.locals.breadcrumbs.push({
    href: `/${type}/channel/${channelId}`,
    text: helpers.getChannelName.call(res.locals, type, channel),
  });
  next();
});

app.get("/list/:type/channel/:channelId", (req, res) => {
  const { channel, type } = res.locals;
  const { archived } = res.locals;
  const baseDir = `${getDataSource(type)}/${archived}/messages/${channel.id}`;
  const dirPath = baseDir;
  const messageGroups = [];
  let count = 0;
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    fs.readdirSync(dirPath).map((subDir) => {
      // console.log("processing channel subdir", subDir);
      const subDirPath = path.resolve(dirPath, subDir);
      const stats = fs.statSync(subDirPath);
      if (stats.isDirectory()) {
        const groupMessages = [];
        if (
          fs.existsSync(subDirPath) &&
          fs.statSync(subDirPath).isDirectory()
        ) {
          fs.readdirSync(subDirPath)
            .filter((filename) => filename.endsWith(".json"))
            .forEach((filename) => {
              const messages = readJSON(`${baseDir}/${subDir}/${filename}`);
              groupMessages.push(...messages);
            });
          messageGroups.push({
            name: subDir,
            type: "group",
            messages: groupMessages,
          });
          count += groupMessages.length;
        }
      }
    });
  }
  res.render("channel", {
    ...res.locals,
    title: helpers.getChannelName.call(res.locals, type, channel),
    count,
    messageGroups,
  });
});

app.listen(PORT, HOSTNAME, () => {
  const url = `http://${HOSTNAME}:${PORT}`;
  if (OPEN) {
    const openCommand =
      process.platform == "darwin"
        ? "open"
        : process.platform == "win32"
        ? "start"
        : "xdg-open";
    require("child_process").exec(`${openCommand} ${url}`);
  }
  console.log(`Server is running on ${url}`);
});
