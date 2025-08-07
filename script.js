document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
    const rollButton = document.getElementById('roll-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');
    
    // Elemen UI baru untuk statistik
    const levelText = document.getElementById('level-text');
    const scoreText = document.getElementById('score-text');

    // --- STATE PERMAINAN ---
    let currentQuestion;
    let questions = {};
    let availableQuestions = {};

    // Variabel baru untuk sistem level dan skor
    let currentLevel = 1;
    let score = 0;
    let scoreToNextLevel = 50; // Butuh 50 poin untuk naik level
    const POINTS_PER_CORRECT_ANSWER = 10;

    const ANIMATION_DURATION = 700;

    // --- FUNGSI UTAMA ---

    // 1. Memuat soal dan menginisialisasi game
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            questions = await response.json();
            // Inisialisasi daftar soal yang tersedia untuk level 1
            resetAvailableQuestionsForLevel(1); 
            rollButton.disabled = false;
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            questionText.textContent = "Maaf, soal tidak dapat dimuat. Coba muat ulang halaman.";
            questionArea.style.display = 'block';
        }
    }

    // 2. Fungsi baru untuk mereset daftar soal pada level tertentu
    function resetAvailableQuestionsForLevel(level) {
        const levelData = questions[`level${level}`];
        if (levelData) {
            availableQuestions = JSON.parse(JSON.stringify(levelData));
        } else {
            // Handle jika soal untuk level selanjutnya tidak ada (tamat)
            availableQuestions = {};
        }
    }

    // 3. Fungsi baru untuk memperbarui tampilan statistik
    function updateStatsDisplay() {
        levelText.textContent = currentLevel;
        scoreText.textContent = score;
    }

    // 4. Fungsi untuk mengocok dadu
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

    // 5. Menampilkan soal berdasarkan LEVEL dan angka dadu
    function displayQuestion(diceNumber) {
        // Jika soal untuk level saat ini sudah habis, reset
        if (!availableQuestions[diceNumber] || availableQuestions[diceNumber].length === 0) {
            const levelData = questions[`level${currentLevel}`];
            if(levelData && levelData[diceNumber]) {
                availableQuestions[diceNumber] = [...levelData[diceNumber]];
            }
        }
        
        const questionList = availableQuestions[diceNumber];

        if (!questionList || questionList.length === 0) {
            // Handle jika tidak ada soal (misalnya level terakhir sudah tamat)
            questionText.textContent = `Selamat! Anda telah menyelesaikan semua soal di Level ${currentLevel}!`;
            optionsContainer.innerHTML = '';
            questionArea.style.display = 'block';
            return;
        }

        const randomIndex = Math.floor(Math.random() * questionList.length);
        currentQuestion = questionList.splice(randomIndex, 1)[0];

        questionText.textContent = currentQuestion.question;
        optionsContainer.innerHTML = ''; 

        const shuffledOptions = currentQuestion.options.sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkAnswer(option, button));
            optionsContainer.appendChild(button);
        });

        questionArea.style.display = 'block';
    }
    
    // 6. Fungsi baru untuk menangani proses NAIK LEVEL
    function levelUp() {
        currentLevel++;
        scoreToNextLevel *= 2; // Target skor untuk level berikutnya digandakan
        resultText.textContent = `🎉 SELAMAT, ANDA NAIK KE LEVEL ${currentLevel}! 🎉`;
        resultText.className = 'correct'; // Pakai style warna hijau
        resetAvailableQuestionsForLevel(currentLevel); // Siapkan soal untuk level baru
        updateStatsDisplay(); // Perbarui tampilan level di layar
    }

    // 7. Memeriksa jawaban, menambahkan SKOR, dan cek NAIK LEVEL
    function checkAnswer(selectedOption, selectedButton) {
        const isCorrect = selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();

        const allOptionButtons = optionsContainer.querySelectorAll('.option-button');
        allOptionButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.toLowerCase() === currentQuestion.answer.toLowerCase()) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            score += POINTS_PER_CORRECT_ANSWER; // Tambah skor
            updateStatsDisplay(); // Perbarui tampilan skor

            if (score >= scoreToNextLevel) {
                levelUp(); // Cek jika skor cukup untuk naik level
            } else {
                resultText.textContent = 'Jawaban Anda benar! 🎉';
                resultText.className = 'correct';
            }

        } else {
            selectedButton.classList.add('incorrect');
            resultText.textContent = 'Jawaban Anda salah.';
            resultText.className = 'incorrect';
        }

        // Aktifkan kembali tombol kocok setelah jeda singkat
        setTimeout(() => {
            rollButton.disabled = false;
        }, 2000);
    }

    // --- EVENT LISTENERS ---
    rollButton.disabled = true;
    loadQuestions(); // Mulai game
    rollButton.addEventListener('click', rollDice);
});
