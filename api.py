import os, traceback, sys, json, base64
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
from github import Github


app = Flask(__name__)
CORS(app)
g = Github(os.environ['GH_USER'],os.environ['GH_PWD'])
repo = g.get_repo("skiturer-norge/skiturer-norge.github.io")

@app.route('/',methods=['GET'])
def home():
    return('<h1>Personal API</h1>')

@app.route('/<path:file>',methods=['GET'])
def index(file):
    return(send_from_directory('.',file))

@app.route('/skiturer-norge/api/route/create',methods=['POST'])
def apiHandler():
    post = json.loads(request.get_data())
    fileSaveName = ''.join([i if i.isalnum() else '_' for i in post['name']])
    fileName = fileSaveName+'-'+os.urandom(3).hex()+'.gpx'
    path = os.path.join('ruter/user/',fileName)
    repo.create_file(path,'new route (web)',post['gpx'])
    routes = repo.get_contents('ruter/user_onload.txt')
    new_content = base64.b64decode(routes.content).decode('utf8')+fileName+'\n'
    repo.update_file(routes.path,'new route to list (web)',new_content,routes.sha)
    return jsonify({'success':'True'})

if __name__=='__main__':
    app.run(port=8000,debug=True)
