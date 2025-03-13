// 卡牌数据
let cards = [];
let totalProbability = 0;

// 歌曲数据
let songs = [];

// 当前选中的歌曲框索引
let selectedSongBoxIndex = null;

// 加载卡片数据
async function loadCards() {
    try {
        const response = await fetch('card_test.json');
        cards = await response.json();
        
        // 计算总概率
        totalProbability = cards.reduce((sum, card) => sum + card.probability, 0);
        
        // 初始化游戏
        initGame();
    } catch (error) {
        console.error('加载卡片数据失败:', error);
    }
}

// 加载歌曲数据
async function loadSongs() {
    try {
        const response = await fetch('arcaea_online.json');
        songs = await response.json();
        initializeSongSelection();
    } catch (error) {
        console.error('加载歌曲数据失败:', error);
    }
}

// 初始化游戏
function initGame() {
    // 绑定抽卡按钮事件
    document.getElementById("player1-draw").addEventListener("click", () => {
        drawCard("player1");
    });

    document.getElementById("player2-draw").addEventListener("click", () => {
        drawCard("player2");
    });

    // 绑定下一回合按钮事件
    document.getElementById("next-round").addEventListener("click", nextRound);

    // 绑定判定按钮事件
    document.querySelectorAll(".judgment-button").forEach(button => {
        button.addEventListener("click", function() {
            const result = this.getAttribute("data-result");
            handleJudgmentResult(result);
        });
    });

    // 绑定返回游戏按钮事件
    document.getElementById("back-to-game").addEventListener("click", backToGame);

    // 绑定搜索按钮事件
    document.getElementById('search-button').addEventListener('click', searchSongs);
    document.getElementById('song-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSongs();
        }
    });

    // 初始化回合和局数
    updateRoundAndSet();
}

let round = 0;
let set = 0;
let player1Wins = 0;

// 更新回合和局数显示
function updateRoundAndSet() {
    document.getElementById("round").textContent = round;
    document.getElementById("set").textContent = set;
    document.getElementById("player1-wins").textContent = `胜利次数: ${player1Wins}`;
}

// 更新手牌数量显示
function updateHandCount(playerId) {
    const handCountElement = document.getElementById(`${playerId}-hand-count`);
    const handCount = document.getElementById(`${playerId}-hand`).children.length;
    handCountElement.textContent = `手牌数：${handCount}`;
}

// 玩家抽卡函数
function drawCard(playerId) {
    const playerHandElement = document.getElementById(`${playerId}-hand`);
    
    // 根据概率随机选择一张卡牌
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
        selectedCard = cards[cards.length - 1]; // 默认选择最后一张卡
    }
    
    // 创建卡牌元素
    const cardElement = document.createElement("div");
    cardElement.className = `card ${selectedCard.rarity}`;
    cardElement.innerHTML = `
        <div class="card-name">${selectedCard.name}</div>
        <div class="card-type">${selectedCard.type}</div>
        <div class="card-duration">${selectedCard.duration}</div>
    `;
    
    // 添加双击事件监听器
    cardElement.addEventListener('dblclick', function() {
        useCard(this, playerId, selectedCard.type, selectedCard.duration);
    });
    
    // 添加到玩家的手牌区
    playerHandElement.appendChild(cardElement);
    
    // 更新手牌数量显示
    updateHandCount(playerId);
}

// 使用卡牌函数
function useCard(cardElement, playerId, cardType, duration) {
    if (cardType === "buff") {
        // 移动到自己的Buff区
        const playerBuffElement = document.getElementById(`${playerId}-buff`);
        playerBuffElement.appendChild(cardElement);
    } else if (cardType === "debuff") {
        // 移动到对方的Buff区
        const opponentId = playerId === "player1" ? "player2" : "player1";
        const opponentBuffElement = document.getElementById(`${opponentId}-buff`);
        opponentBuffElement.appendChild(cardElement);
    } else if (cardType === "global") {
        // 移动到全局Buff区
        const globalBuffElement = document.getElementById(`global-buff`);
        globalBuffElement.appendChild(cardElement);
    }
    
    // 更新手牌数量显示
    updateHandCount(playerId);
}

// 下一回合函数
function nextRound() {
    // 清除所有Buff区和全局Buff区中持续时间为1的卡牌
    clearDuration1Cards();
    
    round++;
    if (round >= 3) {
        round = 0;
        set++;
        // 触发判定
        showJudgmentDialog();
    }
    updateRoundAndSet();
}

// 显示判定对话框
function showJudgmentDialog() {
    document.getElementById("judgment-dialog").style.display = "flex";
    
    // 禁用所有按钮
    disableAllButtons(true);
}

// 禁用所有按钮
function disableAllButtons(disabled) {
    document.getElementById("player1-draw").disabled = disabled;
    document.getElementById("player2-draw").disabled = disabled;
    document.getElementById("next-round").disabled = disabled;
}

// 显示结果对话框
function showResultDialog(result) {
    document.getElementById("judgment-dialog").style.display = "none";
    document.getElementById("result-title").textContent = result === "player1" ? "擂主守擂成功" : "挑战者挑战成功";
    document.getElementById("result-dialog").style.display = "flex";
}

// 返回游戏
function backToGame() {
    document.getElementById("result-dialog").style.display = "none";
    disableAllButtons(false);
    
    // 重置回合
    round = 0;
    updateRoundAndSet();
}

// 处理判定结果
function handleJudgmentResult(result) {
    if (result === "player1") {
        // 擂主胜利
        player1Wins++;
        clearLoserAreas("player2");
        showResultDialog("player1");
    } else if (result === "player2") {
        // 挑战者胜利
        clearLoserAreas("player1");
        moveWinnerAreas("player2", "player1");
        showResultDialog("player2");
    }
}

// 清除输家区域
function clearLoserAreas(playerId) {
    // 清除输家的手牌区和Buff区
    document.getElementById(`${playerId}-hand`).innerHTML = "";
    document.getElementById(`${playerId}-buff`).innerHTML = "";
    
    // 清除所有持续时间不为0的牌（除了赢家的手牌区）
    clearNonZeroDurationCardsExceptWinnerHand(playerId === "player1" ? "player2" : "player1");
    
    // 更新手牌数量显示
    updateHandCount(playerId);
}

// 将赢家的区域移动到擂主区域
function moveWinnerAreas(fromPlayerId, toPlayerId) {
    // 移动手牌区
    const fromHand = document.getElementById(`${fromPlayerId}-hand`);
    const toHand = document.getElementById(`${toPlayerId}-hand`);
    toHand.innerHTML += fromHand.innerHTML;
    fromHand.innerHTML = "";
    
    // 移动Buff区
    const fromBuff = document.getElementById(`${fromPlayerId}-buff`);
    const toBuff = document.getElementById(`${toPlayerId}-buff`);
    toBuff.innerHTML += fromBuff.innerHTML;
    fromBuff.innerHTML = "";
    
    // 更新手牌数量显示
    updateHandCount(toPlayerId);
    updateHandCount(fromPlayerId); 
}

// 清除所有持续时间不为0的牌（除了赢家的手牌区）
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
    
    // 更新手牌数量显示
    updateHandCount(winnerId === "player1" ? "player2" : "player1");
}

// 清除所有持续时间为1的牌
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

// 显示手牌区弹窗
function showHandDialog(playerId) {
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "flex";
}

// 隐藏手牌区弹窗
function hideHandDialog(playerId) {
    const handDialog = document.getElementById(`${playerId}-hand-dialog`);
    handDialog.style.display = "none";
}

// 初始化歌曲选择框
function initializeSongSelection() {
    const songSelection = document.getElementById('song-selection');
    songSelection.innerHTML = '';
    
    // 创建三个空的歌曲选择框
    for (let i = 0; i < 3; i++) {
        const songBox = document.createElement('div');
        songBox.className = 'song-card';
        songBox.dataset.index = i;
        songBox.addEventListener('click', () => showSongSearchDialog(i));
        songSelection.appendChild(songBox);
    }
}

// 显示歌曲搜索弹窗
function showSongSearchDialog(boxIndex) {
    selectedSongBoxIndex = boxIndex;
    document.getElementById('song-search-dialog').style.display = 'flex';
    document.getElementById('song-search-input').value = '';
    document.getElementById('song-results').innerHTML = '';
}

// 搜索歌曲
function searchSongs() {
    const searchTerm = document.getElementById('song-search-input').value.toLowerCase();
    const filteredSongs = songs.filter(song => 
        song.song_name.toLowerCase().startsWith(searchTerm)
    );
    displaySongSearchResults(filteredSongs);
}

// 显示歌曲搜索结果
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

// 为框选择歌曲
function selectSongForBox(song) {
    // 更新对应的歌曲选择框
    const songBox = document.querySelector(`.song-card[data-index="${selectedSongBoxIndex}"]`);
    songBox.className = 'song-card selected';
    
    // 创建歌曲图片和名称
    const songImage = document.createElement('div');
    songImage.className = 'song-image';
    songImage.style.backgroundImage = `url('${song.image_path}')`;
    songImage.style.backgroundSize = 'cover';
    
    const songName = document.createElement('div');
    songName.className = 'song-name';
    songName.textContent = song.song_name;
    
    songBox.appendChild(songImage);
    songBox.appendChild(songName);
    
    // 隐藏弹窗
    document.getElementById('song-search-dialog').style.display = 'none';
    
    console.log('为框选择歌曲:', song, '框索引:', selectedSongBoxIndex);
}

// 初始化时加载卡片和歌曲
window.onload = () => {
    loadCards();
    loadSongs();
};