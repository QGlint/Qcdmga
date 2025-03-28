document.addEventListener('DOMContentLoaded', function() {
    // 从两个 JSON 文件加载题目数据
    let arcaeaQuestions = [];
    let phigrosQuestions = [];
    let allQuestions = [];
    let drawnIndices = {
        arcaea: [],
        phigros: [],
        mixed: []
    }; // 使用对象来存储每种模式的已抽取索引
    
    // 获取DOM元素
    const imageBoxes = [document.getElementById('image1'), document.getElementById('image2'), document.getElementById('image3')];
    const titleBoxes = [document.getElementById('title1'), document.getElementById('title2'), document.getElementById('title3')];
    const drawButton = document.getElementById('draw-button');
    const nextButton = document.getElementById('next-button');
    
    // 题库选择按钮
    const arcaeaBtn = document.getElementById('arcaea-button');
    const phigrosBtn = document.getElementById('phigros-button');
    const mixedBtn = document.getElementById('mixed-button');
    
    // 当前选择的题库模式
    let currentMode = 'mixed'; // 默认混题库
    
    // 从 JSON 文件加载数据
    async function loadQuestions() {
        try {
            // 加载 Arcaea 题目
            // const arcaeaResponse = await fetch('arcaea_online.json');
            const arcaeaResponse = await fetch('arcaea_2025_3.json');
            arcaeaQuestions = await arcaeaResponse.json();
            
            // 加载 Phigros 题目
            // const phigrosResponse = await fetch('phigros.json');
            const phigrosResponse = await fetch('phigros_2025_3.json');
            phigrosQuestions = await phigrosResponse.json();
            
            // 合并两个数组
            allQuestions = [...arcaeaQuestions, ...phigrosQuestions];
            console.log('加载题目成功:', allQuestions);
        } catch (error) {
            console.error('加载题目失败:', error);
            alert('加载题目失败，请检查网络连接或文件路径');
        }
    }
    
    // 更新题库按钮状态
    function updateModeButtons() {
        arcaeaBtn.classList.remove('active');
        phigrosBtn.classList.remove('active');
        mixedBtn.classList.remove('active');
        
        if (currentMode === 'arcaea') {
            arcaeaBtn.classList.add('active');
        } else if (currentMode === 'phigros') {
            phigrosBtn.classList.add('active');
        } else if (currentMode === 'mixed') {
            mixedBtn.classList.add('active');
        }
    }
    
    // 抽取题目函数
    function drawQuestions() {
        let currentQuestions = [];
        let currentDrawnIndices = [];
        
        if (currentMode === 'arcaea') {
            currentQuestions = arcaeaQuestions;
            currentDrawnIndices = drawnIndices.arcaea;
        } else if (currentMode === 'phigros') {
            currentQuestions = phigrosQuestions;
            currentDrawnIndices = drawnIndices.phigros;
        } else if (currentMode === 'mixed') {
            currentQuestions = allQuestions;
            currentDrawnIndices = drawnIndices.mixed;
        }
        
        // 计算剩余可抽取的题目数量
        const remainingQuestions = currentQuestions.length - currentDrawnIndices.length;
        
        if (remainingQuestions === 0) {
            alert('题目已抽完！');
            drawButton.disabled = true;
            return;
        }
        
        // 如果剩余题目不足3个，显示剩余题目和问号
        const needed = Math.min(3, remainingQuestions);
        let selected = [];
        let counter = 0;
        const MAX_ITERATIONS = 1000;
        
        while (selected.length < needed) {
            if (counter >= MAX_ITERATIONS) {
                console.error("死循环检测：循环迭代次数过多，强制终止。");
                break;
            }
            
            let index = Math.floor(Math.random() * currentQuestions.length);
            if (!currentDrawnIndices.includes(index) && !selected.includes(index)) {
                selected.push(index);
            }
            counter++;
        }
        
        // 更新已抽取的题目索引
        if (currentMode === 'arcaea') {
            drawnIndices.arcaea = [...drawnIndices.arcaea, ...selected];
        } else if (currentMode === 'phigros') {
            drawnIndices.phigros = [...drawnIndices.phigros, ...selected];
        } else if (currentMode === 'mixed') {
            drawnIndices.mixed = [...drawnIndices.mixed, ...selected];
        }
        
        // 显示题目，不足的部分显示问号
        for (let i = 0; i < 3; i++) {
            if (i < selected.length) {
                const question = currentQuestions[selected[i]];
                if (question.local_path) {
                    imageBoxes[i].innerHTML = `<img src="${question.local_path}" alt="${question.song_name}">`;
                } else {
                    imageBoxes[i].innerHTML = `<img src="${question.image_url}" alt="${question.song_name}">`;
                }
                titleBoxes[i].textContent = question.song_name;
            } else {
                imageBoxes[i].innerHTML = '<span class="question-mark">?</span>';
                titleBoxes[i].textContent = '';
            }
        }
        
        // 如果题目已抽完，提示用户
        if (remainingQuestions === needed) {
            alert('题目已抽完！');
            drawButton.disabled = true;
        }
        
        // 显示下一位按钮
        nextButton.style.display = 'inline-block';
        drawButton.style.display = 'none';
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
        drawButton.style.display = 'inline-block';

        // 如果还有剩余题目，可以继续抽取
        let currentQuestions = [];
        let currentDrawnIndices = [];
        
        if (currentMode === 'arcaea') {
            currentQuestions = arcaeaQuestions;
            currentDrawnIndices = drawnIndices.arcaea;
        } else if (currentMode === 'phigros') {
            currentQuestions = phigrosQuestions;
            currentDrawnIndices = drawnIndices.phigros;
        } else if (currentMode === 'mixed') {
            currentQuestions = allQuestions;
            currentDrawnIndices = drawnIndices.mixed;
        }
        
        if (currentDrawnIndices.length < currentQuestions.length) {
            drawButton.disabled = false;
        }
    }
    
    // 切换题库模式
    function switchMode(mode) {
        currentMode = mode;
        updateModeButtons();
        nextRound(); // 重置显示
    }
    
    // 绑定事件
    drawButton.addEventListener('click', drawQuestions);
    nextButton.addEventListener('click', nextRound);
    
    arcaeaBtn.addEventListener('click', () => switchMode('arcaea'));
    phigrosBtn.addEventListener('click', () => switchMode('phigros'));
    mixedBtn.addEventListener('click', () => switchMode('mixed'));
    
    // 初始化加载题目
    loadQuestions();
});