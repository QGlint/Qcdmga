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
    initializeSongSelection();
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

// 初始化选歌区域
function initializeSongSelection() {
    const songSelectionDialog = document.getElementById('song-selection-dialog');
    const songAreasContainer = createSongAreas();
    songSelectionDialog.querySelector('.song-areas').replaceWith(songAreasContainer);
}

// 创建歌曲区域
function createSongAreas() {
    const songAreasContainer = document.createElement('div');
    songAreasContainer.className = 'song-areas';

    for (let i = 0; i < 3; i++) {
        const songArea = document.createElement('div');
        songArea.className = 'song-area';
        songArea.dataset.index = i;

        const songCard = document.createElement('div');
        songCard.className = 'song-card';

        const songCardInner = document.createElement('div');
        songCardInner.className = 'song-card-inner';

        const songCardContent = document.createElement('div');
        songCardContent.className = 'song-card-content';
        // songCardContent.textContent = '歌曲名称';

        songCard.appendChild(songCardInner);
        songCard.appendChild(songCardContent);
        songArea.appendChild(songCard);

        songArea.addEventListener('click', () => {
            showSongSearchDialog(songArea.dataset.index);
        });

        songAreasContainer.appendChild(songArea);
    }
    updateRoundStyles();
    return songAreasContainer;
}

function updateRoundStyles() {
    const songCards = document.querySelectorAll('.song-card');
    songCards.forEach((card, index) => {
            card.style.backgroundColor = '#ffc0cb';
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
// 创建卡牌元素
function createCardElement(card, index, player) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.style.backgroundColor = getCardColor(card.type);

    // 检查卡牌是否已被标记为已出
    if (card.played) {
        cardElement.style.opacity = '0.5';
    }

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
    
    // 获取现有的 song-search-container 和 song-results 元素
    const searchContainer = songArea.querySelector('.song-search-container');
    const resultsContainer = songArea.querySelector('.song-results');
    
    // 如果没有现有的 song-search-container，则创建一个新的
    if (!searchContainer) {
        songArea.insertAdjacentHTML('beforeend', `
            <div class="song-search-container">
                <input type="text" id="song-search-input-${index}" placeholder="输入歌曲名搜索...">
            </div>
            <div class="song-results" id="song-results-${index}">
                <!-- 搜索结果将在这里动态生成 -->
            </div>
        `);
    }
    
    // 获取输入框元素
    const searchInput = document.getElementById(`song-search-input-${index}`);
    
    // 为输入框绑定事件监听器
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchSongs(e.target.value, index);
        });
        
        // 确保输入框可以获取焦点
        searchInput.focus();
    }
}

// 选择歌曲
function selectSong(song, index) {
    console.log('Selecting song:', song, 'for index:', index); // 调试信息

    const songArea = document.querySelector(`.song-area[data-index="${index}"]`);
    console.log('Song area:', songArea); // 调试信息

    const songCardInner = songArea.querySelector('.song-card-inner');
    const songCardContent = songArea.querySelector('.song-card-content');

    // 使用img标签加载图片
    const img = new Image();
    img.src = song.image_url;
    img.onload = () => {
        // 图片加载完成后更新背景
        songCardInner.style.backgroundImage = `url('${song.image_url}')`;
        songCardInner.style.backgroundSize = 'cover';
        songCardInner.style.backgroundPosition = 'center';
        songCardContent.textContent = song.song_name;

        console.log('Updated song card inner style:', songCardInner.style.backgroundImage); // 调试信息
        console.log('Updated song card content:', songCardContent.textContent); // 调试信息

            document.getElementById('start-round').style.display = 'block';

    };
}

// 搜索歌曲
function searchSongs(searchTerm, index) {
    console.log('Searching songs with term:', searchTerm, 'for index:', index); // 调试信息
    
    const resultsContainer = document.getElementById(`song-results-${index}`);
    resultsContainer.innerHTML = '';

    songData.forEach(song => {
        if (song.song_name.toLowerCase().includes(searchTerm.toLowerCase())) {
            const resultElement = document.createElement('div');
            resultElement.className = 'song-result';
            resultElement.innerHTML = `
                <div class="song-result-name">${song.song_name}</div>
            `;
            resultElement.addEventListener('click', () => {
                console.log('Song result clicked:', song); // 调试信息
                selectSong(song, index);
            });
            resultsContainer.appendChild(resultElement);
        }
    });
    
    console.log('Search results count:', resultsContainer.children.length); // 调试信息
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

// 使用卡牌
function playCard(index, player, position) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = hand[index];
    if (!card) return;

    // 标记卡牌为已出
    markCardAsPlayed(index, player, position);
}

// 标记全局卡牌为已出，但不立即执行
function playGlobalCard(index, player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = hand[index];
    if (!card) return;

    // 标记卡牌为已出
    markCardAsPlayed(index, player, 'global');
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
    // 处理擂主的出牌
    processPlayedCards('player1');
    // 处理挑战者的出牌
    processPlayedCards('player2');

    // 重置出卡状态
    resetPlayState();
}

// 处理已标记的出牌
function processPlayedCards(player) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const handContainer = document.getElementById(`${player}-hand`);

    hand.forEach((card, index) => {
        if (card.played) {
            if (card.type === 'buff' && card.position !== 'global') {
                const targetArea = document.getElementById(`${player}-buff${card.position}`);
                const newCardElement = createPlayedCardElement(card); // 创建新的卡牌元素
                targetArea.appendChild(newCardElement);
            } else if (card.type === 'debuff' && card.position !== 'global') {
                const opponent = player === 'player1' ? 'player2' : 'player1';
                const targetArea = document.getElementById(`${opponent}-buff${card.position}`);
                const newCardElement = createPlayedCardElement(card); // 创建新的卡牌元素
                targetArea.appendChild(newCardElement);
            } else if (card.type === 'global' && card.position === 'global') {
                const targetArea = document.getElementById('global-buff');
                const newCardElement = createPlayedCardElement(card); // 创建新的卡牌元素
                targetArea.appendChild(newCardElement);
            }

            // 从手牌中移除已出的卡牌
            hand.splice(index, 1);
            updateHandCount(player, hand.length);
        }
    });

    // 重新渲染手牌
    renderHand(player);
}

// 重置出卡状态
function resetPlayState() {
    player1Done = false;
    player2Done = false;
    document.getElementById('next-set').disabled = true;

    // 清除卡牌的 played 标记
    player1Hand.forEach(card => delete card.played);
    player2Hand.forEach(card => delete card.played);
}

// 标记卡牌为已出
function markCardAsPlayed(index, player, position) {
    const hand = player === 'player1' ? player1Hand : player2Hand;
    const card = hand[index];
    if (!card) return;

    // 更新手牌数组，标记卡牌为已出
    card.played = true;
    card.position = position;

    // 更新界面，按钮变灰
    const cardElement = document.getElementById(`${player}-hand`).querySelectorAll('.card')[index];
    const actionButtons = cardElement.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.disabled = true;
        button.style.backgroundColor = '#ccc';
    });

    // 检查是否完成出卡
    if (hand.every(card => card.played)) {
        if (player === 'player1') {
            player1Done = true;
        } else {
            player2Done = true;
        }
        checkBothDone();
    }
}

// 创建已出牌的卡牌元素
function createPlayedCardElement(card) {
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