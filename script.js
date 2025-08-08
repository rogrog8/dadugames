document.addEventListener('DOMContentLoaded', () => {
    // === PEMILIHAN ELEMEN ===
    const startScreen = document.getElementById('start-screen');
    const categorySelectScreen = document.getElementById('category-select-screen');
    const levelSelectScreen = document.getElementById('level-select-screen');
    const gameScreen = document.getElementById('game-screen');
    const questionModal = document.getElementById('question-modal');
    const startButton = document.getElementById('start-button');
    const categoryMap = document.getElementById('category-map');
    const levelMap = document.getElementById('level-map');
    const levelSelectTitle = document.getElementById('level-select-title');
    const backToCategoryButton = document.getElementById('back-to-category-button');
    const backToMapButton = document.getElementById('back-to-map-button');
    const levelTitle = document.getElementById('level-title');
    const mysteryBoxesContainer = document.getElementById('mystery-boxes-container');
    const diceImg = document.getElementById('dice-img');
    const rollButton = document.getElementById('roll-button');
    const infoText = document.getElementById('info-text');
    const questionText = document.getElementById('question-text');
    const timerBar = document.getElementById('timer-bar');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');

    // === STATE PERMAINAN ===
    let questions = {};
    let unlockedLevels = {};
    let currentCategory = '';
    let currentLevel = 1;
    let levelQuestions = [];
    let completedBoxes = [];
    let lastDiceRoll = 0;
    let currentQuestion = {};
    let timer;
    let isRolling = false;
    const TIME_LIMIT = 10000;
    let timerStartTime;
    
    // === PRA-MUAT SUARA ===
    const rollSound = new Audio('sounds/kocok-dadu.mp3');
    const correctSound = new Audio('sounds/jawaban-benar.mp3');
    const incorrectSound = new Audio('sounds/jawaban-salah.mp3');
    const levelUpSound = new Audio('sounds/naik-level.mp3');
    
    // === INISIALISASI GAME ===
    async function initGame() {
        await loadQuestions();
        loadProgress();
        showStartScreen();
    }
    
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            questions = await response.json();
        } catch (error) {
            console.error("Gagal memuat soal:", error);
            startScreen.innerHTML = "<p>Gagal memuat data permainan. Pastikan file database.json ada dan formatnya benar.</p>";
        }
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('unlockedLevels');
        if (savedProgress) {
            unlockedLevels = JSON.parse(savedProgress);
        } else {
            // Inisialisasi awal, hanya level 1 dari setiap kategori yang terbuka
            Object.keys(questions).forEach(category => {
                unlockedLevels[category] = 1;
            });
            saveProgress();
        }
    }

    function saveProgress() {
        localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
    }

    function showStartScreen() {
        startScreen.style.display = 'block';
        categorySelectScreen.style.display = 'none';
        levelSelectScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        questionModal.classList.remove('visible');
    }

    function showCategorySelectScreen() {
        startScreen.style.display = 'none';
        categorySelectScreen.style.display = 'block';
        levelSelectScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        renderCategoryMap();
    }

    function showLevelSelectScreen(category) {
        currentCategory = category;
        categorySelectScreen.style.display = 'none';
        levelSelectScreen.style.display = 'block';
        levelSelectTitle.textContent = currentCategory;
        renderLevelMap();
    }

    function showGameScreen() {
        levelSelectScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    }
    
    function renderCategoryMap() {
        categoryMap.innerHTML = '';
        Object.keys(questions).forEach(category => {
            const icon = document.createElement('button');
            icon.classList.add('category-icon');
            icon.textContent = category;
            icon.addEventListener('click', () => showLevelSelectScreen(category));
            categoryMap.appendChild(icon);
        });
    }
    
    function renderLevelMap() {
        levelMap.innerHTML = '';
        const totalLevels = Object.keys(questions[currentCategory]).length;
        const currentUnlockedLevel = unlockedLevels[currentCategory] || 1;
        for (let i = 1; i <= totalLevels; i++) {
            const icon = document.createElement('button');
            icon.classList.add('level-icon');
            icon.dataset.level = i;
            icon.textContent = i;
            if (i <= currentUnlockedLevel) {
                icon.classList.add('unlocked');
                icon.addEventListener('click', () => startGame(i));
            } else {
                icon.classList.add('locked');
            }
            levelMap.appendChild(icon);
        }
    }

    function startGame(levelNumber) {
        currentLevel = levelNumber;
        levelTitle.textContent = `Level ${currentLevel}`;
        levelQuestions = [...questions[currentCategory][`level${currentLevel}`]];
        completedBoxes = Array(6).fill(false);
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

    function rollDice() {
        if (isRolling) return;
        isRolling = true;
        rollSound.currentTime = 0;
        rollSound.play();
        lastDiceRoll = 0;
        infoText.textContent = 'Mengocok...';
        rollButton.disabled = true;
        diceImg.classList.add('spinning');
        
        setTimeout(() => {
            const result = Math.floor(Math.random() * 6) + 1;
            diceImg.src = `images/dice-${result}.png`;
            diceImg.classList.remove('spinning');
            finishRoll(result);
        }, 600);
    }
    
    function finishRoll(result) {
        lastDiceRoll = result;
        isRolling = false;
        document.querySelectorAll('.mystery-box').forEach(b => b.classList.remove('highlight'));
        
        if (completedBoxes[lastDiceRoll - 1]) {
            infoText.textContent = `Kotak ${lastDiceRoll} sudah terbuka. Kocok lagi!`;
            rollButton.disabled = false;
        } else {
            infoText.textContent = `Silakan klik kotak nomor ${lastDiceRoll}!`;
            const targetBox = document.querySelector(`.mystery-box[data-box-id="${lastDiceRoll}"]`);
            if (targetBox) targetBox.classList.add('highlight');
        }
    }

    function handleBoxClick(boxId) {
        if (isRolling) return;
        if (lastDiceRoll === 0) {
            infoText.textContent = 'Anda harus mengocok dadu terlebih dahulu!';
            return;
        }
        if (boxId !== lastDiceRoll) {
            infoText.textContent = `Anda harus mendapatkan angka ${boxId} untuk membuka kotak ini!`;
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
        setTimeout(() => questionModal.classList.add('visible'), 10);
        startTimer();
    }

    function startTimer() {
        timerStartTime = Date.now();
        const updateTimer = () => {
            const elapsedTime = Date.now() - timerStartTime;
            const timeLeft = TIME_LIMIT - elapsedTime;
            const percentage = Math.max(0, (timeLeft / TIME_LIMIT) * 100);
            timerBar.style.width = `${percentage}%`;

            if (timeLeft <= 0) {
                checkAnswer(null);
            } else {
                timer = requestAnimationFrame(updateTimer);
            }
        };
        timer = requestAnimationFrame(updateTimer);
    }
    
    function checkAnswer(selectedOption) {
        cancelAnimationFrame(timer);
        
        const isCorrect = selectedOption && selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();
        
        document.querySelectorAll('.modal-content .option-button').forEach(btn => {
            btn.disabled = true;
            if (isCorrect) {
                if (btn.textContent.toLowerCase() === currentQuestion.answer.toLowerCase()) {
                    btn.classList.add('correct');
                }
            } else {
                if (btn.textContent.toLowerCase() === selectedOption?.toLowerCase()) {
                    btn.classList.add('incorrect');
                }
            }
        });
        
        if (isCorrect) {
            correctSound.currentTime = 0;
            correctSound.play();
            resultText.textContent = 'Benar! 🎉';
            resultText.className = 'correct';
            completedBoxes[currentQuestion.boxId - 1] = true;
            if (completedBoxes.every(status => status === true)) {
                setTimeout(levelComplete, 1500);
            } else {
                setTimeout(closeModal, 2000);
            }
        } else {
            incorrectSound.currentTime = 0;
            incorrectSound.play();
            resultText.textContent = selectedOption === null ? 'Waktu Habis!' : 'Jawaban Salah!';
            resultText.className = 'incorrect';
            setTimeout(closeModal, 2000);
        }
    }
    
    function closeModal() {
        questionModal.classList.remove('visible');
        setTimeout(() => {
            questionModal.style.display = 'none';
            renderMysteryBoxes();
            infoText.textContent = 'Kocok dadu untuk melanjutkan!';
            lastDiceRoll = 0;
            if (!completedBoxes.every(status => status === true)) {
                rollButton.disabled = false;
            }
        }, 300);
    }

    function levelComplete() {
        levelUpSound.currentTime = 0;
        levelUpSound.play();
        infoText.textContent = `Selamat! Anda telah menyelesaikan Level ${currentLevel}!`;
        rollButton.disabled = true;
        
        const totalLevelsInCurrentCategory = Object.keys(questions[currentCategory]).length;
        if (currentLevel < totalLevelsInCurrentCategory) {
            if (unlockedLevels[currentCategory] < currentLevel + 1) {
                unlockedLevels[currentCategory] = currentLevel + 1;
                saveProgress();
            }
            setTimeout(() => {
                startGame(currentLevel + 1);
            }, 3000);
        } else {
            infoText.textContent = `Anda telah menyelesaikan semua level di kategori ini! 🎉`;
            setTimeout(() => {
                showCategorySelectScreen();
            }, 3000);
        }
    }
    
    startButton.addEventListener('click', showCategorySelectScreen);
    backToCategoryButton.addEventListener('click', showCategorySelectScreen);
    backToMapButton.addEventListener('click', () => {
        cancelAnimationFrame(timer);
        showLevelSelectScreen(currentCategory);
    });
    rollButton.addEventListener('click', rollDice);

    initGame();
});