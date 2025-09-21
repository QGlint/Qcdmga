import os
import json
import requests
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

# 萌娘百科的域名，用于设置 Referer
REFERER_DOMAIN = "https://mzh.moegirl.org.cn/"

# 本地图片保存目录
IMAGES_DIR = "images/phigros"
NEW_JSON_FILE = "./rff/phi_songs_git.json"
MAX_WORKERS = 10  # 最大线程数

# 特殊文件名列表，这些文件名不需要被解码
SPECIAL_FILENAMES = [
    "FULi_Phigros_2048%2A1080.png",
    "Palescreen_Phigros_2048%2A1080.png"
]

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

def process_song(song):
    """处理单首歌曲的下载任务，返回更新后的歌曲数据或 None"""
    cover_url = song.get("coverUrl")
    
    if not cover_url:
        print(f"Skipping '{song.get('songName', '')}', no cover URL found.")
        return song
        
    # 从 URL 中提取编码后的文件名
    file_name_encoded = os.path.basename(cover_url)
    
    # 移除 URL 路径中的 '304px-' 前缀
    if '304px-' in file_name_encoded:
        file_name_encoded = file_name_encoded.replace('304px-', '', 1)
        
    # 特殊判断：如果文件名在特殊列表中，则不进行解码
    if file_name_encoded in SPECIAL_FILENAMES:
        file_name_to_save = file_name_encoded
    else:
        # 否则，将编码后的文件名解码
        file_name_to_save = urllib.parse.unquote(file_name_encoded)
    
    save_path = os.path.join(IMAGES_DIR, file_name_to_save)
    relative_path = os.path.join(IMAGES_DIR, file_name_to_save).replace(os.sep, '/')
    
    if download_image(cover_url, save_path):
        song["coverUrl"] = relative_path
        return song
    else:
        # 下载失败则返回 None，后续可以过滤掉
        return None

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

    print(f"Starting to download {len(songs_data)} images using {MAX_WORKERS} workers...")
    
    updated_songs = []
    
    # 使用线程池并发下载
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # map() 会将 songs_data 中的每个元素传递给 process_song 函数
        results = executor.map(process_song, songs_data)
        
        # 收集成功的结果
        for result in results:
            if result is not None:
                updated_songs.append(result)

    # 保存新的 JSON 文件
    with open(NEW_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_songs, f, indent=2, ensure_ascii=False)
        
    print(f"\nAll done! New JSON file saved as {NEW_JSON_FILE}")

if __name__ == "__main__":
    main()
