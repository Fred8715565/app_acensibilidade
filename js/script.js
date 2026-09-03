(function(){
  const device = document.getElementById('device');
  const live = document.getElementById('liveRegion');
  function announce(msg){ live.textContent=''; setTimeout(()=>{live.textContent=msg;},30); }

  // Navigation
  const screens = document.querySelectorAll('.screen');
  const navBtns = document.querySelectorAll('.navbtn');
  function goTo(name){
    screens.forEach(s=>{ s.hidden = s.dataset.screen !== name; });
    navBtns.forEach(b=>{
      const active = b.dataset.goto === name;
      b.setAttribute('aria-current', active ? 'true':'false');
    });
    const target = document.querySelector('.screen[data-screen="'+name+'"]');
    if(target){ target.focus(); }
    const labels = {home:'Início', mapa:'Mapa de acessibilidade', leitor:'Leitor de texto', comunidade:'Comunidade', config:'Configurações'};
    announce('Tela: ' + (labels[name]||name));
  }
  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=> goTo(el.dataset.goto));
  });

  // Mapa: busca + filtro por recurso, combinados
  const mapSearch = document.getElementById('mapSearch');
  const filterChips = document.querySelectorAll('.chip[data-filter]');
  const placesList = document.getElementById('placesList');
  const mapEmpty = document.getElementById('mapEmpty');
  let activeFilter = 'todos';

  function applyMapFilters(){
    const query = (mapSearch.value || '').trim().toLowerCase();
    let visibleCount = 0;
    placesList.querySelectorAll('.place-card').forEach(card=>{
      const tags = (card.dataset.tags || '').split(' ');
      const name = (card.dataset.name || card.querySelector('h3').textContent).toLowerCase();
      const matchesFilter = activeFilter === 'todos' || tags.includes(activeFilter);
      const matchesSearch = !query || name.includes(query);
      const show = matchesFilter && matchesSearch;
      card.hidden = !show;
      if(show) visibleCount++;
    });
    mapEmpty.hidden = visibleCount > 0;
  }
  if(mapSearch){
    mapSearch.addEventListener('input', applyMapFilters);
    filterChips.forEach(chip=>{
      chip.addEventListener('click', ()=>{
        filterChips.forEach(c=>c.setAttribute('aria-pressed','false'));
        chip.setAttribute('aria-pressed','true');
        activeFilter = chip.dataset.filter;
        applyMapFilters();
      });
    });
  }

  // Mapa: salvar local (favoritar)
  if(placesList){
    placesList.addEventListener('click', (e)=>{
      const btn = e.target.closest('.save-btn');
      if(!btn) return;
      const saved = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', saved ? 'false' : 'true');
      btn.textContent = saved ? '☆ Salvar' : '★ Salvo';
      const name = btn.closest('.place-card').dataset.name || 'Local';
      announce(saved ? (name + ' removido dos salvos.') : (name + ' salvo no seu perfil.'));
    });
  }

  // Mapa: formulário "Avaliar um novo local"
  const togglePlaceForm = document.getElementById('togglePlaceForm');
  const addPlaceForm = document.getElementById('addPlaceForm');
  const cancelPlaceForm = document.getElementById('cancelPlaceForm');
  const starPicker = document.getElementById('starPicker');
  let chosenStars = 0;

  function showPlaceForm(show){
    addPlaceForm.hidden = !show;
    togglePlaceForm.setAttribute('aria-expanded', show ? 'true' : 'false');
    togglePlaceForm.hidden = show;
    if(show){ document.getElementById('npName').focus(); }
  }
  if(togglePlaceForm){
    togglePlaceForm.addEventListener('click', ()=> showPlaceForm(true));
    cancelPlaceForm.addEventListener('click', ()=>{
      addPlaceForm.reset();
      chosenStars = 0;
      starPicker.querySelectorAll('button').forEach(b=>{ b.classList.remove('on'); b.setAttribute('aria-checked','false'); });
      showPlaceForm(false);
      togglePlaceForm.focus();
    });
    starPicker.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=>{
        chosenStars = parseInt(b.dataset.value, 10);
        starPicker.querySelectorAll('button').forEach(o=>{
          const on = parseInt(o.dataset.value,10) <= chosenStars;
          o.classList.toggle('on', on);
          o.setAttribute('aria-checked', o.dataset.value === String(chosenStars) ? 'true' : 'false');
        });
      });
    });
    addPlaceForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('npName').value.trim();
      if(!name){ announce('Digite o nome do local.'); return; }
      const category = document.getElementById('npCategory').value.trim() || 'Local';
      const comment = document.getElementById('npComment').value.trim();
      const checked = Array.from(addPlaceForm.querySelectorAll('.checkbox-grid input:checked'));
      const tagLabels = { rampa:'♿ Rampa', banheiro:'🚻 Banheiro adaptado', pisotatil:'🔲 Piso tátil', vaga:'🅿️ Vaga reservada', elevador:'🛗 Elevador' };
      const tagsValue = checked.map(c=>c.value).join(' ');
      const stars = chosenStars || 5;
      const starString = '★'.repeat(stars) + '☆'.repeat(5-stars);

      const card = document.createElement('article');
      card.className = 'place-card';
      card.dataset.tags = tagsValue;
      card.dataset.name = name;
      card.innerHTML =
        '<div class="place-head">' +
          '<div><h3></h3><div class="cat"></div></div>' +
          '<div class="place-head-actions"><div class="stars"></div>' +
          '<button class="save-btn" type="button" aria-pressed="false">☆ Salvar</button></div>' +
        '</div>' +
        '<div class="tag-row"></div>' +
        (comment ? '<p class="place-note"></p>' : '');

      card.querySelector('h3').textContent = name;
      card.querySelector('.cat').textContent = category + ' · Avaliado agora';
      card.querySelector('.stars').textContent = starString;
      card.querySelector('.save-btn').setAttribute('aria-label', 'Salvar ' + name);
      const tagRow = card.querySelector('.tag-row');
      checked.forEach(c=>{
        const span = document.createElement('span');
        span.className = 'tag ok';
        span.textContent = tagLabels[c.value] || c.value;
        tagRow.appendChild(span);
      });
      if(comment){
        card.querySelector('.place-note').textContent = '"' + comment + '" — Você';
      }

      placesList.prepend(card);
      addPlaceForm.reset();
      chosenStars = 0;
      starPicker.querySelectorAll('button').forEach(b=>{ b.classList.remove('on'); b.setAttribute('aria-checked','false'); });
      showPlaceForm(false);
      applyMapFilters();
      announce(name + ' adicionado ao mapa.');
      togglePlaceForm.focus();
    });
  }

  // Leitor: histórico de leituras (compartilhado entre câmera e leitura manual)
  const historyList = document.getElementById('historyList');
  let historyItems = [];
  function renderHistory(){
    if(!historyItems.length){
      historyList.innerHTML = '<li class="empty-note">Os textos que você capturar ou ouvir aparecerão aqui.</li>';
      return;
    }
    historyList.innerHTML = '';
    historyItems.forEach(text=>{
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-item';
      btn.textContent = text.length > 80 ? text.slice(0,80) + '…' : text;
      btn.addEventListener('click', ()=>{ ocrText.value = text; ocrText.focus(); announce('Texto carregado no leitor.'); });
      li.appendChild(btn);
      historyList.appendChild(li);
    });
  }
  function addToHistory(text){
    text = text.trim();
    if(!text) return;
    if(historyItems[0] === text) return;
    historyItems.unshift(text);
    historyItems = historyItems.slice(0,5);
    renderHistory();
  }

  // Leitor: câmera real (pede permissão) + captura de foto
  const camVideo = document.getElementById('camVideo');
  const camPlaceholder = document.getElementById('camPlaceholder');
  const camCanvas = document.getElementById('camCanvas');
  const camError = document.getElementById('camError');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const ocrProgress = document.getElementById('ocrProgress');
  const ocrProgressFill = document.getElementById('ocrProgressFill');
  const ocrProgressLabel = document.getElementById('ocrProgressLabel');

  let cameraStream = null;
  let tesseractWorker = null;

  function showCamError(msg){ camError.textContent = msg; camError.hidden = false; }
  function hideCamError(){ camError.hidden = true; }

  async function startCamera(){
    hideCamError();
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      showCamError('Este navegador não permite acesso à câmera. Use o campo abaixo para colar o texto manualmente.');
      return;
    }
    startCameraBtn.disabled = true;
    try{
      // Isso dispara o pedido de permissão de câmera do navegador/sistema
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      camVideo.srcObject = cameraStream;
      camVideo.hidden = false;
      camPlaceholder.hidden = true;
      stopCameraBtn.disabled = false;
      captureBtn.disabled = false;
      announce('Câmera ativada. Aponte para o texto e toque em Capturar.');
    }catch(err){
      startCameraBtn.disabled = false;
      if(err && err.name === 'NotAllowedError'){
        showCamError('Permissão de câmera negada. Você pode ativar novamente nas configurações do navegador, ou colar o texto manualmente abaixo.');
      }else if(err && err.name === 'NotFoundError'){
        showCamError('Nenhuma câmera foi encontrada neste dispositivo. Cole o texto manualmente abaixo.');
      }else{
        showCamError('Não foi possível acessar a câmera agora. Tente novamente ou cole o texto manualmente.');
      }
    }
  }

  function stopCamera(){
    if(cameraStream){
      cameraStream.getTracks().forEach(t=>t.stop());
      cameraStream = null;
    }
    camVideo.hidden = true;
    camPlaceholder.hidden = false;
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    captureBtn.disabled = true;
    announce('Câmera desligada.');
  }

  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  // Libera a câmera se a pessoa sair da tela do Leitor ou fechar o app
  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=>{ if(el.dataset.goto !== 'leitor' && cameraStream) stopCamera(); });
  });
  window.addEventListener('beforeunload', ()=>{ if(cameraStream){ cameraStream.getTracks().forEach(t=>t.stop()); } });

  function loadScriptOnce(src){
    return new Promise((resolve, reject)=>{
      if(document.querySelector('script[data-src="'+src+'"]')){ resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.async = true; s.dataset.src = src;
      s.onload = ()=>resolve();
      s.onerror = ()=>reject(new Error('Falha ao carregar o reconhecedor de texto. Verifique sua conexão.'));
      document.head.appendChild(s);
    });
  }

  const OCR_STATUS_LABELS = {
    'loading tesseract core': 'Carregando mecanismo de OCR',
    'initializing tesseract': 'Inicializando',
    'loading language traineddata': 'Baixando dados do idioma português',
    'initializing api': 'Preparando',
    'recognizing text': 'Reconhecendo o texto'
  };

  async function ensureWorker(){
    if(tesseractWorker) return tesseractWorker;
    ocrProgress.hidden = false;
    ocrProgressFill.style.width = '4%';
    ocrProgressLabel.textContent = 'Baixando o reconhecedor de texto (só na primeira vez)...';
    if(typeof Tesseract === 'undefined'){
      await loadScriptOnce('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    }
    tesseractWorker = await Tesseract.createWorker('por', 1, {
      logger: (m)=>{
        if(m.status && typeof m.progress === 'number'){
          const pct = Math.round(m.progress * 100);
          ocrProgressFill.style.width = pct + '%';
          ocrProgressLabel.textContent = (OCR_STATUS_LABELS[m.status] || m.status) + '... ' + pct + '%';
        }
      }
    });
    return tesseractWorker;
  }

  captureBtn.addEventListener('click', async ()=>{
    if(!cameraStream) return;
    hideCamError();
    captureBtn.disabled = true;
    try{
      const w = camVideo.videoWidth || 640;
      const h = camVideo.videoHeight || 480;
      camCanvas.width = w;
      camCanvas.height = h;
      camCanvas.getContext('2d').drawImage(camVideo, 0, 0, w, h);

      ocrProgress.hidden = false;
      ocrProgressFill.style.width = '4%';
      ocrProgressLabel.textContent = 'Preparando reconhecimento de texto...';

      const worker = await ensureWorker();
      const { data } = await worker.recognize(camCanvas);
      const text = ((data && data.text) || '').trim();
      ocrProgress.hidden = true;

      if(text){
        ocrText.value = text;
        addToHistory(text);
        announce('Texto reconhecido com sucesso. Toque em Ler em voz alta para ouvir.');
      }else{
        announce('Não encontrei texto legível nessa captura. Aproxime a câmera e tente novamente.');
      }
    }catch(err){
      ocrProgress.hidden = true;
      showCamError('Não consegui reconhecer o texto agora. Verifique sua conexão com a internet e tente de novo.');
    }finally{
      captureBtn.disabled = !cameraStream;
    }
  });

  // Contrast toggle (both quick button and settings switch stay in sync)
  const contrastSwitch = document.getElementById('contrastSwitch');
  const toggleContrastBtn = document.getElementById('toggleContrast');
  function setContrast(on){
    device.dataset.theme = on ? 'contrast' : 'default';
    contrastSwitch.checked = on;
    toggleContrastBtn.setAttribute('aria-pressed', on ? 'true':'false');
    announce(on ? 'Alto contraste ativado' : 'Alto contraste desativado');
  }
  toggleContrastBtn.addEventListener('click', ()=> setContrast(device.dataset.theme !== 'contrast'));
  contrastSwitch.addEventListener('change', (e)=> setContrast(e.target.checked));

  // Font scale
  let fontStep = 0; // 0..8 -> 100% to 300% roughly in 25% steps
  const fontLabel = document.getElementById('fontLabel');
  function applyFont(){
    const pct = 100 + fontStep*25;
    device.style.setProperty('--font-scale', (pct/100).toFixed(2));
    fontLabel.textContent = pct + '%';
  }
  document.getElementById('fontPlus').addEventListener('click', ()=>{
    if(fontStep<8){ fontStep++; applyFont(); announce('Fonte aumentada'); }
  });
  document.getElementById('fontMinus').addEventListener('click', ()=>{
    if(fontStep>0){ fontStep--; applyFont(); announce('Fonte reduzida'); }
  });
  document.getElementById('toggleFontQuick').addEventListener('click', ()=>{
    fontStep = fontStep<8 ? fontStep+1 : 0;
    applyFont();
    announce(fontStep===0 ? 'Fonte no tamanho padrão' : 'Fonte aumentada');
  });

  // SOS
  document.getElementById('sosBtn').addEventListener('click', ()=>{
    announce('Emergência acionada. Localização enviada aos seus contatos de confiança.');
    alert('🆘 Emergência acionada.\n\nNeste protótipo isso simula o envio automático da sua localização a contatos de confiança e serviços de apoio.');
  });

  // Text-to-speech reader
  const ocrText = document.getElementById('ocrText');
  const speakBtn = document.getElementById('speakBtn');
  const stopBtn = document.getElementById('stopBtn');
  const rateRange = document.getElementById('rateRange');
  const rateVal = document.getElementById('rateVal');
  rateRange.addEventListener('input', ()=> rateVal.textContent = parseFloat(rateRange.value).toFixed(1)+'×');

  const synthAvailable = 'speechSynthesis' in window;
  if(!synthAvailable){
    speakBtn.disabled = true;
    speakBtn.textContent = '🔊 Voz indisponível neste navegador';
  }
  speakBtn.addEventListener('click', ()=>{
    const text = ocrText.value.trim();
    if(!text){ announce('Digite ou cole um texto para ouvir.'); ocrText.focus(); return; }
    if(!synthAvailable) return;
    window.speechSynthesis.cancel();
    addToHistory(text);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = parseFloat(rateRange.value);
    utter.onstart = ()=>{ stopBtn.disabled=false; speakBtn.disabled=true; };
    utter.onend = ()=>{ stopBtn.disabled=true; speakBtn.disabled=false; };
    utter.onerror = ()=>{ stopBtn.disabled=true; speakBtn.disabled=false; };
    window.speechSynthesis.speak(utter);
  });
  stopBtn.addEventListener('click', ()=>{
    if(synthAvailable){ window.speechSynthesis.cancel(); }
    stopBtn.disabled=true; speakBtn.disabled=false;
  });

  // Service Worker: habilita uso offline e instalação como app (PWA)
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./sw.js').then(reg=>{
        // Quando encontrar uma versão nova, ativa assim que possível
        reg.addEventListener('updatefound', ()=>{
          const newWorker = reg.installing;
          if(!newWorker) return;
          newWorker.addEventListener('statechange', ()=>{
            if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
              announce('Uma nova versão do app está disponível. Feche e abra novamente para atualizar.');
            }
          });
        });
      }).catch(()=>{ /* offline/instalação indisponível: app continua funcionando normalmente */ });
    });
  }

  // Botão "Instalar app" (aparece só quando o navegador permite instalar o PWA)
  const installBtn = document.getElementById('installBtn');
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async ()=>{
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    announce(choice.outcome === 'accepted' ? 'Instalando o AcessaAqui...' : 'Instalação cancelada.');
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', ()=>{
    installBtn.hidden = true;
    announce('AcessaAqui instalado com sucesso.');
  });
})();