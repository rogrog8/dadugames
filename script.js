document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
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

    // --- STATE PERMAINAN ---
    let currentQuestion;
    let questions = {};
    let availableQuestions = []; // Sekarang menjadi array, bukan objek
    let currentLevel = 1;
    let score = 0;
    let highScore = 0;
    let perfectRun = true; 
    const POINTS_PER_CORRECT_ANSWER = 10;
    const ANIMATION_DURATION = 700;

    // --- FUNGSI UTAMA ---
    
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

    function resetAvailableQuestionsForLevel(level) {
        const levelData = questions[`level${level}`];
        if (levelData) {
            // Salin array soal untuk level saat ini
            availableQuestions = [...levelData];
        } else {
            availableQuestions = []; // Level tidak ada, kosongkan array
        }
        perfectRun = true;
    }

    function updateStatsDisplay() {
        levelText.textContent = currentLevel;
        scoreText.textContent = score;
    }

    function isLevelComplete() {
        // Level selesai jika array soal yang tersedia kosong
        return availableQuestions.length === 0;
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
            displayQuestion(); // Tidak perlu lagi mengirimkan angka dadu
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
    }
    
    function levelUp() {
        currentLevel++;
        if (!questions[`level${currentLevel}`]) {
            new Audio('sounds/naik-level.mp3').play();
            resultText.textContent = `🏆 SELAMAT, ANDA TELAH MENAMATKAN GAME INI! 🏆`;
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

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                updateHighScoreDisplay();
            }

            resultText.textContent = 'Jawaban Anda benar! 🎉';
            resultText.className = 'correct';

        } else {
            new Audio('sounds/jawaban-salah.mp3').play();
            selectedButton.classList.add('incorrect');
            resultText.textContent = 'Jawaban Anda salah.';
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

    // --- EVENT LISTENERS ---
    rollButton.disabled = true;
    loadQuestions();
    loadHighScore();
    updateStatsDisplay();
    rollButton.addEventListener('click', rollDice);
    restartButton.addEventListener('click', restartLevel);
});