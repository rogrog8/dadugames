document.addEventListener('DOMContentLoaded', () => {
    // --- PEMILIHAN ELEMEN ---
    // Layar
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    // Tombol Usia
    const ageButtons = document.querySelectorAll('.age-button');
    // Elemen Game
    const rollButton = document.getElementById('roll-button');
    const restartButton = document.getElementById('restart-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');
    const levelText = document.getElementById('level-text');
    const scoreText = document.getElementById('score-text');
    const highScoreText = document.getElementById('high-score-text');
    const timerBar = document.getElementById('timer-bar');

    // --- STATE PERMAINAN ---
    let currentQuestion;
    let questions = {};
    let availableQuestions = [];
    let currentLevel = 1;
    let score = 0;
    let highScore = 0;
    let perfectRun = true;
    let timer;
    let timeLeft = 10;
    let selectedAgeGroup = ''; // State baru untuk menyimpan kelompok usia
    const TIME_LIMIT = 10;
    const POINTS_PER_CORRECT_ANSWER = 10;
    const ANIMATION_DURATION = 700;

    // --- FUNGSI-FUNGSI ---
    
    function loadHighScore() {
        const savedHighScore = localStorage.getItem('highScore') || 0;
        highScore = parseInt(savedHighScore, 10);
        updateHighScoreDisplay();
    }

    function updateHighScoreDisplay() {
        highScoreText.textContent = highScore;
    }

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

    // Fungsi ini sekarang menggunakan selectedAgeGroup
    function resetAvailableQuestionsForLevel(level) {
        const levelData = questions[selectedAgeGroup]?.[`level${level}`];
        if (levelData) {
            availableQuestions = [...levelData];
        } else {
            availableQuestions = [];
        }
        perfectRun = true;
    }

    function updateStatsDisplay() {
        levelText.textContent = currentLevel;
        scoreText.textContent = score;
    }

    function isLevelComplete() {
        return availableQuestions.length === 0;
    }

    function startTimer() { /* ... fungsi ini tetap sama ... */ }
    function rollDice() { /* ... fungsi ini tetap sama ... */ }
    function displayQuestion() { /* ... fungsi ini tetap sama ... */ }
    
    // Fungsi ini sekarang menggunakan selectedAgeGroup
    function levelUp() {
        currentLevel++;
        if (!questions[selectedAgeGroup]?.[`level${currentLevel}`]) {
            new Audio('sounds/naik-level.mp3').play();
            resultText.textContent = `🏆 SELAMAT, ANDA TELAH MENAMATKAN SEMUA LEVEL! 🏆`;
            resultText.className = 'correct';
            rollButton.style.display = 'none';
            restartButton.style.display = 'none';
            return;
        }
        new Audio('sounds/naik-level.mp3').play();
        resultText.textContent = `🎉 SELAMAT, ANDA NAIK KE LEVEL ${currentLevel}! 🎉`;
        resultText.className = 'correct';
        resetAvailableQuestionsForLevel(currentLevel);
        updateStatsDisplay();
        setTimeout(() => {
            rollButton.disabled = false;
            questionArea.style.display = 'none';
        }, 2500);
    }

    function restartLevel() { /* ... fungsi ini tetap sama ... */ }
    function checkAnswer(selectedOption, selectedButton) { /* ... fungsi ini tetap sama ... */ }

    // --- FUNGSI BARU UNTUK MEMULAI GAME ---
    function startGame(ageGroup) {
        selectedAgeGroup = ageGroup;
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';

        // Muat semua data yang diperlukan untuk memulai game
        loadQuestions();
        loadHighScore();
        updateStatsDisplay();
    }

    // --- EVENT LISTENERS ---
    // Tambahkan event listener untuk setiap tombol usia
    ageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const ageGroup = button.dataset.age;
            startGame(ageGroup);
        });
    });

    // Event listener untuk elemen game
    rollButton.addEventListener('click', rollDice);
    restartButton.addEventListener('click', restartLevel);

    // --- Re-paste fungsi yang tidak berubah untuk kelengkapan ---
    function startTimer() {
        timeLeft = TIME_LIMIT;
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        setTimeout(() => {
            timerBar.style.transition = `width ${TIME_LIMIT}s linear`;
            timerBar.style.width = '0%';
        }, 100);
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(timer);
                checkAnswer(null, null);
            }
        }, 1000);
    }
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
            displayQuestion();
        }, ANIMATION_DURATION);
    }
    function displayQuestion() {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestion = availableQuestions.splice(randomIndex, 1)[0];
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
        startTimer();
    }
    function restartLevel() {
        new Audio('sounds/kocok-dadu.mp3').play();
        resetAvailableQuestionsForLevel(currentLevel);
        questionArea.style.display = 'none';
        resultText.textContent = '';
        restartButton.style.display = 'none';
        rollButton.style.display = 'block';
        rollButton.disabled = false;
    }
    function checkAnswer(selectedOption, selectedButton) {
        clearInterval(timer);
        const isCorrect = selectedOption ? selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase() : false;
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
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                updateHighScoreDisplay();
            }
            resultText.textContent = 'Jawaban Anda benar! 🎉';
            resultText.className = 'correct';
        } else {
            new Audio('sounds/jawaban-salah.mp3').play();
            if (selectedButton) {
                selectedButton.classList.add('incorrect');
            }
            resultText.textContent = selectedOption === null ? 'Waktu Habis!' : 'Jawaban Anda salah.';
            resultText.className = 'incorrect';
            perfectRun = false;
        }
        if (isLevelComplete()) {
            rollButton.disabled = true;
            if (perfectRun) {
                resultText.textContent = 'Benar! Semua soal level ini selesai dengan sempurna!';
                setTimeout(levelUp, 2000); 
            } else {
                resultText.textContent = 'Anda menyelesaikan semua soal, tapi ada kesalahan. Ulangi level ini.';
                rollButton.style.display = 'none';
                restartButton.style.display = 'block';
            }
        } else {
            setTimeout(() => { 
                rollButton.disabled = false; 
            }, 2000);
        }
    }
});