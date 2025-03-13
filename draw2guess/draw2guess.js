document.addEventListener('DOMContentLoaded', function() {
    // 从两个 JSON 文件加载题目数据
    let arcaeaQuestions = [];
    let phigrosQuestions = [];
    let allQuestions = [];
    let drawnIndices = [];
    
    // 获取DOM元素
    const imageBoxes = [document.getElementById('image1'), document.getElementById('image2'), document.getElementById('image3')];
    const titleBoxes = [document.getElementById('title1'), document.getElementById('title2'), document.getElementById('title3')];
    const drawButton = document.getElementById('draw-button');
    const nextButton = document.getElementById('next-button');

    // 从 JSON 文件加载数据
    async function loadQuestions() {
        try {
            // 加载 Arcaea 题目
            const arcaeaResponse = await fetch('arcaea_online.json');
            arcaeaQuestions = await arcaeaResponse.json();
            
            // 加载 Phigros 题目
            const phigrosResponse = await fetch('phigros.json');
            phigrosQuestions = await phigrosResponse.json();
            
            // 合并两个数组
            allQuestions = [...arcaeaQuestions, ...phigrosQuestions];
            console.log('加载题目成功:', allQuestions);
        } catch (error) {
            console.error('加载题目失败:', error);
            alert('加载题目失败，请检查网络连接或文件路径');
        }
    }

    // 抽取题目函数
    function drawQuestions() {
        if (drawnIndices.length >= allQuestions.length) {
            alert('题目已抽完！');
            drawButton.disabled = true;
            return;
        }
        
        // 随机选择3个不同的题目
        let selected = [];
        while (selected.length < 3) {
            let index = Math.floor(Math.random() * allQuestions.length);
            if (!drawnIndices.includes(index) && !selected.includes(index)) {
                selected.push(index);
            }
        }
        
        // 更新已抽取的题目索引
        drawnIndices = [...drawnIndices, ...selected];
        
        // 显示题目
        for (let i = 0; i < 3; i++) {
            const question = allQuestions[selected[i]];
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
        if (drawnIndices.length < allQuestions.length) {
            drawButton.disabled = false;
        }
    }

    // 绑定事件
    drawButton.addEventListener('click', drawQuestions);
    nextButton.addEventListener('click', nextRound);

    // 初始化加载题目
    loadQuestions();
});document.addEventListener('DOMContentLoaded', function() {
    // 从两个 JSON 文件加载题目数据
    let arcaeaQuestions = [];
    let phigrosQuestions = [];
    let allQuestions = [];
    let drawnIndices = [];
    
    // 获取DOM元素
    const imageBoxes = [document.getElementById('image1'), document.getElementById('image2'), document.getElementById('image3')];
    const titleBoxes = [document.getElementById('title1'), document.getElementById('title2'), document.getElementById('title3')];
    const drawButton = document.getElementById('draw-button');
    const nextButton = document.getElementById('next-button');

    // 从 JSON 文件加载数据
    async function loadQuestions() {
        try {
            // 加载 Arcaea 题目
            const arcaeaResponse = await fetch('arcaea_online.json');
            arcaeaQuestions = await arcaeaResponse.json();
            
            // 加载 Phigros 题目
            const phigrosResponse = await fetch('phigros.json');
            phigrosQuestions = await phigrosResponse.json();
            
            // 合并两个数组
            allQuestions = [...arcaeaQuestions, ...phigrosQuestions];
            console.log('加载题目成功:', allQuestions);
        } catch (error) {
            console.error('加载题目失败:', error);
            alert('加载题目失败，请检查网络连接或文件路径');
        }
    }

    // 抽取题目函数
    function drawQuestions() {
        if (drawnIndices.length >= allQuestions.length) {
            alert('题目已抽完！');
            drawButton.disabled = true;
            return;
        }
        
        // 随机选择3个不同的题目
        let selected = [];
        while (selected.length < 3) {
            let index = Math.floor(Math.random() * allQuestions.length);
            if (!drawnIndices.includes(index) && !selected.includes(index)) {
                selected.push(index);
            }
        }
        
        // 更新已抽取的题目索引
        drawnIndices = [...drawnIndices, ...selected];
        
        // 显示题目
        for (let i = 0; i < 3; i++) {
            const question = allQuestions[selected[i]];
            // 检查是否有本地路径，如果有则优先使用本地路径
            if (question.local_path) {
                imageBoxes[i].innerHTML = `<img src="${question.local_path}" alt="${question.song_name}">`;
            } else {
                imageBoxes[i].innerHTML = `<img src="${question.image_url}" alt="${question.song_name}">`;
            }
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
        if (drawnIndices.length < allQuestions.length) {
            drawButton.disabled = false;
        }
    }

    // 绑定事件
    drawButton.addEventListener('click', drawQuestions);
    nextButton.addEventListener('click', nextRound);

    // 初始化加载题目
    loadQuestions();
});