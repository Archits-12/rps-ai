const $=id=>document.getElementById(id),video=$("video"),canvas=$("canvas"),ctx=canvas.getContext("2d");
const moves=["rock","paper","scissors"],emoji={rock:"✊",paper:"✋",scissors:"✌️"},beats={rock:"scissors",paper:"rock",scissors:"paper"},counter={rock:"paper",paper:"scissors",scissors:"rock"};
let running=false,last=null,stable=null,frames=0,lastRound=0;
let state=JSON.parse(localStorage.getItem("rpsAIState")||'{"history":[],"wins":0,"losses":0,"draws":0,"streak":0,"round":0}');

function save(){localStorage.setItem("rpsAIState",JSON.stringify(state))}
function render(){
 $("wins").textContent=state.wins;$("losses").textContent=state.losses;$("draws").textContent=state.draws;$("streak").textContent=state.streak;
 const total=state.wins+state.losses+state.draws;$("rate").textContent=total?Math.round(state.wins/total*100)+"%":"0%";$("round").textContent=String(state.round+1).padStart(2,"0");$("count").textContent=`${state.history.length} round${state.history.length==1?"":"s"}`;
 $("history").innerHTML=state.history.length?'<div class="history-list">'+state.history.slice(-12).reverse().map(r=>`<div class="history-item">${r.result=="win"?"🟢":r.result=="loss"?"🔴":"🟡"} <b>${emoji[r.player]}</b> vs ${emoji[r.ai]}</div>`).join("")+"</div>":"Your completed rounds will appear here.";
 updatePrediction();
}
function prediction(){
 if(state.history.length<2)return null;
 const c=Object.fromEntries(moves.map(m=>[m,0]));
 state.history.forEach(r=>c[r.player]++);
 const sorted=moves.slice().sort((a,b)=>c[b]-c[a]),p=sorted[0];
 return {predicted:p,confidence:Math.round(c[p]/state.history.length*100),reason:`You have played ${emoji[p]} ${c[p]} of ${state.history.length} rounds.`};
}
function transition(){
 if(state.history.length<3)return null;
 const last=state.history.at(-1).player,c={rock:0,paper:0,scissors:0};let total=0;
 for(let i=0;i<state.history.length-1;i++)if(state.history[i].player===last){c[state.history[i+1].player]++;total++}
 if(!total)return null;const p=moves.slice().sort((a,b)=>c[b]-c[a])[0];
 return {predicted:p,confidence:Math.round(c[p]/total*100),reason:`After ${emoji[last]}, your most common follow-up is ${emoji[p]}.`};
}
function getPrediction(){return transition()||prediction()}
function updatePrediction(){
 const p=getPrediction();$("predicon").textContent=p?emoji[p.predicted]:"?";$("prediction").textContent=p?p.predicted.toUpperCase():"Not enough data";
 $("confidence").textContent=p?p.confidence+"%":"0%";$("bar").style.width=p?p.confidence+"%":"0%";$("reason").textContent=p?p.reason:"The AI will learn from your previous moves.";
}
function aiMove(){
 const p=getPrediction();return p&&Math.random()<Math.min(.88,.55+p.confidence/250)?counter[p.predicted]:moves[Math.floor(Math.random()*3)];
}
function play(player){
 if(performance.now()-lastRound<1800)return;lastRound=performance.now();
 const ai=aiMove(),result=player===ai?"draw":beats[player]===ai?"win":"loss";
 state.round++;state.history.push({player,ai,result});if(state.history.length>60)state.history.shift();
 if(result==="win"){state.wins++;state.streak++}else if(result==="loss"){state.losses++;state.streak=0}else state.draws++;
 $("player").textContent=emoji[player];$("ai").textContent=emoji[ai];$("playerLabel").textContent=player.toUpperCase();$("aiLabel").textContent=ai.toUpperCase();
 $("result").className="result "+result;$("result").textContent=result==="win"?"🎉 You win!":result==="loss"?"🤖 AI wins!":"🤝 It's a draw!";
 save();render();
}
function extended(lm,tip,pip){return lm[tip].y<lm[pip].y-.025}
function classify(lm){
 const i=extended(lm,8,6),m=extended(lm,12,10),r=extended(lm,16,14),p=extended(lm,20,18),n=[i,m,r,p].filter(Boolean).length;
 if(n>=4)return"paper";if(i&&m&&!r&&!p)return"scissors";if(n<=1)return"rock";if(n>=3)return"paper";return null;
}
function onResults(res){
 canvas.width=res.image.width;canvas.height=res.image.height;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(res.image,0,0,canvas.width,canvas.height);
 if(res.multiHandLandmarks)for(const lm of res.multiHandLandmarks){drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:"#c084fc",lineWidth:4});drawLandmarks(ctx,lm,{color:"#fff",radius:2})}
 if(!running)return;
 if(!res.multiHandLandmarks?.length){last=null;stable=null;frames=0;$("gesture").textContent="No hand detected";return}
 const g=classify(res.multiHandLandmarks[0]);if(!g){frames=0;$("gesture").textContent="Move hand clearly";return}
 $("gesture").textContent=`${emoji[g]} ${g.toUpperCase()}`;frames=g===last?frames+1:1;last=g;
 if(frames>=8&&g!==stable){stable=g;play(g)}
}
const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.6,minTrackingConfidence:.6});hands.onResults(onResults);
$("start").onclick=async()=>{
 try{
  $("status").textContent="Requesting camera permission…";
  const cam=new Camera(video,{onFrame:async()=>await hands.send({image:video}),width:640,height:480});await cam.start();
  running=true;$("overlay").classList.add("hidden");$("start").disabled=true;$("pause").disabled=false;$("status").textContent="Camera active. Show your hand.";
 }catch(e){console.error(e);$("status").textContent="Camera failed. Use HTTPS/GitHub Pages and allow camera access."}
};
$("pause").onclick=()=>{running=!running;$("pause").textContent=running?"Pause":"Resume";$("status").textContent=running?"Camera active.":"Detection paused."};
$("reset").onclick=()=>{state={history:[],wins:0,losses:0,draws:0,streak:0,round:0};localStorage.removeItem("rpsAIState");$("player").textContent=$("ai").textContent="?";$("result").className="result";$("result").textContent="Show your hand to start a round";render()};
let t=performance.now(),n=0;function loop(now){n++;if(now-t>1000){$("fps").textContent=n+" FPS";n=0;t=now}requestAnimationFrame(loop)}requestAnimationFrame(loop);render();