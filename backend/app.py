from flask import Flask, request, jsonify, send_file, session
from auth_api import auth_bp
from flask_cors import CORS
from werkzeug.utils import secure_filename
from io import BytesIO
import os
import pandas as pd
import joblib

app = Flask(__name__)

app.secret_key = os.environ.get(
    "TRAFFICIQ_SECRET_KEY",
    "CHANGE-THIS-TO-A-LONG-RANDOM-SECRET"
)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_NAME"] = "trafficiq_session"

CORS(app, supports_credentials=True)
app.register_blueprint(auth_bp)

app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "traffic_congestion_final_model.pkl"
)

model = joblib.load(MODEL_PATH)

# Features required by the trained model
FEATURES = [
    "location_id",
    "traffic_volume",
    "avg_vehicle_speed",
    "vehicle_count_cars",
    "vehicle_count_trucks",
    "vehicle_count_bikes",
    "weather_condition",
    "temperature",
    "humidity",
    "accident_reported",
    "signal_status",
    "hour",
    "day_of_week",
    "is_weekend"
]


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({
        "error": "File too large. Maximum upload size is 20 MB."
    }), 413


@app.get("/")
def home():
    return jsonify({
        "message": "Traffic Congestion Prediction API is running!"
    })


def load_csv(upload):
    if upload is None or not upload.filename:
        raise ValueError("Please select a CSV file.")

    filename = secure_filename(upload.filename)

    if not filename.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")

    try:
        df = pd.read_csv(upload)
    except Exception as exc:
        raise ValueError(f"Could not read the CSV file: {exc}")

    if df.empty:
        raise ValueError("The uploaded CSV is empty.")

    if len(df) > 50000:
        raise ValueError("Maximum 50,000 rows per upload.")

    # congestion_level is optional.
    # The model predicts this column; it is not a required input.
    missing = [col for col in FEATURES if col not in df.columns]

    if missing:
        raise ValueError(
            "Missing required model columns: " + ", ".join(missing)
        )

    # Check missing values only in model input features.
    null_columns = df[FEATURES].columns[
        df[FEATURES].isnull().any()
    ].tolist()

    if null_columns:
        raise ValueError(
            "Missing values in required features: "
            + ", ".join(null_columns)
        )

    return df


def predict_dataset(df):
    # Use only the trained model's input features.
    # Do not pass congestion_level or other extra columns to the model.
    X = df[FEATURES].copy()

    predictions = model.predict(X)

    result_df = df.copy()
    result_df["predicted_congestion_level"] = [
        str(prediction) for prediction in predictions
    ]

    return result_df


@app.post("/api/predict")
def predict():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Send prediction inputs as JSON."
            }), 400

        missing = [feature for feature in FEATURES if feature not in data]

        if missing:
            return jsonify({
                "error": "Missing required features.",
                "missing_features": missing
            }), 400

        row = pd.DataFrame([
            {feature: data[feature] for feature in FEATURES}
        ])

        result = model.predict(row)[0]

        return jsonify({
            "predicted_congestion_level": str(result)
        })

    except Exception as exc:
        app.logger.exception("Prediction failed")

        return jsonify({
            "error": str(exc)
        }), 400


@app.post("/api/analyze-dataset")
def analyze_dataset():
    try:
        upload = request.files.get("file")
        df = load_csv(upload)

        result_df = predict_dataset(df)

        counts = (
            result_df["predicted_congestion_level"]
            .value_counts()
            .to_dict()
        )

        preview_df = result_df.head(10).astype(object)
        preview_df = preview_df.where(
            pd.notna(preview_df), None
        )

        return jsonify({
            "message": "Dataset analyzed successfully.",
            "filename": secure_filename(upload.filename),
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
            "prediction_counts": {
                str(key): int(value)
                for key, value in counts.items()
            },
            "columns": list(result_df.columns),
            "preview": preview_df.to_dict(orient="records")
        })

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception as exc:
        app.logger.exception("Dataset analysis failed")

        return jsonify({
            "error": "Could not analyze this CSV.",
            "details": str(exc)
        }), 500


@app.post("/api/download-analyzed-dataset")
def download_dataset():
    try:
        upload = request.files.get("file")
        df = load_csv(upload)

        result_df = predict_dataset(df)

        output = BytesIO()
        result_df.to_csv(output, index=False)
        output.seek(0)

        return send_file(
            output,
            mimetype="text/csv",
            as_attachment=True,
            download_name="traffic_congestion_predictions.csv"
        )

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    except Exception as exc:
        app.logger.exception("CSV export failed")

        return jsonify({
            "error": "Could not create prediction CSV.",
            "details": str(exc)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )