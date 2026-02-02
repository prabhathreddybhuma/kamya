
// State
gsap.registerPlugin(TextPlugin);
let currentIndex = 0;
const savedProgress = localStorage.getItem('loveLetterProgress');
if (savedProgress) {
    currentIndex = parseInt(savedProgress, 10);
}

// Audio
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon-svg');
let isMusicPlaying = false;

// Elements
const landingSection = document.getElementById('landing');
const gameSection = document.getElementById('game-section');
const letterSection = document.getElementById('letter-section');
const finalSection = document.getElementById('final-section');

const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-answer');
const nextBtn = document.getElementById('next-memory-btn');
const restartBtn = document.getElementById('restart-btn');

const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const errorMsg = document.getElementById('error-msg');
const letterText = document.getElementById('letter-text');
const finalMessage = document.getElementById('final-message-text');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // If progress exists but we are done, maybe reset or go to final?
    // For now, let's just start at landing, but if they click begin we jump if saved.
});

// Music Control
musicToggle.addEventListener('click', () => {
    if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
        musicToggle.style.opacity = '0.5';
    } else {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggle.style.opacity = '1';
            // Fade in volume
            bgMusic.volume = 0;
            gsap.to(bgMusic, { volume: 0.5, duration: 2 });
        }).catch(e => console.log("Audio play failed", e));
    }
});

// Navigation Flow
startBtn.addEventListener('click', () => {
    // Attempt to play music if not already playing
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggle.style.opacity = '1';
            bgMusic.volume = 0.5;
        }).catch(e => console.log("Auto-play on start failed", e));
    }

    gsap.to(landingSection, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            landingSection.classList.add('hidden');
            landingSection.classList.remove('active-section');

            // Check if we are already at the end
            if (currentIndex >= MEMORIES.length) {
                showFinalSection();
            } else {
                loadMemory(currentIndex);
            }
        }
    });
});

function loadMemory(index) {
    // Reset State
    answerInput.value = '';
    errorMsg.style.opacity = '0';

    // Set Content - Clear first for typing effect
    questionText.innerText = "";

    // Set Input Type
    if (MEMORIES[index].type === 'date') {
        answerInput.type = 'date';
        answerInput.style.width = 'auto'; // Let date picker size itself
    } else {
        answerInput.type = 'text';
        answerInput.style.width = '250px';
    }

    // Show Game Section
    gameSection.classList.remove('hidden');
    gameSection.classList.add('active-section');

    // RESET Opacity explicitly because GSAP might have set it to 0
    gsap.set(gameSection, { opacity: 1 });

    // Animate In Card
    gsap.fromTo(gameSection.querySelector('.memory-card'),
        { y: 50, opacity: 0 },
        {
            y: 0, opacity: 1, duration: 1, ease: "power2.out", onComplete: () => {
                // Typewriter effect for question
                gsap.to(questionText, {
                    duration: 1.5,
                    text: MEMORIES[index].question,
                    ease: "none"
                });
            }
        }
    );
}

submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

function checkAnswer() {
    const userAns = answerInput.value.trim().toLowerCase();
    const validAnswers = MEMORIES[currentIndex].answers.map(a => a.toLowerCase());

    // Date comparison needs care if formats differ, but we enforced YYYY-MM-DD in memories.
    // HTML date input returns YYYY-MM-DD.

    if (validAnswers.includes('*') || validAnswers.includes(userAns)) {
        // Correct
        answerInput.classList.add('success-glow');
        submitBtn.innerHTML = "Opening...";

        // Gentle delay to let the user see the glow
        setTimeout(() => {
            showLetter();
            // Reset for next time (though we reload/clear inputs anyway)
            setTimeout(() => {
                answerInput.classList.remove('success-glow');
                submitBtn.innerHTML = "Unlock";
            }, 1000);
        }, 1000);
    } else {
        // Wrong
        showError();
    }
}

function showError() {
    errorMsg.style.opacity = '1';
    gsap.fromTo(gameSection.querySelector('.input-group'),
        { x: -10 },
        { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: "power1.inOut", onComplete: () => gsap.to(gameSection.querySelector('.input-group'), { x: 0 }) }
    );
}

function showLetter() {
    // Transition Game -> Letter
    gsap.to(gameSection, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            gameSection.classList.add('hidden');
            gameSection.classList.remove('active-section');

            letterSection.classList.remove('hidden');
            letterSection.classList.add('active-section');

            // Inject Content - Disabled as per request (Image Only)
            // letterText.innerHTML = MEMORIES[currentIndex].letterContent;
            letterText.innerHTML = ""; // Clear it just in case

            // Set Image
            const memoryImg = document.getElementById('memory-img');
            const memoryImgContainer = document.querySelector('.memory-image-container');

            if (MEMORIES[currentIndex].image) {
                memoryImg.src = MEMORIES[currentIndex].image;
                memoryImgContainer.style.display = 'flex';

                // Animate Image In
                gsap.fromTo(memoryImgContainer,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.5,
                        ease: "power3.out",
                        delay: 0.5
                    }
                );
            } else {
                memoryImgContainer.style.display = 'none';
            }

            // Animate Letter Content (Container)
            gsap.fromTo(letterSection, { opacity: 0 }, { opacity: 1, duration: 1 });

            /* Stagger reveal paragraphs - DISABLED
            gsap.fromTo("#letter-text p", 
                { y: 20, opacity: 0, filter: "blur(10px)" },
                { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.5, stagger: 0.5, ease: "power2.out" }
            ); 
            */

            // Reveal Next Button slowly (Reduced delay since text is gone)
            gsap.fromTo(nextBtn,
                { opacity: 0, y: 10, pointerEvents: 'none' },
                { opacity: 1, y: 0, pointerEvents: 'all', duration: 1, delay: 0.5, ease: "power2.out" }
            );

            // Pulse music volume
            if (isMusicPlaying) {
                gsap.to(bgMusic, { volume: 0.8, duration: 2, yoyo: true, repeat: 1 });
            }
        }
    });
}

nextBtn.addEventListener('click', () => {
    // Fade out letter section AND image container explicitely
    const memoryImgContainer = document.querySelector('.memory-image-container');

    gsap.to([letterSection, memoryImgContainer], {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            letterSection.classList.add('hidden');
            letterSection.classList.remove('active-section');
            if (memoryImgContainer) memoryImgContainer.style.display = 'none'; // Hide it so it doesn't block clicks

            currentIndex++;
            localStorage.setItem('loveLetterProgress', currentIndex);

            if (currentIndex < MEMORIES.length) {
                loadMemory(currentIndex);
            } else {
                showFinalSection();
            }
        }
    });
});

function showFinalSection() {
    finalSection.classList.remove('hidden');
    finalSection.classList.add('active-section');

    // Keep playing the same background music
    // (Script previously tried to switch to a missing file 'letter-song.mp3')
    if (bgMusic && isMusicPlaying) {
        gsap.to(bgMusic, { volume: 0.8, duration: 2 });
    }

    finalMessage.innerHTML = FINAL_CONTENT;

    gsap.fromTo(finalSection,
        { opacity: 0 },
        { opacity: 1, duration: 2 }
    );

    gsap.fromTo(".final-title",
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 2, ease: "power3.out" }
    );

    gsap.fromTo("#final-message-text p",
        { opacity: 0, filter: "blur(5px)" },
        {
            opacity: 1,
            filter: "blur(0px)",
            duration: 2.5,
            stagger: 2, /* Long stagger to allow reading time */
            delay: 1.5,
            ease: "power2.inOut"
        }
    );
}

restartBtn.addEventListener('click', () => {
    localStorage.removeItem('loveLetterProgress');
    currentIndex = 0;
    location.reload();
});
