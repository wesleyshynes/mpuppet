const puppeteer = require('puppeteer');

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
		
	await page.type('[name=q]','eggs benedict')
	
	await page.waitFor(time)
		
	await page.evaluate(()=>{
		document.querySelector('[name=btnK]').click()
	})
	await page.waitFor(time)
	
	await browser.close()
	
}

openPage('https://google.com',3000)