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
// 选中的歌曲索引
let selectedSongIndex = 0;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchCardData();
    fetchSongData();
    setupEventListeners();
});

// 从文件中获取卡牌数据
async function fetchCardData() {
    try {
        const response = await fetch('card_test.json');
        cardData = await response.json();
    } catch (error) {
        console.error('Failed to fetch card data:', error);
        // 如果加载失败，使用示例数据
        cardData = [
            { name: "难度自选", type: "buff", probability: 5, description: "可选择歌曲任意难度" },
            { name: "节奏干扰", type: "debuff", probability: 3, description: "对手节奏识别难度增加" },
            { name: "全局加速", type: "global", probability: 2, description: "所有玩家速度加快20%" },
            // 更多卡牌数据...
        ];
    }
}

// 从文件中获取歌曲数据
async function fetchSongData() {
    try {
        const response = await fetch('arcaea_online.json');
        songData = await response.json();
    } catch (error) {
        console.error('Failed to fetch song data:', error);
        // 如果加载失败，使用示例数据
        songData = [
            { song_name: "Sayonara Hatsukoi", image_url: "https://arcwiki.mcd.blue/images/f/fd/Songs_sayonarahatsukoi.jpg" },
            { song_name: "Alice of the Moon", image_url: "https://arcwiki.mcd.blue/images/4/4a/Songs_aliceofthemoon.jpg" },
            { song_name: "Brilliant Days", image_url: "https://arcwiki.mcd.blue/images/7/7c/Songs_brilliantdays.jpg" }
        ];
    }
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
    document.getElementById('player1-hand-dialog').addEventListener('click', (e) => {
        if (e.target.classList.contains('hand-dialog-close')) {
            player1Done = true;
            checkBothDone();
        }
    });
    
    document.getElementById('player2-hand-dialog').addEventListener('click', (e) => {
        if (e.target.classList.contains('hand-dialog-close')) {
            player2Done = true;
            checkBothDone();
        }
    });
    
    // 选歌弹窗中的小区域点击事件
    document.querySelectorAll('.song-area').forEach(area => {
        area.addEventListener('click', () => {
            showSongSearchDialog(area.dataset.index);
        });
    });
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
    document.getElementById('judgment-dialog').style.display = 'flex';
}

// 处理判定结果
function handleJudgment(result) {
    document.getElementById('judgment-dialog').style.display = 'none';
    
    if (result === 'player1') {
        document.getElementById('result-title').textContent = '擂主守擂成功';
        player2Hand = []; // 清除挑战者手牌
    } else {
        document.getElementById('result-title').textContent = '挑战者挑战成功';
        player1Hand = [...player2Hand]; // 将挑战者手牌复制到擂主手牌
        player2Hand = []; // 清除挑战者手牌
    }
    
    // 清除全局buff区和1、2、3区域的卡牌
    clearGlobalBuff();
    clearBuffAreas();
    
    // 重置选歌区域
    resetSongSelection();
    
    // 显示结果弹窗
    document.getElementById('result-dialog').style.display = 'flex';
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
    dialog.style.display = 'flex';
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
        const cardElement = createCardElement(card, index, player);
        container.appendChild(cardElement);
    });
}

// 创建卡牌元素
function createCardElement(card, index, player) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.style.backgroundColor = getCardColor(card.type);
    
    cardElement.innerHTML = `
        <div class="card-content">
            <div class="card-name">${card.name}</div>
            <div class="card-description">${card.description}</div>
        </div>
        <div class="card-actions">
            ${card.type === 'global' ? `
                <button class="action-button" onclick="playGlobalCard(${index}, '${player}')">出牌</button>
            ` : `
                <button class="action-button" onclick="playCard(${index}, '${player}', 1)">1</button>
                <button class="action-button" onclick="playCard(${index}, '${player}', 2)">2</button>
                <button class="action-button" onclick="playCard(${index}, '${player}', 3)">3</button>
            `}
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
    document.getElementById('song-selection-dialog').style.display = 'flex';
}

// 显示歌曲搜索弹窗
function showSongSearchDialog(index) {
    selectedSongIndex = index;
    const songArea = document.querySelector(`.song-area[data-index="${index}"]`);
    songArea.innerHTML = `
        <div class="song-card">
            <div class="song-card-inner"></div>
            <div class="song-card-content">歌曲名称</div>
        </div>
        <div class="song-search-container">
            <input type="text" id="song-search-input-${index}" placeholder="输入歌曲名搜索...">
        </div>
        <div class="song-results" id="song-results-${index}">
            <!-- 搜索结果将在这里动态生成 -->
        </div>
    `;
    const searchInput = document.getElementById(`song-search-input-${index}`);
    searchInput.addEventListener('input', (e) => {
        searchSongs(e.target.value, index);
    });
    // 确保输入框可以获取焦点
    searchInput.focus();
}

// 搜索歌曲
function searchSongs(searchTerm, index) {
    const resultsContainer = document.getElementById(`song-results-${index}`);
    resultsContainer.innerHTML = '';
    
    songData.forEach(song => {
        if (song.song_name.toLowerCase().includes(searchTerm.toLowerCase())) {
            const resultElement = document.createElement('div');
            resultElement.className = 'song-result';
            resultElement.innerHTML = `
                <div class="song-result-name">${song.song_name}</div>
            `;
            resultElement.addEventListener('click', () => selectSong(song, index));
            resultsContainer.appendChild(resultElement);
        }
    });
}

// 选择歌曲
function selectSong(song, index) {
    const songArea = document.querySelector(`.song-area[data-index="${index}"]`);
    songArea.innerHTML = `
        <div class="song-card">
            <div class="song-card-inner" style="background-image: url('${song.image_url}')"></div>
            <div class="song-card-content">${song.song_name}</div>
        </div>
    `;
    
    // 检查是否所有歌曲都已选择
    const allSelected = Array.from(document.querySelectorAll('.song-area')).every(area => {
        return area.querySelector('.song-card-inner').style.backgroundImage !== '';
    });
    
    if (allSelected) {
        document.getElementById('start-round').style.display = 'block';
    }
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
    
    // 从选歌弹窗获取选中的歌曲并渲染
    const songAreas = document.querySelectorAll('.song-area');
    songAreas.forEach(area => {
        const songCard = area.querySelector('.song-card');
        if (songCard) {
            songSelection.appendChild(songCard.cloneNode(true));
        }
    });
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

// 使用卡牌
function playCard(index, player, position) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = hand[index];
    if (!card) return;
    
    if (card.type === 'buff') {
        const targetArea = document.getElementById(`${player}-buff${position}`);
        const cardElement = createCardElement(card, index, player);
        targetArea.appendChild(cardElement);
    } else if (card.type === 'debuff') {
        const opponent = player === 'player1' ? 'player2' : 'player1';
        const targetArea = document.getElementById(`${opponent}-buff${position}`);
        const cardElement = createCardElement(card, index, player);
        targetArea.appendChild(cardElement);
    }
    
    // 标志卡牌已出
    markCardAsPlayed(index, player);
}

// 使用全局卡牌
function playGlobalCard(index, player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = hand[index];
    if (!card) return;
    
    const targetArea = document.getElementById('global-buff');
    const cardElement = createCardElement(card, index, player);
    targetArea.appendChild(cardElement);
    
    // 标志卡牌已出
    markCardAsPlayed(index, player);
}

// 标志卡牌已出
function markCardAsPlayed(index, player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const cardElement = document.getElementById(`${player}-hand`).querySelectorAll('.card')[index];
    const actionButtons = cardElement.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
        button.disabled = true;
        button.style.backgroundColor = '#ccc';
    });
    
    hand.splice(index, 1);
    updateHandCount(player, hand.length);
    
    // 检查是否完成出卡
    if (hand.length === 0) {
        if (player === 'player1') {
            player1Done = true;
        } else {
            player2Done = true;
        }
        checkBothDone();
    }
}

// 检查是否完成出卡
function checkBothDone() {
    if (player1Done && player2Done) {
        // 显示最终出牌位置
        document.getElementById('next-set').disabled = false;
        triggerPlayCards();
    }
}

// 触发出牌逻辑
function triggerPlayCards() {
    // 这里可以添加自动出牌的逻辑
    // 例如，自动将所有未出的卡牌出到对应区域
    // 或者提示玩家手动出牌
    alert('两边都已完成出卡，请手动出牌！');
}

// 重置出卡状态
function resetPlayState() {
    player1Done = false;
    player2Done = false;
    document.getElementById('next-set').disabled = true;
}