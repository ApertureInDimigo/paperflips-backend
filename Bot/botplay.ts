///////////////// 서버에 에러가 발생했을때를 대비한 디스코드 봇. 서버에 에러가 발생하면 logs_() 함수를 호출해서 디스코드 봇으로 알려줌.

  let Ds = require('discord.js') //디스코드 SDK
  let Cl = new Ds.Client(); //봇 객체 
  let channel:any; //채팅 채널 프로퍼티 
  let channel_2:any;
  let data = require('../config/bot_data') //봇의 토큰을 보관..
  
  Cl.on('ready', () => { //서버가 시작되면 채팅 객체를 받아옴 
    channel = Cl.channels.cache.get(data.chatID);
    channel_2 = Cl.channels.cache.get(data.logID);
  })
  
  Cl.login(data.token); //디스코드 로그인 
  
  export function logs_(str:string) { //에러 시 호출되는 함수 
      channel.send(`ERROR 발생!! 내용 : ${str} \n @everyone`);
  }
  
export function logs_http(message:string):void {
   channel_2.send(message)
}

