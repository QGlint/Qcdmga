import re
import json
from bs4 import BeautifulSoup
import requests

BASE_WIKI_URL = "https://arcwiki.mcd.blue/"

def get_real_image_url(file_name):
    """
    通过 MediaWiki API 获取文件原图 URL
    file_name: "Songs_ignotus.jpg"
    """
    if not file_name:
        return None
    api_url = BASE_WIKI_URL + "api.php"
    params = {
        "action": "query",
        "titles": f"File:{file_name}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    }
    resp = requests.get(api_url, params=params)
    resp.raise_for_status()
    data = resp.json()
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        imageinfo = page.get("imageinfo")
        if imageinfo:
            return imageinfo[0].get("url")
    return None

def get_table_rows(table):
    """
    处理 rowspan / colspan，返回完整行列列表
    每行都是 td/th 标签列表
    """
    rows = []
    spans = {}  # key=(row_index,col_index), value=(tag,剩余行数)
    
    trs = table.find_all("tr")
    for r, tr in enumerate(trs):
        cols = []
        c_index = 0
        tds = tr.find_all(["td", "th"])
        td_iter = iter(tds)
        
        while True:
            # 填充上一行 rowspan 的占位
            while (r, c_index) in spans:
                tag, remaining = spans[(r, c_index)]
                cols.append(tag)
                if remaining > 1:
                    spans[(r+1, c_index)] = (tag, remaining-1)
                del spans[(r, c_index)]
                c_index += 1
            
            try:
                td = next(td_iter)
            except StopIteration:
                break
            
            colspan = int(td.get("colspan", 1))
            rowspan = int(td.get("rowspan", 1))
            
            for _ in range(colspan):
                cols.append(td)
                if rowspan > 1:
                    spans[(r+1, c_index)] = (td, rowspan-1)
                c_index += 1
        rows.append(cols)
    return rows

def parse_songlist(html_path, song_json_path, pack_json_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, "lxml")
    table = soup.find("table", {"class": "wikitable sortable jquery-tablesorter"})
    if not table:
        raise RuntimeError("未找到曲目表格，请确认 HTML 文件是否正确。")

    diff_names = ["PST", "PRS", "FTR", "ETR", "BYD"]
    music_packs_set = set()
    songs = []

    rows = get_table_rows(table)
    for cols in rows[1:]:  # 跳过表头
        if len(cols) < 6:
            continue

        # 歌名
        title = cols[2].get_text(strip=True)

        # 曲包
        music_pack = cols[4].get_text(strip=True)
        if music_pack:
            music_packs_set.add(music_pack)

        # 曲绘文件名：从 <a href> 获取 MediaWiki 文件名
        cover_file = None
        a_tag = cols[1].find("a", href=True)
        if a_tag:
            href = a_tag['href']
            m = re.search(r'/File:([^/]+)$', href)
            if m:
                cover_file = m.group(1)

        # 获取真实原图 URL
        cover_url = get_real_image_url(cover_file) if cover_file else None

        # 难度
        difficulties = {}
        for i, diff in enumerate(diff_names, start=8):
            val = "/"
            if i < len(cols):
                raw_val = cols[i].get_text(strip=True)
                if raw_val:
                    m = re.match(r'^(\d+\+?)', raw_val)
                    val = m.group(1) if m else "/"
            difficulties[diff] = val

        songs.append({
            "songName": title,
            "coverUrl": cover_url,
            "musicPack": music_pack,
            "difficulties": difficulties
        })
        # print(f"处理成功: {title}")

    # 保存歌曲 JSON
    with open(song_json_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    print(f"已保存 {len(songs)} 首歌曲到 {song_json_path}")

    # 保存曲包 JSON
    music_packs = sorted(list(music_packs_set))
    with open(pack_json_path, "w", encoding="utf-8") as f:
        json.dump(music_packs, f, ensure_ascii=False, indent=2)
    print(f"已保存 {len(music_packs)} 个曲包到 {pack_json_path}")

    return songs, music_packs

# 使用示例
if __name__ == "__main__":
    html_file = "./rff/曲目列表 - Arcaea中文维基.html"
    song_json_file = "./rff/arc_songs.json"
    pack_json_file = "./rff/arc_packs.json"
    parse_songlist(html_file, song_json_file, pack_json_file)
