WINIT Test

1. ts-pm2-ui folder contains the files for UI and Node server
    a. "public" folder contains index.html and js/main.js for user interface
    b. "src" folder contains the files for node server

**Installation:**
1. Go to the root folder (ts-pm2-ui)
2. run "yarn" to install dependencies.
Running app
3. run "npm start dev" to start the node server
4. access url http://localhost:3000 to access user interface
   For 1st picture 4 buttons are shown
   a. "Update" button updates the supply of the NFT. The Total is not updated.
   b. "Mint" tries to min the nft. Output only in node console
   c. "Stake" button creates stake account, delegates the stake authority, withdraws the stake authority. Output only in node console
   d. "upload" has the code only to upload image to solana devnet. Doesnt work..

For all the buttons output is shown only in node console.

**NFT Upload**
NFT upload done using sugar app.
Minting NFT works with sugar


Other github.com  projects studies
1.  Staking 
   a. https://github.com/gemworks/gem-farm.git
    This project has the complete bank app/ and farm app which implements staking concepts
    
    b. https://github.com/BadConfig/nft-staking.git
    Another app implementing staking

2. other projects
   cardinal-staking-ui
   nft_staking

Things Done
1. NFT upload and minting using sugar(cmd line program-alternative to candy-machine-v2). 
2. NFT supply updates in the UI 
3. Staking account created,delgate authority, withraw-authority 
Things to do 
1. Ui to update the total supply
2. To stake NFT and calculate the reward per day




