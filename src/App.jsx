import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, MessageSquare, User, LogOut, Camera, Send, ChevronLeft, Zap } from 'lucide-react';
import { demoUsers } from './data';

const App = () => {
    const [screen, setScreen] = useState('auth');
    const [currentUser, setCurrentUser] = useState(null);
    const [matches, setMatches] = useState([]);
    const [likedUsers, setLikedUsers] = useState([]);
    const [cards, setCards] = useState([...demoUsers]);
    const [matchModalUser, setMatchModalUser] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('heartHub_profile');
        if (saved) {
            setCurrentUser(JSON.parse(saved));
            setScreen('swipe');
        }
    }, []);

    const changeScreen = (newScreen) => {
        setLoading(true);
        setTimeout(() => {
            setScreen(newScreen);
            setLoading(false);
        }, 400);
    };

    const handleLogout = () => {
        localStorage.removeItem('heartHub_profile');
        window.location.reload();
    };

    const onSwipe = (direction, user) => {
        setCards(prev => prev.filter(c => c.id !== user.id));
        if (direction === 'right') {
            setLikedUsers(prev => [...prev, user]);
            if (user.willMatch) {
                setTimeout(() => setMatchModalUser(user), 500);
            }
        }
    };

    const handleStartChat = (user) => {
        setMatchModalUser(null);
        setActiveChat(user);
        setMessages([{ text: "Hey! I'm glad we matched! ☺️", type: 'received' }]);
        setScreen('chat');
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {loading && <Loader />}
            
            <AnimatePresence mode="wait">
                {screen === 'auth' && <AuthScreen onStart={() => changeScreen('setup')} key="auth" />}
                {screen === 'setup' && <SetupScreen onComplete={(profile) => {
                    setCurrentUser(profile);
                    localStorage.setItem('heartHub_profile', JSON.stringify(profile));
                    changeScreen('swipe');
                }} key="setup" />}
                {screen === 'swipe' && <SwipeScreen cards={cards} onSwipe={onSwipe} key="swipe" />}
                {screen === 'matches' && <MatchesScreen matches={matches} onOpenChat={(m) => {
                    setActiveChat(m);
                    setMessages([{ text: "Hey! I'm glad we matched! ☺️", type: 'received' }]);
                    changeScreen('chat');
                }} key="matches" />}
                {screen === 'profile' && <ProfileScreen user={currentUser} onLogout={handleLogout} key="profile" />}
                {screen === 'chat' && <ChatScreen partner={activeChat} messages={messages} setMessages={setMessages} onBack={() => changeScreen('matches')} key="chat" />}
            </AnimatePresence>

            {['swipe', 'matches', 'profile'].includes(screen) && (
                <Navbar active={screen} setScreen={changeScreen} />
            )}

            {matchModalUser && (
                <MatchModal 
                    user={matchModalUser} 
                    myPic={currentUser?.image} 
                    onClose={() => {
                        setMatches(prev => [...prev, matchModalUser]);
                        setMatchModalUser(null);
                    }}
                    onChat={() => {
                        setMatches(prev => [...prev, matchModalUser]);
                        handleStartChat(matchModalUser);
                    }}
                />
            )}
        </div>
    );
};

/* --- COMPONENTS --- */

const Loader = () => (
    <div id="loader" style={{ display: 'flex' }}>
        <div className="spinner"></div>
    </div>
);

const AuthScreen = ({ onStart }) => (
    <motion.section 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="screen" id="auth-screen"
    >
        <div className="logo-container">
            <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="logo-heart"
            >
                <Heart size={80} fill="#ff2e63" />
            </motion.div>
            <h1 className="app-name">HeartHub</h1>
            <p>"Find Your Perfect Match"</p>
        </div>
        <button className="btn-primary" onClick={onStart}>Create Profile</button>
    </motion.section>
);

const SetupScreen = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState(24);
    const [bio, setBio] = useState('');
    const [image, setImage] = useState('');

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <motion.section 
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            className="screen" id="setup-screen"
        >
            <div className="setup-container glass-panel">
                <h2>About You</h2>
                <div className="img-upload-container" onClick={() => document.getElementById('pic-in').click()}>
                    {image ? <img id="profile-preview" src={image} /> : <Camera size={40} color="#666" />}
                    <input type="file" id="pic-in" hidden onChange={handleFile} />
                </div>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Age</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Short Bio</label>
                    <textarea rows="3" placeholder="Tell us something..." value={bio} onChange={e => setBio(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={() => onComplete({ name, age, bio, image })}>Get Started</button>
            </div>
        </motion.section>
    );
};

const SwipeScreen = ({ cards, onSwipe }) => {
    return (
        <motion.section 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="screen" id="swipe-screen"
        >
            <div className="card-container">
                <AnimatePresence>
                    {cards.length > 0 ? (
                        cards.map((user, i) => (
                            <TinderCard key={user.id} user={user} onSwipe={onSwipe} />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '100px' }}>
                            <p>No more profiles to show!</p>
                            <User size={64} color="var(--primary)" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <div className="swipe-actions">
                <button className="action-btn dislike"><X size={32} /></button>
                <button className="action-btn heart"><Heart size={40} fill="var(--primary)"/></button>
                <button className="action-btn like"><Zap size={32} /></button>
            </div>
        </motion.section>
    );
};

const TinderCard = ({ user, onSwipe }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-150, 150], [-15, 15]);
    const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 100], [0, 1]);
    const dislikeOpacity = useTransform(x, [-100, -50], [1, 0]);

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 150) {
            onSwipe('right', user);
        } else if (info.offset.x < -150) {
            onSwipe('left', user);
        }
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate, opacity }}
            onDragEnd={handleDragEnd}
            className="tinder-card"
            whileGrab={{ scale: 1.05 }}
        >
            <img src={user.image} alt={user.name} />
            <motion.div className="badge like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
            <motion.div className="badge dislike" style={{ opacity: dislikeOpacity }}>NOPE</motion.div>
            <div className="card-info">
                <h2>{user.name}, {user.age}</h2>
                <p>{user.bio}</p>
            </div>
        </motion.div>
    );
};

const MatchesScreen = ({ matches, onOpenChat }) => (
    <motion.section 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
        className="screen" id="matches-screen"
    >
        <h2>Your Matches <span style={{ color: 'var(--primary)' }}>{matches.length}</span></h2>
        <div className="matches-grid">
            {matches.map(match => (
                <div className="match-card glass-panel" key={match.id} onClick={() => onOpenChat(match)}>
                    <img src={match.image} alt={match.name} />
                    <div className="name-overlay">{match.name}</div>
                </div>
            ))}
        </div>
    </motion.section>
);

const ProfileScreen = ({ user, onLogout }) => (
    <motion.section 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
        className="screen" id="profile-tab-screen"
    >
        <img className="profile-avatar-large" src={user?.image || 'https://via.placeholder.com/150'} alt="Me" />
        <h2>{user?.name}, {user?.age}</h2>
        <p>{user?.bio}</p>
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            <button className="btn-secondary"><User size={18} /> Edit Profile</button>
            <button className="btn-secondary" style={{ color: '#ff4b2b' }} onClick={onLogout}><LogOut size={18} /> Logout</button>
        </div>
    </motion.section>
);

const ChatScreen = ({ partner, messages, setMessages, onBack }) => {
    const [input, setInput] = useState('');

    const send = () => {
        if (!input.trim()) return;
        const newMsg = { text: input, type: 'sent' };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        
        // Auto reply
        setTimeout(() => {
            const replies = ["That looks cool!", "I agree!", "Nice!", "When should we meet?"];
            const r = replies[Math.floor(Math.random() * replies.length)];
            setMessages(prev => [...prev, { text: r, type: 'received' }]);
        }, 1000);
    };

    return (
        <motion.section 
            initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
            className="screen" id="chat-screen"
        >
            <div className="chat-header">
                <button className="btn-secondary" style={{ border: 'none' }} onClick={onBack}><ChevronLeft /></button>
                <img src={partner?.image} />
                <h3>{partner?.name}</h3>
            </div>
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.type}`}>{m.text}</div>
                ))}
            </div>
            <div className="chat-input-area glass-panel">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key==='Enter' && send()} placeholder="Type a message..." />
                <button className="btn-primary" style={{ padding: '10px' }} onClick={send}><Send size={20} /></button>
            </div>
        </motion.section>
    );
};

const Navbar = ({ active, setScreen }) => (
    <nav className="app-nav glass-panel">
        <div className={`nav-item ${active === 'swipe' ? 'active' : ''}`} onClick={() => setScreen('swipe')}><Heart /></div>
        <div className={`nav-item ${active === 'matches' ? 'active' : ''}`} onClick={() => setScreen('matches')}><MessageSquare /></div>
        <div className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => setScreen('profile')}><User /></div>
    </nav>
);

const MatchModal = ({ user, myPic, onClose, onChat }) => (
    <div className="modal-overlay">
        <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="modal-content glass-panel"
        >
            <h1 className="match-title">It's a Match!</h1>
            <div className="match-pics">
                <img src={myPic} alt="Me" />
                <img src={user.image} alt="Them" />
            </div>
            <p style={{ marginBottom: '30px' }}>You and {user.name} have liked each other!</p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onChat}>Start Chat</button>
            <button className="btn-secondary" style={{ width: '100%', marginTop: '15px' }} onClick={onClose}>Keep Swiping</button>
        </motion.div>
    </div>
);

export default App;
