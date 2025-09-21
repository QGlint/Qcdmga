import os
import re
import json
import requests
from bs4 import BeautifulSoup
import time
# ======================
# LeanCloud 配置
# ======================
APP_ID = "cDohc5rHqvsDFUFfHuu88vlh-gzGzoHsz"
APP_KEY = "uZ0PvgJAvH9tRHOzaHYHfLj8"
CLASS_NAME = "arcaea"

# ⚠️ 请根据控制台 REST API 地址修改
BASE_URL = "https://cdohc5rh.lc-cn-n1-shared.com/1.1"

HEADERS = {
    "X-LC-Id": APP_ID,
    "X-LC-Key": APP_KEY,
    "Content-Type": "application/json"
}


# ======================
# HTML 解析
# ======================
def parse_songlist(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, "lxml")
    table = soup.find("table", {"class": "wikitable sortable jquery-tablesorter"})
    if not table:
        raise RuntimeError("未找到曲目表格，请确认 HTML 文件是否正确。")

    songs = []
    diff_names = ["PST", "PRS", "FTR", "ETR", "BYD"]

    for row in table.find_all("tr")[1:]:
        cols = row.find_all("td")
        if not cols or len(cols) < 6:
            continue

        # 歌名
        title = cols[2].get_text(strip=True)

        # 曲包
        music_pack = cols[4].get_text(strip=True)

        # 曲绘链接
        cover_url = None
        cover_img = cols[1].find("img")
        if cover_img:
            src = cover_img.get("src", "")
            m = re.search(
                r'/images/(?:thumb/)?([0-9a-f]/[0-9a-f]{2}/[^/]+\.(?:jpg|jpeg|png|gif))',
                src
            )
            if m:
                cover_url = f"https://arcwiki.mcd.blue/images/{m.group(1)}"

        # 难度
        difficulties = {}
        for i, diff in enumerate(diff_names, start=9):
            val = "/"
            if i < len(cols):
                raw_val = cols[i].get_text(strip=True)
                if raw_val:
                    m = re.match(r"(\d+\+?)", raw_val)
                    val = m.group(1) if m else "/"
            difficulties[diff] = val

        songs.append({
            "songName": title,
            "coverUrl": cover_url,
            "musicPack": music_pack,
            "difficulties": difficulties
        })

    return songs


# ======================
# 批量存入 LeanCloud (REST API)
# ======================
def save_to_leancloud_batch(songs, batch_size=50, max_retries=3, retry_delay=2):
    BATCH_URL = f"{BASE_URL}/batch"
    requests_payload = []

    for song in songs:
        for diff_type, diff_value in song["difficulties"].items():
            obj = {
                "method": "POST",
                "path": f"/1.1/classes/{CLASS_NAME}",
                "body": {
                    "songName": song["songName"],
                    "coverUrl": song["coverUrl"] or "",
                    "musicPack": song["musicPack"],
                    "difficultyType": diff_type,
                    "difficultyValue": diff_value
                }
            }
            requests_payload.append(obj)

    print(f"准备批量保存 {len(requests_payload)} 条记录...")

    total_saved = 0
    for i in range(0, len(requests_payload), batch_size):
        batch = requests_payload[i:i+batch_size]

        for attempt in range(1, max_retries + 1):
            try:
                res = requests.post(
                    BATCH_URL,
                    headers=HEADERS,
                    data=json.dumps({"requests": batch}),
                    timeout=10,
                    verify=True  # 如网络有问题，可临时改为 False
                )

                if res.status_code != 200:
                    raise RuntimeError(f"批量保存失败: {res.status_code} {res.text}")

                results = res.json()
                errors = [r for r in results if "error" in r]
                if errors:
                    raise RuntimeError(f"批量保存部分失败: {errors}")

                total_saved += len(results)
                print(f"✅ 保存成功: {total_saved}/{len(requests_payload)} 条")
                break  # 本批次成功，跳出重试循环

            except requests.exceptions.SSLError as e:
                print(f"⚠️ SSL 错误，重试 {attempt}/{max_retries}... {e}")
                time.sleep(retry_delay)
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
    if not os.path.exists(html_path):
        raise FileNotFoundError(f"找不到 HTML 文件: {html_path}")

    songs = parse_songlist(html_path)
    print(f"共解析 {len(songs)} 首曲目")
    save_to_leancloud_batch(songs)
