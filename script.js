document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
    const rollButton = document.getElementById('roll-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const resultText = document.getElementById('result-text');

    // Variabel state game
    let questions = {}; // Akan menyimpan master list dari JSON
    let availableQuestions = {}; // Menyimpan soal yang belum ditanyakan
    let currentQuestion;

    // Konstanta untuk durasi, agar mudah diubah
    const ANIMATION_DURATION = 700; // dalam milidetik

    // --- FUNGSI UTAMA ---

    // 1. Memuat soal dan menginisialisasi state game
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.statusText}`);
            }
            questions = await response.json();
            // Salin master list ke daftar soal yang tersedia. JSON.parse/stringify untuk deep copy.
            availableQuestions = JSON.parse(JSON.stringify(questions));
            rollButton.disabled = false;
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            questionText.textContent = "Maaf, soal tidak dapat dimuat. Coba muat ulang halaman.";
            questionArea.style.display = 'block';
        }
    }

    // 2. Fungsi untuk mengocok dadu
    function rollDice() {
        rollButton.disabled = true;
        questionArea.style.display = 'none';
        resultText.textContent = '';
        diceImg.classList.add('shake');

        setTimeout(() => {
            const result = Math.floor(Math.random() * 6) + 1;
            diceImg.src = `images/dice-${result}.png`;
            diceImg.classList.remove('shake');
            
            displayQuestion(result);
        }, ANIMATION_DURATION);
    }

    // 3. Menampilkan soal (dengan logika anti-ulang)
    function displayQuestion(diceNumber) {
        // **PENYEMPURNAAN 1: Logika Anti-Ulang**
        // Jika daftar soal untuk angka dadu ini sudah habis, isi ulang dari master list.
        if (!availableQuestions[diceNumber] || availableQuestions[diceNumber].length === 0) {
            console.log(`Mengisi ulang soal untuk dadu angka ${diceNumber}...`);
            availableQuestions[diceNumber] = [...questions[diceNumber]];
        }
        
        const questionList = availableQuestions[diceNumber];

        if (questionList && questionList.length > 0) {
            // Ambil soal secara acak dan HAPUS dari daftar yang tersedia
            const randomIndex = Math.floor(Math.random() * questionList.length);
            currentQuestion = questionList.splice(randomIndex, 1)[0]; // .splice() menghapus elemen

            questionText.textContent = currentQuestion.question;
            answerInput.value = '';
            
            questionArea.style.display = 'block';
            answerInput.disabled = false;
            submitButton.disabled = false;
            answerInput.focus();
        } else {
            questionText.textContent = "Tidak ada soal untuk nomor ini.";
            rollButton.disabled = false;
        }
    }

    // 4. Memeriksa jawaban pengguna
    function checkAnswer() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        if (userAnswer === '') return;

        const correctAnswer = currentQuestion.answer.toLowerCase();
        
        answerInput.disabled = true;
        submitButton.disabled = true;

        if (userAnswer === correctAnswer) {
            resultText.textContent = 'Jawaban Anda benar! 🎉';
            resultText.className = 'correct';
            
            // **PENYEMPURNAAN 2: Alur Lebih Mulus**
            // Sembunyikan area pertanyaan setelah 2 detik agar UI bersih
            setTimeout(() => {
                questionArea.style.display = 'none';
                rollButton.disabled = false; // Aktifkan tombol kocok setelah UI bersih
            }, 2000);

        } else {
            resultText.textContent = `Salah. Jawaban yang benar: "${currentQuestion.answer}"`;
            resultText.className = 'incorrect';
            // Langsung aktifkan kembali tombol kocok jika salah
            rollButton.disabled = false; 
        }
    }

    // --- EVENT LISTENERS ---
    rollButton.disabled = true;
    loadQuestions();

    rollButton.addEventListener('click', rollDice);
    submitButton.addEventListener('click', checkAnswer);
    
    answerInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            // Pastikan input tidak dinonaktifkan sebelum submit
            if (!answerInput.disabled) {
                checkAnswer();
            }
        }
    });
});
