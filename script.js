// Ganti dengan Project URL dan Anon Public Key dari proyek Supabase Anda
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const wishboxForm = document.getElementById('wishbox-form');
const nameInput = document.getElementById('name');
const messageInput = document.getElementById('message');
const entriesContainer = document.getElementById('wishbox-entries');

// Fungsi untuk menampilkan satu ucapan di UI
function displayEntry(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('entry');
    entryDiv.setAttribute('data-id', entry.id); // Simpan ID untuk referensi

    const createdAt = new Date(entry.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    entryDiv.innerHTML = `
        <div class="entry-header">
            <span class="entry-name">${entry.name}</span>
            <span class="entry-date">${createdAt}</span>
        </div>
        <p class="entry-message">${entry.message}</p>
    `;
    entriesContainer.prepend(entryDiv); // Tambahkan ke paling atas
}

// Fungsi untuk memuat semua ucapan dari Supabase
async function loadEntries() {
    entriesContainer.innerHTML = '<p>Memuat ucapan...</p>'; // Reset container
    const { data, error } = await supabase
        .from('wishbox_entries')
        .select('*')
        .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
        console.error('Error loading entries:', error.message);
        entriesContainer.innerHTML = '<p style="color: red;">Gagal memuat ucapan.</p>';
        return;
    }

    entriesContainer.innerHTML = ''; // Hapus pesan "Memuat..."
    if (data.length === 0) {
        entriesContainer.innerHTML = '<p>Belum ada ucapan. Jadilah yang pertama!</p>';
    } else {
        data.forEach(displayEntry);
    }
}

// Fungsi untuk mengirim ucapan baru
wishboxForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
        alert('Nama dan ucapan tidak boleh kosong!');
        return;
    }

    const { data, error } = await supabase
        .from('wishbox_entries')
        .insert([{ name, message }])
        .select(); // Mengambil data yang baru saja di-insert

    if (error) {
        console.error('Error submitting entry:', error.message);
        alert('Gagal mengirim ucapan. Silakan coba lagi.');
        return;
    }

    // Jika berhasil, form dikosongkan
    nameInput.value = '';
    messageInput.value = '';
    // Data yang baru di-insert akan otomatis ditambahkan oleh listener real-time,
    // jadi kita tidak perlu memanggil displayEntry secara manual di sini.
});

// Setup Realtime Subscription
function setupRealtime() {
    supabase
        .channel('public:wishbox_entries') // Nama channel harus unik, `public:nama_tabel` adalah konvensi umum
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'wishbox_entries' },
            (payload) => {
                console.log('New entry received in real-time!', payload.new);
                displayEntry(payload.new); // Tampilkan entri baru secara real-time
                const placeholder = entriesContainer.querySelector('p');
                if (placeholder && placeholder.textContent === 'Belum ada ucapan. Jadilah yang pertama!') {
                    placeholder.remove(); // Hapus placeholder jika ada ucapan pertama
                }
            }
        )
        .subscribe();
}

// Inisialisasi: muat ucapan dan siapkan real-time
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    setupRealtime();
});
