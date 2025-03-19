let cards = [];
let totalProbability = 0;
let songs = [];
let selectedSongBoxIndex = null;
let set = 0;
let player1Wins = 0;
let isPlayer1Ready = false;
let isPlayer2Ready = false;
let player1Actions = [];
let player2Actions = [];
let selectedSongs = [];
let songsSelected = false;

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
    } catch (error) {
        console.error('加载歌曲数据失败:', error);
    }
}

function initGame() {
    document.getElementById("player1-draw").addEventListener("click", () => {
        if (!songsSelected) {
            alert("请先选择歌曲并开始本轮比赛！");
            return;
        }
        drawCard("player1");
    });

    document.getElementById("player2-draw").addEventListener("click", () => {
        if (!songsSelected) {
            alert("请先选择歌曲并开始本轮比赛！");
            return;
        }
        drawCard("player2");
    });

    document.getElementById("next-set").addEventListener("click", nextSet);

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

    document.getElementById("player1-show-hand").addEventListener("click", () => {
        if (!songsSelected) {
            alert("请先选择歌曲并开始本轮比赛！");
            return;
        }
        showHandDialog("player1");
    });

    document.getElementById("player2-show-hand").addEventListener("click", () => {
        if (!songsSelected) {
            alert("请先选择歌曲并开始本轮比赛！");
            return;
        }
        showHandDialog("player2");
    });

    document.getElementById("start-round").addEventListener("click", startRound);

    updateSet();
    // 删除了 initializeSongSelection() 的调用
}

function updateSet() {
    document.getElementById("set").textContent = set;
    document.getElementById("player1-wins").textContent = `胜利次数: ${player1Wins}`;
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
    `;

    const actionContainer = document.createElement("div");
    actionContainer.className = "card-action";
    actionContainer.innerHTML = `
        <button class="play-button" data-action="1">出牌1</button>
        <button class="play-button" data-action="2">出牌2</button>
        <button class="play-button" data-action="3">出牌3</button>
    `;

    const playButtons = actionContainer.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            togglePlayCard(this, playerId, button.getAttribute("data-action"));
        });
    });

    cardElement.appendChild(actionContainer);

    playerHandElement.appendChild(cardElement);
    updateHandCount(playerId);
}

function togglePlayCard(button, playerId, action) {
    if (button.classList.contains('played')) {
        button.classList.remove('played');
        button.style.backgroundColor = '#4CAF50';
        if (playerId === "player1") {
            player1Actions = player1Actions.filter(act => act.action !== action);
        } else if (playerId === "player2") {
            player2Actions = player2Actions.filter(act => act.action !== action);
        }
        button.style.display = 'block';
    } else {
        button.classList.add('played');
        button.style.backgroundColor = '#999';
        const actionObj = {
            playerId: playerId,
            action: action
        };
        if (playerId === "player1") {
            player1Actions.push(actionObj);
        } else if (playerId === "player2") {
            player2Actions.push(actionObj);
        }
        button.style.display = 'none';
    }
}

function useCard(action) {
    const { playerId, action: act } = action;

    const playerHandElement = document.getElementById(`${playerId}-hand`);
    const cardElements = playerHandElement.querySelectorAll(`.card`);
    let cardFound = false;

    cardElements.forEach(cardElement => {
        if (!cardFound) {
            if (cardElement.querySelector('.card-type').textContent === "buff") {
                const playerBuffElement = document.getElementById(`${playerId}-buff${act}`);
                playerBuffElement.appendChild(cardElement);
            } else if (cardElement.querySelector('.card-type').textContent === "debuff") {
                const opponentId = playerId === "player1" ? "player2" : "player1";
                const opponentBuffElement = document.getElementById(`${opponentId}-buff${act}`);
                opponentBuffElement.appendChild(cardElement);
            } else if (cardElement.querySelector('.card-type').textContent === "global") {
                const globalBuffElement = document.getElementById(`global-buff`);
                globalBuffElement.appendChild(cardElement);
            }
            cardFound = true;
        }
    });

    updateHandCount(playerId);
}

function nextSet() {
    showSongSelectionDialog();
}

function showJudgmentDialog() {
    document.getElementById("judgment-dialog").style.display = "flex";
    disableAllButtons(true);
}

function disableAllButtons(disabled) {
    document.getElementById("player1-draw").disabled = disabled;
    document.getElementById("player2-draw").disabled = disabled;
    document.getElementById("next-set").disabled = disabled;
}

function showResultDialog(result) {
    document.getElementById("judgment-dialog").style.display = "none";
    document.getElementById("result-title").textContent = result === "player1" ? "擂主守擂成功" : "挑战者挑战成功";
    document.getElementById("result-dialog").style.display = "flex";
}

function backToGame() {
    document.getElementById("result-dialog").style.display = "none";
    disableAllButtons(false);
    set = 0;
    updateSet();
    songsSelected = false;
    const songSelection = document.getElementById('song-selection');
    songSelection.innerHTML = '';
    initializeSongSelection();
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
    document.getElementById(`${playerId}-buff1`).innerHTML = "";
    document.getElementById(`${playerId}-buff2`).innerHTML = "";
    document.getElementById(`${playerId}-buff3`).innerHTML = "";
    updateHandCount(playerId);
}

function moveWinnerAreas(fromPlayerId, toPlayerId) {
    const fromHand = document.getElementById(`${fromPlayerId}-hand`);
    const toHand = document.getElementById(`${toPlayerId}-hand`);
    
    Array.from(fromHand.children).forEach(card => {
        toHand.appendChild(card);
        const playButtons = card.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = button.getAttribute("data-action");
                togglePlayCard(this, toPlayerId, action);
            });
        });
    });
    
    fromHand.innerHTML = "";
    
    const fromBuff1 = document.getElementById(`${fromPlayerId}-buff1`);
    const toBuff1 = document.getElementById(`${toPlayerId}-buff1`);
    Array.from(fromBuff1.children).forEach(card => {
        toBuff1.appendChild(card);
    });
    fromBuff1.innerHTML = "";
    
    const fromBuff2 = document.getElementById(`${fromPlayerId}-buff2`);
    const toBuff2 = document.getElementById(`${toPlayerId}-buff2`);
    Array.from(fromBuff2.children).forEach(card => {
        toBuff2.appendChild(card);
    });
    fromBuff2.innerHTML = "";
    
    const fromBuff3 = document.getElementById(`${fromPlayerId}-buff3`);
    const toBuff3 = document.getElementById(`${toPlayerId}-buff3`);
    Array.from(fromBuff3.children).forEach(card => {
        toBuff3.appendChild(card);
    });
    fromBuff3.innerHTML = "";
    
    updateHandCount(toPlayerId);
    updateHandCount(fromPlayerId); 
}

function clearAllBuffs() {
    const allBuffDisplays = [
        document.getElementById("player1-buff1"),
        document.getElementById("player1-buff2"),
        document.getElementById("player1-buff3"),
        document.getElementById("player2-buff1"),
        document.getElementById("player2-buff2"),
        document.getElementById("player2-buff3"),
        document.getElementById("global-buff")
    ];
    
    allBuffDisplays.forEach(display => {
        display.innerHTML = "";
    });
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
        placeholder.textContent = '点击区域选歌';
        
        const innerBox = document.createElement('div');
        innerBox.className = 'song-card-inner';
        
        const content = document.createElement('div');
        content.className = 'song-card-content';
        content.textContent = '歌曲名称';
        
        songBox.appendChild(placeholder);
        songBox.appendChild(innerBox);
        songBox.appendChild(content);
        
        songSelection.appendChild(songBox);
    }
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
}

function showSongSelectionDialog() {
    document.getElementById('song-selection-dialog').style.display = 'flex';
}

function startRound() {
    const songAreas = document.querySelectorAll('.song-area');
    let allSelected = true;
    songAreas.forEach(area => {
        const songCard = area.querySelector('.song-card');
        if (!songCard.classList.contains('selected')) {
            allSelected = false;
        }
    });
    
    if (allSelected) {
        document.getElementById('song-selection-dialog').style.display = 'none';
        // 将选中的歌曲添加到右上角的挑战歌曲区域
        const songAreas = document.querySelectorAll('.song-area');
        songAreas.forEach(area => {
            const songCard = area.querySelector('.song-card');
            const clonedSongCard = songCard.cloneNode(true);
            clonedSongCard.style.backgroundColor = '#ffc0cb'; // 恢复初始背景色
            clonedSongCard.querySelector('.song-card-inner').style.backgroundImage = 'none'; // 清除图片
            clonedSongCard.querySelector('.song-card-placeholder').style.display = 'block'; // 显示问号
            clonedSongCard.querySelector('.song-card-content').textContent = '歌曲名称'; // 恢复默认文本
            document.getElementById('song-selection').appendChild(clonedSongCard);
        });
        // 开始新局
        set++;
        updateSet();
        songsSelected = true;
        // 清空选歌区域
        document.getElementById('song-selection').innerHTML = '';
        // 重新初始化选歌区域
        initializeSongSelection();
    } else {
        alert("请先选择所有歌曲！");
    }
}

function showHandDialog(playerId) {
    if (!songsSelected) {
        alert("请先选择歌曲并开始本轮比赛！");
        return;
    }
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "flex";
}

function hideHandDialog(playerId) {
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "none";
    finishRound(playerId);
}

function finishRound(playerId) {
    if (playerId === "player1") {
        isPlayer1Ready = true;
    } else if (playerId === "player2") {
        isPlayer2Ready = true;
    }

    if (isPlayer1Ready && isPlayer2Ready) {
        executeRecordedActions();
        showCardsOnField();
    }
}

function executeRecordedActions() {
    player1Actions.forEach(action => {
        useCard(action);
    });

    player2Actions.forEach(action => {
        useCard(action);
    });
}

function showCardsOnField() {
    const player1Hand = document.getElementById("player1-hand");
    const player1Buff1 = document.getElementById("player1-buff1");
    const player1Buff2 = document.getElementById("player1-buff2");
    const player1Buff3 = document.getElementById("player1-buff3");
    Array.from(player1Hand.children).forEach(card => {
        const playButtons = card.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            if (button.classList.contains('played')) {
                const action = button.getAttribute("data-action");
                const actionObj = {
                    playerId: "player1",
                    action: action
                };
                useCard(actionObj);
            }
        });
    });
    updateHandCount("player1");

    const player2Hand = document.getElementById("player2-hand");
    const player2Buff1 = document.getElementById("player2-buff1");
    const player2Buff2 = document.getElementById("player2-buff2");
    const player2Buff3 = document.getElementById("player2-buff3");
    Array.from(player2Hand.children).forEach(card => {
        const playButtons = card.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            if (button.classList.contains('played')) {
                const action = button.getAttribute("data-action");
                const actionObj = {
                    playerId: "player2",
                    action: action
                };
                useCard(actionObj);
            }
        });
    });
    updateHandCount("player2");
}

window.onload = () => {
    loadCards();
    loadSongs();
};