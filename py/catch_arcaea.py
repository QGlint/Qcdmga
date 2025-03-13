import os
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# 目标页面URL
url = "https://arcwiki.mcd.blue/%E6%9B%B2%E7%9B%AE%E5%88%97%E8%A1%A8"

# 创建存储目录（多级目录自动创建）
base_dir = "../card_drawing"
img_dir = os.path.join(base_dir, "images")
os.makedirs(img_dir, exist_ok=True)

# 配置请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# 存储结果的列表
song_list = []

try:
    # 获取页面内容
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # 解析HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 定位主表格（假设是页面中的第一个表格）
    table = soup.find('table')
    
    # 遍历表格行（跳过表头）
    for row in table.find_all('tr')[1:]:
        columns = row.find_all('td')
        
        # 确保有足够的列
        if len(columns) >= 3:
            # 提取封面图片URL（第二列）
            img_tag = columns[1].find('img')
            if img_tag and 'src' in img_tag.attrs:
                img_url = urljoin(url, img_tag['src'])
                
                # 提取歌曲标题（第三列）
                song_name = columns[2].get_text(strip=True)
                
                # 清理文件名中的非法字符
                safe_name = "".join(c for c in song_name if c not in r'\/:*?"<>|').strip()
                if not safe_name:
                    continue
                
                # 下载图片
                img_path = os.path.join(img_dir, f'{safe_name}.jpg')
                try:
                    img_response = requests.get(img_url, headers=headers)
                    img_response.raise_for_status()
                    
                    # 保存图片
                    with open(img_path, 'wb') as f:
                        f.write(img_response.content)
                    
                    # 添加到结果列表（使用相对路径存储）
                    song_list.append({
                        "song_name": song_name,
                        "image_path": os.path.normpath(os.path.join("images", f'{safe_name}.jpg'))
                    })
                    print(f'下载成功: {song_name}')
                    
                except Exception as img_e:
                    print(f'下载失败 {song_name}: {str(img_e)}')
                    continue

except Exception as e:
    print(f'发生错误: {str(e)}')

# 保存JSON文件
json_path = os.path.join(base_dir, 'arcaea.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(song_list, f, ensure_ascii=False, indent=2)

print(f'完成！共处理{len(song_list)}首曲目')