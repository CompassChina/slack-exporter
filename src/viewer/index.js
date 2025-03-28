const express = require("express");
const jsonFile = require("jsonfile");
const path = require("node:path");
const helpers = require("./helpers");
const fs = require("node:fs");
const { parse: parseCSV } = require("csv-parse/sync");

const PORT = parseInt(process.env.PORT) || 3000;
const HOSTNAME = parseInt(process.env.HOSTNAME) || "127.0.0.1";
const OPEN = Boolean(process.env.OPEN) || false;
const DATA_DIR = "json_data/";

const messageTypes = {
  direct_message: "Direct Messages",
  multi_direct_message: "Multi Direct Messages (Groups)",
  private_channel: "Private Channels",
  public_channel: "Public Channels",
};

const readJSON = (filepath, fallback = []) => {
  const fullPath = path.resolve(DATA_DIR, filepath);
  try {
    return jsonFile.readFileSync(fullPath);
  } catch (error) {
    console.error(`Failed to read JSON file: ${fullPath}`);
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
  users: [
    ...readJSON("users/users.json"),
    ...readJSON("users/botUsers.json"),
    ...readJSON("users/deletedUsers.json"),
  ],
  direct_message: [
    ...readJSON("direct_message/unArchiveList.json"),
    ...readJSON("direct_message/archiveList.json"),
  ],
  multi_direct_message: readJSON("multi_direct_message/unArchiveList.json"),
  private_channel: readJSON("private_channel/unArchiveList.json"),
  public_channel: readJSON("public_channel/unArchiveList.json"),
  // Not required for now
  // files: [
  //   ...readCSV("direct_message/unarchive/files.csv"),
  //   ...readCSV("direct_message/archive/files.csv"),
  //   ...readCSV("multi_direct_message/unarchive/files.csv"),
  //   ...readCSV("multi_direct_message/archive/files.csv"),
  //   ...readCSV("private_channel/unarchive/files.csv"),
  //   ...readCSV("private_channel/archive/files.csv"),
  //   ...readCSV("public_channel/unarchive/files.csv"),
  //   ...readCSV("public_channel/archive/files.csv"),
  // ],
};

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(
  "/json_data",
  express.static(path.join(__dirname, "../..", "json_data"))
);

console.log(path.join(__dirname, "../..", "json_data"));

app.use("/", (req, res, next) => {
  res.locals = {
    ...res.locals,
    ...helpers,
    startTs: Date.now(),
    breadcrumbs: [{ text: "Home", href: "/" }],
    data,
  };
  next();
});

app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    messageTypes,
    count: Object.keys(messageTypes).length,
    ...res.locals,
  });
});

app.use("/list/:type", (req, res, next) => {
  const { type } = req.params;
  if (!messageTypes[type]) {
    return res.status(404).send("Not Found");
  }
  res.locals.breadcrumbs.push({
    href: `/list/${type}`,
    text: messageTypes[type],
  });
  res.locals.type = type;
  next();
});

app.get("/list/:type", (req, res) => {
  const { type } = req.params;
  const title = messageTypes[type];
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
  res.locals.channelId = channelId;
  res.locals.channel = channel;
  res.locals.breadcrumbs.push({
    href: `/${type}/channel/${channelId}`,
    text: helpers.getChannelName.call(res.locals, type, channel),
  });
  next();
});

app.get("/list/:type/channel/:channelId", (req, res) => {
  const { channel, type } = res.locals;
  const dirPath = path.resolve(
    DATA_DIR,
    type,
    "unarchive/messages",
    channel.id
  );
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
              const messages = readJSON(
                `${type}/unarchive/messages/${channel.id}/${subDir}/${filename}`
              );
              groupMessages.push(...messages);
            });
          messageGroups.push({
            name: subDir,
            type: "group",
            messages: groupMessages,
          });
          count += 1;
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
