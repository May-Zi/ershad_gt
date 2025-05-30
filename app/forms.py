from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Email, EqualTo

class RegistrationForm(FlaskForm):
  username = StringField('Username', validators=[DataRequired()])
  email=StringField('Email',validators=[DataRequired(), Email()])
  password=PasswordField('Password',validators=[DataRequired()])
  password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
  submit = SubmitField('Register')

class LoginForm(FlaskForm):
  email = StringField("Email", validators = [DataRequired(), Email()])
  passworkd = PasswordField("Passowrd", validators=[DataRequired()])
  remember = BooleanField("Remember Me")
  submit = SubmitField("Login")