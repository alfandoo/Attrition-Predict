from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
import os
import re

app = Flask(__name__, static_folder="static", template_folder="templates")

# ====== LOAD MODEL ======
MODEL_PATH = os.path.join(os.path.dirname(__file__), "Random Forest_best_model.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# ====== MAPPINGS ======
department_map = {"Human Resources": 0, "Research & Development": 1, "Sales": 2}
environment_satisfaction_map = {"Very Dissatisfied": 1, "Dissatisfied": 2, "Satisfied": 3, "Very Satisfied": 4}
job_involvement_map = {"Low": 1, "Medium": 2, "High": 3, "Very High": 4}
job_level_map = {"Level 1": 1, "Level 2": 2, "Level 3": 3, "Level 4": 4, "Level 5": 5}
job_role_map = {
    "Healthcare Representative": 0, "Human Resources": 1, "Laboratory Technician": 2, "Manager": 3,
    "Manufacturing Director": 4, "Research Director": 5, "Research Scientist": 6,
    "Sales Executive": 7, "Sales Representative": 8
}
job_satisfaction_map = {"Very Dissatisfied": 1, "Dissatisfied": 2, "Satisfied": 3, "Very Satisfied": 4}
marital_status_map = {"Married": 0, "Single": 1, "Divorced": 2}
overtime_map = {"No": 0, "Yes": 1}
stock_option_level_map = {"Level 0": 0, "Level 1": 1, "Level 2": 2, "Level 3": 3}
work_life_balance_map = {"Bad": 1, "Good": 2, "Better": 3, "Best": 4}

CAT_MAPS = {
    "Department": department_map,
    "EnvironmentSatisfaction": environment_satisfaction_map,
    "JobInvolvement": job_involvement_map,
    "JobLevel": job_level_map,
    "JobRole": job_role_map,
    "JobSatisfaction": job_satisfaction_map,
    "MaritalStatus": marital_status_map,
    "OverTime": overtime_map,
    "StockOptionLevel": stock_option_level_map,
    "WorkLifeBalance": work_life_balance_map,
}

FEATURE_ORDER = [
    "Age","DailyRate","Department","DistanceFromHome","EnvironmentSatisfaction",
    "JobInvolvement","JobLevel","JobRole","JobSatisfaction","MaritalStatus",
    "MonthlyIncome","OverTime","StockOptionLevel","TotalWorkingYears",
    "TrainingTimesLastYear","WorkLifeBalance","YearsAtCompany",
    "YearsInCurrentRole","YearsWithCurrManager"
]
REQ_COLS = FEATURE_ORDER[:]

# kolom nama yang boleh dipakai di CSV / payload form
NAME_COL_CANDIDATES = ["NamaKaryawan", "Nama", "EmployeeName", "Name"]

# ====== HELPERS ======
ALLOWED_VALUES = {k: set(v.values()) for k, v in CAT_MAPS.items()}

def map_categorical(col: str, raw):
    """
    Terima: label persis, alias umum, 'Level X', atau kode angka valid untuk kolom kategorikal.
    Return: integer code sesuai mapping training.
    """
    if pd.isna(raw) or str(raw).strip() == "":
        raise ValueError(f"Kolom '{col}' kosong")

    s = str(raw).strip()
    mp = CAT_MAPS[col]

    # 1) label persis
    if s in mp:
        return mp[s]

    ls = s.lower()

    # 2) alias khusus
    if col == "Department":
        aliases = {
            "r&d": "Research & Development",
            "research & development": "Research & Development",
            "research and development": "Research & Development",
            "hr": "Human Resources",
        }
        if ls in aliases:
            return mp[aliases[ls]]

    if col in ("JobLevel", "StockOptionLevel"):
        m = re.match(r"level\s*([-+]?\d+)", ls)
        if m:
            try:
                num = int(m.group(1))
                if num in ALLOWED_VALUES[col]:
                    return num
            except:
                pass

    if col == "OverTime":
        if ls in ("yes", "y", "ya", "true", "1"):
            return 1
        if ls in ("no", "n", "tidak", "false", "0"):
            return 0

    if col == "MaritalStatus":
        ms_alias = {"menikah": "Married", "lajang": "Single", "cerai": "Divorced"}
        if ls in ms_alias:
            return mp[ms_alias[ls]]

    # 3) angka langsung, mis. "2", 2.0
    try:
        num = int(float(s))
        if num in ALLOWED_VALUES[col]:
            return num
    except:
        pass

    allowed_codes = sorted(ALLOWED_VALUES[col])
    raise ValueError(
        f"Nilai '{raw}' pada '{col}' tidak dikenal. "
        f"Gunakan label {list(mp.keys())} atau kode {allowed_codes}"
    )

def safe_int(v, colname):
    if pd.isna(v):
        raise ValueError(f"Kolom '{colname}' kosong")
    if isinstance(v, str):
        s = v.strip()
        if s == "":
            raise ValueError(f"Kolom '{colname}' kosong")
        s2 = s.replace(",", "").replace(" ", "")
        if s2.isdigit():
            return int(s2)
        try:
            return int(float(s.replace(",", ".")))
        except:
            pass
        raise ValueError(f"Nilai '{v}' pada kolom '{colname}' tidak valid (harus angka)")
    return int(float(v))

def encode_row(row_dict) -> np.ndarray:
    """
    Susun vektor fitur sesuai FEATURE_ORDER.
    Numerik -> safe_int, Kategorikal -> map_categorical.
    """
    ordered = []
    for col in FEATURE_ORDER:
        if col in CAT_MAPS:
            ordered.append(map_categorical(col, row_dict.get(col)))
        else:
            ordered.append(safe_int(row_dict.get(col), col))
    return np.array([ordered], dtype=np.float32)

def pick_name_from_row(row, name_col):
    if not name_col:
        return None
    val = row.get(name_col)
    return None if (pd.isna(val) or str(val).strip() == "") else str(val).strip()

def pick_name_from_payload(payload):
    for key in NAME_COL_CANDIDATES:
        if key in payload and str(payload[key]).strip():
            return str(payload[key]).strip()
    return None

# ====== ROUTES ======
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict_api", methods=["POST"])
def predict_api():
    data = request.get_json(force=True)
    payload = {k.strip(): v for k, v in data.items()}

    feats = encode_row(payload)
    proba = model.predict_proba(feats)[0]
    pred  = int(model.predict(feats)[0])
    confidence = round(float(max(proba)) * 100, 2)

    return jsonify({
        "success": True,
        "employee_name": pick_name_from_payload(payload),   # ikutkan nama jika ada
        "prediction": "Karyawan Mungkin Resign" if pred == 1 else "Karyawan Bertahan",
        "predicted_class": pred,
        "probability": {
            "bertahan": round(float(proba[0]) * 100, 2),
            "resign":   round(float(proba[1]) * 100, 2)
        },
        "confidence": f"{confidence}%"
    })

@app.route("/predict_csv", methods=["POST"])
def predict_csv():
    if "csvFile" not in request.files:
        return jsonify(success=False, message="Tidak ada file yang diupload"), 400

    file = request.files["csvFile"]
    if not file or file.filename == "":
        return jsonify(success=False, message="Silakan pilih file CSV"), 400

    try:
        df = pd.read_csv(file, encoding="utf-8-sig")
        df.columns = df.columns.str.strip()
        for c in df.select_dtypes(include=["object"]).columns:
            df[c] = df[c].astype(str).str.strip()

        # deteksi nama karyawan (opsional)
        name_col = next((c for c in NAME_COL_CANDIDATES if c in df.columns), None)

        # cek kolom wajib
        missing = [c for c in REQ_COLS if c not in df.columns]
        if missing:
            return jsonify(success=False,
                           message=f"Kolom wajib hilang: {missing}. Harus ada: {REQ_COLS}"), 400

        results = []
        for idx, row in df.iterrows():
            try:
                feats = encode_row(row.to_dict())
                proba = model.predict_proba(feats)[0]
                pred  = int(model.predict(feats)[0])
                confidence = round(float(max(proba)) * 100, 2)
                results.append({
                    "index": int(idx) + 1,
                    "employee_name": pick_name_from_row(row, name_col),
                    "prediction": "At Risk of Resignation" if pred == 1 else "Retained",
                    "probability": {
                        "bertahan": round(float(proba[0]) * 100, 2),
                        "resign":   round(float(proba[1]) * 100, 2)
                    },
                    "confidence": f"{confidence}%"
                })
            except Exception as row_err:
                results.append({
                    "index": int(idx) + 1,
                    "employee_name": pick_name_from_row(row, name_col),
                    "prediction": f"Error: {row_err}",
                    "probability": {"bertahan": 0, "resign": 0},
                    "confidence": "0%"
                })

        return jsonify(success=True, results=results)
    except Exception as e:
        return jsonify(success=False, message=f"Gagal memproses CSV: {e}"), 500

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=True)