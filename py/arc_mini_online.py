import json
import os

# 输入输出文件路径
input_file = "./rff/arc_songs.json"          # 原始 JSON
output_file = "./rff/arc_songs_mini.json"  # 输出 JSON

def process_cover_url(url: str) -> str:
    """
    把 URL 从 .../xxx.jpg 转换为 .../xxx.jpg/256px-xxx.jpg
    """
    filename = os.path.basename(url)  # 取 Songs_sayonarahatsukoi.jpg
    return f"{url}/256px-{filename}"

def main():
    # 读取原始 JSON
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 如果是列表就逐个处理
    if isinstance(data, list):
        for song in data:
            if "coverUrl" in song:
                song["coverUrl"] = process_cover_url(song["coverUrl"])
    # 如果是单个 dict
    elif isinstance(data, dict):
        if "coverUrl" in data:
            data["coverUrl"] = process_cover_url(data["coverUrl"])

    # 写入新文件
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
