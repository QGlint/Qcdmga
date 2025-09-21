#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
parse_phigros_songs_cdn_slow.py

解析 Phigros HTML 页面，生成 songs.json，并通过萌娘百科 API 获取 CDN 缩略图 URL (304px)。
慢速请求，降低 MAX_WORKERS 并加 DELAY 避免被踢。
"""

import re
import json
import time
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import urllib.parse

WIKI_API = "https://mzh.moegirl.org.cn/api.php"
MAX_WORKERS = 10    # 降低并发
DELAY = 0           # 每次请求延迟 1 秒
RETRY = 1           # 重试次数

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/140.0.0.0 Safari/537.36"
}

def normalize_text(tag):
    if tag is None:
        return ""
    return " ".join(tag.get_text(" ", strip=True).split())

def get_cdn_url(file_name):
    """
    通过 API 获取 CDN URL。
    传入的 file_name 保持 URL 编码状态。
    """
    if not file_name:
        return None
    for attempt in range(RETRY):
        try:
            params = {
                "action": "query",
                "titles": f"File:{urllib.parse.unquote(file_name)}",  # API 请求需要转译
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json"
            }
            r = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=10, verify=False)
            r.raise_for_status()
            data = r.json()
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                iinfo = page.get("imageinfo")
                if iinfo and len(iinfo) > 0:
                    url = iinfo[0]["url"]
                    thumb_url = url.replace("/common/", "/common/thumb/")
                    
                    # 关键修改：拼接 /304px- 后使用未转译的文件名
                    thumb_url +=  f"/304px-{file_name}"
                    return thumb_url
        except Exception as e:
            print(f"⚠️ 获取 CDN URL 失败 {file_name}, 尝试 {attempt+1}/{RETRY}: {e}")
            time.sleep(DELAY)
    return None

def fetch_cover_urls(file_list):
    results = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_file = {executor.submit(get_cdn_url, f): f for f in file_list}
        for future in as_completed(future_to_file):
            file_name = future_to_file[future]
            try:
                results[file_name] = future.result()
            except Exception as e:
                print(f"⚠️ 线程获取失败 {file_name}: {e}")
                results[file_name] = None
            time.sleep(DELAY)
    return results

def parse_song_table(table):
    rows = table.find_all("tr")
    if not rows:
        return None, None, None

    name = normalize_text(rows[0])
    song = {
        "songName": name,
        "musicPack": None,
        "coverUrl": None,
        "difficulties": {}
    }

    file_name = None
    for tr in rows:
        tds = tr.find_all(["td", "th"])
        texts = [normalize_text(td) for td in tds]
        if not texts:
            continue
        if "所属章节" in texts[0]:
            song["musicPack"] = texts[-1]

        if texts[0] in ["EZ", "HD", "IN", "AT"] or re.match(r".*EZ.*|.*HD.*|.*IN.*|.*AT.*", texts[0]):
            diff = re.sub(r".*?(EZ|HD|IN|AT).*", r"\1", texts[0])
            if len(texts) >= 2:
                level = texts[1]
                song["difficulties"][diff] = level

        if file_name is None:
            a_tag = tr.find("a", href=True)
            if a_tag:
                # 这里只获取文件名，不进行解码
                m = re.search(r'/File:([^/]+)$', a_tag['href'])
                if m:
                    file_name = m.group(1)

    for d in ["EZ", "HD", "IN", "AT"]:
        if d not in song["difficulties"]:
            song["difficulties"][d] = "/"

    return song, song["musicPack"], file_name

def parse_html(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "lxml")
    tables = soup.find_all("table", class_=lambda c: c and "wikitable" in c)
    songs = []
    packs = set()
    file_map = {}
    for table in tables:
        song, pack, file_name = parse_song_table(table)
        if song:
            songs.append(song)
            if pack:
                packs.add(pack)
            if file_name:
                file_map[file_name] = song
    return songs, sorted(packs), file_map

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", "-i", default="./rff/Phigros_谱面信息 - 萌娘百科 万物皆可萌的百科全书.html")
    parser.add_argument("--songs", "-s", default="phi_songs.json")
    parser.add_argument("--packs", "-p", default="phi_packs.json")
    args = parser.parse_args()

    songs, packs, file_map = parse_html(args.html)

    print(f"开始获取 {len(file_map)} 个封面 CDN URL ...")
    cover_urls = fetch_cover_urls(list(file_map.keys()))
    for file_name, song in file_map.items():
        song["coverUrl"] = cover_urls.get(file_name)

    with open(args.songs, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    with open(args.packs, "w", encoding="utf-8") as f:
        json.dump(packs, f, ensure_ascii=False, indent=2)

    print(f"解析完成: {len(songs)} 首歌, {len(packs)} 个曲包")
    print(f"歌曲 JSON: {args.songs}")
    print(f"曲包 JSON: {args.packs}")

if __name__ == "__main__":
    main()