import express from 'express';
import createLogger from './utils.js';

const infoRouter =express.Router();
const loggerW =createLogger('DEV')

infoRouter.get("/", (req, res) => {

  const info = {
    argv: process.argv,
    execPath: process.execPath,
    platform: process.platform,
    processId: process.pid,
    version: process.version,
    projectDir: process.cwd(),
    reservedMemory: process.memoryUsage().rss,
  };

  loggerW.info(info)
  res.send(info);
});

export default infoRouter;