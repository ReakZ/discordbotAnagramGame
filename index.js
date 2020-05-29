const Discord = require("discord.js");
const bot = new Discord.Client();
const db = require("mongoose");
const baseUsers = require("./baseUsers.js");
const questions = require("./questions.js");

let config = require("./botconfig.json");
let commands = require("./commands.json");

let token = config.token;
let prefix = config.prefix;
const dburl = config.mongo;
//создаём ссылку-приглашение для бота

let Round = {
  question: "???",
  answer: "***",
  isStart: false,
};

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function RandChar(str) {
  let massiv = str.split("");
  let result = [];
  for (let a = 0; a < massiv.length; a++) {
    let i = randomNumber(0, massiv.length);
    while (result[i] !== undefined) {
      i = randomNumber(0, massiv.length);
    }
    result[i] = massiv[a];
  }
  return result;
}

async function newRound() {
  let counQustions = await questions.count({});
  let idQustion = randomNumber(1, counQustions);
  let quest = await questions.findOne({ id: idQustion });
  Round.answer = quest.question;
  Round.question = await RandChar(Round.answer).join("");
  Round.isStart = true;
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
  if (msg.content === prefix + "инфо") {
    msg.reply(commands.info);
  }
  if (msg.content === prefix + "таблица") {
    let users = await baseUsers.find({});
    msg.reply(users);
  }
  if (msg.content === prefix + "старт") {
    if (Round.isStart) {
      msg.reply(`Игра уже начата! Слово для разгадывания: ${Round.question}`);
    } else {
      await newRound();
      msg.channel.send(`Слово для разгадывания: ${Round.question}`);
    }
  }

  if (msg.content === prefix + "счет") {
    let currentUser = await baseUsers.findOne({ userId: msg.author.id });

    if (currentUser) msg.reply(`Твой счет: ${currentUser.score}`);
    else {
      msg.reply(`Ты еще не играл`);
    }
  }

  if (msg.content === prefix + "лидеры") {
    let list = await baseUsers.find({});
    let formated = list.map(
      (x) => `* ${x.userName} - Кол.во очков:${x.score}\n`
    );
    msg.channel.send(["Таблица очков:", ...formated]);
  }

  if (Round.isStart && msg.content.trim() === Round.answer) {
    try {
      let userWinner = await baseUsers.findOne({ userId: msg.author.id });
    } catch (e) {
      console.log(e);
    }

    if (userWinner) {
      let userScore = userWinner.score + 1;

      await baseUsers.findOneAndUpdate(
        { userId: msg.author.id },
        { $set: { score: userScore } }
      );
      msg.reply("Вы дали правильный ответ !");
      Round.isStart = false;
      await newRound();
      msg.channel.send(`Слово для разгадывания: ${Round.question}`);
    } else {
      let newUser = new baseUsers({
        userId: msg.author.id,
        userName: msg.author.username,
        score: 1,
      });
      newUser.save().then((x) => msg.reply("Добро пожалoвать в игру"));
    }
  }
});
bot.login(token);
