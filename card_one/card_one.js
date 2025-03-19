// 卡牌数据
let cardData = [];
// 歌曲数据
let songData = [];
// 当前局数
let currentSet = 0;
// 玩家手牌
let player1Hand = [];
let player2Hand = [];
// 是否完成出卡
let player1Done = false;
let player2Done = false;
// 是否已选歌
let songSelected = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchCardData();
    fetchSongData();
    setupEventListeners();
});

// 获取卡牌数据
function fetchCardData() {
    // 这里应该是从card_test.json获取数据的代码
    // 为了示例，我们直接定义一些测试数据
    cardData = [
        { name: "难度自选", type: "buff", probability: 5, description: "可选择歌曲任意难度" },
        { name: "节奏干扰", type: "debuff", probability: 3, description: "对手节奏识别难度增加" },
        { name: "全局加速", type: "global", probability: 2, description: "所有玩家速度加快20%" }
    ];
}

// 获取歌曲数据
function fetchSongData() {
    // 这里应该是从arcaea_online.json获取数据的代码
    // 为了示例，我们直接定义一些测试数据
    songData = [
        { song_name: "Sayonara Hatsukoi", image_url: "https://arcwiki.mcd.blue/images/f/fd/Songs_sayonarahatsukoi.jpg" },
        { song_name: "Alice of the Moon", image_url: "https://arcwiki.mcd.blue/images/4/4a/Songs_aliceofthemoon.jpg" },
        { song_name: "Brilliant Days", image_url: "https://arcwiki.mcd.blue/images/7/7c/Songs_brilliantdays.jpg" }
    ];
}

// 设置事件监听器
function setupEventListeners() {
    // 下一局按钮
    document.getElementById('next-set').addEventListener('click', handleNextSet);
    
    // 玩家抽卡按钮
    document.getElementById('player1-draw').addEventListener('click', () => drawCard('player1'));
    document.getElementById('player2-draw').addEventListener('click', () => drawCard('player2'));
    
    // 玩家显示手牌按钮
    document.getElementById('player1-show-hand').addEventListener('click', () => showHandDialog('player1'));
    document.getElementById('player2-show-hand').addEventListener('click', () => showHandDialog('player2'));
    
    // 选歌区域点击事件
    document.getElementById('song-selection').addEventListener('click', showSongSelectionDialog);
    
    // 选歌弹窗的开始比赛按钮
    document.getElementById('start-round').addEventListener('click', startRound);
    
    // 判定弹窗的按钮
    document.querySelectorAll('.judgment-button').forEach(button => {
        button.addEventListener('click', () => handleJudgment(button.dataset.result));
    });
    
    // 返回游戏按钮
    document.getElementById('back-to-game').addEventListener('click', hideResultDialog);
    
    // 手牌区完成按钮
    document.querySelectorAll('.hand-dialog-close').forEach(button => {
        button.addEventListener('click', () => hideHandDialog(button.dataset.player));
    });
    
    // 搜索按钮
    document.getElementById('search-button').addEventListener('click', searchSongs);
}

// 处理下一局
function handleNextSet() {
    if (!songSelected) {
        alert('请先选歌！');
        return;
    }
    if (!player1Done || !player2Done) {
        alert('请先完成出卡！');
        return;
    }
    
    showJudgmentDialog();
}

// 显示判定弹窗
function showJudgmentDialog() {
    document.getElementById('judgment-dialog').style.display = 'block';
}

// 处理判定结果
function handleJudgment(result) {
    document.getElementById('judgment-dialog').style.display = 'none';
    
    if (result === 'player1') {
        document.getElementById('result-title').textContent = '擂主守擂成功';
        player2Hand = []; // 清除挑战者手牌
    } else {
        document.getElementById('result-title').textContent = '挑战者挑战成功';
        player1Hand = player2Hand; // 将挑战者手牌移动到擂主手牌
        player2Hand = [];
    }
    
    // 清除全局buff区和1、2、3区域的卡牌
    clearGlobalBuff();
    clearBuffAreas();
    
    // 重置选歌区域
    resetSongSelection();
    
    // 显示结果弹窗
    document.getElementById('result-dialog').style.display = 'block';
}

// 隐藏结果弹窗
function hideResultDialog() {
    document.getElementById('result-dialog').style.display = 'none';
}

// 抽卡
function drawCard(player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = getRandomCard();
    hand.push(card);
    updateHandCount(player, hand.length);
}

// 获取随机卡牌
function getRandomCard() {
    const totalProbability = cardData.reduce((sum, card) => sum + card.probability, 0);
    const random = Math.random() * totalProbability;
    
    let cumulative = 0;
    for (const card of cardData) {
        cumulative += card.probability;
        if (random < cumulative) {
            return { ...card };
        }
    }
    return null;
}

// 显示手牌弹窗
function showHandDialog(player) {
    const dialog = document.getElementById(`${player}-hand-dialog`);
    dialog.style.display = 'block';
    renderHand(player);
}

// 隐藏手牌弹窗
function hideHandDialog(player) {
    document.getElementById(`${player}-hand-dialog`).style.display = 'none';
}

// 渲染手牌
function renderHand(player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const container = document.getElementById(`${player}-hand`);
    container.innerHTML = '';
    
    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, index);
        container.appendChild(cardElement);
    });
}

// 创建卡牌元素
function createCardElement(card, index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.style.backgroundColor = getCardColor(card.type);
    
    cardElement.innerHTML = `
        <div class="card-content">
            <div class="card-name">${card.name}</div>
            <div class="card-description">${card.description}</div>
        </div>
    `;
    
    return cardElement;
}

// 获取卡牌颜色
function getCardColor(type) {
    switch (type) {
        case 'buff': return '#FFD700'; // 金色
        case 'debuff': return '#FF6347'; // 红色
        case 'global': return '#FFFFFF'; // 白色
        default: return '#FFFFFF';
    }
}

// 更新手牌数量显示
function updateHandCount(player, count) {
    document.getElementById(`${player}-hand-count`).textContent = `手牌数 : ${count}`;
}

// 显示选歌弹窗
function showSongSelectionDialog() {
    document.getElementById('song-selection-dialog').style.display = 'block';
}

// 开始本轮比赛
function startRound() {
    songSelected = true;
    document.getElementById('song-selection-dialog').style.display = 'none';
    updateSongSelection();
}

// 更新选歌区域
function updateSongSelection() {
    const songSelection = document.getElementById('song-selection');
    songSelection.innerHTML = '';
    
    // 这里应该是从选歌弹窗获取选中的歌曲并渲染
    // 为了示例，我们直接创建三个示例歌曲卡片
    for (let i = 0; i < 3; i++) {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.innerHTML = `
            <div class="song-card-inner" style="background-image: url('${songData[i].image_url}')"></div>
            <div class="song-card-content">${songData[i].song_name}</div>
        `;
        songSelection.appendChild(songCard);
    }
}

// 重置选歌区域
function resetSongSelection() {
    const songSelection = document.getElementById('song-selection');
    songSelection.innerHTML = '<div class="song-placeholder">点击区域选择歌曲</div>';
    songSelected = false;
}

// 清除全局buff区
function clearGlobalBuff() {
    document.getElementById('global-buff').innerHTML = '';
}

// 清除1、2、3区域的卡牌
function clearBuffAreas() {
    document.getElementById('player1-buff1').innerHTML = '';
    document.getElementById('player1-buff2').innerHTML = '';
    document.getElementById('player1-buff3').innerHTML = '';
    document.getElementById('player2-buff1').innerHTML = '';
    document.getElementById('player2-buff2').innerHTML = '';
    document.getElementById('player2-buff3').innerHTML = '';
}

// 隐藏结果弹窗
function hideResultDialog() {
    document.getElementById('result-dialog').style.display = 'none';
}

// 搜索歌曲
function searchSongs() {
    const searchTerm = document.getElementById('song-search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('song-results');
    resultsContainer.innerHTML = '';
    
    songData.forEach(song => {
        if (song.song_name.toLowerCase().includes(searchTerm)) {
            const resultElement = document.createElement('div');
            resultElement.className = 'song-result';
            resultElement.innerHTML = `
                <div class="song-result-image" style="background-image: url('${song.image_url}')"></div>
                <div class="song-result-name">${song.song_name}</div>
            `;
            resultElement.addEventListener('click', () => selectSong(song));
            resultsContainer.appendChild(resultElement);
        }
    });
}

// 选择歌曲
function selectSong(song) {
    const songArea = document.querySelector(`.song-area[data-index="${selectedSongIndex}"]`);
    songArea.innerHTML = `
        <div class="song-card">
            <div class="song-card-inner" style="background-image: url('${song.image_url}')"></div>
            <div class="song-card-content">${song.song_name}</div>
        </div>
    `;
    selectedSongIndex++;
    if (selectedSongIndex >= 3) {
        document.getElementById('start-round').style.display = 'block';
    }
}