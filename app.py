from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
import collections
from sklearn.naive_bayes import GaussianNB
import numpy as np 
import pickle 
from sklearn.externals import joblib


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:password@localhost/vis_data"
db = SQLAlchemy(app)

#load naive bayes models for prediction tool
model_acute_bronchitis = joblib.load('data/acute_bronchitis.pkl')
model_asthma = joblib.load('data/asthma.pkl')
model_asthmatic_bronchitis = joblib.load('data/asthmatic_bronchitis.pkl')
model_aurti = joblib.load('data/aurti.pkl')
model_bronchitis = joblib.load('data/bronchitis.pkl')
model_pneumonia = joblib.load('data/pneumonia.pkl')

class AirHangzhou(db.Model):
	__tablename__ = "air_hangzhou"
	date = db.Column("date", db.DateTime, primary_key = True)
	aqi = db.Column("aqi_index", db.Integer)
	pm2_5 = db.Column("pm2_5", db.Integer)
	pm10 = db.Column("pm10", db.Integer)
	so2 = db.Column("so2", db.Integer)
	no2 = db.Column("no2", db.Integer)
	co = db.Column("co", db.Float)
	o3 = db.Column("o3", db.Integer)

class Disease(db.Model):
	__tablename__ = "disease"
	date = db.Column("date", db.DateTime, primary_key = True)
	region = db.Column("region", db.Integer, primary_key = True)
	acute_bronchitis = db.Column("acute_bronchitis", db.Integer)
	asthma = db.Column("asthma", db.Integer)
	asthmatic_bronchitis = db.Column("asthmatic_bronchitis", db.Integer)
	aurti = db.Column("aurti", db.Integer)
	bronchitis = db.Column("bronchitis", db.Integer)
	pneumonia = db.Column("pneumonia", db.Integer)

@app.route("/")
def main():
	return render_template('index.html')

@app.route("/datasets/air")
def datasets_air():
	dataset = AirHangzhou.query.all()
	objects_list = []
	for row in dataset:
		d = collections.OrderedDict()
		d['date'] = row.date.isoformat()
		d['aqi'] = row.aqi
		d['pm2_5'] = row.pm2_5
		d['pm10'] = row.pm10
		d['so2'] = row.so2
		d['no2'] = row.no2
		d['co'] = row.co
		d['o3'] = row.o3
		objects_list.append(d)
	air_hz = json.dumps(objects_list)
	return air_hz

@app.route("/datasets/disease")
def datasets():
	dataset = Disease.query.all()
	objects_list = []
	for row in dataset:
		d = collections.OrderedDict()
		d['date'] = row.date.isoformat()
		d['region'] = row.region
		d['acute_bronchitis'] = row.acute_bronchitis
		d['asthma'] = row.asthma
		d['asthmatic_bronchitis'] = row.asthmatic_bronchitis
		d['aurti'] = row.aurti
		d['bronchitis'] = row.bronchitis
		d['pneumonia'] = row.pneumonia
		objects_list.append(d)
	disease = json.dumps(objects_list)
	return disease

@app.route("/prediction/results")
def predict():
	input_aqi = request.args.get('input_aqi', 0, type = float)/272
	input_pm2_5 = request.args.get('input_pm2_5', 0, type = float)/224
	input_pm10 = request.args.get('input_pm10', 0, type = float)/283
	input_so2 = request.args.get('input_so2', 0, type = float)/36
	input_no2 = request.args.get('input_no2', 0, type = float)/110
	input_co = request.args.get('input_co', 0, type = float)/1.83
	input_o3 = request.args.get('input_o3', 0, type = float)/124
	input_list = [[input_aqi,input_pm2_5,input_pm10,input_so2,input_no2,input_co,input_o3]]

		
	output_acute_bronchitis = model_acute_bronchitis.predict(input_list)
	output_asthma = model_asthma.predict(input_list)
	output_asthmatic_bronchitis = model_asthmatic_bronchitis.predict(input_list)
	output_aurti = model_aurti.predict(input_list)
	output_bronchitis = model_bronchitis.predict(input_list)
	output_pneumonia = model_pneumonia.predict(input_list)

	prediction = collections.OrderedDict()
	prediction['acute_bronchitis'] = output_acute_bronchitis[0]
	prediction['asthma'] = output_asthma[0]
	prediction['asthmatic_bronchitis'] = output_asthmatic_bronchitis[0]
	prediction['aurti'] = output_aurti[0]
	prediction['bronchitis'] = output_bronchitis[0]
	prediction['pneumonia'] = output_pneumonia[0]

	return jsonify(prediction)

if __name__ == "__main__":
	app.run()