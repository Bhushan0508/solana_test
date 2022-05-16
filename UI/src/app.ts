// ./src/app.ts
import express from 'express';
import pm2Lib from './pm2Lib';
const app = express();
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.redirect('/index.html');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] Listening on :${PORT}`);
});
app.get('/miners', async (req, res) => {
  res.json(await pm2Lib.getProcesses());
});

app.put('/miners/:filename/:action', async (req, res) => {
  try {
    const { filename, action } = req.params;
    //.log('file Name '+filename +' , action '+action);
    switch (action) {
      case 'start':
        res.json(await pm2Lib.startProcess(filename));
        break;
      case 'restart':
        res.json(await pm2Lib.restartProcess(filename));
        break;
      case 'stop':
        res.json(await pm2Lib.stopProcess(filename));
        break;
      default:
        return res.status(400).json({ message: `${action} is not supported!` });
    }
  } catch (error) {
    res.status(500).json({ message: (error[0] || error).message });
  }
});