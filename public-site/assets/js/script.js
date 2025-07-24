document.addEventListener('DOMContentLoaded', function() {
    const backendUrl = 'http://localhost/undangan_digital_platform/backend';
    const params = new URLSearchParams(window.location.search);
    const invitationId = params.get('id');
    const guestName = params.get('to') || 'Tamu Undangan';

    const openingScreen = document.getElementById('opening-screen');
    const invitationContent = document.getElementById('invitation-content');
    const openButton = document.getElementById('open-invitation');
    const backgroundMusic = document.getElementById('background-music');

    document.getElementById('guest-name').textContent = guestName;
    document.getElementById('guest-name-rsvp').value = guestName;

    if (!invitationId) {
        document.body.innerHTML = '<h1>Undangan tidak ditemukan.</h1>';
        return;
    }

    const reorderLayout = (orderString) => {
        const container = document.getElementById('invitation-content');
        if (!container || !orderString) return;
        const order = orderString.split(',');
        const sections = Array.from(container.children);
        const sectionMap = {};
        sections.forEach(section => { sectionMap[section.id] = section; });
        container.innerHTML = '';
        order.forEach(sectionId => {
            if (sectionMap[sectionId]) container.appendChild(sectionMap[sectionId]);
        });
    };

    fetch(`${backendUrl}/api/invitations/read_single.php?id=${invitationId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.message) {
                document.body.innerHTML = `<h1>${data.message}</h1>`;
                return;
            }

            // Fitur Drag & Drop Layout
            reorderLayout(data.layout_order);

            // Tema
            const theme = data.theme || 'classic_elegant.css';
            const themeLink = document.createElement('link');
            themeLink.rel = 'stylesheet';
            themeLink.href = `assets/css/${theme}`;
            document.head.appendChild(themeLink);

            // Data Mempelai (sesuai DB Anda)
            const bgData = data.bride_groom_data;
            if (bgData) {
                document.getElementById('opening-couple-names').textContent = `${bgData.nama_wanita || ''} & ${bgData.nama_pria || ''}`;
                document.getElementById('bride-name').textContent = bgData.nama_wanita || '';
                document.getElementById('bride-father').textContent = bgData.ayah_wanita || '';
                document.getElementById('bride-mother').textContent = bgData.ibu_wanita || '';
                if(bgData.foto_wanita) document.getElementById('bride-photo').src = `${backendUrl}/uploads/${bgData.foto_wanita}`;
                document.getElementById('groom-name').textContent = bgData.nama_pria || '';
                document.getElementById('groom-father').textContent = bgData.ayah_pria || '';
                document.getElementById('groom-mother').textContent = bgData.ibu_pria || '';
                if(bgData.foto_pria) document.getElementById('groom-photo').src = `${backendUrl}/uploads/${bgData.foto_pria}`;
            }

            // Cover & Musik (sesuai DB Anda)
            document.getElementById('cover-title').textContent = data.title || '';
            if (data.cover_image) {
                try {
                    // cover_slideshow disimpan sebagai JSON array string '["file.jpg"]'
                    const coverFiles = JSON.parse(data.cover_image);
                    if (coverFiles.length > 0) {
                        document.getElementById('cover-image').src = `${backendUrl}/uploads/${coverFiles[0]}`;
                    }
                } catch (e) {
                    // Fallback jika formatnya hanya string biasa
                    document.getElementById('cover-image').src = `${backendUrl}/uploads/${data.cover_image}`;
                }
            }
            if(data.music) backgroundMusic.src = `${backendUrl}/uploads/${data.music}`;
            
            // Acara & Countdown (sesuai DB Anda)
            const eventsContainer = document.getElementById('events-container');
            if (data.events_data && eventsContainer) {
                eventsContainer.innerHTML = '';
                let firstEventDate;
                data.events_data.forEach((event, index) => {
                    if (index === 0) {
                        // Mengambil hanya jam mulai untuk countdown
                        const startTime = event.waktu.split(' ')[0];
                        firstEventDate = new Date(`${event.tanggal}T${startTime}`);
                    }
                    eventsContainer.innerHTML += `<div class="col-md-6"><h4>${event.jenis_acara}</h4><p>${new Date(event.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p><p>${event.waktu}</p><p>${event.nama_tempat}</p><a href="${event.link_gmaps}" target="_blank" class="btn btn-outline-primary">Lihat Peta</a></div>`;
                });
                if (firstEventDate) startCountdown(firstEventDate);
            }

            // Galeri (sesuai DB Anda)
            const galleryContainer = document.getElementById('gallery-container');
            if (data.galleries_data && galleryContainer) {
                galleryContainer.innerHTML = '';
                data.galleries_data.forEach(item => {
                    const galleryItem = `<img src="${backendUrl}/uploads/${item.url_file}" class="img-fluid" alt="Gallery Photo">`;
                    galleryContainer.innerHTML += `<div class="col-md-4 mb-3">${galleryItem}</div>`;
                });
            }

            // Cerita (sesuai DB Anda)
            const storyContainer = document.getElementById('story-container');
            if (data.stories_data && storyContainer) {
                storyContainer.innerHTML = '';
                data.stories_data.forEach(story => {
                    storyContainer.innerHTML += `<div class="story-item"><p>${story.isi_cerita}</p></div>`;
                });
            }

            // Amplop Digital (sesuai DB Anda)
            const giftContainer = document.getElementById('gift-container');
            if (data.gift_data && giftContainer) {
                giftContainer.innerHTML = '';
                data.gift_data.forEach(gift => {
                    giftContainer.innerHTML += `<div class="col-md-4"><div class="card"><div class="card-body"><h5 class="card-title">${gift.tipe_hadiah}</h5><p class="card-text">${gift.nomor_rekening}</p><p class="card-text">a.n. ${gift.atas_nama}</p><button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${gift.nomor_rekening}')">Salin Nomor</button></div></div></div>`;
                });
            }
            
            document.getElementById('invitation-id-rsvp').value = invitationId;
            fetchRsvp(invitationId);
        })
        .catch(error => {
            console.error('Error fetching invitation data:', error);
            document.body.innerHTML = '<h1>Terjadi kesalahan saat memuat undangan.</h1>';
        });

    openButton.addEventListener('click', () => {
        openingScreen.style.display = 'none';
        invitationContent.classList.remove('d-none');
        if (backgroundMusic.src) backgroundMusic.play().catch(e => console.log("Autoplay dicegah."));
    });
    
    const rsvpForm = document.getElementById('rsvp-form');
    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        fetch(`${backendUrl}/api/rsvp/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            if (result.message === 'RSVP submitted') {
                rsvpForm.reset();
                document.getElementById('guest-name-rsvp').value = guestName;
                fetchRsvp(invitationId);
            }
        });
    });

    function fetchRsvp(id) {
        const rsvpList = document.getElementById('rsvp-list');
        fetch(`${backendUrl}/api/rsvp/read.php?invitation_id=${id}`)
            .then(response => response.json())
            .then(data => {
                rsvpList.innerHTML = '<h4>Ucapan dari Tamu:</h4>';
                if (data.data && data.data.length > 0) {
                    data.data.forEach(rsvp => {
                        rsvpList.innerHTML += `<div class="card mb-2"><div class="card-body"><strong>${rsvp.guest_name}</strong> (${rsvp.attendance})<p>${rsvp.message}</p><small>${new Date(rsvp.created_at).toLocaleString('id-ID')}</small></div></div>`;
                    });
                }
            });
    }

    function startCountdown(targetDate) {
        const timer = document.getElementById('timer');
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            timer.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            if (distance < 0) {
                clearInterval(interval);
                timer.innerHTML = "Acara Telah Selesai";
            }
        }, 1000);
    }
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Nomor rekening berhasil disalin!');
    }, (err) => {
        alert('Gagal menyalin nomor rekening.');
        console.error('Could not copy text: ', err);
    });
}
