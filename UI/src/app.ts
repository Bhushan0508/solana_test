import express from 'express';
import pm2Lib from './pm2Lib';
import socketIO from './socketIO';

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/miners', async (req, res) => {
  res.json(await pm2Lib.getProcesses());
});

app.put('/miners/:filename/:action(start|restart|stop|mint|stake|upload)', async (req, res) => {
  try {
    const { filename, action } = req.params;

    switch (action) {
      case 'start':
        res.json(await pm2Lib.startProcess(filename));
        break;
      case 'restart':
        console.log('File Name in app.ts '+filename);
        res.json(await pm2Lib.restartProcess(filename));
        break;
      case 'stop':
        res.json(await pm2Lib.stopProcess(filename));
        break;
      case 'mint':
          console.log('Minting request from the client');
          res.json(await pm2Lib.mintNFT(filename));
          break;
      case 'stake':
        console.log('Staking request from the client');
        res.json(await pm2Lib.stakeNFT(filename));
        break;
      case 'upload':
        console.log('Upload request from the client');
        res.json(await pm2Lib.uploadNFT(filename));
        break;
      default:
        return res.status(400).json({ message: `${action} is not supported!` });
    }
  } catch (error) {
    res.status(500).json({ message: (error[0] || error).message });
  }
});


const PORT = process.env.PORT || 3000;

const httpServer = app.listen(PORT, () => {
  console.log(`[Server] Listening on :${PORT}`);
});

socketIO.init(httpServer);
