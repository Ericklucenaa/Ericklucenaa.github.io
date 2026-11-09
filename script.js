;(() => {
  const raiz = document.documentElement
  const salvar = (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch (e) {
      /* navegação privada: tudo bem não salvar */
    }
  }
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- recado para quem abre o DevTools ----------
  console.log(
    '%cOlá! 👋 Se você está inspecionando este site, a gente provavelmente se daria bem.',
    'font: 600 14px system-ui; color: #2c5a85',
  )
  console.log(
    '%cQA olhando o console é bom sinal. Me chama: ericklucena2020@gmail.com · linkedin.com/in/erick-lucena-b0a96a1b9',
    'font: 13px system-ui; color: #15803d',
  )

  // ---------- tema claro/escuro ----------
  const temaAtual = () =>
    raiz.dataset.theme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.querySelector('.tema')?.addEventListener('click', () => {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark'
    raiz.dataset.theme = novo
    salvar('tema', novo)
  })

  // ---------- menu mobile ----------
  const botaoMenu = document.querySelector('.menu-botao')
  const menu = document.getElementById('menu')
  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto')
      botaoMenu.setAttribute('aria-expanded', String(aberto))
    })
    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        menu.classList.remove('aberto')
        botaoMenu.setAttribute('aria-expanded', 'false')
      }),
    )
  }

  // ---------- borda do topo ao rolar ----------
  const topo = document.querySelector('.topo')
  const aoRolar = () => topo?.classList.toggle('rolou', window.scrollY > 8)
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()

  // ---------- link ativo no menu ----------
  if (menu) {
    const links = [...menu.querySelectorAll('a[href^="#"]')]
    const secoes = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
    const obs = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting)
            links.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`))
        }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    secoes.forEach((s) => obs.observe(s))
  }

  // ---------- filtros de projetos ----------
  const filtros = document.querySelectorAll('.filtro')
  const projetos = document.querySelectorAll('.projeto')
  filtros.forEach((f) =>
    f.addEventListener('click', () => {
      filtros.forEach((x) => {
        x.classList.toggle('ativo', x === f)
        x.setAttribute('aria-selected', String(x === f))
      })
      projetos.forEach((p) => {
        p.hidden = f.dataset.filtro !== 'todos' && p.dataset.tipo !== f.dataset.filtro
      })
    }),
  )

  // ---------- abas do "Como eu testo" (clique e setas do teclado) ----------
  const abas = [...document.querySelectorAll('.aba')]
  const ativarAba = (aba, focar = false) => {
    abas.forEach((a) => {
      const ativa = a === aba
      a.classList.toggle('ativo', ativa)
      a.setAttribute('aria-selected', String(ativa))
      a.tabIndex = ativa ? 0 : -1
      document.getElementById(a.getAttribute('aria-controls')).hidden = !ativa
    })
    if (focar) aba.focus()
  }
  abas.forEach((aba, i) => {
    aba.addEventListener('click', () => ativarAba(aba))
    aba.addEventListener('keydown', (e) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
      if (!passo) return
      e.preventDefault()
      ativarAba(abas[(i + passo + abas.length) % abas.length], true)
    })
  })

  // ---------- copiar e-mail ----------
  const copiar = document.getElementById('copiar-email')
  copiar?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.email)
      copiar.textContent = 'E-mail copiado ✓'
    } catch (e) {
      copiar.textContent = copiar.dataset.email
    }
    setTimeout(() => (copiar.textContent = 'Copiar e-mail'), 2500)
  })

  const ano = document.getElementById('ano')
  if (ano) ano.textContent = new Date().getFullYear()

  // ---------- terminal: linhas aparecem como numa execução real ----------
  const codigo = document.querySelector('.terminal-corpo code')
  if (codigo && !semMovimento) {
    const linhas = codigo.innerHTML.split('\n')
    codigo.innerHTML = ''
    let i = 0
    const proxima = () => {
      if (i >= linhas.length) return
      codigo.innerHTML += (i ? '\n' : '') + linhas[i]
      const pausa = linhas[i].includes('Running') ? 420 : linhas[i].trim() === '' ? 200 : 260
      i += 1
      setTimeout(proxima, pausa)
    }
    setTimeout(proxima, 500)
  }

  // ---------- revelar seções ao rolar ----------
  if (!semMovimento && 'IntersectionObserver' in window) {
    const alvos = document.querySelectorAll(
      '.numeros, .sobre, .linha-tempo > li, .projeto, .painel:not([hidden]), .hab-card, .extras > div, .contato',
    )
    const obs = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visivel')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.12 },
    )
    alvos.forEach((el) => {
      el.classList.add('revelar')
      obs.observe(el)
    })
  }

  // =====================================================
  // Caça aos bugs: desligada por padrão, ativada no rodapé
  // =====================================================
  const botaoCaca = document.querySelector('.caca-botao')
  const toasts = document.querySelector('.toasts')
  if (!botaoCaca || !toasts) return

  let ligada = false
  let capturados = 0
  let bugAtivo = null
  let agendamento = null

  const toast = (texto) => {
    const t = document.createElement('div')
    t.className = 'toast'
    t.textContent = texto
    toasts.appendChild(t)
    setTimeout(() => t.remove(), 3200)
  }

  const posAleatoria = () => ({
    x: 20 + Math.random() * (window.innerWidth - 80),
    y: 90 + Math.random() * (window.innerHeight - 160),
  })

  const removerBug = () => {
    if (!bugAtivo) return
    clearTimeout(bugAtivo._andar)
    clearTimeout(bugAtivo._fuga)
    bugAtivo.remove()
    bugAtivo = null
  }

  const soltarBug = () => {
    if (!ligada || bugAtivo || document.hidden) return
    const bug = document.createElement('button')
    bug.type = 'button'
    bug.className = 'bug'
    bug.setAttribute('aria-label', 'Bug na tela: clique para capturar')
    bug.innerHTML = '<svg viewBox="0 0 8 8" aria-hidden="true"><use href="#sprite-bug"/></svg>'
    const p = posAleatoria()
    bug.style.left = `${p.x}px`
    bug.style.top = `${p.y}px`
    document.body.appendChild(bug)
    bugAtivo = bug

    let passos = 0
    const andar = () => {
      if (!bug.isConnected || semMovimento) return
      const d = posAleatoria()
      bug.style.left = `${d.x}px`
      bug.style.top = `${d.y}px`
      if (++passos < 4) bug._andar = setTimeout(andar, 2600)
    }
    bug._andar = setTimeout(andar, 60)
    bug._fuga = setTimeout(removerBug, 10500)

    bug.addEventListener('click', () => {
      clearTimeout(bug._andar)
      clearTimeout(bug._fuga)
      const r = bug.getBoundingClientRect()
      bug.style.transition = 'none'
      bug.style.left = `${r.left}px`
      bug.style.top = `${r.top}px`
      bug.classList.add('pego')
      setTimeout(removerBug, 260)
      capturados += 1
      const marcos = { 1: 'Primeiro bug capturado. Isso é QA na prática!', 5: 'Cinco bugs! Você daria um ótimo QA.', 10: 'Dez bugs. Zero bugs em produção!' }
      toast(marcos[capturados] || `Bug capturado · total: ${capturados}`)
    })
  }

  const agendar = (ms) => {
    agendamento = setTimeout(() => {
      soltarBug()
      agendar(6000 + Math.random() * 7000)
    }, ms)
  }

  botaoCaca.addEventListener('click', () => {
    ligada = !ligada
    botaoCaca.setAttribute('aria-pressed', String(ligada))
    botaoCaca.textContent = ligada ? 'Parar a caça aos bugs' : 'Encontrou um bug? 🐞'
    if (ligada) {
      toast('Caça aos bugs ativada: alguns bugs vão aparecer pela tela. Clique neles!')
      agendar(1200)
    } else {
      clearTimeout(agendamento)
      removerBug()
      if (capturados) toast(`Caça encerrada: ${capturados} bug(s) capturado(s).`)
    }
  })
})()
