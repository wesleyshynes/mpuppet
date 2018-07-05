require('dotenv').config()
const puppeteer = require('puppeteer');

var laBidders = {}

async function openPage(url,time){
	const browser = await puppeteer.launch({
		headless: false,
		args: [
			'--window-size=1200,800'
		]
	})
	const page = await browser.newPage()
	page.setViewport({width:1200,height:800})
	await page.goto(url)

	//await page.waitFor(time)
	await page.waitFor(() => document.querySelectorAll('input').length)

	await page.type('[name=u]',process.env.LA_USER)
	await page.type('[name=p]',process.env.LA_PASS)
	
	await page.waitFor(time)
		
	await page.evaluate(()=>{
		document.querySelectorAll('.blue-btn')[0].click()
	})
	await page.waitFor(time)
		
	await page.type('[name=pin]',process.env.LA_PIN)
	
	await page.evaluate(()=>{
		document.querySelectorAll('.blue-btn')[0].click()
	})
	
	await page.waitFor(time)
	
	await page.goto('http://classic.liveauctioneers.com/auctioneers/house-bidders-6087.html')
	
	await page.waitFor(() => document.querySelectorAll('.tab2_left_unsel').length)
	
	await page.evaluate(()=>{
		document.querySelectorAll('.tab2_left_unsel')[0].click()
	})
	
	await page.waitFor(() => document.querySelectorAll('#bList .bidder').length)
	
	await page.evaluate(()=>{
		document.querySelectorAll('.name a')[0].click()
	})
	let anotherOne = false
	let count = 0
	while(!anotherOne && count < 10){
		await page.waitFor(() => document.querySelectorAll('h3').length)
		console.log('counter ' + count)
		await page.waitFor(time)
		let bidderInfo = await page.evaluate(()=>{
			let bidderInfo = {}
			let bidderName = document.querySelectorAll('#bList h3')[0].innerText
			bidderInfo.name = bidderName
			let bidderTable = document.querySelectorAll('#bList table table')[1].childNodes[1].childNodes
			for(let i = 2; i < bidderTable.length && bidderTable[i].id!='paddle_row'; i+=2){
				bidderInfo[bidderTable[i].childNodes[1].innerText.replace(':','')] = bidderTable[i].childNodes[3].innerText
			}
			console.log(bidderInfo)
			return bidderInfo
		})
		laBidders[bidderInfo.Username] = bidderInfo
		await page.waitFor(time)
		//console.log(laBidders)
		anotherOne = await page.evaluate(()=>document.getElementById('profile_next').disabled)
		if(!anotherOne){
			await page.evaluate(()=>{
				document.getElementById('profile_next').click()
			})
		}
		count++
	}
		
	console.log(laBidders)
	//await page.waitFor(time)
	//await browser.close()
	
}

openPage('https://classic.liveauctioneers.com/user/login.html?url=/auctioneers/',3000)