let Ds = require('discord.js')
let Cl = new Ds.Client();
let channel:any;
let data = require('../config/bot_data')

Cl.on('ready', () => {
  channel = Cl.channels.cache.get(data.ID);
})

Cl.login(data.token);

function logs_(str:string) {
    channel.send(`ERROR 발생!! 내용 : ${str} \n @everyone`);
}



module.exports = logs_;