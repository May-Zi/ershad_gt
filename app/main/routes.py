
from flask import render_template, request, jsonify, send_file, redirect, url_for
import os, csv, time
from uuid import uuid4
from . import bp
from flask import current_app
from pathlib import Path

"""
simple view functions that don't
have APIs related to them
"""

@bp.route('/')
def index():
    return "<h1>Future homepage</h1>"

@bp.route('/wayfinding')
def wayfind():
    return render_template('wayfind/index.html')

"""
the following is responsible for the
IMU functionalities. They will be tested using
primarily JavaScript.
"""

@bp.route("/imu")
def imu():
    return "<h1>This is the IMU test page</h1>"

"""
Login / Logout / Register
"""

from app.models import User


"""

- defined an API for 
"""

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SESSIONS_DIR = BASE_DIR / "sessions"

@bp.route('/mapping/<int:map_id>')
def mapping(map_id):
    session_id = str(uuid4())
    start_time = time.time()

    csv_path = os.path.join(SESSIONS_DIR, f"{session_id}.csv")
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp_seconds', 'x_ratio', 'y_ratio'])

    return render_template("mapping/index.html", session_id=session_id, map_id=map_id, start_time=start_time)

@bp.route('/add_location', methods=['POST'])
def add_location():
    data = request.json
    session_id = data['session_id']
    timestamp = data['timestamp']
    x = data['x']
    y = data['y']

    csv_path = os.path.join(SESSIONS_DIR, f"{session_id}.csv")
    with open(csv_path, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([timestamp, x, y])

    return jsonify(success=True)

@bp.route('/download/<session_id>')
def download_csv(session_id):
    csv_path = SESSIONS_DIR / f"{session_id}.csv"

    if not os.path.isfile(csv_path):
        return f"❌ File not found: {csv_path}", 404

    return send_file(
        csv_path,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"map_{session_id}.csv"
    )

@bp.route('/export_csv/<session_id>/<int:map_id>')
def export_csv(session_id, map_id):
    csv_path = os.path.join(SESSIONS_DIR, f"{session_id}.csv")
    if not os.path.exists(csv_path):
        return "CSV not found", 404

    # Send file as attachment
    response = send_file(csv_path, mimetype='text/csv', as_attachment=True, download_name=f"map_{map_id}.csv")
    
    # After sending, redirect on client
    response.headers["X-Redirect-To"] = url_for('main.after_export', map_id=map_id, version=1)
    return response

@bp.route('/mapping/<int:map_id>/<int:version>/')
def after_export(map_id, version):
    session_id = request.args.get("session_id")
    return render_template("mapping/export.html", map_id=map_id, version=version, session_id=session_id)
