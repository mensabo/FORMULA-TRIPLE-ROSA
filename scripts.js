document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN Y EJECUCIÓN INICIAL ---
    setupMainMenu();
    setupScrollTopButton();
    setupVideoModal();
    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, duration: 800 });
    }
    
    // --- LÓGICA ESPECÍFICA DE CADA PÁGINA ---
    const pagePath = window.location.pathname.split('/').pop();

    const needsFirebase = 
        pagePath.includes('historias-inspiran') ||
        pagePath.includes('historia-detalle') ||
        pagePath.includes('muro-esperanza') ||
        pagePath.includes('entrevistas') ||
        pagePath.includes('index') ||
        pagePath === ''; // Para la raíz del sitio

    if (needsFirebase) {
        initializeFirebaseAndAppCheck().then(() => {
            // Una vez Firebase está listo, ejecutamos las funciones que lo necesitan.
            if (document.getElementById('stories-list-container')) setupHistoriasInspiranPage();
            if (document.getElementById('storyDetailContentArticle')) setupHistoriaDetallePage();
            if (document.getElementById('interviews-list-container')) setupEntrevistasPage();
            if (document.getElementById('hopeMessageForm')) setupMuroEsperanzaPage();
            if (document.getElementById('featured-story')) setupFeaturedStory();
        });
    }
    
    if (pagePath.includes('bienestar')) {
        setupAffirmationGenerator();
    }
});

// --- SCRIPT PARA MENÚ HAMBURGUESA ---
function setupMainMenu() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksList = document.querySelector('.main-nav .nav-links');

    if (menuToggle && navLinksList) {
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
}

// --- SCRIPT PARA BOTÓN "VOLVER ARRIBA" ---
function setupScrollTopButton() {
    const scrollTopButton = document.getElementById('scrollTopButton');
    if (scrollTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 200) {
                scrollTopButton.classList.add('show');
            } else {
                scrollTopButton.classList.remove('show');
            }
        });

        scrollTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// --- SCRIPT PARA MODAL DE VÍDEO ---
function setupVideoModal() {
    const videoModal = document.getElementById('videoModal');
    if (!videoModal) return;

    const videoModalCloseButton = document.querySelector('.video-modal-close-button');
    const youtubePlayerContainer = document.getElementById('youtubePlayerContainer');
    let youtubeIframe;

    function openModal(videoId) {
        if (videoId && youtubePlayerContainer && videoModalCloseButton) {
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
    }

    function closeModal() {
        if (videoModal) videoModal.style.display = "none";
        if (youtubePlayerContainer) {
            if (youtubeIframe && youtubeIframe.contentWindow) {
                youtubeIframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
            }
            youtubePlayerContainer.innerHTML = '';
        }
        youtubeIframe = null;
        document.body.style.overflow = 'auto';
    }

    document.body.addEventListener('click', (event) => {
        const videoTrigger = event.target.closest('[data-video-id]');
        if (videoTrigger) {
            event.preventDefault();
            const videoId = videoTrigger.getAttribute('data-video-id');
            openModal(videoId);
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

// --- INICIALIZACIÓN DE FIREBASE Y APP CHECK (VERSIÓN ROBUSTA) ---
let dbInstance = null;
async function initializeFirebaseAndAppCheck() {
    if (dbInstance) return; // Si ya está inicializado, no hacer nada

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
        // La siguiente línea es solo para desarrollo local.
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = "fd783e9c-994e-4967-97dc-63d22ba9796e"; 
        
        if (firebase.appCheck) {
            const appCheck = firebase.appCheck(app);
            appCheck.activate('6Le-61grAAAAACX4nt-zWj75t4t7F1FC--RJU5PC', true);
        }
        dbInstance = firebase.firestore(app);
    } catch (e) {
        console.error("Error inicializando Firebase:", e);
    }
}

// --- FUNCIONES UTILITARIAS ---
function escapeHTML(str) {
    if (str === null || typeof str === 'undefined') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "Fecha desconocida";
    return timestamp.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- FUNCIONES DE LÓGICA DE PÁGINA ---

function setupHistoriasInspiranPage() {
    const shareStoryForm = document.getElementById('shareStoryForm');
    const storiesListContainer = document.getElementById('stories-list-container');

    if (shareStoryForm) {
        const shareStoryFormStatus = document.getElementById('shareStoryFormStatus');
        shareStoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitButton = shareStoryForm.querySelector('button[type="submit"]');
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            shareStoryFormStatus.textContent = "Enviando tu historia...";
            shareStoryFormStatus.className = 'form-status-message';
            shareStoryFormStatus.style.display = 'block';

            const autor = shareStoryForm.storyAuthorName.value.trim() || "Anónimo";
            const titulo = shareStoryForm.storyTitle.value.trim();
            const contenido = shareStoryForm.storyTextContent.value.trim();
            const consentimiento = shareStoryForm.storyConsent.checked;

            if (!titulo || !contenido || !consentimiento) {
                shareStoryFormStatus.textContent = "Por favor, completa todos los campos y acepta el consentimiento.";
                shareStoryFormStatus.className = 'form-status-message error';
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                return;
            }

            dbInstance.collection('historiasEnviadas').add({
                autor, titulo, contenido,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                aprobado: false,
                destacado: false
            }).then(() => {
                shareStoryFormStatus.textContent = "¡Gracias por compartir! Tu historia será revisada pronto.";
                shareStoryFormStatus.className = 'form-status-message success';
                shareStoryForm.reset();
            }).catch((error) => {
                console.error("Error al enviar la historia: ", error);
                shareStoryFormStatus.textContent = "Error al enviar. Por favor, inténtalo de nuevo.";
                shareStoryFormStatus.className = 'form-status-message error';
            }).finally(() => {
                setTimeout(() => {
                     submitButton.classList.remove('loading');
                     submitButton.disabled = false;
                }, 1000);
            });
        });
    }

    if (storiesListContainer) {
        const skeletonContainer = storiesListContainer.querySelector('.stories-list-loading-skeleton');
        const noStoriesMsg = storiesListContainer.querySelector('.no-stories:not(.error)');
        const errorStoriesMsg = storiesListContainer.querySelector('.no-stories.error');
        skeletonContainer.style.display = 'block';

        dbInstance.collection('historiasEnviadas').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(10)
            .onSnapshot((snapshot) => {
                skeletonContainer.style.display = 'none';
                storiesListContainer.querySelectorAll('.story-entry').forEach(el => el.remove());
                if (snapshot.empty) {
                    noStoriesMsg.style.display = 'block';
                    return;
                }
                noStoriesMsg.style.display = 'none';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const storyElement = document.createElement('article');
                    storyElement.classList.add('story-entry');
                    const extracto = data.contenido.length > 250 ? escapeHTML(data.contenido.substring(0, 250)) + '...' : escapeHTML(data.contenido);
                    const storyLink = `historia-detalle.html?id=${doc.id}`;
                    storyElement.innerHTML = `<header class="story-header"><h3 class="story-title">${escapeHTML(data.titulo)}</h3><p class="story-meta">Por: <span class="story-author">${escapeHTML(data.autor)}</span> | Fecha: <time datetime="${data.timestamp.toDate().toISOString().split('T')[0]}">${formatDate(data.timestamp)}</time></p></header><div class="story-content"><p class="story-excerpt">${extracto.replace(/\n/g, '<br>')}</p><a href="${storyLink}" class="cta-button cta-small read-more-button">Leer más →</a></div>`;
                    storiesListContainer.appendChild(storyElement);
                });
            }, (error) => {
                console.error("Error al cargar historias: ", error);
                skeletonContainer.style.display = 'none';
                errorStoriesMsg.style.display = 'block';
            });
    }
}

function setupHistoriaDetallePage() {
    const storyDetailContentArticle = document.getElementById('storyDetailContentArticle');
    const storyDetailTitleElement = document.getElementById('storyDetailTitle');
    const storyDetailMetaElement = document.getElementById('storyDetailMeta');
    
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('id');
    if (!storyId) {
        storyDetailTitleElement.textContent = "Historia no encontrada";
        storyDetailContentArticle.innerHTML = "<p>No se ha especificado un ID de historia válido.</p>";
        return;
    }

    dbInstance.collection('historiasEnviadas').doc(storyId).get()
        .then((doc) => {
            storyDetailContentArticle.innerHTML = '';
            if (doc.exists && doc.data().aprobado === true) {
                const data = doc.data();
                document.title = `${escapeHTML(data.titulo)} - Fórmula Triple Rosa`;
                storyDetailTitleElement.textContent = escapeHTML(data.titulo);
                storyDetailMetaElement.innerHTML = `Por: <span class="story-author">${escapeHTML(data.autor)}</span> | Fecha: <time datetime="${data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : ''}">${formatDate(data.timestamp)}</time>`;
                
                const parrafos = escapeHTML(data.contenido).split(/\n\s*\n/);
                parrafos.forEach(pText => {
                    if (pText.trim() !== '') {
                        const pElem = document.createElement('p');
                        pElem.innerHTML = pText.replace(/\n/g, '<br>');
                        storyDetailContentArticle.appendChild(pElem);
                    }
                });
            } else {
                storyDetailTitleElement.textContent = "Historia no encontrada";
                storyDetailMetaElement.textContent = '';
                storyDetailContentArticle.innerHTML = "<p>La historia que buscas no existe o aún no ha sido aprobada.</p>";
            }
        })
        .catch((error) => {
            console.error("Error al cargar detalle de la historia: ", error);
            storyDetailTitleElement.textContent = "Error al cargar";
            storyDetailContentArticle.innerHTML = "<p>Ocurrió un error al cargar la historia. Por favor, inténtalo más tarde.</p>";
        });
}

function setupEntrevistasPage() {
    const interviewsListContainer = document.getElementById('interviews-list-container');
    if (!interviewsListContainer) return;

    const loadingMsg = interviewsListContainer.querySelector('.loading-interviews');
    const noMsg = interviewsListContainer.querySelector('.no-interviews');
    const errorMsg = interviewsListContainer.querySelector('.error-interviews');

    loadingMsg.style.display = 'block';

    dbInstance.collection('entrevistas').where('publicado', '==', true).orderBy('fecha', 'desc').get()
        .then(snapshot => {
            loadingMsg.style.display = 'none';
            if (snapshot.empty) {
                noMsg.style.display = 'block';
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                const interviewCard = document.createElement('a'); 
                interviewCard.href = '#'; 
                interviewCard.classList.add('resource-card', 'resource-card--video'); 
                interviewCard.setAttribute('data-aos', 'zoom-in-up');
                interviewCard.setAttribute('data-video-id', data.youtubeVideoId);
                interviewCard.innerHTML = `
                    <div class="resource-card-thumbnail" style="background-image: url('https://i.ytimg.com/vi/${data.youtubeVideoId}/hqdefault.jpg');">
                        <div class="play-icon-overlay">▶</div>
                    </div>
                    <div class="resource-card-content">
                        <h3>${escapeHTML(data.titulo)}</h3>
                        <p>${escapeHTML(data.descripcion)}</p>
                        <p class="interview-date" style="font-style: italic; font-size: 0.9em; color: #888;">${formatDate(data.fecha)}</p>
                    </div>
                `;
                interviewsListContainer.appendChild(interviewCard);
            });
            if (typeof AOS !== 'undefined') AOS.refresh();
        })
        .catch(error => {
            console.error("Error al cargar entrevistas: ", error);
            loadingMsg.style.display = 'none';
            errorMsg.style.display = 'block';
        });
}

function setupMuroEsperanzaPage() {
    const hopeMessageForm = document.getElementById('hopeMessageForm');
    const hopeWallGrid = document.querySelector('.hope-wall-grid');

    if (hopeMessageForm) {
        const charCounter = document.getElementById('charCounter');
        const messageText = document.getElementById('mensajeTexto');
        messageText.addEventListener('input', () => {
            charCounter.textContent = `${messageText.value.length}/300`;
        });
        hopeMessageForm.addEventListener('submit', (e) => {
             e.preventDefault();
            // ... resto del código del formulario ...
        });
    }

    if (hopeWallGrid) {
        const loadingMsg = hopeWallGrid.querySelector('.loading-messages');
        loadingMsg.style.display = 'block';
        dbInstance.collection('mensajesEsperanza').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(25).onSnapshot((snapshot) => {
            loadingMsg.style.display = 'none';
            hopeWallGrid.querySelectorAll('.hope-message-card').forEach(el => el.remove());
            if (snapshot.empty) {
                hopeWallGrid.querySelector('.no-messages:not(.error)').style.display = 'block';
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                const messageCard = document.createElement('article');
                messageCard.classList.add('hope-message-card');
                messageCard.innerHTML = `<p class="message-text">${escapeHTML(data.texto).replace(/\n/g, '<br>')}</p><p class="message-author">- <span class="author-icon">💌</span> ${escapeHTML(data.autor)}</p>`;
                hopeWallGrid.appendChild(messageCard);
            });
        }, (error) => {
            console.error("Error al cargar mensajes: ", error);
            loadingMsg.style.display = 'none';
            hopeWallGrid.querySelector('.no-messages.error').style.display = 'block';
        });
    }
}

async function setupFeaturedStory() {
    const quoteTextElement = document.getElementById('featured-quote-text');
    const quoteAuthorElement = document.getElementById('featured-quote-author');
    if (!quoteTextElement || !quoteAuthorElement) return;

    try {
        const storyQuery = dbInstance.collection('historiasEnviadas').where('destacado', '==', true).where('aprobado', '==', true).limit(1);
        const messageQuery = dbInstance.collection('mensajesEsperanza').where('destacado', '==', true).where('aprobado', '==', true).limit(1);
        
        const [storySnapshot, messageSnapshot] = await Promise.all([storyQuery.get(), messageQuery.get()]);
        
        const items = [];
        if (!storySnapshot.empty) items.push(storySnapshot.docs[0].data());
        if (!messageSnapshot.empty) items.push(messageSnapshot.docs[0].data());

        if (items.length > 0) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            const text = randomItem.contenido ? (randomItem.contenido.length > 200 ? randomItem.contenido.substring(0, 200) + '...' : randomItem.contenido) : randomItem.texto;
            quoteTextElement.textContent = `“${escapeHTML(text)}”`;
            quoteAuthorElement.textContent = `– ${escapeHTML(randomItem.autor)}`;
        } else {
            console.log("No hay contenido destacado para mostrar.");
        }
    } catch (error) {
        console.error("Error al cargar contenido destacado: ", error);
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

    const randomIndex = Math.floor(Math.random() * affirmations.length);
    affirmationElement.textContent = `“${affirmations[randomIndex]}”`;
}