import { watchFile, unwatchFile } from 'fs'  
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 
import { es } from './lib/idiomas/total-idiomas.js' 

//⊱ ━━━━━.⋅ Añada los numeros a ser Propietario ⋅.━━━━ ⊰   

global.owner = [
  ['34671660629', '𝙀𝙡ㅤ𝘾𝙝𝙚𝙢𝙖ㅤ🔱', true],  
  ['50578213790', '𝙊𝙬𝙣𝙚𝙧 (𝙊𝙨𝙤) 💻', true],
  ['50585826826', '𝙎𝙝𝙖𝙧𝙠-𝘽𝙤𝙩ㅤ🦈', true]]

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

global.mods = ['34671660629'] 
global.prems = ['34671660629']
   
  
/*⊱ ━━━━━.⋅ IDIOMA ⋅.━━━━ ⊰  
Agrega el Idioma que quieres que tenga el SharkLite
  es = Español
*/
global.lenguajeGB = es  //<--- [es] Escribir el código de Idioma
 
//━━━━━━━━━━━━━━━━━━━━


global.openai_key = 'sk-0'
/* Consigue tu ApiKey en este enlace: https://platform.openai.com/account/api-keys */

global.openai_org_id = 'org-3'
/* Consigue tu ID de organizacion en este enlace: https://platform.openai.com/account/org-settings */


global.keysZens = ['LuOlangNgentot', 'c2459db922', '37CC845916', '6fb0eff124', 'hdiiofficial', 'fiktod', 'BF39D349845E', '675e34de8a', '0b917b905e6f']
global.keysxxx = keysZens[Math.floor(keysZens.length * Math.random())]
global.keysxteammm = ['29d4b59a4aa687ca', '5LTV57azwaid7dXfz5fzJu', 'cb15ed422c71a2fb', '5bd33b276d41d6b4', 'HIRO', 'kurrxd09', 'ebb6251cc00f9c63']
global.keysxteam = keysxteammm[Math.floor(keysxteammm.length * Math.random())]
global.keysneoxrrr = ['5VC9rvNx', 'cfALv5']
global.keysneoxr = keysneoxrrr[Math.floor(keysneoxrrr.length * Math.random())]
global.lolkeysapi = 'BrunoSobrino' //'SGWN'
global.itsrose = ['4b146102c4d500809da9d1ff']

global.APIs = { 
  xteam: 'https://api.xteam.xyz',
  dzx: 'https://api.dhamzxploit.my.id',
  lol: 'https://api.lolhuman.xyz',
  violetics: 'https://violetics.pw',
  neoxr: 'https://api.neoxr.my.id',
  zenzapis: 'https://api.zahwazein.xyz',
  akuari: 'https://api.akuari.my.id',
  akuari2: 'https://apimu.my.id',	
  fgmods: 'https://api-fgmods.ddns.net',
  botcahx: 'https://api.botcahx.biz.id',
  ibeng: 'https://api.ibeng.tech/docs',	
  rose: 'https://api.itsrose.site',
  popcat : 'https://api.popcat.xyz',
  xcoders : 'https://api-xcoders.site'
},
global.APIKeys = { 
  'https://api.xteam.xyz': `${keysxteam}`,
  'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
  'https://api.neoxr.my.id': `${keysneoxr}`,	
  'https://violetics.pw': 'beta',
  'https://api.zahwazein.xyz': `${keysxxx}`,
  'https://api-fgmods.ddns.net': 'fg-dylux',
  'https://api.botcahx.biz.id': 'Admin',
  'https://api.ibeng.tech/docs': 'tamvan',
  'https://api.itsrose.site': 'Rs-Zeltoria',
  'https://api-xcoders.site': 'Frieren'
}

global.mods = [] 


/*************************/
global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment	

//⊱ ━━━━━.⋅ Sticker WM ⋅.━━━━ ⊰

global.packname = '𝙀𝙡ㅤ𝘾𝙝𝙚𝙢𝙖ㅤ🔱'
global.author = '𝙎𝙝𝙖𝙧𝙠-𝘽𝙤𝙩ㅤ🦈'

//⊱ ━━━━━.⋅ Versión | Nombre | cuentas ⋅.━━━━ ⊰

global.official = [ // Agregate si eres Owner
['34671660629', '𝙀𝙡ㅤ𝘾𝙝𝙚𝙢𝙖ㅤ🔱', 1], 
['50578213790', '𝙊𝙬𝙣𝙚𝙧 (𝙊𝙨𝙤) 💻', 1],  
['50585826826', '𝙎𝙝𝙖𝙧𝙠-𝘽𝙤𝙩ㅤ🦈', 1]] 

global.mail = '' //agrega tú correo
global.desc = '' //agrega una descripción corta
global.desc2 = '' //agrega una descripción larga (Solo se aplicará si su whasapp no tiene descripción)
global.country = '🇳🇮' //agrega tú país ejemplo: 🇳🇮

global.vs = '9.9'
global.vsJB = '3.0'

global.sk = '𝙎𝙝𝙖𝙧𝙠-𝘽𝙤𝙩ㅤ🦈'
global.yt = 'https://youtube.com/@thechema4896'
global.yt2 = 'https://youtube.com/@thechema4896'
global.ig = 'https://www.instagram.com/1alvarez_jose8'
global.md = 'https://github.com/ElChema-Nc/Shark-Bot'

global.nna = 'https://chat.whatsapp.com/JO5LstGfk6RBccr0gjzNwI' //UPDATE SHARKLIKE
global.asistencia = 'Wa.me/34671660629' //Dudas? escríbeme...

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


//⊱ ━━━━━.⋅ Información ⋅.━━━━ ⊰

global.wm = '𝙀𝙡ㅤ𝘾𝙝𝙚𝙢𝙖ㅤ🔱'
global.igfg = '𝙎𝙝𝙖𝙧𝙠-𝘽𝙤𝙩ㅤ🦈'
global.wait = lenguajeGB['smsMeWait']()
global.wait2 = lenguajeGB.smsWait()
global.nomorown = owner[0][0]

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


//⊱ ━━━━━.⋅ IMG ⋅.━━━━ ⊰

global.imagen1 = fs.readFileSync('./media/menus/Menu3.jpg')
global.imagen2 = fs.readFileSync('./media/menus/img1.jpg')
global.imagen3 = fs.readFileSync('./media/menus/img2.jpg')
global.imagen4 = fs.readFileSync('./media/menus/img3.jpg')
global.imagen5 = fs.readFileSync('./media/menus/img4.jpg')
global.imagen6 = fs.readFileSync('./media/menus/img5.jpg')
global.imagen7 = fs.readFileSync('./media/menus/img6.jpg')
global.imagen8 = fs.readFileSync('./media/menus/img7.jpg')
global.imagen9 = fs.readFileSync('./media/menus/img8.jpg')
global.imagen10 = fs.readFileSync('./media/menus/img9.jpg')
global.imagen11 = fs.readFileSync('./media/menus/img10.jpg')
global.imagen12 = fs.readFileSync('./media/menus/img11.jpg')
global.imagen13 = fs.readFileSync('./media/menus/img12.jpg')

//━━━━━━━━━━━━━━━━━━━━


//━━━━━━━━━━━━━━ img ━━━━━━━━━

global.img = 'https://i.ibb.co/J784tdX/img1.jpg'
global.img2 = 'https://i.ibb.co/ryLsVqX/img2.jpg'

global.img3 = 'https://i.ibb.co/SJhrb5x/img3.jpg' //prem
global.img4 = 'https://i.ibb.co/s9vDyph/img4.jpg' //prem

global.img5 = 'https://i.ibb.co/9wLvQY5/img5.jpg'
global.img6 = 'https://i.ibb.co/TRQ7JZV/img6.jpg'
global.img7 = 'https://i.ibb.co/NYJrqWC/img7.jpg'
global.img8 = 'https://i.ibb.co/dkC7xTn/img8.jpg'
global.img9 = 'https://i.ibb.co/587rC6x/img9.jpg'

global.img10 = 'https://i.ibb.co/n0wmyww/img10.jpg'
global.img11 = 'https://i.ibb.co/XtP1Q58/img11.jpg'
global.img12 = 'https://i.ibb.co/8xJCqS7/img12.jpg'
global.img13 = 'https://i.ibb.co/tPgJfbB/img13.jpg'
global.img14 = 'https://i.ibb.co/p3z1zhH/img14.jpg'
global.img15 = 'https://i.ibb.co/3fc6F2M/img15.jpg'

global.img16 = 'https://i.ibb.co/wBPZv2k/18.webp' //+18

global.img17 = 'https://i.ibb.co/FqSbcFz/img17.jpg'
global.img18 = 'https://i.ibb.co/LdbB9fz/img18.jpg'

global.img18 = 'https://i.ibb.co/LdbB9fz/img18.jpg'

global.welshark = [ig, yt2, yt2, ig, md, ig, yt, yt2, yt2, ig]
global.redesMenu = [nna, md, ig, yt, asistencia]
global.sharkMenu = [img, img2, img6, img7, img8, img9, img13, img14, img15, img17, img18]
global.sharkImg = [imagen1, imagen2, imagen3, imagen4, imagen5, imagen6, imagen7, imagen8, imagen9, imagen10, imagen11, imagen12, imagen13]

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

global.htki = '*⭑•̩̩͙⊱•••• ☪*'
global.htka = '*☪ ••••̩̩͙⊰•⭑*'
global.htjava = '⫹⫺'

global.multiplier = 60 // Cuanto más alto, más difícil subir de nivel 

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.bold.greenBright(lenguajeGB['smsConfigBot']().trim()))
import(`${file}?update=${Date.now()}`)
})