const Discord = require("discord.js");
import { Rcon } from "rcon-client"
const config = require("./config.json");

const client = new Discord.Client();

const prefix = "!";

const rcon = new Rcon({ host: config.host, port: config.port, password: config.password })

const adminAccounts = [
	"proxynexus",
	"pmb"
]

const modCommands = [
	"commands",
	"ban",
	"ban-ip",
	"checkban",
	"getip",
	"setpassword"
]


client.on("ready", () => {
	console.log("Ready")
	tryConnection()
});

client.on("message", msg => {
	if (!msg.content.startsWith(prefix)) return
	const commandBody = msg.content.slice(prefix.length)
	const args = commandBody.split(' ')
	const command = args.shift().toLowerCase()

	let action = {
		type:command,
		user:args[0],
		reason:args[1] || ''
	}

	console.log(action)


	if (msg.channel.id === config.rconChannel){
		if (checkRole(msg.member.roles._roles,config.adminRole)){
			//admin commands
			switch(action.type) {
				case 'ban':
					banPlayer(msg, action.user, action.reason)
					break
				case 'ban-ip':
					banPlayerByIP(msg, action.user, action.reason)
					break
				case 'checkban':
					checkBan(msg, action.user)
					break
				case 'getip':
					getIp(msg, action.user)
					break
				case 'setpassword':
					changePassword(msg, action.user)
					break
				case 'unban':
					unbanBan(msg, action.user)
					break
				case 'commands':
					msg.reply(
					`\nДоступные команды:\n!ban <ник> <причина> - глобальный бан аккаунта\n!ban-ip <ник>  <причина> - глобальный бан аккаунта по IP\n!checkban <ник> - проверка бана\n!unban <ник> - разбанить(так же снимает бан по IP)\n!getip <ник> - получить IP игрока\n!setpassword <ник> - установить временный пароль`)
					break
				default:
					msg.reply(`Неправильная команда, список команд доступен по !commands`)
					break
			}
		}
		//moderator commands
	  	else if (checkRole(msg.member.roles._roles,config.modRole)){
			switch(action.type) {
				case 'ban':
					banPlayer(msg, action.user, action.reason)
					break
				case 'ban-ip':
					banPlayerByIP(msg, action.user, action.reason)
					break
				case 'checkban':
					checkBan(msg, action.user)
					break
				case 'getip':
					getIp(msg, action.user)
					break
				case 'setpassword':
					changePassword(msg, action.user)
					break
				case 'commands':
					msg.reply(
					`\nДоступные команды:\n!ban <ник> <причина> - глобальный бан аккаунта\n!ban-ip <ник> <причина> - глобальный бан аккаунта по IP\n!checkban <ник> - проверка бана\n!getip <ник> - получить IP игрока\n!setpassword <ник> - установить временный пароль`)
					break
				default:
					msg.reply(`Неправильная команда, список команд доступен по !commands`)
					break
			}
		}
	}
})

function checkRole(roles, role) {
	let check = false
	roles.map(r => {
		if(r.id == role) {
			check = true
		}
	})
	return check
}

//RCON Commands
async function banPlayer(msg, player, reason){
	if(!adminAccounts.includes(player.toLowerCase())){
		await rcon.connect()
		let response = ''
		await rconPost('cmi ban '+player+' '+reason).then(r => {response = r})
		let discordResponse = 'Игрок '+player+' был забанен по причине: '+reason+'.'
		msg.reply(discordResponse)
		rcon.end()
	} else {
		msg.reply(`Ага, вот прям сейчас, взяли и забанили админа.`)
	}
}
async function banPlayerByIP(msg, player, reason){
	if(!adminAccounts.includes(player.toLowerCase())){
		await rcon.connect()
		let response = ''
		await rconPost('cmi ipban '+player+' '+reason).then(r => {response = r})
		let discordResponse = 'Игрок '+player+' был забанен по IP по причине: '+reason+'.'
		msg.reply(discordResponse)
		rcon.end()
	} else {
		msg.reply(`Ага, вот прям сейчас, взяли и забанили админа.`)
	}
}
async function getIp(msg, player){
	if(!adminAccounts.includes(player.toLowerCase())){
		await rcon.connect()
		let response = ''
		await rconPost('authme getip '+player).then(r => {response = r})
		let discordResponse = ''
		if(response.search('is not registered') == '-1'){
			let ipmask = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
			let t = response.match(ipmask)
			discordResponse = 'Игрок '+player+' последний раз заходил с IP: '+t[0]+'. Зарегистрирован с IP: '+t[0]+'.'
		} else {
			discordResponse = 'Игрок с ником '+player+' не найден.'
		}
		msg.reply(discordResponse)
		rcon.end()
	} else {
		msg.reply(`Нет уж, это мы тебе не расскажем.`)
	}
}
async function changePassword(msg, player){
	if(!adminAccounts.includes(player.toLowerCase())){
		await rcon.connect()
		let response = ''
		await rconPost('authme password '+player+' temp123').then(r => {response = r})
		console.log(response)
		let discordResponse = 'Временный пароль игрока '+player+' установлен на temp123.'
		msg.reply(discordResponse)
		rcon.end()
	} else {
		msg.reply(`Ага, конечно.`)
	}
}
async function checkBan(msg, player){
	await rcon.connect()
	let response = ''
	await rconPost('cmi checkban '+player).then(r => {response = r})
	let discordResponse = ''
	if(response.search('not banned') != '-1'){
		discordResponse = 'Игрок '+player+' не забанен.'
	} else if(response.search('Banned for') != '-1') {
		let reas = response.split('§e')
		let reason = reas[3].split('§6')
		let bandate = reas[5].split('§6')
		discordResponse = 'Игрок '+player+' в бане по причине: '+reason[1].replace('\n', '')+'. Дата/время бана: '+bandate[1].replace('\n', '')+'.';
	} else {
		discordResponse = 'Игрок с ником '+player+' не найден.'
	}
	msg.reply(discordResponse)
	rcon.end()
}
async function unbanBan(msg, player){
	await rcon.connect()
	let response = ''
	await rconPost('cmi unban '+player).then(r => {response = r})
	let discordResponse = ''
	if(response.search('unbanned') != '-1'){
		discordResponse = 'Игрок '+player+' разбанен.'
	} else if(response.search('not banned') != '-1') {
		discordResponse = 'Игрок '+player+' не был в бане.'
	} else {
		discordResponse = 'Игрок с ником '+player+' не найден.'
	}
	msg.reply(discordResponse)
	rcon.end()
}

// Try RCON connection
async function tryConnection(){
	try {
		await rcon.connect()
	}
	catch(e){
		console.log('RCON unavailable')
	}
	rcon.end()
}

// Listeners for errors
rcon.on('error', function(err) {
	console.log('ERROR: ', err)
})

//RCON post
async function rconPost(msg) {
	let response = ''
	await rcon.send(msg).then(e => {
		response = e
	})
	return response
}

client.login(config.token);