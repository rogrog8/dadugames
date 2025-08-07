document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
    const rollButton = document.getElementById('roll-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const resultText = document.getElementById('result-text');

    let currentQuestion;
    let questions = {};

    // --- FUNGSI UTAMA ---

    // 1. Memuat soal dari file JSON saat halaman dibuka
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.statusText}`);
            }
            questions = await response.json();
            // Aktifkan tombol kocok setelah soal berhasil dimuat
            rollButton.disabled = false;
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            questionText.textContent = "Maaf, soal tidak dapat dimuat. Coba muat ulang halaman.";
            questionArea.style.display = 'block';
        }
    }

    // 2. Fungsi untuk mengocok dadu dengan animasi dan alur yang jelas
    function rollDice() {
        // Nonaktifkan tombol dan sembunyikan pertanyaan lama
        rollButton.disabled = true;
        questionArea.style.display = 'none';
        resultText.textContent = '';
        diceImg.classList.add('shake'); // Tambahkan animasi

        // Atur jeda untuk efek animasi
        setTimeout(() => {
            const result = Math.floor(Math.random() * 6) + 1;
            diceImg.src = `images/dice-${result}.png`;
            diceImg.classList.remove('shake'); // Hapus animasi
            
            displayQuestion(result);
        }, 700); // Durasi animasi 0.7 detik
    }

    // 3. Menampilkan soal berdasarkan angka dadu
    function displayQuestion(diceNumber) {
        const questionList = questions[diceNumber];
        if (questionList && questionList.length > 0) {
            const randomIndex = Math.floor(Math.random() * questionList.length);
            currentQuestion = questionList[randomIndex];
            
            questionText.textContent = currentQuestion.question;
            answerInput.value = '';

            // Tampilkan area pertanyaan dan aktifkan kembali input
            questionArea.style.display = 'block';
            answerInput.disabled = false;
            submitButton.disabled = false;
            answerInput.focus(); // Langsung fokus ke kolom jawaban
        } else {
            // Jika karena suatu hal tidak ada soal, aktifkan kembali tombol kocok
            questionText.textContent = "Tidak ada soal untuk nomor ini.";
            rollButton.disabled = false;
        }
    }

    // 4. Memeriksa jawaban pengguna
    function checkAnswer() {
        // Ambil dan bersihkan jawaban pengguna
        const userAnswer = answerInput.value.trim().toLowerCase();
        if (userAnswer === '') return; // Jangan lakukan apa-apa jika kosong

        const correctAnswer = currentQuestion.answer.toLowerCase();
        
        // Nonaktifkan input setelah menjawab
        answerInput.disabled = true;
        submitButton.disabled = true;

        if (userAnswer === correctAnswer) {
            resultText.textContent = 'Jawaban Anda benar! 🎉';
            resultText.className = 'correct';
        } else {
            resultText.textContent = `Salah. Jawaban yang benar: "${currentQuestion.answer}"`;
            resultText.className = 'incorrect';
        }
        
        // Aktifkan kembali tombol kocok agar bisa main lagi
        rollButton.disabled = false; 
    }

    // --- EVENT LISTENERS ---

    // Mulai dengan menonaktifkan tombol kocok sampai soal termuat
    rollButton.disabled = true;
    loadQuestions();

    rollButton.addEventListener('click', rollDice);
    submitButton.addEventListener('click', checkAnswer);
    
    // Tambahkan fungsionalitas tombol 'Enter'
    answerInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });
});