import urllib.request
import urllib.parse
import json
import time
import statistics
import os

BASE_URL = "http://localhost:4000/api/v1/rag/search"

def make_request(params):
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RAG-Integrity-Tester/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            elapsed_ms = (time.perf_counter() - start) * 1000
            data = json.loads(resp.read().decode('utf-8'))
            return {
                "status": resp.status,
                "elapsed_ms": elapsed_ms,
                "data": data,
                "url": url,
                "error": None
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.perf_counter() - start) * 1000
        try:
            body = json.loads(e.read().decode('utf-8'))
        except Exception:
            body = str(e)
        return {
            "status": e.code,
            "elapsed_ms": elapsed_ms,
            "data": body,
            "url": url,
            "error": str(e)
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return {
            "status": 0,
            "elapsed_ms": elapsed_ms,
            "data": None,
            "url": url,
            "error": str(e)
        }

print("=" * 85)
print("       REGULATORY RAG & KNOWLEDGE INTEGRITY TEST SUITE (38 CHUNKS)")
print("       Endpoint: http://localhost:4000/api/v1/rag/search")
print("=" * 85)

all_latencies = []

# ----------------------------------------------------------------------
# 1. UJI AKURASI REGULASI UTAMA (8 Kueri Regulasi Kunci)
# ----------------------------------------------------------------------
test_cases_utama = [
    {
        "id": "REG-UTAMA-01",
        "query": "Permenkes No. 16 Tahun 2019",
        "target_desc": "Permenkes 16/2019 (Anti-Fraud)",
        "check": lambda m: "16" in m.get("regulation", "") and "2019" in m.get("regulation", "")
    },
    {
        "id": "REG-UTAMA-02",
        "query": "Permenkes 3 Tahun 2023",
        "target_desc": "Permenkes 3/2023 (Koding/Kacamata/Tarif INA-CBG)",
        "check": lambda m: "3" in m.get("regulation", "") and "2023" in m.get("regulation", "")
    },
    {
        "id": "REG-UTAMA-03",
        "query": "UU 24 Tahun 2011",
        "target_desc": "UU 24/2011 (BPJS)",
        "check": lambda m: "24" in m.get("regulation", "") and "2011" in m.get("regulation", "")
    },
    {
        "id": "REG-UTAMA-04",
        "query": "KUHP 263",
        "target_desc": "KUHP Pasal 263 (Pemalsuan Surat & Identitas)",
        "check": lambda m: "263" in (m.get("article", "") + " " + m.get("title", ""))
    },
    {
        "id": "REG-UTAMA-05",
        "query": "Perpres 82 Tahun 2018",
        "target_desc": "Perpres 82/2018 (Suspensi Manfaat & Hak Jaminan)",
        "check": lambda m: "82" in m.get("regulation", "") and "2018" in m.get("regulation", "")
    },
    {
        "id": "REG-UTAMA-06",
        "query": "Perpres 59 Tahun 2024",
        "target_desc": "Perpres 59/2024 (Validasi Biometrik Wajah & NIK Tunggal)",
        "check": lambda m: "59" in m.get("regulation", "") and "2024" in m.get("regulation", "")
    },
    {
        "id": "REG-UTAMA-07",
        "query": "SE Menkes 1567/2024",
        "target_desc": "SE Menkes 1567/2024 (No RME, No Claim)",
        "check": lambda m: "1567" in m.get("regulation", "") or "1567" in m.get("title", "")
    },
    {
        "id": "REG-UTAMA-08",
        "query": "UU 27 Tahun 2022",
        "target_desc": "UU 27/2022 (Pelindungan Data Pribadi / PDP)",
        "check": lambda m: "27" in m.get("regulation", "") and "2022" in m.get("regulation", "")
    }
]

print("\n[BAGIAN 1] UJI AKURASI REGULASI UTAMA")
print("-" * 85)
p1_results = []

for tc in test_cases_utama:
    res = make_request({"query": tc["query"]})
    all_latencies.append(res["elapsed_ms"])
    matches = res.get("data", {}).get("data", []) if res.get("data") and isinstance(res["data"], dict) else []
    
    top_rank = -1
    for r, m in enumerate(matches):
        if tc["check"](m):
            top_rank = r + 1
            break
            
    is_top1 = (top_rank == 1)
    top_chunk = matches[0] if matches else None
    
    p1_results.append({
        "id": tc["id"],
        "query": tc["query"],
        "target": tc["target_desc"],
        "status": res["status"],
        "latency_ms": res["elapsed_ms"],
        "matches_count": len(matches),
        "rank": top_rank,
        "is_top1": is_top1,
        "top_id": top_chunk["id"] if top_chunk else None,
        "top_similarity": top_chunk["similarity"] if top_chunk else 0,
        "top_title": top_chunk["title"] if top_chunk else None,
        "top_reg": top_chunk["regulation"] if top_chunk else None,
        "top_art": top_chunk.get("article") if top_chunk else None
    })
    
    status_str = "PASS (Top-1)" if is_top1 else f"FAIL (Rank {top_rank})"
    sim_pct = (top_chunk["similarity"] * 100) if top_chunk else 0
    print(f" {tc['id']}: [{status_str}] \"{tc['query']}\"")
    print(f"       -> Target       : {tc['target_desc']}")
    print(f"       -> Hasil Teratas : [{top_chunk['id'] if top_chunk else 'None'}] {top_chunk['title'] if top_chunk else ''}")
    print(f"       -> Relevansi    : {sim_pct:.1f}% (Similarity: {top_chunk['similarity'] if top_chunk else 0:.4f})")
    print(f"       -> Response Time: {res['elapsed_ms']:.2f} ms")

# ----------------------------------------------------------------------
# 2. UJI KASUS KHUSUS / NATURAL LANGUAGE
# ----------------------------------------------------------------------
test_cases_nl = [
    {
        "id": "NL-01",
        "query": "aturan masa tunggu atau cooling-off kacamata berapa tahun",
        "expected_desc": "Aturan 2 tahun / 730 hari kacamata (REG-015)",
        "check": lambda m: m.get("id") == "REG-015" or ("2 tahun" in m.get("content", "").lower() and "kacamata" in m.get("title", "").lower())
    },
    {
        "id": "NL-02",
        "query": "sanksi bagi fasilitas kesehatan yang melakukan fraud fiktif",
        "expected_desc": "Sanksi Permenkes 16/2019 Pasal 6 (REG-024)",
        "check": lambda m: m.get("id") == "REG-024" or ("pasal 6" in m.get("article", "").lower() and "16/2019" in m.get("title", ""))
    },
    {
        "id": "NL-03",
        "query": "larangan menarik iuran tambahan balance billing",
        "expected_desc": "Permenkes 3/2023 Pasal 24 Balance Billing (REG-023)",
        "check": lambda m: m.get("id") == "REG-023" or ("pasal 24" in m.get("article", "").lower() and "3/2023" in m.get("title", ""))
    }
]

print("\n[BAGIAN 2] UJI KASUS KHUSUS / NATURAL LANGUAGE")
print("-" * 85)
p2_results = []
for tc in test_cases_nl:
    res = make_request({"query": tc["query"]})
    all_latencies.append(res["elapsed_ms"])
    matches = res.get("data", {}).get("data", []) if res.get("data") and isinstance(res["data"], dict) else []
    
    found_rank = -1
    found_chunk = None
    for r, m in enumerate(matches):
        if tc["check"](m):
            found_rank = r + 1
            found_chunk = m
            break
            
    is_present = (found_rank > 0)
    top_chunk = matches[0] if matches else None
    
    p2_results.append({
        "id": tc["id"],
        "query": tc["query"],
        "target": tc["expected_desc"],
        "status": res["status"],
        "latency_ms": res["elapsed_ms"],
        "matches_count": len(matches),
        "found_rank": found_rank,
        "is_present": is_present,
        "matched_id": found_chunk["id"] if found_chunk else None,
        "matched_similarity": found_chunk["similarity"] if found_chunk else 0,
        "matched_title": found_chunk["title"] if found_chunk else None,
        "top_id": top_chunk["id"] if top_chunk else None,
        "top_similarity": top_chunk["similarity"] if top_chunk else 0,
        "top_title": top_chunk["title"] if top_chunk else None
    })
    
    status_str = f"PASS (Rank {found_rank})" if is_present else "FAIL (Not Returned)"
    print(f" {tc['id']}: [{status_str}] \"{tc['query']}\"")
    print(f"       -> Target Regulasi : {tc['expected_desc']}")
    if found_chunk:
        print(f"       -> Posisi Ditemukan: Peringkat #{found_rank} dari {len(matches)} hasil (Sim: {found_chunk['similarity']:.4f})")
        print(f"       -> Judul Chunk     : [{found_chunk['id']}] {found_chunk['title']}")
    if top_chunk and top_chunk["id"] != (found_chunk["id"] if found_chunk else None):
        print(f"       -> Chunk Teratas #1: [{top_chunk['id']}] {top_chunk['title']} (Sim: {top_chunk['similarity']:.4f})")
    print(f"       -> Response Time   : {res['elapsed_ms']:.2f} ms")

# ----------------------------------------------------------------------
# 3. UJI FILTER KATEGORI (Category Partitioning & Isolation)
# ----------------------------------------------------------------------
filter_cases = [
    {
        "category": "DEFINISI_HUKUM",
        "query": "fraud kecurangan jkn",
        "desc": "Kategori DEFINISI_HUKUM"
    },
    {
        "category": "SANKSI_HUKUM",
        "query": "sanksi hukuman faskes pemutusan kerjasama",
        "desc": "Kategori SANKSI_HUKUM"
    },
    {
        "category": "TIPOLOGI_FRAUD",
        "query": "upcoding phantom billing unbundling",
        "desc": "Kategori TIPOLOGI_FRAUD"
    }
]

print("\n[BAGIAN 3] UJI FILTER KATEGORI")
print("-" * 85)
p3_results = []
for fc in filter_cases:
    res = make_request({"query": fc["query"], "category": fc["category"], "limit": 10})
    all_latencies.append(res["elapsed_ms"])
    matches = res.get("data", {}).get("data", []) if res.get("data") and isinstance(res["data"], dict) else []
    
    all_strictly_category = len(matches) > 0 and all(m.get("category") == fc["category"] for m in matches)
    passed = all_strictly_category
    
    p3_results.append({
        "category": fc["category"],
        "query": fc["query"],
        "status": res["status"],
        "latency_ms": res["elapsed_ms"],
        "total_matches": len(matches),
        "all_match_category": all_strictly_category,
        "passed": passed,
        "matched_ids": [m["id"] for m in matches]
    })
    
    status_str = "PASS (100% Terisolasi)" if passed else "FAIL"
    print(f" Filter '{fc['category']}': [{status_str}]")
    print(f"       -> Jumlah Hasil    : {len(matches)} chunk")
    print(f"       -> Seluruhnya Sesuai: {all_strictly_category}")
    print(f"       -> Daftar ID Chunk : {[m['id'] for m in matches]}")
    print(f"       -> Response Time   : {res['elapsed_ms']:.2f} ms")

# ----------------------------------------------------------------------
# 4. UJI KASUS EKSTREM (Boundary Testing & Zero Hallucination)
# ----------------------------------------------------------------------
extreme_cases = [
    {
        "name": "Kueri Kosong (Empty Query)",
        "params": {"query": ""},
        "expected_status": 422,
        "expected_code": "VALIDATION_ERROR",
        "desc": "Ditolak Zod validation (min 2 karakter)"
    },
    {
        "name": "Kueri 1 Karakter ('a')",
        "params": {"query": "a"},
        "expected_status": 422,
        "expected_code": "VALIDATION_ERROR",
        "desc": "Ditolak Zod validation (min 2 karakter)"
    },
    {
        "name": "Kueri Acak Tak Bermakna ('asdfghjkl12345')",
        "params": {"query": "asdfghjkl12345"},
        "expected_status": 200,
        "expected_count": 0,
        "desc": "0 matches (Anti-halusinasi)"
    }
]

print("\n[BAGIAN 4] UJI KASUS EKSTREM & INTEGRITAS BOUNDARY")
print("-" * 85)
p4_results = []
for ec in extreme_cases:
    res = make_request(ec["params"])
    all_latencies.append(res["elapsed_ms"])
    
    passed = False
    if ec["expected_status"] == 422:
        is_val_err = res.get("data", {}).get("error", {}).get("code") == ec["expected_code"]
        passed = (res["status"] == 422 and is_val_err)
    elif ec["expected_status"] == 200:
        matches = res.get("data", {}).get("data", [])
        passed = (res["status"] == 200 and len(matches) == ec["expected_count"])
        
    p4_results.append({
        "name": ec["name"],
        "params": ec["params"],
        "status": res["status"],
        "latency_ms": res["elapsed_ms"],
        "response": res["data"],
        "passed": passed
    })
    status_str = "PASS (Validasi Ketat & Anti-Halusinasi)" if passed else "FAIL"
    print(f" Kasus '{ec['name']}': [{status_str}] Status HTTP: {res['status']}")
    if res["status"] == 422:
        err_msg = res.get("data", {}).get("error", {}).get("message")
        print(f"       -> Alasan Penolakan: {err_msg}")
    else:
        print(f"       -> Jumlah Hasil    : {len(res.get('data', {}).get('data', []))} matches (Nol Halusinasi)")
    print(f"       -> Response Time   : {res['elapsed_ms']:.2f} ms")

# ----------------------------------------------------------------------
# 5. METRIK DAN REKAPITULASI
# ----------------------------------------------------------------------
top1_count_p1 = sum(1 for r in p1_results if r["is_top1"])
top1_acc_p1 = (top1_count_p1 / len(p1_results)) * 100
mrr_p1 = sum(1.0 / r["rank"] for r in p1_results if r["rank"] > 0) / len(p1_results)
recall_p2 = (sum(1 for r in p2_results if r["is_present"]) / len(p2_results)) * 100
cat_acc_p3 = (sum(1 for r in p3_results if r["passed"]) / len(p3_results)) * 100
ext_acc_p4 = (sum(1 for r in p4_results if r["passed"]) / len(p4_results)) * 100

lat_mean = statistics.mean(all_latencies)
lat_median = statistics.median(all_latencies)
lat_min = min(all_latencies)
lat_max = max(all_latencies)
sorted_lat = sorted(all_latencies)
lat_p95 = sorted_lat[int(len(sorted_lat) * 0.95)]

print("\n" + "=" * 85)
print("       REKAPITULASI METRIK EVALUASI AKURASI & PERFORMANSI")
print("=" * 85)
print(f"1. Akurasi Regulasi Utama (Top-1 Accuracy) : {top1_acc_p1:.1f}% ({top1_count_p1}/{len(p1_results)})")
print(f"   Mean Reciprocal Rank (MRR) Regulasi     : {mrr_p1:.4f}")
print(f"2. Natural Language Target Recall          : {recall_p2:.1f}% ({sum(1 for r in p2_results if r['is_present'])}/{len(p2_results)})")
print(f"3. Category Filter Precision / Isolation   : {cat_acc_p3:.1f}% ({sum(1 for r in p3_results if r['passed'])}/{len(p3_results)})")
print(f"4. Boundary & Anti-Hallucination Integrity : {ext_acc_p4:.1f}% ({sum(1 for r in p4_results if r['passed'])}/{len(p4_results)})")
print("-" * 85)
print(f"5. Response Time Rata-rata (Mean Latency)  : {lat_mean:.2f} ms")
print(f"   Median Response Time (P50)              : {lat_median:.2f} ms")
print(f"   95th Percentile Latency (P95)           : {lat_p95:.2f} ms")
print(f"   Fastest (Validation Guard / Fail-fast)  : {lat_min:.2f} ms")
print(f"   Longest (Cold Network Embedding Call)   : {lat_max:.2f} ms")
print("=" * 85)

# Save test report JSON
summary_file = r"C:\Users\arief\.gemini\antigravity\brain\6159cf92-9d3f-4af1-98b7-032b385942bf\scratch\rag_test_report.json"
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump({
        "metrics": {
            "top1_accuracy_percent": top1_acc_p1,
            "mrr": mrr_p1,
            "natural_language_recall_percent": recall_p2,
            "category_precision_percent": cat_acc_p3,
            "extreme_cases_percent": ext_acc_p4,
            "latency": {
                "mean_ms": round(lat_mean, 2),
                "median_ms": round(lat_median, 2),
                "p95_ms": round(lat_p95, 2),
                "min_ms": round(lat_min, 2),
                "max_ms": round(lat_max, 2)
            }
        },
        "details": {
            "part1_regulasi_utama": p1_results,
            "part2_kasus_khusus": p2_results,
            "part3_filter_kategori": p3_results,
            "part4_kasus_ekstrem": p4_results
        }
    }, f, indent=2)

print(f"Laporan terstruktur tersimpan di: {summary_file}")
