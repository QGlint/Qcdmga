let cards = [];
let totalProbability = 0;
let songs = [];
let selectedSongBoxIndex = null;
let round = 0;
let set = 0;
let player1Wins = 0;

async function loadCards() {
    try {
        const response = await fetch('card_test.json');
        cards = await response.json();
        totalProbability = cards.reduce((sum, card) => sum + card.probability, 0);
        initGame();
    } catch (error) {
        console.error('加载卡片数据失败:', error);
    }
}

async function loadSongs() {
    try {
        const response = await fetch('arcaea_online.json');
        songs = await response.json();
        initializeSongSelection();
    } catch (error) {
        console.error('加载歌曲数据失败:', error);
    }
}

function initGame() {
    document.getElementById("player1-draw").addEventListener("click", () => {
        drawCard("player1");
    });

    document.getElementById("player2-draw").addEventListener("click", () => {
        drawCard("player2");
    });

    document.getElementById("next-round").addEventListener("click", nextRound);

    document.querySelectorAll(".judgment-button").forEach(button => {
        button.addEventListener("click", function() {
            const result = this.getAttribute("data-result");
            handleJudgmentResult(result);
        });
    });

    document.getElementById("back-to-game").addEventListener("click", backToGame);

    document.getElementById('search-button').addEventListener('click', searchSongs);
    document.getElementById('song-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSongs();
        }
    });

    updateRoundAndSet();
}

function updateRoundAndSet() {
    document.getElementById("round").textContent = round;
    document.getElementById("set").textContent = set;
    document.getElementById("player1-wins").textContent = `胜利次数: ${player1Wins}`;
    updateRoundStyles();
}

function updateHandCount(playerId) {
    const handCountElement = document.getElementById(`${playerId}-hand-count`);
    const handCount = document.getElementById(`${playerId}-hand`).children.length;
    handCountElement.textContent = `手牌数：${handCount}`;
}

function drawCard(playerId) {
    const playerHandElement = document.getElementById(`${playerId}-hand`);
    const randomValue = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    let selectedCard = null;

    for (const card of cards) {
        cumulativeProbability += card.probability;
        if (randomValue < cumulativeProbability) {
            selectedCard = card;
            break;
        }
    }

    if (!selectedCard) {
        selectedCard = cards[cards.length - 1];
    }

    const cardElement = document.createElement("div");
    cardElement.className = `card ${selectedCard.rarity}`;
    cardElement.innerHTML = `
        <div class="card-name">${selectedCard.name}</div>
        <div class="card-type">${selectedCard.type}</div>
        <div class="card-duration">${selectedCard.duration}</div>
    `;

    cardElement.addEventListener('dblclick', function() {
        useCard(this, playerId, selectedCard.type, selectedCard.duration);
    });

    playerHandElement.appendChild(cardElement);
    updateHandCount(playerId);
}

function useCard(cardElement, playerId, cardType, duration) {
    if (cardType === "buff") {
        const playerBuffElement = document.getElementById(`${playerId}-buff`);
        playerBuffElement.appendChild(cardElement);
    } else if (cardType === "debuff") {
        const opponentId = playerId === "player1" ? "player2" : "player1";
        const opponentBuffElement = document.getElementById(`${opponentId}-buff`);
        opponentBuffElement.appendChild(cardElement);
    } else if (cardType === "global") {
        const globalBuffElement = document.getElementById(`global-buff`);
        globalBuffElement.appendChild(cardElement);
    }
    
    updateHandCount(playerId);
}

function nextRound() {
    clearDuration1Cards();
    round++;
    if (round >= 3) {
        round = 0;
        set++;
        showJudgmentDialog();
    }
    updateRoundAndSet();
}

function showJudgmentDialog() {
    document.getElementById("judgment-dialog").style.display = "flex";
    disableAllButtons(true);
}

function disableAllButtons(disabled) {
    document.getElementById("player1-draw").disabled = disabled;
    document.getElementById("player2-draw").disabled = disabled;
    document.getElementById("next-round").disabled = disabled;
}

function showResultDialog(result) {
    document.getElementById("judgment-dialog").style.display = "none";
    document.getElementById("result-title").textContent = result === "player1" ? "擂主守擂成功" : "挑战者挑战成功";
    document.getElementById("result-dialog").style.display = "flex";
}

function backToGame() {
    document.getElementById("result-dialog").style.display = "none";
    disableAllButtons(false);
    round = 0;
    updateRoundAndSet();
}

function handleJudgmentResult(result) {
    if (result === "player1") {
        player1Wins++;
        clearLoserAreas("player2");
        showResultDialog("player1");
    } else if (result === "player2") {
        clearLoserAreas("player1");
        moveWinnerAreas("player2", "player1");
        showResultDialog("player2");
    }
}

function clearLoserAreas(playerId) {
    document.getElementById(`${playerId}-hand`).innerHTML = "";
    document.getElementById(`${playerId}-buff`).innerHTML = "";
    clearNonZeroDurationCardsExceptWinnerHand(playerId === "player1" ? "player2" : "player1");
    updateHandCount(playerId);
}

function moveWinnerAreas(fromPlayerId, toPlayerId) {
    const fromHand = document.getElementById(`${fromPlayerId}-hand`);
    const toHand = document.getElementById(`${toPlayerId}-hand`);
    
    // 移动手牌区的卡牌
    Array.from(fromHand.children).forEach(card => {
        toHand.appendChild(card);
        // 重新绑定双击事件监听器
        card.addEventListener('dblclick', function() {
            const cardType = card.querySelector('.card-type').textContent;
            const cardDuration = card.querySelector('.card-duration').textContent;
            useCard(this, toPlayerId, cardType, cardDuration);
        });
    });
    
    fromHand.innerHTML = "";
    
    // 移动Buff区的卡牌
    const fromBuff = document.getElementById(`${fromPlayerId}-buff`);
    const toBuff = document.getElementById(`${toPlayerId}-buff`);
    Array.from(fromBuff.children).forEach(card => {
        toBuff.appendChild(card);
    });
    fromBuff.innerHTML = "";
    
    // 更新手牌数量显示
    updateHandCount(toPlayerId);
    updateHandCount(fromPlayerId); 
}

function clearNonZeroDurationCardsExceptWinnerHand(winnerId) {
    const allCardDisplays = [
        document.getElementById("player1-buff"),
        document.getElementById("player2-buff"),
        document.getElementById("global-buff")
    ];
    
    if (winnerId === "player1") {
        allCardDisplays.push(document.getElementById("player2-hand"));
    } else {
        allCardDisplays.push(document.getElementById("player1-hand"));
    }
    
    allCardDisplays.forEach(display => {
        const cards = display.querySelectorAll(".card");
        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            const duration = parseInt(card.querySelector(".card-duration").textContent);
            if (duration !== 0) {
                display.removeChild(card);
            }
        }
    });
    
    updateHandCount(winnerId === "player1" ? "player2" : "player1");
}

function clearDuration1Cards() {
    const allCardDisplays = [
        document.getElementById("player1-buff"),
        document.getElementById("player2-buff"),
        document.getElementById("global-buff")
    ];
    
    allCardDisplays.forEach(display => {
        const cards = display.querySelectorAll(".card");
        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            const duration = parseInt(card.querySelector(".card-duration").textContent);
            if (duration === 1) {
                display.removeChild(card);
            }
        }
    });
}

function showHandDialog(playerId) {
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "flex";
}

function hideHandDialog(playerId) {
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "none";
}

function initializeSongSelection() {
    const songSelection = document.getElementById('song-selection');
    songSelection.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const songBox = document.createElement('div');
        songBox.className = 'song-card';
        songBox.dataset.index = i;
        songBox.addEventListener('click', () => showSongSearchDialog(i));
        
        const placeholder = document.createElement('div');
        placeholder.className = 'song-card-placeholder';
        placeholder.textContent = '?';
        
        const innerBox = document.createElement('div');
        innerBox.className = 'song-card-inner';
        
        const content = document.createElement('div');
        content.className = 'song-card-content';
        
        songBox.appendChild(placeholder);
        songBox.appendChild(innerBox);
        songBox.appendChild(content);
        
        songSelection.appendChild(songBox);
    }
    updateRoundStyles();
}

function showSongSearchDialog(boxIndex) {
    selectedSongBoxIndex = boxIndex;
    document.getElementById('song-search-dialog').style.display = 'flex';
    document.getElementById('song-search-input').value = '';
    document.getElementById('song-results').innerHTML = '';
}

function searchSongs() {
    const searchTerm = document.getElementById('song-search-input').value.toLowerCase();
    const filteredSongs = songs.filter(song => 
        song.song_name.toLowerCase().startsWith(searchTerm)
    );
    displaySongSearchResults(filteredSongs);
}

function displaySongSearchResults(songList) {
    const songResults = document.getElementById('song-results');
    songResults.innerHTML = '';
    
    songList.forEach(song => {
        const songResult = document.createElement('div');
        songResult.className = 'song-result';
        songResult.textContent = song.song_name;
        songResult.addEventListener('click', () => selectSongForBox(song));
        songResults.appendChild(songResult);
    });
}

function selectSongForBox(song) {
    const songBox = document.querySelector(`.song-card[data-index="${selectedSongBoxIndex}"]`);
    songBox.className = 'song-card selected';
    
    const placeholder = songBox.querySelector('.song-card-placeholder');
    placeholder.style.display = 'none';
    
    const innerBox = songBox.querySelector('.song-card-inner');
    innerBox.style.backgroundImage = `url('${song.image_url}')`;
    innerBox.style.backgroundSize = 'cover';
    
    const content = songBox.querySelector('.song-card-content');
    content.textContent = song.song_name;
    
    document.getElementById('song-search-dialog').style.display = 'none';
    
    console.log('为框选择歌曲:', song, '框索引:', selectedSongBoxIndex);
}

function updateRoundStyles() {
    const songCards = document.querySelectorAll('.song-card');
    songCards.forEach((card, index) => {
        if (round === index) {
            card.style.backgroundColor = '#ffc0cb';
        } else {
            card.style.backgroundColor = '#90ee90';
        }
    });
}

window.onload = () => {
    loadCards();
    loadSongs();
    initializeSongSelection();
};