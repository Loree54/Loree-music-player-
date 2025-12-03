// script.js
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.volume = 0.8;
        this.queue = [];
        this.playlists = {};
        this.favorites = new Set();
        this.currentPlaylist = 'default';
        this.equalizerBands = Array(10).fill(0); // 10-band equalizer
        this.isVideoMode = false;
        this.youtubePlayer = null;
        
        this.init();
    }

    init() {
        this.setupDOMReferences();
        this.setupEventListeners();
        this.loadInitialData();
        this.setupEqualizer();
        this.setupYouTubeAPI();
        
        // Sample data for demo
        this.loadSampleData();
    }

    setupDOMReferences() {
        // Player controls
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.getElementById('progressBar');
        this.progress = document.getElementById('progress');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        
        // Views
        this.views = document.querySelectorAll('.view');
        this.navItems = document.querySelectorAll('.nav-menu li');
        
        // Song info
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        this.songAlbum = document.getElementById('songAlbum');
        this.albumArt = document.getElementById('albumArt');
        this.nowPlayingTitle = document.getElementById('nowPlayingTitle');
        this.nowPlayingArtist = document.getElementById('nowPlayingArtist');
        this.nowPlayingArt = document.getElementById('nowPlayingArt');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        
        // Mode toggle
        this.audioModeBtn = document.getElementById('audioMode');
        this.videoModeBtn = document.getElementById('videoMode');
        
        // Search
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        
        // Video player
        this.videoPlayer = document.getElementById('videoPlayer');
        this.closeVideo = document.getElementById('closeVideo');
        
        // Equalizer
        this.equalizerBtn = document.getElementById('equalizerBtn');
        
        // Lyrics
        this.lyricsContainer = document.getElementById('lyricsContainer');
        
        // Like buttons
        this.likeBtn = document.getElementById('likeBtn');
        this.miniLikeBtn = document.getElementById('miniLikeBtn');
        
        // Queue
        this.queueList = document.getElementById('queueList');
        
        // Playlist
        this.playlistContainer = document.getElementById('playlistContainer');
        this.currentPlaylistEl = document.getElementById('currentPlaylist');
    }

    setupEventListeners() {
        // Playback controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prevTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.changeRepeatMode());
        
        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        
        // Volume
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Mode toggle
        this.audioModeBtn.addEventListener('click', () => this.setMode('audio'));
        this.videoModeBtn.addEventListener('click', () => this.setMode('video'));
        
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });
        
        // Search
        this.searchInput.addEventListener('input', (e) => this.searchTracks(e.target.value));
        
        // Video player
        this.closeVideo.addEventListener('click', () => this.closeVideoPlayer());
        
        // Equalizer
        this.equalizerBtn.addEventListener('click', () => this.showEqualizer());
        
        // Like buttons
        this.likeBtn.addEventListener('click', () => this.toggleLike());
        this.miniLikeBtn.addEventListener('click', () => this.toggleLike());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLibraryTab(e.target.dataset.tab));
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyEqualizerPreset(e.target.dataset.preset));
        });
    }

    loadSampleData() {
        // Sample tracks
        this.tracks = [
            {
                id: 1,
                title: "Blinding Lights",
                artist: "The Weeknd",
                album: "After Hours",
                duration: 200,
                url: "sample1.mp3",
                artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
                youtubeId: "4NRXx6U8ABQ"
            },
            {
                id: 2,
                title: "Stay",
                artist: "The Kid LAROI, Justin Bieber",
                album: "F*CK LOVE 3",
                duration: 141,
                url: "sample2.mp3",
                artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
                youtubeId: "kTJczUoc26U"
            },
            {
                id: 3,
                title: "Heat Waves",
                artist: "Glass Animals",
                album: "Dreamland",
                duration: 238,
                url: "sample3.mp3",
                artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w-300",
                youtubeId: "mRD0-GxqHVo"
            }
        ];
        
        this.queue = [...this.tracks];
        this.updateQueueDisplay();
        this.updatePlaylistDisplay();
    }

    loadTrack(track) {
        if (this.isVideoMode && track.youtubeId) {
            this.playYouTubeVideo(track.youtubeId);
            return;
        }
        
        this.audio.src = track.url;
        this.audio.load();
        
        this.songTitle.textContent = track.title;
        this.songArtist.textContent = track.artist;
        this.songAlbum.textContent = track.album;
        
        this.nowPlayingTitle.textContent = track.title;
        this.nowPlayingArtist.textContent = track.artist;
        
        if (track.artwork) {
            this.albumArt.style.backgroundImage = `url(${track.artwork})`;
            this.albumArt.style.backgroundSize = 'cover';
            this.nowPlayingArt.src = track.artwork;
        }
        
        this.updateLikeButton();
        this.startVinylAnimation();
        this.loadLyrics(track);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.queue.length === 0) return;
        
        if (!this.audio.src && this.queue[this.currentTrackIndex]) {
            this.loadTrack(this.queue[this.currentTrackIndex]);
        }
        
        if (this.isVideoMode && this.youtubePlayer) {
            this.youtubePlayer.playVideo();
        } else {
            this.audio.play();
        }
        
        this.isPlaying = true;
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        document.querySelector('.album-art-container').classList.add('playing');
    }

    pause() {
        if (this.isVideoMode && this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
        } else {
            this.audio.pause();
        }
        
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        document.querySelector('.album-art-container').classList.remove('playing');
    }

    prevTrack() {
        this.currentTrackIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.queue.length - 1;
        this.loadTrack(this.queue[this.currentTrackIndex]);
        if (this.isPlaying) this.play();
    }

    nextTrack() {
        this.currentTrackIndex = this.currentTrackIndex < this.queue.length - 1 ? this.currentTrackIndex + 1 : 0;
        this.loadTrack(this.queue[this.currentTrackIndex]);
        if (this.isPlaying) this.play();
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
        
        if (this.isShuffled) {
            this.shuffleQueue();
        }
    }

    shuffleQueue() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        this.updateQueueDisplay();
    }

    changeRepeatMode() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const icons = ['fa-redo', 'fa-redo-alt', 'fa-sync-alt'];
        this.repeatBtn.innerHTML = `<i class="fas ${icons[currentIndex]}"></i>`;
    }

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.volumeSlider.value = value * 100;
        
        // Update volume icon
        const volumeIcon = document.getElementById('volumeIcon');
        if (value === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (value < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * this.audio.duration;
        
        this.audio.currentTime = time;
        this.progress.style.width = `${percent * 100}%`;
        this.progressHandle.style.left = `${percent * 100}%`;
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        const percent = (currentTime / duration) * 100;
        
        this.progress.style.width = `${percent}%`;
        this.progressHandle.style.left = `${percent}%`;
        
        this.currentTimeEl.textContent = this.formatTime(currentTime);
        
        // Update YouTube player if in video mode
        if (this.isVideoMode && this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
            const ytTime = this.youtubePlayer.getCurrentTime();
            this.currentTimeEl.textContent = this.formatTime(ytTime);
        }
    }

    updateDuration() {
        const duration = this.audio.duration;
        this.durationEl.textContent = this.formatTime(duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    onTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else {
            this.nextTrack();
        }
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const icon = this.themeToggle.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    setMode(mode) {
        this.isVideoMode = mode === 'video';
        this.audioModeBtn.classList.toggle('active', mode === 'audio');
        this.videoModeBtn.classList.toggle('active', mode === 'video');
        
        if (mode === 'video' && this.queue[this.currentTrackIndex]?.youtubeId) {
            this.showVideoPlayer();
        }
    }

    showVideoPlayer() {
        this.videoPlayer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (this.youtubePlayer && this.queue[this.currentTrackIndex]?.youtubeId) {
            this.youtubePlayer.loadVideoById(this.queue[this.currentTrackIndex].youtubeId);
            if (this.isPlaying) {
                this.youtubePlayer.playVideo();
            }
        }
    }

    closeVideoPlayer() {
        this.videoPlayer.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        if (this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
        }
        
        // Switch back to audio mode if no video is playing
        this.setMode('audio');
    }

    setupYouTubeAPI() {
        // YouTube IFrame API callback
        window.onYouTubeIframeAPIReady = () => {
            this.youtubePlayer = new YT.Player('youtubePlayer', {
                height: '100%',
                width: '100%',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0
                },
                events: {
                    'onReady': (event) => this.onYouTubePlayerReady(event),
                    'onStateChange': (event) => this.onYouTubePlayerStateChange(event)
                }
            });
        };
    }

    onYouTubePlayerReady(event) {
        console.log('YouTube player ready');
    }

    onYouTubePlayerStateChange(event) {
        // YouTube player state changes
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else if (event.data === YT.PlayerState.ENDED) {
            this.onTrackEnd();
        }
    }

    playYouTubeVideo(videoId) {
        if (this.youtubePlayer) {
            this.youtubePlayer.loadVideoById(videoId);
            this.showVideoPlayer();
        }
    }

    switchView(viewName) {
        // Remove active class from all views and nav items
        this.views.forEach(view => view.classList.remove('active'));
        this.navItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to selected view and nav item
        const view = document.getElementById(`${viewName}View`);
        if (view) {
            view.classList.add('active');
        }
        
        // Update nav item
        const navItem = Array.from(this.navItems).find(item => 
            item.textContent.toLowerCase().includes(viewName.toLowerCase())
        );
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    searchTracks(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            return;
        }
        
        // Simulate search - in real app, this would search your library or YouTube API
        const results = this.tracks.filter(track =>
            track.title.toLowerCase().includes(query.toLowerCase()) ||
            track.artist.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        this.searchResults.innerHTML = results.map(track => `
            <div class="result-item" data-id="${track.id}">
                <img src="${track.artwork}" alt="${track.title}">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
                <button class="btn-add" onclick="player.addToQueue(${track.id})">
                    <i class="fas fa-plus"></i> Add to Queue
                </button>
            </div>
        `).join('');
    }

    addToQueue(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) {
            this.queue.push(track);
            this.updateQueueDisplay();
        }
    }

    updateQueueDisplay() {
        this.queueList.innerHTML = this.queue.map((track, index) => `
            <div class="queue-item ${index === this.currentTrackIndex ? 'playing' : ''}" 
                 onclick="player.playFromQueue(${index})">
                <span>${index + 1}. ${track.title} - ${track.artist}</span>
                <i class="fas fa-times" onclick="player.removeFromQueue(${index}); event.stopPropagation();"></i>
            </div>
        `).join('');
    }

    playFromQueue(index) {
        this.currentTrackIndex = index;
        this.loadTrack(this.queue[index]);
        if (this.isPlaying) this.play();
    }

    removeFromQueue(index) {
        this.queue.splice(index, 1);
        if (index < this.currentTrackIndex) {
            this.currentTrackIndex--;
        }
        this.updateQueueDisplay();
    }

    updatePlaylistDisplay() {
        this.currentPlaylistEl.innerHTML = this.tracks.map(track => `
            <div class="playlist-song" onclick="player.playTrack(${track.id})">
                ${track.title} - ${track.artist}
            </div>
        `).join('');
    }

    playTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.currentTrackIndex = index;
            this.loadTrack(this.tracks[index]);
            this.play();
        }
    }

    toggleLike() {
        const currentTrack = this.queue[this.currentTrackIndex];
        if (!currentTrack) return;
        
        if (this.favorites.has(currentTrack.id)) {
            this.favorites.delete(currentTrack.id);
        } else {
            this.favorites.add(currentTrack.id);
        }
        
        this.updateLikeButton();
    }

    updateLikeButton() {
        const currentTrack = this.queue[this.currentTrackIndex];
        const isLiked = currentTrack && this.favorites.has(currentTrack.id);
        const heartClass = isLiked ? 'fas fa-heart' : 'far fa-heart';
        const heartColor = isLiked ? '#ff4757' : '';
        
        this.likeBtn.innerHTML = `<i class="${heartClass}" style="color: ${heartColor}"></i>`;
        this.miniLikeBtn.innerHTML = `<i class="${heartClass}" style="color: ${heartColor}"></i>`;
    }

    setupEqualizer() {
        const equalizerContainer = document.getElementById('equalizer');
        const frequencies = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
        
        equalizerContainer.innerHTML = frequencies.map((freq, index) => `
            <div class="equalizer-band">
                <input type="range" 
                       class="band-slider" 
                       min="-12" 
                       max="12" 
                       value="0" 
                       orient="vertical"
                       data-band="${index}"
                       oninput="player.updateEqualizerBand(${index}, this.value)">
                <span class="band-label">${freq}</span>
            </div>
        `).join('');
    }

    updateEqualizerBand(band, value) {
        this.equalizerBands[band] = parseInt(value);
        
        // Apply equalizer to audio
        // Note: This requires Web Audio API for full implementation
        this.applyEqualizer();
    }

    applyEqualizer() {
        // This is a simplified version
        // Real implementation would use Web Audio API with BiquadFilter nodes
        console.log('Equalizer bands:', this.equalizerBands);
    }

    applyEqualizerPreset(preset) {
        const presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            pop: [2, 1, 0, -1, 0, 1, 3, 4, 3, 2],
            rock: [4, 3, 0, -2, -1, 2, 4, 5, 4, 3],
            jazz: [0, 0, 1, 2, 2, 1, 0, 0, -1, -2],
            classical: [-1, -1, 0, 1, 2, 2, 1, 0, -1, -2],
            bass: [6, 5, 3, 1, 0, -1, -2, -2, -3, -4]
        };
        
        if (presets[preset]) {
            this.equalizerBands = [...presets[preset]];
            this.updateEqualizerUI();
        }
    }

    updateEqualizerUI() {
        document.querySelectorAll('.band-slider').forEach((slider, index) => {
            slider.value = this.equalizerBands[index];
        });
    }

    showEqualizer() {
        this.switchView('equalizer');
    }

    switchLibraryTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update library content based on tab
        // This would load different content based on the tab
    }

    startVinylAnimation() {
        document.querySelector('.album-art-container').classList.add('playing');
    }

    loadLyrics(track) {
        // Simulate loading lyrics
        // In real app, you would fetch from a lyrics API
        const fakeLyrics = `
            [Verse 1]
            I've been tryna call
            I've been on my own for long enough
            Maybe you can show me how to love, maybe
            
            [Chorus]
            I'm going through withdrawals
            You don't even have to do too much
            You can turn me on with just a touch, baby
        `;
        
        this.lyricsContainer.innerHTML = `<pre>${fakeLyrics}</pre>`;
    }

    handleKeyboardShortcuts(e) {
        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'arrowleft':
                if (e.ctrlKey) this.prevTrack();
                break;
            case 'arrowright':
                if (e.ctrlKey) this.nextTrack();
                break;
            case 'arrowup':
                if (e.ctrlKey) this.setVolume(Math.min(this.volume + 0.1, 1));
                break;
            case 'arrowdown':
                if (e.ctrlKey) this.setVolume(Math.max(this.volume - 0.1, 0));
                break;
            case 'm':
                if (e.ctrlKey) this.setVolume(this.volume > 0 ? 0 : 0.8);
                break;
            case 'l':
                if (e.ctrlKey) this.toggleLike();
                break;
        }
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
});
