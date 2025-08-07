document.addEventListener('DOMContentLoaded', () => {
    // === PEMILIHAN ELEMEN ===
    // Layar
    const levelSelectScreen = document.getElementById('level-select-screen');
    const gameScreen = document.getElementById('game-screen');
    const questionModal = document.getElementById('question-modal');
    // Peta Level
    const levelMap = document.getElementById('level-map');
    // Arena Game
    const levelTitle = document.getElementById('level-title');
    const backToMapButton = document.getElementById('back-to-map-button');
    const mysteryBoxesContainer = document.getElementById('mystery-boxes-container');
    const diceImg = document.getElementById('dice-img');
    const rollButton = document.getElementById('roll-button');
    const infoText = document.getElementById('info-text');
    // Modal Soal
    const questionText = document.getElementById('question-text');
    const timerBar = document.getElementById('timer-bar');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');

    // === STATE PERMAINAN ===
    let questions = {};
    let unlockedLevel = 1;
    let currentLevel = 1;
    let levelQuestions = [];
    let completedBoxes = [];
    let lastDiceRoll = 0;
    let currentQuestion = {};
    let timer;
    const TIME_LIMIT = 10;
    
    // === INISIALISASI GAME ===
    async function initGame() {
        await loadQuestions();
        loadProgress();
        showLevelSelect();
    }
    
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            questions = await response.json();
        } catch (error) {
            console.error("Gagal memuat soal:", error);
        }
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('unlockedLevel');
        unlockedLevel = savedProgress ? parseInt(savedProgress, 10) : 1;
    }

    // === NAVIGASI LAYAR ===
    function showLevelSelect() {
        levelSelectScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        questionModal.style.display = 'none';
        renderLevelMap();
    }

    function showGameScreen() {
        levelSelectScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    }
    
    // === LOGIKA PETA LEVEL ===
    function renderLevelMap() {
        levelMap.innerHTML = '';
        const totalLevels = Object.keys(questions).length;
        for (let i = 1; i <= totalLevels; i++) {
            const icon = document.createElement('button');
            icon.classList.add('level-icon');
            icon.dataset.level = i;
            icon.textContent = i;
            if (i <= unlockedLevel) {
                icon.classList.add('unlocked');
                icon.addEventListener('click', () => startGame(i));
            } else {
                icon.classList.add('locked');
            }
            levelMap.appendChild(icon);
        }
    }

    // === LOGIKA PERMAINAN ===
    function startGame(levelNumber) {
        currentLevel = levelNumber;
        levelTitle.textContent = `Level ${currentLevel}`;
        levelQuestions = [...questions[`level${currentLevel}`]];
        completedBoxes = [false, false, false, false, false, false];
        lastDiceRoll = 0;
        infoText.textContent = 'Kocok dadu untuk memulai!';
        rollButton.disabled = false;
        renderMysteryBoxes();
        showGameScreen();
    }

    function renderMysteryBoxes() {
        mysteryBoxesContainer.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const box = document.createElement('div');
            box.classList.add('mystery-box');
            box.dataset.boxId = i;
            if (completedBoxes[i - 1]) {
                box.classList.add('completed');
                box.textContent = '✅';
            } else {
                box.textContent = '?';
                box.addEventListener('click', () => handleBoxClick(i));
            }
            mysteryBoxesContainer.appendChild(box);
        }
    }

// ... (kode lainnya tetap sama) ...

    function rollDice() {
        new Audio('sounds/kocok-dadu.mp3').play();
        lastDiceRoll = 0; // Reset
        let rollCount = 0;
        
        // Ganti class 'shake' (jika masih ada) dengan 'spinning'
        diceImg.classList.add('spinning'); 

        const rollInterval = setInterval(() => {
            const randomResult = Math.floor(Math.random() * 6) + 1;
            diceImg.src = `images/dice-${randomResult}.png`;
            rollCount++;
            if (rollCount > 10) {
                clearInterval(rollInterval);
                
                // Hapus class 'spinning' setelah animasi selesai
                diceImg.classList.remove('spinning'); 
                
                finishRoll(randomResult);
            }
        }, 100);
    }

// ... (kode lainnya tetap sama) ...
    
    function finishRoll(result) {
        lastDiceRoll = result;
        // Hapus highlight dari semua kotak
        document.querySelectorAll('.mystery-box').forEach(b => b.classList.remove('highlight'));
        
        if (completedBoxes[lastDiceRoll - 1]) {
            infoText.textContent = `Kotak ${lastDiceRoll} sudah terbuka. Kocok lagi!`;
        } else {
            infoText.textContent = `Silakan klik kotak nomor ${lastDiceRoll}!`;
            const targetBox = document.querySelector(`.mystery-box[data-box-id="${lastDiceRoll}"]`);
            if (targetBox) targetBox.classList.add('highlight');
        }
    }

    function handleBoxClick(boxId) {
        if (boxId !== lastDiceRoll) {
            infoText.textContent = `Anda harus mengocok dadu angka ${boxId} untuk membuka kotak ini!`;
            return;
        }
        if (completedBoxes[boxId - 1]) return;

        currentQuestion = { ...levelQuestions[boxId - 1], boxId: boxId };
        displayQuestionModal();
    }

    function displayQuestionModal() {
        questionText.textContent = currentQuestion.question;
        optionsContainer.innerHTML = '';
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option;
            button.addEventListener('click', () => checkAnswer(option));
            optionsContainer.appendChild(button);
        });
        resultText.textContent = '';
        questionModal.style.display = 'flex';
        startTimer();
    }

    function startTimer() { /* ... kode sama seperti sebelumnya ... */ }
    
    function checkAnswer(selectedOption) {
        clearInterval(timer);
        const isCorrect = selectedOption ? selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase() : false;

        document.querySelectorAll('.modal-content .option-button').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.toLowerCase() === currentQuestion.answer.toLowerCase()) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            new Audio('sounds/jawaban-benar.mp3').play();
            resultText.textContent = 'Benar! 🎉';
            resultText.className = 'correct';
            completedBoxes[currentQuestion.boxId - 1] = true;

            // Cek jika level selesai
            if (completedBoxes.every(status => status === true)) {
                setTimeout(levelComplete, 1500);
            }
        } else {
            new Audio('sounds/jawaban-salah.mp3').play();
            resultText.textContent = selectedOption === null ? 'Waktu Habis!' : 'Jawaban Salah!';
            resultText.className = 'incorrect';
        }

        setTimeout(() => {
            questionModal.style.display = 'none';
            renderMysteryBoxes();
            infoText.textContent = 'Kocok dadu untuk melanjutkan!';
        }, 2000);
    }

    function levelComplete() {
        new Audio('sounds/naik-level.mp3').play();
        infoText.textContent = `Selamat! Anda telah menyelesaikan Level ${currentLevel}!`;
        rollButton.disabled = true;
        if (currentLevel === unlockedLevel) {
            unlockedLevel++;
            localStorage.setItem('unlockedLevel', unlockedLevel);
        }
        // Beri waktu pemain untuk melihat hasilnya sebelum kembali ke peta
        setTimeout(showLevelSelect, 3000);
    }
    
    // Re-paste fungsi timer untuk kelengkapan
    function startTimer() {
        let timeLeft = TIME_LIMIT;
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
                checkAnswer(null);
            }
        }, 1000);
    }

    // === EVENT LISTENERS AWAL ===
    backToMapButton.addEventListener('click', showLevelSelect);
    rollButton.addEventListener('click', rollDice);

    // === MULAI GAME ===
    initGame();
});