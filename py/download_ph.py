import os
import json
import requests
import urllib.parse

# 萌娘百科的域名，用于设置 Referer
REFERER_DOMAIN = "https://mzh.moegirl.org.cn/"

# 本地图片保存目录
IMAGES_DIR = "images/phigros"
NEW_JSON_FILE = "./rff/phi_songs_git.json"

def download_image(url, save_path):
    """下载图片并保存到本地"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Referer": REFERER_DOMAIN
        }
        print(f"Downloading {url}...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # 检查请求是否成功

        with open(save_path, 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded to {save_path}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {url}: {e}")
        return False

def main():
    """主函数：下载图片并生成新的 JSON 文件"""
    # 确保图片保存目录存在
    os.makedirs(IMAGES_DIR, exist_ok=True)

    # 读取原始 JSON 文件
    try:
        with open('./rff/phi_songs.json', 'r', encoding='utf-8') as f:
            songs_data = json.load(f)
    except FileNotFoundError:
        print("Error: phi_songs.json not found. Make sure the file is in the same directory.")
        return

    updated_songs = []
    
    # 遍历每首歌曲
    for song in songs_data:
        cover_url = song.get("coverUrl")
        
        # 如果 coverUrl 不存在或为空，则跳过
        if not cover_url:
            print(f"Skipping '{song['songName']}', no cover URL found.")
            updated_songs.append(song)
            continue
            
        # 从 URL 中提取文件名
        file_name = os.path.basename(cover_url)
        # 移除 URL 路径中的 '304px-' 前缀
        if '304px-' in file_name:
            file_name = file_name.replace('304px-', '')
        
        save_path = os.path.join(IMAGES_DIR, file_name)
        relative_path = os.path.join(IMAGES_DIR, file_name).replace(os.sep, '/')
        
        # 下载图片
        if download_image(cover_url, save_path):
            song["coverUrl"] = relative_path
        
        updated_songs.append(song)

    # 保存新的 JSON 文件
    with open(NEW_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_songs, f, indent=2, ensure_ascii=False)
        
    print(f"\nAll done! New JSON file saved as {NEW_JSON_FILE}")

if __name__ == "__main__":
    main()