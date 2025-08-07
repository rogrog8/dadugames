
// Mengambil elemen-elemen dari HTML (bagian ini sama)
const rollButton = document.getElementById('roll-button');
const diceImg = document.getElementById('dice-img');
const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const resultText = document.getElementById('result-text');
const questionArea = document.getElementById('question-area');

let currentDiceResult;
let currentQuestion;
let questions = {}; // Variabel untuk menyimpan data soal dari JSON

// Fungsi untuk memuat data dari file JSON
async function loadQuestions() {
    try {
        const response = await fetch('database.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questions = await response.json();
    } catch (error) {
        console.error("Gagal memuat soal:", error);
        alert("Gagal memuat soal. Silakan coba muat ulang halaman.");
    }
}

// Fungsi untuk mengocok dadu
function rollDice() {
    const result = Math.floor(Math.random() * 6) + 1;
    currentDiceResult = result;
    diceImg.src = `images/dice-${result}.png`;

    displayQuestion(result);
}

// Fungsi untuk menampilkan soal berdasarkan angka dadu
function displayQuestion(diceNumber) {
    const questionList = questions[diceNumber];
    if (questionList && questionList.length > 0) {
        const randomIndex = Math.floor(Math.random() * questionList.length);
        currentQuestion = questionList[randomIndex];
        questionText.textContent = currentQuestion.question;

        questionArea.style.display = 'block';
        resultText.textContent = '';
        answerInput.value = '';
    } else {
        questionText.textContent = "Tidak ada soal untuk nomor ini.";
    }
}

// Fungsi untuk memeriksa jawaban
function checkAnswer() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();

    if (userAnswer === correctAnswer) {
        resultText.textContent = 'Jawaban Anda benar!';
        resultText.className = 'correct';
    } else {
        resultText.textContent = `Jawaban salah. Jawaban yang benar adalah "${currentQuestion.answer}".`;
        resultText.className = 'incorrect';
    }
}

// Memanggil fungsi untuk memuat soal saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions().then(() => {
        // Setelah soal dimuat, tambahkan event listener ke tombol
        rollButton.addEventListener('click', rollDice);
        submitButton.addEventListener('click', checkAnswer);
    });
});