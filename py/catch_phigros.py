import os
import json
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re

# 创建文件夹
base_dir = os.path.dirname(os.path.abspath(__file__))
images_dir = os.path.join(base_dir, 'phigros_images')
if not os.path.exists(images_dir):
    os.makedirs(images_dir)

# 初始化数据存储
phigros_data = []
phigros_online_data = []

# 定义爬取函数
def crawl_phigros(url, vol):
    # 使用selenium获取动态加载的网页内容
    driver = webdriver.Chrome()
    driver.get(url)
    # 等待页面加载完成
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'body'))
    )
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    driver.quit()
    
    if vol in [1, 2]:
        figures = soup.find_all('figure', class_='img-box')
        for figure in figures:
            img = figure.find('img')
            if img and img.get('data-src'):
                img_url = img['data-src']
                # 确保URL格式正确
                if not img_url.startswith('http'):
                    img_url = 'https:' + img_url
                figcaption = figure.find('figcaption', class_='caption')
                if figcaption:
                    song_name = figcaption.get_text().split('【')[0].strip()
                    # 清理文件名中的非法字符
                    song_name = re.sub(r'[\\/*?:"<>|]', '', song_name)
                    # 下载图片
                    try:
                        img_response = requests.get(img_url)
                        img_response.raise_for_status()
                    except requests.exceptions.RequestException as e:
                        print(f"Failed to download image {img_url}: {e}")
                        continue
                    img_name = os.path.join(images_dir, f"{song_name}.avif")
                    with open(img_name, 'wb') as f:
                        f.write(img_response.content)
                    # 添加到数据
                    phigros_data.append({'song_name': song_name, 'local_path': img_name})
                    phigros_online_data.append({'song_name': song_name, 'online_url': img_url})
    elif vol in [3, 4]:
        opus_para_pics = soup.find_all('div', class_='opus-para-pic')
        for opus_para_pic in opus_para_pics:
            img = opus_para_pic.find('img')
            if img and img.get('src'):
                img_url = img['src']
                # 确保URL格式正确
                if not img_url.startswith('http'):
                    img_url = 'https:' + img_url
                p_tag = opus_para_pic.find_next('p', style='text-align:center;')
                if p_tag:
                    song_name = p_tag.get_text().split('【')[0].strip()
                    # 清理文件名中的非法字符
                    song_name = re.sub(r'[\\/*?:"<>|]', '', song_name)
                    # 下载图片
                    try:
                        img_response = requests.get(img_url)
                        img_response.raise_for_status()
                    except requests.exceptions.RequestException as e:
                        print(f"Failed to download image {img_url}: {e}")
                        continue
                    img_name = os.path.join(images_dir, f"{song_name}.avif")
                    with open(img_name, 'wb') as f:
                        f.write(img_response.content)
                    # 添加到数据
                    phigros_data.append({'song_name': song_name, 'local_path': img_name})
                    phigros_online_data.append({'song_name': song_name, 'online_url': img_url})

# 爬取各个网页
urls = [
    ('https://www.bilibili.com/read/cv8612568/?opus_fallback=1', 1),
    ('https://www.bilibili.com/read/cv11614111/?opus_fallback=1', 2),
    ('https://www.bilibili.com/opus/824538338226602048', 3),
    ('https://www.bilibili.com/opus/1036432259197960195', 4)
]

for url, vol in urls:
    crawl_phigros(url, vol)

# 写入JSON文件
with open(os.path.join(base_dir, 'phigros.json'), 'w', encoding='utf-8') as f:
    json.dump(phigros_data, f, ensure_ascii=False, indent=4)

with open(os.path.join(base_dir, 'phigros_online.json'), 'w', encoding='utf-8') as f:
    json.dump(phigros_online_data, f, ensure_ascii=False, indent=4)

print("爬取完成，数据已写入JSON文件")