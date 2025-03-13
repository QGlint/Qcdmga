document.addEventListener('DOMContentLoaded', function() {
    // 从 JSON 文件加载题目数据
    let questions = [];
    let drawnIndices = [];
    
    // 获取DOM元素
    const imageBoxes = [document.getElementById('image1'), document.getElementById('image2'), document.getElementById('image3')];
    const titleBoxes = [document.getElementById('title1'), document.getElementById('title2'), document.getElementById('title3')];
    const drawButton = document.getElementById('draw-button');
    const nextButton = document.getElementById('next-button');

    // 从 JSON 文件加载数据
    async function loadQuestions() {
        try {
            const response = await fetch('arcaea_online.json');
            questions = await response.json();
            console.log('加载题目成功:', questions);
        } catch (error) {
            console.error('加载题目失败:', error);
            alert('加载题目失败，请检查网络连接或文件路径');
        }
    }

    // 抽取题目函数
    function drawQuestions() {
        if (drawnIndices.length >= questions.length) {
            alert('题目已抽完！');
            drawButton.disabled = true;
            return;
        }
        
        // 随机选择3个不同的题目
        let selected = [];
        while (selected.length < 3) {
            let index = Math.floor(Math.random() * questions.length);
            if (!drawnIndices.includes(index) && !selected.includes(index)) {
                selected.push(index);
            }
        }
        
        // 更新已抽取的题目索引
        drawnIndices = [...drawnIndices, ...selected];
        
        // 显示题目
        for (let i = 0; i < 3; i++) {
            const question = questions[selected[i]];
            imageBoxes[i].innerHTML = `<img src="${question.image_url}" alt="${question.song_name}">`;
            titleBoxes[i].textContent = question.song_name;
        }
        
        // 显示下一位按钮
        nextButton.style.display = 'inline-block';
    }

    // 下一位函数
    function nextRound() {
        // 重置显示
        for (let i = 0; i < 3; i++) {
            imageBoxes[i].innerHTML = '<span class="question-mark">?</span>';
            titleBoxes[i].textContent = '';
        }
        
        // 隐藏下一位按钮
        nextButton.style.display = 'none';
        
        // 如果还有剩余题目，可以继续抽取
        if (drawnIndices.length < questions.length) {
            drawButton.disabled = false;
        }
    }

    // 绑定事件
    drawButton.addEventListener('click', drawQuestions);
    nextButton.addEventListener('click', nextRound);

    // 初始化加载题目
    loadQuestions();
});