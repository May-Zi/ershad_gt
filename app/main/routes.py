
import os, csv, time
from flask import render_template, request, jsonify, send_file, url_for, redirect
from app.models import User
from app.forms import RegistrationForm, LoginForm

from uuid import uuid4
from flask_login import login_user, login_required, logout_user, current_user
from . import bp
from app import db

"""
simple view functions that don't
have APIs related to them
"""

@bp.route('/')
def index():
    return "<h1>Future homepage</h1>"

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
            return redirect(url_for("main.index"))
    return render_template("authentication/login.html", form = form)

@bp.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.index"))

"""
- defined an API for
"""

