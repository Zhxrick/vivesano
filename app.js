/* ViveSano - lógica del prototipo navegable (SPA con rutas por hash) */

// ---------- Modo wireframe ----------
if (new URLSearchParams(location.search).get("modo") === "wireframe") {
  document.documentElement.classList.add("wf");
}

// ---------- Almacenamiento seguro ----------
const memoria = {};
const guardar = (k, v) => { try { localStorage.setItem("vs_" + k, JSON.stringify(v)); } catch (e) { memoria[k] = v; } };
const leer = (k, def) => {
  try { const v = localStorage.getItem("vs_" + k); return v ? JSON.parse(v) : (k in memoria ? memoria[k] : def); }
  catch (e) { return k in memoria ? memoria[k] : def; }
};

// ---------- Estado ----------
let usuario = leer("usuario", null);
let favoritos = leer("favoritos", []);
let contenidos = leer("contenidos", RECOMENDACIONES);
let habitos = leer("habitos", HABITOS_BASE.map((h, i) => ({ ...h, dias: [true, true, i % 2 === 0, true, false, i === 0, false] })));
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

const $ = (s, el = document) => el.querySelector(s);
const main = $("#contenido");

// ---------- Iconos ----------
const ICONOS = {
  alimentacion: '<path d="M12 7c-1.6-1.3-5.2-1.9-6.7 1-1.8 3.3 0 9.2 3.1 10.8 1.2.6 2.4.2 3.6.2s2.4.4 3.6-.2c3.1-1.6 4.9-7.5 3.1-10.8C17.2 5.1 13.6 5.7 12 7z"/><path d="M12 7c0-2 1-3.6 3-4.2"/>',
  actividad: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  descanso: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bienestar: '<path d="M12 20s-7-4.3-8.7-8.6C2.1 8.2 4.1 5 7.3 5c1.9 0 3.1.9 4.7 2.8C13.6 5.9 14.8 5 16.7 5c3.2 0 5.2 3.2 4 6.4C19 15.7 12 20 12 20z"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  nivel: '<path d="M4 20V14M10 20V9M16 20V4"/>',
  corazon: '<path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.3 1 5 3 1.7-2 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  escudo: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  filtro: '<path d="M3 5h18M6 12h12M10 19h4"/>'
};
const icono = (n, t = 20, relleno = false) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="${relleno ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n]}</svg>`;

// Ilustración generada por categoría (reemplaza fotos para que el prototipo cargue rápido)
function ilus(cat, semilla = 1) {
  const c = CATEGORIAS[cat];
  const x = 60 + (semilla * 37) % 220, y = 30 + (semilla * 53) % 90;
  return `<svg class="ilus" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustración de ${c.nombre}">
    <defs><linearGradient id="g${cat}${semilla}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.claro}"/><stop offset="1" stop-color="${c.color}" stop-opacity=".55"/></linearGradient></defs>
    <rect width="400" height="225" fill="url(#g${cat}${semilla})"/>
    <circle cx="${x}" cy="${y}" r="70" fill="#fff" opacity=".35"/><circle cx="${360 - x / 2}" cy="${200 - y / 3}" r="48" fill="#fff" opacity=".25"/>
    <g transform="translate(160 72) scale(3.4)" fill="none" stroke="${c.color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONOS[cat]}</g>
  </svg>`;
}

// ---------- Utilidades ----------
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("visible");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("visible"), 2600);
}
const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const publicados = () => contenidos.filter(r => r.publicado);
const estiloCat = cat => `--c:${CATEGORIAS[cat].color};--cc:${CATEGORIAS[cat].claro}`;

function puntaje(r) {
  if (!usuario || !usuario.perfil) return 0;
  const p = usuario.perfil; let s = 0;
  if (r.objetivos.includes(p.objetivo)) s += 3;
  if ((p.restricciones || []).some(x => r.restricciones.includes(x))) s += 2;
  if (p.actividad === "baja" && r.nivel === "Básico") s += 1;
  return s;
}

function tarjeta(r, mostrarPorque = false) {
  const fav = favoritos.includes(r.id);
  const porque = mostrarPorque && usuario?.perfil && r.objetivos.includes(usuario.perfil.objetivo)
    ? `<span class="porque">Porque quieres: ${OBJETIVOS[usuario.perfil.objetivo].toLowerCase()}</span>` : "";
  return `<article class="tarjeta" style="${estiloCat(r.cat)}">
    <div class="tarjeta__img">${ilus(r.cat, r.id)}
      <button class="tarjeta__fav ${fav ? "activo" : ""}" data-fav="${r.id}" aria-label="${fav ? "Quitar de" : "Guardar en"} favoritos" aria-pressed="${fav}">${icono("corazon", 20, fav)}</button>
    </div>
    <div class="tarjeta__cuerpo">
      <div>${porque}</div>
      <span class="etiqueta">${CATEGORIAS[r.cat].nombre}</span>
      <h3><a href="#/detalle/${r.id}">${esc(r.titulo)}</a></h3>
      <p>${esc(r.resumen)}</p>
      <div class="meta"><span>${icono("reloj", 16)} ${r.tiempo} min</span><span>${icono("nivel", 16)} ${r.nivel}</span></div>
    </div>
  </article>`;
}

function alternarFavorito(id) {
  if (!usuario) { toast("Inicia sesión para guardar tus favoritos"); location.hash = "#/login"; return; }
  id = Number(id);
  if (favoritos.includes(id)) { favoritos = favoritos.filter(f => f !== id); toast("Se quitó de tus favoritos"); }
  else { favoritos.push(id); toast("¡Guardado en favoritos!"); }
  guardar("favoritos", favoritos);
  router();
}

// ---------- Páginas ----------
const paginas = {
  inicio() {
    const recs = usuario?.perfil
      ? [...publicados()].sort((a, b) => puntaje(b) - puntaje(a)).slice(0, 3)
      : Object.keys(CATEGORIAS).slice(0, 3).map(c => publicados().find(r => r.cat === c));
    return `
    <section class="hero"><div class="contenedor hero__fila">
      <div>
        <h1>Pequeños hábitos, <span style="color:var(--verde)">grandes cambios</span></h1>
        <p class="lead">Encuentra recomendaciones de alimentación, actividad física, descanso y bienestar pensadas para tu estilo de vida.</p>
        <form class="buscador" id="formBuscar" role="search">
          <label for="q" class="saltar">Buscar recomendaciones</label>
          <input id="q" name="q" placeholder="¿Qué quieres mejorar hoy? Ej: dormir, desayuno…" autocomplete="off">
          <button class="btn btn--primario" type="submit">${icono("buscar", 18)} Buscar</button>
        </form>
        <div class="etiquetas-rapidas">
          <a class="chip" href="#/recomendaciones?q=dormir">Dormir mejor</a>
          <a class="chip" href="#/recomendaciones?q=estrés">Estrés</a>
          <a class="chip" href="#/recomendaciones?q=desayuno">Desayuno</a>
          <a class="chip" href="#/recomendaciones?q=caminata">Caminata</a>
        </div>
      </div>
      <div class="hero__ilus">${ilus("alimentacion", 7)}</div>
    </div></section>

    <section class="seccion contenedor">
      <div class="seccion__cab"><div><h2>Explora por categoría</h2><p>Cuatro áreas para cuidar tu salud de forma integral.</p></div></div>
      <div class="categorias">
        ${Object.entries(CATEGORIAS).map(([k, c]) => `
          <a class="categoria" href="#/recomendaciones?cat=${k}" style="${estiloCat(k)}">
            <div class="categoria__icono">${icono(k, 26)}</div>
            <h3>${c.nombre}</h3><p>${publicados().filter(r => r.cat === k).length} recomendaciones</p>
          </a>`).join("")}
      </div>
    </section>

    <section class="seccion contenedor" style="padding-top:0">
      <div class="seccion__cab">
        <div><h2>${usuario?.perfil ? "Recomendadas para ti, " + esc(usuario.nombre.split(" ")[0]) : "Recomendaciones destacadas"}</h2>
        <p>${usuario?.perfil ? "Según tu objetivo: " + OBJETIVOS[usuario.perfil.objetivo] : "Lo más consultado esta semana"}</p></div>
        <a class="btn btn--borde btn--pequeno" href="#/recomendaciones">Ver todas</a>
      </div>
      <div class="rejilla">${recs.map(r => tarjeta(r, true)).join("")}</div>
    </section>

    <section class="contenedor">
      <div class="aviso">
        ${usuario
          ? `<p><b>Tu progreso de la semana:</b> llevas ${cumplimiento()}% de tus hábitos cumplidos. ¡Sigue así!</p><a class="btn btn--primario btn--pequeno" href="#/habitos">Ver mis hábitos</a>`
          : `<p><b>Crea tu perfil de salud</b> y recibe recomendaciones personalizadas y seguimiento de tus hábitos.</p><a class="btn btn--primario btn--pequeno" href="#/registro">Crear cuenta gratis</a>`}
      </div>
    </section>`;
  },

  recomendaciones(params) {
    const q = params.get("q") || "", cat = params.get("cat") || "";
    return `
    <section class="contenedor titulo-pagina">
      <h1>Recomendaciones</h1>
      <p>Busca y filtra consejos según lo que necesitas.</p>
    </section>
    <section class="contenedor listado">
      <aside class="filtros" id="panelFiltros" aria-label="Filtros">
        <fieldset><legend>Categoría</legend>
          ${Object.entries(CATEGORIAS).map(([k, c]) => `<label class="check"><input type="checkbox" name="cat" value="${k}" ${cat === k ? "checked" : ""}> ${c.nombre}</label>`).join("")}
        </fieldset>
        <fieldset><legend>Objetivo</legend>
          ${Object.entries(OBJETIVOS).map(([k, o]) => `<label class="check"><input type="checkbox" name="obj" value="${k}"> ${o}</label>`).join("")}
        </fieldset>
        <fieldset><legend>Tiempo</legend>
          <select name="tiempo" aria-label="Tiempo"><option value="">Cualquiera</option><option value="5">Hasta 5 min</option><option value="15">Hasta 15 min</option><option value="30">Hasta 30 min</option></select>
        </fieldset>
        <fieldset><legend>Nivel</legend>
          <label class="check"><input type="checkbox" name="nivel" value="Básico"> Básico</label>
          <label class="check"><input type="checkbox" name="nivel" value="Intermedio"> Intermedio</label>
        </fieldset>
        <button class="btn btn--suave btn--bloque btn--pequeno" id="limpiar" type="button">Limpiar filtros</button>
      </aside>
      <div>
        <form class="buscador" id="formLista" role="search" style="max-width:none;margin-bottom:16px">
          <label for="q2" class="saltar">Buscar</label>
          <input id="q2" name="q" value="${esc(q)}" placeholder="Buscar por palabra clave…" autocomplete="off">
          <button class="btn btn--primario" type="submit">${icono("buscar", 18)} Buscar</button>
        </form>
        <div class="barra-resultados">
          <span id="conteo" aria-live="polite"></span>
          <div style="display:flex;gap:8px">
            <button class="btn btn--borde btn--pequeno btn-filtros" id="verFiltros" type="button">${icono("filtro", 16)} Filtros</button>
            <select id="orden" aria-label="Ordenar">
              <option value="relevancia">${usuario?.perfil ? "Para mí" : "Relevancia"}</option>
              <option value="tiempo">Menor tiempo</option>
              <option value="az">A - Z</option>
            </select>
          </div>
        </div>
        <div class="rejilla" id="resultados" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"></div>
      </div>
    </section>`;
  },

  detalle(params, id) {
    const r = contenidos.find(x => x.id === Number(id));
    if (!r) return `<section class="contenedor vacio" style="margin-top:32px"><h2>No encontramos esta recomendación</h2><a class="btn btn--primario" href="#/recomendaciones">Volver</a></section>`;
    const fav = favoritos.includes(r.id);
    const relacionadas = publicados().filter(x => x.cat === r.cat && x.id !== r.id).slice(0, 2);
    const yaHabito = habitos.some(h => h.id === "rec" + r.id);
    return `
    <div class="contenedor">
      <nav class="migas" aria-label="Ruta"><a href="#/inicio">Inicio</a> › <a href="#/recomendaciones?cat=${r.cat}">${CATEGORIAS[r.cat].nombre}</a> › ${esc(r.titulo)}</nav>
      <div class="detalle" style="${estiloCat(r.cat)}">
        <article>
          <div class="detalle__img">${ilus(r.cat, r.id)}</div>
          <span class="etiqueta">${CATEGORIAS[r.cat].nombre}</span>
          <h1>${esc(r.titulo)}</h1>
          <div class="meta" style="margin-bottom:16px"><span>${icono("reloj", 16)} ${r.tiempo} min</span><span>${icono("nivel", 16)} ${r.nivel}</span><span>Por ${esc(r.autor)}</span></div>
          <p style="font-size:1.08rem">${esc(r.resumen)}</p>
          <h2>Paso a paso</h2>
          <ol class="pasos">${r.pasos.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
          <p class="nota">Esta recomendación es de carácter general. Si tienes una condición médica, consulta con un profesional de la salud.</p>
        </article>
        <aside>
          <div class="panel">
            <h3>¿Te sirvió?</h3>
            <button class="btn btn--borde btn--bloque" data-fav="${r.id}" aria-pressed="${fav}">${icono("corazon", 18, fav)} ${fav ? "Guardado en favoritos" : "Guardar en favoritos"}</button>
            <button class="btn btn--primario btn--bloque" id="agregarHabito" ${yaHabito ? "disabled" : ""}>${icono("check", 18)} ${yaHabito ? "Ya está en tus hábitos" : "Agregar a mis hábitos"}</button>
            <p class="nota" style="margin:0">Al agregarla podrás marcar cada día que la cumplas.</p>
          </div>
          ${relacionadas.length ? `<div class="panel"><h3>También te puede servir</h3>
            ${relacionadas.map(x => `<p style="margin-bottom:8px"><a href="#/detalle/${x.id}">${esc(x.titulo)}</a><br><small class="nota">${x.tiempo} min · ${x.nivel}</small></p>`).join("")}</div>` : ""}
        </aside>
      </div>
    </div>`;
  },

  login() {
    return `
    <section class="auth">
      <div class="auth__lado">
        <h1>Bienvenido de nuevo</h1>
        <p>Ingresa para ver tus recomendaciones personalizadas, tus favoritos y el avance de tus hábitos.</p>
        <ul><li>Tus datos de salud están protegidos</li><li>Conexión cifrada (HTTPS)</li><li>Tú decides qué compartir</li></ul>
      </div>
      <div class="auth__form"><div class="auth__caja">
        <h2>Iniciar sesión</h2>
        <form id="formLogin" novalidate>
          <div class="campo"><label for="correo">Correo electrónico</label><input id="correo" type="email" autocomplete="email" placeholder="tucorreo@ejemplo.com"><span class="error-msg">Escribe un correo válido.</span></div>
          <div class="campo"><label for="clave">Contraseña</label><input id="clave" type="password" autocomplete="current-password" placeholder="Mínimo 8 caracteres"><span class="error-msg">La contraseña debe tener mínimo 8 caracteres.</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:.9rem"><label class="check" style="font-weight:400"><input type="checkbox"> Recordarme</label><a href="#/login" onclick="toast('Te enviamos un enlace para recuperar tu contraseña');return false;">¿Olvidaste tu contraseña?</a></div>
          <button class="btn btn--primario btn--bloque" type="submit">Ingresar</button>
        </form>
        <p class="separador">¿No tienes cuenta? <a href="#/registro">Regístrate aquí</a></p>
        <p class="nota" style="text-align:center">Demo: cualquier correo y clave de 8+ caracteres. Usa <b>admin@vivesano.co</b> para ver el panel de contenidos.</p>
      </div></div>
    </section>`;
  },

  registro(params) {
    const paso = params.get("paso") === "2" ? 2 : 1;
    const form1 = `
      <form id="formRegistro1" novalidate>
        <div class="campo"><label for="nombre">Nombre completo</label><input id="nombre" autocomplete="name" placeholder="Ej: Laura Gómez"><span class="error-msg">Escribe tu nombre.</span></div>
        <div class="campo"><label for="correoR">Correo electrónico</label><input id="correoR" type="email" autocomplete="email" placeholder="tucorreo@ejemplo.com"><span class="error-msg">Escribe un correo válido.</span></div>
        <div class="campo"><label for="claveR">Contraseña</label><input id="claveR" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres, con un número">
          <div class="fuerza"><span id="barraFuerza"></span></div><small id="textoFuerza">Usa letras y números</small><span class="error-msg">Mínimo 8 caracteres y al menos un número.</span></div>
        <div class="campo"><label class="check"><input type="checkbox" id="acepto"> <span>Acepto los <a href="#/privacidad">términos y la política de tratamiento de datos</a> (Ley 1581 de 2012).</span></label><span class="error-msg">Debes aceptar para continuar.</span></div>
        <button class="btn btn--primario btn--bloque" type="submit">Continuar</button>
      </form>`;
    const form2 = `
      <form id="formRegistro2" novalidate>
        <div class="campo"><label for="objetivo">¿Cuál es tu objetivo principal?</label>
          <select id="objetivo">${Object.entries(OBJETIVOS).map(([k, o]) => `<option value="${k}">${o}</option>`).join("")}</select></div>
        <div class="campo"><label for="actividadR">Nivel de actividad física</label>
          <select id="actividadR"><option value="baja">Baja (casi no hago ejercicio)</option><option value="media">Media (1 a 3 veces por semana)</option><option value="alta">Alta (4 o más veces por semana)</option></select></div>
        <fieldset class="campo" style="border:0;padding:0"><legend style="font-weight:700;margin-bottom:6px">Restricciones alimentarias (opcional)</legend>
          <label class="check"><input type="checkbox" name="restr" value="gluten"> Sin gluten</label>
          <label class="check"><input type="checkbox" name="restr" value="lactosa"> Sin lactosa</label>
          <label class="check"><input type="checkbox" name="restr" value="vegetariano"> Vegetariano</label>
        </fieldset>
        <button class="btn btn--primario btn--bloque" type="submit">Crear mi cuenta</button>
        <button class="btn btn--suave btn--bloque" type="button" id="omitir" style="margin-top:8px">Completar después</button>
      </form>`;
    return `
    <section class="auth">
      <div class="auth__lado">
        <h1>Crea tu cuenta</h1>
        <p>Solo te pediremos lo necesario para darte recomendaciones que de verdad te sirvan.</p>
        <ul><li>Recomendaciones según tu objetivo</li><li>Guarda tus favoritos</li><li>Lleva el registro de tus hábitos</li></ul>
      </div>
      <div class="auth__form"><div class="auth__caja">
        <div class="pasos-registro"><span class="ok"></span><span class="${paso === 2 ? "ok" : ""}"></span></div>
        <p class="nota">Paso ${paso} de 2 · ${paso === 1 ? "Datos de la cuenta" : "Perfil de salud básico"}</p>
        <h2>${paso === 1 ? "Registro" : "Cuéntanos de ti"}</h2>
        ${paso === 1 ? form1 : form2}
        ${paso === 1 ? `<p class="separador">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>` : ""}
      </div></div>
    </section>`;
  },

  perfil() {
    const p = usuario.perfil || { objetivo: "energia", actividad: "media", restricciones: [], edad: "", peso: "", estatura: "", sueno: "" };
    const imc = p.peso && p.estatura ? (p.peso / ((p.estatura / 100) ** 2)).toFixed(1) : "--";
    const priv = usuario.privacidad || { compartir: false, recordatorios: true, analitica: false };
    return `
    <section class="contenedor titulo-pagina"><h1>Mi perfil de salud</h1><p>Esta información se usa solo para personalizar tus recomendaciones.</p></section>
    <section class="contenedor perfil">
      <div>
        <div class="panel tarjeta-perfil">
          <div class="avatar">${esc(usuario.nombre[0])}</div>
          <h3 style="margin:0">${esc(usuario.nombre)}</h3>
          <p class="nota">${esc(usuario.correo)}</p>
          <p class="nota" style="margin:0">Índice de masa corporal</p>
          <div class="imc">${imc}</div>
          <p class="nota">Valor orientativo, no es un diagnóstico.</p>
        </div>
        <div class="panel">
          <h3>${icono("escudo", 18)} Privacidad</h3>
          <div class="interruptor"><div><b>Recordatorios</b><p>Avisos de mis hábitos</p></div><input type="checkbox" data-priv="recordatorios" ${priv.recordatorios ? "checked" : ""} aria-label="Recordatorios"></div>
          <div class="interruptor"><div><b>Compartir datos</b><p>Con fines estadísticos anónimos</p></div><input type="checkbox" data-priv="compartir" ${priv.compartir ? "checked" : ""} aria-label="Compartir datos"></div>
          <div class="interruptor"><div><b>Cookies de analítica</b><p>Ayudan a mejorar la página</p></div><input type="checkbox" data-priv="analitica" ${priv.analitica ? "checked" : ""} aria-label="Cookies de analítica"></div>
          <button class="btn btn--peligro btn--bloque btn--pequeno" id="borrarDatos" style="margin-top:12px">Eliminar mi cuenta y datos</button>
        </div>
      </div>
      <div class="panel">
        <h2>Datos de salud</h2>
        <form id="formPerfil" novalidate>
          <div class="fila-2">
            <div class="campo"><label for="edad">Edad</label><input id="edad" type="number" min="14" max="100" value="${p.edad}" placeholder="Años"></div>
            <div class="campo"><label for="sueno">Horas de sueño promedio</label><input id="sueno" type="number" min="0" max="14" value="${p.sueno}" placeholder="Ej: 7"></div>
          </div>
          <div class="fila-2">
            <div class="campo"><label for="peso">Peso (kg)</label><input id="peso" type="number" min="20" max="300" value="${p.peso}" placeholder="Ej: 62"><span class="error-msg">Escribe un peso válido.</span></div>
            <div class="campo"><label for="estatura">Estatura (cm)</label><input id="estatura" type="number" min="100" max="230" value="${p.estatura}" placeholder="Ej: 165"><span class="error-msg">Escribe una estatura válida.</span></div>
          </div>
          <div class="fila-2">
            <div class="campo"><label for="objetivoP">Objetivo principal</label><select id="objetivoP">${Object.entries(OBJETIVOS).map(([k, o]) => `<option value="${k}" ${p.objetivo === k ? "selected" : ""}>${o}</option>`).join("")}</select></div>
            <div class="campo"><label for="actividadP">Nivel de actividad</label><select id="actividadP">
              <option value="baja" ${p.actividad === "baja" ? "selected" : ""}>Baja</option><option value="media" ${p.actividad === "media" ? "selected" : ""}>Media</option><option value="alta" ${p.actividad === "alta" ? "selected" : ""}>Alta</option></select></div>
          </div>
          <fieldset class="campo" style="border:0;padding:0"><legend style="font-weight:700;margin-bottom:6px">Restricciones alimentarias</legend>
            ${[["gluten", "Sin gluten"], ["lactosa", "Sin lactosa"], ["vegetariano", "Vegetariano"]].map(([v, t]) => `<label class="check"><input type="checkbox" name="restrP" value="${v}" ${(p.restricciones || []).includes(v) ? "checked" : ""}> ${t}</label>`).join("")}
          </fieldset>
          <button class="btn btn--primario" type="submit">Guardar cambios</button>
        </form>
      </div>
    </section>`;
  },

  favoritos() {
    const lista = contenidos.filter(r => favoritos.includes(r.id));
    return `
    <section class="contenedor titulo-pagina"><h1>Mis favoritos</h1><p>Las recomendaciones que guardaste para consultar después.</p></section>
    <section class="contenedor">
      ${lista.length ? `<div class="rejilla">${lista.map(r => tarjeta(r)).join("")}</div>`
        : `<div class="vacio">${icono("corazon", 40)}<h2>Aún no tienes favoritos</h2><p>Toca el corazón en cualquier recomendación para guardarla aquí.</p><a class="btn btn--primario" href="#/recomendaciones">Explorar recomendaciones</a></div>`}
    </section>`;
  },

  habitos() {
    const total = habitos.length * 7, hechos = habitos.reduce((s, h) => s + h.dias.filter(Boolean).length, 0);
    return `
    <section class="contenedor titulo-pagina" style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap">
      <div><h1>Mis hábitos</h1><p>Marca cada día que cumplas. Semana del 2 al 8 de noviembre.</p></div>
      <a class="btn btn--borde btn--pequeno" href="#/recomendaciones">+ Agregar desde recomendaciones</a>
    </section>
    <section class="contenedor">
      <div class="resumen-habitos">
        <div class="kpi"><strong>${cumplimiento()}%</strong><span>Cumplimiento semanal (${hechos} de ${total})</span></div>
        <div class="kpi"><strong>${racha()} días</strong><span>Racha actual</span></div>
        <div class="kpi"><strong>${habitos.length}</strong><span>Hábitos activos</span></div>
      </div>
      <div style="overflow-x:auto">
      <table class="tabla-habitos">
        <thead><tr><th scope="col">Hábito</th>${DIAS.map(d => `<th scope="col">${d}</th>`).join("")}<th scope="col" class="tabla-ocultar">Avance</th><th scope="col"><span class="saltar">Quitar</span></th></tr></thead>
        <tbody>
        ${habitos.map((h, i) => {
          const n = h.dias.filter(Boolean).length;
          return `<tr><td><span class="punto" style="background:${CATEGORIAS[h.cat].color}"></span>${esc(h.nombre)}</td>
            ${h.dias.map((d, j) => `<td><button class="dia ${d ? "hecho" : ""}" data-h="${i}" data-d="${j}" aria-label="${esc(h.nombre)}, ${DIAS[j]}: ${d ? "cumplido" : "pendiente"}" aria-pressed="${d}">${d ? icono("check", 16) : ""}</button></td>`).join("")}
            <td class="tabla-ocultar"><div class="barra"><span style="width:${Math.round(n / 7 * 100)}%"></span></div><small>${n}/7</small></td>
            <td><button class="btn btn--suave btn--pequeno" data-quitar="${i}" aria-label="Quitar hábito ${esc(h.nombre)}">✕</button></td></tr>`;
        }).join("")}
        </tbody>
      </table>
      </div>
    </section>`;
  },

  admin() {
    return `
    <section class="contenedor titulo-pagina" style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap">
      <div><h1>Gestión de contenidos</h1><p>Crea, edita, publica o retira recomendaciones.</p></div>
      <button class="btn btn--primario" id="nuevo">+ Nueva recomendación</button>
    </section>
    <section class="contenedor" style="overflow-x:auto">
      <table class="tabla">
        <thead><tr><th>Título</th><th class="tabla-ocultar">Categoría</th><th class="tabla-ocultar">Tiempo</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${contenidos.map(r => `<tr>
          <td>${esc(r.titulo)}</td><td class="tabla-ocultar">${CATEGORIAS[r.cat].nombre}</td><td class="tabla-ocultar">${r.tiempo} min</td>
          <td><span class="estado ${r.publicado ? "estado--pub" : "estado--bor"}">${r.publicado ? "Publicado" : "Borrador"}</span></td>
          <td style="white-space:nowrap"><button class="btn btn--suave btn--pequeno" data-editar="${r.id}">Editar</button>
          <button class="btn btn--borde btn--pequeno" data-publicar="${r.id}">${r.publicado ? "Ocultar" : "Publicar"}</button></td></tr>`).join("")}
        </tbody>
      </table>
    </section>
    <div class="modal-fondo" id="modal" role="dialog" aria-modal="true" aria-labelledby="tituloModal"><div class="modal">
      <h2 id="tituloModal">Nueva recomendación</h2>
      <form id="formContenido" novalidate>
        <input type="hidden" id="cId">
        <div class="campo"><label for="cTitulo">Título</label><input id="cTitulo"><span class="error-msg">El título es obligatorio.</span></div>
        <div class="fila-2">
          <div class="campo"><label for="cCat">Categoría</label><select id="cCat">${Object.entries(CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.nombre}</option>`).join("")}</select></div>
          <div class="campo"><label for="cTiempo">Tiempo (min)</label><input id="cTiempo" type="number" min="1" value="10"></div>
        </div>
        <div class="campo"><label for="cResumen">Resumen</label><textarea id="cResumen" rows="2"></textarea></div>
        <div class="campo"><label for="cPasos">Pasos (uno por línea)</label><textarea id="cPasos" rows="4"></textarea></div>
        <div class="campo"><label for="cObj">Objetivo relacionado</label><select id="cObj">${Object.entries(OBJETIVOS).map(([k, o]) => `<option value="${k}">${o}</option>`).join("")}</select></div>
        <div class="campo"><label class="check"><input type="checkbox" id="cPub"> Publicar de inmediato</label></div>
        <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn btn--suave" id="cerrarModal">Cancelar</button><button class="btn btn--primario" type="submit">Guardar</button></div>
      </form>
    </div></div>`;
  },

  privacidad() {
    return `<section class="contenedor titulo-pagina" style="max-width:780px">
      <h1>Política de privacidad</h1>
      <p>En ViveSano tratamos tus datos personales y de salud conforme a la Ley 1581 de 2012 de protección de datos personales en Colombia.</p>
      <h2>¿Qué datos pedimos?</h2><p>Nombre, correo y, de forma voluntaria, datos de salud básicos (edad, peso, estatura, objetivo y restricciones alimentarias).</p>
      <h2>¿Para qué los usamos?</h2><p>Solo para personalizar recomendaciones y mostrar tu progreso. No vendemos ni compartimos tu información con terceros.</p>
      <h2>Tus derechos</h2><p>Puedes consultar, corregir o eliminar tus datos en cualquier momento desde tu perfil.</p>
    </section>`;
  }
};

// ---------- Cálculos de hábitos ----------
function cumplimiento() {
  const total = habitos.length * 7; if (!total) return 0;
  return Math.round(habitos.reduce((s, h) => s + h.dias.filter(Boolean).length, 0) / total * 100);
}
function racha() {
  let r = 0;
  for (let d = 0; d < 7; d++) { if (habitos.some(h => h.dias[d])) r++; else if (r) break; }
  return r;
}

// ---------- Eventos por página ----------
const eventos = {
  inicio() {
    $("#formBuscar").addEventListener("submit", e => { e.preventDefault(); location.hash = "#/recomendaciones?q=" + encodeURIComponent($("#q").value.trim()); });
  },
  recomendaciones(params) {
    const panel = $("#panelFiltros");
    const pintar = () => {
      const q = $("#q2").value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const cats = [...panel.querySelectorAll("[name=cat]:checked")].map(x => x.value);
      const objs = [...panel.querySelectorAll("[name=obj]:checked")].map(x => x.value);
      const niveles = [...panel.querySelectorAll("[name=nivel]:checked")].map(x => x.value);
      const tmax = Number(panel.querySelector("[name=tiempo]").value) || Infinity;
      const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      let lista = publicados().filter(r =>
        (!q || norm(r.titulo + " " + r.resumen + " " + CATEGORIAS[r.cat].nombre + " " + r.objetivos.map(o => OBJETIVOS[o]).join(" ")).includes(q)) &&
        (!cats.length || cats.includes(r.cat)) &&
        (!objs.length || objs.some(o => r.objetivos.includes(o))) &&
        (!niveles.length || niveles.includes(r.nivel)) && r.tiempo <= tmax);
      const orden = $("#orden").value;
      if (orden === "tiempo") lista.sort((a, b) => a.tiempo - b.tiempo);
      else if (orden === "az") lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
      else lista.sort((a, b) => puntaje(b) - puntaje(a));
      $("#conteo").textContent = `${lista.length} resultado${lista.length === 1 ? "" : "s"}${q ? ` para “${$("#q2").value.trim()}”` : ""}`;
      $("#resultados").innerHTML = lista.length ? lista.map(r => tarjeta(r, true)).join("")
        : `<div class="vacio" style="grid-column:1/-1">${icono("buscar", 40)}<h3>No encontramos resultados</h3><p>Prueba con otras palabras o quita algunos filtros.</p></div>`;
    };
    panel.addEventListener("change", pintar);
    $("#orden").addEventListener("change", pintar);
    $("#formLista").addEventListener("submit", e => { e.preventDefault(); pintar(); });
    $("#q2").addEventListener("input", pintar);
    $("#limpiar").addEventListener("click", () => { panel.querySelectorAll("input").forEach(i => i.checked = false); panel.querySelector("select").value = ""; $("#q2").value = ""; pintar(); });
    $("#verFiltros").addEventListener("click", () => panel.classList.toggle("abierto"));
    pintar();
  },
  detalle(params, id) {
    const b = $("#agregarHabito");
    if (b) b.addEventListener("click", () => {
      if (!usuario) { toast("Inicia sesión para hacer seguimiento de tus hábitos"); location.hash = "#/login"; return; }
      const r = contenidos.find(x => x.id === Number(id));
      habitos.push({ id: "rec" + r.id, nombre: r.titulo, cat: r.cat, dias: [false, false, false, false, false, false, false] });
      guardar("habitos", habitos); toast("Agregado a tus hábitos"); router();
    });
  },
  login() {
    $("#formLogin").addEventListener("submit", e => {
      e.preventDefault();
      const correo = $("#correo").value.trim(), clave = $("#clave").value;
      const ok1 = validar($("#correo"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo));
      const ok2 = validar($("#clave"), clave.length >= 8);
      if (!ok1 || !ok2) return;
      const previo = leer("usuario_registrado", null);
      usuario = previo && previo.correo === correo ? previo : {
        nombre: correo === "admin@vivesano.co" ? "Administrador" : correo.split("@")[0].replace(/^\w/, c => c.toUpperCase()),
        correo, rol: correo === "admin@vivesano.co" ? "admin" : "usuario", perfil: null
      };
      guardar("usuario", usuario); toast("¡Hola, " + usuario.nombre + "!");
      location.hash = usuario.rol === "admin" ? "#/admin" : (usuario.perfil ? "#/inicio" : "#/perfil");
    });
  },
  registro(params) {
    const f1 = $("#formRegistro1");
    if (f1) {
      $("#claveR").addEventListener("input", e => {
        const v = e.target.value; let n = 0;
        if (v.length >= 8) n++; if (/\d/.test(v)) n++; if (/[A-Z]/.test(v)) n++; if (/[^A-Za-z0-9]/.test(v)) n++;
        const col = ["#C0392B", "#C0392B", "#F4A259", "#2E7D5B", "#1F5C42"][n];
        $("#barraFuerza").style.cssText = `width:${n * 25}%;background:${col}`;
        $("#textoFuerza").textContent = ["Muy débil", "Débil", "Aceptable", "Segura", "Muy segura"][n];
      });
      f1.addEventListener("submit", e => {
        e.preventDefault();
        const a = validar($("#nombre"), $("#nombre").value.trim().length > 2);
        const b = validar($("#correoR"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#correoR").value.trim()));
        const c = validar($("#claveR"), $("#claveR").value.length >= 8 && /\d/.test($("#claveR").value));
        const d = validar($("#acepto"), $("#acepto").checked);
        if (!(a && b && c && d)) return;
        guardar("registro_temp", { nombre: $("#nombre").value.trim(), correo: $("#correoR").value.trim() });
        location.hash = "#/registro?paso=2";
      });
    } else {
      const terminar = conPerfil => {
        const t = leer("registro_temp", { nombre: "Usuario", correo: "usuario@correo.com" });
        usuario = { ...t, rol: "usuario", perfil: conPerfil ? {
          objetivo: $("#objetivo").value, actividad: $("#actividadR").value,
          restricciones: [...document.querySelectorAll("[name=restr]:checked")].map(x => x.value)
        } : null };
        guardar("usuario", usuario); guardar("usuario_registrado", usuario);
        toast("¡Cuenta creada! Bienvenido a ViveSano");
        location.hash = "#/inicio";
      };
      $("#formRegistro2").addEventListener("submit", e => { e.preventDefault(); terminar(true); });
      $("#omitir").addEventListener("click", () => terminar(false));
    }
  },
  perfil() {
    $("#formPerfil").addEventListener("submit", e => {
      e.preventDefault();
      const peso = Number($("#peso").value), est = Number($("#estatura").value);
      const a = validar($("#peso"), !$("#peso").value || (peso >= 20 && peso <= 300));
      const b = validar($("#estatura"), !$("#estatura").value || (est >= 100 && est <= 230));
      if (!a || !b) return;
      usuario.perfil = {
        edad: $("#edad").value, sueno: $("#sueno").value, peso: $("#peso").value, estatura: $("#estatura").value,
        objetivo: $("#objetivoP").value, actividad: $("#actividadP").value,
        restricciones: [...document.querySelectorAll("[name=restrP]:checked")].map(x => x.value)
      };
      guardar("usuario", usuario); toast("Perfil actualizado. Tus recomendaciones cambiaron."); router();
    });
    document.querySelectorAll("[data-priv]").forEach(i => i.addEventListener("change", () => {
      usuario.privacidad = { ...(usuario.privacidad || { recordatorios: true }), [i.dataset.priv]: i.checked };
      guardar("usuario", usuario); toast("Preferencia de privacidad guardada");
    }));
    $("#borrarDatos").addEventListener("click", () => {
      if (!confirm("¿Seguro que quieres eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.")) return;
      usuario = null; favoritos = []; guardar("usuario", null); guardar("favoritos", []); guardar("usuario_registrado", null);
      toast("Tu cuenta y tus datos fueron eliminados"); location.hash = "#/inicio";
    });
  },
  habitos() {
    main.addEventListener("click", habitosClick);
  },
  admin() {
    const modal = $("#modal");
    const abrir = r => {
      $("#tituloModal").textContent = r ? "Editar recomendación" : "Nueva recomendación";
      $("#cId").value = r ? r.id : ""; $("#cTitulo").value = r ? r.titulo : ""; $("#cCat").value = r ? r.cat : "alimentacion";
      $("#cTiempo").value = r ? r.tiempo : 10; $("#cResumen").value = r ? r.resumen : ""; $("#cPasos").value = r ? r.pasos.join("\n") : "";
      $("#cObj").value = r ? r.objetivos[0] : "peso"; $("#cPub").checked = r ? r.publicado : false;
      modal.classList.add("abierto"); $("#cTitulo").focus();
    };
    $("#nuevo").addEventListener("click", () => abrir(null));
    $("#cerrarModal").addEventListener("click", () => modal.classList.remove("abierto"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("abierto"); });
    main.querySelectorAll("[data-editar]").forEach(b => b.addEventListener("click", () => abrir(contenidos.find(r => r.id === Number(b.dataset.editar)))));
    main.querySelectorAll("[data-publicar]").forEach(b => b.addEventListener("click", () => {
      const r = contenidos.find(x => x.id === Number(b.dataset.publicar)); r.publicado = !r.publicado;
      guardar("contenidos", contenidos); toast(r.publicado ? "Recomendación publicada" : "Recomendación ocultada"); router();
    }));
    $("#formContenido").addEventListener("submit", e => {
      e.preventDefault();
      if (!validar($("#cTitulo"), $("#cTitulo").value.trim().length > 3)) return;
      const id = Number($("#cId").value);
      const datos = { cat: $("#cCat").value, titulo: $("#cTitulo").value.trim(), resumen: $("#cResumen").value.trim() || "Sin resumen.",
        tiempo: Number($("#cTiempo").value) || 5, objetivos: [$("#cObj").value], pasos: $("#cPasos").value.split("\n").filter(Boolean), publicado: $("#cPub").checked };
      if (id) Object.assign(contenidos.find(r => r.id === id), datos);
      else contenidos.push({ id: Math.max(...contenidos.map(r => r.id)) + 1, nivel: "Básico", restricciones: [], autor: "Equipo ViveSano", ...datos });
      guardar("contenidos", contenidos); modal.classList.remove("abierto"); toast("Contenido guardado"); router();
    });
  }
};

function habitosClick(e) {
  const d = e.target.closest("[data-d]"), q = e.target.closest("[data-quitar]");
  if (d) { const h = habitos[d.dataset.h]; h.dias[d.dataset.d] = !h.dias[d.dataset.d]; guardar("habitos", habitos); router(); }
  if (q) { if (confirm("¿Quitar este hábito de tu seguimiento?")) { habitos.splice(q.dataset.quitar, 1); guardar("habitos", habitos); toast("Hábito quitado"); router(); } }
}

function validar(input, ok) {
  input.closest(".campo").classList.toggle("invalido", !ok);
  input.setAttribute("aria-invalid", !ok);
  return ok;
}

// ---------- Cabecera según sesión ----------
function pintarCabecera() {
  document.body.classList.toggle("es-admin", usuario?.rol === "admin");
  $("#zonaUsuario").innerHTML = usuario
    ? `<a class="usuario-chip" href="#/perfil" title="Mi perfil"><span class="avatar">${esc(usuario.nombre[0])}</span><span class="tabla-ocultar">${esc(usuario.nombre.split(" ")[0])}</span></a>
       <button class="btn btn--suave btn--pequeno" id="salir">Salir</button>`
    : `<a class="btn btn--borde btn--pequeno" href="#/login">Ingresar</a><a class="btn btn--primario btn--pequeno" href="#/registro">Registrarse</a>`;
  const s = $("#salir");
  if (s) s.addEventListener("click", () => { usuario = null; guardar("usuario", null); toast("Cerraste sesión"); location.hash = "#/inicio"; });
}

// ---------- Router ----------
const PRIVADAS = ["perfil", "favoritos", "habitos", "admin"];
function router() {
  const [ruta, qs] = (location.hash.replace(/^#\//, "") || "inicio").split("?");
  const [nombre, id] = ruta.split("/");
  const params = new URLSearchParams(qs || "");
  let pag = paginas[nombre] ? nombre : "inicio";
  if (PRIVADAS.includes(pag) && !usuario) { toast("Inicia sesión para continuar"); location.hash = "#/login"; return; }
  if (pag === "admin" && usuario.rol !== "admin") { toast("No tienes permisos para esta sección"); location.hash = "#/inicio"; return; }
  main.removeEventListener("click", habitosClick);
  main.innerHTML = paginas[pag](params, id);
  if (eventos[pag]) eventos[pag](params, id);
  document.querySelectorAll("[data-ruta]").forEach(a => a.classList.toggle("activo", a.dataset.ruta === pag));
  $("#menu").classList.remove("abierto");
  pintarCabecera();
  document.title = `ViveSano | ${{ inicio: "Inicio", recomendaciones: "Recomendaciones", detalle: "Detalle", login: "Iniciar sesión", registro: "Registro", perfil: "Mi perfil", favoritos: "Favoritos", habitos: "Mis hábitos", admin: "Contenidos", privacidad: "Privacidad" }[pag]}`;
  if (!location.hash.includes("?") || pag !== "recomendaciones") window.scrollTo(0, 0);
}

// favoritos (delegado en todo el documento)
document.addEventListener("click", e => {
  const b = e.target.closest("[data-fav]");
  if (b) { e.preventDefault(); alternarFavorito(b.dataset.fav); }
});
$("#btnMenu").addEventListener("click", () => {
  const m = $("#menu"); m.classList.toggle("abierto");
  $("#btnMenu").setAttribute("aria-expanded", m.classList.contains("abierto"));
});
// al corregir un campo se quita el mensaje de error
document.addEventListener("input", e => { const c = e.target.closest(".campo.invalido"); if (c) { c.classList.remove("invalido"); e.target.removeAttribute("aria-invalid"); } });
document.addEventListener("change", e => { const c = e.target.closest(".campo.invalido"); if (c) c.classList.remove("invalido"); });
window.addEventListener("hashchange", router);
router();
