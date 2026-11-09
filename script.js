;(() => {
  const raiz = document.documentElement
  const salvar = (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch (e) {
      /* navegação privada: tudo bem não salvar */
    }
  }

  // ---------- tema claro/escuro ----------
  const temaAtual = () =>
    raiz.dataset.theme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.querySelector('.tema').addEventListener('click', () => {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark'
    raiz.dataset.theme = novo
    salvar('tema', novo)
  })

  // ---------- menu mobile ----------
  const botaoMenu = document.querySelector('.menu-botao')
  const menu = document.getElementById('menu')
  const fecharMenu = () => {
    menu.classList.remove('aberto')
    botaoMenu.setAttribute('aria-expanded', 'false')
  }
  botaoMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto')
    botaoMenu.setAttribute('aria-expanded', String(aberto))
  })
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', fecharMenu))

  // ---------- borda do topo ao rolar ----------
  const topo = document.querySelector('.topo')
  const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 8)
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()

  // ---------- link ativo no menu ----------
  const links = [...menu.querySelectorAll('a[href^="#"]')]
  const secoes = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
  const observadorSecao = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return
        links.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`))
      })
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  secoes.forEach((s) => observadorSecao.observe(s))

  // ---------- filtros de projetos ----------
  const filtros = document.querySelectorAll('.filtro')
  const projetos = document.querySelectorAll('.projeto')
  filtros.forEach((f) =>
    f.addEventListener('click', () => {
      filtros.forEach((x) => {
        x.classList.toggle('ativo', x === f)
        x.setAttribute('aria-selected', String(x === f))
      })
      const tipo = f.dataset.filtro
      projetos.forEach((p) => {
        p.hidden = tipo !== 'todos' && p.dataset.tipo !== tipo
      })
    }),
  )

  // ---------- copiar e-mail ----------
  const copiar = document.getElementById('copiar-email')
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.email)
      copiar.textContent = 'E-mail copiado ✓'
    } catch (e) {
      copiar.textContent = copiar.dataset.email
    }
    setTimeout(() => (copiar.textContent = 'Copiar e-mail'), 2500)
  })

  // ---------- ano no rodapé ----------
  document.getElementById('ano').textContent = new Date().getFullYear()

  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
      '.numeros, .sobre, .linha-tempo > li, .projeto, .hab-card, .extras > div, .contato',
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
})()
