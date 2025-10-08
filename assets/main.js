/* =======================    CONFIGURAÇÕES GERAIS ======================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// DOM Elements
const menu = document.getElementById('menu');
const btnStart = document.getElementById('btnStart');
const playerNameInput = document.getElementById('playerName');
const rankingList = document.getElementById('rankingList');
const btnClearRanking = document.getElementById('btnClearRanking');
const gamewrap = document.getElementById('gamewrap');
const overlay = document.getElementById('overlay');
const finalDistanceP = document.getElementById('finalDistance');
const btnBackToMenu = document.getElementById('btnBackToMenu');
const nameDisplay = document.getElementById('nameDisplay');
const distanceDisplay = document.getElementById('distance');
const speedDisplay = document.getElementById('speed');
const livesDisplay = document.getElementById('lives');
const scoreDisplay = document.getElementById('score');

/* =======================    ESTADO DO JOGO ======================= */
let running = false;
let lastTime = 0;
let deltaTime = 0;
let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let colisor = null;
let totalDistance = 0;
let difficultyTimer = 0;
let enemiesDestroyed = 0;
let baseEnemySpawnInterval = 1200;
let enemySpawnInterval = baseEnemySpawnInterval;
let lastEnemySpawn = 0;
let gameSpeed = 1.0;

/* =======================    SONS DO JOGO ======================= */
// Adicionando sons do jogo
const sounds = {
    playerShoot: new Audio('tiro.mp3'),      // Tiro do jogador
    enemyShoot: new Audio('tiro.mp3'),       // Tiro inimigo (mesmo arquivo, volume menor)
    explosion: new Audio('explosion.mp3'),   // Inimigo destruído
    gameOver: new Audio('gameOver.mp3'),     // Game over
    background: new Audio('fundo.mp3')       // Música de fundo
};

// Ajuste de volume
sounds.playerShoot.volume = 0.4;   // Volume do tiro do jogador
sounds.enemyShoot.volume = 0.2;    // Volume do tiro inimigo
sounds.explosion.volume = 0.5;
sounds.gameOver.volume = 0.7;
sounds.background.volume = 0.25;   // Volume da música de fundo

// Loop da música de fundo
sounds.background.loop = true;

/* =======================    INPUT ======================= */
const input = { left:false, right:false, up:false, down:false, shoot:false };

// Detecta teclas pressionadas
window.addEventListener('keydown', e => {
    const k = e.key;
    if(k==='ArrowLeft'||k==='a'||k==='A') input.left = true;
    if(k==='ArrowRight'||k==='d'||k==='D') input.right = true;
    if(k==='ArrowUp'||k==='w'||k==='W') input.up = true;
    if(k==='ArrowDown'||k==='s'||k==='S') input.down = true;
    if(e.code==='Space') input.shoot = true;
});

// Detecta teclas soltas
window.addEventListener('keyup', e => {
    const k = e.key;
    if(k==='ArrowLeft'||k==='a'||k==='A') input.left = false;
    if(k==='ArrowRight'||k==='d'||k==='D') input.right = false;
    if(k==='ArrowUp'||k==='w'||k==='W') input.up = false;
    if(k==='ArrowDown'||k==='s'||k==='S') input.down = false;
    if(e.code==='Space') input.shoot = false;
});

/* =======================    COLISOR (AABB) ======================= */
function Colisor(){
    this.sprites = [];
    this.aoColidir = null;
}
Colisor.prototype = {
    // Adiciona um sprite à lista
    novoSprite(sprite){ this.sprites.push(sprite); },

    // Processa todas as colisões
    processar(){
        const jaTestados = {};
        for(let i=0;i<this.sprites.length;i++){
            for(let j=0;j<this.sprites.length;j++){
                if(i===j) continue;
                const s1 = this.sprites[i], s2 = this.sprites[j];
                const id1 = this.stringUnica(s1), id2 = this.stringUnica(s2);
                if(!jaTestados[id1]) jaTestados[id1] = [];
                if(!jaTestados[id2]) jaTestados[id2] = [];
                if(jaTestados[id1].indexOf(id2)>=0 || jaTestados[id2].indexOf(id1)>=0) continue;
                this.testarColisao(s1,s2);
                jaTestados[id1].push(id2);
                jaTestados[id2].push(id1);
            }
        }
    },

    // Testa colisão entre dois sprites
    testarColisao(sprite1,sprite2){
        const rets1 = sprite1.retangulosColisao();
        const rets2 = sprite2.retangulosColisao();
        colisoes:
        for(let i=0;i<rets1.length;i++){
            for(let j=0;j<rets2.length;j++){
                if(this.retangulosColidem(rets1[i],rets2[j])){
                    if(sprite1.colidiuCom) sprite1.colidiuCom(sprite2);
                    if(sprite2.colidiuCom) sprite2.colidiuCom(sprite1);
                    if(this.aoColidir) this.aoColidir(sprite1,sprite2);
                    break colisoes;
                }
            }
        }
    },

    // Verifica se dois retângulos colidem
    retangulosColidem(r1,r2){
        return (r1.x+r1.largura)>r2.x && r1.x<(r2.x+r2.largura) &&
               (r1.y+r1.altura)>r2.y && r1.y<(r2.y+r2.altura);
    },

    // Gera uma string única para cada sprite
    stringUnica(sprite){
        const r = sprite.retangulosColisao();
        let s = '';
        for(let i=0;i<r.length;i++) s += `x:${r[i].x},y:${r[i].y},l:${r[i].largura},a:${r[i].altura}\n`;
        return s;
    }
};

/* =======================    PRELOAD IMAGENS ======================= */
const imageList = [
    {name:'player', src:'Jogador.png', img:null},
    {name:'enemy1', src:'Inimigo1.png', img:null},
    {name:'enemy2', src:'Inimigo2.png', img:null},
    {name:'enemy3', src:'Inimigo3.png', img:null},
    {name:'enemy4', src:'Inimigo4.png', img:null}
];

let imagesLoaded = 0;
function preloadImages(list, callback){
    list.forEach(obj=>{
        const img = new Image();
        img.src = obj.src;
        img.onload = ()=>{
            imagesLoaded++;
            obj.img = img;
            if(imagesLoaded===list.length) callback();
        };
        img.onerror = ()=>console.error('Erro ao carregar imagem', obj.src);
    });
}

/* =======================    ENTIDADES: PLAYER ======================= */
function Player(ctx){
    this.context = ctx;
    this.x = W/2; this.y = H-140;
    this.w = 64; this.h = 64;
    this.speed = 260;
    this.shootCooldown = 0;
    this.hp = 1;
    this.image = imageList.find(i=>i.name==='player').img;
}
Player.prototype = {
    atualizar(dt){
        const moveDist = this.speed*dt*gameSpeed;
        if(input.left) this.x -= moveDist;
        if(input.right) this.x += moveDist;
        if(input.up) this.y -= moveDist;
        if(input.down) this.y += moveDist;

        // Limita dentro da tela
        this.x = Math.max(this.w/2, Math.min(W-this.w/2, this.x));
        this.y = Math.max(this.h/2, Math.min(H-this.h/2, this.y));

        // Tiro do jogador
        this.shootCooldown -= dt*1000;
        if(input.shoot && this.shootCooldown<=0){
            spawnPlayerBullet(this.x,this.y-this.h/2+6);
            this.shootCooldown = 220;
            sounds.playerShoot.currentTime = 0; // Reinicia o som
            sounds.playerShoot.play();
        }
    },
    desenhar(){
        const ctx = this.context;
        if(this.image && this.image.complete){
            ctx.drawImage(this.image,this.x-this.w/2,this.y-this.h/2,this.w,this.h);
        }else{
            ctx.save();
            ctx.fillStyle = '#34d1ff';
            ctx.fillRect(this.x-this.w/2,this.y-this.h/2,this.w,this.h);
            ctx.restore();
        }
    },
    retangulosColisao(){ return [{ x:this.x-26, y:this.y-26, largura:52, altura:52 }]; },
    colidiuCom(sprite){ if(sprite.type==='enemy' || sprite.type==='enemyBullet') this.hp=0; }
};

/* =======================    ENTIDADES: ENEMY ======================= */
function Enemy(ctx,x,y,speed,img){
    this.context = ctx;
    this.x = x; this.y = y;
    this.w = 64; this.h = 64;
    this.speed = speed || (80+Math.random()*80);
    this.type = 'enemy';
    this.image = img;
    this.shootTimer = Math.random()*2000+600;
}
Enemy.prototype = {
    atualizar(dt){
        this.y += this.speed*dt*gameSpeed;

        // Tiro do inimigo
        this.shootTimer -= dt*1000;
        if(this.shootTimer<=0){
            this.shootTimer = Math.random()*2000+600;
            spawnEnemyBullet(this.x,this.y+this.h/2-6);
            sounds.enemyShoot.currentTime = 0;
            sounds.enemyShoot.play();
        }

        // Saiu da tela
        if(this.y-this.h/2>H+20) this._destroyed=true;
    },
    desenhar(){
        const ctx = this.context;
        if(this.image && this.image.complete){
            ctx.drawImage(this.image,this.x-this.w/2,this.y-this.h/2,this.w,this.h);
        }else{
            ctx.save();
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(this.x-this.w/2,this.y-this.h/2,this.w,this.h);
            ctx.restore();
        }
    },
    retangulosColisao(){ return [{ x:this.x-26, y:this.y-26, largura:52, altura:52 }]; },
    colidiuCom(sprite){
        if(sprite.type==='playerBullet'){
            this._destroyed = true;
            sprite._destroyed = true;
            enemiesDestroyed++;
            sounds.explosion.currentTime = 0;
            sounds.explosion.play();
        } else if(sprite.type==='player') this._destroyed=true;
    }
};

/* =======================    ENTIDADES: BULLET ======================= */
function Bullet(ctx,x,y,vy,owner){
    this.context=ctx; this.x=x; this.y=y; this.w=6; this.h=10; this.vy=vy;
    this.type = owner==='player'?'playerBullet':'enemyBullet';
    this.owner = owner;
}
Bullet.prototype = {
    atualizar(dt){
        this.y += this.vy*dt*gameSpeed;
        if(this.y<-20 || this.y>H+20) this._destroyed=true;
    },
    desenhar(){
        const ctx = this.context;
        ctx.save();
        ctx.fillStyle = this.owner==='player'?'#bfffbf':'#ffeb99';
        ctx.fillRect(this.x-this.w/2,this.y-this.h/2,this.w,this.h);
        ctx.restore();
    },
    retangulosColisao(){ return [{ x:this.x-this.w/2, y:this.y-this.h/2, largura:this.w, altura:this.h }]; },
    colidiuCom(){}
};

/* =======================    SPAWNERS ======================= */
function spawnPlayerBullet(x,y){ bullets.push(new Bullet(ctx,x,y,-520,'player')); }
function spawnEnemyBullet(x,y){ enemyBullets.push(new Bullet(ctx,x,y,260,'enemy')); }
function spawnEnemy(){
    const enemyImages = ['enemy1','enemy2','enemy3','enemy4'];
    const x = 30 + Math.random()*(W-60);
    const imgName = enemyImages[Math.floor(Math.random()*enemyImages.length)];
    const imgObj = imageList.find(i=>i.name===imgName);
    if(imgObj) enemies.push(new Enemy(ctx,x,-50,80 + Math.random()*90 + (Math.max(0,gameSpeed-1)*40),imgObj.img));
}

/* =======================    PARALLAX ======================= */
function ParallaxLayer(speed,density,sizeMin,sizeMax,alpha){
    this.speed=speed; this.density=density; this.particles=[];
    this.sizeMin=sizeMin; this.sizeMax=sizeMax; this.alpha=alpha||1;
    for(let i=0;i<density;i++) this.particles.push({ x:Math.random()*W, y:Math.random()*H, r:sizeMin + Math.random()*(sizeMax-sizeMin) });
}
ParallaxLayer.prototype.update=function(dt){
    for(const p of this.particles){
        p.y += this.speed*dt*gameSpeed;
        if(p.y>H+4){ p.y=-4; p.x=Math.random()*W; }
    }
};
ParallaxLayer.prototype.draw=function(ctx){
    ctx.save(); ctx.globalAlpha=this.alpha;
    for(const p of this.particles){
        ctx.beginPath(); ctx.fillStyle='white'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
};
let layerFar, layerNear;

/* =======================    RESET DO JOGO ======================= */
function resetGame(name){
    player = new Player(ctx);
    bullets=[]; enemyBullets=[]; enemies=[];
    colisor = new Colisor();
    colisor.novoSprite(player);

    totalDistance = 0;
    difficultyTimer = 0;
    enemySpawnInterval = baseEnemySpawnInterval;
    enemiesDestroyed = 0;
    gameSpeed = 1.0;
    lastEnemySpawn = 0;

    layerFar = new ParallaxLayer(10,60,0.6,1.2,0.45);
    layerNear = new ParallaxLayer(50,30,1.2,2.6,0.95);

    nameDisplay.textContent = name;
    livesDisplay.textContent = `Vida: ${player.hp}`;
    distanceDisplay.textContent = `Distância: 0 m`;
    speedDisplay.textContent = `Velocidade: ${gameSpeed.toFixed(2)}`;
    scoreDisplay.textContent = `Inimigos: 0`;
}

/* =======================    START E END GAME ======================= */
function startGame(){
    const name=(playerNameInput.value || "Anon").trim();
    if(name.length===0){ alert('Digite um nome antes de jogar.'); return; }

    menu.classList.add('hidden');
    gamewrap.classList.remove('hidden');
    overlay.classList.add('hidden');

    resetGame(name);
    running=true; lastTime=performance.now();

    // Tocar música de fundo
    sounds.background.currentTime = 0;
    sounds.background.play();

    requestAnimationFrame(gameLoop);
}

function endGame(){
    running=false;
    overlay.classList.remove('hidden');
    finalDistanceP.textContent = `Distância: ${Math.floor(totalDistance)} m`;
    const name=nameDisplay.textContent || 'Anon';
    saveScore({name,distance:Math.floor(totalDistance),date:new Date().toISOString()});
    updateRankingUI();

    // Parar música de fundo
    sounds.background.pause();
    sounds.background.currentTime = 0;

    sounds.gameOver.currentTime=0;
    sounds.gameOver.play();
}

/* =======================    RANKING LOCALSTORAGE ======================= */
const RANK_KEY='nave_infinita_ranking_v1';
function getRanking(){
    try{ const raw=localStorage.getItem(RANK_KEY); return raw?JSON.parse(raw):[]; }
    catch(e){ return []; }
}
function saveScore(obj){
    const arr=getRanking();
    arr.push(obj);
    arr.sort((a,b)=>b.distance-a.distance);
    localStorage.setItem(RANK_KEY,JSON.stringify(arr.slice(0,20)));
}
function updateRankingUI(){
    const arr=getRanking();
    rankingList.innerHTML='';
    for(let i=0;i<arr.length;i++){
        const li=document.createElement('li');
        li.textContent=`${arr[i].name} — ${arr[i].distance} m (${new Date(arr[i].date).toLocaleString()})`;
        rankingList.appendChild(li);
    }
}
btnClearRanking.addEventListener('click',()=>{
    if(confirm('Limpar ranking local?')){ localStorage.removeItem(RANK_KEY); updateRankingUI(); }
});

/* =======================    LOOP PRINCIPAL ======================= */
function gameLoop(ts){
    if(!running) return;
    deltaTime = (ts-lastTime)/1000; lastTime=ts;
    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

function update(dt){
    // Atualiza parallax
    layerFar.update(dt); layerNear.update(dt);

    // Ajuste de dificuldade
    difficultyTimer += dt*1000;
    if(difficultyTimer>4000){
        gameSpeed += 0.02;
        difficultyTimer=0;
        enemySpawnInterval = Math.max(360,enemySpawnInterval*0.97);
    }

    // Atualiza distância
    totalDistance += dt*(50*gameSpeed);
    distanceDisplay.textContent = `Distância: ${Math.floor(totalDistance)} m`;
    speedDisplay.textContent = `Velocidade: ${gameSpeed.toFixed(2)}`;

    // Atualiza player e inimigos
    if(player) player.atualizar(dt);
    lastEnemySpawn += dt*1000;
    if(lastEnemySpawn>=enemySpawnInterval){ spawnEnemy(); lastEnemySpawn=0; }

    bullets.forEach(b=>b.atualizar(dt));
    enemyBullets.forEach(b=>b.atualizar(dt));
    enemies.forEach(e=>e.atualizar(dt));

    // Remove objetos destruídos
    bullets = bullets.filter(b=>!b._destroyed);
    enemyBullets = enemyBullets.filter(b=>!b._destroyed);
    enemies = enemies.filter(e=>!e._destroyed);

    // Processa colisões
    colisor.sprites=[]; if(player) colisor.novoSprite(player);
    bullets.forEach(b=>colisor.novoSprite(b));
    enemyBullets.forEach(b=>colisor.novoSprite(b));
    enemies.forEach(e=>colisor.novoSprite(e));
    colisor.processar();

    // Atualiza UI
    livesDisplay.textContent = `Vida: ${player.hp}`;
    scoreDisplay.textContent = `Inimigos: ${enemiesDestroyed}`;

    if(player.hp<=0) endGame();
}

function draw(){
    ctx.clearRect(0,0,W,H);
    layerFar.draw(ctx); layerNear.draw(ctx);
    if(player) player.desenhar();
    bullets.forEach(b=>b.desenhar());
    enemyBullets.forEach(b=>b.desenhar());
    enemies.forEach(e=>e.desenhar());
}

/* =======================    EVENTOS BOTÕES ======================= */
btnStart.addEventListener('click',startGame);
btnBackToMenu.addEventListener('click',()=>{
    overlay.classList.add('hidden');
    gamewrap.classList.add('hidden');
    menu.classList.remove('hidden');
    updateRankingUI();
});

/* =======================    INICIALIZAÇÃO ======================= */
preloadImages(imageList,()=>{ updateRankingUI(); });
