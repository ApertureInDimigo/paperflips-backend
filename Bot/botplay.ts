let Ds = require('discord.js')
let Cl = new Ds.Client();
let channel:any;
let data = require('../config/bot_data')

Cl.on('ready', () => {
  channel = Cl.channels.cache.get(data.ID);
  channel.send('BOT LOGIN')
})

Cl.login(data.token);

function logs_(str:string) {
    channel.send(str);
}



module.exports = logs_;