// 卡牌数据
const cards = [
    { name: "卡牌1", rarity: "common" },
    { name: "卡牌2", rarity: "common" },
    { name: "卡牌3", rarity: "common" },
    { name: "卡牌4", rarity: "rare" },
    { name: "卡牌5", rarity: "rare" },
    { name: "卡牌6", rarity: "epic" },
    { name: "卡牌7", rarity: "epic" },
    { name: "卡牌8", rarity: "legendary" },
    { name: "卡牌9", rarity: "legendary" },
    { name: "卡牌10", rarity: "legendary" }
];

// 玩家抽卡函数
function drawCard(playerId) {
    // 随机选择一张卡牌
    const randomIndex = Math.floor(Math.random() * cards.length);
    const selectedCard = cards[randomIndex];
    
    // 创建卡牌元素
    const cardElement = document.createElement("div");
    cardElement.className = `card ${selectedCard.rarity}`;
    cardElement.innerHTML = `
        <div class="card-name">${selectedCard.name}</div>
        <div class="card-rarity">${selectedCard.rarity}</div>
    `;
    
    // 添加到玩家的卡牌展示区域
    document.getElementById(`${playerId}-cards`).appendChild(cardElement);
}

// 绑定抽卡按钮事件
document.getElementById("player1-draw").addEventListener("click", () => {
    drawCard("player1");
});

document.getElementById("player2-draw").addEventListener("click", () => {
    drawCard("player2");
});