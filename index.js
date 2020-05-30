const Discord = require("discord.js");
const bot = new Discord.Client();

const db = require("mongoose");
const baseUsers = require("./baseUsers.js");
const questions = require("./questions.js");

const utils=require("./utils")
const local=require("./localisation.js")
const config = require("./botconfig.json");
const commands = require("./commands.json");

const token = config.token;
const prefix = config.prefix;
const dburl = config.mongo;
//создаём ссылку-приглашение для бота

let Round = {
  question: "???",
  answer: "***",
  isStart: false,
  tip:null,
  tipPoints:0,
  points:0
};

async function newRound() {
  let counQustions = await questions.count({});
  let idQustion = utils.randomNumber(1, counQustions);
  let quest = await questions.findOne({ id: idQustion });
  Round.answer = quest.question;
  Round.points=quest.question.length
  Round.question = await utils.RandChar(Round.answer).join("");
  Round.isStart = true;
  Round.tipPoints=0
  Round.tip=null
  console.log(Round.answer,Round.points)
}

function getTip(){
    Round.points-=1
    Round.tipPoints+=1
    Round.tip=Round.answer.slice(0,Round.tipPoints)
}

bot.on("ready", () => {
  console.log(`Bot ready -> ${bot.user.username}`);
  bot.generateInvite(["ADMINISTRATOR"]).then((link) => {
    console.log(link);
  });
  try {
    db.connect(dburl, { useNewUrlParser: true, useFindAndModify: false });
    console.log("Data base connect .... OK");
  } catch (e) {
    console.log("Data base connect .... Error!", e);
  }
});

bot.on("message", async (msg) => {
  if (msg.content.toLowerCase() === prefix + local.info) {
    msg.reply(commands.info);
  }
  if (msg.content.toLowerCase() === prefix + local.start) {
    if (Round.isStart) {
      msg.channel.send(`Игра уже начата! \n Слово для разгадывания: ${Round.question} ${Round.tip?`Подсказка: ${Round.tip}`:""}`);
    } else {
      await newRound();
      msg.channel.send(`Слово для разгадывания: ${Round.question} ${Round.tip?`Подсказка: ${Round.tip}`:""}`);
    }
  }

  if (msg.content.toLowerCase() === prefix + local.score) {
    let currentUser = await baseUsers.findOne({ userId: msg.author.id });
    if (currentUser) msg.reply(`У вас ${currentUser.score} очков`);
    else {
      msg.reply(`Вы еще не играли`);
    }
  }

  if (msg.content.toLowerCase() === prefix + local.leadears) {
    let list = await baseUsers.find({});
    let formated = list.sort(utils.compare).slice(0,3).map(
      (x,i) => `${i+1}. ${x.userName} - ${x.score} очков`
    );
    msg.channel.send(["Лидеры:", ...formated]);
  }


  if (Round.isStart && msg.content.toLowerCase() === prefix + local.tip) {
    if(Round.points>1){
      getTip()
    }
    
    else{
      msg.reply('Использованы все подсказки');
    }
    msg.channel.send(`Подсказка:${Round.tip}`);
  }


  if (Round.isStart && msg.content.toLowerCase().trim() === Round.answer) {
    let userWinner
    try {
      userWinner = await baseUsers.findOne({ userId: msg.author.id });
    } catch (e) {
      console.log(e);
    }

    if (userWinner) {
      let userScore = userWinner.score + Round.points;
      await baseUsers.findOneAndUpdate(
        { userId: msg.author.id },
        { $set: { score: userScore } }
      );
      msg.reply(`Вы дали правильный ответ ! Вы получаете ${Round.points} очков.`);
      Round.isStart = false;
      await newRound();
      msg.channel.send(`Слово для разгадывания: ${Round.question}`);
    } else {
      let newUser = new baseUsers({
        userId: msg.author.id,
        userName: msg.author.username,
        score: Round.points,
      });
      await newUser.save()
      msg.reply(`Добро пожалoвать в игру ! Вы получатаете ${Round.points} очков.`)
      Round.isStart = false;
      await newRound();
      msg.channel.send(`Слово для разгадывания: ${Round.question}`);
    }
  }
});
bot.login(token);
