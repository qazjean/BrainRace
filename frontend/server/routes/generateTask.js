const express = require('express')
const fetch = require('node-fetch')
const router = express.Router()
require('dotenv').config()

// POST { game: 'speed' }
router.post('/', async (req,res)=>{
  const {game} = req.body
  const token = process.env.GIGACHAT_TOKEN

  try{
    if(!token){
      // fallback
      if(game === 'speed'){
        return res.json({question:'5×6', options:[30,29,31,25], answer:30})
      }
      if(game === 'logic'){
        return res.json({question:'All birds can fly. Penguins are birds. Therefore penguins can fly. True or False?', options:[true,false], answer:false})
      }
      if(game === 'odd'){
        return res.json({question:['cat','dog','chair','lion'], options:['cat','dog','chair','lion'], answer:'chair'})
      }
      if(game === 'analogy'){
        return res.json({question:'Bird:Sky::Fish:?', options:['Water','Tree','Stone','Cloud'], answer:'Water'})
      }
      if(game === 'memory'){
        return res.json({sequence:['▲','●','■','★']})
      }
      return res.json({error:'unknown game'})
    }

    const prompt = `Generate a single ${game} task in JSON with fields question, options, answer.`
    const response = await fetch('https://api.gigachat.example/generate', {
      method:'POST', headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify({prompt})
    })
    const data = await response.json()
    return res.json(data)
  }catch(err){
    console.error(err)
    return res.status(500).json({error:'server error'})
  }
})

module.exports = router