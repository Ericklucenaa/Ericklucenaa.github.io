;(() => {
  const raiz = document.documentElement
  const salvar = (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch (e) {
      /* navegação privada: tudo bem não salvar */
    }
  }
  const ler = (k) => {
    try {
      return localStorage.getItem(k)
    } catch (e) {
      return null
    }
  }
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- recado para quem abre o DevTools ----------
  console.log(
    '%cSe você está inspecionando este site, a gente provavelmente se daria bem.',
    'font: 600 14px system-ui; color: #b38a3e',
  )
  console.log(
    '%cQA olhando o console é bom sinal. Me chama: ericklucena2020@gmail.com',
    'font: 13px system-ui',
  )

  // =====================================================
  // Luminária: acender e apagar a página
  // =====================================================
  const acesa = () => raiz.dataset.theme === 'light'
  const interruptor = document.querySelector('.interruptor')
  const interruptorTexto = document.querySelector('.interruptor-texto')
  const cordinha = document.querySelector('.cordinha')
  const dica = document.querySelector('.dica')
  const abertura = document.querySelector('.abertura-lampada')

  const sincronizar = () => {
    const on = acesa()
    interruptor?.setAttribute('aria-pressed', String(on))
    if (interruptorTexto) interruptorTexto.textContent = on ? 'Apagar' : 'Acender'
    cordinha?.setAttribute('aria-pressed', String(on))
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', on ? '#f3ede2' : '#15130f')
  }
  sincronizar()
  if (ler('luz-usada')) dica?.classList.add('sumiu')

  // ---------- som (Web Audio, sintetizado na hora) ----------
  let audio = null
  const tocar = (ligando) => {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)()
      if (audio.state === 'suspended') audio.resume()
      const agora = audio.currentTime

      // estalo do interruptor: ruído curto e filtrado
      const tamanho = Math.floor(audio.sampleRate * 0.03)
      const buffer = audio.createBuffer(1, tamanho, audio.sampleRate)
      const dados = buffer.getChannelData(0)
      for (let i = 0; i < tamanho; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho) ** 3
      const estalo = audio.createBufferSource()
      estalo.buffer = buffer
      const filtro = audio.createBiquadFilter()
      filtro.type = 'bandpass'
      filtro.frequency.value = ligando ? 2400 : 1700
      const ganhoEstalo = audio.createGain()
      ganhoEstalo.gain.value = 0.18
      estalo.connect(filtro).connect(ganhoEstalo).connect(audio.destination)
      estalo.start(agora)

      if (!ligando) return
      // zumbido grave da lâmpada acendendo
      const zumbido = audio.createOscillator()
      const ganho = audio.createGain()
      zumbido.type = 'sine'
      zumbido.frequency.setValueAtTime(120, agora + 0.05)
      ganho.gain.setValueAtTime(0.001, agora)
      ganho.gain.linearRampToValueAtTime(0.05, agora + 0.08)
      ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.35)
      zumbido.connect(ganho).connect(audio.destination)
      zumbido.start(agora + 0.05)
      zumbido.stop(agora + 0.38)
    } catch (e) {
      /* sem áudio: segue só o visual */
    }
  }

  // ---------- alternar, com a luz se espalhando a partir da lâmpada ----------
  const origemDaLuz = (botao) => {
    const alvo = abertura && abertura.getBoundingClientRect()
    if (alvo && alvo.bottom > 0 && alvo.top < window.innerHeight && alvo.width)
      return { x: alvo.left + alvo.width / 2, y: alvo.top + alvo.height / 2 }
    const r = botao.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  const alternar = (botao) => {
    const ligando = !acesa()
    tocar(ligando)
    salvar('luz-usada', '1')
    dica?.classList.add('sumiu')

    const aplicar = () => {
      raiz.dataset.theme = ligando ? 'light' : 'dark'
      salvar('tema', raiz.dataset.theme)
      sincronizar()
    }

    if (semMovimento || !document.startViewTransition) {
      aplicar()
      return
    }

    const { x, y } = origemDaLuz(botao)
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    raiz.classList.toggle('apagando', !ligando)
    const transicao = document.startViewTransition(aplicar)
    transicao.ready.then(() => {
      const circulos = [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`]
      raiz.animate(
        { clipPath: ligando ? circulos : circulos.reverse() },
        {
          duration: ligando ? 750 : 550,
          easing: ligando ? 'cubic-bezier(.2,.7,.2,1)' : 'cubic-bezier(.6,0,.8,.4)',
          pseudoElement: ligando ? '::view-transition-new(root)' : '::view-transition-old(root)',
        },
      )
      if (ligando) {
        raiz.classList.add('acendendo')
        setTimeout(() => raiz.classList.remove('acendendo'), 450)
      }
    })
    transicao.finished.finally(() => raiz.classList.remove('apagando'))
  }

  interruptor?.addEventListener('click', () => alternar(interruptor))

  // ---------- a cordinha: arrastar, soltar e balançar como mola ----------
  const svg = document.querySelector('.cena-svg')
  const cordao = document.querySelector('.cordao')
  const puxador = document.querySelector('.puxador')
  if (cordinha && svg && cordao && puxador) {
    const BASE = { x: 287, y: 262 } // ponta da cordinha no SVG (viewBox 400)
    const LIMITE_PUXAO = 30 // px de puxão para acionar
    let pos = { x: 0, y: 0 } // deslocamento em px
    let vel = { x: 0, y: 0 }
    let arrasto = null
    let quadro = 0
    let ignorarClique = false

    const escala = () => svg.getBoundingClientRect().width / 400

    const desenhar = () => {
      const s = escala() || 1
      const x = BASE.x + pos.x / s
      const y = BASE.y + pos.y / s
      cordao.setAttribute('x2', x.toFixed(2))
      cordao.setAttribute('y2', y.toFixed(2))
      puxador.setAttribute('cx', x.toFixed(2))
      puxador.setAttribute('cy', y.toFixed(2))
      cordinha.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    }

    const mola = () => {
      cancelAnimationFrame(quadro)
      if (semMovimento) {
        pos = { x: 0, y: 0 }
        desenhar()
        return
      }
      const passo = () => {
        // mola amortecida, com um pouco mais de balanço na horizontal
        vel.x += -0.06 * pos.x - 0.06 * vel.x
        vel.y += -0.16 * pos.y - 0.2 * vel.y
        pos.x += vel.x
        pos.y += vel.y
        desenhar()
        const parado = Math.abs(pos.x) + Math.abs(pos.y) + Math.abs(vel.x) + Math.abs(vel.y) < 0.05
        if (parado) {
          pos = { x: 0, y: 0 }
          desenhar()
        } else quadro = requestAnimationFrame(passo)
      }
      quadro = requestAnimationFrame(passo)
    }

    cordinha.addEventListener('pointerdown', (e) => {
      cancelAnimationFrame(quadro)
      cordinha.setPointerCapture(e.pointerId)
      arrasto = { x: e.clientX - pos.x, y: e.clientY - pos.y, moveu: false }
    })
    cordinha.addEventListener('pointermove', (e) => {
      if (!arrasto) return
      const dx = e.clientX - arrasto.x
      const dy = e.clientY - arrasto.y
      if (Math.abs(dx) + Math.abs(dy) > 4) arrasto.moveu = true
      // a corda estica para baixo e balança para os lados, com resistência
      pos = { x: Math.max(-36, Math.min(36, dx * 0.6)), y: Math.max(-6, Math.min(64, dy)) }
      vel = { x: 0, y: 0 }
      desenhar()
    })
    const soltar = () => {
      if (!arrasto) return
      if (arrasto.moveu) {
        ignorarClique = true
        if (pos.y > LIMITE_PUXAO) alternar(cordinha)
      }
      arrasto = null
      mola()
    }
    cordinha.addEventListener('pointerup', soltar)
    cordinha.addEventListener('pointercancel', soltar)

    // toque simples, Enter ou Espaço: puxa sozinha
    cordinha.addEventListener('click', () => {
      if (ignorarClique) {
        ignorarClique = false
        return
      }
      pos = { x: 0, y: 38 }
      vel = { x: 1.4, y: 0 }
      desenhar()
      alternar(cordinha)
      mola()
    })

    window.addEventListener('resize', desenhar, { passive: true })
  }

  // =====================================================
  // Navegação
  // =====================================================
  const botaoMenu = document.querySelector('.menu-botao')
  const menu = document.getElementById('menu')
  if (botaoMenu && menu) {
    const fechar = () => {
      menu.classList.remove('aberto')
      botaoMenu.setAttribute('aria-expanded', 'false')
    }
    botaoMenu.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto')
      botaoMenu.setAttribute('aria-expanded', String(aberto))
    })
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', fechar))
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) {
        fechar()
        botaoMenu.focus()
      }
    })
  }

  const topo = document.querySelector('.topo')
  const aoRolar = () => topo?.classList.toggle('rolou', window.scrollY > 8)
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()

  if (menu && 'IntersectionObserver' in window) {
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
  const vazio = document.querySelector('.filtro-vazio')
  filtros.forEach((f) =>
    f.addEventListener('click', () => {
      filtros.forEach((x) => x.setAttribute('aria-pressed', String(x === f)))
      let visiveis = 0
      projetos.forEach((p) => {
        p.hidden = f.dataset.filtro !== 'todos' && p.dataset.tipo !== f.dataset.filtro
        if (!p.hidden) visiveis += 1
      })
      if (vazio) vazio.hidden = visiveis > 0
    }),
  )

  // ---------- copiar e-mail ----------
  const copiar = document.getElementById('copiar-email')
  copiar?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.email)
      copiar.textContent = 'Copiado'
    } catch (e) {
      copiar.textContent = 'Não foi possível copiar'
    }
    setTimeout(() => (copiar.textContent = 'Copiar'), 2200)
  })

  const ano = document.getElementById('ano')
  if (ano) ano.textContent = new Date().getFullYear()

  // ---------- revelar ao rolar ----------
  if (!semMovimento && 'IntersectionObserver' in window) {
    const alvos = document.querySelectorAll('.sobre, .trajetoria > li, .projeto, .habilidades > div, .contato-corpo')
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
  const textoCaca = document.querySelector('.caca-texto')
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
      const marcos = {
        1: 'Primeiro bug capturado. Isso é QA na prática.',
        5: 'Cinco bugs. Você daria um ótimo QA.',
        10: 'Dez bugs. Zero bugs em produção.',
      }
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
    if (textoCaca) textoCaca.textContent = ligada ? 'Parar a caça aos bugs' : 'Encontrou um bug?'
    if (ligada) {
      toast('Caça aos bugs ativada: alguns bugs vão aparecer pela tela. Clique neles.')
      agendar(1200)
    } else {
      clearTimeout(agendamento)
      removerBug()
      if (capturados) toast(`Caça encerrada: ${capturados} bug(s) capturado(s).`)
    }
  })
})()
