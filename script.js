document.addEventListener('DOMContentLoaded', () => {
    // Mengambil elemen-elemen dari HTML
    const rollButton = document.getElementById('roll-button');
    const diceImg = document.getElementById('dice-img');
    const questionArea = document.getElementById('question-area');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultText = document.getElementById('result-text');

    let currentQuestion;
    let questions = {};
    let availableQuestions = {};

    const ANIMATION_DURATION = 700;

    // --- FUNGSI UTAMA ---

    // 1. Memuat soal dari file JSON
    async function loadQuestions() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            questions = await response.json();
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

    // 3. Menampilkan soal dan membuat tombol pilihan ganda
    function displayQuestion(diceNumber) {
        if (!availableQuestions[diceNumber] || availableQuestions[diceNumber].length === 0) {
            availableQuestions[diceNumber] = [...questions[diceNumber]];
        }
        
        const questionList = availableQuestions[diceNumber];
        const randomIndex = Math.floor(Math.random() * questionList.length);
        currentQuestion = questionList.splice(randomIndex, 1)[0];

        questionText.textContent = currentQuestion.question;
        
        // Kosongkan wadah pilihan ganda sebelum diisi
        optionsContainer.innerHTML = ''; 

        // Acak urutan pilihan jawaban untuk variasi
        const shuffledOptions = currentQuestion.options.sort(() => Math.random() - 0.5);

        // Buat tombol untuk setiap pilihan jawaban
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkAnswer(option, button));
            optionsContainer.appendChild(button);
        });

        questionArea.style.display = 'block';
    }

    // 4. Memeriksa jawaban yang dipilih pengguna
    function checkAnswer(selectedOption, selectedButton) {
        const isCorrect = selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();

        // Nonaktifkan semua tombol pilihan ganda
        const allOptionButtons = optionsContainer.querySelectorAll('.option-button');
        allOptionButtons.forEach(btn => {
            btn.disabled = true;
            // Tandai jawaban yang benar dengan warna hijau
            if (btn.textContent.toLowerCase() === currentQuestion.answer.toLowerCase()) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            resultText.textContent = 'Jawaban Anda benar! 🎉';
            resultText.className = 'correct';
        } else {
            // Jika salah, tandai pilihan pengguna yang salah dengan warna merah
            selectedButton.classList.add('incorrect');
            resultText.textContent = 'Jawaban Anda salah.';
            resultText.className = 'incorrect';
        }

        // Aktifkan kembali tombol kocok setelah jeda singkat
        setTimeout(() => {
            rollButton.disabled = false;
        }, 2000); // Jeda 2 detik sebelum bisa main lagi
    }

    // --- EVENT LISTENERS ---
    rollButton.disabled = true;
    loadQuestions();
    rollButton.addEventListener('click', rollDice);
});
