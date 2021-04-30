import { Rcon } from "rcon-client"
const config = require("./config.json");

const rcon = new Rcon({ host: config.host, port: config.port, password: config.password })

testCommand('authme recent')

async function testCommand(command) {
    await rcon.connect()
    let response = ''
	await rconPost(command).then(r => {response = r})
    console.log(response)
    rcon.end()
    let players = response.split('- ')
    players.shift()
    let latestPlayers = []
    players.forEach(p => {
        let name = p.split(' (')[0].split(' ')[0]
        let ipmask = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
		let ip = p.match(ipmask)
        latestPlayers.push(name+', ip:'+ip)
    })
    console.log(latestPlayers)
}

async function rconPost(msg) {
	let response = ''
	await rcon.send(msg).then(e => {
		response = e
	})
	return response
}