/* global firebase, AOS */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN Y EJECUCIÓN INICIAL ---
    setupMainMenu();
    setupScrollTopButton();
    setupVideoModal();
    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, duration: 800 });
    }

    // --- 2. LÓGICA QUE REQUIERE FIREBASE ---
    initializeFirebaseAndAppCheck().then(() => {
        if (!dbInstance) {
            console.error("La conexión con Firebase no se ha podido establecer. Las funciones dinámicas no operarán.");
            return;
        }
        
        // Carga de contenido dinámico según la página
        if (document.getElementById('stories-list-container')) setupHistoriasInspiranPage();
        if (document.getElementById('storyDetailContentArticle')) setupHistoriaDetallePage();
        if (document.getElementById('interviews-list-container')) setupEntrevistasPage();
        if (document.getElementById('hopeMessageForm')) setupMuroEsperanzaPage();
        if (document.getElementById('featured-story')) setupFeaturedStory();

        // Llamada al contador de visitas
        handleVisitorCount();
    });

    // --- 3. LÓGICA ESPECÍFICA SIN FIREBASE ---
    const pagePath = window.location.pathname.split('/').pop();
    if (pagePath.includes('bienestar')) {
        setupAffirmationGenerator();
    }
});

// ===================================================================
// ===== FUNCIONES GLOBALES DE INTERFAZ (MENÚ, SCROLL, MODAL) ======
// ===================================================================

function setupMainMenu() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksList = document.querySelector('.main-nav .nav-links');
    if (!menuToggle || !navLinksList) return;

    menuToggle.addEventListener('click', () => {
        navLinksList.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navLinksList.querySelectorAll('a').forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname.split('/').pop() || 'index.html';
        link.classList.remove('active-link');
        if (linkPath === currentPath && !link.hash) {
            link.classList.add('active-link');
        }
    });

    navLinksList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinksList.classList.contains('active')) {
                navLinksList.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });
}

function setupScrollTopButton() {
    const scrollTopButton = document.getElementById('scrollTopButton');
    if (!scrollTopButton) return;
    window.addEventListener('scroll', () => {
        scrollTopButton.classList.toggle('show', window.pageYOffset > 200);
    });
    scrollTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupVideoModal() {
    const videoModal = document.getElementById('videoModal');
    if (!videoModal) return;

    const videoModalCloseButton = document.querySelector('.video-modal-close-button');
    const youtubePlayerContainer = document.getElementById('youtubePlayerContainer');
    let youtubeIframe;

    function openModal(videoId) {
        if (!videoId || !youtubePlayerContainer) return;
        youtubeIframe = document.createElement('iframe');
        youtubeIframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`);
        youtubeIframe.setAttribute('frameborder', '0');
        youtubeIframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        youtubeIframe.setAttribute('allowfullscreen', '');
        youtubePlayerContainer.innerHTML = '';
        youtubePlayerContainer.appendChild(youtubeIframe);
        videoModal.style.display = "flex";
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (videoModal) videoModal.style.display = "none";
        if (youtubePlayerContainer && youtubeIframe) {
            youtubeIframe.src = '';
            youtubePlayerContainer.innerHTML = '';
        }
        youtubeIframe = null;
        document.body.style.overflow = 'auto';
    }

    document.body.addEventListener('click', (event) => {
        const videoTrigger = event.target.closest('[data-video-id]');
        if (videoTrigger) {
            event.preventDefault();
            openModal(videoTrigger.getAttribute('data-video-id'));
        }
    });

    if (videoModalCloseButton) videoModalCloseButton.addEventListener('click', closeModal);
    videoModal.addEventListener('click', (event) => {
        if (event.target === videoModal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape" && videoModal.style.display === "flex") closeModal();
    });
}

// ===================================================================
// ===== INICIALIZACIÓN DE FIREBASE Y FUNCIONES RELACIONADAS =======
// ===================================================================

let dbInstance = null;
async function initializeFirebaseAndAppCheck() {
    if (dbInstance) return;
    const firebaseConfig = {
        apiKey: "AIzaSyBB533KldqKqzvUpjvdThSg9WrxIVAkd6Q",
        authDomain: "formula-triple-rosa-esperanza.firebaseapp.com",
        projectId: "formula-triple-rosa-esperanza",
        storageBucket: "formula-triple-rosa-esperanza.appspot.com",
        messagingSenderId: "957472891906",
        appId: "1:957472891906:web:3a372b9e9d0110b90cb31b",
        measurementId: "G-3X9XB2J5EM"
    };

    try {
        const app = firebase.initializeApp(firebaseConfig);
        
        // MODO DEBUG PARA DESARROLLO LOCAL
        window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

        if (firebase.appCheck) {
            const appCheck = firebase.appCheck(app);
            appCheck.activate('6Le-61grAAAAACX4nt-zWj75t4t7F1FC--RJU5PC', true);
        }
        dbInstance = firebase.firestore(app);
    } catch (e) {
        console.error("Error inicializando Firebase:", e);
    }
}

async function handleVisitorCount() {
    const countElement = document.getElementById('visit-count-display');
    const counterContainer = document.getElementById('visitor-counter');
    if (!counterContainer || !dbInstance) return;

    try {
        const counterRef = dbInstance.collection('siteStats').doc('visits');
        await dbInstance.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let currentCount = 0;
            if (doc.exists && typeof doc.data().count === 'number') {
                currentCount = doc.data().count;
            } else if (!doc.exists) {
                transaction.set(counterRef, { count: 0 });
            }
            if (countElement) countElement.textContent = currentCount;
            if (!sessionStorage.getItem('hasVisitedFTR')) {
                const newCount = currentCount + 1;
                transaction.update(counterRef, { count: newCount });
                if (countElement) countElement.textContent = newCount;
                sessionStorage.setItem('hasVisitedFTR', 'true');
            }
        });
    } catch (error) {
        console.error("Error al gestionar el contador de visitas. Verificar reglas de Firestore.", error);
        if (counterContainer) counterContainer.style.display = 'none';
    }
}

// ===================================================================
// ===== LÓGICA DE CONTENIDO ESPECÍFICO DE CADA PÁGINA =============
// ===================================================================

function setupHistoriasInspiranPage() {
    const form = document.getElementById('shareStoryForm');
    const container = document.getElementById('stories-list-container');
    if (!form || !container || !dbInstance) return;

    const statusEl = document.getElementById('shareStoryFormStatus');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.classList.add('loading');
        btn.disabled = true;
        statusEl.className = 'form-status-message';
        statusEl.style.display = 'block';
        statusEl.textContent = 'Enviando...';
        try {
            await dbInstance.collection('historiasEnviadas').add({
                autor: e.target.storyAuthorName.value.trim() || "Anónimo",
                titulo: e.target.storyTitle.value.trim(),
                contenido: e.target.storyTextContent.value.trim(),
                consentimiento: e.target.storyConsent.checked,
                aprobado: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            statusEl.textContent = '¡Gracias! Tu historia ha sido enviada para revisión.';
            statusEl.classList.add('success');
            e.target.reset();
        } catch (error) {
            console.error("Error al enviar historia:", error);
            statusEl.textContent = 'Error al enviar. Inténtalo de nuevo.';
            statusEl.classList.add('error');
        } finally {
            setTimeout(() => {
                btn.classList.remove('loading');
                btn.disabled = false;
            }, 1500);
        }
    });

    const skeleton = container.querySelector('.stories-list-loading-skeleton');
    const noStoriesMsg = container.querySelector('.no-stories:not(.error)');
    const errorMsg = container.querySelector('.no-stories.error');
    skeleton.style.display = 'block';
    noStoriesMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    dbInstance.collection('historiasEnviadas').where('aprobado', '==', true).orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            skeleton.style.display = 'none';
            container.querySelectorAll('.story-entry').forEach(el => el.remove());
            if (snapshot.empty) {
                noStoriesMsg.style.display = 'block';
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const article = document.createElement('article');
                    article.className = 'story-entry';
                    const excerpt = data.contenido.length > 250 ? data.contenido.substring(0, 250) + '...' : data.contenido;
                    article.innerHTML = `
                        <header class="story-header">
                            <h3 class="story-title">${escapeHTML(data.titulo)}</h3>
                            <p class="story-meta">Por: <span class="story-author">${escapeHTML(data.autor)}</span> | ${formatDate(data.timestamp)}</p>
                        </header>
                        <div class="story-content">
                            <p class="story-excerpt">${escapeHTML(excerpt).replace(/\n/g, '<br>')}</p>
                            <a href="historia-detalle.html?id=${doc.id}" class="cta-button cta-small">Leer más →</a>
                        </div>`;
                    container.appendChild(article);
                });
            }
        }, error => {
            console.error("Error al cargar historias. Revisa reglas e índices de Firestore.", error);
            skeleton.style.display = 'none';
            errorMsg.style.display = 'block';
        });
}

async function setupHistoriaDetallePage() {
    const titleEl = document.getElementById('storyDetailTitle');
    const metaEl = document.getElementById('storyDetailMeta');
    const contentEl = document.getElementById('storyDetailContentArticle');
    const storyId = new URLSearchParams(window.location.search).get('id');

    if (!storyId || !dbInstance) {
        if (titleEl) titleEl.textContent = "Historia no encontrada";
        if (contentEl) contentEl.innerHTML = "<p>No se ha especificado un ID de historia válido.</p>";
        return;
    }

    try {
        const doc = await dbInstance.collection('historiasEnviadas').doc(storyId).get();
        if (doc.exists && doc.data().aprobado) {
            const data = doc.data();
            document.title = `${escapeHTML(data.titulo)} | Fórmula Triple Rosa`;
            titleEl.textContent = escapeHTML(data.titulo);
            metaEl.innerHTML = `Por: <span class="story-author">${escapeHTML(data.autor)}</span> | ${formatDate(data.timestamp)}`;
            contentEl.innerHTML = escapeHTML(data.contenido).split('\n').map(p => `<p>${p || ' '}</p>`).join('');
        } else {
            titleEl.textContent = "Historia no encontrada";
            contentEl.innerHTML = "<p>La historia que buscas no existe o aún no ha sido aprobada.</p>";
        }
    } catch (error) {
        console.error("Error al cargar detalle de historia:", error);
        titleEl.textContent = "Error al cargar";
        contentEl.innerHTML = "<p>Ocurrió un error. Inténtalo más tarde.</p>";
    }
}

async function setupEntrevistasPage() {
    const container = document.getElementById('interviews-list-container');
    if (!container || !dbInstance) return;

    const loadingEl = container.querySelector('.loading-interviews');
    const noInterviewsEl = container.querySelector('.no-interviews');
    const errorEl = container.querySelector('.error-interviews');
    loadingEl.style.display = 'block';
    noInterviewsEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
        const snapshot = await dbInstance.collection('entrevistas').where('publicado', '==', true).orderBy('fecha', 'desc').get();
        loadingEl.style.display = 'none';
        if (snapshot.empty) {
            noInterviewsEl.style.display = 'block';
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('a');
                card.href = '#';
                card.className = 'resource-card resource-card--video';
                card.dataset.aos = 'zoom-in-up';
                card.dataset.videoId = data.youtubeVideoId;
                card.innerHTML = `
                    <div class="resource-card-thumbnail" style="background-image: url('https://i.ytimg.com/vi/${data.youtubeVideoId}/hqdefault.jpg');">
                        <div class="play-icon-overlay">▶</div>
                    </div>
                    <div class="resource-card-content">
                        <h3>${escapeHTML(data.titulo)}</h3>
                        <p>${escapeHTML(data.descripcion)}</p>
                    </div>`;
                container.appendChild(card);
            });
            if (typeof AOS !== 'undefined') AOS.refresh();
        }
    } catch (error) {
        console.error("Error al cargar entrevistas:", error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    }
}

function setupMuroEsperanzaPage() {
    const form = document.getElementById('hopeMessageForm');
    const grid = document.querySelector('.hope-wall-grid');
    if (!form || !grid || !dbInstance) return;

    const textEl = form.querySelector('#mensajeTexto');
    const counterEl = form.querySelector('#charCounter');
    textEl.addEventListener('input', () => {
        counterEl.textContent = `${textEl.value.length}/300`;
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const statusEl = document.getElementById('formStatusMessage');
        btn.classList.add('loading');
        btn.disabled = true;
        statusEl.className = 'form-status-message';
        statusEl.style.display = 'block';
        statusEl.textContent = 'Enviando...';
        try {
            await dbInstance.collection('mensajesEsperanza').add({
                autor: e.target.nombreAutor.value.trim() || "Anónimo",
                texto: textEl.value.trim(),
                aprobado: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            statusEl.textContent = '¡Gracias! Tu mensaje ha sido enviado para revisión.';
            statusEl.classList.add('success');
            e.target.reset();
            counterEl.textContent = '0/300';
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            statusEl.textContent = 'Error al enviar. Inténtalo de nuevo.';
            statusEl.classList.add('error');
        } finally {
            setTimeout(() => {
                btn.classList.remove('loading');
                btn.disabled = false;
            }, 1500);
        }
    });

    const loadingEl = grid.querySelector('.loading-messages');
    const noMessagesEl = grid.querySelector('.no-messages:not(.error)');
    const errorEl = grid.querySelector('.no-messages.error');
    loadingEl.style.display = 'block';
    noMessagesEl.style.display = 'none';
    errorEl.style.display = 'none';

    dbInstance.collection('mensajesEsperanza').where('aprobado', '==', true).orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        loadingEl.style.display = 'none';
        grid.querySelectorAll('.hope-message-card').forEach(el => el.remove());
        if (snapshot.empty) {
            noMessagesEl.style.display = 'block';
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement('article');
                card.className = 'hope-message-card';
                card.innerHTML = `
                    <p class="message-text">${escapeHTML(data.texto).replace(/\n/g, '<br>')}</p>
                    <p class="message-author">- <span class="author-icon">💌</span> ${escapeHTML(data.autor)}</p>`;
                grid.appendChild(card);
            });
        }
    }, error => {
        console.error("Error al cargar mensajes. Revisa reglas e índices de Firestore.", error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    });
}

async function setupFeaturedStory() {
    const quoteTextEl = document.getElementById('featured-quote-text');
    const quoteAuthorEl = document.getElementById('featured-quote-author');
    if (!quoteTextEl || !quoteAuthorEl || !dbInstance) return;

    try {
        const [storySnapshot, messageSnapshot] = await Promise.all([
            dbInstance.collection('historiasEnviadas').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(10).get(),
            dbInstance.collection('mensajesEsperanza').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(10).get()
        ]);
        const items = [];
        storySnapshot.forEach(doc => items.push(doc.data()));
        messageSnapshot.forEach(doc => items.push(doc.data()));
        if (items.length > 0) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            const text = randomItem.contenido ?
                (randomItem.contenido.length > 200 ? randomItem.contenido.substring(0, 200) + '...' : randomItem.contenido) :
                randomItem.texto;
            quoteTextEl.textContent = `“${escapeHTML(text)}”`;
            quoteAuthorEl.textContent = `– ${escapeHTML(randomItem.autor)}`;
        }
    } catch (error) {
        console.error("Error al cargar contenido destacado:", error);
    }
}

function setupAffirmationGenerator() {
    const affirmationElement = document.getElementById('affirmationText');
    if (!affirmationElement) return;
    const affirmations = [
        "Soy fuerte, soy resiliente y cada día estoy más cerca de mi bienestar.",
        "Mi cuerpo es sabio y tiene una increíble capacidad para sanar.",
        "Permito que la calma y la paz llenen mi mente y mi corazón.",
        "Confío en mi camino y en la fortaleza que descubro en mí.",
        "Cada respiración que tomo me llena de energía sanadora.",
        "Soy más que mi diagnóstico. Soy amor, luz y esperanza.",
        "Me doy permiso para descansar y cuidarme. Lo merezco.",
        "Acepto el apoyo y el cariño que me rodean. No estoy sola.",
        "Elijo enfocarme en la gratitud por las pequeñas alegrías de hoy.",
        "Tengo el poder de crear momentos de paz en medio de la tormenta."
    ];
    affirmationElement.textContent = `“${affirmations[Math.floor(Math.random() * affirmations.length)]}”`;
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS (DEPURADAS Y CORRECTAS) ==============
// ===================================================================

/**
 * Escapa caracteres HTML de forma segura para prevenir inyección de XSS.
 * @param {string | null | undefined} str La cadena de texto a escapar.
 * @returns {string} La cadena de texto escapada.
 */
function escapeHTML(str) {
    if (str === null || typeof str === 'undefined') {
        return '';
    }
    return String(str).replace(/[&<>"']/g, function(match) {
        switch (match) {
            case '&':
                return '&';
            case '<':
                return '<';
            case '>':
                return '>';
            case '"':
                return '"';
            case "'":
                return ''
            default:
                return match;
        }
    });
}

/** Formatea un timestamp de Firebase a un formato legible. */
function formatDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return "Fecha desconocida";
    }
    try {
        return timestamp.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error("Error formateando la fecha:", e);
        return "Fecha inválida";
    }
}