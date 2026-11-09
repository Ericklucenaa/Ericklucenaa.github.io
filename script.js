;(() => {
  const ler = (k) => {
    try {
      return localStorage.getItem(k)
    } catch (e) {
      return null
    }
  }
  const salvar = (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch (e) {
      /* navegação privada: tudo bem não salvar */
    }
  }
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- efeito CRT ----------
  const botaoCrt = document.querySelector('.crt-botao')
  const aplicarCrt = (ligado) => {
    document.body.classList.toggle('crt', ligado)
    botaoCrt.setAttribute('aria-pressed', String(ligado))
  }
  aplicarCrt(ler('crt') !== 'off')
  botaoCrt.addEventListener('click', () => {
    const ligado = !document.body.classList.contains('crt')
    aplicarCrt(ligado)
    salvar('crt', ligado ? 'on' : 'off')
  })

  // ---------- menu mobile ----------
  const botaoMenu = document.querySelector('.menu-botao')
  const menu = document.getElementById('menu')
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

  // ---------- link ativo no menu ----------
  const links = [...menu.querySelectorAll('a[href^="#"]')]
  const secoes = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
  const obsSecao = new IntersectionObserver(
    (entradas) =>
      entradas.forEach((e) => {
        if (e.isIntersecting)
          links.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`))
      }),
    { rootMargin: '-45% 0px -50% 0px' },
  )
  secoes.forEach((s) => obsSecao.observe(s))

  // ---------- filtro de missões ----------
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

  // ---------- copiar e-mail ----------
  const copiar = document.getElementById('copiar-email')
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.email)
      copiar.textContent = 'Copiado ✔'
    } catch (e) {
      copiar.textContent = copiar.dataset.email
    }
    setTimeout(() => (copiar.textContent = 'Copiar e-mail'), 2500)
  })

  document.getElementById('ano').textContent = new Date().getFullYear()

  // ---------- "CONTINUE?" contagem regressiva (só enquanto visível) ----------
  const contagem = document.getElementById('contagem')
  let timerContagem = null
  if (!semMovimento) {
    new IntersectionObserver(([e]) => {
      clearInterval(timerContagem)
      if (!e.isIntersecting) return
      let n = 9
      contagem.textContent = n
      timerContagem = setInterval(() => {
        n = n === 0 ? 9 : n - 1
        contagem.textContent = n
      }, 1000)
    }).observe(contagem)
  }

  // ---------- terminal da missão principal: linhas aparecem ao entrar na tela ----------
  const codigo = document.querySelector('.terminal-corpo code')
  if (codigo && !semMovimento) {
    const linhas = codigo.innerHTML.split('\n')
    codigo.innerHTML = ''
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let i = 0
      const proxima = () => {
        if (i >= linhas.length) return
        codigo.innerHTML += (i ? '\n' : '') + linhas[i]
        i += 1
        setTimeout(proxima, linhas[i - 1].trim() === '' ? 150 : 230)
      }
      proxima()
    }).observe(codigo)
  }

  // ---------- revelar blocos ao rolar ----------
  if (!semMovimento && 'IntersectionObserver' in window) {
    const alvos = document.querySelectorAll(
      '.conquista, .dialogo, .fase, .projeto, .slot, .contato',
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
  // Minijogo: caça aos bugs
  // =====================================================
  const placar = document.getElementById('placar-bugs')
  const caixaPlacar = document.querySelector('.placar')
  const toasts = document.querySelector('.toasts')
  let capturados = 0
  let bugAtivo = null

  const toast = (html, grande = false) => {
    const t = document.createElement('div')
    t.className = `toast${grande ? ' grande' : ''}`
    t.innerHTML = html
    toasts.appendChild(t)
    setTimeout(() => t.remove(), grande ? 4200 : 2600)
  }

  const CONQUISTAS = {
    1: 'Primeiro bug capturado! Isso é <b>QA</b> na prática.',
    5: '<b>CONQUISTA:</b> Caçador de bugs',
    10: '<b>CONQUISTA:</b> Zero bugs em produção',
  }

  const posAleatoria = () => ({
    x: 20 + Math.random() * (window.innerWidth - 80),
    y: 90 + Math.random() * (window.innerHeight - 160),
  })

  const soltarBug = () => {
    if (bugAtivo || document.hidden) return
    const bug = document.createElement('button')
    bug.type = 'button'
    bug.className = 'bug'
    bug.setAttribute('aria-label', 'Um bug apareceu! Clique para capturar')
    bug.innerHTML = '<svg viewBox="0 0 8 8" aria-hidden="true"><use href="#sprite-bug"/></svg>'
    const p = posAleatoria()
    bug.style.left = `${p.x}px`
    bug.style.top = `${p.y}px`
    document.body.appendChild(bug)
    bugAtivo = bug

    // o bug passeia pela tela
    let passos = 0
    const andar = () => {
      if (!bug.isConnected || semMovimento) return
      const d = posAleatoria()
      bug.style.left = `${d.x}px`
      bug.style.top = `${d.y}px`
      passos += 1
      if (passos < 4) bug._timer = setTimeout(andar, 2600)
    }
    bug._timer = setTimeout(andar, 60)

    // se ninguém pegar, ele foge
    const fuga = setTimeout(() => {
      bug.remove()
      bugAtivo = null
    }, 10500)

    bug.addEventListener('click', () => {
      clearTimeout(bug._timer)
      clearTimeout(fuga)
      const r = bug.getBoundingClientRect()
      bug.style.transition = 'none'
      bug.style.left = `${r.left}px`
      bug.style.top = `${r.top}px`
      bug.classList.add('pego')
      setTimeout(() => {
        bug.remove()
        bugAtivo = null
      }, 260)

      capturados += 1
      placar.textContent = capturados
      caixaPlacar.classList.remove('pulou')
      void caixaPlacar.offsetWidth
      caixaPlacar.classList.add('pulou')
      const recorde = Math.max(capturados, Number(ler('recorde-bugs') || 0))
      salvar('recorde-bugs', String(recorde))

      if (CONQUISTAS[capturados]) toast(CONQUISTAS[capturados], capturados > 1)
      else toast(`<b>+1 BUG</b> capturado · total ${capturados}`)
    })
  }

  // primeiro bug aparece depois de um tempo; os próximos em intervalos aleatórios
  const agendar = (ms) =>
    setTimeout(() => {
      soltarBug()
      agendar(9000 + Math.random() * 9000)
    }, ms)
  agendar(6000)
})()
