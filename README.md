Heart-Disease-AI-Analysis 

🫀A clinical-grade diagnostic intelligence system designed to evaluate cardiovascular risk factors using an Ensemble Machine Learning architecture. This project bridges the gap between raw patient data and actionable clinical insights through a high-performance web interface.

🚀 Key Features

Ensemble Intelligence: Leverages a weighted combination of XGBoost, Random Forest, and Logistic Regression models for high-accuracy predictions (83.4%).

Data Augmentation: Trained on the UCI Heart Disease dataset, supplemented with 500 synthetic records to enhance model robustness against edge cases.

Clinical Calibration Layer: Features a custom validation layer to ensure prediction accuracy for younger demographics (Age < 30).

Dynamic Visualizations: Real-time risk assessment via interactive gauges and feature-importance bar charts.

Automated Reporting: Generates comprehensive, printable PDF health summaries for clinical review.

🛠️ Technical Stack

Frontend: React 18, TypeScript, Tailwind CSS

Logic: Custom Machine Learning inference engine implemented in TypeScript

UI Components: Shadcn UI & Framer Motion for medical-grade aesthetics

📊 Methodology
The system processes 14 clinical features—including cholesterol levels, resting blood pressure, and ST-segment depression—through a multi-stage validation pipeline. By comparing outputs across three distinct model architectures, the system provides a "Consensus Score" that minimizes false positives in low-risk patients.

Developed by Anas Rahman | BTech CSE AI (1st Year Student)
