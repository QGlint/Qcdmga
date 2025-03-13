import os
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# 目标页面URL
url = "https://arcwiki.mcd.blue/%E6%9B%B2%E7%9B%AE%E5%88%97%E8%A1%A8"

# 创建存储目录
base_dir = "./card_drawing"
img_dir = os.path.join(base_dir, "images")
os.makedirs(img_dir, exist_ok=True)

# 配置请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# 存储结果的列表
song_list = []

def get_original_image_url(img_src):
    """处理缩略图URL转换为原始高清图URL"""
    original_path = img_src.replace("/thumb", "", 1)
    original_path = original_path.rsplit("/", 1)[0]  # 分割最后一个斜杠后的内容
    return original_path

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 定位第二个表格
    tables = soup.find_all('table')
    if len(tables) < 2:
        raise ValueError("页面中不足两个表格")
    table = tables[1]

    for row in table.find_all('tr')[1:]:
        columns = row.find_all('td')
        
        if len(columns) >= 3:
            img_tag = columns[1].find('img')
            if img_tag and 'src' in img_tag.attrs:
                # 获取处理后的高清图URL
                original_path = get_original_image_url(img_tag['src'])
                img_url = urljoin(url, original_path)
                
                # 提取歌曲标题
                song_name = columns[2].get_text(strip=True)
                
                # 获取原始图片文件名
                img_filename = os.path.basename(original_path)
                
                # 下载图片
                img_path = os.path.join(img_dir, img_filename)
                try:
                    img_response = requests.get(img_url, headers=headers)
                    img_response.raise_for_status()
                    
                    # 保存图片
                    with open(img_path, 'wb') as f:
                        f.write(img_response.content)
                    
                    # 添加到结果列表
                    song_list.append({
                        "song_name": song_name,
                        "image_path": os.path.normpath(os.path.join("images", img_filename))
                    })
                    print(f'下载成功: {song_name} ({img_filename})')
                    
                except Exception as img_e:
                    print(f'下载失败 {song_name}: {str(img_e)}')

except Exception as e:
    print(f'发生错误: {str(e)}')

# 保存JSON文件
json_path = os.path.join(base_dir, 'arcaea.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(song_list, f, ensure_ascii=False, indent=2)

print(f'完成！共处理{len(song_list)}首曲目')