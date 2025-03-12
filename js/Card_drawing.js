// 卡牌数据
const cards = [
    { name: "卡牌1", type: "buff", rarity: "common", duration: 0 },
    { name: "卡牌2", type: "debuff", rarity: "common", duration: 0 },
    { name: "卡牌3", type: "global", rarity: "common", duration: 0 },
    { name: "卡牌4", type: "buff", rarity: "rare", duration: 1 },
    { name: "卡牌5", type: "debuff", rarity: "rare", duration: 1 },
    { name: "卡牌6", type: "global", rarity: "rare", duration: 1 },
    { name: "卡牌7", type: "buff", rarity: "epic", duration: 2 },
    { name: "卡牌8", type: "debuff", rarity: "epic", duration: 2 },
    { name: "卡牌9", type: "global", rarity: "epic", duration: 2 },
    { name: "卡牌10", type: "buff", rarity: "legendary", duration: 0 },
    { name: "卡牌11", type: "debuff", rarity: "legendary", duration: 0 },
    { name: "卡牌12", type: "global", rarity: "legendary", duration: 0 }
];

let round = 0;
let set = 0;
let player1Wins = 0;

// 更新回合和局数显示
function updateRoundAndSet() {
    document.getElementById("round").textContent = round;
    document.getElementById("set").textContent = set;
    document.getElementById("player1-wins").textContent = `胜利次数: ${player1Wins}`;
}

// 玩家抽卡函数
function drawCard(playerId) {
    const playerHandElement = document.getElementById(`${playerId}-hand`);
    
    // 随机选择一张卡牌
    const randomIndex = Math.floor(Math.random() * cards.length);
    const selectedCard = cards[randomIndex];
    
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

// 初始化回合和局数
updateRoundAndSet();

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