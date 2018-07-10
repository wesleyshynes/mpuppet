require('dotenv').config()
const puppeteer = require('puppeteer');
const fs = require('fs');

var laBidders = {}

//==== LIVE AUCTIONEERS BIDDERS ======//
async function liveAuctioneersBidders(url,time){
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
		
	await page.goto('http://classic.liveauctioneers.com/auctioneers/house-bidders-6087.html?o=t&pagenum=1&s=approved')

	await page.waitFor(() => document.querySelectorAll('.other_pages').length)
	
	let bidderPages = await page.evaluate(()=>{
		let paginationList = [...document.querySelectorAll('.other_pages')]
		return paginationList.pop().innerText
	})
	
	for(let i = 1; i <= bidderPages; i++){
	//for(let i = 1; i <= 1; i++){
		
		console.log(' ====== STARTING PAGE ' + i)
		await page.goto(`http://classic.liveauctioneers.com/auctioneers/house-bidders-6087.html?o=t&pagenum=${i}&s=approved`)
		
		await page.waitFor(() => document.querySelectorAll('.other_pages').length)
		
		await page.evaluate(()=>{
			document.querySelectorAll('.name a')[0].click()
		})
		let anotherOne = false
		let count = 0
		while(!anotherOne && count < 50){
			await page.waitFor(() => document.querySelectorAll('h3').length)
			console.log('counter ' + count)
			await page.waitFor(time)
			let bidderInfo = await page.evaluate(()=>{
				let bidderInfo = {}
				let bidderName = document.querySelectorAll('#bList h3')[0].innerText.replace(/,/g,' ')
				bidderInfo.name = bidderName
				
				//console.log('Got bidder Name ' + bidderName)
				
				let bidderTable = document.querySelectorAll('#bList table table')[1].childNodes[1].childNodes
				for(let i = 2; i < bidderTable.length && bidderTable[i].id!='paddle_row'; i+=2){
					let fieldTitle = bidderTable[i].childNodes[1].innerText.replace(':','')
					let fieldData = bidderTable[i].childNodes[3].innerText
					if(fieldTitle == 'Address'){
						fieldData = fieldData.split('\n')
						bidderInfo['Address'] = fieldData[0].replace(/,/g,'-')
						let cityStateZipCountry = fieldData.pop().split(',').map(x=>x.trim())
						for(let j = 1; j < fieldData.length; j++){
							bidderInfo['Address'+(j+1)] = fieldData[j].replace(/,/g,' ')
						}
						//cityStateZipCountry[1] = cityStateZipCountry[1].split(' ')
						bidderInfo['City'] = cityStateZipCountry[0]
						bidderInfo['Country'] = cityStateZipCountry.pop()
						let stateZip = cityStateZipCountry.pop().split(' ')
						bidderInfo['Zip'] = stateZip.pop()
						bidderInfo['State'] = stateZip.join(' ')
						
						continue						
					}				
					bidderInfo[fieldTitle] = fieldData.replace(/,/g,';')
				}
				//console.log(bidderInfo)
				return bidderInfo
			})
			laBidders[bidderInfo.Username] = bidderInfo
			//await page.waitFor(time)
			console.log(bidderInfo)
			anotherOne = await page.evaluate(()=>document.getElementById('profile_next').disabled)
			if(!anotherOne){
				await page.evaluate(()=>{
					document.getElementById('profile_next').click()
				})
			}
			count++
		}
	}
	
	//console.log(laBidders)
	fs.writeFileSync('D://node/mpuppet/data/live_auctioneers_bidders.json', JSON.stringify(laBidders));
	fs.writeFileSync('D://node/mpuppet/data/live_auctioneers_bidders.csv', j2c(laBidders));
	await page.waitFor(time)
	await browser.close()
	
}


function j2c(data){

	let headers = ['name','Username','Address','Address2','City','State','Zip','Country','Mobile tel','Tel','Tel 2','Tax ID']
	let fields = {}
	headers.forEach(x=>{fields[x]=1})
	//let headers = []
	let output = [headers]
	Object.keys(data).forEach(x=>{
		Object.keys(data[x]).forEach(y=>{
			if(!fields[y]){
				fields[y]=1
				headers.push(y)
			}
		})
		output.push( headers.map(z=> data[x][z] ? "" + data[x][z] : "" ).join(',') )
	})
	output[0] = output[0].join(',')
	console.log(output)
	return output.join('\r')
}

//==== INVALUABLE BIDDERS ======//
async function invaluableBidders(url,time){
	
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
	await page.waitFor(() => document.querySelectorAll('#login').length || document.querySelectorAll('#mainMenuFull').length)
		
	let loggedIn = await page.evaluate(()=>{
		if(document.querySelectorAll('#login').length)return false		
		return true
	})
	
	if(!loggedIn){
		await page.type('[name=houseName]',process.env.INV_HOUSEID)
		await page.type('[name=username]',process.env.INV_USER)
		await page.type('[name=password]',process.env.INV_PASS)
		await page.evaluate(()=>{
			document.querySelectorAll('#login .button')[0].click()
		})
	}
	await page.waitFor(time)
	await page.goto('https://www.invaluableauctions.com/al/bidders/viewBidderGroups.cfm?mode=approvals')
	//[...document.getElementsByClassName('pendingBidderLink')].filter(x=> x.href.indexOf('approvalID')>-1)
	//[...document.getElementsByTagName('td')].map( x=>{ if(x.innerText.indexOf('Personal Information')>-1 && x.innerHTML.indexOf('<td>')==-1)console.log(x.innerText.split('\n'))} )
	
	// DROPDOWN SELECTOR
	//await page.select('#telCountryInput', 'my-value')
	
	await page.waitFor(time)
	await browser.close()
}

//liveAuctioneersBidders('https://classic.liveauctioneers.com/user/login.html?url=/auctioneers/',2000)

invaluableBidders('https://www.invaluableauctions.com/index.cfm',2000)





