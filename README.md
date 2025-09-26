# 🧑‍💼 Employee Attrition Prediction

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)  
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-ML-orange?logo=scikitlearn)  
![Status](https://img.shields.io/badge/Build-Passing-brightgreen)  
![License](https://img.shields.io/badge/License-MIT-yellow)  
![Notebook](https://img.shields.io/badge/Jupyter-Notebook-orange?logo=jupyter)

This project aims to predict employee attrition (resignation risk) using machine learning models. High employee turnover is costly and impacts productivity. By predicting attrition early, HR teams can take proactive measures to retain key talent.

---

## 📌 Business Understanding

- **Problem**: Employee turnover is expensive and reduces overall productivity.
- **Objective**: Predict which employees are at risk of leaving the company so HR can intervene early with retention strategies.

---

## 🛠️ Libraries

The following Python libraries are used in this project:

- `pandas`, `numpy` → data manipulation
- `matplotlib`, `seaborn` → visualization
- `scikit-learn` → preprocessing, modeling, evaluation
- `imblearn (SMOTE)` → class balancing
- `xgboost` → advanced boosting model

---

## 📂 Data Understanding

- Dataset: **`employee.csv`**
- Total Records: **1470 employees**
- Features: **35 columns (26 numerical, 9 categorical)**
- No missing values or duplicates

**Attrition Distribution**:

- Stayed: **1233 employees (~84%)**
- Left: **237 employees (~16%)**

➡️ The dataset is **imbalanced**, requiring special handling (SMOTE).

---

## 📊 Exploratory Data Analysis (EDA)

- **Gender**: More males (~60%) with slightly higher attrition (~20%).
- **Education Field**: Most employees from _Life Sciences & Medical_, which also have the highest attrition counts. Marketing & Technical Degree fields show proportionally higher attrition rates.
- **Marital Status**: Most employees are _Married_.
- **Department**: _Research & Development_ employs the most people.
- **Job Role**: Sales and HR roles show higher attrition rates.

Outliers were detected in several features (e.g., `MonthlyIncome`, `TotalWorkingYears`) and handled using **IQR capping**.

Correlation analysis was performed, and only features significantly correlated with attrition were selected.

---

## ⚙️ Data Preprocessing

1. **Removed single-value columns**
2. **Label Encoding** categorical features
3. **Outlier Handling** with IQR capping
4. **SMOTE** applied to balance attrition classes
5. **Feature Scaling** using `StandardScaler`

---

## 🤖 Modeling

Several models were trained and tuned using **GridSearchCV**:

- Random Forest
- Logistic Regression
- Support Vector Machine (SVM)
- K-Nearest Neighbors (KNN)
- Gradient Boosting

**Hyperparameter tuning** was applied for each model.

---

## 📈 Evaluation Metrics

Models were evaluated using:

- Accuracy
- F1 Score
- ROC-AUC
- Cross-validation Score

**Random Forest & Gradient Boosting** performed the best overall, balancing accuracy and interpretability.

Feature importance from Random Forest highlighted:

- **OverTime**
- **MonthlyIncome**
- **Age**
- **TotalWorkingYears**
- **YearsAtCompany**

as the strongest predictors of attrition.

---

## 📊 Results Visualization

- Classification Reports & Confusion Matrices
- ROC-AUC comparisons
- Feature Importance plot
- Model Performance comparison bar chart (Accuracy, F1, AUC, CV Score)

---

## 💾 Model Saving

The best models were saved as `.pkl` files for deployment:

```bash
Random Forest → Random_Forest_best_model.pkl
Gradient Boosting → Gradient_Boosting_best_model.pkl
```
