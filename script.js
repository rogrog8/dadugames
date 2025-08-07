document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
    const rollButton = document.getElementById('roll-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');
    const levelText = document.getElementById('level-text');
    const scoreText = document.getElementById('score-text');

    // --- STATE PERMAINAN ---
    let currentQuestion;
    let questions = {};
    let availableQuestions = {};
    let currentLevel = 1;
    let score = 0;
    let scoreToNextLevel = 50;
    const POINTS_PER_CORRECT_ANSWER = 10;
    const ANIMATION_DURATION = 700;

    // --- FUNGSI UTAMA ---

    // 1. Memuat soal dan menginisialisasi game
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            questions = await response.json();
            resetAvailableQuestionsForLevel(currentLevel);
            rollButton.disabled = false;
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            questionText.textContent = "Maaf, soal tidak dapat dimuat. Coba muat ulang halaman.";
            questionArea.style.display = 'block';
        }
    }

    // 2. Fungsi untuk mereset daftar soal pada level tertentu
    function resetAvailableQuestionsForLevel(level) {
        const levelData = questions[`level${level}`];
        if (levelData) {
            availableQuestions = JSON.parse(JSON.stringify(levelData));
        } else {
            availableQuestions = {}; // Tidak ada soal lagi untuk level ini (tamat)
        }
    }

    // 3. Fungsi untuk memperbarui tampilan statistik
    function updateStatsDisplay() {
        levelText.textContent = currentLevel;
        scoreText.textContent = score;
    }

    // 4. Fungsi untuk mengocok dadu
    function rollDice() {
        new Audio('sounds/kocok-dadu.mp3').play();
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
        const currentLevelKey = `level${currentLevel}`;

        // Cek apakah game sudah tamat
        if (!questions[currentLevelKey]) {
            questionText.textContent = `Selamat! Anda telah menamatkan semua level!`;
            optionsContainer.innerHTML = '';
            questionArea.style.display = 'block';
            rollButton.disabled = true;
            return;
        }

        // Jika soal untuk angka dadu ini habis, isi ulang dari master list level ini
        if (!availableQuestions[diceNumber] || availableQuestions[diceNumber].length === 0) {
            availableQuestions[diceNumber] = [...questions[currentLevelKey][diceNumber]];
        }
        
        const questionList = availableQuestions[diceNumber];

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
    
    // 6. Fungsi untuk menangani proses NAIK LEVEL
    function levelUp() {
        new Audio('sounds/naik-level.mp3').play();
        currentLevel++;
        scoreToNextLevel *= 2;
        resultText.textContent = `🎉 SELAMAT, ANDA NAIK KE LEVEL ${currentLevel}! 🎉`;
        resultText.className = 'correct';
        resetAvailableQuestionsForLevel(currentLevel);
        updateStatsDisplay();
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
            new Audio('sounds/jawaban-benar.mp3').play();
            score += POINTS_PER_CORRECT_ANSWER;
            updateStatsDisplay();

            if (score >= scoreToNextLevel) {
                levelUp();
            } else {
                resultText.textContent = 'Jawaban Anda benar! 🎉';
                resultText.className = 'correct';
            }
        } else {
            new Audio('sounds/jawaban-salah.mp3').play();
            selectedButton.classList.add('incorrect');
            resultText.textContent = 'Jawaban Anda salah.';
            resultText.className = 'incorrect';
        }
        
        setTimeout(() => {
            // Cek apakah game sudah tamat sebelum mengaktifkan tombol lagi
            if(questions[`level${currentLevel}`]) {
                 rollButton.disabled = false;
            }
        }, 2000);
    }

    // --- EVENT LISTENERS ---
    rollButton.disabled = true;
    loadQuestions();
    updateStatsDisplay();
    rollButton.addEventListener('click', rollDice);
});