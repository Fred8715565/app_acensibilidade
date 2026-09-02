(() => {
  const device = document.getElementById('device');
  const live = document.getElementById('liveRegion');
  
  const announce = m => {
    live.textContent = '';
    setTimeout(() => live.textContent = m, 30);
  };

  const screens = document.querySelectorAll('.screen');
  const nav = document.querySelectorAll('.navbtn');

  function goTo(name) {
    screens.forEach(s => s.hidden = s.dataset.screen !== name);
    nav.forEach(b => b.setAttribute('aria-current', b.dataset.goto === name ? 'true' : 'false'));
    const t = document.querySelector(`.screen[data-screen="${name}"]`);
    if (t) t.focus();
    announce('Tela carregada: ' + name);
  }

  document.querySelectorAll('[data-goto]').forEach(e => {
    e.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      goTo(this.dataset.goto);
    });
  });

  // Controle de Fonte e Contraste
  let fontStep = 0;
  function applyFont() {
    const pct = 100 + fontStep * 25;
    device.style.setProperty('--font-scale', pct / 100);
    document.getElementById('fontLabel').textContent = pct + '%';
  }

  const contrastSwitch = document.getElementById('contrastSwitch');
  function setContrast(on) {
    device.dataset.theme = on ? 'contrast' : 'default';
    if (contrastSwitch) contrastSwitch.checked = on;
    document.getElementById('toggleContrast').setAttribute('aria-pressed', on);
    announce(on ? 'Alto contraste ativado' : 'Alto contraste desativado');
  }

  document.getElementById('toggleContrast').onclick = () => setContrast(device.dataset.theme !== 'contrast');
  if (contrastSwitch) contrastSwitch.onchange = e => setContrast(e.target.checked);

  document.getElementById('fontPlus').onclick = () => {
    if (fontStep < 8) { fontStep++; applyFont(); announce('Fonte aumentada'); }
  };
  document.getElementById('fontMinus').onclick = () => {
    if (fontStep > 0) { fontStep--; applyFont(); announce('Fonte reduzida'); }
  };
  document.getElementById('toggleFontQuick').onclick = () => {
    fontStep = fontStep < 8 ? fontStep + 1 : 0;
    applyFont();
    announce('Fonte em ' + (100 + fontStep * 25) + '%');
  };

  // Dados dos Recursos do App Explicação
  const recursos = [
    {
      name: 'Modo Alto Contraste',
      cat: 'Acessibilidade',
      tags: ['acessibilidade'],
      note: 'Altera as cores da interface para preto e amarelo/azul de alta visibilidade, facilitando a leitura para pessoas com baixa visão.'
    },
    {
      name: 'Fonte Aumentada (A+)',
      cat: 'Acessibilidade',
      tags: ['acessibilidade'],
      note: 'Permite ampliar o tamanho do texto dinamicamente sem quebrar o layout do aplicativo.'
    },
    {
      name: 'Service Worker (sw.js)',
      cat: 'PWA',
      tags: ['pwa'],
      note: 'Armazena em cache o HTML, CSS e JS para que o quiz continue funcionando offline.'
    },
    {
      name: 'Manifesto Web (manifest.json)',
      cat: 'PWA',
      tags: ['pwa'],
      note: 'Define ícones, cor de tema e modo de exibição standalone para instalação no smartphone.'
    },
    {
      name: 'Feedback Imediato',
      cat: 'Interação',
      tags: ['interacao'],
      note: 'Apresenta explicações detalhadas imediatamente após cada escolha do usuário no quiz.'
    }
  ];

  let filter = 'todos';
  function renderRecursos() {
    const q = document.getElementById('placeSearch').value.toLowerCase();
    const container = document.getElementById('places');
    
    const filtered = recursos.filter(p => 
      (filter === 'todos' || p.tags.includes(filter)) &&
      p.name.toLowerCase().includes(q)
    );

    container.innerHTML = filtered.map(p => `
      <article class="place-card">
        <div class="place-head">
          <div>
            <h3>${p.name}</h3>
            <div class="cat">${p.cat}</div>
          </div>
        </div>
        <p class="place-note">${p.note}</p>
      </article>
    `).join('') || '<p>Nenhum recurso encontrado.</p>';
  }

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      filter = c.dataset.filter;
      renderRecursos();
    };
  });

  document.getElementById('placeSearch').oninput = renderRecursos;
  renderRecursos();

  // Síntese de Voz (Leitor)
  const synth = 'speechSynthesis' in window;
  const speak = document.getElementById('speakBtn');
  const stop = document.getElementById('stopBtn');

  document.getElementById('rateRange').oninput = e => {
    document.getElementById('rateVal').textContent = Number(e.target.value).toFixed(1) + '×';
  };

  speak.onclick = () => {
    const text = document.getElementById('ocrText').value.trim();
    if (!text) return announce('Texto vazio');
    if (!synth) return alert('Sintetizador de voz não suportado neste navegador.');

    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = Number(document.getElementById('rateRange').value);
    
    u.onstart = () => { speak.disabled = true; stop.disabled = false; };
    u.onend = () => { speak.disabled = false; stop.disabled = true; };
    
    speechSynthesis.speak(u);
  };

  stop.onclick = () => {
    speechSynthesis.cancel();
    speak.disabled = false;
    stop.disabled = true;
  };

  // Exibição da Arquitetura do Código
  const modulosCodigo = [
    {
      file: 'index.html',
      desc: 'Estruturação por telas simples (intro, pergunta, resultado) e tags acessíveis ARIA.'
    },
    {
      file: 'style.css',
      desc: 'Variáveis CSS para temas, garantindo troca de alto contraste e redimensionamento de fonte.'
    },
    {
      file: 'app.js',
      desc: 'Classe QuizInclusao que gerencia o estado da pontuação, índice de pergunta e troca de telas.'
    },
    {
      file: 'sw.js',
      desc: 'Intercepta requisições de rede para fornecer arquivos em cache sem dependência de internet.'
    }
  ];

  function renderCodigo() {
    const container = document.getElementById('posts');
    container.innerHTML = modulosCodigo.map(m => `
      <article class="post">
        <div class="post-head">
          <div class="avatar">📄</div>
          <div><b>${m.file}</b></div>
        </div>
        <p>${m.desc}</p>
      </article>
    `).join('');
  }
  renderCodigo();

  // Botão Flutuante de Resumo
  document.getElementById('sosBtn').onclick = () => {
    alert('ℹ️ O aplicativo "Mundo Inclusivo" é um PWA educativo focado em Acessibilidade e na Lei Brasileira de Inclusão.');
    announce('Resumo exibido na tela');
  };
})();