from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("home.html")

"""
avoid the need to always call:
flask run to reflect the changes
"""
if __name__ == "main":
    app.run(debug=True)