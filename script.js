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
    const nextButton = document.getElementById('next-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const livesCount = document.getElementById('lives-count');
    const helpFiftyFiftyBtn = document.getElementById('help-fifty-fifty');
    const helpShowAnswerBtn = document.getElementById('help-show-answer');

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
    let lives = 3;
    let helpUsed = { fiftyFifty: false, showAnswer: false };

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
            Object.keys(questions).forEach(category => {
                unlockedLevels[category] = 1;
            });
            saveProgress();
        }
    }

    function saveProgress() {
        localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
    }

    // === FUNGSI TAMPILAN LAYAR ===
    function showStartScreen() {
        startScreen.style.display = 'flex';
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
        gameScreen.style.display = 'none';
        categorySelectScreen.style.display = 'none';
        levelSelectScreen.style.display = 'block';
        levelSelectTitle.textContent = currentCategory;
        renderLevelMap();
    }

    function showGameScreen() {
        levelSelectScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    }

    // === FUNGSI RENDER ===
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
        const totalLevels = questions[currentCategory] ? Object.keys(questions[currentCategory]).length : 0;
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

    // === LOGIKA PERMAINAN INTI ===
    function startGame(levelNumber) {
        currentLevel = levelNumber;
        levelTitle.textContent = `Level ${currentLevel}`;
        
        lives = 3;
        livesCount.textContent = lives;

        helpUsed = { fiftyFifty: false, showAnswer: false };
        updateHelpButtons();

        if (questions[currentCategory] && questions[currentCategory][`level${currentLevel}`]) {
            levelQuestions = [...questions[currentCategory][`level${currentLevel}`]];
        } else {
            console.error(`Gagal memuat level ${currentLevel} untuk kategori ${currentCategory}. Kembali ke peta level.`);
            showLevelSelectScreen(currentCategory);
            return;
        }

        completedBoxes = Array(6).fill(false);
        lastDiceRoll = 0;
        infoText.textContent = 'Kocok dadu untuk memulai!';
        rollButton.disabled = false;
        renderMysteryBoxes();
        showGameScreen();
    }

    function rollDice() {
        if (isRolling) return;
        isRolling = true;
        rollSound.currentTime = 0;
        rollSound.play();
        lastDiceRoll = 0;
        infoText.textContent = 'Mengocok...';
        rollButton.disabled = true;
    
        diceImg.classList.add('dice-rolling');
    
        const rollingInterval = setInterval(() => {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            diceImg.src = `images/dice-${randomFace}.png`;
        }, 80);
    
        setTimeout(() => {
            clearInterval(rollingInterval);
            diceImg.classList.remove('dice-rolling');
            
            let finalResult;
            const remainingBoxesCount = completedBoxes.filter(status => !status).length;

            if (remainingBoxesCount === 1) {
                const lastBoxIndex = completedBoxes.findIndex(status => !status);
                finalResult = lastBoxIndex + 1;
            } else {
                finalResult = Math.floor(Math.random() * 6) + 1;
            }

            diceImg.src = `images/dice-${finalResult}.png`;
            finishRoll(finalResult);

        }, 1000);
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

        if (!levelQuestions[boxId - 1]) {
            console.error(`Data pertanyaan untuk kotak ${boxId} tidak ditemukan.`);
            infoText.textContent = `Soal untuk kotak ${boxId} tidak ada. Kocok lagi.`;
            lastDiceRoll = 0;
            rollButton.disabled = false;
            return;
        }

        currentQuestion = { ...levelQuestions[boxId - 1], boxId: boxId };
        displayQuestionModal();
    }

    // === LOGIKA MODAL PERTANYAAN ===
    function displayQuestionModal() {
        if (!currentQuestion || !currentQuestion.options) {
            console.error("Kesalahan: Data pertanyaan atau opsi tidak ditemukan.");
            closeModal();
            return;
        }

        questionText.textContent = currentQuestion.question;
        optionsContainer.innerHTML = '';
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option;
            button.style.visibility = 'visible';
            button.addEventListener('click', () => checkAnswer(option));
            optionsContainer.appendChild(button);
        });
        resultText.textContent = '';
        nextButton.style.display = 'none';
        questionModal.style.display = 'flex';
        setTimeout(() => questionModal.classList.add('visible'), 10);
        startTimer();
    }

    function startTimer() {
        timerStartTime = Date.now();
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                timerBar.style.transition = `width ${TIME_LIMIT / 1000}s linear`;
                timerBar.style.width = '0%';
            });
        });

        timer = setTimeout(() => {
            checkAnswer(null);
        }, TIME_LIMIT);
    }

    // === FUNGSI BANTUAN ===
    function useFiftyFifty() {
        if (helpUsed.fiftyFifty) return;
        helpUsed.fiftyFifty = true;
        updateHelpButtons();

        const correctAnswer = currentQuestion.answer.toLowerCase();
        const incorrectOptions = [];
        document.querySelectorAll('#options-container .option-button').forEach(btn => {
            if (btn.textContent.toLowerCase() !== correctAnswer) {
                incorrectOptions.push(btn);
            }
        });

        incorrectOptions.sort(() => 0.5 - Math.random());
        incorrectOptions[0].style.visibility = 'hidden';
        incorrectOptions[1].style.visibility = 'hidden';
    }

    function useShowAnswer() {
        if (helpUsed.showAnswer) return;
        helpUsed.showAnswer = true;
        updateHelpButtons();
        checkAnswer(currentQuestion.answer);
    }

    function updateHelpButtons() {
        helpFiftyFiftyBtn.disabled = helpUsed.fiftyFifty;
        helpShowAnswerBtn.disabled = helpUsed.showAnswer;
    }
    
    function checkAnswer(selectedOption) {
        clearTimeout(timer);
        
        const isCorrect = selectedOption && selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();
        
        document.querySelectorAll('#options-container .option-button').forEach(btn => {
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
        } else {
            incorrectSound.currentTime = 0;
            incorrectSound.play();
            resultText.textContent = selectedOption === null ? 'Waktu Habis!' : 'Jawaban Salah!';
            resultText.className = 'incorrect';
            
            lives--;
            livesCount.textContent = lives;

            if (lives <= 0) {
                setTimeout(gameOver, 1500);
                return;
            }
        }

        setTimeout(() => {
            nextButton.removeEventListener('click', closeModal);
            nextButton.removeEventListener('click', nextLevel);
            nextButton.removeEventListener('click', levelComplete);

            const isLevelComplete = completedBoxes.every(status => status === true);
            const totalLevelsInCurrentCategory = questions[currentCategory] ? Object.keys(questions[currentCategory]).length : 0;
            
            if (isLevelComplete) {
                if (currentLevel < totalLevelsInCurrentCategory) {
                    nextButton.textContent = "Lanjutkan Level";
                    nextButton.addEventListener('click', nextLevel);
                } else {
                    nextButton.textContent = "Selesai";
                    nextButton.addEventListener('click', levelComplete);
                }
            } else {
                nextButton.textContent = "Lanjutkan";
                nextButton.addEventListener('click', closeModal);
            }
            
            nextButton.style.display = 'block';
        }, 1500);
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

    function nextLevel() {
        levelUpSound.currentTime = 0;
        levelUpSound.play();
        const totalLevelsInCurrentCategory = questions[currentCategory] ? Object.keys(questions[currentCategory]).length : 0;
        if (currentLevel < totalLevelsInCurrentCategory) {
            if (unlockedLevels[currentCategory] <= currentLevel) {
                unlockedLevels[currentCategory] = currentLevel + 1;
                saveProgress();
            }
            closeModal();
            setTimeout(() => startGame(currentLevel + 1), 350);
        }
    }

    function levelComplete() {
        levelUpSound.currentTime = 0;
        levelUpSound.play();
        infoText.textContent = `Selamat! Anda telah menyelesaikan semua level di kategori ini! 🎉`;
        rollButton.disabled = true;
        closeModal();
        setTimeout(() => showCategorySelectScreen(), 3000);
    }

    function gameOver() {
        questionModal.classList.remove('visible');
        setTimeout(() => {
            questionModal.style.display = 'none';
        }, 300);

        infoText.textContent = 'GAME OVER! Nyawa habis. 💔';
        rollButton.disabled = true;
        document.querySelectorAll('.mystery-box:not(.completed)').forEach(box => {
            box.style.cursor = 'not-allowed';
            box.style.background = '#bdbdbd';
        });

        setTimeout(() => {
            showLevelSelectScreen(currentCategory);
        }, 3000);
    }
    
    // === EVENT LISTENERS ===
    startButton.addEventListener('click', showCategorySelectScreen);
    backToCategoryButton.addEventListener('click', showCategorySelectScreen);
    backToMapButton.addEventListener('click', () => {
        clearTimeout(timer);
        showLevelSelectScreen(currentCategory);
    });
    rollButton.addEventListener('click', rollDice);

    helpFiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    helpShowAnswerBtn.addEventListener('click', useShowAnswer);

    howToPlayButton.addEventListener('click', () => {
        howToPlayModal.classList.add('visible');
    });
    closeModalButton.addEventListener('click', () => {
        howToPlayModal.classList.remove('visible');
    });
    howToPlayModal.addEventListener('click', (event) => {
        if (event.target === howToPlayModal) {
            howToPlayModal.classList.remove('visible');
        }
    });

    initGame();
});