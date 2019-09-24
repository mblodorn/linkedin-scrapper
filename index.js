require('dotenv').config()
const puppeteer = require('puppeteer')
const scrapedin = require('scrapedin')
const fs = require('fs')
const email = process.env.EMAIL
const password = process.env.PASSWORD

const test = async () => {
    const browser = await puppeteer.launch({ headless: true })

    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8' })
    await page.setViewport({
        width: 1360,
        height: 768
    })


    await page.goto('https://www.linkedin.com/login')

    await page.$('#username')
        .then((emailElement) => emailElement.type(email))
    await page.$('#password')
        .then((passwordElement) => passwordElement.type(password))

    await page.$x("//button[contains(text(), 'Sign in')]")
        .then((button) => button[0].click())

    await page.waitForNavigation()

    await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/')


    let profiles = await page.evaluate(() => {
        const profiles = []
        Array.from(document.getElementsByClassName('mn-connection-card', i => i)).forEach(profile => {
            const profileLink = profile.getElementsByClassName('mn-connection-card__picture')[0].href
            const profileName = profile.getElementsByClassName('mn-connection-card__name')[0].innerHTML.replace('      \\n', '').replace('\\n    ', '')
            const occupation = profile.getElementsByClassName('mn-connection-card__occupation')[0].innerHTML
            profiles.push({ profileLink, profileName, occupation })
        })
        return profiles
    })

    const profileScraper = await scrapedin({ email, password })

    const promises = []

    const contacts = []
    //for tests
    profiles = profiles.slice(0, 5)

    for (profile of profiles) {
        const data = await profileScraper(profile.profileLink)
        console.log('fetching next contact')
        contacts.push(data)
    }
    console.log(contacts)

    fs.writeFile('./result.json', JSON.stringify(contacts), err => {
        console.log(err)
    })
}

test()
