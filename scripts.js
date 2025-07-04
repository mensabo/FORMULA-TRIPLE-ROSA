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
            const linkPath = new URL(link.href).pathname.split('/').pop() || 'index.html';
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


// --- INICIALIZACIÓN DE FIREBASE Y APP CHECK ---
let dbInstance = null;
function initializeFirebaseAndAppCheck() {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
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
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        else firebase.app();
        if (firebase.appCheck) {
            const appCheckInstance = firebase.appCheck();
            appCheckInstance.activate('6Le-61grAAAAACX4nt-zWj75t4t7F1FC--RJU5PC', true);
        }
        dbInstance = firebase.firestore();
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
    return timestamp.toDate().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


// --- FUNCIONES ESPECÍFICAS DE PÁGINA ---

function setupHistoriasInspiranPage() {
    const shareStoryForm = document.getElementById('shareStoryForm');
    const storiesListContainer = document.getElementById('stories-list-container');

    if (shareStoryForm) {
        const shareStoryFormStatus = document.getElementById('shareStoryFormStatus');
        shareStoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!dbInstance) {
                console.error("dbInstance no está listo para enviar historia.");
                return;
            }
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
            if (!titulo || !contenido) {
                shareStoryFormStatus.textContent = "El título y el contenido de la historia son obligatorios.";
                shareStoryFormStatus.className = 'form-status-message error';
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                return;
            }
            if (!consentimiento) {
                shareStoryFormStatus.textContent = "Debes dar tu consentimiento para publicar la historia.";
                shareStoryFormStatus.className = 'form-status-message error';
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                return;
            }
            dbInstance.collection('historiasEnviadas').add({
                autor: autor,
                titulo: titulo,
                contenido: contenido,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                aprobado: false,
                destacado: false
            }).then(() => {
                shareStoryFormStatus.textContent = "¡Gracias por compartir tu historia! Será revisada pronto.";
                shareStoryFormStatus.className = 'form-status-message success';
                shareStoryForm.reset();
                setTimeout(() => {
                    if (shareStoryFormStatus.classList.contains('success')) {
                        shareStoryFormStatus.textContent = "";
                        shareStoryFormStatus.className = 'form-status-message';
                        shareStoryFormStatus.style.display = 'none';
                    }
                }, 7000);
            }).catch((error) => {
                console.error("Error al enviar la historia: ", error);
                shareStoryFormStatus.textContent = "Error al enviar tu historia. Por favor, inténtalo de nuevo.";
                shareStoryFormStatus.className = 'form-status-message error';
            }).finally(() => {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            });
        });
    }

    if (storiesListContainer) {
        const skeletonContainer = storiesListContainer.querySelector('.stories-list-loading-skeleton');
        const noStoriesMsg = storiesListContainer.querySelector('.no-stories:not(.error)');
        const errorStoriesMsg = storiesListContainer.querySelector('.no-stories.error');

        if (!dbInstance) {
            if (skeletonContainer) skeletonContainer.style.display = 'none';
            if (errorStoriesMsg) {
                errorStoriesMsg.textContent = "Error: No se pudo conectar a la base de datos.";
                errorStoriesMsg.style.display = 'block';
            }
            return;
        }

        if (skeletonContainer) skeletonContainer.style.display = 'block';
        if (noStoriesMsg) noStoriesMsg.style.display = 'none';
        if (errorStoriesMsg) errorStoriesMsg.style.display = 'none';

        dbInstance.collection('historiasEnviadas').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(10)
            .onSnapshot((snapshot) => {
                if (skeletonContainer) skeletonContainer.style.display = 'none';
                storiesListContainer.querySelectorAll('.story-entry').forEach(el => el.remove());

                if (snapshot.empty) {
                    if (noStoriesMsg) noStoriesMsg.style.display = 'block';
                    if (errorStoriesMsg) errorStoriesMsg.style.display = 'none';
                    return;
                }

                if (noStoriesMsg) noStoriesMsg.style.display = 'none';
                if (errorStoriesMsg) errorStoriesMsg.style.display = 'none';

                snapshot.forEach(doc => {
                    const data = doc.data(),
                        docId = doc.id,
                        storyElement = document.createElement('article');
                    storyElement.classList.add('story-entry');
                    storyElement.setAttribute('data-id', docId);
                    const contenidoCompleto = escapeHTML(data.contenido);
                    let extracto = contenidoCompleto.length > 250 ? contenidoCompleto.substring(0, 250) + '...' : contenidoCompleto;
                    const storyLink = `historia-detalle.html?id=${docId}`;
                    storyElement.innerHTML = `<header class="story-header"><h3 class="story-title">${escapeHTML(data.titulo)}</h3><p class="story-meta">Por: <span class="story-author">${escapeHTML(data.autor)}</span> | Fecha: <time datetime="${data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : ''}">${formatDate(data.timestamp)}</time></p></header><div class="story-content"><p class="story-excerpt">${extracto.replace(/\n/g, '<br>')}</p><a href="${storyLink}" class="cta-button cta-small read-more-button">Leer más →</a></div>`;

                    storiesListContainer.appendChild(storyElement);
                });
            }, (error) => {
                console.error("Error al cargar historias: ", error);
                if (skeletonContainer) skeletonContainer.style.display = 'none';
                if (noStoriesMsg) noStoriesMsg.style.display = 'none';
                if (errorStoriesMsg) {
                    errorStoriesMsg.textContent = "No se pudieron cargar las historias en este momento. Inténtalo más tarde.";
                    errorStoriesMsg.style.display = 'block';
                }
            });
    }
}

function setupHistoriaDetallePage() {
    const storyDetailContentArticle = document.getElementById('storyDetailContentArticle');
    if (storyDetailContentArticle) {
        const storyDetailTitleElement = document.getElementById('storyDetailTitle');
        const storyDetailMetaElement = document.getElementById('storyDetailMeta');
        const loadingStoryDetailElement = storyDetailContentArticle.querySelector('.loading-story-detail');

        if (!dbInstance) {
            if (loadingStoryDetailElement) loadingStoryDetailElement.textContent = "Error: No se pudo conectar a la base de datos.";
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const storyId = params.get('id');
        if (!storyId) {
            if (storyDetailTitleElement) storyDetailTitleElement.textContent = "Historia no encontrada";
            if (loadingStoryDetailElement) loadingStoryDetailElement.remove();
            storyDetailContentArticle.innerHTML = "<p>No se ha especificado un ID de historia válido.</p>";
            return;
        }
        if (loadingStoryDetailElement) loadingStoryDetailElement.style.display = 'block';

        dbInstance.collection('historiasEnviadas').doc(storyId).get()
            .then((doc) => {
                if (loadingStoryDetailElement) loadingStoryDetailElement.style.display = 'none';
                storyDetailContentArticle.innerHTML = '';

                if (doc.exists && doc.data().aprobado === true) {
                    const data = doc.data();
                    document.title = `${escapeHTML(data.titulo)} - Fórmula Triple Rosa`;
                    if (storyDetailTitleElement) storyDetailTitleElement.textContent = escapeHTML(data.titulo);
                    if (storyDetailMetaElement) storyDetailMetaElement.innerHTML = `Por: <span class="story-author">${escapeHTML(data.autor)}</span> | Fecha: <time datetime="${data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : ''}">${formatDate(data.timestamp)}</time>`;

                    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
                    if (ogTitleMeta) ogTitleMeta.setAttribute('content', escapeHTML(data.titulo) + " - Fórmula Triple Rosa");

                    const metaDescElement = document.querySelector('meta[name="description"]'),
                        metaOgDescElement = document.querySelector('meta[property="og:description"]'),
                        metaOgUrlElement = document.querySelector('meta[property="og:url"]');
                    const excerptForMeta = escapeHTML(data.contenido.substring(0, 155)) + (data.contenido.length > 155 ? "..." : "");
                    if (metaDescElement) metaDescElement.setAttribute('content', excerptForMeta);
                    if (metaOgDescElement) metaOgDescElement.setAttribute('content', excerptForMeta);
                    if (metaOgUrlElement) metaOgUrlElement.setAttribute('content', window.location.href);

                    // Inyectar el script de Schema.org para el artículo
                    const schemaScript = document.createElement('script');
                    schemaScript.type = 'application/ld+json';
                    const schemaData = {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": window.location.href
                        },
                        "headline": data.titulo,
                        "author": {
                            "@type": "Person",
                            "name": data.autor
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Fórmula Triple Rosa",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "images/logo-nav.png" // Asume que la URL completa será añadida luego
                            }
                        },
                        "datePublished": data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
                        "description": data.contenido.substring(0, 250)
                    };
                    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
                    document.head.appendChild(schemaScript);

                    const parrafos = escapeHTML(data.contenido).split(/\n\s*\n/);
                    parrafos.forEach(pText => {
                        if (pText.trim() !== '') {
                            const pElem = document.createElement('p');
                            pElem.innerHTML = pText.replace(/\n/g, '<br>');
                            storyDetailContentArticle.appendChild(pElem);
                        }
                    });
                } else {
                    if (storyDetailTitleElement) storyDetailTitleElement.textContent = "Historia no encontrada";
                    if (storyDetailMetaElement) storyDetailMetaElement.textContent = '';
                    storyDetailContentArticle.innerHTML = "<p>La historia que buscas no existe, ha sido eliminada o no ha sido aprobada.</p>";
                }
            })
            .catch((error) => {
                console.error("Error al cargar detalle de la historia: ", error);
                if (loadingStoryDetailElement) loadingStoryDetailElement.style.display = 'none';
                storyDetailContentArticle.innerHTML = '';
                if (storyDetailTitleElement) storyDetailTitleElement.textContent = "Error al cargar";
                if (storyDetailMetaElement) storyDetailMetaElement.textContent = '';
                storyDetailContentArticle.innerHTML = "<p>Ocurrió un error al cargar la historia. Por favor, inténtalo más tarde.</p>";
            });
    }
}

function setupEntrevistasPage() {
    const interviewsListContainer = document.getElementById('interviews-list-container');
    if (!interviewsListContainer) return;

    const loadingMsg = interviewsListContainer.querySelector('.loading-interviews');
    const noMsg = interviewsListContainer.querySelector('.no-interviews');
    const errorMsg = interviewsListContainer.querySelector('.error-interviews');

    if (!dbInstance) {
        if (errorMsg) {
            errorMsg.textContent = "Error: No se pudo conectar a la base de datos.";
            errorMsg.style.display = 'block';
        }
        return;
    }

    if (loadingMsg) loadingMsg.style.display = 'block';
    if (noMsg) noMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    dbInstance.collection('entrevistas').where('publicado', '==', true).orderBy('fecha', 'desc')
        .onSnapshot((snapshot) => {
            if (loadingMsg) loadingMsg.style.display = 'none';
            interviewsListContainer.querySelectorAll('.interview-card').forEach(el => el.remove());

            if (snapshot.empty) {
                if (noMsg) noMsg.style.display = 'block';
                return;
            }
            if (noMsg) noMsg.style.display = 'none';

            snapshot.forEach(doc => {
                const data = doc.data();
                const interviewCard = document.createElement('article');
                interviewCard.classList.add('interview-card');
                interviewCard.setAttribute('data-aos', 'fade-up');
                interviewCard.setAttribute('data-video-id', data.youtubeVideoId);

                // HTML de la tarjeta simplificado
                interviewCard.innerHTML = `
                    <div class="interview-card-thumbnail-wrapper">
                        <img src="https://i.ytimg.com/vi/${data.youtubeVideoId}/hqdefault.jpg" alt="Miniatura de la entrevista: ${escapeHTML(data.titulo)}" class="interview-card-image">
                    </div>
                    <div class="interview-card-content">
                        <h5 class="interview-title">${escapeHTML(data.titulo)}</h5>
                        <p class="interview-date">${formatDate(data.fecha)}</p>
                    </div>
                `;
                interviewsListContainer.appendChild(interviewCard);
            });

            if (typeof AOS !== 'undefined') AOS.refresh();
        }, (error) => {
            console.error("Error al cargar entrevistas: ", error);
            if (loadingMsg) loadingMsg.style.display = 'none';
            if (errorMsg) {
                errorMsg.textContent = "No se pudieron cargar las entrevistas. Inténtalo más tarde.";
                errorMsg.style.display = 'block';
            }
        });
}

function setupMuroEsperanzaPage() {
    const hopeMessageForm = document.getElementById('hopeMessageForm');
    const hopeWallGrid = document.querySelector('.hope-wall-grid');

    if (hopeMessageForm) {
        const formStatusMessage = document.getElementById('formStatusMessage');
        const mensajeTextoTextarea = hopeMessageForm.querySelector('#mensajeTexto');
        const charCounterElement = hopeMessageForm.querySelector('#charCounter');
        const maxLength = mensajeTextoTextarea ? parseInt(mensajeTextoTextarea.getAttribute('maxlength'), 10) : 300;

        if (mensajeTextoTextarea && charCounterElement) {
            charCounterElement.textContent = `${mensajeTextoTextarea.value.length}/${maxLength}`;
            mensajeTextoTextarea.addEventListener('input', () => {
                const currentLength = mensajeTextoTextarea.value.length;
                charCounterElement.textContent = `${currentLength}/${maxLength}`;
                charCounterElement.style.color = currentLength > maxLength ? 'red' : '#777';
            });
        }

        hopeMessageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!dbInstance) {
                console.error("dbInstance no está listo para enviar mensaje.");
                return;
            }

            const submitButton = hopeMessageForm.querySelector('button[type="submit"]');
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            formStatusMessage.textContent = "Enviando...";
            formStatusMessage.className = 'form-status-message';
            formStatusMessage.style.display = 'block';
            const nombre = hopeMessageForm.nombreAutor.value.trim();
            const mensaje = mensajeTextoTextarea.value.trim();
            if (!mensaje || mensaje.length > maxLength) {
                formStatusMessage.textContent = !mensaje ? "El mensaje no puede estar vacío." : `El mensaje no puede exceder los ${maxLength} caracteres.`;
                formStatusMessage.className = 'form-status-message error';
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                return;
            }
            const autorFinal = nombre || "Anónimo";
            dbInstance.collection('mensajesEsperanza').add({
                autor: autorFinal,
                texto: mensaje,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                aprobado: false,
                destacado: false
            }).then(() => {
                formStatusMessage.textContent = "¡Gracias! Tu mensaje ha sido enviado y será revisado antes de publicarse.";
                formStatusMessage.className = 'form-status-message success';
                hopeMessageForm.reset();
                if (charCounterElement) {
                    charCounterElement.textContent = `0/${maxLength}`;
                    charCounterElement.style.color = '#777';
                }
                setTimeout(() => {
                    if (formStatusMessage.classList.contains('success')) {
                        formStatusMessage.style.display = 'none';
                    }
                }, 5000);
            }).catch((error) => {
                console.error("Error al añadir mensaje: ", error);
                formStatusMessage.textContent = "Error al enviar el mensaje. Inténtalo de nuevo más tarde.";
                formStatusMessage.className = 'form-status-message error';
            }).finally(() => {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            });
        });
    }

    if (hopeWallGrid) {
        const loadingMessagesElement = hopeWallGrid.querySelector('.loading-messages');
        const noMessagesMsg = hopeWallGrid.querySelector('.no-messages:not(.error)');
        const errorMessagesMsg = hopeWallGrid.querySelector('.no-messages.error');

        if (!dbInstance) {
            if (loadingMessagesElement) loadingMessagesElement.style.display = 'none';
            if (errorMessagesMsg) {
                errorMessagesMsg.textContent = "Error: No se pudo conectar a la base de datos.";
                errorMessagesMsg.style.display = 'block';
            }
            return;
        }
        if (loadingMessagesElement) loadingMessagesElement.style.display = 'block';
        if (noMessagesMsg) noMessagesMsg.style.display = 'none';
        if (errorMessagesMsg) errorMessagesMsg.style.display = 'none';

        dbInstance.collection('mensajesEsperanza').where('aprobado', '==', true).orderBy('timestamp', 'desc').limit(25)
            .onSnapshot((snapshot) => {
                if (loadingMessagesElement) loadingMessagesElement.style.display = 'none';
                hopeWallGrid.querySelectorAll('.hope-message-card').forEach(el => el.remove());

                if (snapshot.empty) {
                    if (noMessagesMsg) noMessagesMsg.style.display = 'block';
                    return;
                }
                if (noMessagesMsg) noMessagesMsg.style.display = 'none';

                snapshot.forEach(doc => {
                    const data = doc.data(),
                        messageCard = document.createElement('article');
                    messageCard.classList.add('hope-message-card');
                    const textoSanitizado = escapeHTML(data.texto),
                        autorSanitizado = escapeHTML(data.autor);
                    messageCard.innerHTML = `<p class="message-text">${textoSanitizado.replace(/\n/g, '<br>')}</p><p class="message-author">- <span class="author-icon">💌</span> ${autorSanitizado}</p>`;
                    hopeWallGrid.appendChild(messageCard);
                });
            }, (error) => {
                console.error("Error al cargar mensajes: ", error);
                if (loadingMessagesElement) loadingMessagesElement.style.display = 'none';
                if (noMessagesMsg) noMessagesMsg.style.display = 'none';
                if (errorMessagesMsg) {
                    errorMessagesMsg.textContent = "No se pudieron cargar los mensajes en este momento. Inténtalo más tarde.";
                    errorMessagesMsg.style.display = 'block';
                }
            });
    }
}

// --- FUNCIÓN PARA HISTORIA DESTACADA AUTOMÁTICA ---
async function setupFeaturedStory() {
    const featuredStorySection = document.getElementById('featured-story');
    if (!featuredStorySection) {
        return;
    }

    const quoteTextElement = document.getElementById('featured-quote-text');
    const quoteAuthorElement = document.getElementById('featured-quote-author');

    if (!dbInstance) {
        console.error("Firebase no está listo para cargar contenido destacado.");
        // Dejamos el texto por defecto si Firebase no carga
        return;
    }

    try {
        // Obtenemos todas las historias y mensajes que estén APROBADOS
        const storyQuery = dbInstance.collection('historiasEnviadas').where('aprobado', '==', true);
        const messageQuery = dbInstance.collection('mensajesEsperanza').where('aprobado', '==', true);

        const [storySnapshot, messageSnapshot] = await Promise.all([
            storyQuery.get(),
            messageQuery.get()
        ]);

        const approvedItems = [];
        // Añadimos las historias aprobadas a nuestra lista
        storySnapshot.forEach(doc => approvedItems.push(doc.data()));
        // Añadimos los mensajes aprobados a nuestra lista
        messageSnapshot.forEach(doc => approvedItems.push(doc.data()));

        // Si hay al menos un elemento aprobado (historia o mensaje)
        if (approvedItems.length > 0) {
            // Seleccionamos uno al azar
            const randomIndex = Math.floor(Math.random() * approvedItems.length);
            const randomItem = approvedItems[randomIndex];

            // Comprobamos si es una historia (tiene campo 'contenido') o un mensaje
            if (randomItem.contenido) {
                // Es una historia, mostramos un extracto
                const extracto = randomItem.contenido.length > 200 
                    ? randomItem.contenido.substring(0, 200) + '...' 
                    : randomItem.contenido;
                quoteTextElement.textContent = `“${escapeHTML(extracto)}”`;
            } else {
                // Es un mensaje del muro
                quoteTextElement.textContent = `“${escapeHTML(randomItem.texto)}”`;
            }
            // Mostramos el autor
            quoteAuthorElement.textContent = `– ${escapeHTML(randomItem.autor)}`;

        } else {
            // Si no hay NADA aprobado, dejamos el mensaje por defecto
            console.log("No se encontró contenido aprobado para destacar.");
        }
    } catch (error) {
        console.error("Error al cargar contenido destacado automatizado: ", error);
        // En caso de error, también dejamos el mensaje por defecto
    }
}

// --- FUNCIÓN PARA EL GENERADOR DE AFIRMACIONES ---
function setupAffirmationGenerator() {
    const affirmationElement = document.getElementById('affirmationText');
    
    // Solo ejecuta si estamos en la página correcta (bienestar.html)
    if (!affirmationElement) {
        return;
    }

    // --- TU LISTA DE AFIRMACIONES ---
    // ¡Puedes añadir, quitar o modificar las que quieras aquí!
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

    // Escoge una afirmación al azar de la lista
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const randomAffirmation = affirmations[randomIndex];

    // Muestra la afirmación en la página
    affirmationElement.textContent = `“${randomAffirmation}”`;
}


// --- EVENT LISTENER PRINCIPAL DEL DOM ---
document.addEventListener('DOMContentLoaded', () => {
    setupMainMenu();
    setupScrollTopButton();
    setupVideoModal();

    const needsFirebase =
        document.getElementById('shareStoryForm') ||
        document.getElementById('stories-list-container') ||
        document.getElementById('storyDetailContentArticle') ||
        document.getElementById('hopeMessageForm') ||
        document.querySelector('.hope-wall-grid') ||
        document.getElementById('featured-story') ||
        document.getElementById('interviews-list-container');

    if (needsFirebase) {
        initializeFirebaseAndAppCheck();
        setTimeout(() => {
            if (document.getElementById('stories-list-container') || document.getElementById('shareStoryForm')) {
                setupHistoriasInspiranPage();
            }
            if (document.getElementById('storyDetailContentArticle')) {
                setupHistoriaDetallePage();
            }
            if (document.getElementById('interviews-list-container')) {
                setupEntrevistasPage();
            }
            if (document.getElementById('hopeMessageForm') || document.querySelector('.hope-wall-grid')) {
                setupMuroEsperanzaPage();
            }
            if (document.getElementById('featured-story')) {
                setupFeaturedStory();
            }
        }, 200);
    }

    if (typeof AOS !== 'undefined') {
        AOS.init();
    }
    
    setupAffirmationGenerator(); 
});