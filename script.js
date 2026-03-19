// --- MOCK DATA ---
const demoUsers = [
    {
        id: 1,
        name: "Sophia Miller",
        age: 21,
        bio: "Art lover and coffee addict. Let's explore the city!",
        image: "image/44704802-beautiful-asian-girl.jpg",
        willMatch: true
    },
    {
        id: 2,
        name: "Emma Wilson",
        age: 23,
        bio: "Traveler 🌍 | Yoga enthusiast 🧘‍♀️",
        image: "image/Beautiful-Chinese-Girl-1.jpg.webp",
        willMatch: false
    },
    {
        id: 3,
        name: "Olivia Brown",
        age: 22,
        bio: "Music is my life. Guitarist searching for a duet.",
        image: "image/images.jfif",
        willMatch: true
    },
    {
        id: 4,
        name: "Isabella Garcia",
        age: 20,
        bio: "Foodie looking for the best burger in town. 🍔",
        image: "image/images (1).jfif",
        willMatch: false
    },
    {
        id: 5,
        name: "Mia Martinez",
        age: 24,
        bio: "Tech geek and gamer girl. Can you beat me at Mario Kart?",
        image: "image/images (2).jfif",
        willMatch: true
    },
    {
        id: 6,
        name: "Amelia Davis",
        age: 19,
        bio: "Student. Dreamer. Loves sunsets and long walks.",
        image: "image/portrait-of-a-beautiful-african-american-teen-girl-posing-on-a-stone-wall.jpg",
        willMatch: false
    },
    {
        id: 7,
        name: "Charlotte Rodriguez",
        age: 25,
        bio: "Fitness trainer. Let's stay active together!",
        image: "image/preview16.jpg",
        willMatch: false
    }
];

// --- STATE MANAGEMENT ---
let currentUser = null;
let matches = [];
let currentCardIndex = 0;
let likedUsers = [];

// DOM Elements
const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
const loader = document.getElementById('loader');

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkLocalStorage();
    initAppEvents();
});

function showScreen(screenId) {
    loader.style.display = 'flex';
    setTimeout(() => {
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');

        // Handle Nav Visibility
        const mainNav = document.getElementById('main-nav');
        if (['swipe-screen', 'matches-screen', 'profile-tab-screen'].includes(screenId)) {
            mainNav.style.display = 'flex';
        } else {
            mainNav.style.display = 'none';
        }

        // Update Nav Active State
        navItems.forEach(nav => {
            if (nav.dataset.screen === screenId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        loader.style.display = 'none';
    }, 400);
}

function checkLocalStorage() {
    const savedProfile = localStorage.getItem('heartHub_profile');
    if (savedProfile) {
        currentUser = JSON.parse(savedProfile);
        updateProfileTab();
        showScreen('swipe-screen');
        renderCards();
    } else {
        showScreen('auth-screen');
    }
}

// --- EVENTS ---
function initAppEvents() {
    // Auth Step
    document.getElementById('start-btn').addEventListener('click', () => showScreen('setup-screen'));

    // Save Profile
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);

    // Profile Pic Preview
    document.getElementById('profile-input').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('profile-preview').src = e.target.result;
                document.getElementById('profile-preview').style.display = 'block';
                document.getElementById('camera-icon').style.display = 'none';
            }
            reader.readAsDataURL(file);
        }
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            showScreen(item.dataset.screen);
        });
    });

    // Chat events
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('back-to-matches').addEventListener('click', () => showScreen('matches-screen'));
    document.getElementById('close-match-btn').addEventListener('click', () => {
        document.getElementById('match-modal').style.display = 'none';
        document.getElementById('match-modal').style.opacity = '0';
    });

    document.getElementById('start-chat-btn').addEventListener('click', () => {
        document.getElementById('match-modal').style.display = 'none';
        const lastMatch = matches[matches.length - 1];
        openChat(lastMatch);
    });

    document.getElementById('matches-shortcut').addEventListener('click', () => showScreen('matches-screen'));

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('heartHub_profile');
        location.reload();
    });
}

// --- PROFILE LOGIC ---
function saveProfile() {
    const name = document.getElementById('user-name').value;
    const age = document.getElementById('user-age').value;
    const bio = document.getElementById('user-bio').value;
    const gender = document.getElementById('user-gender').value;
    const interest = document.getElementById('user-interest').value;
    const profilePic = document.getElementById('profile-preview').src;

    if (!name || !age || !bio) {
        alert("Please fill in all fields!");
        return;
    }

    currentUser = {
        name,
        age,
        bio,
        gender,
        interest,
        image: profilePic || "https://via.placeholder.com/150"
    };

    localStorage.setItem('heartHub_profile', JSON.stringify(currentUser));
    updateProfileTab();
    renderCards();
    showScreen('swipe-screen');
}

function updateProfileTab() {
    document.getElementById('tab-profile-pic').src = currentUser.image;
    document.getElementById('tab-profile-name').innerText = `${currentUser.name}, ${currentUser.age}`;
    document.getElementById('tab-profile-bio').innerText = currentUser.bio;
}

// --- SWIPE LOGIC ---
function renderCards() {
    const deck = document.getElementById('card-deck');
    deck.innerHTML = '';

    // Reverse so the first one appears on top
    [...demoUsers].reverse().forEach((user, index) => {
        const card = document.createElement('div');
        card.className = 'tinder-card';
        card.id = `card-${user.id}`;
        card.style.zIndex = index;

        card.innerHTML = `
            <img src="${user.image}" alt="${user.name}">
            <div class="badge like">LIKE</div>
            <div class="badge dislike">NOPE</div>
            <div class="card-info">
                <h2>${user.name}, ${user.age}</h2>
                <p><i class="fas fa-map-marker-alt"></i> 2 miles away</p>
                <p style="margin-top: 5px;">${user.bio}</p>
            </div>
        `;

        deck.appendChild(card);
        initDrag(card, user);
    });
}

function initDrag(el, user) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const onStart = (e) => {
        startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        isDragging = true;
        el.style.transition = 'none';
    };

    const onMove = (e) => {
        if (!isDragging) return;
        currentX = (e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - startX;

        const rotate = currentX / 10;
        el.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

        // Badges
        const likeBadge = el.querySelector('.badge.like');
        const dislikeBadge = el.querySelector('.badge.dislike');

        if (currentX > 50) {
            likeBadge.style.opacity = Math.min(currentX / 150, 1);
            dislikeBadge.style.opacity = 0;
        } else if (currentX < -50) {
            dislikeBadge.style.opacity = Math.min(Math.abs(currentX) / 150, 1);
            likeBadge.style.opacity = 0;
        } else {
            likeBadge.style.opacity = 0;
            dislikeBadge.style.opacity = 0;
        }
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        el.style.transition = 'transform 0.5s ease-out';

        if (currentX > 150) {
            swipe(el, 'right', user);
        } else if (currentX < -150) {
            swipe(el, 'left', user);
        } else {
            el.style.transform = '';
            el.querySelectorAll('.badge').forEach(b => b.style.opacity = 0);
        }
    };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
}

function swipe(el, direction, user) {
    const moveX = direction === 'right' ? 1000 : -1000;
    const rotate = direction === 'right' ? 20 : -20;

    el.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;

    setTimeout(() => {
        el.remove();
        if (direction === 'right') {
            handleLike(user);
        }
    }, 300);
}

// Button controls for swipe
function swipeLeft() {
    const cards = document.querySelectorAll('.tinder-card');
    if (cards.length === 0) return;
    const topCard = cards[cards.length - 1];
    const user = demoUsers.find(u => `card-${u.id}` === topCard.id);
    swipe(topCard, 'left', user);
}

function swipeRight() {
    const cards = document.querySelectorAll('.tinder-card');
    if (cards.length === 0) return;
    const topCard = cards[cards.length - 1];
    const user = demoUsers.find(u => `card-${u.id}` === topCard.id);
    // Show like badge briefly before sliding
    topCard.querySelector('.badge.like').style.opacity = 1;
    swipe(topCard, 'right', user);
}

function handleLike(user) {
    likedUsers.push(user);
    if (user.willMatch) {
        setTimeout(() => showMatchModal(user), 500);
    }
}

// --- MATCH LOGIC ---
function showMatchModal(user) {
    matches.push(user);
    updateMatchUI();

    const modal = document.getElementById('match-modal');
    document.getElementById('match-my-pic').src = currentUser.image;
    document.getElementById('match-their-pic').src = user.image;
    document.getElementById('match-text').innerText = `You and ${user.name} have liked each other!`;

    modal.style.display = 'flex';
    setTimeout(() => modal.style.opacity = '1', 10);
}

function updateMatchUI() {
    document.getElementById('match-count').innerText = matches.length;
    const container = document.getElementById('matches-container');
    container.innerHTML = '';

    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'match-card glass-panel';
        div.innerHTML = `
            <img src="${match.image}" alt="${match.name}">
            <div class="name-overlay">${match.name}</div>
        `;
        div.onclick = () => openChat(match);
        container.appendChild(div);
    });
}

// --- CHAT LOGIC ---
let activeChatPartner = null;

function openChat(user) {
    activeChatPartner = user;
    document.getElementById('chat-user-pic').src = user.image;
    document.getElementById('chat-user-name').innerText = user.name;
    document.getElementById('chat-container').innerHTML = '';

    // Initial received message
    addMessage("Hey! I'm glad we matched! ☺️", 'received');

    showScreen('chat-screen');
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'sent');
    input.value = '';

    // Auto reply
    setTimeout(() => {
        const replies = [
            "That's so interesting!",
            "Haha, I totally agree.",
            "Tell me more about yourself!",
            "I'm actually free this weekend, how about you?",
            "Do you like sushi? 🍣"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        addMessage(randomReply, 'received');
    }, 1500);
}

function addMessage(text, type) {
    const container = document.getElementById('chat-container');
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerText = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}
