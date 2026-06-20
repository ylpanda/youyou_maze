/* === Maze game: procedural generation, guaranteed solvable, customizable size === */

    // Configuration (defaults)
  let rows = 12, cols = 12;
  const gridEl = document.getElementById('grid');
  const sizeInput = document.getElementById('size');
  const mobileControls = document.getElementById('mobileControls');
    const minFractionInput = document.getElementById('minFraction');
    const regenBtn = document.getElementById('regen');
    const solveBtn = document.getElementById('solve') || document.getElementById('solveMobile');
    const solveMobileBtn = document.getElementById('solveMobile');
    const resetBtn = document.getElementById('reset');
    const statusEl = document.getElementById('status');
    const fogToggle = document.getElementById('fogToggle');
    const visRadiusInput = document.getElementById('visRadius');

    let minPathFraction = parseFloat(minFractionInput.value);
    let visibilityRadius = parseInt(visRadiusInput.value,10);

    // Maze data structures
    function makeCell(r,c){
      return {r,c, walls:{top:true,right:true,bottom:true,left:true}, visited:false};
    }

    let cells = []; // 2D array [r][c]
    let start = null; let exitPos = null;
    let player = null; // {r,c}

    function initCells(r,c){
      cells = new Array(r);
      for(let i=0;i<r;i++){
        cells[i] = new Array(c);
        for(let j=0;j<c;j++) cells[i][j]=makeCell(i,j);
      }
    }

    // DFS recursive backtracker
    function generateMaze(r,c){
      initCells(r,c);
      const stack=[];
      // start at random cell
      const startR = Math.floor(Math.random()*r);
      const startC = Math.floor(Math.random()*c);
      let cur = cells[startR][startC];
      cur.visited=true; stack.push(cur);
      while(stack.length){
        cur = stack[stack.length-1];
        const neighbors = [];
        const {r:cr,c:cc} = cur;
        // top
        if(cr>0 && !cells[cr-1][cc].visited) neighbors.push({cell:cells[cr-1][cc],dir:'top'});
        if(cc<c-1 && !cells[cr][cc+1].visited) neighbors.push({cell:cells[cr][cc+1],dir:'right'});
        if(cr<r-1 && !cells[cr+1][cc].visited) neighbors.push({cell:cells[cr+1][cc],dir:'bottom'});
        if(cc>0 && !cells[cr][cc-1].visited) neighbors.push({cell:cells[cr][cc-1],dir:'left'});
        if(neighbors.length===0){
          stack.pop();
        } else {
          const pick = neighbors[Math.floor(Math.random()*neighbors.length)];
          const next = pick.cell;
          // remove walls between cur and next
          if(pick.dir==='top'){ cur.walls.top=false; next.walls.bottom=false; }
          if(pick.dir==='right'){ cur.walls.right=false; next.walls.left=false; }
          if(pick.dir==='bottom'){ cur.walls.bottom=false; next.walls.top=false; }
          if(pick.dir==='left'){ cur.walls.left=false; next.walls.right=false; }
          next.visited = true;
          stack.push(next);
        }
      }
      // clear visited marks for reuse
      for(let i=0;i<r;i++) for(let j=0;j<c;j++) cells[i][j].visited=false;
    }

    // BFS to find shortest path between two cells, returns path array of {r,c}
    function findPath(startPos, endPos){
      const q = [];
      const R = cells.length, C = cells[0].length;
      const seen = Array.from({length:R},()=>Array(C).fill(false));
      const parent = Array.from({length:R},()=>Array(C).fill(null));
      q.push(startPos); seen[startPos.r][startPos.c]=true;
      while(q.length){
        const cur = q.shift();
        if(cur.r===endPos.r && cur.c===endPos.c) break;
        const cell = cells[cur.r][cur.c];
        // try each direction if no wall
        if(!cell.walls.top && !seen[cur.r-1][cur.c]){ seen[cur.r-1][cur.c]=true; parent[cur.r-1][cur.c]=cur; q.push({r:cur.r-1,c:cur.c}); }
        if(!cell.walls.right && !seen[cur.r][cur.c+1]){ seen[cur.r][cur.c+1]=true; parent[cur.r][cur.c+1]=cur; q.push({r:cur.r,c:cur.c+1}); }
        if(!cell.walls.bottom && !seen[cur.r+1][cur.c]){ seen[cur.r+1][cur.c]=true; parent[cur.r+1][cur.c]=cur; q.push({r:cur.r+1,c:cur.c}); }
        if(!cell.walls.left && !seen[cur.r][cur.c-1]){ seen[cur.r][cur.c-1]=true; parent[cur.r][cur.c-1]=cur; q.push({r:cur.r,c:cur.c-1}); }
      }
      // if parent for end is null and it's not start, means no path
      if(!parent[endPos.r][endPos.c] && !(startPos.r===endPos.r && startPos.c===endPos.c)) return null;
      const path = [];
      let cur = endPos;
      while(cur){ path.push(cur); cur = parent[cur.r][cur.c]; }
      return path.reverse();
    }

    function randCell(){
      return {r: Math.floor(Math.random()*cells.length), c: Math.floor(Math.random()*cells[0].length)};
    }

    // Ensure maze is not "too easy": require shortest-path length >= minFraction * totalCells
    function generateVerifiedMaze(r,c){
      let attempts=0; const maxAttempts=50;
      const total = r*c;
      const minLen = Math.max(3, Math.floor(total * minPathFraction));
      while(attempts<maxAttempts){
        generateMaze(r,c);
        // pick start/exit and test path length
        const a = randCell(); const b = randCell();
        if(a.r===b.r && a.c===b.c) { attempts++; continue; }
        const path = findPath(a,b);
        if(path && path.length>=minLen){ start=a; exitPos=b; return {start:a,exit:b,path}; }
        attempts++;
      }
      // fallback: accept last generated maze but compute path from random points
      const a = randCell(); const b = randCell(); start=a; exitPos=b; const p = findPath(a,b);
      return {start:a,exit:b,path:p};
    }

    // Rendering helpers
    function renderGrid(){
      gridEl.innerHTML='';
      const R = cells.length, C = cells[0].length;
      gridEl.style.gridTemplateColumns = `repeat(${C}, var(--cell-size))`;
      for(let i=0;i<R;i++){
        for(let j=0;j<C;j++){
          const cell = cells[i][j];
          const div = document.createElement('div');
          div.className='cell';
          if(cell.walls.top) div.classList.add('wall-top');
          if(cell.walls.right) div.classList.add('wall-right');
          if(cell.walls.bottom) div.classList.add('wall-bottom');
          if(cell.walls.left) div.classList.add('wall-left');
          div.dataset.r = i; div.dataset.c = j;
          gridEl.appendChild(div);
        }
      }
      updateEntities();
    }

    // place player and exit DOM elements
    function updateEntities(){
      // clear any existing overlays in cells
      const all = gridEl.querySelectorAll('.cell');
      all.forEach(n=>{ n.innerHTML=''; n.classList.remove('solution'); n.classList.remove('hidden-cell'); if(!fogToggle.checked) n.classList.remove('fog'); });
      const startIdx = start.r * cells[0].length + start.c;
      const exitIdx = exitPos.r * cells[0].length + exitPos.c;
      const startCell = gridEl.children[startIdx];
      const exitCell = gridEl.children[exitIdx];
  // exit (use provided image)
  const exitEl = document.createElement('div'); exitEl.className='exit';
  const exitImg = document.createElement('img'); exitImg.className = 'exit-img'; exitImg.src = 'exit.png'; exitImg.alt = 'Exit';
  exitEl.appendChild(exitImg);
  exitCell.appendChild(exitEl);
  // player (use provided image)
  const playerEl = document.createElement('div'); playerEl.className='player';
  const playerImg = document.createElement('img'); playerImg.className = 'player-img'; playerImg.src = 'player.png'; playerImg.alt = 'Player';
  playerEl.appendChild(playerImg);
  gridEl.children[player.r*cells[0].length + player.c].appendChild(playerEl);
      updateVisibility();
    }

    function updateVisibility(){
      const R = cells.length, C = cells[0].length;
      const radius = parseInt(visRadiusInput.value,10) || 3;
      // By default hide everything when fog is enabled
      for(let i=0;i<R;i++) for(let j=0;j<C;j++){
        const idx = i*C + j; const el = gridEl.children[idx];
        if(fogToggle.checked){ el.classList.add('hidden-cell'); el.classList.add('fog'); }
        else { el.classList.remove('hidden-cell'); el.classList.remove('fog'); }
      }

      if(!fogToggle.checked) return;

      // BFS flood from player, respecting walls, limited by radius (Manhattan distance as depth)
      const q = [];
      const seen = Array.from({length:R},()=>Array(C).fill(false));
      q.push({r:player.r,c:player.c,dist:0}); seen[player.r][player.c]=true;
      while(q.length){
        const cur = q.shift();
        const idx = cur.r*C + cur.c; const el = gridEl.children[idx];
        // mark visible
        el.classList.remove('hidden-cell'); el.classList.remove('fog');
        if(cur.dist>=radius) continue;
        const cell = cells[cur.r][cur.c];
        // neighbors: only traverse if there's no wall between cur and neighbor
        // top
        if(!cell.walls.top){ const nr=cur.r-1, nc=cur.c; if(nr>=0 && !seen[nr][nc]){ seen[nr][nc]=true; q.push({r:nr,c:nc,dist:cur.dist+1}); } }
        // right
        if(!cell.walls.right){ const nr=cur.r, nc=cur.c+1; if(nc<C && !seen[nr][nc]){ seen[nr][nc]=true; q.push({r:nr,c:nc,dist:cur.dist+1}); } }
        // bottom
        if(!cell.walls.bottom){ const nr=cur.r+1, nc=cur.c; if(nr<R && !seen[nr][nc]){ seen[nr][nc]=true; q.push({r:nr,c:nc,dist:cur.dist+1}); } }
        // left
        if(!cell.walls.left){ const nr=cur.r, nc=cur.c-1; if(nc>=0 && !seen[nr][nc]){ seen[nr][nc]=true; q.push({r:nr,c:nc,dist:cur.dist+1}); } }
      }
    }

    // movement - obey walls
    function tryMove(dir){
      const cell = cells[player.r][player.c];
      if(dir==='up'){ if(cell.walls.top) return false; player.r--; }
      if(dir==='right'){ if(cell.walls.right) return false; player.c++; }
      if(dir==='down'){ if(cell.walls.bottom) return false; player.r++; }
      if(dir==='left'){ if(cell.walls.left) return false; player.c--; }
      updatePlayerDOM();
      return true;
    }
    function updatePlayerDOM(){
      // remove player el from previous cell
      gridEl.querySelectorAll('.player').forEach(n=>n.remove());
      const idx = player.r*cells[0].length + player.c;
      const el = document.createElement('div'); el.className='player';
      const playerImg = document.createElement('img'); playerImg.className = 'player-img'; playerImg.src = 'player.png'; playerImg.alt = 'Player';
      el.appendChild(playerImg);
      gridEl.children[idx].appendChild(el);
      updateVisibility();
      checkWin();
    }

    function checkWin(){
      if(player.r===exitPos.r && player.c===exitPos.c){ 
        console.log('You Win!');
        statusEl.textContent = 'You Win!';
        try{ showWinCanvas(); }catch(e){}
      }
    }

    // keyboard controls
    window.addEventListener('keydown', (e)=>{
      const k = e.key;
      if(k==='ArrowUp' || k==='w' || k==='W'){ e.preventDefault(); tryMove('up'); }
      if(k==='ArrowRight' || k==='d' || k==='D'){ e.preventDefault(); tryMove('right'); }
      if(k==='ArrowDown' || k==='s' || k==='S'){ e.preventDefault(); tryMove('down'); }
      if(k==='ArrowLeft' || k==='a' || k==='A'){ e.preventDefault(); tryMove('left'); }
    });

    // UI actions
    function computeCellSizeAndDims(requestedSize){
        // requestedSize is the number of cells per side
        // compute available width: viewport width minus right-side controls (match CSS padding-right)
        // If the mobile user panel is visible and scaled, reserve its scaled width in landscape mode
        let reserve = 0;
        try{
          if(window.matchMedia('(orientation: landscape)').matches){
            const mobileInner = document.getElementById('mobileInner');
            if(mobileInner && mobileInner.offsetParent !== null){
              // compute the effective (scaled) width of the panel
              const style = window.getComputedStyle(mobileInner);
              // transform may be like 'matrix(a, b, c, d, tx, ty)' — scaleX is a (or d for rotation)
              const transform = style.transform || style.webkitTransform;
              let scale = 1;
              if(transform && transform !== 'none'){
                const m = transform.match(/matrix\(([-0-9., ]+)\)/);
                if(m){
                  const parts = m[1].split(',').map(p=>parseFloat(p));
                  // matrix(a, b, c, d, tx, ty) -> scaleX = a, scaleY = d
                  if(parts.length>=6 && !isNaN(parts[0])) scale = parts[0];
                }
              }
              reserve = Math.round(mobileInner.offsetWidth * scale) + 40; // add breathing room
            } else {
              reserve = 360; // fallback estimate
            }
          }
        }catch(e){ reserve = window.matchMedia('(orientation: landscape)').matches ? 360 : 0; }
      const availW = Math.max(200, window.innerWidth - reserve - 40); // small margins
      const availH = Math.max(200, window.innerHeight - 80); // allow for topbar etc
      const sidePx = Math.min(availW, availH);
      // compute cell size to fit requestedSize cells into sidePx
      const cellSize = Math.floor(sidePx / requestedSize);
      // clamp cell-size to reasonable bounds
      const finalCellSize = Math.max(18, Math.min(72, cellSize));
      // set CSS variable
      document.documentElement.style.setProperty('--cell-size', finalCellSize + 'px');
      return {rows: requestedSize, cols: requestedSize};
    }

    // Uniformly scale the user panel (#mobileInner) so it occupies full viewport height in landscape
    // or full viewport width in portrait. Scaling is uniform (same X and Y).
    function scaleUserPanel(){
      const mobileInner = document.getElementById('mobileInner');
      if(!mobileInner) return;
      // only apply when panel is visible (display not none)
      const rect = mobileInner.getBoundingClientRect();
      const visible = mobileInner.offsetParent !== null;
      if(!visible) { mobileInner.style.transform = ''; return; }
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      // natural size (unscaled)
      const naturalW = mobileInner.offsetWidth;
      const naturalH = mobileInner.offsetHeight;
      if(isLandscape){
        // scale so the panel's height matches the viewport height minus small margin
        const targetH = Math.max(48, window.innerHeight - 24);
        const scale = Math.max(0.3, Math.min(3, targetH / naturalH));
        mobileInner.style.transform = `scale(${scale})`;
      } else {
        // portrait: scale so panel's width matches viewport width minus small margin
        const targetW = Math.max(120, window.innerWidth - 28);
        const scale = Math.max(0.3, Math.min(3, targetW / naturalW));
        mobileInner.style.transform = `scale(${scale})`;
      }
    }

    regenBtn.addEventListener('click', ()=>{
      const requested = Math.max(5, Math.min(40, parseInt(sizeInput.value) || 12));
      const dims = computeCellSizeAndDims(requested);
      rows = dims.rows; cols = dims.cols;
  minPathFraction = parseFloat(minFractionInput.value) || 0.12;
  visibilityRadius = parseInt(visRadiusInput.value,10) || 3;
  const result = generateVerifiedMaze(rows,cols);
      start = result.start; exitPos = result.exit;
      player = {r:start.r,c:start.c};
      renderGrid();
      statusEl.textContent = `Maze generated ${rows}x${cols}. Shortest path length: ${result.path?result.path.length:'unknown'}`;
      // focus grid to catch keystrokes on mobile
      setTimeout(()=>gridEl.focus(),40);
      // clear any active win overlay
      try{ hideWinCanvas(); }catch(e){}
    });

  resetBtn.addEventListener('click', ()=>{
      // pick new random start/exit (preserve maze layout) ensuring min length
      const total = rows*cols; const minLen = Math.max(3, Math.floor(total * minPathFraction));
      let attempts = 0; while(attempts<100){
        const a = randCell(); const b = randCell(); if(a.r===b.r && a.c===b.c){ attempts++; continue; }
        const path = findPath(a,b); if(path && path.length>=minLen){ start=a; exitPos=b; player={r:start.r,c:start.c}; renderGrid(); statusEl.textContent = `New start/exit chosen. Path length ${path.length}`; return; }
        attempts++; }
      statusEl.textContent = 'Could not find a sufficiently long pair for start/exit — try regenerating.';
    });

  // Wire topbar regenerate button to same action
    const regenTopBtn = document.getElementById('regenTop');
    regenTopBtn.addEventListener('click', ()=> regenBtn.click());

    // Settings toggle: show controls as an overlay sized/positioned to the maze
    const settingsToggle = document.getElementById('settingsToggle');
    const controlsPanel = document.querySelector('.controls');
    let overlayActive = false;

    function positionControlsOverGrid(){
      // keep for potential future alignment but don't force sizing/positioning;
      // the CSS will keep the overlay centered at 90% viewport. Leave this
      // function as a no-op to avoid overriding the stylesheet.
      if(!controlsPanel) return;
      controlsPanel.classList.add('overlay');
    }

    function openControlsOverlay(){
      if(!controlsPanel) return;
      overlayActive = true;
      // make panel visible and overlay it
      // rely on CSS classes to size/center at 90% of viewport
      controlsPanel.classList.add('overlay');
      controlsPanel.classList.add('open');
      // trap clicks outside to close
      setTimeout(()=>{ // delay to avoid immediate close from the click that opened it
        document.addEventListener('pointerdown', outsideClickHandler);
      },50);
      window.addEventListener('resize', positionControlsOverGrid);
      window.addEventListener('scroll', positionControlsOverGrid, true);
      document.addEventListener('keydown', escKeyHandler);
    }

    function closeControlsOverlay(){
      if(!controlsPanel) return;
      overlayActive = false;
      // remove overlay/open classes and allow default hidden state
      controlsPanel.classList.remove('overlay');
      controlsPanel.classList.remove('open');
      document.removeEventListener('pointerdown', outsideClickHandler);
      window.removeEventListener('resize', positionControlsOverGrid);
      window.removeEventListener('scroll', positionControlsOverGrid, true);
      document.removeEventListener('keydown', escKeyHandler);
    }

    function escKeyHandler(e){ if(e.key==='Escape') closeControlsOverlay(); }

    function outsideClickHandler(e){
      if(!controlsPanel) return;
      if(!controlsPanel.contains(e.target)) closeControlsOverlay();
    }

    settingsToggle && settingsToggle.addEventListener('click', ()=>{
      if(overlayActive) closeControlsOverlay(); else openControlsOverlay();
    });

    // Close button inside overlay (added dynamically in markup)
    const closeControlsBtn = document.getElementById('closeControls');
    if(closeControlsBtn){ closeControlsBtn.addEventListener('click', ()=>{ closeControlsOverlay(); }); }

    // Joystick wiring: buttons trigger tryMove
    const joyBtns = document.querySelectorAll('.joy-btn');
    joyBtns.forEach(b=>{
      const dir = b.dataset.dir;
      // click/tap/touch: move only once per event
      b.addEventListener('click', (e)=>{ e.preventDefault(); tryMove(dir); });
      b.addEventListener('touchstart', (e)=>{ e.preventDefault(); tryMove(dir); });
      // Remove pointerdown repeat for single-move-per-click
    });

    // Swipe support on grid: detect simple swipes and move player
    (function addSwipe(){
      let startX=0,startY=0,tracking=false;
      gridEl.addEventListener('touchstart',(e)=>{ if(e.touches && e.touches.length===1){ tracking=true; startX=e.touches[0].clientX; startY=e.touches[0].clientY; } },{passive:true});
      gridEl.addEventListener('touchmove',(e)=>{ /* prevent page scroll when dragging on grid */ if(tracking) e.preventDefault(); },{passive:false});
      gridEl.addEventListener('touchend',(e)=>{
        if(!tracking) return; tracking=false;
        const touch = e.changedTouches[0]; const dx = touch.clientX - startX; const dy = touch.clientY - startY;
        const absX = Math.abs(dx), absY = Math.abs(dy);
        if(Math.max(absX,absY) < 20) return; // ignore tiny gestures
        if(absX>absY){ if(dx>0) tryMove('right'); else tryMove('left'); }
        else { if(dy>0) tryMove('down'); else tryMove('up'); }
      });
    })();

    // Recompute cell size and grid dims on resize so the maze stays square and fits viewport
    function handleResize(){
      const requested = Math.max(5, Math.min(40, parseInt(sizeInput.value) || 12));
      // first, scale the user panel so its effective size is known
      scaleUserPanel();
      const dims = computeCellSizeAndDims(requested);
      // if size changed, regenerate grid layout but preserve maze if possible
      rows = dims.rows; cols = dims.cols;
      // update grid template and re-render positions
      if(cells && cells.length) renderGrid();
      // show/hide mobile controls depending on viewport width (restore previous behavior)
      try{
        const small = window.matchMedia('(max-width:880px)').matches;
        if(mobileControls) mobileControls.style.display = small ? 'flex' : 'none';
      }catch(e){ /* ignore */ }
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    // Wire mobile regen and fog buttons
    const regenMobile = document.getElementById('regenMobile');
    regenMobile && regenMobile.addEventListener('click', ()=> regenBtn.click());
    const fogMobile = document.getElementById('fogMobile');
    if(fogMobile){
      function updateFogLabel(){ fogMobile.textContent = fogToggle.checked? 'Fog: On' : 'Fog: Off'; }
      fogMobile.addEventListener('click', ()=>{ fogToggle.checked = !fogToggle.checked; updateVisibility(); updateFogLabel(); });
      // initialize label
      updateFogLabel();
    }

    fogToggle.addEventListener('change', ()=>{ updateVisibility(); });
    visRadiusInput.addEventListener('change', ()=>{ updateVisibility(); });

    // Show/Hide persistent solution
    let solutionVisible = false;
  function setSolveLabels(text){ if(solveBtn) solveBtn.textContent = text; if(solveMobileBtn) solveMobileBtn.textContent = text; }

  function showSolution(){
      const p = findPath({r:player.r,c:player.c}, exitPos);
      if(!p){ statusEl.textContent='No path from player to exit (should not happen).'; return; }
      statusEl.textContent = `Solution visible (length ${p.length}).`;
      for(let i=0;i<p.length;i++){ const idx = p[i].r * cells[0].length + p[i].c; gridEl.children[idx].classList.add('solution'); }
      solutionVisible = true;
  setSolveLabels('Hide Solution');
    }
    function hideSolution(){
      // remove any solution highlights
      gridEl.querySelectorAll('.solution').forEach(n=>n.classList.remove('solution'));
      solutionVisible = false;
  setSolveLabels('Show Solution');
      statusEl.textContent = '';
    }
    solveBtn.addEventListener('click', ()=>{
      if(!solutionVisible) showSolution(); else hideSolution();
    });

    // initialize first maze
    (function init(){
      const requested = Math.max(5, Math.min(40, parseInt(sizeInput.value) || 12));
      // apply initial scaling to user panel before computing dims
      scaleUserPanel();
      const dims = computeCellSizeAndDims(requested);
      rows = dims.rows; cols = dims.cols; minPathFraction = parseFloat(minFractionInput.value) || 0.12;
      const result = generateVerifiedMaze(rows,cols);
      start = result.start; exitPos = result.exit; player = {r:start.r,c:start.c};
      renderGrid();
      statusEl.textContent = `Maze ${rows}x${cols} generated. Shortest path: ${result.path?result.path.length:'unknown'}. Use arrow keys to move.`;
      gridEl.focus();
    })();

    // --- Win canvas setup ---
    let winCanvas = null; let winCtx = null; let winTimeout = null;
    function ensureWinCanvas(){
      if(winCanvas) return;
      winCanvas = document.createElement('canvas');
      winCanvas.id = 'winCanvas';
      // set size to match CSS px (will be resized when drawn)
      document.body.appendChild(winCanvas);
      winCtx = winCanvas.getContext('2d');
      resizeWinCanvas();
      window.addEventListener('resize', resizeWinCanvas);
    }
    function resizeWinCanvas(){
      if(!winCanvas) return;
      const rect = winCanvas.getBoundingClientRect();
      winCanvas.width = Math.max(300, Math.floor(rect.width * window.devicePixelRatio));
      winCanvas.height = Math.max(120, Math.floor(rect.height * window.devicePixelRatio));
      // keep CSS size; drawing uses backing store size
      winCtx && winCtx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
    }
    function showWinCanvas(){
      ensureWinCanvas();
      // draw cute big text
      const w = winCanvas.width / window.devicePixelRatio;
      const h = winCanvas.height / window.devicePixelRatio;
      // clear
      winCtx.clearRect(0,0,w,h);
      // background subtle glow (transparent)
      // text style
      const fontSize = Math.floor(Math.min(h * 0.6, w * 0.15));
      winCtx.textAlign = 'center';
      winCtx.textBaseline = 'middle';
      winCtx.font = `bold ${fontSize}px "Comic Sans MS", "Comic Neue", "Baloo", sans-serif`;
      // shadow/glow
      winCtx.fillStyle = '#fff';
      winCtx.shadowColor = 'rgba(255, 215, 120, 0.95)';
      winCtx.shadowBlur = 28;
      winCtx.fillText('You Win!', w/2, h/2);
      // outline
      winCtx.shadowBlur = 0;
      winCtx.lineWidth = Math.max(4, Math.floor(fontSize * 0.08));
      winCtx.strokeStyle = '#ff6b6b';
      winCtx.strokeText('You Win!', w/2, h/2);
      // auto-hide after 3s
      if(winTimeout) clearTimeout(winTimeout);
      winTimeout = setTimeout(hideWinCanvas, 3000);
    }
    function hideWinCanvas(){ if(winCanvas){ winCtx.clearRect(0,0,winCanvas.width,winCanvas.height); clearTimeout(winTimeout); winTimeout=null; } }

    // Ensure mobile fog button label reflects default state after init
    if(typeof updateFogLabel === 'function' && fogMobile) updateFogLabel();

    // Expose some helpers for future features
    window._MAZE = {
      getCells: ()=>cells,
      getPlayer: ()=>player,
      getExit: ()=>exitPos,
      regenerate: ()=>regenBtn.click(),
      toggleFog: ()=>{ fogToggle.checked=!fogToggle.checked; updateVisibility(); }
    };
