import React, {useEffect, useState} from 'react'
import { GradientBackground } from '../ui/Backgrounds.jsx'
import { Bar } from 'react-chartjs-2'

export default function CognitiveProfileScreen(){
  const [profile,setProfile] = useState({Logic:60,Attention:70,Speed:65,Flexibility:50,Memory:55})

  const data = {
    labels: Object.keys(profile),
    datasets: [{label:'Profile', data: Object.values(profile), backgroundColor:'rgba(99,102,241,0.6)'}]
  }

  return (
    <GradientBackground>
      <div className="container">
        <div style={{fontWeight:800,fontSize:20}}>Cognitive Profile</div>
        <div className="card" style={{marginTop:12}}>
          <Bar data={data} />
        </div>

        <div className="card" style={{marginTop:12}}>
          <div style={{fontWeight:700}}>Thinking style</div>
          <div className="small-muted">You tend to be strong at Attention and Speed; focus on training Memory and Flexibility with targeted games.</div>
        </div>
      </div>
    </GradientBackground>
  )
}