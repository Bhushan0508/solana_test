(function ($, window, document) {
  $(async function () {
    const socket = io();

    function getStatusBadge(status) {
      status = "Available";
      switch (status) {
        case "stopped":
          return `<span class="badge badge-danger">${status}</span>`;
        case "online":
          return `<span class="badge badge-success">${status}</span>`;
        default:
          return `<span class="badge badge-default">${status}</span>`;
      }
    }

    function getActionButton(status) {
      if (status === "online") {
        return `
          <button type="button" class="btn btn-outline-danger" data-action="stop" title="stop">
            <i class="bi bi-pause-circle"></i>
          </button>
          <button type="button" class="btn btn-outline-warning" data-action="tail-log" title="show log">
            <i class="bi bi-terminal"></i>
          </button>
      `;
      }
      return `
          <button type="button" class="btn btn-outline-primary" data-action="start" title="start">
            <i class="bi bi-play-circle"></i>
          </button>
      `;
    }

    async function updateMinersStatus() {
      const response = await fetch('/miners');
      const miners = await response.json();

      const trs = [];
      if(document.processToName == null){
        document.processToName =new Map();
      }

      for (const miner of miners) {
        
        if(document.processToName.size ==0 ){
        document.processToName.set(miner,'miner01.js');
        }
      else{
        if(document.processToName.size ==1 ){
          document.processToName.set(miner,'miner02.js');
        }
      }
      console.log('pm2_env '+miner.pm2_env.total );
        trs.push(`
          <tr id="${miner.name}">
                <td><img src="${miner.name}"/></td>
                <td>${getStatusBadge(miner.pm2_env.status)}</td>
                <td>
                    <div class="btn-group">
                        <button type="button" class="btn btn-default btn-sm">
                          Supply: ${miner.pm2_env.total!=-1 ? miner.pm2_env.total : 'N/A'}
                        </button>
                        <button type="button" class="btn btn-default btn-sm">
                          Minted: ${miner.pm2_env.minted!=-1 ? miner.pm2_env.minted  + ' ' : 'N/A'}
                        </button>
                      </div>
                </td>
                <td>
                    ${getActionButton(miner.pm2_env.status)}
                    <button type="button" class="btn btn-outline-success" data-action="restart" title="restart">
                      <i class="bi bi-arrow-repeat">Update</i>
                    </button>
                    <button type="button" class="btn btn-outline-success" data-action="mint" title="mint">
                      <i class="bi bi-arrow-repeat">Mint</i>
                    </button>
                    <button type="button" class="btn btn-outline-success" data-action="stake" title="stake">
                      <i class="bi bi-arrow-repeat">Stake</i>
                    </button>
                    <button type="button" class="btn btn-outline-success" data-action="upload" title="upload">
                      <i class="bi bi-arrow-repeat">Upload</i>
                    </button>

                </td>
            </tr>
        `);
      }

      $('#tbl-miners tbody').html(trs.join(''));
    }

    function showStdLog(process) {
      const $console = $('#console');
      $console.empty();
      socket.removeAllListeners();

      socket.on(`${process}:out_log`, (procLog) => {
        $console.append(`<p id="console-text">${procLog.data}</p>`);
        $('#console-background').animate({ scrollTop: $console[0].scrollHeight + 1000 }, 500);
      });
    }

    updateMinersStatus();

    setInterval(() => {
      updateMinersStatus();
    }, 15 * 1000);

    $(document).on('click', 'button', async function () {
      const self = $(this);
      const action = self.data('action');
      process = self.parents('tr').attr('id');

      console.log('before action check '+action);

      if (!action) {
        return;
      }

      if (action && process && ['start', 'stop', 'restart','upload','stake','mint','upload'].indexOf(action) >= 0) {
        try {
          console.log('Before process'+process);
          if(document.processToName.has(process) == true){
            console.log('Has process ');
          process = document.processToName.get(process);
          }
          else {
            process='miner01.js';
          }
          console.log('processToName '+document.processToName.toString());
          console.log('Action Clicked '+action+' filename '+process);
          const response = await fetch(`/miners/${process}/${action}`, { method: 'PUT' });
          const data = await response.json();
          if (response.status !== 200) {
            throw new Error(data.message);
          }
          updateMinersStatus();
        } catch (error) {
          alert(error.message);
        }
      }

      if (action === 'tail-log') {
        showStdLog(process);
      }
    });
  });
}(window.jQuery, window, document));
