# Requirement
- nodejs v20.17.0+
- npm v10.8.2
- Slack Token

# Slack Data Folder Structure
`json_data` folder is Slack Data Root Path. Here're 4 sub-folders in it. 
- `users` - All Slack Users Data
- `channels` - Public Channel and Private Channel Data
- `direct_message`- 1:1 Private Chat Data
- `multi_direct_message` - Private chat for more than 2 people Data
---
## 4 Channel Type's Data Directory Description
Here are 4 channel types
- `public_channel`
- `private_channel`
- `direct_message` 1:1 private chat
- `multi_direct_message` more than 2 members private chat

Each type has same folder structure as below:

**All data At the root folder, here are 2 sub-folder, 2 json files and 2 csv files**

> Files and sub-folders sorted by archiving status, `archive` and `un-archive`
> 
> If no data in a channel type, the sub-folder, json and csv files will not be created

### JSON Files is slack data
- `archiveList.json`
- `unArchiveList.json`

### CSV Files is checklist
- `archiveList.csv`
- `unArchiveList.csv`

### Sub Folder
- `archive`
- `uncarchive`

>Each folder has 2 folders and 1 csv file
>
>These will be created when fetch data completed

#### `message` Directory structure
- **Root directory**: Create folders for each channel ID
- **Second-level directory**: Create folders for each Thread based on ts
- **Json file**: The file name in the directory is a json file named ts of Thread, which contains `thread` and all the`reply` data belonging to it

#### `threads` Directory structure
- **Json file**： The file name in the directory is a json file named ts of Thread, which only contains `thread` data 
  in current channel id

#### `files.csv` 
- This CSV list records all the file URLs uploaded in threads and replies, the downloaded file paths, and the corresponding relationships of the files to their respective channels, threads, or reply messages

### Command
- `npm run public` Get Public Channel Data
- `npm run private` Get Private Channel Data
- `npm run dm` Get Direct Message Data
- `npm run mdm` Get Multi Direct Message Data


---
## Folder `users` 
Here're 4 json files and 3 csv files 
- `active_users.json` 
- `bot_users.json`
- `delete_users.json` 
- `users.json` This is collection file, it includes `active_users.json` `bot_users.json` `delete_users.json`

CSV Files is checklist
- `active_users.csv`
- `bot_users.csv`
- `delete_user.csv`

### Command
```
npm run users
```

