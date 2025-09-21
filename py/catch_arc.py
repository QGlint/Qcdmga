import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup

# ======================
# LeanCloud 配置
# ======================
APP_ID = "cDohc5rHqvsDFUFfHuu88vlh-gzGzoHsz"
APP_KEY = "uZ0PvgJAvH9tRHOzaHYHfLj8"
CLASS_NAME = "arcaea"
BASE_URL = "https://cdohc5rh.lc-cn-n1-shared.com/1.1"

HEADERS = {
    "X-LC-Id": APP_ID,
    "X-LC-Key": APP_KEY,
    "Content-Type": "application/json"
}

BASE_WIKI_URL = "https://arcwiki.mcd.blue/"

# ======================
# 获取真实曲绘 URL
# ======================
def get_real_image_url(file_name):
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
    pages = resp.json().get("query", {}).get("pages", {})
    for page in pages.values():
        imageinfo = page.get("imageinfo")
        if imageinfo:
            return imageinfo[0].get("url")
    return None

# ======================
# 处理 rowspan / colspan
# ======================
def get_table_rows(table):
    rows = []
    spans = {}  # key=(row_index,col_index), value=(tag,剩余行数)
    
    trs = table.find_all("tr")
    for r, tr in enumerate(trs):
        cols = []
        c_index = 0
        tds = tr.find_all(["td", "th"])
        td_iter = iter(tds)
        
        while True:
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

# ======================
# 解析 HTML
# ======================
def parse_songlist(html_path):
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
    for cols in rows[1:]:
        if len(cols) < 6:
            continue

        # 歌名
        title = cols[2].get_text(strip=True)

        # 曲包
        music_pack = cols[4].get_text(strip=True)
        if music_pack:
            music_packs_set.add(music_pack)

        # 曲绘文件名
        cover_file = None
        a_tag = cols[1].find("a", href=True)
        if a_tag:
            href = a_tag['href']
            m = re.search(r'/File:([^/]+)$', href)
            if m:
                cover_file = m.group(1)
        cover_url = get_real_image_url(cover_file) if cover_file else None

        # 难度
        difficulties = {}
        diff_index = 0
        for col in cols:
            text = col.get_text(strip=True)
            if re.match(r'^(\d+\+?|/)$', text) and diff_index < len(diff_names):
                difficulties[diff_names[diff_index]] = text
                diff_index += 1
        for i in range(diff_index, len(diff_names)):
            difficulties[diff_names[i]] = "/"

        songs.append({
            "songName": title,
            "coverUrl": cover_url,
            "musicPack": music_pack,
            "difficulties": difficulties
        })

    return songs, sorted(list(music_packs_set))

# ======================
# 批量存入 LeanCloud
# ======================
def save_to_leancloud_batch(songs, batch_size=500, max_retries=3, retry_delay=2):
    BATCH_URL = f"{BASE_URL}/batch"
    requests_payload = []

    for song in songs:
        obj = {
            "method": "POST",
            "path": f"/1.1/classes/{CLASS_NAME}",
            "body": song  # 整个歌曲对象上传
        }
        requests_payload.append(obj)

    total_saved = 0
    for i in range(0, len(requests_payload), batch_size):
        batch = requests_payload[i:i+batch_size]
        for attempt in range(1, max_retries + 1):
            try:
                res = requests.post(
                    BATCH_URL,
                    headers=HEADERS,
                    data=json.dumps({"requests": batch}),
                    timeout=10
                )
                if res.status_code != 200:
                    raise RuntimeError(f"批量保存失败: {res.status_code} {res.text}")
                results = res.json()
                errors = [r for r in results if "error" in r]
                if errors:
                    raise RuntimeError(f"批量保存部分失败: {errors}")
                total_saved += len(results)
                print(f"✅ 已保存 {total_saved}/{len(requests_payload)} 条")
                break
            except requests.exceptions.RequestException as e:
                print(f"⚠️ 请求异常，重试 {attempt}/{max_retries}... {e}")
                time.sleep(retry_delay)
        else:
            raise RuntimeError(f"批量保存失败: 第 {i // batch_size + 1} 批次无法提交")
    print(f"🎉 全部保存完成，共 {total_saved} 条记录。")


# ======================
# 主流程
# ======================
if __name__ == "__main__":
    html_path = os.path.join(os.path.dirname(__file__), "../rff/曲目列表 - Arcaea中文维基.html")
    song_json_path = os.path.join(os.path.dirname(__file__), "../rff/arc_songs.json")
    pack_json_path = os.path.join(os.path.dirname(__file__), "../rff/arc_packs.json")

    songs, music_packs = parse_songlist(html_path)

    # 保存本地 JSON
    with open(song_json_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    with open(pack_json_path, "w", encoding="utf-8") as f:
        json.dump(music_packs, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存本地 JSON 文件")

    # 上传到 LeanCloud
    save_to_leancloud_batch(songs)
