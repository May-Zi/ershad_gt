
from . import bp
from app import db
import csv, io

from flask import render_template, request, jsonify, url_for, redirect, Response
from flask_login import login_user, login_required, logout_user, current_user

from app.models import User
from app.forms import RegistrationForm, LoginForm

"""
simple view functions that don't
have APIs related to them
"""

@bp.route('/')
def index():
    return render_template("home/index.html")

@bp.route('/wayfinding')
@login_required
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
Register / Login / Logout / 
"""

@bp.route("/register", methods = ["GET", "POST"])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username = form.username.data,
                    email = form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        return redirect(url_for("main.login"))
    return render_template("authentication/register.html", form=form)

@bp.route("/login", methods = ["GET", "POST"])
def login():
    #basically handle if the user is already logge in
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.index'))
        else:
            return redirect(url_for("main.login"))
    return render_template("authentication/login.html", form = form)

@bp.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.index"))

"""
the following defines the following functionality:
allow the user to edit a "corridor map" and later
export the csv based on the coordinates
"""

#this will serve the page where the mapping is stored
@bp.route('/mapping')
def mapView():
    return render_template('mapping/index.html')

#store each "red dot" as a tuple of three values
locations = []

#append each datapoint to "locations"
@bp.route('/add-location', methods=['POST'])
def addLocation():
    #assign the post json to a variable
    data = request.get_json()
    #as json is like a dictionary, assign it key to a variable
    time, x, y = data['time'], data['x'], data['y']
    locations.append((time, x, y))
    print(f"clicked on ({x}, {y}) after {time}s")
    print(f"full locations: {locations}")
    return jsonify({'status': 'ok'})

@bp.route("/export")
def exportCSV():
    file = io.StringIO()
    writer = csv.writer(file)
    #create the first row. manually added
    writer.writerow(['time', 'xAxis', 'yAxis'])
    #add the data. each tuple with 3 entries.
    writer.writerows(locations)
    locations.clear()
    return Response(
        file.getvalue(), mimetype="text/csv",
        headers = {"Content-Disposition": "attachment; filename: locations.csv"})